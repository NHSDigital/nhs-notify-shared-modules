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
  type: "uk.nhs.notify.supplier-api.letter.ACCEPTED.v1",
  plane: "data",
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

const snsEvent = {
  Records: [
    { Sns: { Message: JSON.stringify(validCloudEvent) } }
  ]
};

const snsEventInvalid = {
  Records: [
    { Sns: { Message: JSON.stringify(invalidCloudEvent) } }
  ]
};

describe('SNS to EventBridge Lambda', () => {
    beforeEach(() => {
        eventBridgeMock.reset();
        sqsMock.reset();
    });

    test('Valid event is sent to the correct EventBridge bus', async () => {
        eventBridgeMock.on(PutEventsCommand).resolves({ FailedEntryCount: 0, Entries: [{}] });

        await handler(snsEvent);

        expect(eventBridgeMock.calls()).toHaveLength(1);
    });

    test('Invalid event is sent to DLQ', async () => {
        sqsMock.on(SendMessageCommand).resolves({ MessageId: '123' });

        await handler(snsEventInvalid);

        expect(sqsMock.calls()).toHaveLength(1);
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

      const handlerPromise = handler(snsEvent);
      jest.advanceTimersByTime(500);
      await handlerPromise;

      jest.useRealTimers();
    });
});
