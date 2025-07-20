import winston from 'winston';
import { config } from '../config/environment';

// Custom log format
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta)}`;
    }
    
    if (stack) {
      log += `\n${stack}`;
    }
    
    return log;
  })
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'HH:mm:ss'
  }),
  winston.format.printf(({ timestamp, level, message, stack }) => {
    let log = `${timestamp} ${level}: ${message}`;
    if (stack) {
      log += `\n${stack}`;
    }
    return log;
  })
);

// Create logger instance
const logger = winston.createLogger({
  level: config.logging.level,
  format: logFormat,
  defaultMeta: { service: 'upcoach-api' },
  transports: [
    // Console transport for all environments
    new winston.transports.Console({
      format: config.env === 'production' ? logFormat : consoleFormat,
    }),
  ],
});

// Add file transport for production
if (config.env === 'production' && config.logging.file) {
  logger.add(new winston.transports.File({
    filename: config.logging.file,
    format: logFormat,
  }));
  
  logger.add(new winston.transports.File({
    filename: 'error.log',
    level: 'error',
    format: logFormat,
  }));
}

// Stream interface for Morgan
export const loggerStream = {
  write: (message: string) => {
    logger.info(message.trim());
  }
};

export { logger }; 