import { SSMClient } from '@aws-sdk/client-ssm';

export const ssmClient = new SSMClient({
  region: process.env.AWS_REGION || 'eu-west-2',
  retryMode: 'standard',
  maxAttempts: 10,
});
