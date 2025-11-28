import { openDB } from 'idb';

const DB_NAME = 'hotel-audit-pro-db';
const DB_VERSION = 1;

// Initialize Database
export const initDB = async () => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Create object stores for each major data entity if they don't exist
      const stores = ['audits', 'incidents', 'users', 'sops', 'templates', 'collections'];
      stores.forEach(store => {
        if (!db.objectStoreNames.contains(store)) {
          db.createObjectStore(store, { keyPath: 'id' });
        }
      });
      
      // 'settings' store for scalar arrays like hotel names list, departments list
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings');
      }
    },
  });
};

export const dbAPI = {
  // Get all items from a store (e.g., all audits)
  async getAll<T>(storeName: string): Promise<T[]> {
    const db = await initDB();
    return db.getAll(storeName);
  },

  // Save an array of items, overwriting the store (sync state)
  async saveAll<T>(storeName: string, items: T[]) {
    const db = await initDB();
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    
    // Clear and rewrite is simplest strategy for syncing React State -> IDB in MVP
    await store.clear();
    for (const item of items) {
      await store.put(item);
    }
    await tx.done;
  },

  // Get a single setting value (e.g., list of departments)
  async getSetting<T>(key: string): Promise<T | undefined> {
    const db = await initDB();
    return db.get('settings', key);
  },

  // Save a single setting value
  async saveSetting(key: string, value: any) {
    const db = await initDB();
    return db.put('settings', value, key);
  }
};