import { Clock, Phone, Package, Bell, Receipt, CheckCircle, AlertCircle } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Order, OrderStatus } from '@/types/order.types';

interface TakeawayOrderListProps {
  orders: Order[];
  onOrderClick: (order: Order) => void;
  onUpdateStatus: (orderId: string, status: OrderStatus) => void;
  onNotifyCustomer: (order: Order) => void;
  onPrintReceipt: (order: Order) => void;
  isLoading?: boolean;
}

const statusColors: Record<OrderStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  preparing: 'bg-orange-100 text-orange-800',
  ready: 'bg-green-100 text-green-800',
  completed: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800',
};

export function TakeawayOrderList({ 
  orders, 
  onOrderClick, 
  onUpdateStatus,
  onNotifyCustomer,
  onPrintReceipt,
  isLoading 
}: TakeawayOrderListProps) {
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
        <Package className="h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900">No takeaway orders</h3>
        <p className="text-gray-500 mt-2">Orders will appear here when created</p>
      </div>
    );
  }

  const getTimeElapsed = (createdAt: string): string => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - created.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    return `${diffHours}h ${diffMinutes % 60}m ago`;
  };

  const getEstimatedPickupTime = (order: Order): string => {
    const created = new Date(order.createdAt);
    const estimatedMinutes = order.items.reduce((total, item) => {
      const prepTime = typeof item.menuItem === 'object' ? item.menuItem.preparationTime : 15;
      return Math.max(total, prepTime);
    }, 0);
    
    const pickupTime = new Date(created.getTime() + estimatedMinutes * 60000);
    return pickupTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getNextStatus = (currentStatus: OrderStatus): OrderStatus | null => {
    const statusFlow: Record<OrderStatus, OrderStatus | null> = {
      pending: 'confirmed',
      confirmed: 'preparing',
      preparing: 'ready',
      ready: 'completed',
      completed: null,
      cancelled: null,
    };
    return statusFlow[currentStatus];
  };

  const getUrgencyLevel = (order: Order): 'normal' | 'attention' | 'urgent' => {
    const elapsed = (new Date().getTime() - new Date(order.createdAt).getTime()) / (1000 * 60);
    
    if (order.status === 'ready' && elapsed > 15) return 'urgent';
    if (order.status === 'preparing' && elapsed > 30) return 'attention';
    if (order.status === 'pending' && elapsed > 10) return 'attention';
    
    return 'normal';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {orders.map((order) => {
        const nextStatus = getNextStatus(order.status);
        const urgency = getUrgencyLevel(order);
        const timeElapsed = getTimeElapsed(order.createdAt);
        const estimatedPickup = getEstimatedPickupTime(order);

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
                    <Package className="h-4 w-4 text-muted-foreground" />
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
                <Badge className={cn('ml-2', statusColors[order.status])}>
                  {order.status}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Items:</span>
                  <span className="font-medium">{order.items.length}</span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total:</span>
                  <span className="font-semibold text-lg">${order.total.toFixed(2)}</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Payment:</span>
                  <Badge variant={order.paymentStatus === 'paid' ? 'default' : 'secondary'}>
                    {order.paymentStatus}
                  </Badge>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>{timeElapsed}</span>
                  {order.status !== 'completed' && (
                    <>
                      <span>•</span>
                      <span>Est. pickup: {estimatedPickup}</span>
                    </>
                  )}
                </div>

                {urgency === 'urgent' && (
                  <div className="flex items-center gap-1 text-red-600 text-xs">
                    <AlertCircle className="h-3 w-3" />
                    <span>Order waiting too long!</span>
                  </div>
                )}

                <div className="flex gap-1 pt-2" onClick={(e) => e.stopPropagation()}>
                  {order.status === 'ready' && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => onNotifyCustomer(order)}
                      >
                        <Bell className="h-3 w-3 mr-1" />
                        Notify
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onPrintReceipt(order)}
                      >
                        <Receipt className="h-3 w-3" />
                      </Button>
                    </>
                  )}
                  
                  {nextStatus && (
                    <Button
                      size="sm"
                      className={cn(
                        "flex-1",
                        nextStatus === 'completed' ? 'bg-green-600 hover:bg-green-700' : 
                        'bg-restaurant-primary hover:bg-restaurant-primary/90'
                      )}
                      onClick={() => onUpdateStatus(order._id, nextStatus)}
                    >
                      {nextStatus === 'confirmed' && 'Confirm'}
                      {nextStatus === 'preparing' && 'Start Prep'}
                      {nextStatus === 'ready' && 'Mark Ready'}
                      {nextStatus === 'completed' && (
                        <>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Picked Up
                        </>
                      )}
                    </Button>
                  )}
                </div>

                {order.status === 'ready' && order.customerPhone && (
                  <div className="text-xs text-center text-muted-foreground border-t pt-2">
                    Customer should be notified for pickup
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