export class IDBAdapter {
    constructor() {
        this.dbName = 'logsDB';
        this.storeName = 'logEntries';
        this.dbPromise = new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, 2);
            request.onupgradeneeded = (event) => {
                const db = request.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    const store = db.createObjectStore(this.storeName, {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    store.createIndex('timestamp_idx', 'timestamp', { unique: false });
                }
            };
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
    async saveLog(entry) {
        const db = await this.dbPromise;
        const transaction = db.transaction(this.storeName, 'readwrite');
        const store = transaction.objectStore(this.storeName);
        return new Promise((resolve, reject) => {
            const request = store.add({
                ...entry,
                timestamp: (entry.timestamp || new Date()).getTime(),
                context: typeof entry.context === 'object' ? JSON.stringify(entry.context) : entry.context
            });
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
    async getLogs(startTime, endTime, minLevel) {
        const db = await this.dbPromise;
        const transaction = db.transaction(this.storeName, 'readonly');
        const store = transaction.objectStore(this.storeName);
        const index = store.index('timestamp_idx');
        const range = IDBKeyRange.bound(startTime?.getTime(), endTime?.getTime(), true, false);
        return new Promise((resolve) => {
            const logs = [];
            const request = index.openCursor(range);
            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    const record = cursor.value;
                    if (!minLevel || record.level >= minLevel) {
                        logs.push({
                            ...record,
                            timestamp: new Date(record.timestamp).toLocaleString(),
                            context: record.context ? JSON.parse(record.context) : undefined
                        });
                    }
                    cursor.continue();
                }
                else {
                    resolve(logs);
                }
            };
        });
    }
    async deleteLogs(startTime, endTime) {
        const db = await this.dbPromise;
        const tx = db.transaction(this.storeName, 'readwrite');
        const store = tx.objectStore(this.storeName);
        const index = store.index('timestamp_idx');
        const range = IDBKeyRange.bound(startTime?.getTime(), endTime?.getTime(), true, false);
        return new Promise((resolve, reject) => {
            const request = index.openCursor(range);
            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    cursor.delete();
                    cursor.continue();
                }
                else {
                    resolve(void 0);
                }
            };
            request.onerror = () => reject(request.error);
        });
    }
}
