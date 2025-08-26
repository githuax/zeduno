import mongoose, { Document, Schema } from 'mongoose';

export interface IPaymentTransaction extends Document {
  tenantId: mongoose.Types.ObjectId;
  orderId: mongoose.Types.ObjectId;
  paymentMethod: 'mpesa' | 'stripe' | 'square' | 'cash';
  
  // Common payment fields
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded';
  
  // Customer information
  customerPhone?: string;
  customerName?: string;
  customerEmail?: string;
  
  // Payment gateway specific data
  gatewayTransactionId?: string;
  gatewayResponse?: any;
  
  // M-Pesa specific fields
  mpesaData?: {
    merchantRequestId?: string;
    checkoutRequestId?: string;
    mpesaReceiptNumber?: string;
    phoneNumber?: string;
    accountReference?: string;
    transactionDesc?: string;
  };
  
  // Stripe specific fields
  stripeData?: {
    paymentIntentId?: string;
    paymentMethodId?: string;
    clientSecret?: string;
  };
  
  // Square specific fields
  squareData?: {
    paymentId?: string;
    locationId?: string;
    sourceId?: string;
  };
  
  // Transaction metadata
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
    processedBy?: mongoose.Types.ObjectId; // Staff member who processed
    notes?: string;
    refundReason?: string;
  };
  
  // Timestamps
  initiatedAt: Date;
  completedAt?: Date;
  failedAt?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

const paymentTransactionSchema = new Schema<IPaymentTransaction>(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: ['mpesa', 'stripe', 'square', 'cash'],
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
      default: 'KES',
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'],
      default: 'pending',
      index: true,
    },
    customerPhone: {
      type: String,
      trim: true,
    },
    customerName: {
      type: String,
      trim: true,
    },
    customerEmail: {
      type: String,
      lowercase: true,
      trim: true,
    },
    gatewayTransactionId: {
      type: String,
      index: true,
    },
    gatewayResponse: {
      type: Schema.Types.Mixed,
    },
    mpesaData: {
      merchantRequestId: String,
      checkoutRequestId: {
        type: String,
        index: true,
      },
      mpesaReceiptNumber: {
        type: String,
        index: true,
      },
      phoneNumber: String,
      accountReference: String,
      transactionDesc: String,
    },
    stripeData: {
      paymentIntentId: {
        type: String,
        index: true,
      },
      paymentMethodId: String,
      clientSecret: String,
    },
    squareData: {
      paymentId: {
        type: String,
        index: true,
      },
      locationId: String,
      sourceId: String,
    },
    metadata: {
      ipAddress: String,
      userAgent: String,
      processedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
      notes: String,
      refundReason: String,
    },
    initiatedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    completedAt: Date,
    failedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
paymentTransactionSchema.index({ tenantId: 1, status: 1, createdAt: -1 });
paymentTransactionSchema.index({ tenantId: 1, paymentMethod: 1, status: 1 });
paymentTransactionSchema.index({ orderId: 1, status: 1 });

// Instance methods
paymentTransactionSchema.methods.markAsProcessing = function() {
  this.status = 'processing';
  return this.save();
};

// Static methods
paymentTransactionSchema.statics.findByOrder = function(orderId: string) {
  return this.find({ orderId }).sort({ createdAt: -1 });
};

paymentTransactionSchema.statics.findByTenant = function(tenantId: string, filters: any = {}) {
  return this.find({ tenantId, ...filters }).sort({ createdAt: -1 });
};

export const PaymentTransaction = mongoose.model<IPaymentTransaction>('PaymentTransaction', paymentTransactionSchema);
export default PaymentTransaction;