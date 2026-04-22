const DB_NAME = 'IRAI_DB';
const DB_VERSION = 1;

class IRAIDatabase {
  constructor() {
    this.db = null;
  }

  async open() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        if (!db.objectStoreNames.contains('clienti')) {
          db.createObjectStore('clienti', { keyPath: 'id', autoIncrement: true });
        }

        if (!db.objectStoreNames.contains('sedi')) {
          const sediStore = db.createObjectStore('sedi', { keyPath: 'id', autoIncrement: true });
          sediStore.createIndex('cliente_id', 'cliente_id', { unique: false });
        }

        if (!db.objectStoreNames.contains('centrali')) {
          const centraliStore = db.createObjectStore('centrali', { keyPath: 'id', autoIncrement: true });
          centraliStore.createIndex('sede_id', 'sede_id', { unique: false });
        }

        if (!db.objectStoreNames.contains('dispositivi')) {
          const dispositiviStore = db.createObjectStore('dispositivi', { keyPath: 'id', autoIncrement: true });
          dispositiviStore.createIndex('centrale_id', 'centrale_id', { unique: false });
        }

        if (!db.objectStoreNames.contains('piani_manutenzione')) {
          const pianiStore = db.createObjectStore('piani_manutenzione', { keyPath: 'id', autoIncrement: true });
          pianiStore.createIndex('centrale_id', 'centrale_id', { unique: false });
        }

        if (!db.objectStoreNames.contains('verifiche_punto')) {
          const verificheStore = db.createObjectStore('verifiche_punto', { keyPath: 'id', autoIncrement: true });
          verificheStore.createIndex('piano_id', 'piano_id', { unique: false });
          verificheStore.createIndex('dispositivo_id', 'dispositivo_id', { unique: false });
        }

        if (!db.objectStoreNames.contains('non_conformita')) {
          const ncStore = db.createObjectStore('non_conformita', { keyPath: 'id', autoIncrement: true });
          ncStore.createIndex('dispositivo_id', 'dispositivo_id', { unique: false });
          ncStore.createIndex('stato', 'stato', { unique: false });
        }

        if (!db.objectStoreNames.contains('sync_queue')) {
          const syncStore = db.createObjectStore('sync_queue', { keyPath: 'id', autoIncrement: true });
          syncStore.createIndex('entity_type', 'entity_type', { unique: false });
          syncStore.createIndex('status', 'status', { unique: false });
        }
      };
    });
  }

  async getAll(storeName) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const request = store.getAll();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async get(storeName, id) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const request = store.get(id);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async add(storeName, data) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const request = store.add({ ...data, created_at: new Date().toISOString() });
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async put(storeName, data) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const request = store.put({ ...data, updated_at: new Date().toISOString() });
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async delete(storeName, id) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const request = store.delete(id);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async queueSync(entityType, entityId, operation, data) {
    return this.add('sync_queue', {
      entity_type: entityType,
      entity_id: entityId,
      operation,
      payload: data,
      status: 'pending',
      created_at: new Date().toISOString(),
    });
  }

  async getPendingSync() {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('sync_queue', 'readonly');
      const store = tx.objectStore('sync_queue');
      const index = store.index('status');
      const request = index.getAll('pending');
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async clearSyncItem(id) {
    return this.delete('sync_queue', id);
  }

  async syncAll() {
    const pending = await this.getPendingSync();

    for (const item of pending) {
      try {
        const endpoint = `/api/${item.entity_type}/${item.operation}`;
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item.payload),
        });

        if (response.ok) {
          await this.clearSyncItem(item.id);
        }
      } catch (err) {
        console.error('Sync failed for item:', item.id, err);
      }
    }

    return pending.length;
  }
}

window.IRAIDB = new IRAIDatabase();