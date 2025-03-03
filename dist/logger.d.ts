import { Context } from './db-adapter.js';
export declare enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3
}
type LogEntry = {
    level: LogLevel;
    message: string;
    timestamp: Date;
    context?: Context;
};
type LoggerOptions = {
    level?: LogLevel;
    log?: (message: String) => void;
    format?: (entry: LogEntry) => String;
};
export declare class Logger {
    private level;
    private dbAdapter;
    private format;
    private print?;
    constructor(options?: LoggerOptions);
    debug(message: string, context?: Context): Promise<void>;
    info(message: string, context?: Context): Promise<void>;
    warn(message: string, context?: Context): Promise<void>;
    error(message: string, context?: Context): Promise<void>;
    private log;
    clearLogs(startTime?: Date, endTime?: Date): Promise<void>;
    getLogs(startTime?: Date, endTime?: Date, minLevel?: LogLevel): Promise<import("./db-adapter.js").LogEntryDB[]>;
    export(format?: 'json' | 'csv', startTime?: Date, endTime?: Date, minLevel?: LogLevel): Promise<void>;
}
export {};
