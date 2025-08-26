import mongoose, { Document, Schema, Types } from 'mongoose';

// Interface for Category document
export interface ICategory extends Document {
  _id: Types.ObjectId;
  name: string;
  description?: string;
  displayOrder: number;
  isActive: boolean;
  tenantId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  
  // Instance methods
  canDelete(): Promise<boolean>;
}

// Category Schema
const categorySchema = new Schema<ICategory>({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    maxlength: [100, 'Category name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  displayOrder: {
    type: Number,
    default: 0,
    min: [0, 'Display order must be a positive number']
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

// Compound index for tenant-specific category names (prevents duplicates per tenant)
categorySchema.index({ tenantId: 1, name: 1 }, { unique: true });

// Index for display order within tenant
categorySchema.index({ tenantId: 1, displayOrder: 1 });

// Virtual for menu items count
categorySchema.virtual('menuItemsCount', {
  ref: 'MenuItem',
  localField: '_id',
  foreignField: 'categoryId',
  count: true
});

// Pre-validate middleware to ensure unique category names per tenant
categorySchema.pre('validate', function(next) {
  if (this.isNew || this.isModified('name')) {
    this.name = this.name?.toLowerCase().trim();
  }
  next();
});

// Static method to get categories by tenant
categorySchema.statics.getByTenant = function(tenantId: Types.ObjectId) {
  return this.find({ tenantId, isActive: true })
    .sort({ displayOrder: 1, name: 1 })
    .populate('menuItemsCount');
};

// Instance method to check if category can be deleted
categorySchema.methods.canDelete = async function() {
  const MenuItem = mongoose.model('MenuItem');
  const count = await MenuItem.countDocuments({ 
    categoryId: this._id, 
    isActive: true 
  });
  return count === 0;
};

export const Category = mongoose.model<ICategory>('Category', categorySchema);