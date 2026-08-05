import winston from 'winston';

const { combine, errors, json, timestamp } = winston.format;

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(errors({ stack: true, cause: true }), timestamp(), json()),
  transports: [
    new winston.transports.Stream({
      stream: process.stdout,
    }),
  ],
});

export type Logger = winston.Logger;
