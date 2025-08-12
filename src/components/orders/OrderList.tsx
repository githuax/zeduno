import { Clock, DollarSign, MapPin, Printer, Users, ChefHat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Order, OrderStatus, OrderType } from '@/types/order.types';
import { cn } from '@/lib/utils';

interface OrderListProps {
  orders: Order[];
  onOrderClick: (order: Order) => void;
  onPrintKitchen: (orderId: string) => void;
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

const orderTypeIcons: Record<OrderType, React.ReactNode> = {
  'dine-in': <Users className="h-4 w-4" />,
  'takeaway': <MapPin className="h-4 w-4" />,
  'delivery': <MapPin className="h-4 w-4" />,
};

export function OrderList({ orders, onOrderClick, onPrintKitchen, isLoading }: OrderListProps) {
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
        <ChefHat className="h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900">No orders found</h3>
        <p className="text-gray-500 mt-2">Orders will appear here when created</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {orders.map((order) => (
        <Card
          key={order._id}
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => onOrderClick(order)}
        >
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-lg">{order.orderNumber}</h3>
                  {orderTypeIcons[order.orderType]}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {order.customerName}
                  {order.orderType === 'dine-in' && order.tableId && typeof order.tableId === 'object' && 
                    ` • Table ${order.tableId.tableNumber}`}
                </p>
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
                {new Date(order.createdAt).toLocaleTimeString()}
              </div>

              <div className="flex gap-2 pt-2" onClick={(e) => e.stopPropagation()}>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => onPrintKitchen(order._id)}
                >
                  <Printer className="h-3 w-3 mr-1" />
                  Kitchen
                </Button>
                {order.status === 'pending' && (
                  <Button size="sm" className="flex-1 bg-restaurant-primary hover:bg-restaurant-primary/90">
                    Confirm
                  </Button>
                )}
                {order.status === 'ready' && (
                  <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700">
                    Complete
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}