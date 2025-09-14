import mongoose, { Document, Schema } from 'mongoose';

export interface IEmailLog extends Document {
  tenantId: mongoose.Types.ObjectId;
  templateId?: mongoose.Types.ObjectId;
  recipientEmail: string;
  recipientName?: string;
  senderEmail: string;
  senderName?: string;
  subject: string;
  htmlContent?: string;
  textContent?: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'bounced' | 'complained';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  category: 'user' | 'order' | 'marketing' | 'system' | 'staff';
  type: string; // Template type or custom type
  metadata?: {
    orderId?: string;
    userId?: string;
    branchId?: string;
    campaignId?: string;
    [key: string]: any;
  };
  deliveryAttempts: number;
  lastAttemptAt?: Date;
  sentAt?: Date;
  deliveredAt?: Date;
  failedAt?: Date;
  errorMessage?: string;
  providerMessageId?: string;
  providerResponse?: any;
  scheduledFor?: Date; // For scheduled emails
  createdAt: Date;
  updatedAt: Date;
}

const EmailLogSchema = new Schema<IEmailLog>({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  templateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EmailTemplate'
  },
  recipientEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  recipientName: {
    type: String,
    trim: true
  },
  senderEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  senderName: {
    type: String,
    trim: true
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  htmlContent: {
    type: String
  },
  textContent: {
    type: String
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'delivered', 'failed', 'bounced', 'complained'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  category: {
    type: String,
    enum: ['user', 'order', 'marketing', 'system', 'staff'],
    required: true
  },
  type: {
    type: String,
    required: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  deliveryAttempts: {
    type: Number,
    default: 0
  },
  lastAttemptAt: {
    type: Date
  },
  sentAt: {
    type: Date
  },
  deliveredAt: {
    type: Date
  },
  failedAt: {
    type: Date
  },
  errorMessage: {
    type: String
  },
  providerMessageId: {
    type: String
  },
  providerResponse: {
    type: mongoose.Schema.Types.Mixed
  },
  scheduledFor: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
EmailLogSchema.index({ tenantId: 1, createdAt: -1 });
EmailLogSchema.index({ tenantId: 1, status: 1 });
EmailLogSchema.index({ tenantId: 1, category: 1 });
EmailLogSchema.index({ tenantId: 1, recipientEmail: 1 });
EmailLogSchema.index({ status: 1, scheduledFor: 1 }); // For scheduled email processing
EmailLogSchema.index({ status: 1, deliveryAttempts: 1 }); // For retry logic
EmailLogSchema.index({ createdAt: -1 }); // For cleanup tasks
EmailLogSchema.index({ 'metadata.orderId': 1 }); // For order-related emails
EmailLogSchema.index({ 'metadata.userId': 1 }); // For user-related emails

export const EmailLog = mongoose.model<IEmailLog>('EmailLog', EmailLogSchema);