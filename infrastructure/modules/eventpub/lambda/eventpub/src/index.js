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
  // Test Event
  // {
  //   "type":"data",
  //   "version":"0.1",
  //   "source":"manual",
  //   "detailtype":"testEvent",
  //   "message":"Hello World"
  // }
      const requiredFields = ['type', 'version', 'source', 'message'];
      return requiredFields.every(field => event.hasOwnProperty(field));
  }

  async function sendToEventBridge(events, eventBusArn) {
      // console.info(`Sending ${events.length} events to EventBridge: ${eventBusArn}`);

      const failedEvents = [];
      for (let i = 0; i < events.length; i += EVENTBRIDGE_MAX_BATCH_SIZE) {
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
                  // console.info(`Attempt ${attempts + 1}: Sending batch of ${entries.length} events.`);

                  const response = await eventBridge.send(new PutEventsCommand({ Entries: entries }));
                  response.FailedEntryCount && response.Entries.forEach((entry, idx) => {
                      if (entry.ErrorCode) {
                          console.warn(`Event failed with error: ${entry.ErrorCode}`);
                          failedEvents.push(batch[idx]);
                      }
                  });
                  break;
              } catch (error) {
                  console.error(`EventBridge send error: ${error}`);

                  if (error.retryable) {
                      console.warn(`Retrying after backoff: attempt ${attempts + 1}`);
                      await new Promise(res => setTimeout(res, 2 ** attempts * 100));
                      attempts++;
                  } else {
                      failedEvents.push(...batch);
                      break;
                  }
              }
          }
      }
      return failedEvents;
  }

  async function sendToDLQ(events) {
      console.warn(`Sending ${events.length} failed events to DLQ`);

      for (const event of events) {
          await sqs.send(new SendMessageCommand({ QueueUrl: DLQ_URL, MessageBody: JSON.stringify(event) }));
      }
  }

  exports.handler = async (snsEvent) => {
      // console.info(`Received SNS event with ${snsEvent.Records.length} records.`);

      if (THROTTLE_DELAY_MS > 0) {
          console.info(`Throttling enabled. Delaying processing by ${THROTTLE_DELAY_MS}ms`);
          await new Promise(res => setTimeout(res, THROTTLE_DELAY_MS));
      }

      const records = snsEvent.Records.map(record => JSON.parse(record.Sns.Message));
      const validEvents = records.filter(validateEvent);
      const invalidEvents = records.filter(event => !validateEvent(event));

      // console.info(`Valid events: ${validEvents.length}, Invalid events: ${invalidEvents.length}`);

      if (invalidEvents.length) await sendToDLQ(invalidEvents);

      const dataEvents = validEvents.filter(event => event.type === 'data');
      const controlEvents = validEvents.filter(event => event.type === 'control');

      // console.info(`Data events: ${dataEvents.length}, Control events: ${controlEvents.length}`);

      const failedDataEvents = await sendToEventBridge(dataEvents, DATA_PLANE_EVENT_BUS_ARN);
      const failedControlEvents = await sendToEventBridge(controlEvents, CONTROL_PLANE_EVENT_BUS_ARN);

      await sendToDLQ([...failedDataEvents, ...failedControlEvents]);
  };
