// 🔧 InspecDoor Offline Database - IndexedDB für Tablet-Workflows
// Basierend auf Best-Practice Field Worker App Patterns

interface Customer {
  id: string;
  name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  created_at: string;
  updated_at: string;
}

interface Door {
  id: string;
  customer_id: string;
  location: string;
  door_number: string;
  door_type?: string;
  manufacturer?: string;
  model?: string;
  year?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface Inspection {
  id: string;
  door_id: string;
  inspector_name: string;
  inspection_date: string;
  status: 'pending' | 'completed' | 'failed';
  notes?: string;
  photos?: string[];
  created_at: string;
  updated_at: string;
  // Offline-spezifische Felder
  synced: boolean;
  offline_created: boolean;
}

interface OfflinePhoto {
  id: string;
  inspection_id: string;
  blob: Blob;
  filename: string;
  created_at: string;
  synced: boolean;
}

interface SyncStatus {
  id: string;
  last_sync: string;
  pending_uploads: number;
  last_download: string;
  sync_in_progress: boolean;
}

class OfflineDB {
  private db: IDBDatabase | null = null;
  private dbName = 'InspecDoorOffline';
  private version = 1;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Customers Store
        if (!db.objectStoreNames.contains('customers')) {
          const customersStore = db.createObjectStore('customers', { keyPath: 'id' });
          customersStore.createIndex('name', 'name', { unique: false });
        }

        // Doors Store
        if (!db.objectStoreNames.contains('doors')) {
          const doorsStore = db.createObjectStore('doors', { keyPath: 'id' });
          doorsStore.createIndex('customer_id', 'customer_id', { unique: false });
          doorsStore.createIndex('location', 'location', { unique: false });
        }

        // Inspections Store
        if (!db.objectStoreNames.contains('inspections')) {
          const inspectionsStore = db.createObjectStore('inspections', { keyPath: 'id' });
          inspectionsStore.createIndex('door_id', 'door_id', { unique: false });
          inspectionsStore.createIndex('synced', 'synced', { unique: false });
          inspectionsStore.createIndex('status', 'status', { unique: false });
        }

        // Photos Store (Blobs für Offline-Fotos)
        if (!db.objectStoreNames.contains('photos')) {
          const photosStore = db.createObjectStore('photos', { keyPath: 'id' });
          photosStore.createIndex('inspection_id', 'inspection_id', { unique: false });
          photosStore.createIndex('synced', 'synced', { unique: false });
        }

        // Sync Status Store
        if (!db.objectStoreNames.contains('sync_status')) {
          db.createObjectStore('sync_status', { keyPath: 'id' });
        }
      };
    });
  }

  // ================================================================
  // CUSTOMERS CRUD
  // ================================================================

  async getAllCustomers(): Promise<Customer[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['customers'], 'readonly');
      const store = transaction.objectStore('customers');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async storeCustomers(customers: Customer[]): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['customers'], 'readwrite');
      const store = transaction.objectStore('customers');

      // Bulk insert
      customers.forEach(customer => {
        store.put(customer);
      });

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  // ================================================================
  // DOORS CRUD
  // ================================================================

  async getAllDoors(): Promise<Door[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['doors'], 'readonly');
      const store = transaction.objectStore('doors');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getDoorsByCustomer(customerId: string): Promise<Door[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['doors'], 'readonly');
      const store = transaction.objectStore('doors');
      const index = store.index('customer_id');
      const request = index.getAll(customerId);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async storeDoors(doors: Door[]): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['doors'], 'readwrite');
      const store = transaction.objectStore('doors');

      doors.forEach(door => {
        store.put(door);
      });

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  // ================================================================
  // INSPECTIONS CRUD
  // ================================================================

  async getAllInspections(): Promise<Inspection[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['inspections'], 'readonly');
      const store = transaction.objectStore('inspections');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getInspectionsByDoor(doorId: string): Promise<Inspection[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['inspections'], 'readonly');
      const store = transaction.objectStore('inspections');
      const index = store.index('door_id');
      const request = index.getAll(doorId);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getPendingInspections(): Promise<Inspection[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['inspections'], 'readonly');
      const store = transaction.objectStore('inspections');
      const request = store.getAll();

      request.onsuccess = () => {
        // Filter für unsynced inspections
        const allInspections = request.result;
        const pendingInspections = allInspections.filter(inspection => !inspection.synced);
        resolve(pendingInspections);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async storeInspection(inspection: Inspection): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['inspections'], 'readwrite');
      const store = transaction.objectStore('inspections');
      const request = store.put(inspection);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async storeInspections(inspections: Inspection[]): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['inspections'], 'readwrite');
      const store = transaction.objectStore('inspections');

      inspections.forEach(inspection => {
        store.put(inspection);
      });

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  // ================================================================
  // PHOTOS CRUD (BLOB STORAGE)
  // ================================================================

  async storePhoto(photo: OfflinePhoto): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['photos'], 'readwrite');
      const store = transaction.objectStore('photos');
      const request = store.put(photo);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getPhotosByInspection(inspectionId: string): Promise<OfflinePhoto[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['photos'], 'readonly');
      const store = transaction.objectStore('photos');
      const index = store.index('inspection_id');
      const request = index.getAll(inspectionId);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getPendingPhotos(): Promise<OfflinePhoto[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['photos'], 'readonly');
      const store = transaction.objectStore('photos');
      const request = store.getAll();

      request.onsuccess = () => {
        // Filter für unsynced photos
        const allPhotos = request.result;
        const pendingPhotos = allPhotos.filter(photo => !photo.synced);
        resolve(pendingPhotos);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // ================================================================
  // SYNC STATUS
  // ================================================================

  async getSyncStatus(): Promise<SyncStatus | null> {
    if (!this.db) throw new Error('Database not initialized');
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['sync_status'], 'readonly');
      const store = transaction.objectStore('sync_status');
      const request = store.get('main');

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async updateSyncStatus(status: Partial<SyncStatus>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['sync_status'], 'readwrite');
      const store = transaction.objectStore('sync_status');
      
      const getRequest = store.get('main');
      getRequest.onsuccess = () => {
        const currentStatus = getRequest.result || {
          id: 'main',
          last_sync: '',
          pending_uploads: 0,
          last_download: '',
          sync_in_progress: false
        };

        const updatedStatus = { ...currentStatus, ...status };
        const putRequest = store.put(updatedStatus);
        
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      };
      
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  // ================================================================
  // UTILITY METHODS
  // ================================================================

  async clearAllData(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const stores = ['customers', 'doors', 'inspections', 'photos', 'sync_status'];
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(stores, 'readwrite');
      
      stores.forEach(storeName => {
        const store = transaction.objectStore(storeName);
        store.clear();
      });

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async getStorageStats(): Promise<{
    customers: number;
    doors: number;
    inspections: number;
    photos: number;
    pendingUploads: number;
  }> {
    if (!this.db) throw new Error('Database not initialized');

    const [customers, doors, inspections, pendingInspections, pendingPhotos] = await Promise.all([
      this.getAllCustomers(),
      this.getAllDoors(),
      this.getAllInspections(),
      this.getPendingInspections(),
      this.getPendingPhotos()
    ]);

    return {
      customers: customers.length,
      doors: doors.length,
      inspections: inspections.length,
      photos: pendingPhotos.length, // Nur offline-photos zählen
      pendingUploads: pendingInspections.length + pendingPhotos.length
    };
  }
}

// Export singleton instance
export const offlineDB = new OfflineDB();
export type { Customer, Door, Inspection, OfflinePhoto, SyncStatus };
