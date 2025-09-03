import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IRecipeIngredient {
  ingredientId: Types.ObjectId;
  quantity: number;
  unit: string;
}

export interface IRecipe extends Document {
  _id: Types.ObjectId;
  menuItemId: Types.ObjectId;
  ingredients: IRecipeIngredient[];
  instructions?: string;
  preparationTime: number; // in minutes
  cookingTime: number; // in minutes
  servingSize: number;
  yield: number; // number of servings
  isActive: boolean;
  tenantId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;

  // Methods
  calculateCost(): Promise<number>;
  checkIngredientsAvailable(quantity: number): Promise<boolean>;
  consumeIngredients(quantity: number): Promise<void>;
}

const recipeIngredientSchema = new Schema({
  ingredientId: {
    type: Schema.Types.ObjectId,
    ref: 'Ingredient',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: [0, 'Quantity must be positive']
  },
  unit: {
    type: String,
    required: true
  }
});

const recipeSchema = new Schema<IRecipe>({
  menuItemId: {
    type: Schema.Types.ObjectId,
    ref: 'MenuItem',
    required: [true, 'Menu item is required'],
    index: true
  },
  ingredients: {
    type: [recipeIngredientSchema],
    required: [true, 'At least one ingredient is required'],
    validate: {
      validator: function(v: any[]) {
        return v && v.length > 0;
      },
      message: 'Recipe must have at least one ingredient'
    }
  },
  instructions: {
    type: String,
    maxlength: [2000, 'Instructions cannot exceed 2000 characters']
  },
  preparationTime: {
    type: Number,
    required: [true, 'Preparation time is required'],
    min: [0, 'Preparation time must be positive']
  },
  cookingTime: {
    type: Number,
    required: [true, 'Cooking time is required'],
    min: [0, 'Cooking time must be positive']
  },
  servingSize: {
    type: Number,
    required: [true, 'Serving size is required'],
    min: [1, 'Serving size must be at least 1'],
    default: 1
  },
  yield: {
    type: Number,
    required: [true, 'Yield is required'],
    min: [1, 'Yield must be at least 1'],
    default: 1
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
recipeSchema.index({ tenantId: 1, menuItemId: 1 }, { unique: true });
recipeSchema.index({ tenantId: 1, isActive: 1 });

// Virtual for menu item
recipeSchema.virtual('menuItem', {
  ref: 'MenuItem',
  localField: 'menuItemId',
  foreignField: '_id',
  justOne: true
});

// Instance method to calculate recipe cost
recipeSchema.methods.calculateCost = async function() {
  const Ingredient = mongoose.model('Ingredient');
  let totalCost = 0;

  for (const item of this.ingredients) {
    const ingredient = await Ingredient.findById(item.ingredientId);
    if (ingredient) {
      totalCost += ingredient.cost * item.quantity;
    }
  }

  return totalCost;
};

// Instance method to check if ingredients are available
recipeSchema.methods.checkIngredientsAvailable = async function(quantity: number = 1) {
  const Ingredient = mongoose.model('Ingredient');
  
  for (const item of this.ingredients) {
    const ingredient = await Ingredient.findById(item.ingredientId);
    if (!ingredient) {
      return false;
    }
    
    const requiredQuantity = item.quantity * quantity;
    if (ingredient.currentStock < requiredQuantity) {
      return false;
    }
  }
  
  return true;
};

// Instance method to consume ingredients for this recipe
recipeSchema.methods.consumeIngredients = async function(quantity: number = 1) {
  const Ingredient = mongoose.model('Ingredient');
  
  // First check availability
  const available = await this.checkIngredientsAvailable(quantity);
  if (!available) {
    throw new Error('Insufficient ingredients available');
  }
  
  // Consume ingredients
  for (const item of this.ingredients) {
    const ingredient = await Ingredient.findById(item.ingredientId);
    if (ingredient) {
      const consumeQuantity = item.quantity * quantity;
      await ingredient.updateStock(consumeQuantity, 'subtract');
    }
  }
};

// Static method to get recipes by menu item
recipeSchema.statics.getByMenuItem = function(tenantId: Types.ObjectId, menuItemId: Types.ObjectId) {
  return this.findOne({
    tenantId,
    menuItemId,
    isActive: true
  }).populate('ingredients.ingredientId');
};

export const Recipe = mongoose.model<IRecipe>('Recipe', recipeSchema);