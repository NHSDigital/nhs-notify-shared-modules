const { handler } = require('../index.js');
const { mockClient } = require('aws-sdk-client-mock');
const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');
const { EventBridgeClient, PutEventsCommand } = require('@aws-sdk/client-eventbridge');

const eventBridgeMock = mockClient(EventBridgeClient);
const sqsMock = mockClient(SQSClient);

const validCloudEvent = {
  id: "123e4567-e89b-12d3-a456-426614174000",
  source: "mock",
  specversion: "1.0",
  type: "data",
  subject: "123e4567-e89b-12d3-a456-426614174001",
  time: "2024-01-01T00:00:00Z",
  datacontenttype: "application/json",
  dataschema: "https://notify.nhs.uk/events/schemas/supplier-status/v1.json",
  dataschemaversion: "1.0",
  data: {
    nhsNumber: "1234567890",
    delayedFallback: false,
    sendingGroupId: "group-1",
    clientId: "client-1",
    campaignId: "campaign-1",
    supplierStatus: "active",
    previousSupplierStatus: "inactive"
  }
};

const invalidCloudEvent = {
  // missing required fields
  type: "data",
  data: {}
};

const DATA_TOPIC_ARN = 'arn:aws:sns:eu-west-2:123456789012:data-topic';
const CONTROL_TOPIC_ARN = 'arn:aws:sns:eu-west-2:123456789012:control-topic';
const DATA_PLANE_EVENT_BUS_ARN = 'arn:aws:events:eu-west-2:123456789012:event-bus/data';
const CONTROL_PLANE_EVENT_BUS_ARN = 'arn:aws:events:eu-west-2:123456789012:event-bus/control';
const DLQ_URL = 'https://sqs.eu-west-2.amazonaws.com/123456789012/dlq';

const snsEvent = {
  Records: [
    { Sns: { Message: JSON.stringify(validCloudEvent), TopicArn: DATA_TOPIC_ARN } }
  ]
};

const snsEventInvalid = {
  Records: [
    { Sns: { Message: JSON.stringify(invalidCloudEvent), TopicArn: DATA_TOPIC_ARN } }
  ]
};

describe('SNS to EventBridge Lambda', () => {
    beforeEach(() => {
        eventBridgeMock.reset();
        sqsMock.reset();
        process.env.DATA_TOPIC_ARN = DATA_TOPIC_ARN;
        process.env.CONTROL_TOPIC_ARN = CONTROL_TOPIC_ARN;
        process.env.DATA_PLANE_EVENT_BUS_ARN = DATA_PLANE_EVENT_BUS_ARN;
        process.env.CONTROL_PLANE_EVENT_BUS_ARN = CONTROL_PLANE_EVENT_BUS_ARN;
        process.env.DLQ_URL = DLQ_URL;
        process.env.THROTTLE_DELAY_MS = '0';
    });

    test('Valid event is sent to the correct EventBridge bus', async () => {
        eventBridgeMock.on(PutEventsCommand).resolves({ FailedEntryCount: 0, Entries: [{}] });

        await handler(snsEvent);

        expect(eventBridgeMock.calls()).toHaveLength(1);
        // Check correct bus
        const callInput = eventBridgeMock.calls()[0].args[0].input;
        expect(callInput.Entries[0].EventBusName).toBe(DATA_PLANE_EVENT_BUS_ARN);
    });

    test('Invalid event is sent to DLQ', async () => {
        sqsMock.on(SendMessageCommand).resolves({ MessageId: '123' });

        await handler(snsEventInvalid);

        expect(sqsMock.calls()).toHaveLength(1);
        const callInput = sqsMock.calls()[0].args[0].input;
        expect(callInput.QueueUrl).toBe(DLQ_URL);
    });

    test('Retries on EventBridge failure and sends failed events to DLQ', async () => {
      eventBridgeMock
          .on(PutEventsCommand)
          .rejectsOnce(Object.assign(new Error('Rate limit exceeded'), { retryable: true }))
          .resolves({ FailedEntryCount: 1, Entries: [{ ErrorCode: 'InternalFailure' }] });
      sqsMock.on(SendMessageCommand).resolves({ MessageId: '123' });

      await handler(snsEvent);

      expect(eventBridgeMock.calls()).toHaveLength(2);
      expect(sqsMock.calls()).toHaveLength(1);
    });

    test('Throttling delays event processing', async () => {
      process.env.THROTTLE_DELAY_MS = '500';
      jest.useFakeTimers();

      eventBridgeMock.on(PutEventsCommand).resolves({ FailedEntryCount: 0, Entries: [{}] });

      const handlerPromise = handler(snsEvent);
      expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 500);
      jest.advanceTimersByTime(500);
      await handlerPromise;

      jest.useRealTimers();
    });

    test('Routes control events to control event bus', async () => {
      const controlEvent = {
        ...validCloudEvent,
        type: "control"
      };
      const snsEventControl = {
        Records: [
          { Sns: { Message: JSON.stringify(controlEvent), TopicArn: CONTROL_TOPIC_ARN } }
        ]
      };
      eventBridgeMock.on(PutEventsCommand).resolves({ FailedEntryCount: 0, Entries: [{}] });

      await handler(snsEventControl);

      expect(eventBridgeMock.calls()).toHaveLength(1);
      const callInput = eventBridgeMock.calls()[0].args[0].input;
      expect(callInput.Entries[0].EventBusName).toBe(CONTROL_PLANE_EVENT_BUS_ARN);
    });
});
