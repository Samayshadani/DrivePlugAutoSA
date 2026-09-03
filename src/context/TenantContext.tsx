'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { BusinessRole } from '@/lib/domain/types';

export interface TenantInfo {
  id: string;
  name: string;
  slug: string;
  location: string;
  currency: string;
  hourlyLaborRate: number;
  defaultMarkupPct: number;
}

export const AVAILABLE_TENANTS: TenantInfo[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Apex Precision Auto Works',
    slug: 'apex-auto-ct',
    location: 'Cape Town, Western Cape',
    currency: 'ZAR',
    hourlyLaborRate: 650.0,
    defaultMarkupPct: 25.0,
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'Rivonia Performance & Fleet',
    slug: 'rivonia-fleet-jhb',
    location: 'Sandton, Johannesburg',
    currency: 'ZAR',
    hourlyLaborRate: 750.0,
    defaultMarkupPct: 20.0,
  },
];

interface TenantContextValue {
  activeTenant: TenantInfo;
  role: BusinessRole;
  setActiveTenantId: (id: string) => void;
  setRole: (role: BusinessRole) => void;
  getAuthHeaders: () => Record<string, string>;
}

const TenantContext = createContext<TenantContextValue | undefined>(undefined);

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTenant, setActiveTenant] = useState<TenantInfo>(AVAILABLE_TENANTS[0]);
  const [role, setRole] = useState<BusinessRole>('OWNER');

  useEffect(() => {
    // Load from localStorage or cookie if present
    const savedTenantId = localStorage.getItem('driveplug_tenant_id');
    const savedRole = localStorage.getItem('driveplug_role') as BusinessRole;
    if (savedTenantId) {
      const found = AVAILABLE_TENANTS.find((t) => t.id === savedTenantId);
      if (found) setActiveTenant(found);
    }
    if (savedRole) {
      setRole(savedRole);
    }
  }, []);

  const setActiveTenantId = (id: string) => {
    const found = AVAILABLE_TENANTS.find((t) => t.id === id);
    if (found) {
      setActiveTenant(found);
      localStorage.setItem('driveplug_tenant_id', id);
      document.cookie = `driveplug_business_id=${id}; path=/; max-age=86400; SameSite=Lax`;
    }
  };

  const updateRole = (newRole: BusinessRole) => {
    setRole(newRole);
    localStorage.setItem('driveplug_role', newRole);
  };

  const getAuthHeaders = (): Record<string, string> => ({
    'x-business-id': activeTenant.id,
    'x-demo-role': role,
  });

  return (
    <TenantContext.Provider
      value={{
        activeTenant,
        role,
        setActiveTenantId,
        setRole: updateRole,
        getAuthHeaders,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};
