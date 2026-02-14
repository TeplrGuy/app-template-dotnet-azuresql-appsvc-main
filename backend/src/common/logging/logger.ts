import type { LoggerService, LogLevel } from '@nestjs/common';

type LogEntry = {
  level: string;
  message: unknown;
  context?: string;
  trace?: string;
  timestamp: string;
};

export class JsonLogger implements LoggerService {
  // Keep default Nest log levels; these are controlled by Nest internals.
  public logLevels?: LogLevel[];

  log(message: unknown, context?: string) {
    this.write({ level: 'log', message, context });
  }

  error(message: unknown, trace?: string, context?: string) {
    this.write({ level: 'error', message, trace, context });
  }

  warn(message: unknown, context?: string) {
    this.write({ level: 'warn', message, context });
  }

  debug(message: unknown, context?: string) {
    this.write({ level: 'debug', message, context });
  }

  verbose(message: unknown, context?: string) {
    this.write({ level: 'verbose', message, context });
  }

  private write(entry: Omit<LogEntry, 'timestamp'>) {
    const out: LogEntry = { ...entry, timestamp: new Date().toISOString() };

    console.log(JSON.stringify(out));
  }
}
