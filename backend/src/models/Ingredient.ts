import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IIngredient extends Document {
  _id: Types.ObjectId;
  name: string;
  description?: string;
  unit: 'kg' | 'g' | 'l' | 'ml' | 'piece' | 'dozen' | 'box' | 'pack' | 'bottle' | 'can';
  currentStock: number;
  minStockLevel: number;
  maxStockLevel?: number;
  reorderPoint: number;
  reorderQuantity: number;
  cost: number; // Cost per unit
  supplierId?: Types.ObjectId;
  supplierName?: string;
  supplierContact?: string;
  category: 'vegetables' | 'fruits' | 'meat' | 'seafood' | 'dairy' | 'grains' | 'spices' | 'beverages' | 'condiments' | 'other';
  expiryDate?: Date;
  batchNumber?: string;
  location?: string; // Storage location (e.g., "Freezer A", "Pantry B")
  isPerishable: boolean;
  shelfLife?: number; // in days
  lastRestockedDate?: Date;
  lastUsedDate?: Date;
  isActive: boolean;
  tenantId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;

  // Methods
  checkLowStock(): boolean;
  needsReorder(): boolean;
  updateStock(quantity: number, operation: 'add' | 'subtract'): Promise<IIngredient>;
  calculateValue(): number;
}

const ingredientSchema = new Schema<IIngredient>({
  name: {
    type: String,
    required: [true, 'Ingredient name is required'],
    trim: true,
    maxlength: [200, 'Ingredient name cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  unit: {
    type: String,
    required: [true, 'Unit is required'],
    enum: ['kg', 'g', 'l', 'ml', 'piece', 'dozen', 'box', 'pack', 'bottle', 'can']
  },
  currentStock: {
    type: Number,
    required: [true, 'Current stock is required'],
    min: [0, 'Stock cannot be negative'],
    default: 0
  },
  minStockLevel: {
    type: Number,
    required: [true, 'Minimum stock level is required'],
    min: [0, 'Minimum stock level cannot be negative'],
    default: 0
  },
  maxStockLevel: {
    type: Number,
    min: [0, 'Maximum stock level cannot be negative']
  },
  reorderPoint: {
    type: Number,
    required: [true, 'Reorder point is required'],
    min: [0, 'Reorder point cannot be negative']
  },
  reorderQuantity: {
    type: Number,
    required: [true, 'Reorder quantity is required'],
    min: [1, 'Reorder quantity must be at least 1']
  },
  cost: {
    type: Number,
    required: [true, 'Cost per unit is required'],
    min: [0, 'Cost cannot be negative']
  },
  supplierId: {
    type: Schema.Types.ObjectId,
    ref: 'Supplier'
  },
  supplierName: {
    type: String,
    trim: true
  },
  supplierContact: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['vegetables', 'fruits', 'meat', 'seafood', 'dairy', 'grains', 'spices', 'beverages', 'condiments', 'other']
  },
  expiryDate: {
    type: Date
  },
  batchNumber: {
    type: String,
    trim: true
  },
  location: {
    type: String,
    trim: true,
    maxlength: [100, 'Location cannot exceed 100 characters']
  },
  isPerishable: {
    type: Boolean,
    default: false
  },
  shelfLife: {
    type: Number,
    min: [0, 'Shelf life cannot be negative']
  },
  lastRestockedDate: {
    type: Date
  },
  lastUsedDate: {
    type: Date
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
ingredientSchema.index({ tenantId: 1, name: 1 });
ingredientSchema.index({ tenantId: 1, category: 1 });
ingredientSchema.index({ tenantId: 1, isActive: 1 });
ingredientSchema.index({ tenantId: 1, currentStock: 1 });
ingredientSchema.index({ expiryDate: 1 });

// Instance method to check if stock is low
ingredientSchema.methods.checkLowStock = function() {
  return this.currentStock <= this.minStockLevel;
};

// Instance method to check if reorder is needed
ingredientSchema.methods.needsReorder = function() {
  return this.currentStock <= this.reorderPoint;
};

// Instance method to update stock
ingredientSchema.methods.updateStock = async function(quantity: number, operation: 'add' | 'subtract') {
  if (operation === 'add') {
    this.currentStock += quantity;
    this.lastRestockedDate = new Date();
  } else {
    if (this.currentStock < quantity) {
      throw new Error(`Insufficient stock. Available: ${this.currentStock}, Requested: ${quantity}`);
    }
    this.currentStock -= quantity;
    this.lastUsedDate = new Date();
  }
  
  return this.save();
};

// Instance method to calculate total value
ingredientSchema.methods.calculateValue = function() {
  return this.currentStock * this.cost;
};

// Static method to get low stock ingredients
ingredientSchema.statics.getLowStock = function(tenantId: Types.ObjectId) {
  return this.find({
    tenantId,
    isActive: true,
    $expr: { $lte: ['$currentStock', '$minStockLevel'] }
  }).sort({ currentStock: 1 });
};

// Static method to get expiring ingredients
ingredientSchema.statics.getExpiring = function(tenantId: Types.ObjectId, daysAhead: number = 7) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysAhead);
  
  return this.find({
    tenantId,
    isActive: true,
    expiryDate: {
      $gte: new Date(),
      $lte: futureDate
    }
  }).sort({ expiryDate: 1 });
};

export const Ingredient = mongoose.model<IIngredient>('Ingredient', ingredientSchema);