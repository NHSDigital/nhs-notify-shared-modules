const { handler } = require('../index.ts');
const { mockClient } = require('aws-sdk-client-mock');
const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');
const { EventBridgeClient, PutEventsCommand } = require('@aws-sdk/client-eventbridge');

const eventBridgeMock = mockClient(EventBridgeClient);
const sqsMock = mockClient(SQSClient);

const snsEvent = {
  Records: [
      { Sns: { Message: JSON.stringify({ type: 'data', version: 1, source: 'mock', message: 'test' }) } }
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

        await handler(snsEvent);

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

      const startTime = Date.now();
      const handlerPromise = handler(snsEvent);
      jest.advanceTimersByTime(500);
      await handlerPromise;
      const endTime = Date.now();

      expect(endTime - startTime).toBeGreaterThanOrEqual(500);
      jest.useRealTimers();
  });
});
