import mongoose, { Document, Schema } from 'mongoose';

export interface IBranch extends Document {
  tenantId: mongoose.Types.ObjectId;
  parentBranchId?: mongoose.Types.ObjectId;
  name: string;
  code: string;
  type: 'main' | 'branch' | 'franchise';
  status: 'active' | 'inactive' | 'suspended';
  ward: mongoose.Types.ObjectId;
  
  // Location Information
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    subcounty: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  
  // Contact Information
  contact: {
    phone: string;
    email: string;
    managerName?: string;
    managerPhone?: string;
    managerEmail?: string;
  };
  
  // Operating Information
  operations: {
    openTime: string;
    closeTime: string;
    timezone: string;
    daysOpen: string[];
    holidaySchedule?: any[];
    seatingCapacity?: number;
    deliveryRadius?: number;
  };
  
  // Financial Configuration
  financial: {
    currency: string;
    taxRate: number;
    serviceChargeRate?: number;
    tipEnabled: boolean;
    paymentMethods: string[];
    bankAccount?: {
      accountName: string;
      accountNumber: string;
      bankName: string;
      routingNumber?: string;
    };
  };
  
  // Inventory Configuration
  inventory: {
    trackInventory: boolean;
    lowStockAlertEnabled: boolean;
    autoReorderEnabled: boolean;
    warehouseId?: mongoose.Types.ObjectId;
  };
  
  // Menu Configuration
  menuConfig: {
    inheritFromParent: boolean;
    priceMultiplier?: number;
    customPricing: boolean;
    availableCategories?: mongoose.Types.ObjectId[];
  };
  
  // Staff Configuration
  staffing: {
    maxStaff: number;
    currentStaff: number;
    roles: string[];
    shiftPattern?: string;
  };
  
  // Performance Metrics
  metrics: {
    avgOrderValue: number;
    totalOrders: number;
    totalRevenue: number;
    rating?: number;
    lastUpdated: Date;
  };
  
  // Integration Settings
  integrations: {
    posSystemId?: string;
    posSystemType?: string;
    kitchenDisplayId?: string;
    onlineOrderingEnabled: boolean;
  };
  
