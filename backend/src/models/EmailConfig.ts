import mongoose, { Document, Schema } from 'mongoose';

export interface IEmailConfig extends Document {
  tenantId: mongoose.Types.ObjectId;
  provider: 'smtp' | 'sendgrid' | 'mailgun' | 'ses';
  smtpConfig?: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
  };
  sendgridConfig?: {
    apiKey: string;
  };
  mailgunConfig?: {
    apiKey: string;
    domain: string;
  };
  sesConfig?: {
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
  };
  defaultFromEmail: string;
  defaultFromName: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const EmailConfigSchema = new Schema<IEmailConfig>({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    unique: true
  },
  provider: {
    type: String,
    enum: ['smtp', 'sendgrid', 'mailgun', 'ses'],
    required: true,
    default: 'smtp'
  },
  smtpConfig: {
    host: String,
    port: Number,
    secure: Boolean,
    auth: {
      user: String,
      pass: String
    }
  },
  sendgridConfig: {
    apiKey: String
  },
  mailgunConfig: {
    apiKey: String,
    domain: String
  },
  sesConfig: {
    accessKeyId: String,
    secretAccessKey: String,
    region: String
  },
  defaultFromEmail: {
    type: String,
    required: true
  },
  defaultFromName: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for efficient tenant lookups
// EmailConfigSchema.index({ tenantId: 1 }); // REMOVED: tenantId has unique: true which creates an index automatically
EmailConfigSchema.index({ isActive: 1 });

export const EmailConfig = mongoose.model<IEmailConfig>('EmailConfig', EmailConfigSchema);