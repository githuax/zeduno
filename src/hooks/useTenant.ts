import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Tenant,
  TenantUser,
  TenantContext,
  Organization,
  Location,
  TenantInvitation,
  SubscriptionPlan
} from '@/types/tenant.types';

// Mock tenant data
const generateMockTenants = (): Tenant[] => [
  {
    id: 'tenant_001',
    name: "Joe's Pizza Palace",
    slug: 'joes-pizza',
    domain: 'joespizza.com',
    status: 'active',
    plan: {
      id: 'plan_pro',
      name: 'professional',
      displayName: 'Professional',
      price: 79,
      currency: 'USD',
      billingCycle: 'monthly',
      features: ['online_ordering', 'analytics', 'inventory'],
      limits: {
        maxUsers: 10,
        maxTables: 50,
        maxOrders: 2000,
        maxMenuItems: 200,
        storageGB: 5,
        supportLevel: 'priority',
        customBranding: true,
        apiAccess: true,
        advancedAnalytics: true
      }
    },
    settings: {
      timezone: 'America/New_York',
      currency: 'USD',
      language: 'en',
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12h',
      defaultTaxRate: 8.5,
      serviceChargeRate: 0,
      allowGuestCheckout: true,
      requireEmailVerification: true,
      enableNotifications: true,
      maintenanceMode: false
    },
    contact: {
      email: 'joe@joespizza.com',
      phone: '+1-555-123-4567',
      firstName: 'Joe',
      lastName: 'Smith',
      company: "Joe's Pizza Palace",
      address: {
        street: '123 Main St',
        city: 'New York',
        state: 'NY',
        country: 'USA',
        zipCode: '10001'
      }
    },
    billing: {
      billingEmail: 'billing@joespizza.com',
      invoiceHistory: []
    },
    limits: {
      currentUsers: 5,
      currentTables: 24,
      currentOrders: 150,
      currentMenuItems: 85,
      storageUsedGB: 2.3
    },
    features: {
      multiLocation: false,
      customDomain: true,
      whiteLabel: false,
      apiAccess: true,
      customIntegrations: true,
      advancedReporting: true,
      prioritySupport: true,
      sso: false,
      auditLogs: true,
      dataExport: true
    },
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date(),
    trialEndsAt: undefined
  },
  {
    id: 'tenant_002',
    name: 'Bella Vista Restaurants',
    slug: 'bella-vista',
    status: 'active',
    plan: {
      id: 'plan_ent',
      name: 'enterprise',
      displayName: 'Enterprise',
      price: 199,
      currency: 'USD',
      billingCycle: 'monthly',
      features: ['multi_location', 'api_access', 'white_label'],
      limits: {
        maxUsers: 50,
        maxTables: 200,
        maxOrders: 10000,
        maxMenuItems: 1000,
        storageGB: 25,
        supportLevel: '24/7',
        customBranding: true,
        apiAccess: true,
        advancedAnalytics: true
      }
    },
    settings: {
      timezone: 'America/Los_Angeles',
      currency: 'USD',
      language: 'en',
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12h',
      defaultTaxRate: 9.5,
      serviceChargeRate: 3,
      allowGuestCheckout: true,
      requireEmailVerification: true,
      enableNotifications: true,
      maintenanceMode: false
    },
    contact: {
      email: 'admin@bellavista.com',
      phone: '+1-555-987-6543',
      firstName: 'Maria',
      lastName: 'Rodriguez',
      company: 'Bella Vista Restaurants',
      address: {
        street: '456 Oak Ave',
        city: 'Los Angeles',
        state: 'CA',
        country: 'USA',
        zipCode: '90210'
      }
    },
    billing: {
      billingEmail: 'billing@bellavista.com',
      invoiceHistory: []
    },
    limits: {
      currentUsers: 25,
      currentTables: 120,
      currentOrders: 2500,
      currentMenuItems: 350,
      storageUsedGB: 12.8
    },
    features: {
      multiLocation: true,
      customDomain: true,
      whiteLabel: true,
      apiAccess: true,
      customIntegrations: true,
      advancedReporting: true,
      prioritySupport: true,
      sso: true,
      auditLogs: true,
      dataExport: true
    },
    createdAt: new Date('2023-08-22'),
    updatedAt: new Date(),
    trialEndsAt: undefined
  }
];

