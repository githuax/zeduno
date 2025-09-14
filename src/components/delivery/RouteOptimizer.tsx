import { Route, MapPin, Clock, Truck, Zap, Calculator, Save } from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { Delivery, Driver } from '@/types/delivery.types';

interface RouteOptimizerProps {
  deliveries: Delivery[];
  drivers: Driver[];
  onOptimize: () => void;
}

interface OptimizedRoute {
  driverId: string;
  deliveries: Delivery[];
  totalDistance: number;
  estimatedDuration: number;
  order: number[];
}

export function RouteOptimizer({ deliveries, drivers, onOptimize }: RouteOptimizerProps) {
  const [selectedDriver, setSelectedDriver] = useState<string>('');
  const [optimizedRoutes, setOptimizedRoutes] = useState<OptimizedRoute[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const unassignedDeliveries = deliveries.filter(d => !d.driverId && d.status === 'ready');
  const availableDrivers = drivers.filter(d => d.status === 'available');

  // Simple distance calculation (in real app, use Google Maps API)
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Simplified route optimization using nearest neighbor algorithm
  const optimizeRoute = (deliveryList: Delivery[], startLat = 40.7128, startLng = -74.0060): number[] => {
    if (deliveryList.length === 0) return [];
    
    const unvisited = [...Array(deliveryList.length).keys()];
    const route = [];
    let currentLat = startLat;
    let currentLng = startLng;

    while (unvisited.length > 0) {
      let nearest = 0;
      let minDistance = Infinity;

      for (let i = 0; i < unvisited.length; i++) {
        const delivery = deliveryList[unvisited[i]];
        const lat = delivery.deliveryAddress.coordinates?.lat || 40.7128;
        const lng = delivery.deliveryAddress.coordinates?.lng || -74.0060;
        const distance = calculateDistance(currentLat, currentLng, lat, lng);

        if (distance < minDistance) {
          minDistance = distance;
          nearest = i;
        }
      }

      const chosenIndex = unvisited[nearest];
      route.push(chosenIndex);
      const chosenDelivery = deliveryList[chosenIndex];
      currentLat = chosenDelivery.deliveryAddress.coordinates?.lat || 40.7128;
      currentLng = chosenDelivery.deliveryAddress.coordinates?.lng || -74.0060;
      unvisited.splice(nearest, 1);
    }

    return route;
  };

  const calculateRouteStats = (deliveryList: Delivery[], routeOrder: number[]) => {
    let totalDistance = 0;
    let currentLat = 40.7128; // Restaurant location
    let currentLng = -74.0060;

    for (const index of routeOrder) {
      const delivery = deliveryList[index];
      const lat = delivery.deliveryAddress.coordinates?.lat || 40.7128;
      const lng = delivery.deliveryAddress.coordinates?.lng || -74.0060;
      totalDistance += calculateDistance(currentLat, currentLng, lat, lng);
      currentLat = lat;
      currentLng = lng;
    }

    const estimatedDuration = Math.round(totalDistance * 3 + routeOrder.length * 5); // 3min/km + 5min per stop

    return { totalDistance: Math.round(totalDistance * 10) / 10, estimatedDuration };
  };

  const handleOptimizeAllRoutes = async () => {
    if (unassignedDeliveries.length === 0) {
      toast({
        title: 'No deliveries to optimize',
        description: 'All deliveries are already assigned or there are no ready orders',
        variant: 'destructive',
      });
      return;
    }

    setIsOptimizing(true);

    try {
      // Group deliveries by proximity and driver capacity
      const deliveriesPerDriver = Math.ceil(unassignedDeliveries.length / Math.max(availableDrivers.length, 1));
      const routes: OptimizedRoute[] = [];

      for (let i = 0; i < availableDrivers.length && i * deliveriesPerDriver < unassignedDeliveries.length; i++) {
        const driver = availableDrivers[i];
        const startIndex = i * deliveriesPerDriver;
        const endIndex = Math.min(startIndex + deliveriesPerDriver, unassignedDeliveries.length);
        const driverDeliveries = unassignedDeliveries.slice(startIndex, endIndex);

        if (driverDeliveries.length > 0) {
          const optimizedOrder = optimizeRoute(driverDeliveries);
          const { totalDistance, estimatedDuration } = calculateRouteStats(driverDeliveries, optimizedOrder);

          routes.push({
            driverId: driver._id,
            deliveries: driverDeliveries,
            totalDistance,
            estimatedDuration,
            order: optimizedOrder,
          });
        }
      }

      setOptimizedRoutes(routes);
      
      toast({
        title: 'Routes Optimized',
        description: `Generated ${routes.length} optimized routes for available drivers`,
      });
    } catch (error) {
      toast({
        title: 'Optimization Failed',
        description: 'Failed to optimize delivery routes',
        variant: 'destructive',
      });
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleOptimizeForDriver = async () => {
    if (!selectedDriver) {
      toast({
        title: 'Select a driver',
        description: 'Please select a driver to optimize routes for',
        variant: 'destructive',
      });
      return;
    }

    setIsOptimizing(true);

    try {
      const optimizedOrder = optimizeRoute(unassignedDeliveries);
      const { totalDistance, estimatedDuration } = calculateRouteStats(unassignedDeliveries, optimizedOrder);

      const route: OptimizedRoute = {
        driverId: selectedDriver,
        deliveries: unassignedDeliveries,
        totalDistance,
        estimatedDuration,
        order: optimizedOrder,
      };

      setOptimizedRoutes([route]);
      
      toast({
        title: 'Route Optimized',
        description: `Optimized route for selected driver with ${unassignedDeliveries.length} deliveries`,
      });
    } catch (error) {
      toast({
        title: 'Optimization Failed',
        description: 'Failed to optimize delivery route',
        variant: 'destructive',
      });
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleSaveRoutes = async () => {
    if (optimizedRoutes.length === 0) {
      toast({
        title: 'No routes to save',
        description: 'Please optimize routes first',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);

    try {
      for (const route of optimizedRoutes) {
        // Assign deliveries to driver
        for (let i = 0; i < route.deliveries.length; i++) {
          const delivery = route.deliveries[route.order[i]];
          const response = await fetch(`/api/deliveries/assign`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
            body: JSON.stringify({
              deliveryId: delivery._id,
              driverId: route.driverId,
              order: i + 1,
            }),
          });

          if (!response.ok) {
            throw new Error(`Failed to assign delivery ${delivery._id}`);
          }
        }
      }

      toast({
        title: 'Routes Saved',
        description: 'All optimized routes have been assigned to drivers',
      });

      setOptimizedRoutes([]);
      onOptimize();
    } catch (error) {
      toast({
        title: 'Save Failed',
        description: 'Failed to save optimized routes',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getDriverName = (driverId: string): string => {
    const driver = drivers.find(d => d._id === driverId);
    return driver ? driver.name : 'Unknown Driver';
  };

  const getDriverVehicle = (driverId: string): string => {
    const driver = drivers.find(d => d._id === driverId);
    return driver ? driver.vehicleType : 'unknown';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Route Optimizer</h2>
          <p className="text-muted-foreground">
            Optimize delivery routes for efficiency and customer satisfaction
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Unassigned Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{unassignedDeliveries.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Ready for assignment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Available Drivers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{availableDrivers.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Ready for deliveries</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Optimized Routes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{optimizedRoutes.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Generated routes</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Route Optimization</CardTitle>
          <CardDescription>
            Generate optimized delivery routes based on distance and driver availability
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Optimize for Specific Driver</label>
              <div className="flex gap-2">
                <Select value={selectedDriver} onValueChange={setSelectedDriver}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select driver" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableDrivers.map(driver => (
                      <SelectItem key={driver._id} value={driver._id}>
                        {driver.name} ({driver.vehicleType})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleOptimizeForDriver}
                  disabled={isOptimizing || !selectedDriver || unassignedDeliveries.length === 0}
                >
                  <Calculator className="mr-2 h-4 w-4" />
                  Optimize
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Optimize All Routes</label>
              <Button
                onClick={handleOptimizeAllRoutes}
                disabled={isOptimizing || unassignedDeliveries.length === 0 || availableDrivers.length === 0}
                className="w-full"
              >
                <Zap className="mr-2 h-4 w-4" />
                {isOptimizing ? 'Optimizing...' : 'Auto-Optimize All'}
              </Button>
            </div>
          </div>

          {optimizedRoutes.length > 0 && (
            <div className="mt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Optimized Routes</h3>
                <Button
                  onClick={handleSaveRoutes}
                  disabled={isSaving}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {isSaving ? 'Saving...' : 'Save Routes'}
                </Button>
              </div>

              <div className="space-y-4">
                {optimizedRoutes.map((route, index) => (
                  <Card key={index} className="border-l-4 border-l-blue-500">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-base">
                            {getDriverName(route.driverId)}
                          </CardTitle>
                          <CardDescription>
                            <Badge variant="outline" className="mt-1">
                              {getDriverVehicle(route.driverId)}
                            </Badge>
                          </CardDescription>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold">{route.deliveries.length} stops</div>
                          <div className="text-sm text-muted-foreground">
                            {route.totalDistance} km • {route.estimatedDuration} min
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {route.order.map((deliveryIndex, stopIndex) => {
                          const delivery = route.deliveries[deliveryIndex];
                          return (
                            <div key={delivery._id} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                              <div className="flex items-center justify-center w-6 h-6 bg-blue-500 text-white rounded-full text-xs font-bold">
                                {stopIndex + 1}
                              </div>
                              <div className="flex-1">
                                <div className="font-medium text-sm">
                                  {delivery.deliveryAddress.street}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {delivery.deliveryAddress.city}, {delivery.deliveryAddress.zipCode}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-xs text-muted-foreground">
                                  {delivery.distance?.toFixed(1)} km
                                </div>
                                <Badge variant="outline" className="text-xs">
                                  Priority {delivery.priority}
                                </Badge>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {unassignedDeliveries.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Route className="h-8 w-8 mx-auto mb-2" />
              <p>No unassigned deliveries to optimize</p>
            </div>
          )}

          {availableDrivers.length === 0 && unassignedDeliveries.length > 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Truck className="h-8 w-8 mx-auto mb-2" />
              <p>No available drivers for route optimization</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}