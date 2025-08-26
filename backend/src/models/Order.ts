import mongoose, { Document, Schema } from 'mongoose';

export interface IOrderItem {
  _id?: mongoose.Types.ObjectId;
  menuItem: mongoose.Types.ObjectId;
  quantity: number;
  price: number;
  customizations?: {
    name: string;
    option: string;
    price: number;
  }[];
  specialInstructions?: string;
  status: 'pending' | 'preparing' | 'ready' | 'served' | 'cancelled';
}

export interface IOrder extends Document {
  tenantId: mongoose.Types.ObjectId;
  orderNumber: string;
  orderType: 'dine-in' | 'takeaway' | 'delivery';
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'out-for-delivery' | 'delivered' | 'completed' | 'cancelled' | 'refunded';
  tableId?: mongoose.Types.ObjectId;
  customerId?: mongoose.Types.ObjectId;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  
  // Enhanced Delivery Information
  deliveryAddress?: {
    street: string;
    city: string;
    state?: string;
    zipCode: string;
    country?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
    instructions?: string;
  };
  deliveryInfo?: {
    estimatedTime: Date;
    actualTime?: Date;
    driverId?: mongoose.Types.ObjectId;
    driverName?: string;
    driverPhone?: string;
    trackingUrl?: string;
    deliveryFee: number;
  };
  
  items: IOrderItem[];
  subtotal: number;
  tax: number;
  taxRate?: number;
  serviceCharge?: number;
  discount?: {
    type: 'percentage' | 'fixed';
    value: number;
    code?: string;
  };
  tip?: number;
  total: number;
  
  // Enhanced Payment Information
  paymentStatus: 'pending' | 'paid' | 'partial' | 'refunded' | 'failed';
  paymentMethod?: 'cash' | 'card' | 'upi' | 'wallet' | 'online' | 'mpesa' | 'stripe' | 'square';
  paidAt?: Date;
  paymentDetails?: {
    transactionId?: string;
    gateway?: string;
    paidAt?: Date;
    refundedAt?: Date;
    refundAmount?: number;
  };
  
  splitBills?: {
    billNumber: number;
    items: IOrderItem[];
    total: number;
    paymentStatus: 'pending' | 'paid';
  }[];
  mergedFromOrders?: string[];
  
  // Staff and Kitchen Information
  staffId: mongoose.Types.ObjectId;
  preparationTime?: number; // in minutes
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  kitchenNotes?: string;
  
  // Platform and Source
  source: 'website' | 'app' | 'phone' | 'walk-in' | 'third-party';
  platform?: string; // e.g., 'uber-eats', 'doordash'
  platformOrderId?: string;
  
  // Customer Feedback
  rating?: number;
  review?: string;
  feedbackSubmittedAt?: Date;
  
  // Status History
  statusHistory?: {
    status: string;
    timestamp: Date;
    updatedBy?: mongoose.Types.ObjectId;
    notes?: string;
  }[];
  
  // Order Adjustments
  adjustments?: {
    type: 'add' | 'remove' | 'replace' | 'modify';
    itemId?: string;
    reason: string;
    timestamp: Date;
    details?: string;
  }[];
  adjustmentNotes?: string;
  
  notes?: string;
  tags?: string[];
  estimatedTime?: Date;
  completedAt?: Date;
  kitchenPrintedAt?: Date;
  cancelReason?: string;
  cancelledBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  updateStatus?(newStatus: string, userId?: mongoose.Types.ObjectId, notes?: string): Promise<IOrder>;
  calculateTotal?(): number;
}

