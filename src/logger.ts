import { IDBAdapter } from './db-adapter.js';
import { ExportHandler } from './export-handler.js';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

type LogEntry = {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: object;
};

export class Logger {
  private level: LogLevel;
  private dbAdapter: IDBAdapter;

  constructor(level: LogLevel = LogLevel.DEBUG) {
    this.level = level;
    this.dbAdapter = new IDBAdapter();
  }

  debug(message: string, context?: object) {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: object) {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: object) {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, context?: object) {
    this.log(LogLevel.ERROR, message, context);
  }

  private log(level: LogLevel, message: string, context?: object) {
    if (level < this.level) return;

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      context
    };

    this.dbAdapter.saveLog({
      ...entry,
      timestamp: entry.timestamp.toISOString(),
      context: entry.context ? JSON.stringify(entry.context) : undefined
    });
  }

  async export(format: 'json' | 'csv' = 'json', startTime?: Date, endTime?: Date, minLevel?: LogLevel) {
    const logs = await this.dbAdapter.getLogs(startTime, endTime, minLevel);
    
    let content: string;
    let mimeType: string;
    
    if (format === 'csv') {
      content = ExportHandler.toCSV(logs);
      mimeType = 'text/csv';
    } else {
      content = ExportHandler.toJSON(logs);
      mimeType = 'application/json';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs_${new Date().toISOString()}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}