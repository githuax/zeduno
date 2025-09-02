export interface Tenant {
  id: string;
  name: string;
  slug: string; // Used for subdomain routing (e.g., "restaurant1.hotelzed.com")
  domain?: string; // Custom domain (e.g., "restaurant.com")
  status: TenantStatus;
  plan: SubscriptionPlan;
  settings: TenantSettings;
  contact: TenantContact;
  billing: BillingInfo;
  limits: TenantLimits;
  features: TenantFeatures;
  createdAt: Date;
  updatedAt: Date;
  trialEndsAt?: Date;
  suspendedAt?: Date;
  deletedAt?: Date;
}

export type TenantStatus = 'active' | 'trial' | 'suspended' | 'cancelled' | 'pending';

export interface SubscriptionPlan {
  id: string;
  name: 'starter' | 'professional' | 'enterprise' | 'custom';
  displayName: string;
  price: number;
  currency: string;
  billingCycle: 'monthly' | 'yearly';
  features: string[];
  limits: PlanLimits;
}

export interface PlanLimits {
  maxUsers: number;
  maxTables: number;
  maxOrders: number;
  maxMenuItems: number;
  storageGB: number;
  supportLevel: 'basic' | 'priority' | '24/7';
  customBranding: boolean;
  apiAccess: boolean;
  advancedAnalytics: boolean;
}

export interface TenantSettings {
  timezone: string;
  currency: string;
  language: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  defaultTaxRate: number;
  serviceChargeRate: number;
  allowGuestCheckout: boolean;
  requireEmailVerification: boolean;
  enableNotifications: boolean;
  maintenanceMode: boolean;
  customCSS?: string;
  // Branding & Logo settings
  logo?: string; // URL or base64 of the logo image
  logoUpload?: File; // For handling file uploads
  favicon?: string; // URL or base64 of the favicon
  brandingColors?: {
    primary: string;
    secondary: string;
    accent: string;
  };
  tagline?: string; // Business tagline/slogan
  displayName?: string; // Display name (can be different from tenant name)
}

export interface TenantContact {
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  company: string;
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
  };
}

export interface BillingInfo {
  customerId?: string; // Stripe/payment provider customer ID
  subscriptionId?: string;
  paymentMethodId?: string;
  nextBillingDate?: Date;
  billingEmail: string;
  invoiceHistory: Invoice[];
}

export interface Invoice {
  id: string;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'failed' | 'cancelled';
  description: string;
  createdAt: Date;
  paidAt?: Date;
  downloadUrl?: string;
}

export interface TenantLimits {
  currentUsers: number;
  currentTables: number;
  currentOrders: number;
  currentMenuItems: number;
  storageUsedGB: number;
}

export interface TenantFeatures {
  multiLocation: boolean;
  customDomain: boolean;
  whiteLabel: boolean;
  apiAccess: boolean;
  customIntegrations: boolean;
  advancedReporting: boolean;
  prioritySupport: boolean;
  sso: boolean;
  auditLogs: boolean;
  dataExport: boolean;
}

// User types with tenant context
export interface TenantUser {
  id: string;
  tenantId: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  role: TenantUserRole;
  permissions: TenantUserPermissions;
  status: 'active' | 'invited' | 'suspended';
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  invitedBy?: string;
  twoFactorEnabled: boolean;
}

export interface TenantUserRole {
  id: string;
  tenantId: string;
  name: string;
  displayName: string;
  description: string;
  permissions: TenantUserPermissions;
  isSystem: boolean; // Can't be deleted
  isDefault: boolean;
  createdAt: Date;
}

export interface TenantUserPermissions {
  // Restaurant Operations
  orders: {
    create: boolean;
    read: boolean;
    update: boolean;
    delete: boolean;
    refund: boolean;
  };
  menu: {
    create: boolean;
    read: boolean;
    update: boolean;
    delete: boolean;
    pricing: boolean;
  };
  inventory: {
    create: boolean;
    read: boolean;
    update: boolean;
    delete: boolean;
    purchase: boolean;
  };
  tables: {
    create: boolean;
    read: boolean;
    update: boolean;
    delete: boolean;
    reservations: boolean;
  };
  customers: {
    create: boolean;
    read: boolean;
    update: boolean;
    delete: boolean;
    export: boolean;
  };
  payments: {
    process: boolean;
    refund: boolean;
    view: boolean;
    settings: boolean;
  };
  
