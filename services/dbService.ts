import { Thought } from "../types";

const DB_NAME = "LifeOrbitDB";
const DB_VERSION = 1;
const STORE_NAME = "thoughts";

export interface DBStats {
  count: number;
  usageBytes: number;
  quotaBytes: number;
  lastUpdated: number;
}

export interface DBLog {
  id: string;
  time: string;
  type: 'INSERT' | 'UPDATE' | 'DELETE' | 'SYNC' | 'QUERY';
  message: string;
}

export class LifeOrbitDB {
  private db: IDBDatabase | null = null;
  private logs: DBLog[] = [];
  private onLogListeners: ((logs: DBLog[]) => void)[] = [];

  private addLog(type: DBLog['type'], message: string) {
    const log: DBLog = {
      id: Math.random().toString(36).substring(7),
      time: new Date().toLocaleTimeString(),
      type,
      message
    };
    this.logs = [log, ...this.logs].slice(0, 50);
    this.onLogListeners.forEach(fn => fn(this.logs));
  }

  subscribeLogs(fn: (logs: DBLog[]) => void) {
    this.onLogListeners.push(fn);
    fn(this.logs);
    return () => {
      this.onLogListeners = this.onLogListeners.filter(l => l !== fn);
    };
  }

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: "id" });
        }
        this.addLog('SYNC', 'Database Schema initialized: Table `thoughts` created.');
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        this.addLog('SYNC', 'Engine connected: Local storage path verified.');
        resolve();
      };

      request.onerror = () => {
        this.addLog('DELETE', 'Critical Failure: Database connection lost.');
        reject("IndexedDB init failed");
      };
    });
  }

  async getAll(): Promise<Thought[]> {
    return new Promise((resolve) => {
      if (!this.db) return resolve([]);
      const transaction = this.db.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();
      request.onsuccess = () => {
        this.addLog('QUERY', `SELECT * FROM thoughts; Fetching ${request.result.length} rows.`);
        resolve(request.result);
      };
    });
  }

  async getStats(): Promise<DBStats> {
    const data = await this.getAll();
    const storageInfo = await navigator.storage.estimate();
    return {
      count: data.length,
      usageBytes: storageInfo.usage || 0,
      quotaBytes: storageInfo.quota || 0,
      lastUpdated: Date.now()
    };
  }

  async save(thought: Thought): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject("DB not initialized");
      const transaction = this.db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(thought);

      transaction.oncomplete = () => {
        this.addLog('INSERT', `INSERT INTO thoughts (id) VALUES ('${thought.id}'); Transaction committed.`);
        resolve();
      };

      transaction.onerror = () => {
        this.addLog('DELETE', `Failed to save record ${thought.id}. Rolling back.`);
        reject();
      };
    });
  }

  async delete(id: string): Promise<void> {
    return new Promise((resolve) => {
      if (!this.db) return resolve();
      const transaction = this.db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      store.delete(id);
      transaction.oncomplete = () => {
        this.addLog('DELETE', `DELETE FROM thoughts WHERE id='${id}'; Row pruned.`);
        resolve();
      };
    });
  }

  async exportToJSON(): Promise<string> {
    const data = await this.getAll();
    this.addLog('SYNC', 'Executing database dump...');
    return JSON.stringify({
      engine: "IndexedDB-Binary",
      format: "LifeOrbit-JSON-Export",
      exportDate: new Date().toISOString(),
      payload: data
    }, null, 2);
  }

  async importFromJSON(jsonString: string): Promise<void> {
    const parsed = JSON.parse(jsonString);
    const data = parsed.payload || parsed.data;
    
    return new Promise((resolve, reject) => {
      if (!this.db) return reject("DB not ready");
      const transaction = this.db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      data.forEach((item: Thought) => store.put(item));
      
      transaction.oncomplete = () => {
        this.addLog('SYNC', `Batch Import Success: ${data.length} rows restored.`);
        resolve();
      };
      transaction.onerror = () => reject("Import failed");
    });
  }
}

export const db = new LifeOrbitDB();