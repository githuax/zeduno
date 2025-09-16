import mongoose, { Document, Schema } from 'mongoose';

export interface IEmailTemplate extends Document {
  tenantId: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  subject: string;
  htmlTemplate: string;
  textTemplate?: string;
  variables: string[]; // Array of variable names used in template
  category: 'user' | 'order' | 'marketing' | 'system' | 'staff';
  type: 'welcome' | 'password_reset' | 'order_confirmation' | 'order_update' | 'receipt' | 'shift_reminder' | 'promotion' | 'system_alert' | 'custom';
  isDefault: boolean; // Whether this is a system default template
  isActive: boolean;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const EmailTemplateSchema = new Schema<IEmailTemplate>({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: function() {
      return !this.isDefault; // Only required if not a default template
    }
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  htmlTemplate: {
    type: String,
    required: true
  },
  textTemplate: {
    type: String
  },
  variables: [{
    type: String
  }],
  category: {
    type: String,
    enum: ['user', 'order', 'marketing', 'system', 'staff'],
    required: true
  },
  type: {
    type: String,
    enum: ['welcome', 'password_reset', 'order_confirmation', 'order_update', 'order_ready', 'receipt', 'shift_reminder', 'promotion', 'system_alert', 'custom'],
    required: true
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
EmailTemplateSchema.index({ tenantId: 1, slug: 1 }, { unique: true });
EmailTemplateSchema.index({ tenantId: 1, category: 1 });
EmailTemplateSchema.index({ tenantId: 1, type: 1 });
EmailTemplateSchema.index({ isDefault: 1, type: 1 });
EmailTemplateSchema.index({ isActive: 1 });

// Pre-save hook to generate slug from name if not provided
EmailTemplateSchema.pre('save', function(next) {
  if (!this.slug && this.name) {
    this.slug = this.name.toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .trim();
  }
  next();
});

export const EmailTemplate = mongoose.model<IEmailTemplate>('EmailTemplate', EmailTemplateSchema);