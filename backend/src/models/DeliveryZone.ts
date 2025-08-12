import mongoose, { Document, Schema } from 'mongoose';

export interface IDeliveryZone extends Document {
  name: string;
  coordinates: {
    lat: number;
    lng: number;
  }[];
  deliveryFee: number;
  estimatedTime: number;
  isActive: boolean;
  priority: number;
  createdAt: Date;
  updatedAt: Date;
}

const DeliveryZoneSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    coordinates: [{
      lat: {
        type: Number,
        required: true,
      },
      lng: {
        type: Number,
        required: true,
      },
    }],
    deliveryFee: {
      type: Number,
      required: true,
      min: 0,
    },
    estimatedTime: {
      type: Number,
      required: true,
      min: 10,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    priority: {
      type: Number,
      default: 1,
      min: 1,
      max: 10,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IDeliveryZone>('DeliveryZone', DeliveryZoneSchema);