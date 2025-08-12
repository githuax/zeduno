import mongoose, { Document, Schema } from 'mongoose';

export interface IMenuItem extends Document {
  name: string;
  description: string;
  category: string;
  price: number;
  image?: string;
  isAvailable: boolean;
  preparationTime: number;
  allergens?: string[];
  customizations?: {
    name: string;
    options: {
      name: string;
      price: number;
    }[];
  }[];
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const MenuItemSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
      enum: ['appetizers', 'mains', 'desserts', 'beverages', 'specials'],
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    image: {
      type: String,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    preparationTime: {
      type: Number,
      required: true,
      default: 15,
    },
    allergens: [{
      type: String,
    }],
    customizations: [{
      name: String,
      options: [{
        name: String,
        price: Number,
      }],
    }],
    tags: [{
      type: String,
    }],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IMenuItem>('MenuItem', MenuItemSchema);