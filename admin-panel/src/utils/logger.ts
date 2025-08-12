type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: any;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  private log(level: LogLevel, message: string, context?: LogContext) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...context,
    };

    switch (level) {
      case 'debug':
        if (this.isDevelopment) {
          console.debug(`[${timestamp}] DEBUG:`, message, context || '');
        }
        break;
      case 'info':
        console.log(`[${timestamp}] INFO:`, message, context || '');
        break;
      case 'warn':
        console.warn(`[${timestamp}] WARN:`, message, context || '');
        break;
      case 'error':
        console.error(`[${timestamp}] ERROR:`, message, context || '');
        break;
    }

    // In production, you might want to send logs to a service
    if (!this.isDevelopment && level === 'error') {
      // Send to error tracking service
      this.sendToErrorTracking(logEntry);
    }
  }

  private sendToErrorTracking(logEntry: any) {
    // Integrate with your error tracking service (Sentry, LogRocket, etc.)
    // Example:
    // if (window.Sentry) {
    //   window.Sentry.captureMessage(logEntry.message, {
    //     level: 'error',
    //     extra: logEntry,
    //   });
    // }
  }

  debug(message: string, context?: LogContext) {
    this.log('debug', message, context);
  }

  info(message: string, context?: LogContext) {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext) {
    this.log('warn', message, context);
  }

  error(message: string, context?: LogContext) {
    this.log('error', message, context);
  }
}

export const logger = new Logger();