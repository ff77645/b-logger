import { IDBAdapter } from './db-adapter.js';
import { ExportHandler } from './export-handler.js';
export var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["DEBUG"] = 0] = "DEBUG";
    LogLevel[LogLevel["INFO"] = 1] = "INFO";
    LogLevel[LogLevel["WARN"] = 2] = "WARN";
    LogLevel[LogLevel["ERROR"] = 3] = "ERROR";
})(LogLevel || (LogLevel = {}));
const defaultFormat = (entry) => {
    return `${LogLevel[entry.level]}  [${new Date(entry.timestamp).toLocaleString()}]: ${entry.message}`;
};
export class Logger {
    constructor(options = {}) {
        this.format = defaultFormat;
        this.level = options.level || LogLevel.INFO;
        this.print = options.log;
        this.dbAdapter = new IDBAdapter();
    }
    debug(message, context) {
        return this.log(LogLevel.DEBUG, message, context);
    }
    info(message, context) {
        return this.log(LogLevel.INFO, message, context);
    }
    warn(message, context) {
        return this.log(LogLevel.WARN, message, context);
    }
    error(message, context) {
        return this.log(LogLevel.ERROR, message, context);
    }
    async log(level, message, context) {
        if (level < this.level)
            return;
        const entry = {
            level,
            message,
            timestamp: new Date(),
            context
        };
        this.print && this.print(this.format(entry));
        await this.dbAdapter.saveLog({
            ...entry,
            context: typeof entry.context === 'object' ? JSON.stringify(entry.context) : entry.context
        });
    }
    async clearLogs(startTime, endTime) {
        await this.dbAdapter.deleteLogs(startTime, endTime);
    }
    async getLogs(startTime, endTime, minLevel) {
        return this.dbAdapter.getLogs(startTime, endTime, minLevel);
    }
    async export(format = 'json', startTime, endTime, minLevel) {
        const logs = await this.getLogs(startTime, endTime, minLevel);
        let content;
        let mimeType;
        if (format === 'csv') {
            content = ExportHandler.toCSV(logs);
            mimeType = 'text/csv';
        }
        else {
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
