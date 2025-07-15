'use client'

import { useEffect, useState } from 'react'
import SyncControl from '../components/sync/SyncControl'
import CustomerList from '../components/customers/CustomerList'
import { useSyncStatus, useOfflineStats } from '../hooks/useOfflineData'
import type { Customer, Door } from '../lib/db/offlineDB'

export default function Home() {
  const [isInstalled, setIsInstalled] = useState(false)
  const [currentView, setCurrentView] = useState<'home' | 'sync' | 'customers'>('home')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [selectedDoor, setSelectedDoor] = useState<Door | null>(null)
  
  const { isOnline, pendingUploads } = useSyncStatus()
  const { stats } = useOfflineStats()

  useEffect(() => {
    // PWA Installation Check
    const checkInstallation = () => {
      if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true)
      }
    }
    
    checkInstallation()
  }, [])

  const renderCurrentView = () => {
    switch (currentView) {
      case 'sync':
        return <SyncControl />
      
      case 'customers':
        return (
          <CustomerList 
            onCustomerSelect={(customer) => setSelectedCustomer(customer)}
            onDoorSelect={(door) => setSelectedDoor(door)}
          />
        )
      
      default:
        return (
          <div className="space-y-6">
            {/* 🔧 OFFLINE-INDICATOR */}
            {!isOnline && (
              <div className="offline-indicator">
                <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
                <span>Offline-Modus aktiv</span>
              </div>
            )}

            {/* 🔧 HEADER */}
            <div className="text-center mb-8">
              <h1 className="text-3xl tablet-p:text-4xl font-bold text-foreground mb-2">
                InspecDoor Outdoor
              </h1>
              <p className="text-touch-base text-muted-foreground">
                Tablet-optimierte Offline-PWA für Field Worker
              </p>
            </div>

            {/* 🔧 STATUS-CARDS */}
            <div className="tablet-grid mb-8">
              <div className="touch-card">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-4 h-4 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <h2 className="text-touch-lg font-semibold">Verbindung</h2>
                </div>
                <p className="text-touch-sm text-muted-foreground">
                  {isOnline ? 'Online - Synchronisation möglich' : 'Offline - Lokale Arbeit'}
                </p>
                {pendingUploads > 0 && (
                  <div className="mt-2 text-touch-xs text-yellow-700 bg-yellow-50 px-2 py-1 rounded">
                    {pendingUploads} ausstehende Upload{pendingUploads !== 1 ? 's' : ''}
                  </div>
                )}
              </div>

              <div className="touch-card">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-4 h-4 rounded-full ${isInstalled ? 'bg-blue-500' : 'bg-gray-400'}`}></div>
                  <h2 className="text-touch-lg font-semibold">Installation</h2>
                </div>
                <p className="text-touch-sm text-muted-foreground">
                  {isInstalled ? 'Als PWA installiert' : 'Im Browser geöffnet'}
                </p>
              </div>

              <div className="touch-card">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-4 h-4 rounded-full bg-purple-500"></div>
                  <h2 className="text-touch-lg font-semibold">Daten</h2>
                </div>
                <p className="text-touch-sm text-muted-foreground">
                  {stats.customers} Kunden, {stats.doors} Türen
                </p>
              </div>
            </div>

            {/* 🔧 TOUCH-OPTIMIERTE NAVIGATION */}
            <div className="space-y-4">
              <button 
                className="touch-button w-full bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={() => setCurrentView('sync')}
              >
                🔄 Synchronisation
              </button>
              
              <button 
                className="touch-button w-full bg-secondary text-secondary-foreground hover:bg-secondary/80"
                onClick={() => setCurrentView('customers')}
                disabled={stats.customers === 0}
              >
                👥 Kunden ({stats.customers})
              </button>
              
              <button 
                className="touch-button w-full bg-secondary text-secondary-foreground hover:bg-secondary/80"
                onClick={() => alert('Türen-Navigation wird implementiert')}
                disabled={stats.doors === 0}
              >
                🚪 Türen ({stats.doors})
              </button>
              
              <button 
                className="touch-button w-full bg-secondary text-secondary-foreground hover:bg-secondary/80"
                onClick={() => alert('Prüfungen-Navigation wird implementiert')}
                disabled={stats.inspections === 0}
              >
                📋 Prüfungen ({stats.inspections})
              </button>
            </div>

            {/* 🔧 PHASE 2 STATUS */}
            <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="text-touch-base font-semibold text-blue-800 mb-2">
                ✅ Phase 2 Complete - Offline-Funktionalität
              </h3>
              <ul className="text-touch-sm text-blue-700 space-y-1">
                <li>• IndexedDB für lokale Datenspeicherung</li>
                <li>• Morning Download / Evening Upload</li>
                <li>• Automatische Synchronisation</li>
                <li>• Offline-Kunden-Navigation</li>
                <li>• Touch-optimierte Sync-Controls</li>
              </ul>
            </div>
          </div>
        )
    }
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Navigation Header */}
      {currentView !== 'home' && (
        <div className="bg-white border-b border-gray-200 p-4 sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setCurrentView('home')}
              className="touch-button bg-gray-100 text-gray-700 hover:bg-gray-200 px-4 py-2"
            >
              ← Zurück
            </button>
            <h1 className="text-touch-lg font-semibold">
              {currentView === 'sync' && '🔄 Synchronisation'}
              {currentView === 'customers' && '👥 Kunden'}
            </h1>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-6">
        {renderCurrentView()}
      </div>

      {/* Selected Items Debug Info (Development only) */}
      {(selectedCustomer || selectedDoor) && (
        <div className="fixed bottom-4 left-4 right-4 bg-white border border-gray-300 rounded-lg p-4 shadow-lg">
          <div className="text-touch-sm">
            {selectedCustomer && (
              <div>Ausgewählter Kunde: <strong>{selectedCustomer.name}</strong></div>
            )}
            {selectedDoor && (
              <div>Ausgewählte Tür: <strong>{selectedDoor.door_number} - {selectedDoor.location}</strong></div>
            )}
            <button 
              onClick={() => {
                setSelectedCustomer(null)
                setSelectedDoor(null)
              }}
              className="mt-2 text-gray-500 text-touch-xs"
            >
              ✕ Schließen
            </button>
          </div>
        </div>
      )}
    </main>
  )
}
