import { lambdaClient } from 'lambda-utils';

describe('SQS Client Util', () => {
  test('should produce a default SQS Client', () => {
    expect(lambdaClient).toBeTruthy();
  });
});
