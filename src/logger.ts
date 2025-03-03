import { IDBAdapter,Context } from './db-adapter.js';
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
  context?: Context;
};

export class Logger {
  private level: LogLevel;
  private dbAdapter: IDBAdapter;

  constructor(level: LogLevel = LogLevel.DEBUG) {
    this.level = level;
    this.dbAdapter = new IDBAdapter();
  }

  debug(message: string, context?: Context) {
    return this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: Context) {
    return this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: Context) {
    return this.log(LogLevel.WARN, message, context);
  }

  error(message: string, context?: Context) {
    return this.log(LogLevel.ERROR, message, context);
  }

  private async log(level: LogLevel, message: string, context?: Context) {
    if (level < this.level) return;

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      context
    };

    await this.dbAdapter.saveLog({
      ...entry,
      timestamp: entry.timestamp.toLocaleString(),
      context: entry.context ? JSON.stringify(entry.context) : undefined
    });
  }

  async getLogs(startTime?: Date, endTime?: Date, minLevel?: LogLevel) {
    return this.dbAdapter.getLogs(startTime, endTime, minLevel);
  }

  async export(format: 'json' | 'csv' = 'json', startTime?: Date, endTime?: Date, minLevel?: LogLevel) {
    const logs = await this.getLogs(startTime, endTime, minLevel);
    
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
    a.download = `logs_${new Date().toLocaleString()}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}