const generateMockCurrentUser = (tenantId: string): TenantUser => ({
  id: 'user_001',
  tenantId,
  email: 'admin@restaurant.com',
  username: 'admin',
  firstName: 'John',
  lastName: 'Doe',
  role: {
    id: 'role_owner',
    tenantId,
    name: 'owner',
    displayName: 'Owner',
    description: 'Full access to all features',
    permissions: {
      orders: { create: true, read: true, update: true, delete: true, refund: true },
      menu: { create: true, read: true, update: true, delete: true, pricing: true },
      inventory: { create: true, read: true, update: true, delete: true, purchase: true },
      tables: { create: true, read: true, update: true, delete: true, reservations: true },
      customers: { create: true, read: true, update: true, delete: true, export: true },
      payments: { process: true, refund: true, view: true, settings: true },
      reports: { sales: true, inventory: true, staff: true, customer: true, financial: true, export: true },
      analytics: { view: true, export: true, advanced: true },
      staff: { create: true, read: true, update: true, delete: true, schedules: true, payroll: true },
      settings: { restaurant: true, system: true, integrations: true, billing: true, users: true, security: true },
      api: { access: true, manage: true },
      backup: { create: true, restore: true, schedule: true }
    },
    isSystem: true,
    isDefault: false,
    createdAt: new Date('2024-01-15')
  },
  permissions: {
    orders: { create: true, read: true, update: true, delete: true, refund: true },
    menu: { create: true, read: true, update: true, delete: true, pricing: true },
    inventory: { create: true, read: true, update: true, delete: true, purchase: true },
    tables: { create: true, read: true, update: true, delete: true, reservations: true },
    customers: { create: true, read: true, update: true, delete: true, export: true },
    payments: { process: true, refund: true, view: true, settings: true },
    reports: { sales: true, inventory: true, staff: true, customer: true, financial: true, export: true },
    analytics: { view: true, export: true, advanced: true },
    staff: { create: true, read: true, update: true, delete: true, schedules: true, payroll: true },
    settings: { restaurant: true, system: true, integrations: true, billing: true, users: true, security: true },
    api: { access: true, manage: true },
    backup: { create: true, restore: true, schedule: true }
  },
  status: 'active',
  lastLoginAt: new Date(),
  createdAt: new Date('2024-01-15'),
  updatedAt: new Date(),
  twoFactorEnabled: false
});

const generateMockSubscriptionPlans = (): SubscriptionPlan[] => [
  {
    id: 'plan_starter',
    name: 'starter',
    displayName: 'Starter',
    price: 29,
    currency: 'USD',
    billingCycle: 'monthly',
    features: ['basic_pos', 'order_management'],
    limits: {
      maxUsers: 3,
      maxTables: 10,
      maxOrders: 500,
      maxMenuItems: 50,
      storageGB: 1,
      supportLevel: 'basic',
      customBranding: false,
      apiAccess: false,
      advancedAnalytics: false
    }
  },
  {
    id: 'plan_pro',
    name: 'professional',
    displayName: 'Professional',
    price: 79,
    currency: 'USD',
    billingCycle: 'monthly',
    features: ['basic_pos', 'online_ordering', 'analytics', 'inventory'],
    limits: {
      maxUsers: 10,
      maxTables: 50,
      maxOrders: 2000,
      maxMenuItems: 200,
      storageGB: 5,
      supportLevel: 'priority',
      customBranding: true,
      apiAccess: true,
      advancedAnalytics: true
    }
  },
  {
    id: 'plan_ent',
    name: 'enterprise',
    displayName: 'Enterprise',
    price: 199,
    currency: 'USD',
    billingCycle: 'monthly',
    features: ['everything', 'multi_location', 'white_label', 'api_access'],
    limits: {
      maxUsers: 50,
      maxTables: 200,
      maxOrders: 10000,
      maxMenuItems: 1000,
      storageGB: 25,
      supportLevel: '24/7',
      customBranding: true,
      apiAccess: true,
      advancedAnalytics: true
    }
  }
];

