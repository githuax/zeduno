import { Clock, MapPin, Truck, User, Phone, Package, Navigation, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Order } from '@/types/order.types';
import { Delivery, Driver, DeliveryStatus } from '@/types/delivery.types';
import { cn } from '@/lib/utils';

interface DeliveryOrderListProps {
  orders: Order[];
  deliveries: Delivery[];
  drivers: Driver[];
  onOrderClick: (order: Order) => void;
  onAssignDriver: (orderId: string, driverId: string) => void;
  onUpdateStatus: (deliveryId: string, status: DeliveryStatus) => void;
  isLoading?: boolean;
}

const deliveryStatusColors: Record<DeliveryStatus, string> = {
  preparing: 'bg-orange-100 text-orange-800',
  ready: 'bg-blue-100 text-blue-800',
  assigned: 'bg-purple-100 text-purple-800',
  picked_up: 'bg-yellow-100 text-yellow-800',
  en_route: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
};

export function DeliveryOrderList({
  orders,
  deliveries,
  drivers,
  onOrderClick,
  onAssignDriver,
  onUpdateStatus,
  isLoading,
}: DeliveryOrderListProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16 mt-2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Truck className="h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900">No delivery orders</h3>
        <p className="text-gray-500 mt-2">Delivery orders will appear here when created</p>
      </div>
    );
  }

  const getDeliveryForOrder = (orderId: string): Delivery | undefined => {
    return deliveries.find(d => d.orderId === orderId);
  };

  const getDriverForDelivery = (driverId?: string): Driver | undefined => {
    return driverId ? drivers.find(d => d._id === driverId) : undefined;
  };

  const getTimeElapsed = (createdAt: string): string => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - created.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    return `${diffHours}h ${diffMinutes % 60}m ago`;
  };

  const getEstimatedDeliveryTime = (order: Order): string => {
    const delivery = getDeliveryForOrder(order._id);
    if (delivery && delivery.estimatedDeliveryTime) {
      return new Date(delivery.estimatedDeliveryTime).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
    
    // Fallback calculation
    const created = new Date(order.createdAt);
    const estimatedMinutes = order.items.reduce((total, item) => {
      const prepTime = typeof item.menuItem === 'object' ? item.menuItem.preparationTime : 15;
      return Math.max(total, prepTime);
    }, 0) + 30; // Add 30 minutes for delivery
    
    const deliveryTime = new Date(created.getTime() + estimatedMinutes * 60000);
    return deliveryTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getNextDeliveryStatus = (currentStatus: DeliveryStatus): DeliveryStatus | null => {
    const statusFlow: Record<DeliveryStatus, DeliveryStatus | null> = {
      preparing: 'ready',
      ready: 'assigned',
      assigned: 'picked_up',
      picked_up: 'en_route',
      en_route: 'delivered',
      delivered: null,
      failed: null,
    };
    return statusFlow[currentStatus];
  };

  const getUrgencyLevel = (order: Order, delivery?: Delivery): 'normal' | 'attention' | 'urgent' => {
    const elapsed = (new Date().getTime() - new Date(order.createdAt).getTime()) / (1000 * 60);
    
    if (delivery?.status === 'en_route' && elapsed > 60) return 'urgent';
    if (delivery?.status === 'assigned' && elapsed > 45) return 'attention';
    if (order.status === 'ready' && elapsed > 30) return 'attention';
    if (order.status === 'preparing' && elapsed > 45) return 'attention';
    
    return 'normal';
  };

  const availableDrivers = drivers.filter(d => d.status === 'available');

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {orders.map((order) => {
        const delivery = getDeliveryForOrder(order._id);
        const driver = getDriverForDelivery(delivery?.driverId);
        const timeElapsed = getTimeElapsed(order.createdAt);
        const estimatedDelivery = getEstimatedDeliveryTime(order);
        const urgency = getUrgencyLevel(order, delivery);
        const nextStatus = delivery ? getNextDeliveryStatus(delivery.status) : null;
        const deliveryStatus = delivery?.status || 'preparing';

        return (
          <Card
            key={order._id}
            className={cn(
              "cursor-pointer hover:shadow-lg transition-all",
              urgency === 'urgent' && 'ring-2 ring-red-500 animate-pulse',
              urgency === 'attention' && 'ring-2 ring-yellow-500'
            )}
            onClick={() => onOrderClick(order)}
          >
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg">{order.orderNumber}</h3>
                    <Truck className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {order.customerName}
                  </p>
                  {order.customerPhone && (
                    <p className="text-xs text-muted-foreground">
                      📞 {order.customerPhone}
                    </p>
                  )}
                </div>
                <Badge className={cn('ml-2', deliveryStatusColors[deliveryStatus])}>
                  {deliveryStatus.replace('_', ' ')}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-3">
                {order.deliveryAddress && (
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-3 w-3 mt-0.5 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="font-medium">{order.deliveryAddress.street}</p>
                      <p className="text-muted-foreground text-xs">
                        {order.deliveryAddress.city}, {order.deliveryAddress.zipCode}
                      </p>
                      {order.deliveryAddress.instructions && (
                        <p className="text-xs text-blue-600 italic">
                          📝 {order.deliveryAddress.instructions}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Items:</span>
                  <span className="font-medium">{order.items.length}</span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total:</span>
                  <span className="font-semibold text-lg">${order.total.toFixed(2)}</span>
                </div>

                {delivery && delivery.deliveryFee > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Delivery Fee:</span>
                    <span className="font-medium">${delivery.deliveryFee.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Payment:</span>
                  <Badge variant={order.paymentStatus === 'paid' ? 'default' : 'secondary'}>
                    {order.paymentStatus}
                  </Badge>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>{timeElapsed}</span>
                  <span>•</span>
                  <span>Est. delivery: {estimatedDelivery}</span>
                </div>

                {driver && (
                  <div className="flex items-center gap-2 text-xs bg-blue-50 p-2 rounded">
                    <User className="h-3 w-3" />
                    <span>Driver: {driver.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {driver.vehicleType}
                    </Badge>
                  </div>
                )}

                {delivery?.distance && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Navigation className="h-3 w-3" />
                    <span>{delivery.distance.toFixed(1)} km</span>
                  </div>
                )}

                {urgency !== 'normal' && (
                  <div className="flex items-center gap-1 text-xs">
                    <AlertTriangle className="h-3 w-3" />
                    <span className={urgency === 'urgent' ? 'text-red-600' : 'text-yellow-600'}>
                      {urgency === 'urgent' ? 'Urgent attention needed!' : 'Needs attention'}
                    </span>
                  </div>
                )}

                <div className="flex gap-1 pt-2" onClick={(e) => e.stopPropagation()}>
                  {deliveryStatus === 'ready' && !driver && availableDrivers.length > 0 && (
                    <Select onValueChange={(driverId) => onAssignDriver(order._id, driverId)}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Assign Driver" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableDrivers.map(driver => (
                          <SelectItem key={driver._id} value={driver._id}>
                            {driver.name} ({driver.vehicleType})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  
                  {nextStatus && delivery && (
                    <Button
                      size="sm"
                      className={cn(
                        "flex-1 text-xs",
                        nextStatus === 'delivered' ? 'bg-green-600 hover:bg-green-700' : 
                        'bg-restaurant-primary hover:bg-restaurant-primary/90'
                      )}
                      onClick={() => onUpdateStatus(delivery._id, nextStatus)}
                    >
                      {nextStatus === 'ready' && 'Mark Ready'}
                      {nextStatus === 'assigned' && 'Assign Driver'}
                      {nextStatus === 'picked_up' && 'Picked Up'}
                      {nextStatus === 'en_route' && 'En Route'}
                      {nextStatus === 'delivered' && 'Delivered'}
                    </Button>
                  )}
                </div>

                {deliveryStatus === 'ready' && availableDrivers.length === 0 && (
                  <div className="text-xs text-center text-yellow-600 border-t pt-2">
                    No drivers available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}