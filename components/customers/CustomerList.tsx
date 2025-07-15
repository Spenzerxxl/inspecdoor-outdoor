// 🔧 InspecDoor Customer List - Offline-optimiert für Tablets
// Touch-friendly Customer Navigation

'use client'

import React, { useState } from 'react';
import { useOfflineData } from '../../hooks/useOfflineData';
import type { Customer, Door } from '../../lib/db/offlineDB';

interface CustomerListProps {
  onCustomerSelect?: (customer: Customer) => void;
  onDoorSelect?: (door: Door) => void;
  className?: string;
}

export function CustomerList({ 
  onCustomerSelect, 
  onDoorSelect, 
  className = '' 
}: CustomerListProps) {
  const { customers, doors, isLoading, error, getDoorsByCustomer } = useOfflineData();
  const [expandedCustomer, setExpandedCustomer] = useState<string | null>(null);
  const [customerDoors, setCustomerDoors] = useState<{ [key: string]: Door[] }>({});

  const handleCustomerClick = async (customer: Customer) => {
    onCustomerSelect?.(customer);

    // Toggle expansion
    if (expandedCustomer === customer.id) {
      setExpandedCustomer(null);
      return;
    }

    setExpandedCustomer(customer.id);

    // Load doors for this customer if not already loaded
    if (!customerDoors[customer.id]) {
      try {
        const doors = await getDoorsByCustomer(customer.id);
        setCustomerDoors(prev => ({
          ...prev,
          [customer.id]: doors
        }));
      } catch (error) {
        console.error('Failed to load doors for customer:', customer.id, error);
      }
    }
  };

  const handleDoorClick = (door: Door) => {
    onDoorSelect?.(door);
  };

  if (isLoading) {
    return (
      <div className={`customer-list-loading ${className}`}>
        <div className="flex items-center justify-center p-8">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-3 text-touch-base">Lade Kunden...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`customer-list-error ${className}`}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="text-red-800 text-touch-base font-medium mb-2">
            ❌ Fehler beim Laden
          </div>
          <div className="text-red-700 text-touch-sm">{error}</div>
        </div>
      </div>
    );
  }

  if (customers.length === 0) {
    return (
      <div className={`customer-list-empty ${className}`}>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <div className="text-6xl mb-4">👥</div>
          <div className="text-touch-base font-medium text-gray-700 mb-2">
            Keine Kunden verfügbar
          </div>
          <div className="text-touch-sm text-gray-500">
            Laden Sie Daten herunter um offline zu arbeiten
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`customer-list ${className}`}>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4 sticky top-0 z-10">
        <h2 className="text-touch-lg font-semibold flex items-center gap-2">
          👥 Kunden ({customers.length})
        </h2>
      </div>

      {/* Customer List */}
      <div className="space-y-2 p-4">
        {customers.map((customer) => (
          <div key={customer.id} className="customer-item">
            {/* Customer Header */}
            <button
              onClick={() => handleCustomerClick(customer)}
              className="touch-button w-full bg-white border border-gray-200 hover:bg-gray-50 text-left"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="text-touch-base font-medium text-gray-900">
                    {customer.name}
                  </div>
                  {customer.contact_person && (
                    <div className="text-touch-sm text-gray-600">
                      {customer.contact_person}
                    </div>
                  )}
                  {customer.phone && (
                    <div className="text-touch-xs text-gray-500">
                      📞 {customer.phone}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  {/* Door count indicator */}
                  <span className="bg-blue-100 text-blue-800 text-touch-xs px-2 py-1 rounded-full">
                    {doors.filter(door => door.customer_id === customer.id).length} Türen
                  </span>
                  
                  {/* Expand/Collapse indicator */}
                  <div className={`transform transition-transform ${
                    expandedCustomer === customer.id ? 'rotate-180' : ''
                  }`}>
                    ⌄
                  </div>
                </div>
              </div>
            </button>

            {/* Doors List (Expanded) */}
            {expandedCustomer === customer.id && (
              <div className="customer-doors mt-2 ml-4 space-y-1">
                {customerDoors[customer.id]?.length > 0 ? (
                  customerDoors[customer.id].map((door) => (
                    <button
                      key={door.id}
                      onClick={() => handleDoorClick(door)}
                      className="touch-button w-full bg-blue-50 border border-blue-200 hover:bg-blue-100 text-left"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="text-touch-sm font-medium text-blue-900">
                            🚪 {door.door_number || 'Ohne Nummer'}
                          </div>
                          <div className="text-touch-xs text-blue-700">
                            📍 {door.location}
                          </div>
                          {door.door_type && (
                            <div className="text-touch-xs text-blue-600">
                              Typ: {door.door_type}
                            </div>
                          )}
                        </div>
                        
                        <div className="text-blue-600 text-touch-lg">→</div>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="text-touch-sm text-gray-500 p-3 bg-gray-50 rounded border">
                    Keine Türen verfügbar
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default CustomerList;
