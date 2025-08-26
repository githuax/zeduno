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

export interface MenuItem {
  _id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  image?: string;
  isAvailable: boolean;
  preparationTime: number;
  allergens?: string[];
  customizations?: MenuItemCustomization[];
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface OrderItemCustomization {
  name: string;
  option: string;
  price: number;
}

export interface OrderItem {
  _id?: string;
  menuItem: MenuItem | string;
  quantity: number;
  price: number;
  customizations?: OrderItemCustomization[];
  specialInstructions?: string;
  status: ItemStatus;
}

export interface DeliveryAddress {
  street: string;
  city: string;
  zipCode: string;
  instructions?: string;
}

export interface SplitBill {
  billNumber: number;
  items: OrderItem[];
  total: number;
  paymentStatus: 'pending' | 'paid';
}

export interface Table {
  _id: string;
  tableNumber: string;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved' | 'maintenance';
  currentOrderId?: string;
  floor: number;
  section: string;
  position?: {
    x: number;
    y: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  _id: string;
  orderNumber: string;
  orderType: OrderType;
  status: OrderStatus;
  tableId?: Table | string;
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  deliveryAddress?: DeliveryAddress;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  serviceCharge?: number;
  discount?: number;
  total: number;
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
  splitBills?: SplitBill[];
  mergedFromOrders?: string[];
  staffId: {
    _id: string;
    name: string;
  } | string;
  adjustments?: {
    type: 'add' | 'remove' | 'replace' | 'modify';
    itemId?: string;
    reason: string;
    timestamp: string;
    details?: string;
  }[];
  adjustmentNotes?: string;
  notes?: string;
  estimatedTime?: string;
  completedAt?: string;
  kitchenPrintedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderInput {
  orderType: OrderType;
  tableId?: string;
  staffId?: string; // ID of the staff member who created the order
  customerName: string;
  customerPhone?: string;
  deliveryAddress?: DeliveryAddress;
  items: {
    menuItem: string;
    quantity: number;
    customizations?: OrderItemCustomization[];
    specialInstructions?: string;
  }[];
  discount?: number;
  notes?: string;
}

export interface UpdateOrderInput extends Partial<CreateOrderInput> {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  paymentMethod?: PaymentMethod;
}

export interface KitchenOrder {
  orderNumber: string;
  orderType: OrderType;
  table: string | null;
  timestamp: string;
  items: {
    name: string;
    quantity: number;
    customizations?: OrderItemCustomization[];
    specialInstructions?: string;
    status: ItemStatus;
  }[];
  notes?: string;
  priority: 'HIGH' | 'NORMAL' | 'LOW';
}