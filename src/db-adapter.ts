
export type Context = Object | String;

export interface LogEntryDB {
  level: number;
  message: string;
  timestamp?: Date;
  context?: Context;
}

export class IDBAdapter {
  private dbName = 'logsDB';
  private storeName = 'logEntries';
  private dbPromise: Promise<IDBDatabase>;


  constructor() {
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

  async saveLog(entry: LogEntryDB) {
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
    })
  }

  
  async getLogs(startTime?: Date, endTime?: Date, minLevel?: number): Promise<LogEntryDB[]> {
    const db = await this.dbPromise;
    const transaction = db.transaction(this.storeName, 'readonly');
    const store = transaction.objectStore(this.storeName);
    const index = store.index('timestamp_idx');
    
    const range = IDBKeyRange.bound(
      startTime?.getTime(),
      endTime?.getTime(),
      true,
      false
    );

    return new Promise((resolve) => {
      const logs: LogEntryDB[] = [];
      const request = index.openCursor(range);

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
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
        } else {
          resolve(logs);
        }
      };
    });
  }

  async deleteLogs(startTime?: Date, endTime?: Date) {
    const db = await this.dbPromise;
    const tx = db.transaction(this.storeName, 'readwrite');
    const store = tx.objectStore(this.storeName);
    const index = store.index('timestamp_idx');

    const range = IDBKeyRange.bound(
      startTime?.getTime(),
      endTime?.getTime(),
      true,
      false
    );

    return new Promise((resolve, reject) => {
      const request = index.openCursor(range);
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve(void 0);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }
}