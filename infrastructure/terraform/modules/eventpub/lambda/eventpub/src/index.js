const { EventBridgeClient, PutEventsCommand } = require('@aws-sdk/client-eventbridge');
const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');

const eventBridge = new EventBridgeClient({});
const sqs = new SQSClient({});

const DATA_PLANE_EVENT_BUS_ARN = process.env.DATA_PLANE_EVENT_BUS_ARN;
const CONTROL_PLANE_EVENT_BUS_ARN = process.env.CONTROL_PLANE_EVENT_BUS_ARN;
const DLQ_URL = process.env.DLQ_URL;
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
            DetailType: event.type,
            Detail: JSON.stringify(event),
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
                    console.error(`Non-retryable error encountered. Moving ${batch.length} events to DLQ`);
                    failedEvents.push(...batch);
                    break;
                }
            }
        }
    }
    return failedEvents;
}

async function sendToDLQ(events) {
  if (events.length === 0) return;

  console.warn(`Sending ${events.length} failed event(s) to DLQ: ${DLQ_URL}`);

  for (const event of events) {
        try {
            await sqs.send(new SendMessageCommand({ QueueUrl: DLQ_URL, MessageBody: JSON.stringify(event) }));
            console.debug(`Successfully sent event ${event.id} to DLQ`);
        } catch (error) {
            console.error(`Failed to send event ${event.id} to DLQ - Name: ${error.name}, Message: ${error.message}, Code: ${error.$metadata?.httpStatusCode}, RequestId: ${error.$metadata?.requestId}`);
        }
    }
}

exports.handler = async (snsEvent) => {
    console.debug(`Received SNS event with ${snsEvent.Records.length} records.`);

    if (THROTTLE_DELAY_MS > 0) {
        console.info(`Throttling enabled. Delaying processing by ${THROTTLE_DELAY_MS}ms`);
        await new Promise(res => setTimeout(res, THROTTLE_DELAY_MS));
    }

    const records = snsEvent.Records.map(record => JSON.parse(record.Sns.Message));
    const validEvents = records.filter(validateEvent);
    const invalidEvents = records.filter(event => !validateEvent(event));

    console.debug(`Valid events: ${validEvents.length}, Invalid events: ${invalidEvents.length}`);
    if (invalidEvents.length) {
        console.warn(`${invalidEvents.length} event(s) failed validation and will be sent to DLQ`);
        await sendToDLQ(invalidEvents);
    }

    const dataEvents = validEvents.filter(event => event.plane === 'data');
    const controlEvents = validEvents.filter(event => event.plane === 'control');

    console.debug(`Data events: ${dataEvents.length}, Control events: ${controlEvents.length}`);

    const failedDataEvents = await sendToEventBridge(dataEvents, DATA_PLANE_EVENT_BUS_ARN);
    const failedControlEvents = await sendToEventBridge(controlEvents, CONTROL_PLANE_EVENT_BUS_ARN);

    await sendToDLQ([...failedDataEvents, ...failedControlEvents]);
};
