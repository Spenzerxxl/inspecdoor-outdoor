// 🔧 InspecDoor Sync Manager - Morning Download & Evening Upload
// Basierend auf Real-World Field Worker App Patterns

import { createClient } from '@supabase/supabase-js';
import { offlineDB, type Customer, type Door, type Inspection, type OfflinePhoto } from './offlineDB';

interface SyncProgress {
  stage: string;
  progress: number;
  message: string;
  completed: boolean;
  error?: string;
}

type SyncProgressCallback = (progress: SyncProgress) => void;

class SyncManager {
  private supabase;
  
  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }

  // ================================================================
  // MORNING DOWNLOAD - Alle Daten laden
  // ================================================================

  async downloadForToday(onProgress?: SyncProgressCallback): Promise<void> {
    if (!navigator.onLine) {
      throw new Error('Internet-Verbindung erforderlich für Download');
    }

    try {
      // Initialize database
      await offlineDB.init();
      
      onProgress?.({
        stage: 'init',
        progress: 5,
        message: 'Initialisiere Offline-Datenbank...',
        completed: false
      });

      // 1. Download Customers
      onProgress?.({
        stage: 'customers',
        progress: 20,
        message: 'Lade Kunden...',
        completed: false
      });

      const { data: customers, error: customersError } = await this.supabase
        .from('customers')
        .select('*')
        .order('company_name');

      if (customersError) throw new Error(`Kunden-Download fehlgeschlagen: ${customersError.message}`);
      
      await offlineDB.storeCustomers(customers || []);

      // 2. Download Doors
      onProgress?.({
        stage: 'doors',
        progress: 50,
        message: 'Lade Türen...',
        completed: false
      });

      const { data: doors, error: doorsError } = await this.supabase
        .from('doors')
        .select('*')
        .order('door_id');

      if (doorsError) throw new Error(`Türen-Download fehlgeschlagen: ${doorsError.message}`);
      
      await offlineDB.storeDoors(doors || []);

      // 3. Download recent Inspections (letzte 30 Tage)
      onProgress?.({
        stage: 'inspections',
        progress: 80,
        message: 'Lade aktuelle Prüfungen...',
        completed: false
      });

      const { data: inspections, error: inspectionsError } = await this.supabase
        .from('inspections')
        .select('*')
        .order('inspection_date', { ascending: false });

      if (inspectionsError) throw new Error(`Prüfungen-Download fehlgeschlagen: ${inspectionsError.message}`);
      
      // Mark downloaded inspections as synced
      const syncedInspections = (inspections || []).map(inspection => ({
        ...inspection,
        synced: true,
        offline_created: false
      }));
      
      await offlineDB.storeInspections(syncedInspections);

      // 4. Update Sync Status
      await offlineDB.updateSyncStatus({
        last_download: new Date().toISOString(),
        sync_in_progress: false
      });

      onProgress?.({
        stage: 'complete',
        progress: 100,
        message: `✅ Bereit für Offline-Arbeit! ${customers?.length || 0} Kunden, ${doors?.length || 0} Türen geladen.`,
        completed: true
      });

    } catch (error) {
      onProgress?.({
        stage: 'error',
        progress: 0,
        message: 'Download fehlgeschlagen',
        completed: false,
        error: error instanceof Error ? error.message : 'Unbekannter Fehler'
      });
      throw error;
    }
  }

  // ================================================================
  // EVENING UPLOAD - Alle Offline-Änderungen hochladen
  // ================================================================

  async uploadPendingChanges(onProgress?: SyncProgressCallback): Promise<void> {
    if (!navigator.onLine) {
      throw new Error('Internet-Verbindung erforderlich für Upload');
    }

    try {
      await offlineDB.init();
      
      onProgress?.({
        stage: 'init',
        progress: 5,
        message: 'Prüfe ausstehende Änderungen...',
        completed: false
      });

      // Get pending data
      const [pendingInspections, pendingPhotos] = await Promise.all([
        offlineDB.getPendingInspections(),
        offlineDB.getPendingPhotos()
      ]);

      if (pendingInspections.length === 0 && pendingPhotos.length === 0) {
        onProgress?.({
          stage: 'complete',
          progress: 100,
          message: '✅ Keine ausstehenden Änderungen vorhanden.',
          completed: true
        });
        return;
      }

      let totalItems = pendingInspections.length + pendingPhotos.length;
      let uploadedItems = 0;

      // 1. Upload Inspections
      for (const inspection of pendingInspections) {
        onProgress?.({
          stage: 'inspections',
          progress: Math.round((uploadedItems / totalItems) * 80) + 10,
          message: `Lade Prüfung für Tür ${inspection.door_id} hoch...`,
          completed: false
        });

        try {
          const { error } = await this.supabase
            .from('inspections')
            .upsert({
              id: inspection.id,
              door_id: inspection.door_id,
              inspector_name: inspection.inspector_name,
              inspection_date: inspection.inspection_date,
              status: inspection.status,
              notes: inspection.notes,
              photos: inspection.photos,
              created_at: inspection.created_at,
              updated_at: new Date().toISOString()
            });

          if (error) {
            console.error('Inspection upload error:', error);
            throw new Error(`Prüfung ${inspection.id} Upload fehlgeschlagen: ${error.message}`);
          }

          // Mark as synced
          await offlineDB.storeInspection({
            ...inspection,
            synced: true
          });

          uploadedItems++;
        } catch (error) {
          console.error('Failed to upload inspection:', inspection.id, error);
          // Continue with other inspections
        }
      }

      // 2. Upload Photos
      for (const photo of pendingPhotos) {
        onProgress?.({
          stage: 'photos',
          progress: Math.round((uploadedItems / totalItems) * 80) + 10,
          message: `Lade Foto hoch...`,
          completed: false
        });

        try {
          // Upload to Supabase Storage
          const { error: uploadError } = await this.supabase.storage
            .from('door-photos')
            .upload(`inspections/${photo.inspection_id}/${photo.filename}`, photo.blob, {
              cacheControl: '3600',
              upsert: true
            });

          if (uploadError) {
            console.error('Photo upload error:', uploadError);
            throw new Error(`Foto Upload fehlgeschlagen: ${uploadError.message}`);
          }

          // Mark as synced
          await offlineDB.storePhoto({
            ...photo,
            synced: true
          });

          uploadedItems++;
        } catch (error) {
          console.error('Failed to upload photo:', photo.id, error);
          // Continue with other photos
        }
      }

      // 3. Update Sync Status
      await offlineDB.updateSyncStatus({
        last_sync: new Date().toISOString(),
        pending_uploads: 0,
        sync_in_progress: false
      });

      onProgress?.({
        stage: 'complete',
        progress: 100,
        message: `✅ Upload abgeschlossen! ${uploadedItems} von ${totalItems} Elementen hochgeladen.`,
        completed: true
      });

    } catch (error) {
      onProgress?.({
        stage: 'error',
        progress: 0,
        message: 'Upload fehlgeschlagen',
        completed: false,
        error: error instanceof Error ? error.message : 'Unbekannter Fehler'
      });
      throw error;
    }
  }

  // ================================================================
  // AUTO-SYNC - Automatische Synchronisation bei Online-Verbindung
  // ================================================================

  async autoSyncIfOnline(): Promise<boolean> {
    if (!navigator.onLine) {
      return false;
    }

    try {
      await offlineDB.init();
      
      const syncStatus = await offlineDB.getSyncStatus();
      if (syncStatus?.sync_in_progress) {
        return false; // Sync already in progress
      }

      // Mark sync as in progress
      await offlineDB.updateSyncStatus({
        sync_in_progress: true
      });

      // Check for pending uploads
      const [pendingInspections, pendingPhotos] = await Promise.all([
        offlineDB.getPendingInspections(),
        offlineDB.getPendingPhotos()
      ]);

      if (pendingInspections.length > 0 || pendingPhotos.length > 0) {
        await this.uploadPendingChanges();
        return true;
      }

      // Mark sync as complete
      await offlineDB.updateSyncStatus({
        sync_in_progress: false
      });

      return false;
    } catch (error) {
      console.error('Auto-sync failed:', error);
      
      // Mark sync as complete even on error
      await offlineDB.updateSyncStatus({
        sync_in_progress: false
      });
      
      return false;
    }
  }

  // ================================================================
  // UTILITY METHODS
  // ================================================================

  async getPendingUploadCount(): Promise<number> {
    await offlineDB.init();
    
    const [pendingInspections, pendingPhotos] = await Promise.all([
      offlineDB.getPendingInspections(),
      offlineDB.getPendingPhotos()
    ]);

    return pendingInspections.length + pendingPhotos.length;
  }

  async getLastSyncInfo(): Promise<{
    lastSync: string | null;
    lastDownload: string | null;
    pendingUploads: number;
    syncInProgress: boolean;
  }> {
    await offlineDB.init();
    
    const [syncStatus, pendingCount] = await Promise.all([
      offlineDB.getSyncStatus(),
      this.getPendingUploadCount()
    ]);

    return {
      lastSync: syncStatus?.last_sync || null,
      lastDownload: syncStatus?.last_download || null,
      pendingUploads: pendingCount,
      syncInProgress: syncStatus?.sync_in_progress || false
    };
  }

  async getOfflineStats(): Promise<{
    customers: number;
    doors: number;
    inspections: number;
    photos: number;
    pendingUploads: number;
  }> {
    await offlineDB.init();
    return await offlineDB.getStorageStats();
  }

  // ================================================================
  // OFFLINE INSPECTION CREATION
  // ================================================================

  async createOfflineInspection(inspectionData: {
    door_id: string;
    inspector_name: string;
    status: 'pending' | 'completed' | 'failed';
    notes?: string;
  }): Promise<string> {
    await offlineDB.init();

    const inspection: Inspection = {
      id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      door_id: inspectionData.door_id,
      inspector_name: inspectionData.inspector_name,
      inspection_date: new Date().toISOString(),
      status: inspectionData.status,
      notes: inspectionData.notes,
      photos: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      synced: false,
      offline_created: true
    };

    await offlineDB.storeInspection(inspection);
    
    // Update pending uploads count
    await offlineDB.updateSyncStatus({
      pending_uploads: await this.getPendingUploadCount()
    });

    return inspection.id;
  }

  async addPhotoToInspection(inspectionId: string, photoBlob: Blob, filename: string): Promise<string> {
    await offlineDB.init();

    const photo: OfflinePhoto = {
      id: `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      inspection_id: inspectionId,
      blob: photoBlob,
      filename: filename,
      created_at: new Date().toISOString(),
      synced: false
    };

    await offlineDB.storePhoto(photo);
    
    // Update pending uploads count
    await offlineDB.updateSyncStatus({
      pending_uploads: await this.getPendingUploadCount()
    });

    return photo.id;
  }
}

// Export singleton instance
export const syncManager = new SyncManager();
export type { SyncProgress, SyncProgressCallback };