const OrderItemSchema = new Schema({
  menuItem: {
    type: Schema.Types.ObjectId,
    ref: 'MenuItem',
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  price: {
    type: Number,
    required: true,
  },
  customizations: [{
    name: String,
    option: String,
    price: Number,
  }],
  specialInstructions: String,
  status: {
    type: String,
    enum: ['pending', 'preparing', 'ready', 'served', 'cancelled'],
    default: 'pending',
  },
});

const OrderSchema: Schema = new Schema(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    orderNumber: {
      type: String,
      required: true,
      unique: true,
    },
    orderType: {
      type: String,
      enum: ['dine-in', 'takeaway', 'delivery'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'preparing', 'ready', 'out-for-delivery', 'delivered', 'completed', 'cancelled', 'refunded'],
      default: 'pending',
      index: true,
    },
    tableId: {
      type: Schema.Types.ObjectId,
      ref: 'Table',
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    customerName: {
      type: String,
      required: true,
    },
    customerEmail: String,
    customerPhone: String,
    deliveryAddress: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
      coordinates: {
        latitude: Number,
        longitude: Number,
      },
      instructions: String,
    },
    deliveryInfo: {
      estimatedTime: Date,
      actualTime: Date,
      driverId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
      driverName: String,
      driverPhone: String,
      trackingUrl: String,
      deliveryFee: {
        type: Number,
        default: 0,
      },
    },
    items: [OrderItemSchema],
    subtotal: {
      type: Number,
      required: true,
    },
    tax: {
      type: Number,
      required: true,
    },
    taxRate: {
      type: Number,
      default: 0,
    },
    serviceCharge: {
      type: Number,
      default: 0,
    },
    discount: {
      type: {
        type: String,
        enum: ['percentage', 'fixed'],
      },
      value: Number,
      code: String,
    },
    tip: {
      type: Number,
      default: 0,
    },
    total: {
      type: Number,
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'partial', 'refunded', 'failed'],
      default: 'pending',
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'upi', 'wallet', 'online', 'mpesa', 'stripe', 'square'],
    },
    paidAt: {
      type: Date,
    },
    paymentDetails: {
      transactionId: String,
      gateway: String,
      paidAt: Date,
      refundedAt: Date,
      refundAmount: Number,
    },
    splitBills: [{
      billNumber: Number,
      items: [OrderItemSchema],
      total: Number,
      paymentStatus: {
        type: String,
        enum: ['pending', 'paid'],
        default: 'pending',
      },
    }],
    mergedFromOrders: [String],
    staffId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    preparationTime: {
      type: Number,
      default: 30, // default 30 minutes
    },
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'],
      default: 'normal',
    },
    kitchenNotes: String,
    source: {
      type: String,
      enum: ['website', 'app', 'phone', 'walk-in', 'third-party'],
      required: true,
      default: 'website',
      index: true,
    },
    platform: String,
    platformOrderId: String,
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    review: String,
    feedbackSubmittedAt: Date,
    statusHistory: [{
      status: {
        type: String,
        required: true,
      },
      timestamp: {
        type: Date,
        default: Date.now,
      },
      updatedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
      notes: String,
    }],
    adjustments: [{
      type: {
        type: String,
        enum: ['add', 'remove', 'replace', 'modify'],
        required: true,
      },
      itemId: String,
      reason: {
        type: String,
        required: true,
      },
      timestamp: {
        type: Date,
        default: Date.now,
      },
      details: String,
    }],
    adjustmentNotes: String,
    notes: String,
    tags: [String],
    estimatedTime: Date,
    completedAt: Date,
    kitchenPrintedAt: Date,
    cancelReason: String,
    cancelledBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
OrderSchema.index({ tenantId: 1, createdAt: -1 });
OrderSchema.index({ tenantId: 1, orderType: 1 });
OrderSchema.index({ customerId: 1, createdAt: -1 });
OrderSchema.index({ 'paymentStatus': 1 });

OrderSchema.pre('save', function(next) {
  if (this.isNew) {
    const date = new Date();
    const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.orderNumber = `ORD-${dateStr}-${random}`;
    
    // Add initial status to history
    const statusHistory = this.statusHistory || [];
    if (!Array.isArray(statusHistory) || statusHistory.length === 0) {
      this.statusHistory = [{
        status: this.status,
        timestamp: new Date(),
        notes: 'Order created'
      }] as any;
    }
    
    // Calculate estimated time if not set
    if (!this.estimatedTime && this.preparationTime) {
      const prepTime = Number(this.preparationTime);
      this.estimatedTime = new Date(Date.now() + prepTime * 60 * 1000);
    }
  }
  next();
});

// Method to update order status with history tracking
OrderSchema.methods.updateStatus = function(
  newStatus: string, 
  userId?: mongoose.Types.ObjectId, 
  notes?: string
) {
  this.status = newStatus;
  this.statusHistory.push({
    status: newStatus,
    timestamp: new Date(),
    updatedBy: userId,
    notes
  });
  
  // Update actual times based on status
  if (newStatus === 'completed') {
    this.completedAt = new Date();
  } else if (newStatus === 'delivered' && this.deliveryInfo) {
    this.deliveryInfo.actualTime = new Date();
  }
  
  return this.save();
};

// Method to calculate total
OrderSchema.methods.calculateTotal = function() {
  // Calculate subtotal from items
  this.subtotal = this.items.reduce((sum: number, item: any) => {
    const itemSubtotal = item.price * item.quantity;
    const customizationsCost = item.customizations 
      ? item.customizations.reduce((cSum: number, c: any) => cSum + (c.price || 0), 0) * item.quantity
      : 0;
    return sum + itemSubtotal + customizationsCost;
  }, 0);
  
  // Calculate tax
  this.tax = this.subtotal * (this.taxRate || 0) / 100;
  
  // Start with subtotal + tax
  let total = this.subtotal + this.tax;
  
  // Add delivery fee if applicable
  if (this.orderType === 'delivery' && this.deliveryInfo?.deliveryFee) {
    total += this.deliveryInfo.deliveryFee;
  }
  
  // Add service charge if applicable
  if (this.serviceCharge) {
    total += this.serviceCharge;
  }
  
  // Apply discount
  if (this.discount) {
    if (this.discount.type === 'percentage') {
      total -= (this.subtotal * (this.discount.value / 100));
    } else {
      total -= this.discount.value;
    }
  }
  
  // Add tip if provided
  if (this.tip) {
    total += this.tip;
  }
  
  this.total = Math.max(0, total); // Ensure total is never negative
  return this.total;
};

export const Order = mongoose.model<IOrder>('Order', OrderSchema);
export default Order;