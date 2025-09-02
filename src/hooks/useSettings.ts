import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  RestaurantSettings,
  UserSettings,
  SystemSettings,
  SystemUser,
  UserRole,
  AuditLog,
  SystemHealth,
  BackupJob
} from '@/types/settings.types';

// Mock data generators
const generateMockRestaurantSettings = (): RestaurantSettings => ({
  id: 'rest_001',
  name: 'ZedUno Restaurant',
  address: {
    street: '123 Main Street',
    city: 'New York',
    state: 'NY',
    country: 'United States',
    zipCode: '10001',
    coordinates: {
      latitude: 40.7128,
      longitude: -74.0060
    }
  },
  contact: {
    phone: '+1 (555) 123-4567',
    email: 'info@zeduno.com',
    website: 'https://zeduno.com',
    socialMedia: {
      facebook: 'https://facebook.com/zeduno',
      instagram: 'https://instagram.com/zeduno'
    }
  },
  businessHours: [
    { dayOfWeek: 'monday', isOpen: true, openTime: '10:00', closeTime: '22:00' },
    { dayOfWeek: 'tuesday', isOpen: true, openTime: '10:00', closeTime: '22:00' },
    { dayOfWeek: 'wednesday', isOpen: true, openTime: '10:00', closeTime: '22:00' },
    { dayOfWeek: 'thursday', isOpen: true, openTime: '10:00', closeTime: '22:00' },
    { dayOfWeek: 'friday', isOpen: true, openTime: '10:00', closeTime: '23:00' },
    { dayOfWeek: 'saturday', isOpen: true, openTime: '09:00', closeTime: '23:00' },
    { dayOfWeek: 'sunday', isOpen: true, openTime: '09:00', closeTime: '21:00' }
  ],
  cuisine: ['American', 'Italian', 'Mediterranean'],
  capacity: {
    totalTables: 24,
    totalSeats: 96,
    deliveryRadius: 10
  },
  branding: {
    primaryColor: '#2563eb',
    secondaryColor: '#64748b',
    accentColor: '#10b981',
    fontFamily: 'Inter',
    theme: 'light'
  },
  operatingMode: 'all',
  // Additional branding fields
  logo: undefined, // Will be set via settings
  tagline: 'Premium Restaurant Experience',
  displayName: 'ZedUno Restaurant'
});

const generateMockUserSettings = (): UserSettings => ({
  id: 'user_settings_001',
  userId: 'user_001',
  preferences: {
    language: 'en',
    timezone: 'America/New_York',
    currency: 'KES',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
    theme: 'light',
    dashboardLayout: 'grid'
  },
  permissions: {
    role: 'admin',
    modules: {
      orders: 'admin',
      inventory: 'admin',
      payments: 'admin',
      reports: 'admin',
      staff: 'admin',
      settings: 'admin'
    }
  },
  notifications: {
    email: {
      enabled: true,
      newOrders: true,
      lowInventory: true,
      dailyReports: true,
      systemUpdates: true
    },
    push: {
      enabled: true,
      newOrders: true,
      orderUpdates: true,
      tableRequests: true,
      staffNotifications: true
    },
    sms: {
      enabled: false,
      orderConfirmations: false,
      deliveryUpdates: false,
      emergencyAlerts: true
    }
  }
});

const generateMockSystemSettings = (): SystemSettings => ({
  general: {
    systemName: 'HotelZed POS',
    version: '2.1.0',
    environment: 'production',
    timezone: 'America/New_York',
    language: 'en',
    currency: 'KES',
    taxRate: 8.5,
    serviceChargeRate: 0,
    orderNumberPrefix: 'ORD',
    autoLogoutMinutes: 30
  },
  security: {
    passwordPolicy: {
      minLength: 8,
      requireUppercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      expirationDays: 90
    },
    sessionSettings: {
      timeoutMinutes: 30,
      maxConcurrentSessions: 3,
      requireTwoFactor: false
    },
    auditLog: {
      enabled: true,
      retentionDays: 90,
      logLevel: 'detailed'
    },
    dataEncryption: {
      enabled: true,
      algorithm: 'AES-256'
    }
  },
  integrations: {
    pos: {
      enabled: false,
      provider: 'square'
    },
    paymentGateways: {
      stripe: {
        enabled: true,
        publicKey: 'pk_test_***',
        secretKey: 'sk_test_***',
        webhookSecret: 'whsec_***'
      }
    },
    deliveryServices: {},
    inventory: {
      enabled: false,
      provider: 'custom',
      syncInterval: 60
    },
    analytics: {
      googleAnalytics: {
        enabled: false,
        trackingId: ''
      }
    }
  },
  backup: {
    automated: {
      enabled: true,
      frequency: 'daily',
      time: '02:00',
      retentionDays: 30
    },
    storage: {
      provider: 'local',
      configuration: {}
    },
    encryption: {
      enabled: true
    }
  },
  maintenance: {
    maintenanceMode: {
      enabled: false,
      message: 'System is under maintenance. Please try again later.'
    },
    systemHealth: {
      monitoringEnabled: true,
      alertThresholds: {
        cpuUsage: 80,
        memoryUsage: 85,
        diskUsage: 90,
        responseTime: 2000
      },
      notificationChannels: ['email']
    },
    updates: {
      autoUpdate: false,
      updateChannel: 'stable',
      notifyUpdates: true
    }
  }
});