// Tenant Context Hook
export const useTenantContext = () => {
  // In a real app, this would come from authentication context
  const currentTenantId = 'tenant_001'; // This would be dynamic
  
  return useQuery({
    queryKey: ['tenant-context', currentTenantId],
    queryFn: () => {
      const tenants = generateMockTenants();
      const tenant = tenants.find(t => t.id === currentTenantId);
      
      if (!tenant) throw new Error('Tenant not found');
      
      const user = generateMockCurrentUser(currentTenantId);
      
      const context: TenantContext = {
        tenant,
        user,
        permissions: user.permissions,
        subscription: {
          plan: tenant.plan,
          usage: tenant.limits,
          features: tenant.features
        }
      };
      
      return context;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false
  });
};

// Tenant Management Hooks
export const useTenants = () => {
  return useQuery({
    queryKey: ['tenants'],
    queryFn: () => generateMockTenants(),
    staleTime: 2 * 60 * 1000
  });
};

export const useTenant = (tenantId: string) => {
  return useQuery({
    queryKey: ['tenant', tenantId],
    queryFn: () => {
      const tenants = generateMockTenants();
      const tenant = tenants.find(t => t.id === tenantId);
      if (!tenant) throw new Error('Tenant not found');
      return tenant;
    },
    staleTime: 5 * 60 * 1000
  });
};

export const useSubscriptionPlans = () => {
  return useQuery({
    queryKey: ['subscription-plans'],
    queryFn: () => generateMockSubscriptionPlans(),
    staleTime: 30 * 60 * 1000 // 30 minutes
  });
};

export const useTenantUsers = (tenantId: string) => {
  return useQuery({
    queryKey: ['tenant-users', tenantId],
    queryFn: () => {
      // Generate mock users for the tenant
      return [
        generateMockCurrentUser(tenantId),
        {
          ...generateMockCurrentUser(tenantId),
          id: 'user_002',
          email: 'manager@restaurant.com',
          username: 'manager',
          firstName: 'Jane',
          lastName: 'Smith',
          role: {
            ...generateMockCurrentUser(tenantId).role,
            id: 'role_manager',
            name: 'manager',
            displayName: 'Manager'
          }
        }
      ];
    },
    staleTime: 2 * 60 * 1000
  });
};

export const useOrganizations = (tenantId: string) => {
  return useQuery({
    queryKey: ['organizations', tenantId],
    queryFn: () => {
      const mockOrganizations: Organization[] = [
        {
          id: 'org_001',
          tenantId,
          name: 'Main Restaurant Group',
          type: 'restaurant',
          locations: [],
          settings: {
            id: 'org_settings_001',
            tenantId,
            organizationId: 'org_001',
            branding: {
              primaryColor: '#2563eb',
              secondaryColor: '#64748b',
              theme: 'light'
            },
            notifications: {
              email: true,
              sms: false,
              push: true
            },
            integrations: {
              pos: { provider: 'square', enabled: true, credentials: {}, settings: {} },
              payments: [],
              delivery: [],
              marketing: []
            }
          },
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date()
        }
      ];
      return mockOrganizations;
    },
    staleTime: 5 * 60 * 1000
  });
};

export const useLocations = (tenantId: string, organizationId?: string) => {
  return useQuery({
    queryKey: ['locations', tenantId, organizationId],
    queryFn: () => {
      const mockLocations: Location[] = [
        {
          id: 'loc_001',
          tenantId,
          organizationId: organizationId || 'org_001',
          name: 'Downtown Location',
          code: 'DT001',
          address: {
            street: '123 Main St',
            city: 'New York',
            state: 'NY',
            country: 'USA',
            zipCode: '10001',
            coordinates: { latitude: 40.7128, longitude: -74.0060 }
          },
          contact: {
            phone: '+1-555-123-4567',
            email: 'downtown@restaurant.com',
            manager: 'John Doe'
          },
          businessHours: [
            { dayOfWeek: 1, isOpen: true, openTime: '10:00', closeTime: '22:00' },
            { dayOfWeek: 2, isOpen: true, openTime: '10:00', closeTime: '22:00' }
          ],
          capacity: {
            tables: 24,
            seats: 96,
            deliveryRadius: 5
          },
          features: {
            dineIn: true,
            takeaway: true,
            delivery: true,
            reservations: true,
            onlineOrdering: true,
            paymentProcessing: true
          },
          status: 'active',
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date()
        }
      ];
      return mockLocations;
    },
    staleTime: 5 * 60 * 1000
  });
};

// Mutation Hooks
export const useCreateTenant = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (tenantData: Partial<Tenant>) => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const newTenant: Tenant = {
        ...tenantData,
        id: `tenant_${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date()
      } as Tenant;
      return newTenant;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
    }
  });
};

export const useUpdateTenant = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ tenantId, updates }: { tenantId: string; updates: Partial<Tenant> }) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { tenantId, updates };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tenant', variables.tenantId] });
      queryClient.invalidateQueries({ queryKey: ['tenant-context'] });
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
    }
  });
};

export const useInviteUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (invitationData: Partial<TenantInvitation>) => {
      await new Promise(resolve => setTimeout(resolve, 1500));
      return {
        ...invitationData,
        id: `inv_${Date.now()}`,
        token: `token_${Date.now()}`,
        status: 'pending',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tenant-users', variables.tenantId] });
    }
  });
};

export const useSwitchTenant = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (tenantId: string) => {
      // In a real app, this would update the user's session
      await new Promise(resolve => setTimeout(resolve, 500));
      return tenantId;
    },
    onSuccess: (tenantId) => {
      // Clear all tenant-specific data
      queryClient.invalidateQueries({ queryKey: ['tenant-context'] });
      queryClient.invalidateQueries();
    }
  });
};

// Permission checking utilities
export const usePermissions = () => {
  const { data: context } = useTenantContext();
  
  const hasPermission = (resource: keyof TenantContext['permissions'], action: string): boolean => {
    if (!context?.permissions) return false;
    
    const resourcePerms = context.permissions[resource] as any;
    return resourcePerms?.[action] === true;
  };
  
  const canAccess = (feature: string): boolean => {
    if (!context?.subscription?.features) return false;
    return (context.subscription.features as any)[feature] === true;
  };
  
  const isWithinLimits = (resource: string): boolean => {
    if (!context?.subscription) return false;
    
    const { usage, plan } = context.subscription;
    const current = (usage as any)[`current${resource}`] || 0;
    const max = (plan.limits as any)[`max${resource}`] || Infinity;
    
    return current < max;
  };
  
  return {
    permissions: context?.permissions,
    hasPermission,
    canAccess,
    isWithinLimits
  };
};