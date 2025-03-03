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

type LoggerOptions = {
  level?: LogLevel,
  log?:(message:String)=>void,
  format?:(entry:LogEntry)=>String,
}

const defaultFormat = (entry:LogEntry)=>{
  return `${LogLevel[entry.level]}  [${new Date(entry.timestamp).toLocaleString()}]: ${entry.message}`
}

export class Logger {
  private level: LogLevel;
  private dbAdapter: IDBAdapter;
  private format:(entry:LogEntry)=>String = defaultFormat;
  private print?:(message:String)=>void;


  constructor(options:LoggerOptions={}) {
    this.level = options.level || LogLevel.INFO;
    this.print = options.log
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
    this.print && this.print(this.format(entry))
    await this.dbAdapter.saveLog({
      ...entry,
      context: typeof entry.context === 'object' ? JSON.stringify(entry.context) : entry.context
    });
  }

  async clearLogs(startTime?: Date, endTime?: Date) {
    await this.dbAdapter.deleteLogs(startTime, endTime);
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