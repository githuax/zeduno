// Multitenant-aware order types extending the original types
import { TenantAware } from './tenant.types';

export type OrderType = 'dine-in' | 'takeaway' | 'delivery';
export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'partial' | 'refunded';
export type PaymentMethod = 'cash' | 'card' | 'upi' | 'wallet';
export type ItemStatus = 'pending' | 'preparing' | 'ready' | 'served' | 'cancelled';

export interface MenuItemCustomization {
  name: string;
  options: {
    name: string;
    price: number;
  }[];
}

export interface MenuItem extends TenantAware {
  _id: string;
  tenantId: string;
  locationId?: string;
  name: string;
  description: string;
  category: string;
  categoryId?: string;
  price: number;
  costPrice?: number;
  image?: string;
  isAvailable: boolean;
  preparationTime: number;
  allergens?: string[];
  dietaryTags?: string[]; // vegetarian, vegan, gluten-free, etc.
  customizations?: MenuItemCustomization[];
  tags?: string[];
  sku?: string;
  trackInventory: boolean;
  currentStock?: number;
  lowStockThreshold?: number;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItemCustomization {
  name: string;
  option: string;
  price: number;
}

export interface OrderItem extends TenantAware {
  _id?: string;
  tenantId: string;
  orderId: string;
  menuItem: MenuItem | string;
  quantity: number;
  price: number;
  totalPrice: number;
  customizations?: OrderItemCustomization[];
  specialInstructions?: string;
  status: ItemStatus;
  kitchenNotes?: string;
  preparedBy?: string;
  preparedAt?: Date;
}

export interface DeliveryAddress {
  street: string;
  city: string;
  state?: string;
  zipCode: string;
  country?: string;
  instructions?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface SplitBill extends TenantAware {
  id: string;
  tenantId: string;
  orderId: string;
  billNumber: number;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  serviceCharge: number;
  total: number;
  paymentStatus: 'pending' | 'paid';
  paymentMethod?: PaymentMethod;
  paidAt?: Date;
}

export interface Table extends TenantAware {
  _id: string;
  tenantId: string;
  locationId: string;
  tableNumber: string;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved' | 'maintenance';
  currentOrderId?: string;
  currentCustomerCount?: number;
  floor: number;
  section: string;
  position?: {
    x: number;
    y: number;
  };
  reservedBy?: string;
  reservedUntil?: Date;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Customer extends TenantAware {
  _id: string;
  tenantId: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone: string;
  address?: DeliveryAddress;
  dateOfBirth?: Date;
  dietaryPreferences?: string[];
  allergens?: string[];
  notes?: string;
  totalOrders: number;
  totalSpent: number;
  averageRating?: number;
  loyaltyPoints?: number;
  preferredLocation?: string;
  marketingConsent: boolean;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Order extends TenantAware {
  _id: string;
  tenantId: string;
  locationId?: string;
  orderNumber: string;
  orderType: OrderType;
  status: OrderStatus;
  
  // Customer information
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  
  // Table information (for dine-in)
  tableId?: Table | string;
  guestCount?: number;
  
  // Delivery information
  deliveryAddress?: DeliveryAddress;
  deliveryFee?: number;
  deliveryInstructions?: string;
  estimatedDeliveryTime?: Date;
  deliveredAt?: Date;
  deliveredBy?: string;
  
  // Order items
  items: OrderItem[];
  
  // Financial breakdown
  subtotal: number;
  tax: number;
  taxRate: number;
  serviceCharge?: number;
  serviceChargeRate?: number;
  deliveryFeeAmount?: number;
  discount?: number;
  discountType?: 'amount' | 'percentage';
  discountCode?: string;
  tipAmount?: number;
  total: number;
  
  // Payment information
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
  paymentReference?: string;
  paidAt?: Date;
  
  // Split billing
  splitBills?: SplitBill[];
  mergedFromOrders?: string[];
  
  // Staff and workflow
  createdBy: string; // User ID
  assignedTo?: string; // User ID
  staffNotes?: string;
  
  // Timing
  estimatedPrepTime?: number; // minutes
  prepStartedAt?: Date;
  readyAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  cancellationReason?: string;
  
  // Kitchen workflow
  kitchenStatus?: 'pending' | 'in-progress' | 'ready' | 'served';
  kitchenNotes?: string;
  kitchenPrintedAt?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  
  // Special instructions and notes
  notes?: string;
  allergenInfo?: string[];
  specialRequests?: string;
  
  // Source tracking
  source: 'pos' | 'online' | 'phone' | 'mobile-app' | 'third-party';
  sourceDetails?: string;
  
  // Loyalty and promotions
  loyaltyPointsEarned?: number;
  loyaltyPointsUsed?: number;
  promotionsApplied?: string[];
  
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderInput extends TenantAware {
  tenantId: string;
  locationId?: string;
  orderType: OrderType;
  
  // Customer information
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  
  // Table/delivery info
  tableId?: string;
  guestCount?: number;
  deliveryAddress?: DeliveryAddress;
  
  // Items
  items: {
    menuItem: string;
    quantity: number;
    customizations?: OrderItemCustomization[];
    specialInstructions?: string;
  }[];
  
  // Pricing
  discount?: number;
  discountType?: 'amount' | 'percentage';
  discountCode?: string;
  tipAmount?: number;
  
  // Additional info
  notes?: string;
  specialRequests?: string;
  source?: 'pos' | 'online' | 'phone' | 'mobile-app' | 'third-party';
}

export interface UpdateOrderInput extends Partial<CreateOrderInput> {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  paymentMethod?: PaymentMethod;
  kitchenStatus?: 'pending' | 'in-progress' | 'ready' | 'served';
  assignedTo?: string;
  staffNotes?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

export interface KitchenOrder extends TenantAware {
  tenantId: string;
  locationId?: string;
  orderNumber: string;
  orderType: OrderType;
  table: string | null;
  customerName: string;
  timestamp: string;
  priority: 'HIGH' | 'NORMAL' | 'LOW';
  estimatedTime: number;
  specialRequests?: string;
  allergenInfo?: string[];
  items: {
    id: string;
    name: string;
    quantity: number;
    customizations?: OrderItemCustomization[];
    specialInstructions?: string;
    status: ItemStatus;
    allergens?: string[];
    dietaryTags?: string[];
    prepTime: number;
  }[];
  notes?: string;
  guestCount?: number;
}

// Analytics and reporting interfaces
export interface OrderAnalytics extends TenantAware {
  tenantId: string;
  locationId?: string;
  period: {
    start: Date;
    end: Date;
  };
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  ordersByType: {
    type: OrderType;
    count: number;
    revenue: number;
  }[];
  ordersByStatus: {
    status: OrderStatus;
    count: number;
  }[];
  paymentMethodBreakdown: {
    method: PaymentMethod;
    count: number;
    amount: number;
  }[];
  popularItems: {
    itemId: string;
    itemName: string;
    quantity: number;
    revenue: number;
  }[];
  peakHours: {
    hour: number;
    orderCount: number;
    revenue: number;
  }[];
  customerMetrics: {
    newCustomers: number;
    returningCustomers: number;
    averageCustomerValue: number;
  };
}

// Order filters for queries
export interface OrderFilters extends TenantAware {
  tenantId: string;
  locationId?: string;
  status?: OrderStatus[];
  orderType?: OrderType[];
  paymentStatus?: PaymentStatus[];
  customerId?: string;
  tableId?: string;
  assignedTo?: string;
  createdBy?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  source?: ('pos' | 'online' | 'phone' | 'mobile-app' | 'third-party')[];
  minAmount?: number;
  maxAmount?: number;
  searchTerm?: string; // Search in order number, customer name, phone
}

// Real-time order updates
export interface OrderUpdate extends TenantAware {
  tenantId: string;
  orderId: string;
  type: 'status_change' | 'item_status_change' | 'payment_update' | 'assignment_change';
  data: {
    field: string;
    oldValue: any;
    newValue: any;
    updatedBy: string;
    timestamp: Date;
  };
}

// Queue management for kitchen
export interface KitchenQueue extends TenantAware {
  tenantId: string;
  locationId: string;
  orders: (KitchenOrder & {
    waitTime: number; // minutes since order was placed
    estimatedCompletion: Date;
  })[];
  averageWaitTime: number;
  totalActiveOrders: number;
}

// Delivery tracking
export interface DeliveryTracking extends TenantAware {
  tenantId: string;
  orderId: string;
  driverId?: string;
  driverName?: string;
  driverPhone?: string;
  status: 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'failed';
  estimatedDeliveryTime: Date;
  actualDeliveryTime?: Date;
  trackingUpdates: {
    status: string;
    timestamp: Date;
    location?: {
      latitude: number;
      longitude: number;
    };
    notes?: string;
  }[];
  deliveryFeedback?: {
    rating: number;
    comment?: string;
    issues?: string[];
  };
}