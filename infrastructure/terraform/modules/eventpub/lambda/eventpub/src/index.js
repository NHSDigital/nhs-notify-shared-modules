const { EventBridgeClient, PutEventsCommand } = require('@aws-sdk/client-eventbridge');

const eventBridge = new EventBridgeClient({});

const DATA_PLANE_EVENT_BUS_ARN = process.env.DATA_PLANE_EVENT_BUS_ARN;
const CONTROL_PLANE_EVENT_BUS_ARN = process.env.CONTROL_PLANE_EVENT_BUS_ARN;
const THROTTLE_DELAY_MS = parseInt(process.env.THROTTLE_DELAY_MS || '0', 10);
const MAX_RETRIES = 3;
const EVENTBRIDGE_MAX_BATCH_SIZE = 10;

function validateEvent(event) {
    // CloudEvents v1.0 schema validation (supplier-status)
    const requiredFields = [
        'id',
        'source',
        'specversion',
        'type',
        'plane',
        'subject',
        'time',
        'datacontenttype',
        'dataschema',
        'dataschemaversion',
        'data'
    ];
    // Check top-level required fields
    const missingFields = requiredFields.filter(field => !event.hasOwnProperty(field));

    if (missingFields.length > 0) {
        console.error(`Event validation failed. Missing required fields: ${missingFields.join(', ')}. EventID: ${event.id || 'unknown'}, EventType: ${event.type || 'unknown'}`);
        return false;
    }
    return true;
}

async function sendToEventBridge(events, eventBusArn) {
  const failedEvents = [];

  for (let i = 0; i < events.length; i += EVENTBRIDGE_MAX_BATCH_SIZE) {
        console.debug(`Sending ${events.length} events to EventBridge: ${eventBusArn}`);
        const batch = events.slice(i, i + EVENTBRIDGE_MAX_BATCH_SIZE);
        const entries = batch.map(event => ({
            Source: 'custom.event',
            DetailType: event.message.type,
            Detail: JSON.stringify(event.message),
            EventBusName: eventBusArn
        }));

        let attempts = 0;
        while (attempts < MAX_RETRIES) {
            try {
                console.debug(`Attempt ${attempts + 1}: Sending batch of ${entries.length} events.`);

                const response = await eventBridge.send(new PutEventsCommand({ Entries: entries }));
                response.FailedEntryCount && response.Entries.forEach((entry, idx) => {
                    if (entry.ErrorCode) {
                        console.error(`Event failed to send to EventBridge. ErrorCode: ${entry.ErrorCode}, ErrorMessage: ${entry.ErrorMessage}, EventID: ${batch[idx].id}, EventType: ${batch[idx].type}`);
                        failedEvents.push(batch[idx]);
                    }
                });
                break;
            } catch (error) {
                console.error(`EventBridge send error: ${error.name}, Message: ${error.message}, Code: ${error.$metadata?.httpStatusCode}, RequestId: ${error.$metadata?.requestId}`);

                if (error.retryable) {
                    console.warn(`Retrying after backoff: attempt ${attempts + 1}`);
                    await new Promise(res => setTimeout(res, 2 ** attempts * 100));
                    attempts++;
                } else {
                    console.error(`Non-retryable error encountered. Reporting ${batch.length} as batch item failures`);
                    failedEvents.push(...batch.map(event => ({ itemIdentifier: event.itemIdentifier })));
                    break;
                }
            }
        }
    }
    return failedEvents;
}

exports.handler = async (sqsEvent) => {
    console.debug(`Received SQS event with ${sqsEvent.Records.length} records.`);

    if (THROTTLE_DELAY_MS > 0) {
        console.info(`Throttling enabled. Delaying processing by ${THROTTLE_DELAY_MS}ms`);
        await new Promise(res => setTimeout(res, THROTTLE_DELAY_MS));
    }

    const dataPlaneEvents = [];
    const controlPlaneEvents = [];
    const batchItemFailures = [];

    for(const sqsRecord of sqsEvent.Records) {
        const record = JSON.parse(sqsRecord.body);
        const message = JSON.parse(record.Message);

        if (!validateEvent(message)) {
            console.error(`Invalid event received. EventID: ${message.id || 'unknown'}, EventType: ${message.type || 'unknown'}`);
            batchItemFailures.push({ itemIdentifier: sqsRecord.messageId });
        }
        else if (message.plane === 'data') {
            dataPlaneEvents.push({ itemIdentifier: sqsRecord.messageId, message: message });
        }
        else if (message.plane === 'control') {
            controlPlaneEvents.push({ itemIdentifier: sqsRecord.messageId, message: message });
        }
        else {
            console.error(`Unknown plane type received: ${message.plane}. EventID: ${message.id || 'unknown'}, EventType: ${message.type || 'unknown'}`);
            batchItemFailures.push({ itemIdentifier: sqsRecord.messageId });
        }
    }

    console.debug(`Data events: ${dataPlaneEvents.length}, Control events: ${controlPlaneEvents.length}, Unknown events: ${batchItemFailures.length}`);

    batchItemFailures.push(...await sendToEventBridge(dataPlaneEvents, DATA_PLANE_EVENT_BUS_ARN));
    batchItemFailures.push(...await sendToEventBridge(controlPlaneEvents, CONTROL_PLANE_EVENT_BUS_ARN));

    return {
        batchItemFailures: batchItemFailures
    };
};
