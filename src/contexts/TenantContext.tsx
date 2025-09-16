import { useQueryClient } from '@tanstack/react-query';
import React, { createContext, useContext, useEffect, useState } from 'react';

import { useTenantContext } from '@/hooks/useTenant';
import { TenantContext as TenantContextType, Tenant, TenantUser } from '@/types/tenant.types';

interface TenantProviderProps {
  children: React.ReactNode;
}

interface TenantContextState {
  context: TenantContextType | null;
  isLoading: boolean;
  error: Error | null;
  switchTenant: (tenantId: string) => void;
  switchLocation: (locationId: string) => void;
}

const TenantContextProvider = createContext<TenantContextState | undefined>(undefined);

export const TenantProvider: React.FC<TenantProviderProps> = ({ children }) => {
  const queryClient = useQueryClient();
  const [currentTenantId, setCurrentTenantId] = useState<string>(() => {
    // Initialize from URL query parameter, subdomain, localStorage, or default
    if (typeof window !== 'undefined') {
      // Check URL query parameter first (e.g., /dashboard?tenant=bella-vista)
      const urlParams = new URLSearchParams(window.location.search);
      const tenantParam = urlParams.get('tenant');
      if (tenantParam) {
        return tenantParam;
      }
      
      // Check subdomain routing (e.g., tenant1.hotelzed.com)
      const hostname = window.location.hostname;
      const subdomain = hostname.split('.')[0];
      
      if (subdomain && subdomain !== 'www' && subdomain !== 'app' && subdomain !== 'localhost') {
        return subdomain;
      }
      
      // Fallback to localStorage
      return localStorage.getItem('currentTenantId') || 'tenant_001';
    }
    return 'tenant_001';
  });
  
  const [currentLocationId, setCurrentLocationId] = useState<string | undefined>();
  
  const { data: context, isLoading, error } = useTenantContext();
  
  // Update tenant context when tenant changes
  useEffect(() => {
    if (currentTenantId && typeof window !== 'undefined') {
      localStorage.setItem('currentTenantId', currentTenantId);
    }
  }, [currentTenantId]);
  
  const switchTenant = (tenantId: string) => {
    setCurrentTenantId(tenantId);
    setCurrentLocationId(undefined); // Reset location when switching tenants
    
    // Invalidate tenant context cache when switching tenants
    queryClient.invalidateQueries({ queryKey: ['tenant-context'] });
    
    // In a real app, you might want to redirect to the new tenant's subdomain
    if (typeof window !== 'undefined') {
      const currentHostname = window.location.hostname;
      const domainParts = currentHostname.split('.');
      
      if (domainParts.length > 2) {
        // Replace subdomain
        const newHostname = `${tenantId}.${domainParts.slice(1).join('.')}`;
        window.location.hostname = newHostname;
      }
    }
  };
  
  const switchLocation = (locationId: string) => {
    setCurrentLocationId(locationId);
  };
  
  const value: TenantContextState = {
    context: context ? {
      ...context,
      currentLocation: context.tenant.features.multiLocation && currentLocationId 
        ? context.currentLocation 
        : undefined
    } : null,
    isLoading,
    error,
    switchTenant,
    switchLocation
  };
  
  return (
    <TenantContextProvider.Provider value={value}>
      {children}
    </TenantContextProvider.Provider>
  );
};

export const useTenant = () => {
  const context = useContext(TenantContextProvider);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};

// Higher-order component for tenant-aware components
export const withTenant = <P extends object>(
  Component: React.ComponentType<P>
) => {
  const TenantAwareComponent = (props: P) => {
    const { context, isLoading } = useTenant();
    
    if (isLoading) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-48"></div>
          </div>
        </div>
      );
    }
    
    if (!context) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
            <p className="text-muted-foreground">Unable to load tenant information.</p>
          </div>
        </div>
      );
    }
    
    return <Component {...props} />;
  };
  
  TenantAwareComponent.displayName = `withTenant(${Component.displayName || Component.name})`;
  return TenantAwareComponent;
};

