import mongoose, { Document, Schema } from 'mongoose';

export interface IRoom extends Document {
  roomNumber: string;
  type: 'single' | 'double' | 'suite' | 'deluxe';
  price: number;
  capacity: number;
  amenities: string[];
  description: string;
  images: string[];
  isAvailable: boolean;
  floor: number;
  createdAt: Date;
  updatedAt: Date;
}

const roomSchema = new Schema<IRoom>(
  {
    roomNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['single', 'double', 'suite', 'deluxe'],
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    capacity: {
      type: Number,
      required: true,
      min: 1,
      max: 6,
    },
    amenities: [{
      type: String,
      trim: true,
    }],
    description: {
      type: String,
      trim: true,
    },
    images: [{
      type: String,
    }],
    isAvailable: {
      type: Boolean,
      default: true,
    },
    floor: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

export const Room = mongoose.model<IRoom>('Room', roomSchema);