const generateMockUsers = (): SystemUser[] => [
  {
    id: 'user_001',
    username: 'admin',
    email: 'admin@hotelzed.com',
    firstName: 'John',
    lastName: 'Smith',
    role: {
      id: 'role_admin',
      name: 'Administrator',
      description: 'Full system access',
      permissions: {
        role: 'admin',
        modules: {
          orders: 'admin',
          inventory: 'admin',
          payments: 'admin',
          reports: 'admin',
          staff: 'admin',
          settings: 'admin'
        }
      },
      isDefault: false,
      createdAt: new Date('2024-01-01')
    },
    department: 'Management',
    isActive: true,
    lastLogin: new Date(),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date(),
    permissions: {
      role: 'admin',
      modules: {
        orders: 'admin',
        inventory: 'admin',
        payments: 'admin',
        reports: 'admin',
        staff: 'admin',
        settings: 'admin'
      }
    }
  },
  {
    id: 'user_002',
    username: 'manager1',
    email: 'manager@hotelzed.com',
    firstName: 'Sarah',
    lastName: 'Johnson',
    role: {
      id: 'role_manager',
      name: 'Manager',
      description: 'Restaurant management access',
      permissions: {
        role: 'manager',
        modules: {
          orders: 'admin',
          inventory: 'write',
          payments: 'write',
          reports: 'read',
          staff: 'write',
          settings: 'read'
        }
      },
      isDefault: false,
      createdAt: new Date('2024-01-01')
    },
    department: 'Management',
    isActive: true,
    lastLogin: new Date(Date.now() - 2 * 60 * 60 * 1000),
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date(),
    permissions: {
      role: 'manager',
      modules: {
        orders: 'admin',
        inventory: 'write',
        payments: 'write',
        reports: 'read',
        staff: 'write',
        settings: 'read'
      }
    }
  },
  {
    id: 'user_003',
    username: 'cashier1',
    email: 'cashier@hotelzed.com',
    firstName: 'Mike',
    lastName: 'Wilson',
    role: {
      id: 'role_cashier',
      name: 'Cashier',
      description: 'Order and payment processing',
      permissions: {
        role: 'cashier',
        modules: {
          orders: 'write',
          inventory: 'read',
          payments: 'write',
          reports: 'none',
          staff: 'none',
          settings: 'none'
        }
      },
      isDefault: false,
      createdAt: new Date('2024-01-01')
    },
    department: 'Service',
    isActive: true,
    lastLogin: new Date(Date.now() - 30 * 60 * 1000),
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date(),
    permissions: {
      role: 'cashier',
      modules: {
        orders: 'write',
        inventory: 'read',
        payments: 'write',
        reports: 'none',
        staff: 'none',
        settings: 'none'
      }
    }
  }
];

const generateMockSystemHealth = (): SystemHealth => ({
  status: 'healthy',
  uptime: 2592000, // 30 days in seconds
  metrics: {
    cpu: {
      usage: 45,
      cores: 4
    },
    memory: {
      used: 3200,
      total: 8192,
      percentage: 39
    },
    disk: {
      used: 25600,
      total: 102400,
      percentage: 25
    },
    network: {
      bytesIn: 1024000,
      bytesOut: 2048000
    }
  },
  services: {
    database: 'online',
    cache: 'online',
    storage: 'online',
    email: 'online'
  },
  lastCheck: new Date()
});

