import { useState, useEffect } from 'react';
import { MapPin, Navigation, Clock, Phone, RefreshCw, Truck, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Delivery, Driver, DeliveryStatus } from '@/types/delivery.types';
import { cn } from '@/lib/utils';

interface DeliveryTrackingProps {
  deliveries: Delivery[];
  drivers: Driver[];
}

const statusSteps: DeliveryStatus[] = ['assigned', 'picked_up', 'en_route', 'delivered'];

const statusColors: Record<DeliveryStatus, string> = {
  preparing: 'bg-orange-100 text-orange-800',
  ready: 'bg-blue-100 text-blue-800',
  assigned: 'bg-purple-100 text-purple-800',
  picked_up: 'bg-yellow-100 text-yellow-800',
  en_route: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
};

export function DeliveryTracking({ deliveries, drivers }: DeliveryTrackingProps) {
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const getDriverForDelivery = (driverId?: string): Driver | undefined => {
    return driverId ? drivers.find(d => d._id === driverId) : undefined;
  };

  const getProgressPercentage = (status: DeliveryStatus): number => {
    const currentStep = statusSteps.indexOf(status);
    if (currentStep === -1) return 0;
    return ((currentStep + 1) / statusSteps.length) * 100;
  };

  const getEstimatedArrival = (delivery: Delivery): string => {
    if (delivery.estimatedDeliveryTime) {
      return new Date(delivery.estimatedDeliveryTime).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    return 'Unknown';
  };

  const getDeliveryDuration = (delivery: Delivery): string => {
    if (delivery.actualPickupTime && delivery.status !== 'delivered') {
      const pickup = new Date(delivery.actualPickupTime);
      const now = new Date();
      const diffMinutes = Math.floor((now.getTime() - pickup.getTime()) / (1000 * 60));
      return `${diffMinutes} min ago`;
    }
    return '';
  };

  const isDeliveryDelayed = (delivery: Delivery): boolean => {
    if (!delivery.estimatedDeliveryTime) return false;
    const estimated = new Date(delivery.estimatedDeliveryTime);
    const now = new Date();
    return now > estimated && delivery.status !== 'delivered';
  };

  const handleRefreshLocation = async (driverId: string) => {
    setIsRefreshing(true);
    try {
      // In a real app, this would request location update from driver's mobile app
      console.log('Requesting location update for driver:', driverId);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // This would typically trigger a re-fetch of driver data
    } catch (error) {
      console.error('Failed to refresh location:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCallDriver = (driver: Driver) => {
    // In a real app, this would initiate a call or send a notification
    console.log('Calling driver:', driver.phone);
    window.open(`tel:${driver.phone}`);
  };

  const handleCallCustomer = (delivery: Delivery) => {
    // Extract phone from order data
    console.log('Calling customer for delivery:', delivery._id);
    // window.open(`tel:${customerPhone}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Live Delivery Tracking</h2>
          <p className="text-muted-foreground">
            Monitor active deliveries and driver locations in real-time
          </p>
        </div>
        <Button
          onClick={() => window.location.reload()}
          disabled={isRefreshing}
          variant="outline"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh All
        </Button>
      </div>

      {deliveries.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Truck className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900">No Active Deliveries</h3>
            <p className="text-gray-500 mt-2">Active deliveries will appear here for real-time tracking</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Active Deliveries</h3>
            {deliveries.map((delivery) => {
              const driver = getDriverForDelivery(delivery.driverId);
              const progress = getProgressPercentage(delivery.status);
              const estimatedArrival = getEstimatedArrival(delivery);
              const duration = getDeliveryDuration(delivery);
              const isDelayed = isDeliveryDelayed(delivery);

              return (
                <Card
                  key={delivery._id}
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-lg",
                    selectedDelivery?._id === delivery._id && "ring-2 ring-blue-500",
                    isDelayed && "border-red-300 bg-red-50"
                  )}
                  onClick={() => setSelectedDelivery(delivery)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-base">Delivery #{delivery._id.slice(-6)}</CardTitle>
                        <CardDescription>
                          {delivery.deliveryAddress.street}, {delivery.deliveryAddress.city}
                        </CardDescription>
                      </div>
                      <Badge className={statusColors[delivery.status]}>
                        {delivery.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Progress</span>
                        <span className="text-sm font-medium">{Math.round(progress)}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />

                      {driver && (
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">
                              {driver.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{driver.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {driver.vehicleType}
                          </Badge>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>ETA: {estimatedArrival}</span>
                        </div>
                        {duration && (
                          <span className="text-muted-foreground">{duration}</span>
                        )}
                      </div>

                      {isDelayed && (
                        <div className="flex items-center gap-1 text-red-600 text-sm">
                          <AlertCircle className="h-3 w-3" />
                          <span>Delivery is delayed</span>
                        </div>
                      )}

                      <div className="flex gap-2 pt-2">
                        {driver && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCallDriver(driver);
                            }}
                          >
                            <Phone className="h-3 w-3 mr-1" />
                            Call Driver
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCallCustomer(delivery);
                          }}
                        >
                          <Phone className="h-3 w-3 mr-1" />
                          Call Customer
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Tracking Details</h3>
            {selectedDelivery ? (
              <Card>
                <CardHeader>
                  <CardTitle>Delivery #{selectedDelivery._id.slice(-6)}</CardTitle>
                  <CardDescription>Real-time tracking information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Delivery Address</h4>
                    <div className="text-sm text-muted-foreground">
                      <p>{selectedDelivery.deliveryAddress.street}</p>
                      <p>{selectedDelivery.deliveryAddress.city}, {selectedDelivery.deliveryAddress.zipCode}</p>
                      {selectedDelivery.deliveryAddress.instructions && (
                        <p className="mt-1 text-blue-600">📝 {selectedDelivery.deliveryAddress.instructions}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Tracking Timeline</h4>
                    <div className="space-y-2">
                      {selectedDelivery.trackingUpdates.map((update, index) => (
                        <div key={index} className="flex items-center gap-3 text-sm">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <div>
                            <span className="font-medium capitalize">
                              {update.status.replace('_', ' ')}
                            </span>
                            <span className="text-muted-foreground ml-2">
                              {new Date(update.timestamp).toLocaleString()}
                            </span>
                            {update.note && (
                              <p className="text-muted-foreground">{update.note}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {selectedDelivery.driverId && (
                    <div>
                      <h4 className="font-medium mb-2">Driver Information</h4>
                      {(() => {
                        const driver = getDriverForDelivery(selectedDelivery.driverId);
                        return driver ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Avatar>
                                <AvatarFallback>
                                  {driver.name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{driver.name}</p>
                                <p className="text-sm text-muted-foreground">{driver.phone}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                              <span>Vehicle: {driver.vehicleType} ({driver.vehicleNumber})</span>
                              <span>Rating: {driver.rating.toFixed(1)} ⭐</span>
                            </div>
                            {driver.currentLocation && (
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1 text-sm text-green-600">
                                  <MapPin className="h-3 w-3" />
                                  <span>Live location available</span>
                                </div>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleRefreshLocation(driver._id)}
                                  disabled={isRefreshing}
                                >
                                  <RefreshCw className={`h-3 w-3 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
                                  Update
                                </Button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-muted-foreground">Driver information not available</p>
                        );
                      })()}
                    </div>
                  )}

                  <div>
                    <h4 className="font-medium mb-2">Delivery Stats</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Distance:</span>
                        <span className="ml-2 font-medium">{selectedDelivery.distance.toFixed(1)} km</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Fee:</span>
                        <span className="ml-2 font-medium">${selectedDelivery.deliveryFee.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Priority:</span>
                        <span className="ml-2 font-medium">{selectedDelivery.priority}/5</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Status:</span>
                        <Badge className={cn("ml-2", statusColors[selectedDelivery.status])}>
                          {selectedDelivery.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Navigation className="h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-muted-foreground">Select a delivery to view tracking details</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}