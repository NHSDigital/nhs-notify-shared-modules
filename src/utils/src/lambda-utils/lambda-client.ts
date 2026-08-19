import { LambdaClient, LambdaClientConfig } from '@aws-sdk/client-lambda';

const region = process.env.AWS_REGION || 'eu-west-2';

export function getLambdaClient(
  additionalOptions: Partial<LambdaClientConfig> = {},
) {
  return new LambdaClient({
    region,
    retryMode: 'standard',
    maxAttempts: 5,
    ...additionalOptions,
  });
}

export const lambdaClient = getLambdaClient();
