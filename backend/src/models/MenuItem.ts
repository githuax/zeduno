import mongoose, { Document, Schema, Types } from 'mongoose';

// Interface for customization options
export interface ICustomizationOption {
  name: string;
  price: number;
  isAvailable: boolean;
}

// Interface for nutritional information
export interface INutritionalInfo {
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  allergens?: string[];
}

// Interface for MenuItem document
export interface IMenuItem extends Document {
  _id: Types.ObjectId;
  name: string;
  description: string;
  price: number;
  categoryId: Types.ObjectId;
  imageUrl?: string;
  images?: string[];
  isActive: boolean;
  isAvailable: boolean;
  preparationTime?: number; // in minutes
  customizationOptions?: ICustomizationOption[];
  nutritionalInfo?: INutritionalInfo;
  tags?: string[];
  popularity: number;
  stockQuantity?: number;
  amount: number; // Current stock amount
  minStockLevel?: number; // Alert when stock is below this level
  maxStockLevel?: number; // Maximum stock capacity
  trackInventory: boolean; // Whether to track inventory for this item
  isVegetarian?: boolean;
  isVegan?: boolean;
  isGlutenFree?: boolean;
  spiceLevel?: 'mild' | 'medium' | 'hot' | 'extra-hot';
  tenantId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  
  // Instance methods
  updateAvailability(isAvailable: boolean): Promise<IMenuItem>;
  addCustomization(option: ICustomizationOption): Promise<IMenuItem>;
  removeCustomization(optionName: string): Promise<IMenuItem>;
  reduceStock(quantity: number): Promise<IMenuItem>;
  increaseStock(quantity: number): Promise<IMenuItem>;
  checkStockAvailable(quantity: number): boolean;
  isLowStock(): boolean;
}

