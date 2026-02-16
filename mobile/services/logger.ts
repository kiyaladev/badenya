/**
 * Centralized logging service for the mobile app.
 * Wraps console methods with context, timestamps, and structured output.
 * In production, this can be extended to send logs to external services
 * (e.g., Sentry, LogRocket, Datadog).
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  context: string;
  message: string;
  timestamp: string;
  data?: unknown;
}

class Logger {
  private formatEntry(entry: LogEntry): string {
    const prefix = `[${entry.timestamp}] [${entry.level.toUpperCase()}] [${entry.context}]`;
    return `${prefix} ${entry.message}`;
  }

  private createEntry(level: LogLevel, context: string, message: string, data?: unknown): LogEntry {
    return {
      level,
      context,
      message,
      timestamp: new Date().toISOString(),
      data,
    };
  }

  debug(context: string, message: string, data?: unknown): void {
    if (__DEV__) {
      const entry = this.createEntry('debug', context, message, data);
      console.debug(this.formatEntry(entry), data ?? '');
    }
  }

  info(context: string, message: string, data?: unknown): void {
    const entry = this.createEntry('info', context, message, data);
    console.info(this.formatEntry(entry), data ?? '');
  }

  warn(context: string, message: string, data?: unknown): void {
    const entry = this.createEntry('warn', context, message, data);
    console.warn(this.formatEntry(entry), data ?? '');
  }

  error(context: string, message: string, data?: unknown): void {
    const entry = this.createEntry('error', context, message, data);
    console.error(this.formatEntry(entry), data ?? '');
  }
}

export default new Logger();
