import mongoose, { Document, Schema } from 'mongoose';

export interface IDeliveryAddress {
  street: string;
  city: string;
  zipCode: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  instructions?: string;
  landmark?: string;
}

export interface ITrackingUpdate {
  status: 'preparing' | 'ready' | 'assigned' | 'picked_up' | 'en_route' | 'delivered' | 'failed';
  timestamp: Date;
  location?: {
    lat: number;
    lng: number;
  };
  note?: string;
}

export interface IDelivery extends Document {
  orderId: mongoose.Types.ObjectId;
  driverId?: mongoose.Types.ObjectId;
  status: 'preparing' | 'ready' | 'assigned' | 'picked_up' | 'en_route' | 'delivered' | 'failed';
  pickupAddress: IDeliveryAddress;
  deliveryAddress: IDeliveryAddress;
  estimatedPickupTime: Date;
  estimatedDeliveryTime: Date;
  actualPickupTime?: Date;
  actualDeliveryTime?: Date;
  distance: number;
  deliveryFee: number;
  priority: number;
  notes?: string;
  trackingUpdates: ITrackingUpdate[];
  createdAt: Date;
  updatedAt: Date;
}

const DeliveryAddressSchema = new Schema({
  street: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  zipCode: {
    type: String,
    required: true,
  },
  coordinates: {
    lat: Number,
    lng: Number,
  },
  instructions: String,
  landmark: String,
});

const TrackingUpdateSchema = new Schema({
  status: {
    type: String,
    enum: ['preparing', 'ready', 'assigned', 'picked_up', 'en_route', 'delivered', 'failed'],
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  location: {
    lat: Number,
    lng: Number,
  },
  note: String,
});

const DeliverySchema: Schema = new Schema(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      unique: true,
    },
    driverId: {
      type: Schema.Types.ObjectId,
      ref: 'Driver',
    },
    status: {
      type: String,
      enum: ['preparing', 'ready', 'assigned', 'picked_up', 'en_route', 'delivered', 'failed'],
      default: 'preparing',
    },
    pickupAddress: {
      type: DeliveryAddressSchema,
      required: true,
    },
    deliveryAddress: {
      type: DeliveryAddressSchema,
      required: true,
    },
    estimatedPickupTime: {
      type: Date,
      required: true,
    },
    estimatedDeliveryTime: {
      type: Date,
      required: true,
    },
    actualPickupTime: Date,
    actualDeliveryTime: Date,
    distance: {
      type: Number,
      required: true,
      default: 0,
    },
    deliveryFee: {
      type: Number,
      required: true,
      default: 0,
    },
    priority: {
      type: Number,
      default: 1,
      min: 1,
      max: 5,
    },
    notes: String,
    trackingUpdates: [TrackingUpdateSchema],
  },
  {
    timestamps: true,
  }
);

// Automatically add tracking update when status changes
DeliverySchema.pre('save', function(next) {
  if (this.isModified('status')) {
    this.trackingUpdates.push({
      status: this.status,
      timestamp: new Date(),
    } as ITrackingUpdate);
  }
  next();
});

export default mongoose.model<IDelivery>('Delivery', DeliverySchema);