// 🔧 InspecDoor Sync Control - Tablet-optimierte Sync-UI
// Morning Download & Evening Upload Interface

'use client'

import React from 'react';
import { useSyncStatus, useSyncOperations, useOfflineStats } from '../../hooks/useOfflineData';

interface SyncControlProps {
  className?: string;
}

export function SyncControl({ className = '' }: SyncControlProps) {
  const { 
    isOnline, 
    lastSync, 
    lastDownload, 
    pendingUploads, 
    syncInProgress 
  } = useSyncStatus();
  
  const { 
    isDownloading, 
    isUploading, 
    downloadProgress, 
    uploadProgress, 
    error, 
    downloadData, 
    uploadChanges 
  } = useSyncOperations();
  
  const { stats } = useOfflineStats();

  const formatTime = (isoString: string | null): string => {
    if (!isoString) return 'Nie';
    const date = new Date(isoString);
    return date.toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDownload = async () => {
    const success = await downloadData();
    if (success) {
      // Optionally trigger a page refresh or state update
      window.location.reload();
    }
  };

  const handleUpload = async () => {
    const success = await uploadChanges();
    if (success) {
      // Optionally trigger a page refresh or state update
      window.location.reload();
    }
  };

  return (
    <div className={`sync-control-container ${className}`}>
      {/* 📵 OFFLINE INDICATOR */}
      {!isOnline && (
        <div className="offline-indicator">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
            <span className="text-touch-sm font-medium">Offline-Modus aktiv</span>
          </div>
          {pendingUploads > 0 && (
            <div className="text-touch-xs text-yellow-700 mt-1">
              {pendingUploads} Änderung{pendingUploads !== 1 ? 'en' : ''} gespeichert
            </div>
          )}
        </div>
      )}

      {/* 🔄 SYNC IN PROGRESS INDICATOR */}
      {syncInProgress && (
        <div className="sync-indicator">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-spin"></div>
            <span className="text-touch-sm font-medium">Synchronisation läuft...</span>
          </div>
        </div>
      )}

      {/* 🎛️ MAIN SYNC CONTROLS */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <h2 className="text-touch-lg font-semibold mb-4 flex items-center gap-2">
          🔄 Synchronisation
          <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
        </h2>

        {/* Connection Status */}
        <div className="mb-4 p-3 bg-gray-50 rounded-md">
          <div className="text-touch-sm">
            <div className="font-medium mb-1">
              Status: {isOnline ? '🟢 Online' : '📵 Offline'}
            </div>
            <div className="text-gray-600 text-touch-xs">
              Letzter Download: {formatTime(lastDownload)}
            </div>
            <div className="text-gray-600 text-touch-xs">
              Letzte Sync: {formatTime(lastSync)}
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="text-red-800 text-touch-sm font-medium">❌ Fehler</div>
            <div className="text-red-700 text-touch-xs mt-1">{error}</div>
          </div>
        )}

        {/* Progress Display */}
        {(downloadProgress || uploadProgress) && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            {downloadProgress && (
              <div>
                <div className="text-blue-800 text-touch-sm font-medium mb-2">
                  📥 {downloadProgress.message}
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${downloadProgress.progress}%` }}
                  ></div>
                </div>
              </div>
            )}
            {uploadProgress && (
              <div>
                <div className="text-blue-800 text-touch-sm font-medium mb-2">
                  📤 {uploadProgress.message}
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress.progress}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {/* Morning Download Button */}
          <button
            onClick={handleDownload}
            disabled={!isOnline || isDownloading || syncInProgress}
            className={`touch-button w-full ${
              isOnline && !isDownloading && !syncInProgress
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isDownloading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Lädt Daten...
              </span>
            ) : (
              '📥 Daten für heute laden'
            )}
          </button>

          {/* Evening Upload Button */}
          {pendingUploads > 0 && (
            <button
              onClick={handleUpload}
              disabled={!isOnline || isUploading || syncInProgress}
              className={`touch-button w-full ${
                isOnline && !isUploading && !syncInProgress
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isUploading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Lädt hoch...
                </span>
              ) : (
                `📤 ${pendingUploads} Änderung${pendingUploads !== 1 ? 'en' : ''} hochladen`
              )}
            </button>
          )}
        </div>
      </div>

      {/* 📊 OFFLINE STATISTICS */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-touch-base font-semibold mb-3">📊 Offline-Daten</h3>
        
        <div className="tablet-grid">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.customers}</div>
            <div className="text-touch-xs text-gray-600">Kunden</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.doors}</div>
            <div className="text-touch-xs text-gray-600">Türen</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.inspections}</div>
            <div className="text-touch-xs text-gray-600">Prüfungen</div>
          </div>
        </div>

        {stats.pendingUploads > 0 && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <div className="text-yellow-800 text-touch-sm font-medium">
              ⏳ {stats.pendingUploads} ausstehende Upload{stats.pendingUploads !== 1 ? 's' : ''}
            </div>
            <div className="text-yellow-700 text-touch-xs mt-1">
              Werden automatisch hochgeladen sobald Internet verfügbar ist
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SyncControl;
