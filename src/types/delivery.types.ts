export type DriverStatus = 'available' | 'busy' | 'offline' | 'break';
export type DeliveryStatus = 'preparing' | 'ready' | 'assigned' | 'picked_up' | 'en_route' | 'delivered' | 'failed';
export type VehicleType = 'bike' | 'scooter' | 'car' | 'walk';

export interface DeliveryZone {
  _id: string;
  name: string;
  coordinates: {
    lat: number;
    lng: number;
  }[];
  deliveryFee: number;
  estimatedTime: number; // minutes
  isActive: boolean;
  priority: number;
  createdAt: string;
  updatedAt: string;
}

export interface Driver {
  _id: string;
  name: string;
  phone: string;
  email: string;
  vehicleType: VehicleType;
  vehicleNumber: string;
  status: DriverStatus;
  currentLocation?: {
    lat: number;
    lng: number;
    timestamp: string;
  };
  rating: number;
  totalDeliveries: number;
  activeOrderId?: string;
  shift: {
    start: string;
    end: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface DeliveryAddress {
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

export interface Delivery {
  _id: string;
  orderId: string;
  driverId?: string;
  status: DeliveryStatus;
  pickupAddress: DeliveryAddress;
  deliveryAddress: DeliveryAddress;
  estimatedPickupTime: string;
  estimatedDeliveryTime: string;
  actualPickupTime?: string;
  actualDeliveryTime?: string;
  distance: number; // in km
  deliveryFee: number;
  priority: number;
  notes?: string;
  trackingUpdates: {
    status: DeliveryStatus;
    timestamp: string;
    location?: {
      lat: number;
      lng: number;
    };
    note?: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface DeliveryRoute {
  _id: string;
  driverId: string;
  deliveries: string[];
  optimizedOrder: number[];
  totalDistance: number;
  estimatedDuration: number;
  status: 'planned' | 'active' | 'completed';
  startTime?: string;
  endTime?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDeliveryInput {
  orderId: string;
  deliveryAddress: DeliveryAddress;
  priority?: number;
  notes?: string;
}

export interface UpdateDeliveryInput {
  status?: DeliveryStatus;
  driverId?: string;
  estimatedDeliveryTime?: string;
  notes?: string;
}