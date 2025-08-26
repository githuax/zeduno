import { useState, useEffect } from 'react';
import { Plus, Clock, Phone, Package, Bell, Filter, RefreshCw, Search, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { TakeawayOrderList } from '@/components/takeaway/TakeawayOrderList';
import { QuickOrderDialog } from '@/components/takeaway/QuickOrderDialog';
import { OrderDetailsDialog } from '@/components/orders/OrderDetailsDialog';
import { CreateOrderDialog } from '@/components/orders/CreateOrderDialog';
import { PrepTimeEstimator } from '@/components/takeaway/PrepTimeEstimator';
import { useOrders } from '@/hooks/useOrders';
import { Order, OrderStatus } from '@/types/order.types';
import { toast } from '@/hooks/use-toast';
import { useCurrency } from '@/hooks/useCurrency';

export default function TakeawayOrders() {
  const { format: formatPrice } = useCurrency();
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isQuickOrderOpen, setIsQuickOrderOpen] = useState(false);
  const [isCreateOrderOpen, setIsCreateOrderOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const { data: orders = [], isLoading, refetch } = useOrders({
    orderType: 'takeaway',
    status: selectedStatus !== 'all' ? selectedStatus : undefined,
  });

  const filteredOrders = orders.filter(order => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        order.orderNumber.toLowerCase().includes(query) ||
        order.customerName.toLowerCase().includes(query) ||
        (order.customerPhone && order.customerPhone.toLowerCase().includes(query))
      );
    }
    return true;
  });

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    preparing: orders.filter(o => o.status === 'preparing').length,
    ready: orders.filter(o => o.status === 'ready').length,
    completed: orders.filter(o => o.status === 'completed').length,
    avgPrepTime: calculateAveragePrepTime(orders),
    totalRevenue: orders
      .filter(o => o.paymentStatus === 'paid')
      .reduce((sum, o) => sum + o.total, 0),
  };

  function calculateAveragePrepTime(orders: Order[]): number {
    const completedOrders = orders.filter(o => 
      o.status === 'completed' && o.completedAt && o.createdAt
    );
    
    if (completedOrders.length === 0) return 0;
    
    const totalTime = completedOrders.reduce((sum, order) => {
      const created = new Date(order.createdAt).getTime();
      const completed = new Date(order.completedAt!).getTime();
      return sum + (completed - created);
    }, 0);
    
    return Math.round(totalTime / completedOrders.length / 1000 / 60); // minutes
  }

  const handleOrderClick = (order: Order) => {
    setSelectedOrder(order);
    setIsDetailsOpen(true);
  };

  const handleNotifyCustomer = async (order: Order) => {
    try {
      // In a real app, this would send SMS/call the customer
      toast({
        title: 'Customer Notified',
        description: `${order.customerName} has been notified that order ${order.orderNumber} is ready for pickup`,
      });
      
      // You could integrate with SMS services like Twilio here
      console.log('Notifying customer:', {
        phone: order.customerPhone,
        message: `Hi ${order.customerName}, your order ${order.orderNumber} is ready for pickup!`
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to notify customer',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Order status updated',
        });
        refetch();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update order status',
        variant: 'destructive',
      });
    }
  };

  const handlePrintReceipt = (order: Order) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Takeaway Receipt - ${order.orderNumber}</title>
            <style>
              body { font-family: monospace; padding: 20px; width: 300px; }
              h1 { text-align: center; border-bottom: 2px solid black; }
              .header { margin-bottom: 20px; }
              .item { margin: 5px 0; }
              .total { border-top: 1px solid black; padding-top: 10px; font-weight: bold; }
              .footer { margin-top: 20px; text-align: center; font-size: 12px; }
            </style>
          </head>
          <body>
            <h1>TAKEAWAY RECEIPT</h1>
            <div class="header">
              <p><strong>Order #:</strong> ${order.orderNumber}</p>
              <p><strong>Customer:</strong> ${order.customerName}</p>
              ${order.customerPhone ? `<p><strong>Phone:</strong> ${order.customerPhone}</p>` : ''}
              <p><strong>Time:</strong> ${new Date(order.createdAt).toLocaleString()}</p>
            </div>
            <hr>
            <h2>ITEMS:</h2>
            ${order.items.map(item => `
              <div class="item">
                ${item.quantity}x ${typeof item.menuItem === 'object' ? item.menuItem.name : 'Item'} - ${formatPrice(item.price * item.quantity)}
                ${item.customizations?.map(c => `<br>&nbsp;&nbsp;+ ${c.option}`).join('') || ''}
                ${item.specialInstructions ? `<br>&nbsp;&nbsp;Note: ${item.specialInstructions}` : ''}
              </div>
            `).join('')}
            <div class="total">
              <p>Subtotal: KES ${order.subtotal.toFixed(2)}</p>
              <p>Tax: KES ${order.tax.toFixed(2)}</p>
              ${order.discount ? `<p>Discount: -KES ${order.discount.toFixed(2)}</p>` : ''}
              <p>TOTAL: KES ${order.total.toFixed(2)}</p>
            </div>
            <div class="footer">
              <p>Thank you for your order!</p>
              <p>Please keep this receipt for pickup</p>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  // Auto-refresh orders every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      refetch();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [autoRefresh, refetch]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-restaurant-dark">Takeaway Orders</h1>
          <p className="text-muted-foreground mt-2">
            Manage pickup orders and customer notifications
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? 'bg-green-50' : ''}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${autoRefresh ? 'animate-spin' : ''}`} />
            {autoRefresh ? 'Auto Refresh On' : 'Auto Refresh Off'}
          </Button>
          <Button 
            variant="outline"
            onClick={() => setIsQuickOrderOpen(true)}
          >
            <Clock className="mr-2 h-4 w-4" />
            Quick Order
          </Button>
          <Button 
            onClick={() => setIsCreateOrderOpen(true)}
            className="bg-restaurant-primary hover:bg-restaurant-primary/90"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Order
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting confirmation</p>
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
            <CardTitle className="text-sm font-medium">Ready for Pickup</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.ready}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting customer</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
            <p className="text-xs text-muted-foreground mt-1">Picked up</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Avg Prep Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.avgPrepTime}m</div>
            <p className="text-xs text-muted-foreground mt-1">Minutes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-restaurant-primary">KES {stats.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">Total sales</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by order #, customer name, or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select
                value={selectedStatus}
                onValueChange={(value) => setSelectedStatus(value as OrderStatus | 'all')}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="preparing">Preparing</SelectItem>
                  <SelectItem value="ready">Ready</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="active" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="active">Active Orders</TabsTrigger>
              <TabsTrigger value="ready">Ready for Pickup</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="prep-times">Prep Times</TabsTrigger>
            </TabsList>
            
            <TabsContent value="active" className="mt-4">
              <TakeawayOrderList
                orders={filteredOrders.filter(o => 
                  ['pending', 'confirmed', 'preparing'].includes(o.status)
                )}
                onOrderClick={handleOrderClick}
                onUpdateStatus={handleUpdateStatus}
                onNotifyCustomer={handleNotifyCustomer}
                onPrintReceipt={handlePrintReceipt}
                isLoading={isLoading}
              />
            </TabsContent>
            
            <TabsContent value="ready" className="mt-4">
              <TakeawayOrderList
                orders={filteredOrders.filter(o => o.status === 'ready')}
                onOrderClick={handleOrderClick}
                onUpdateStatus={handleUpdateStatus}
                onNotifyCustomer={handleNotifyCustomer}
                onPrintReceipt={handlePrintReceipt}
                isLoading={isLoading}
              />
            </TabsContent>
            
            <TabsContent value="completed" className="mt-4">
              <TakeawayOrderList
                orders={filteredOrders.filter(o => o.status === 'completed')}
                onOrderClick={handleOrderClick}
                onUpdateStatus={handleUpdateStatus}
                onNotifyCustomer={handleNotifyCustomer}
                onPrintReceipt={handlePrintReceipt}
                isLoading={isLoading}
              />
            </TabsContent>
            
            <TabsContent value="prep-times" className="mt-4">
              <PrepTimeEstimator orders={orders} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <QuickOrderDialog
        open={isQuickOrderOpen}
        onOpenChange={setIsQuickOrderOpen}
        onSuccess={() => {
          refetch();
          setIsQuickOrderOpen(false);
        }}
      />

      <CreateOrderDialog
        open={isCreateOrderOpen}
        onOpenChange={setIsCreateOrderOpen}
        onSuccess={() => {
          refetch();
          setIsCreateOrderOpen(false);
        }}
        preselectedOrderType="takeaway"
      />

      {selectedOrder && (
        <OrderDetailsDialog
          order={selectedOrder}
          open={isDetailsOpen}
          onOpenChange={setIsDetailsOpen}
          onUpdate={() => refetch()}
        />
      )}
    </div>
  );
}