// MenuItem Schema
const menuItemSchema = new Schema<IMenuItem>({
  name: {
    type: String,
    required: [true, 'Menu item name is required'],
    trim: true,
    maxlength: [200, 'Menu item name cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Menu item description is required'],
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price must be positive'],
    validate: {
      validator: function(value: number) {
        return Number(value.toFixed(2)) === value;
      },
      message: 'Price must have at most 2 decimal places'
    }
  },
  categoryId: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category is required'],
    index: true
  },
  imageUrl: {
    type: String,
    trim: true,
    validate: {
      validator: function(value: string) {
        if (!value) return true;
        const urlRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
        return urlRegex.test(value);
      },
      message: 'Please provide a valid image URL'
    }
  },
  images: [{
    type: String,
    trim: true
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  preparationTime: {
    type: Number,
    min: [0, 'Preparation time must be positive'],
    max: [480, 'Preparation time cannot exceed 8 hours']
  },
  customizationOptions: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    isAvailable: {
      type: Boolean,
      default: true
    }
  }],
  nutritionalInfo: {
    calories: {
      type: Number,
      min: 0
    },
    protein: {
      type: Number,
      min: 0
    },
    carbs: {
      type: Number,
      min: 0
    },
    fat: {
      type: Number,
      min: 0
    },
    allergens: [{
      type: String,
      enum: ['nuts', 'dairy', 'eggs', 'soy', 'wheat', 'fish', 'shellfish', 'sesame']
    }]
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  popularity: {
    type: Number,
    default: 0,
    min: 0
  },
  stockQuantity: {
    type: Number,
    min: 0
  },
  amount: {
    type: Number,
    required: [true, 'Stock amount is required'],
    min: [0, 'Stock amount cannot be negative'],
    default: 0
  },
  minStockLevel: {
    type: Number,
    min: [0, 'Minimum stock level cannot be negative'],
    default: 0
  },
  maxStockLevel: {
    type: Number,
    min: [0, 'Maximum stock level cannot be negative']
  },
  trackInventory: {
    type: Boolean,
    default: true
  },
  isVegetarian: {
    type: Boolean,
    default: false
  },
  isVegan: {
    type: Boolean,
    default: false
  },
  isGlutenFree: {
    type: Boolean,
    default: false
  },
  spiceLevel: {
    type: String,
    enum: ['mild', 'medium', 'hot', 'extra-hot'],
    lowercase: true
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

// Compound indexes
menuItemSchema.index({ tenantId: 1, categoryId: 1 });
menuItemSchema.index({ tenantId: 1, isActive: 1, isAvailable: 1 });
menuItemSchema.index({ tenantId: 1, name: 1 });
menuItemSchema.index({ tenantId: 1, popularity: -1 });
menuItemSchema.index({ tenantId: 1, price: 1 });

// Text index for search functionality
menuItemSchema.index({ 
  name: 'text', 
  description: 'text', 
  tags: 'text' 
});

// Virtual for category information
menuItemSchema.virtual('category', {
  ref: 'Category',
  localField: 'categoryId',
  foreignField: '_id',
  justOne: true
});

// Pre-save middleware to ensure vegan items are also vegetarian
menuItemSchema.pre('save', function(next) {
  if (this.isVegan) {
    this.isVegetarian = true;
  }
  next();
});

// Instance method to update availability
menuItemSchema.methods.updateAvailability = function(isAvailable: boolean) {
  this.isAvailable = isAvailable;
  return this.save();
};

// Instance method to add customization option
menuItemSchema.methods.addCustomization = function(option: ICustomizationOption) {
  if (!this.customizationOptions) {
    this.customizationOptions = [];
  }
  
  // Check if option already exists
  const existingIndex = this.customizationOptions.findIndex(
    opt => opt.name.toLowerCase() === option.name.toLowerCase()
  );
  
  if (existingIndex >= 0) {
    // Update existing option
    this.customizationOptions[existingIndex] = option;
  } else {
    // Add new option
    this.customizationOptions.push(option);
  }
  
  return this.save();
};

// Instance method to remove customization option
menuItemSchema.methods.removeCustomization = function(optionName: string) {
  if (!this.customizationOptions) return this;
  
  this.customizationOptions = this.customizationOptions.filter(
    opt => opt.name.toLowerCase() !== optionName.toLowerCase()
  );
  
  return this.save();
};

// Instance method to reduce stock
menuItemSchema.methods.reduceStock = function(quantity: number) {
  if (!this.trackInventory) {
    return Promise.resolve(this);
  }
  
  if (this.amount < quantity) {
    throw new Error(`Insufficient stock. Available: ${this.amount}, Requested: ${quantity}`);
  }
  
  this.amount -= quantity;
  
  // Auto-disable if out of stock
  if (this.amount <= 0) {
    this.isAvailable = false;
  }
  
  return this.save();
};

// Instance method to increase stock
menuItemSchema.methods.increaseStock = function(quantity: number) {
  this.amount += quantity;
  
  // Auto-enable if stock is restored
  if (this.amount > 0 && !this.isAvailable && this.isActive) {
    this.isAvailable = true;
  }
  
  return this.save();
};

// Instance method to check if stock is available
menuItemSchema.methods.checkStockAvailable = function(quantity: number) {
  if (!this.trackInventory) return true;
  return this.amount >= quantity;
};

// Instance method to check if stock is low
menuItemSchema.methods.isLowStock = function() {
  if (!this.trackInventory) return false;
  return this.amount <= (this.minStockLevel || 0);
};

// Static method to get menu items by category
menuItemSchema.statics.getByCategory = function(tenantId: Types.ObjectId, categoryId: Types.ObjectId) {
  return this.find({ 
    tenantId, 
    categoryId, 
    isActive: true 
  })
  .populate('category')
  .sort({ name: 1 });
};

// Static method to search menu items
menuItemSchema.statics.search = function(tenantId: Types.ObjectId, query: string) {
  return this.find({
    tenantId,
    isActive: true,
    $text: { $search: query }
  })
  .populate('category')
  .sort({ score: { $meta: 'textScore' } });
};

// Static method to get popular items
menuItemSchema.statics.getPopular = function(tenantId: Types.ObjectId, limit: number = 10) {
  return this.find({ 
    tenantId, 
    isActive: true, 
    isAvailable: true 
  })
  .populate('category')
  .sort({ popularity: -1 })
  .limit(limit);
};

export const MenuItem = mongoose.model<IMenuItem>('MenuItem', menuItemSchema);