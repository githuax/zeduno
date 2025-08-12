import mongoose, { Document, Schema } from 'mongoose';

export interface IDriver extends Document {
  name: string;
  phone: string;
  email: string;
  vehicleType: 'bike' | 'scooter' | 'car' | 'walk';
  vehicleNumber: string;
  status: 'available' | 'busy' | 'offline' | 'break';
  currentLocation?: {
    lat: number;
    lng: number;
    timestamp: Date;
  };
  rating: number;
  totalDeliveries: number;
  activeOrderId?: string;
  shift: {
    start: string;
    end: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const DriverSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    vehicleType: {
      type: String,
      enum: ['bike', 'scooter', 'car', 'walk'],
      required: true,
    },
    vehicleNumber: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['available', 'busy', 'offline', 'break'],
      default: 'offline',
    },
    currentLocation: {
      lat: Number,
      lng: Number,
      timestamp: {
        type: Date,
        default: Date.now,
      },
    },
    rating: {
      type: Number,
      default: 5.0,
      min: 1,
      max: 5,
    },
    totalDeliveries: {
      type: Number,
      default: 0,
    },
    activeOrderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
    },
    shift: {
      start: {
        type: String,
        required: true,
        default: '09:00',
      },
      end: {
        type: String,
        required: true,
        default: '21:00',
      },
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IDriver>('Driver', DriverSchema);