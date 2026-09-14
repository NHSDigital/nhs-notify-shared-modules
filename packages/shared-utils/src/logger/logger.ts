import pino from 'pino';

export interface LogContext {
  correlationId?: string;
  error?: Error | string;

  [key: string]: unknown;
}

export interface LoggerOptions {
  initialContext?: LogContext;
  redactPaths?: string[];
}

const resolveLogLevel = (level = 'info'): string => level;

function createBasePinoLogger(redactPaths: string[]): pino.Logger {
  return pino(
    {
      level: resolveLogLevel(process.env.LOG_LEVEL),
      formatters: {
        level: (label: string) => ({ level: label.toUpperCase() }),
      },
      timestamp: () => `,"timestamp":"${new Date().toISOString()}"`,
      ...(redactPaths.length > 0 ? { redact: redactPaths } : {}),
    },
    pino.destination({ sync: true }),
  );
}

export class Logger {
  private readonly rootPinoLogger: pino.Logger;

  private pinoLogger: pino.Logger;

  protected context: LogContext = {};

  constructor(options: LoggerOptions = {}) {
    const { initialContext, redactPaths = [] } = options;
    this.rootPinoLogger = createBasePinoLogger(redactPaths);
    if (initialContext) {
      this.context = { ...initialContext };
      this.pinoLogger = this.rootPinoLogger.child(initialContext);
    } else {
      this.pinoLogger = this.rootPinoLogger;
    }
  }

  addContext(context: LogContext): void {
    this.context = { ...this.context, ...context };
    this.pinoLogger = this.rootPinoLogger.child(this.context);
  }

  clearContext(): void {
    this.context = {};
    this.pinoLogger = this.rootPinoLogger;
  }

  get correlationId(): string | undefined {
    const value = this.context.correlationId;
    return typeof value === 'string' ? value : undefined;
  }

  info(message: string, additionalContext?: LogContext): void {
    this.pinoLogger.info(additionalContext ?? {}, message);
  }

  warn(message: string, additionalContext?: LogContext): void {
    this.pinoLogger.warn(additionalContext ?? {}, message);
  }

  error(message: string, additionalContext?: LogContext): void {
    this.pinoLogger.error(additionalContext ?? {}, message);
  }

  debug(message: string, additionalContext?: LogContext): void {
    this.pinoLogger.debug(additionalContext ?? {}, message);
  }
}