  // Analytics & Reporting
  reports: {
    sales: boolean;
    inventory: boolean;
    staff: boolean;
    customer: boolean;
    financial: boolean;
    export: boolean;
  };
  analytics: {
    view: boolean;
    export: boolean;
    advanced: boolean;
  };
  
  // Staff Management
  staff: {
    create: boolean;
    read: boolean;
    update: boolean;
    delete: boolean;
    schedules: boolean;
    payroll: boolean;
  };
  
  // System Administration
  settings: {
    restaurant: boolean;
    system: boolean;
    integrations: boolean;
    billing: boolean;
    users: boolean;
    security: boolean;
  };
  
  // Advanced Features
  api: {
    access: boolean;
    manage: boolean;
  };
  backup: {
    create: boolean;
    restore: boolean;
    schedule: boolean;
  };
}

// Tenant-aware base interface for all entities
export interface TenantAware {
  tenantId: string;
}

// Organization structure for multi-location tenants
export interface Organization extends TenantAware {
  id: string;
  tenantId: string;
  name: string;
  type: 'restaurant' | 'chain' | 'franchise' | 'cloud-kitchen';
  parentId?: string; // For hierarchical organizations
  locations: Location[];
  settings: OrganizationSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface Location extends TenantAware {
  id: string;
  tenantId: string;
  organizationId: string;
  name: string;
  code: string; // Unique code within tenant
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  contact: {
    phone: string;
    email: string;
    manager: string;
  };
  businessHours: BusinessHours[];
  capacity: {
    tables: number;
    seats: number;
    deliveryRadius: number;
  };
  features: LocationFeatures;
  status: 'active' | 'inactive' | 'maintenance';
  createdAt: Date;
  updatedAt: Date;
}

export interface LocationFeatures {
  dineIn: boolean;
  takeaway: boolean;
  delivery: boolean;
  reservations: boolean;
  onlineOrdering: boolean;
  paymentProcessing: boolean;
}

export interface BusinessHours {
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6; // Sunday = 0
  isOpen: boolean;
  openTime: string;
  closeTime: string;
  breakStart?: string;
  breakEnd?: string;
}

export interface OrganizationSettings extends TenantAware {
  id: string;
  tenantId: string;
  organizationId: string;
  branding: {
    logo?: string;
    primaryColor: string;
    secondaryColor: string;
    theme: 'light' | 'dark' | 'auto';
  };
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  integrations: {
    pos: IntegrationConfig;
    payments: IntegrationConfig[];
    delivery: IntegrationConfig[];
    marketing: IntegrationConfig[];
  };
}

export interface IntegrationConfig {
  provider: string;
  enabled: boolean;
  credentials: Record<string, string>;
  settings: Record<string, any>;
  lastSyncAt?: Date;
}

// Tenant context for the application
export interface TenantContext {
  tenant: Tenant;
  currentLocation?: Location;
  user: TenantUser;
  permissions: TenantUserPermissions;
  subscription: {
    plan: SubscriptionPlan;
    usage: TenantLimits;
    features: TenantFeatures;
  };
}

// Tenant invitation system
export interface TenantInvitation {
  id: string;
  tenantId: string;
  email: string;
  roleId: string;
  invitedBy: string;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  token: string;
  expiresAt: Date;
  createdAt: Date;
  acceptedAt?: Date;
}

// Tenant audit log
export interface TenantAuditLog extends TenantAware {
  id: string;
  tenantId: string;
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  changes?: Record<string, any>;
  metadata: {
    userAgent: string;
    ipAddress: string;
    location?: string;
  };
  timestamp: Date;
}

// Subscription management
export interface SubscriptionChange {
  id: string;
  tenantId: string;
  fromPlanId: string;
  toPlanId: string;
  changeType: 'upgrade' | 'downgrade' | 'cancel' | 'reactivate';
  effectiveDate: Date;
  prorationAmount?: number;
  reason?: string;
  requestedBy: string;
  createdAt: Date;
}