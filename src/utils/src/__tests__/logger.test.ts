import { logger } from 'logger';

describe('Logger Util', () => {
  test('should produce a logger', () => {
    expect(logger.info).toBeTruthy();
    expect(logger.error).toBeTruthy();
    expect(logger.warn).toBeTruthy();
    expect(logger.debug).toBeTruthy();
  });
});
