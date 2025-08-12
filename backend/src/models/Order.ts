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
  orderNumber: string;
  orderType: 'dine-in' | 'takeaway' | 'delivery';
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  tableId?: mongoose.Types.ObjectId;
  customerId?: mongoose.Types.ObjectId;
  customerName: string;
  customerPhone?: string;
  deliveryAddress?: {
    street: string;
    city: string;
    zipCode: string;
    instructions?: string;
  };
  items: IOrderItem[];
  subtotal: number;
  tax: number;
  serviceCharge?: number;
  discount?: number;
  total: number;
  paymentStatus: 'pending' | 'paid' | 'partial' | 'refunded';
  paymentMethod?: 'cash' | 'card' | 'upi' | 'wallet';
  splitBills?: {
    billNumber: number;
    items: IOrderItem[];
    total: number;
    paymentStatus: 'pending' | 'paid';
  }[];
  mergedFromOrders?: string[];
  staffId: mongoose.Types.ObjectId;
  notes?: string;
  estimatedTime?: Date;
  completedAt?: Date;
  kitchenPrintedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
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
      enum: ['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'],
      default: 'pending',
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
    customerPhone: String,
    deliveryAddress: {
      street: String,
      city: String,
      zipCode: String,
      instructions: String,
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
    serviceCharge: {
      type: Number,
      default: 0,
    },
    discount: {
      type: Number,
      default: 0,
    },
    total: {
      type: Number,
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'partial', 'refunded'],
      default: 'pending',
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'upi', 'wallet'],
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
    notes: String,
    estimatedTime: Date,
    completedAt: Date,
    kitchenPrintedAt: Date,
  },
  {
    timestamps: true,
  }
);

OrderSchema.pre('save', function(next) {
  if (this.isNew) {
    const date = new Date();
    const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.orderNumber = `ORD-${dateStr}-${random}`;
  }
  next();
});

export default mongoose.model<IOrder>('Order', OrderSchema);