  // Branch Specific Settings
  settings: {
    orderPrefix: string;
    orderNumberSequence: number;
    receiptHeader?: string;
    receiptFooter?: string;
    logoUrl?: string;
    theme?: string;
  };
  
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const branchSchema = new Schema<IBranch>(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      // index: true - REMOVED: Compound indexes below provide better performance
    },
    parentBranchId: {
      type: Schema.Types.ObjectId,
      ref: 'Branch',
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: false, // Auto-generated in pre-save hook
      unique: true,
      uppercase: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['main', 'branch', 'franchise'],
      default: 'branch',
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended'],
      default: 'active',
    },
    address: {
      street: {
        type: String,
        required: true,
      },
      city: {
        type: String,
        required: true,
      },
      state: {
        type: String,
        required: true,
      },
      postalCode: {
        type: String,
        required: true,
      },
      country: {
        type: String,
        required: true,
      },
      coordinates: {
        latitude: Number,
        longitude: Number,
      },
    },
    contact: {
      phone: {
        type: String,
        required: true,
      },
      email: {
        type: String,
        required: true,
        lowercase: true,
      },
      managerName: String,
      managerPhone: String,
      managerEmail: {
        type: String,
        lowercase: true,
      },
    },
    operations: {
      openTime: {
        type: String,
        required: true,
        default: '09:00',
      },
      closeTime: {
        type: String,
        required: true,
        default: '22:00',
      },
      timezone: {
        type: String,
        required: true,
        default: 'UTC',
      },
      daysOpen: {
        type: [String],
        default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      },
      holidaySchedule: [Schema.Types.Mixed],
      seatingCapacity: Number,
      deliveryRadius: Number,
    },
    financial: {
      currency: {
        type: String,
        required: true,
        default: 'USD',
      },
      taxRate: {
        type: Number,
        required: true,
        default: 0,
      },
      serviceChargeRate: {
        type: Number,
        default: 0,
      },
      tipEnabled: {
        type: Boolean,
        default: true,
      },
      paymentMethods: {
        type: [String],
        default: ['cash'],
      },
      bankAccount: {
        accountName: String,
        accountNumber: String,
        bankName: String,
        routingNumber: String,
      },
    },
    inventory: {
      trackInventory: {
        type: Boolean,
        default: true,
      },
      lowStockAlertEnabled: {
        type: Boolean,
        default: true,
      },
      autoReorderEnabled: {
        type: Boolean,
        default: false,
      },
      warehouseId: {
        type: Schema.Types.ObjectId,
        ref: 'Warehouse',
      },
    },
    menuConfig: {
      inheritFromParent: {
        type: Boolean,
        default: true,
      },
      priceMultiplier: {
        type: Number,
        default: 1,
      },
      customPricing: {
        type: Boolean,
        default: false,
      },
      availableCategories: [{
        type: Schema.Types.ObjectId,
        ref: 'Category',
      }],
    },
    staffing: {
      maxStaff: {
        type: Number,
        default: 50,
      },
      currentStaff: {
        type: Number,
        default: 0,
      },
      roles: {
        type: [String],
        default: ['manager', 'cashier', 'waiter', 'chef', 'delivery'],
      },
      shiftPattern: String,
    },
    metrics: {
      avgOrderValue: {
        type: Number,
        default: 0,
      },
      totalOrders: {
        type: Number,
        default: 0,
      },
      totalRevenue: {
        type: Number,
        default: 0,
      },
      rating: {
        type: Number,
        min: 0,
        max: 5,
      },
      lastUpdated: {
        type: Date,
        default: Date.now,
      },
    },
    integrations: {
      posSystemId: String,
      posSystemType: String,
      kitchenDisplayId: String,
      onlineOrderingEnabled: {
        type: Boolean,
        default: true,
      },
    },
    settings: {
      orderPrefix: {
        type: String,
        required: true,
      },
      orderNumberSequence: {
        type: Number,
        default: 1,
      },
      receiptHeader: String,
      receiptFooter: String,
      logoUrl: String,
      theme: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
branchSchema.index({ tenantId: 1, status: 1 });
branchSchema.index({ tenantId: 1, code: 1 }, { unique: true });
branchSchema.index({ 'address.coordinates': '2dsphere' });
branchSchema.index({ tenantId: 1, type: 1 });
branchSchema.index({ parentBranchId: 1 });

// Pre-save hook to generate branch code if not provided
branchSchema.pre('save', async function (next) {
  console.log('Pre-save hook triggered - Branch:', this.name, 'Code:', this.code, 'TenantId:', this.tenantId);
  
  // Always generate code if not provided
  if (!this.code && this.name && this.tenantId) {
    console.log('Generating code for branch:', this.name);
    try {
      const tenant = await mongoose.model('Tenant').findById(this.tenantId);
      console.log('Found tenant:', tenant?.name, 'Slug:', tenant?.slug);
      
      if (!tenant) {
        console.error('Tenant not found for ID:', this.tenantId);
        return next(new Error('Tenant not found'));
      }
      
      const branchCount = await mongoose.model('Branch').countDocuments({ tenantId: this.tenantId });
      console.log('Current branch count for tenant:', branchCount);
      
      const tenantSlug = tenant?.slug || 'TENANT';
      this.code = `${tenantSlug.toUpperCase()}-BR${String(branchCount + 1).padStart(3, '0')}`;
      console.log('Generated branch code:', this.code);
    } catch (error) {
      console.error('Error generating branch code:', error);
      return next(error);
    }
  }
  
  // Ensure code is present before proceeding
  if (!this.code) {
    console.error('Branch code is still missing after generation attempt');
    return next(new Error('Branch code could not be generated'));
  }
  
  // Initialize settings if not present
  if (!this.settings) {
    console.log('Settings object not found, creating default');
    this.settings = { orderPrefix: '', orderNumberSequence: 1 };
  }
  
  // Set orderPrefix based on code
  if (!this.settings.orderPrefix) {
    this.settings.orderPrefix = this.code;
    console.log('Set orderPrefix to:', this.settings.orderPrefix);
  }
  
  console.log('Pre-save hook completed - Code:', this.code, 'OrderPrefix:', this.settings.orderPrefix);
  next();
});

// Method to get full branch hierarchy
branchSchema.methods.getHierarchy = async function() {
  const hierarchy = [];
  let currentBranch = this;
  
  while (currentBranch.parentBranchId) {
    const parent = await mongoose.model('Branch').findById(currentBranch.parentBranchId);
    if (!parent) break;
    hierarchy.unshift(parent);
    currentBranch = parent;
  }
  
  return hierarchy;
};

// Method to get all child branches
branchSchema.methods.getChildBranches = async function() {
  return await mongoose.model('Branch').find({ 
    parentBranchId: this._id,
    isActive: true 
  });
};

// Virtual for branch full path
branchSchema.virtual('fullPath').get(async function() {
  const hierarchy = await (this as any).getHierarchy();
  const path = hierarchy.map((b: any) => b.name).join(' > ');
  return path ? `${path} > ${this.name}` : this.name;
});

export const Branch = mongoose.model<IBranch>('Branch', branchSchema);rchy.map((b: any) => b.name).join(' > ');
  return path ? `${path} > ${this.name}` : this.name;
});

export const Branch = mongoose.model<IBranch>('Branch', branchSchema);