// Permission-based component wrapper
interface PermissionGateProps {
  children: React.ReactNode;
  resource: string;
  action: string;
  fallback?: React.ReactNode;
}

export const PermissionGate: React.FC<PermissionGateProps> = ({
  children,
  resource,
  action,
  fallback = null
}) => {
  const { context } = useTenant();
  
  if (!context) return fallback;
  
  const resourcePerms = (context.permissions as any)[resource];
  const hasPermission = resourcePerms?.[action] === true;
  
  return hasPermission ? <>{children}</> : <>{fallback}</>;
};

// Feature gate for subscription-based features
interface FeatureGateProps {
  children: React.ReactNode;
  feature: string;
  fallback?: React.ReactNode;
}

export const FeatureGate: React.FC<FeatureGateProps> = ({
  children,
  feature,
  fallback = (
    <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
      <p className="text-yellow-800 text-sm">
        This feature requires a plan upgrade.
      </p>
    </div>
  )
}) => {
  const { context } = useTenant();
  
  if (!context) return fallback;
  
  const hasFeature = (context.subscription.features as any)[feature] === true;
  
  return hasFeature ? <>{children}</> : <>{fallback}</>;
};

// Usage limit checker
interface LimitGateProps {
  children: React.ReactNode;
  resource: string;
  fallback?: React.ReactNode;
}

export const LimitGate: React.FC<LimitGateProps> = ({
  children,
  resource,
  fallback = (
    <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
      <p className="text-red-800 text-sm">
        You have reached the limit for this resource.
      </p>
    </div>
  )
}) => {
  const { context } = useTenant();
  
  if (!context) return fallback;
  
  const { usage, plan } = context.subscription;
  const currentKey = `current${resource.charAt(0).toUpperCase() + resource.slice(1)}s`;
  const maxKey = `max${resource.charAt(0).toUpperCase() + resource.slice(1)}s`;
  
  const current = (usage as any)[currentKey] || 0;
  const max = (plan.limits as any)[maxKey] || Infinity;
  
  const withinLimit = current < max;
  
  return withinLimit ? <>{children}</> : <>{fallback}</>;
};

// Tenant selector component for admin users
export const TenantSelector: React.FC = () => {
  const { context, switchTenant } = useTenant();
  
  // This would typically only be shown to super admin users
  // who can manage multiple tenants
  
  if (!context) return null;
  
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Tenant:</span>
      <span className="text-sm font-medium">{context.tenant.name}</span>
    </div>
  );
};

// Hook to check if current user is tenant owner/admin
export const useIsTenantAdmin = () => {
  const { context } = useTenant();
  
  if (!context) return false;
  
  return context.user.role.name === 'owner' || 
         context.user.permissions.settings.system;
};

// Hook to get current tenant limits and usage
export const useTenantLimits = () => {
  const { context } = useTenant();
  
  if (!context) {
    return {
      limits: {},
      usage: {},
      percentUsed: {},
      isNearLimit: () => false,
      isAtLimit: () => true
    };
  }
  
  const { plan, usage } = context.subscription;
  
  const percentUsed = {
    users: usage.currentUsers / plan.limits.maxUsers * 100,
    tables: usage.currentTables / plan.limits.maxTables * 100,
    menuItems: usage.currentMenuItems / plan.limits.maxMenuItems * 100,
    storage: usage.storageUsedGB / plan.limits.storageGB * 100
  };
  
  const isNearLimit = (resource: keyof typeof percentUsed, threshold = 80) => {
    return percentUsed[resource] >= threshold;
  };
  
  const isAtLimit = (resource: keyof typeof percentUsed) => {
    return percentUsed[resource] >= 100;
  };
  
  return {
    limits: plan.limits,
    usage,
    percentUsed,
    isNearLimit,
    isAtLimit
  };
};