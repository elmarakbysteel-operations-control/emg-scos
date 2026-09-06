/**
 * Centralized Logging Service
 * Provides structured logging with context, levels, and monitoring
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

interface LogContext {
  module?: string;
  userId?: string | number;
  requestId?: string;
  timestamp?: Date;
  duration?: number;
  [key: string]: any;
}

interface LogEntry {
  level: LogLevel;
  message: string;
  context: LogContext;
  error?: Error;
  stack?: string;
}

class Logger {
  private readonly moduleName: string;

  constructor(moduleName: string) {
    this.moduleName = moduleName;
  }

  private formatLog(entry: LogEntry): string {
    const timestamp = (entry.context.timestamp || new Date()).toISOString();
    const level = entry.level.toUpperCase().padEnd(6);
    const module = `[${this.moduleName}]`.padEnd(20);
    const message = entry.message;
    const contextStr = Object.keys(entry.context).length > 0 
      ? ` ${JSON.stringify(entry.context)}`
      : '';
    return `${timestamp} ${level} ${module} ${message}${contextStr}`;
  }

  private output(entry: LogEntry): void {
    const formatted = this.formatLog(entry);
    const consoleMethod = entry.level === 'fatal' ? 'error' : entry.level;
    console[consoleMethod as any](formatted);
    
    if (entry.error || entry.stack) {
      console.error(entry.error || entry.stack);
    }
  }

  debug(message: string, context: LogContext = {}): void {
    this.output({ level: 'debug', message, context });
  }

  info(message: string, context: LogContext = {}): void {
    this.output({ level: 'info', message, context });
  }

  warn(message: string, context: LogContext = {}): void {
    this.output({ level: 'warn', message, context });
  }

  error(message: string, error?: Error, context: LogContext = {}): void {
    this.output({
      level: 'error',
      message,
      context,
      error,
      stack: error?.stack,
    });
  }

  fatal(message: string, error?: Error, context: LogContext = {}): void {
    this.output({
      level: 'fatal',
      message,
      context,
      error,
      stack: error?.stack,
    });
  }
}

export { Logger, LogLevel, LogContext };
export const createLogger = (moduleName: string) => new Logger(moduleName);
