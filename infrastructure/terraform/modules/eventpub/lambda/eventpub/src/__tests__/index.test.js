const { handler } = require('../index.js');
const { mockClient } = require('aws-sdk-client-mock');
const { EventBridgeClient, PutEventsCommand } = require('@aws-sdk/client-eventbridge');

const eventBridgeMock = mockClient(EventBridgeClient);

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

const sqsEvent = {
  Records: [
    {
      messageId: 'msg-1',
      body: JSON.stringify({ Message: JSON.stringify(validCloudEvent) })
    }
  ]
};

const sqsEventInvalid = {
  Records: [
    {
      messageId: 'msg-1',
      body: JSON.stringify({ Message: JSON.stringify(invalidCloudEvent) })
    }
  ]
};

describe('SQS to EventBridge Lambda', () => {
    beforeEach(() => {
        eventBridgeMock.reset();
    });

    test('Valid event is sent to the correct EventBridge bus', async () => {
        eventBridgeMock.on(PutEventsCommand).resolves({ FailedEntryCount: 0, Entries: [{}] });

        const result = await handler(sqsEvent);

        expect(eventBridgeMock.calls()).toHaveLength(1);
        expect(result.batchItemFailures).toHaveLength(0);
    });

    test('Invalid event is reported as a batch item failure', async () => {
        const result = await handler(sqsEventInvalid);

        expect(eventBridgeMock.calls()).toHaveLength(0);
        expect(result.batchItemFailures).toHaveLength(1);
        expect(result.batchItemFailures[0].itemIdentifier).toBe('msg-1');
    });

    test('Event with unknown plane field is reported as a batch item failure', async () => {
        const eventUnknownPlane = { ...validCloudEvent, plane: "unknown" };

        const sqsEventUnknownPlane = {
            Records: [
                {
                    messageId: 'msg-1',
                    body: JSON.stringify({ Message: JSON.stringify(eventUnknownPlane) })
                }
            ]
        };

        const result = await handler(sqsEventUnknownPlane);

        expect(result.batchItemFailures).toHaveLength(1);
        expect(result.batchItemFailures[0].itemIdentifier).toBe('msg-1');
    });

    test('Retries on EventBridge failure and reports failed events as batch item failures', async () => {
      eventBridgeMock
          .on(PutEventsCommand)
          .rejectsOnce(Object.assign(new Error('Rate limit exceeded'), { retryable: true }))
          .resolves({ FailedEntryCount: 1, Entries: [{ ErrorCode: 'InternalFailure' }] });

      const result = await handler(sqsEvent);

      expect(eventBridgeMock.calls()).toHaveLength(2);
      expect(result.batchItemFailures).toHaveLength(1);
    });

    test('Throttling delays event processing', async () => {
      process.env.THROTTLE_DELAY_MS = '500';
      jest.useFakeTimers();

      eventBridgeMock.on(PutEventsCommand).resolves({ FailedEntryCount: 0, Entries: [{}] });

      const handlerPromise = handler(sqsEvent);
      jest.advanceTimersByTime(500);
      await handlerPromise;

      jest.useRealTimers();
    });
});