// Custom hooks
export const useRestaurantSettings = () => {
  return useQuery({
    queryKey: ['restaurant-settings'],
    queryFn: () => generateMockRestaurantSettings(),
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
};

export const useUserSettings = (userId?: string) => {
  return useQuery({
    queryKey: ['user-settings', userId],
    queryFn: () => generateMockUserSettings(),
    staleTime: 5 * 60 * 1000
  });
};

export const useSystemSettings = () => {
  return useQuery({
    queryKey: ['system-settings'],
    queryFn: () => generateMockSystemSettings(),
    staleTime: 10 * 60 * 1000 // 10 minutes
  });
};

export const useSystemUsers = () => {
  return useQuery({
    queryKey: ['system-users'],
    queryFn: () => generateMockUsers(),
    staleTime: 2 * 60 * 1000 // 2 minutes
  });
};

export const useSystemHealth = () => {
  return useQuery({
    queryKey: ['system-health'],
    queryFn: () => generateMockSystemHealth(),
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 15000 // Consider stale after 15 seconds
  });
};

export const useAuditLogs = (filters?: { startDate?: Date; endDate?: Date; userId?: string }) => {
  return useQuery({
    queryKey: ['audit-logs', filters],
    queryFn: () => {
      // Generate mock audit logs
      const actions = ['login', 'logout', 'order_created', 'order_updated', 'payment_processed', 'settings_updated'];
      const resources = ['user', 'order', 'payment', 'settings', 'inventory'];
      
      return Array.from({ length: 100 }, (_, i) => ({
        id: `log_${String(i + 1).padStart(3, '0')}`,
        userId: `user_00${Math.floor(Math.random() * 3) + 1}`,
        action: actions[Math.floor(Math.random() * actions.length)],
        resource: resources[Math.floor(Math.random() * resources.length)],
        resourceId: `res_${Math.floor(Math.random() * 1000)}`,
        details: {
          description: `User performed ${actions[Math.floor(Math.random() * actions.length)]} action`
        },
        ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        timestamp: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)),
        severity: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as 'low' | 'medium' | 'high'
      }));
    },
    staleTime: 60 * 1000 // 1 minute
  });
};

export const useBackupJobs = () => {
  return useQuery({
    queryKey: ['backup-jobs'],
    queryFn: () => {
      return Array.from({ length: 10 }, (_, i) => ({
        id: `backup_${String(i + 1).padStart(3, '0')}`,
        type: Math.random() > 0.7 ? 'manual' : 'automatic',
        status: ['completed', 'completed', 'completed', 'failed'][Math.floor(Math.random() * 4)] as 'completed' | 'failed',
        startTime: new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)),
        endTime: new Date(Date.now() - Math.floor(Math.random() * 29 * 24 * 60 * 60 * 1000)),
        size: Math.floor(Math.random() * 500) + 50, // MB
        location: '/backups/daily/',
        progress: 100
      }));
    },
    staleTime: 2 * 60 * 1000
  });
};

// Mutation hooks
export const useUpdateRestaurantSettings = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (settings: Partial<RestaurantSettings>) => {
      console.log('Updating restaurant settings:', settings);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return settings;
    },
    onSuccess: (data) => {
      console.log('Restaurant settings updated successfully:', data);
      queryClient.invalidateQueries({ queryKey: ['restaurant-settings'] });
      // Also invalidate tenant context to refresh header
      queryClient.invalidateQueries({ queryKey: ['tenant-context'] });
    },
    onError: (error) => {
      console.error('Failed to update restaurant settings:', error);
    }
  });
};

export const useUpdateUserSettings = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (settings: Partial<UserSettings>) => {
      await new Promise(resolve => setTimeout(resolve, 800));
      return settings;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user-settings', variables.userId] });
    }
  });
};

export const useUpdateSystemSettings = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (settings: Partial<SystemSettings>) => {
      await new Promise(resolve => setTimeout(resolve, 1500));
      return settings;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
    }
  });
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (userData: Partial<SystemUser>) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return {
        ...userData,
        id: `user_${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-users'] });
    }
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, userData }: { userId: string; userData: Partial<SystemUser> }) => {
      await new Promise(resolve => setTimeout(resolve, 800));
      return { userId, userData };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-users'] });
    }
  });
};

export const useCreateBackup = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (type: 'manual' | 'automatic') => {
      await new Promise(resolve => setTimeout(resolve, 3000));
      return {
        id: `backup_${Date.now()}`,
        type,
        status: 'completed',
        startTime: new Date(Date.now() - 3000),
        endTime: new Date(),
        size: Math.floor(Math.random() * 100) + 50
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backup-jobs'] });
    }
  });
};