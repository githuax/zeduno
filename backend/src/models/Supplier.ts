import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ISupplier extends Document {
  _id: Types.ObjectId;
  name: string;
  contactPerson?: string;
  email?: string;
  phone: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  categories: string[];
  paymentTerms?: string;
  deliveryDays?: string[];
  minimumOrderAmount?: number;
  leadTime?: number; // in days
  rating?: number;
  notes?: string;
  isActive: boolean;
  tenantId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const supplierSchema = new Schema<ISupplier>({
  name: {
    type: String,
    required: [true, 'Supplier name is required'],
    trim: true,
    maxlength: [200, 'Supplier name cannot exceed 200 characters']
  },
  contactPerson: {
    type: String,
    trim: true,
    maxlength: [100, 'Contact person name cannot exceed 100 characters']
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    validate: {
      validator: function(v: string) {
        return /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(v);
      },
      message: 'Please provide a valid email'
    }
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  categories: [{
    type: String,
    trim: true
  }],
  paymentTerms: {
    type: String,
    trim: true,
    maxlength: [200, 'Payment terms cannot exceed 200 characters']
  },
  deliveryDays: [{
    type: String,
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  }],
  minimumOrderAmount: {
    type: Number,
    min: [0, 'Minimum order amount cannot be negative']
  },
  leadTime: {
    type: Number,
    min: [0, 'Lead time cannot be negative']
  },
  rating: {
    type: Number,
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5']
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  tenantId: {
    type: Schema.Types.ObjectId,
    ref: 'Tenant',
    required: [true, 'Tenant ID is required'],
    index: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
supplierSchema.index({ tenantId: 1, name: 1 });
supplierSchema.index({ tenantId: 1, isActive: 1 });
supplierSchema.index({ tenantId: 1, categories: 1 });

// Static method to get suppliers by category
supplierSchema.statics.getByCategory = function(tenantId: Types.ObjectId, category: string) {
  return this.find({
    tenantId,
    categories: category,
    isActive: true
  }).sort({ rating: -1, name: 1 });
};

export const Supplier = mongoose.model<ISupplier>('Supplier', supplierSchema);