export interface RestaurantSettings {
  id: string;
  name: string;
  address: Address;
  contact: ContactInfo;
  businessHours: BusinessHours[];
  cuisine: string[];
  capacity: {
    totalTables: number;
    totalSeats: number;
    deliveryRadius: number; // in kilometers
  };
  branding: BrandingSettings;
  operatingMode: 'dine-in' | 'takeaway' | 'delivery' | 'all';
  // Additional branding fields
  logo?: string;
  tagline?: string;
  displayName?: string;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface ContactInfo {
  phone: string;
  email: string;
  website?: string;
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
  };
}

export interface BusinessHours {
  dayOfWeek: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  isOpen: boolean;
  openTime: string; // HH:MM format
  closeTime: string; // HH:MM format
  breakStart?: string;
  breakEnd?: string;
}

export interface BrandingSettings {
  logo?: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
  theme: 'light' | 'dark' | 'auto';
}

export interface UserSettings {
  id: string;
  userId: string;
  preferences: UserPreferences;
  permissions: UserPermissions;
  notifications: NotificationSettings;
}

export interface UserPreferences {
  language: string;
  timezone: string;
  currency: string;
  dateFormat: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
  timeFormat: '12h' | '24h';
  theme: 'light' | 'dark' | 'auto';
  dashboardLayout: 'grid' | 'list' | 'compact';
}

export interface UserPermissions {
  role: 'admin' | 'manager' | 'staff' | 'cashier';
  modules: {
    orders: PermissionLevel;
    inventory: PermissionLevel;
    payments: PermissionLevel;
    reports: PermissionLevel;
    staff: PermissionLevel;
    settings: PermissionLevel;
  };
  restrictions?: {
    maxDiscountPercent?: number;
    canCancelOrders?: boolean;
    canRefundPayments?: boolean;
    canModifyPrices?: boolean;
  };
}

export type PermissionLevel = 'none' | 'read' | 'write' | 'admin';

export interface NotificationSettings {
  email: {
    enabled: boolean;
    newOrders: boolean;
    lowInventory: boolean;
    dailyReports: boolean;
    systemUpdates: boolean;
  };
  push: {
    enabled: boolean;
    newOrders: boolean;
    orderUpdates: boolean;
    tableRequests: boolean;
    staffNotifications: boolean;
  };
  sms: {
    enabled: boolean;
    orderConfirmations: boolean;
    deliveryUpdates: boolean;
    emergencyAlerts: boolean;
  };
}

export interface SystemSettings {
  general: GeneralSettings;
  security: SecuritySettings;
  integrations: IntegrationSettings;
  backup: BackupSettings;
  maintenance: MaintenanceSettings;
}

export interface GeneralSettings {
  systemName: string;
  version: string;
  environment: 'development' | 'staging' | 'production';
  timezone: string;
  language: string;
  currency: string;
  taxRate: number;
  serviceChargeRate: number;
  orderNumberPrefix: string;
  autoLogoutMinutes: number;
}

export interface SecuritySettings {
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
    expirationDays: number;
  };
  sessionSettings: {
    timeoutMinutes: number;
    maxConcurrentSessions: number;
    requireTwoFactor: boolean;
  };
  auditLog: {
    enabled: boolean;
    retentionDays: number;
    logLevel: 'basic' | 'detailed' | 'verbose';
  };
  dataEncryption: {
    enabled: boolean;
    algorithm: string;
  };
}

export interface IntegrationSettings {
  pos: {
    enabled: boolean;
    provider: string;
    apiKey?: string;
    endpoint?: string;
  };
  paymentGateways: {
    stripe?: {
      enabled: boolean;
      publicKey: string;
      secretKey: string;
      webhookSecret: string;
    };
    square?: {
      enabled: boolean;
      applicationId: string;
      accessToken: string;
    };
  };
  deliveryServices: {
    ubereats?: {
      enabled: boolean;
      storeId: string;
      apiKey: string;
    };
    doordash?: {
      enabled: boolean;
      storeId: string;
      developerKey: string;
    };
  };
  inventory: {
    enabled: boolean;
    provider: string;
    syncInterval: number; // minutes
  };
  analytics: {
    googleAnalytics?: {
      enabled: boolean;
      trackingId: string;
    };
    customAnalytics?: {
      enabled: boolean;
      endpoint: string;
    };
  };
}

export interface BackupSettings {
  automated: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly';
    time: string; // HH:MM format
    retentionDays: number;
  };
  storage: {
    provider: 'local' | 'aws-s3' | 'google-cloud' | 'azure';
    configuration: Record<string, any>;
  };
  encryption: {
    enabled: boolean;
    key?: string;
  };
}

export interface MaintenanceSettings {
  maintenanceMode: {
    enabled: boolean;
    message: string;
    allowedIPs?: string[];
  };
  systemHealth: {
    monitoringEnabled: boolean;
    alertThresholds: {
      cpuUsage: number;
      memoryUsage: number;
      diskUsage: number;
      responseTime: number;
    };
    notificationChannels: string[];
  };
  updates: {
    autoUpdate: boolean;
    updateChannel: 'stable' | 'beta' | 'alpha';
    notifyUpdates: boolean;
  };
}

export interface SystemUser {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  department: string;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  avatar?: string;
  permissions: UserPermissions;
}

export interface UserRole {
  id: string;
  name: string;
  description: string;
  permissions: UserPermissions;
  isDefault: boolean;
  createdAt: Date;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical';
  uptime: number;
  metrics: {
    cpu: {
      usage: number;
      cores: number;
    };
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
    disk: {
      used: number;
      total: number;
      percentage: number;
    };
    network: {
      bytesIn: number;
      bytesOut: number;
    };
  };
  services: {
    database: 'online' | 'offline' | 'degraded';
    cache: 'online' | 'offline' | 'degraded';
    storage: 'online' | 'offline' | 'degraded';
    email: 'online' | 'offline' | 'degraded';
  };
  lastCheck: Date;
}

export interface BackupJob {
  id: string;
  type: 'manual' | 'automatic';
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  startTime: Date;
  endTime?: Date;
  size?: number;
  location?: string;
  error?: string;
  progress?: number;
}