const { EventBridgeClient, PutEventsCommand } = require('@aws-sdk/client-eventbridge');
const eventBridgeClient = new EventBridgeClient();

exports.handler = async (event) => {
  try {
    const controlEventBusArn = process.env.CONTROL_PLANE_EVENT_BUS_ARN;
    const dataEventBusArn = process.env.DATA_PLANE_EVENT_BUS_ARN;

    if (!event.Records || !Array.isArray(event.Records)) {
      throw new Error("Invalid event format. Expected an array of records.");
    }

    const batchSize = 10; // AWS EventBridge allows up to 10 entries per PutEvents request
    const entries = [];

    for (const record of event.Records) {
      try {
        const snsMessage = JSON.parse(record.Sns.Message);
        if (!validateEvent(snsMessage)) {
          throw new Error("Invalid event structure");
        }
        entries.push({
          Source: snsMessage.Source,
          DetailType: snsMessage.DetailType,
          Detail: JSON.stringify({ message: snsMessage.Message }),
          EventBusName: snsMessage.Type === 'control' ? controlEventBusArn : dataEventBusArn
        });
      } catch (err) {
        console.error("Event validation failed", err);
      }
    }

    for (let i = 0; i < entries.length; i += batchSize) {
      const batch = entries.slice(i, i + batchSize);
      const command = new PutEventsCommand({ Entries: batch });
      try {
        const response = await eventBridgeClient.send(command);
        console.log(`Batch sent to EventBridge. Failed count: ${response.FailedEntryCount}`);
        if (response.FailedEntryCount > 0) {
          console.warn(`Some events failed:`, response.Entries);
        }
      } catch (err) {
        console.error("Error sending batch to EventBridge", err);
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Events processed with potential failures" })
    };
  } catch (error) {
    console.error("Error processing events", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};

function validateEvent(event) {
  // My test event looks like
  // {
  //   "Type":"data",
  //   "Version":"0.1",
  //   "Source":"manual",
  //   "DetailType":"testEvent",
  //   "Message":"Hello World"
  // }
  return event && event.Type && event.Source && event.DetailType && event.Message && event.Version;
}
