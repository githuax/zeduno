import { Plus, Truck, MapPin, Clock, Users, Route, Navigation, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';

import { DeliveryOrderList } from '@/components/delivery/DeliveryOrderList';
import { DeliveryTracking } from '@/components/delivery/DeliveryTracking';
import { DriverManagement } from '@/components/delivery/DriverManagement';
import { RouteOptimizer } from '@/components/delivery/RouteOptimizer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreateOrderDialog, OrderDetailsDialog } from '@/features/orders';
import { useOrders } from '@/features/orders';
import { toast } from '@/hooks/use-toast';
import { useDeliveries } from '@/hooks/useDeliveries';
import { useDrivers } from '@/hooks/useDrivers';
import { DeliveryStatus } from '@/types/delivery.types';
import { Order, OrderStatus } from '@/types/order.types';

export default function DeliveryService() {
  const [selectedStatus, setSelectedStatus] = useState<DeliveryStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateOrderOpen, setIsCreateOrderOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const { data: orders = [], isLoading: ordersLoading, refetch: refetchOrders } = useOrders({
    orderType: 'delivery',
  });

  const { data: deliveries = [], isLoading: deliveriesLoading, refetch: refetchDeliveries } = useDeliveries();
  const { data: drivers = [], refetch: refetchDrivers } = useDrivers();

  const filteredOrders = orders.filter(order => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        order.orderNumber.toLowerCase().includes(query) ||
        order.customerName.toLowerCase().includes(query) ||
        (order.customerPhone && order.customerPhone.toLowerCase().includes(query)) ||
        (order.deliveryAddress && order.deliveryAddress.street.toLowerCase().includes(query))
      );
    }
    return true;
  });

  const stats = {
    totalOrders: orders.length,
    preparing: orders.filter(o => o.status === 'preparing').length,
    ready: orders.filter(o => o.status === 'ready').length,
    enRoute: deliveries.filter(d => d.status === 'en_route').length,
    delivered: orders.filter(o => o.status === 'completed').length,
    activeDrivers: drivers.filter(d => d.status === 'available' || d.status === 'busy').length,
    totalDrivers: drivers.length,
    avgDeliveryTime: calculateAverageDeliveryTime(deliveries),
    totalRevenue: orders
      .filter(o => o.paymentStatus === 'paid')
      .reduce((sum, o) => sum + o.total, 0),
  };

  function calculateAverageDeliveryTime(deliveries: any[]): number {
    const completedDeliveries = deliveries.filter(d => 
      d.status === 'delivered' && d.actualDeliveryTime && d.actualPickupTime
    );
    
    if (completedDeliveries.length === 0) return 0;
    
    const totalTime = completedDeliveries.reduce((sum, delivery) => {
      const pickup = new Date(delivery.actualPickupTime).getTime();
      const delivered = new Date(delivery.actualDeliveryTime).getTime();
      return sum + (delivered - pickup);
    }, 0);
    
    return Math.round(totalTime / completedDeliveries.length / 1000 / 60); // minutes
  }

  const handleOrderClick = (order: Order) => {
    setSelectedOrder(order);
    setIsDetailsOpen(true);
  };

  const handleAssignDriver = async (orderId: string, driverId: string) => {
    try {
      const response = await fetch(`/api/deliveries/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ orderId, driverId }),
      });

      if (response.ok) {
        toast({
          title: 'Driver Assigned',
          description: 'Driver has been assigned to the delivery',
        });
        refetchOrders();
        refetchDeliveries();
        refetchDrivers();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to assign driver',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateDeliveryStatus = async (deliveryId: string, status: DeliveryStatus) => {
    try {
      const response = await fetch(`/api/deliveries/${deliveryId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        toast({
          title: 'Status Updated',
          description: 'Delivery status has been updated',
        });
        refetchDeliveries();
        refetchOrders();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update delivery status',
        variant: 'destructive',
      });
    }
  };

  // Auto-refresh deliveries every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      refetchOrders();
      refetchDeliveries();
      refetchDrivers();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [autoRefresh, refetchOrders, refetchDeliveries, refetchDrivers]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-restaurant-dark">Delivery Service</h1>
          <p className="text-muted-foreground mt-2">
            Manage deliveries, drivers, and route optimization
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? 'bg-green-50' : ''}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${autoRefresh ? 'animate-spin' : ''}`} />
            {autoRefresh ? 'Live Updates' : 'Manual Refresh'}
          </Button>
          <Button 
            onClick={() => setIsCreateOrderOpen(true)}
            className="bg-restaurant-primary hover:bg-restaurant-primary/90"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Delivery Order
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-8 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
            <p className="text-xs text-muted-foreground mt-1">All deliveries</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Preparing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.preparing}</div>
            <p className="text-xs text-muted-foreground mt-1">In kitchen</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Ready</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.ready}</div>
            <p className="text-xs text-muted-foreground mt-1">For pickup</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">En Route</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.enRoute}</div>
            <p className="text-xs text-muted-foreground mt-1">Being delivered</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Delivered</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.delivered}</div>
            <p className="text-xs text-muted-foreground mt-1">Completed today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Active Drivers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-restaurant-primary">
              {stats.activeDrivers}/{stats.totalDrivers}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Available</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Avg Delivery</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgDeliveryTime}m</div>
            <p className="text-xs text-muted-foreground mt-1">Minutes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${stats.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">Today's total</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="orders" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="orders">Delivery Orders</TabsTrigger>
          <TabsTrigger value="drivers">Driver Management</TabsTrigger>
          <TabsTrigger value="routes">Route Optimizer</TabsTrigger>
          <TabsTrigger value="tracking">Live Tracking</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 flex gap-2">
                  <div className="relative flex-1">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search by order #, customer, phone, or address..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select
                    value={selectedStatus}
                    onValueChange={(value) => setSelectedStatus(value as DeliveryStatus | 'all')}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="preparing">Preparing</SelectItem>
                      <SelectItem value="ready">Ready</SelectItem>
                      <SelectItem value="assigned">Assigned</SelectItem>
                      <SelectItem value="picked_up">Picked Up</SelectItem>
                      <SelectItem value="en_route">En Route</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <DeliveryOrderList
                orders={filteredOrders}
                deliveries={deliveries}
                drivers={drivers}
                onOrderClick={handleOrderClick}
                onAssignDriver={handleAssignDriver}
                onUpdateStatus={handleUpdateDeliveryStatus}
                isLoading={ordersLoading || deliveriesLoading}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="drivers" className="mt-4">
          <DriverManagement
            drivers={drivers}
            onRefresh={refetchDrivers}
          />
        </TabsContent>

        <TabsContent value="routes" className="mt-4">
          <RouteOptimizer
            deliveries={deliveries.filter(d => ['ready', 'assigned'].includes(d.status))}
            drivers={drivers.filter(d => d.status === 'available')}
            onOptimize={refetchDeliveries}
          />
        </TabsContent>

        <TabsContent value="tracking" className="mt-4">
          <DeliveryTracking
            deliveries={deliveries.filter(d => ['assigned', 'picked_up', 'en_route'].includes(d.status))}
            drivers={drivers}
          />
        </TabsContent>
      </Tabs>

      <CreateOrderDialog
        open={isCreateOrderOpen}
        onOpenChange={setIsCreateOrderOpen}
        onSuccess={() => {
          refetchOrders();
          setIsCreateOrderOpen(false);
        }}
        preselectedOrderType="delivery"
      />

      {selectedOrder && (
        <OrderDetailsDialog
          order={selectedOrder}
          open={isDetailsOpen}
          onOpenChange={setIsDetailsOpen}
          onUpdate={() => {
            refetchOrders();
            refetchDeliveries();
          }}
        />
      )}
    </div>
  );
}