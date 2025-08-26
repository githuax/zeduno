import mongoose, { Document, Schema } from 'mongoose';

export interface ITenant extends Document {
  name: string;
  slug: string;
  email: string;
  domain?: string;
  plan: 'basic' | 'premium' | 'enterprise';
  status: 'active' | 'inactive' | 'suspended';
  maxUsers: number;
  currentUsers: number;
  address?: string;
  phone?: string;
  contactPerson?: string;
  description?: string;
  logo?: string;
  settings: {
    timezone?: string;
    currency?: string;
    language?: string;
    businessType?: 'restaurant' | 'hotel' | 'both';
  };
  subscription: {
    plan: 'basic' | 'premium' | 'enterprise';
    status: 'active' | 'inactive' | 'suspended';
    startDate?: Date;
    endDate?: Date;
  };
  features: {
    dineIn: boolean;
    takeaway: boolean;
    delivery: boolean;
    roomService: boolean;
    hotelBooking: boolean;
  };
  paymentConfig: {
    mpesa: {
      enabled: boolean;
      businessShortCode: string;
      passkey: string;
      consumerKey?: string;
      consumerSecret?: string;
      environment: 'sandbox' | 'production';
      tillNumber?: string;
      paybillNumber?: string;
      accountType: 'till' | 'paybill';
    };
    stripe: {
      enabled: boolean;
      publicKey?: string;
      secretKey?: string;
      webhookSecret?: string;
    };
    square: {
      enabled: boolean;
      applicationId?: string;
      accessToken?: string;
    };
    cash: {
      enabled: boolean;
    };
  };
  isActive: boolean;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const tenantSchema = new Schema<ITenant>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    domain: {
      type: String,
      trim: true,
    },
    plan: {
      type: String,
      enum: ['basic', 'premium', 'enterprise'],
      default: 'basic',
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended'],
      default: 'active',
    },
    maxUsers: {
      type: Number,
      default: 10,
    },
    currentUsers: {
      type: Number,
      default: 0,
    },
    address: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    contactPerson: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    logo: {
      type: String,
    },
    settings: {
      timezone: {
        type: String,
        default: 'UTC',
      },
      currency: {
        type: String,
        default: 'USD',
      },
      language: {
        type: String,
        default: 'en',
      },
      businessType: {
        type: String,
        enum: ['restaurant', 'hotel', 'both'],
        default: 'restaurant',
      },
    },
    subscription: {
      plan: {
        type: String,
        enum: ['basic', 'premium', 'enterprise'],
        default: 'basic',
      },
      status: {
        type: String,
        enum: ['active', 'inactive', 'suspended'],
        default: 'active',
      },
      startDate: Date,
      endDate: Date,
    },
    features: {
      dineIn: {
        type: Boolean,
        default: true,
      },
      takeaway: {
        type: Boolean,
        default: true,
      },
      delivery: {
        type: Boolean,
        default: true,
      },
      roomService: {
        type: Boolean,
        default: false,
      },
      hotelBooking: {
        type: Boolean,
        default: false,
      },
    },
    paymentConfig: {
      mpesa: {
        enabled: {
          type: Boolean,
          default: false,
        },
        businessShortCode: {
          type: String,
          default: '',
        },
        passkey: {
          type: String,
          default: '',
        },
        consumerKey: {
          type: String,
          default: '',
        },
        consumerSecret: {
          type: String,
          default: '',
        },
        environment: {
          type: String,
          enum: ['sandbox', 'production'],
          default: 'sandbox',
        },
        tillNumber: {
          type: String,
          default: '',
        },
        paybillNumber: {
          type: String,
          default: '',
        },
        accountType: {
          type: String,
          enum: ['till', 'paybill'],
          default: 'till',
        },
      },
      stripe: {
        enabled: {
          type: Boolean,
          default: false,
        },
        publicKey: {
          type: String,
          default: '',
        },
        secretKey: {
          type: String,
          default: '',
        },
        webhookSecret: {
          type: String,
          default: '',
        },
      },
      square: {
        enabled: {
          type: Boolean,
          default: false,
        },
        applicationId: {
          type: String,
          default: '',
        },
        accessToken: {
          type: String,
          default: '',
        },
      },
      cash: {
        enabled: {
          type: Boolean,
          default: true,
        },
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

tenantSchema.pre('save', function (next) {
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  next();
});

export const Tenant = mongoose.model<ITenant>('Tenant', tenantSchema);