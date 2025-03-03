export type Context = Object | String;
export interface LogEntryDB {
    level: number;
    message: string;
    timestamp?: Date;
    context?: Context;
}
export declare class IDBAdapter {
    private dbName;
    private storeName;
    private dbPromise;
    constructor();
    saveLog(entry: LogEntryDB): Promise<unknown>;
    getLogs(startTime?: Date, endTime?: Date, minLevel?: number): Promise<LogEntryDB[]>;
    deleteLogs(startTime?: Date, endTime?: Date): Promise<unknown>;
}
