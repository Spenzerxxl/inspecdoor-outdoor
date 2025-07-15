// 🔧 InspecDoor Offline Data Hooks - React Integration
// Tablet-optimierte Hooks für Offline-Funktionalität

'use client'

import { useState, useEffect, useCallback } from 'react';
import { offlineDB, type Customer, type Door, type Inspection } from '../lib/db/offlineDB';
import { syncManager, type SyncProgress } from '../lib/db/syncManager';

// ================================================================
// OFFLINE DATA HOOK
// ================================================================

export function useOfflineData() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [doors, setDoors] = useState<Door[]>([]);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOfflineData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      await offlineDB.init();
      
      const [customersData, doorsData, inspectionsData] = await Promise.all([
        offlineDB.getAllCustomers(),
        offlineDB.getAllDoors(),
        offlineDB.getAllInspections()
      ]);

      setCustomers(customersData);
      setDoors(doorsData);
      setInspections(inspectionsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Laden der Offline-Daten');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getDoorsByCustomer = useCallback(async (customerId: string): Promise<Door[]> => {
    await offlineDB.init();
    return await offlineDB.getDoorsByCustomer(customerId);
  }, []);

  const getInspectionsByDoor = useCallback(async (doorId: string): Promise<Inspection[]> => {
    await offlineDB.init();
    return await offlineDB.getInspectionsByDoor(doorId);
  }, []);

  useEffect(() => {
    loadOfflineData();
  }, [loadOfflineData]);

  return {
    customers,
    doors,
    inspections,
    isLoading,
    error,
    reload: loadOfflineData,
    getDoorsByCustomer,
    getInspectionsByDoor
  };
}

// ================================================================
// SYNC STATUS HOOK
// ================================================================

export function useSyncStatus() {
  const [isOnline, setIsOnline] = useState(true); // Default to true for SSR
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [lastDownload, setLastDownload] = useState<string | null>(null);
  const [pendingUploads, setPendingUploads] = useState(0);
  const [syncInProgress, setSyncInProgress] = useState(false);
  const [syncProgress, setSyncProgress] = useState<SyncProgress | null>(null);

  // Online/Offline Detection
  useEffect(() => {
    // Set initial state after component mounts (client-side only)
    if (typeof window !== 'undefined' && 'navigator' in window) {
      setIsOnline(navigator.onLine);
      
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);
      
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  // Load sync status
  const loadSyncStatus = useCallback(async () => {
    try {
      const syncInfo = await syncManager.getLastSyncInfo();
      setLastSync(syncInfo.lastSync);
      setLastDownload(syncInfo.lastDownload);
      setPendingUploads(syncInfo.pendingUploads);
      setSyncInProgress(syncInfo.syncInProgress);
    } catch (error) {
      console.error('Failed to load sync status:', error);
    }
  }, []);

  // Auto-sync when coming online
  useEffect(() => {
    if (typeof window !== 'undefined' && isOnline && !syncInProgress) {
      syncManager.autoSyncIfOnline()
        .then((didSync) => {
          if (didSync) {
            loadSyncStatus();
          }
        })
        .catch(console.error);
    }
  }, [isOnline, syncInProgress, loadSyncStatus]);

  // Periodic sync status refresh
  useEffect(() => {
    if (typeof window !== 'undefined') {
      loadSyncStatus();
      
      const interval = setInterval(loadSyncStatus, 30000); // Every 30 seconds
      return () => clearInterval(interval);
    }
  }, [loadSyncStatus]);

  return {
    isOnline,
    lastSync,
    lastDownload,
    pendingUploads,
    syncInProgress,
    syncProgress,
    refreshStatus: loadSyncStatus
  };
}

// ================================================================
// SYNC OPERATIONS HOOK
// ================================================================

export function useSyncOperations() {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<SyncProgress | null>(null);
  const [uploadProgress, setUploadProgress] = useState<SyncProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const downloadData = useCallback(async () => {
    if (typeof window === 'undefined' || !navigator.onLine) {
      setError('Internet-Verbindung erforderlich für Download');
      return false;
    }

    try {
      setIsDownloading(true);
      setError(null);
      setDownloadProgress(null);

      await syncManager.downloadForToday((progress) => {
        setDownloadProgress(progress);
      });

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download fehlgeschlagen');
      return false;
    } finally {
      setIsDownloading(false);
    }
  }, []);

  const uploadChanges = useCallback(async () => {
    if (typeof window === 'undefined' || !navigator.onLine) {
      setError('Internet-Verbindung erforderlich für Upload');
      return false;
    }

    try {
      setIsUploading(true);
      setError(null);
      setUploadProgress(null);

      await syncManager.uploadPendingChanges((progress) => {
        setUploadProgress(progress);
      });

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload fehlgeschlagen');
      return false;
    } finally {
      setIsUploading(false);
    }
  }, []);

  return {
    isDownloading,
    isUploading,
    downloadProgress,
    uploadProgress,
    error,
    downloadData,
    uploadChanges
  };
}

// ================================================================
// OFFLINE STATISTICS HOOK
// ================================================================

export function useOfflineStats() {
  const [stats, setStats] = useState({
    customers: 0,
    doors: 0,
    inspections: 0,
    photos: 0,
    pendingUploads: 0
  });
  
  const [isLoading, setIsLoading] = useState(true);

  const loadStats = useCallback(async () => {
    if (typeof window === 'undefined') return;
    
    try {
      setIsLoading(true);
      const offlineStats = await syncManager.getOfflineStats();
      setStats(offlineStats);
    } catch (error) {
      console.error('Failed to load offline stats:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      loadStats();
      
      // Refresh stats every minute
      const interval = setInterval(loadStats, 60000);
      return () => clearInterval(interval);
    }
  }, [loadStats]);

  return {
    stats,
    isLoading,
    refresh: loadStats
  };
}

// ================================================================
// OFFLINE INSPECTION CREATION HOOK
// ================================================================

export function useOfflineInspections() {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createInspection = useCallback(async (inspectionData: {
    door_id: string;
    inspector_name: string;
    status: 'pending' | 'completed' | 'failed';
    notes?: string;
  }) => {
    if (typeof window === 'undefined') return null;
    
    try {
      setIsCreating(true);
      setError(null);

      const inspectionId = await syncManager.createOfflineInspection(inspectionData);
      return inspectionId;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Erstellen der Prüfung');
      return null;
    } finally {
      setIsCreating(false);
    }
  }, []);

  const addPhoto = useCallback(async (inspectionId: string, photoBlob: Blob, filename: string) => {
    if (typeof window === 'undefined') return null;
    
    try {
      setError(null);
      const photoId = await syncManager.addPhotoToInspection(inspectionId, photoBlob, filename);
      return photoId;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Hinzufügen des Fotos');
      return null;
    }
  }, []);

  return {
    createInspection,
    addPhoto,
    isCreating,
    error
  };
}
