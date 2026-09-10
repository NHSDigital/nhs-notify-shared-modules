import pino from 'pino';
import { LogContext, Logger } from '..';

jest.mock('pino', () => {
  const info = jest.fn();
  const error = jest.fn();
  const warn = jest.fn();
  const debug = jest.fn();
  const child = jest.fn();
  const mockPino = jest.fn(() => ({ info, error, warn, debug, child }));
  Object.defineProperty(mockPino, 'destination', {
    value: jest.fn(() => ({})),
  });
  return {
    __esModule: true,
    default: mockPino,
    info,
    error,
    warn,
    debug,
    child,
  };
});

const mockLoggerMethods = pino() as jest.Mocked<ReturnType<typeof pino>>;

type PinoConfig = {
  formatters: { level: (label: string) => { level: string } };
  timestamp: () => string;
  redact?: string[];
};

const pinoMock = pino as unknown as jest.Mock;

const lastPinoConfig = (): PinoConfig =>
  pinoMock.mock.calls.at(-1)[0] as PinoConfig;

describe('Logger', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLoggerMethods.child.mockReturnValue(mockLoggerMethods);
  });

  describe('constructor', () => {
    it('creates a logger without initial context', () => {
      const testLogger = new Logger();
      expect(testLogger).toBeInstanceOf(Logger);
      expect(mockLoggerMethods.child).not.toHaveBeenCalled();
    });

    it('creates a logger with initial context', () => {
      const initialContext: LogContext = { correlationId: 'corr-123' };
      const testLogger = new Logger({ initialContext });
      expect(testLogger).toBeInstanceOf(Logger);
      expect(mockLoggerMethods.child).toHaveBeenCalledWith(initialContext);
    });

    it('does not configure redaction by default', () => {
      const testLogger = new Logger();
      expect(testLogger).toBeInstanceOf(Logger);
      expect(lastPinoConfig().redact).toBeUndefined();
    });

    it('configures the redact paths supplied by the caller', () => {
      const testLogger = new Logger({
        redactPaths: ['secret', '*.token'],
      });
      expect(testLogger).toBeInstanceOf(Logger);
      expect(lastPinoConfig().redact).toEqual(['secret', '*.token']);
    });
  });

  describe('addContext', () => {
    it('adds new context to the logger', () => {
      const testLogger = new Logger();
      testLogger.addContext({ correlationId: 'corr-789' });
      expect(mockLoggerMethods.child).toHaveBeenCalledWith({
        correlationId: 'corr-789',
      });
    });

    it('merges new context with existing context', () => {
      const testLogger = new Logger({
        initialContext: { correlationId: 'corr-123' },
      });
      mockLoggerMethods.child.mockClear();
      testLogger.addContext({ messageId: 'msg-101' });
      expect(mockLoggerMethods.child).toHaveBeenCalledWith({
        correlationId: 'corr-123',
        messageId: 'msg-101',
      });
    });
  });

  describe('clearContext', () => {
    it('clears all context from the logger', () => {
      const testLogger = new Logger({
        initialContext: { correlationId: 'corr-123' },
      });
      testLogger.clearContext();
      expect(testLogger.correlationId).toBeUndefined();
    });
  });

  describe('correlationId accessor', () => {
    it('returns undefined when no correlation id is bound', () => {
      expect(new Logger().correlationId).toBeUndefined();
    });

    it('returns the correlation id when bound via addContext', () => {
      const testLogger = new Logger();
      testLogger.addContext({ correlationId: 'corr-abc' });
      expect(testLogger.correlationId).toBe('corr-abc');
    });

    it('returns undefined when correlation id is not a string', () => {
      const tainted = new Logger({
        initialContext: { correlationId: 123 as unknown as string },
      });
      expect(tainted.correlationId).toBeUndefined();
    });
  });

  describe('log methods', () => {
    it('logs info without and with additional context', () => {
      const testLogger = new Logger();
      testLogger.info('info message');
      expect(mockLoggerMethods.info).toHaveBeenCalledWith({}, 'info message');
      const context: LogContext = { correlationId: 'corr-123' };
      testLogger.info('info message', context);
      expect(mockLoggerMethods.info).toHaveBeenCalledWith(
        context,
        'info message',
      );
    });

    it('logs warn without and with additional context', () => {
      const testLogger = new Logger();
      testLogger.warn('warn message');
      expect(mockLoggerMethods.warn).toHaveBeenCalledWith({}, 'warn message');
      const context: LogContext = { correlationId: 'corr-456' };
      testLogger.warn('warn message', context);
      expect(mockLoggerMethods.warn).toHaveBeenCalledWith(
        context,
        'warn message',
      );
    });

    it('logs error without and with additional context', () => {
      const testLogger = new Logger();
      testLogger.error('error message');
      expect(mockLoggerMethods.error).toHaveBeenCalledWith({}, 'error message');
      const context: LogContext = { error: new Error('fail') };
      testLogger.error('error message', context);
      expect(mockLoggerMethods.error).toHaveBeenCalledWith(
        context,
        'error message',
      );
    });

    it('logs debug without and with additional context', () => {
      const testLogger = new Logger();
      testLogger.debug('debug message');
      expect(mockLoggerMethods.debug).toHaveBeenCalledWith({}, 'debug message');
      const context: LogContext = { correlationId: 'corr-101' };
      testLogger.debug('debug message', context);
      expect(mockLoggerMethods.debug).toHaveBeenCalledWith(
        context,
        'debug message',
      );
    });
  });
});

describe('pino configuration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('level formatter uppercases the label', () => {
    const testLogger = new Logger();
    expect(testLogger).toBeInstanceOf(Logger);
    expect(lastPinoConfig().formatters.level('info')).toEqual({
      level: 'INFO',
    });
    expect(lastPinoConfig().formatters.level('error')).toEqual({
      level: 'ERROR',
    });
  });

  it('timestamp returns a JSON fragment with an ISO timestamp', () => {
    const testLogger = new Logger();
    expect(testLogger).toBeInstanceOf(Logger);
    expect(lastPinoConfig().timestamp()).toMatch(
      /^,"timestamp":"\d{4}-\d{2}-\d{2}T/,
    );
  });
});
