import { useState } from 'react';
import { Plus, Filter, Search, Printer, Clock, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { OrderList } from '@/components/orders/OrderList';
import { CreateOrderDialog } from '@/components/orders/CreateOrderDialog';
import { OrderDetailsDialog } from '@/components/orders/OrderDetailsDialog';
import { useOrders } from '@/hooks/useOrders';
import { Order, OrderType, OrderStatus } from '@/types/order.types';
import { toast } from '@/hooks/use-toast';

export default function OrderManagement() {
  const [selectedOrderType, setSelectedOrderType] = useState<OrderType | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateOrderOpen, setIsCreateOrderOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const { data: orders = [], isLoading, refetch } = useOrders({
    orderType: selectedOrderType !== 'all' ? selectedOrderType : undefined,
    status: selectedStatus !== 'all' ? selectedStatus : undefined,
  });

  const filteredOrders = orders.filter(order => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        order.orderNumber.toLowerCase().includes(query) ||
        order.customerName.toLowerCase().includes(query) ||
        (order.tableId && typeof order.tableId === 'object' && 
         order.tableId.tableNumber.toLowerCase().includes(query))
      );
    }
    return true;
  });

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    preparing: orders.filter(o => o.status === 'preparing').length,
    ready: orders.filter(o => o.status === 'ready').length,
    totalRevenue: orders
      .filter(o => o.paymentStatus === 'paid')
      .reduce((sum, o) => sum + o.total, 0),
  };

  const handleOrderClick = (order: Order) => {
    setSelectedOrder(order);
    setIsDetailsOpen(true);
  };

  const handlePrintKitchen = async (orderId: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/print-kitchen`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Kitchen Order:', data.kitchenOrder);
        window.print();
        toast({
          title: 'Success',
          description: 'Kitchen order sent to printer',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to print kitchen order',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-restaurant-dark">Order Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage dine-in, takeaway, and delivery orders
          </p>
        </div>
        <Button 
          onClick={() => setIsCreateOrderOpen(true)}
          className="bg-restaurant-primary hover:bg-restaurant-primary/90"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Order
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Preparing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.preparing}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${stats.totalRevenue.toFixed(2)}
            </div>
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
                  placeholder="Search orders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select
                value={selectedOrderType}
                onValueChange={(value) => setSelectedOrderType(value as OrderType | 'all')}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Order Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="dine-in">Dine In</SelectItem>
                  <SelectItem value="takeaway">Takeaway</SelectItem>
                  <SelectItem value="delivery">Delivery</SelectItem>
                </SelectContent>
              </Select>
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
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="active" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="active">Active Orders</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
            </TabsList>
            <TabsContent value="active" className="mt-4">
              <OrderList
                orders={filteredOrders.filter(o => 
                  !['completed', 'cancelled'].includes(o.status)
                )}
                onOrderClick={handleOrderClick}
                onPrintKitchen={handlePrintKitchen}
                isLoading={isLoading}
              />
            </TabsContent>
            <TabsContent value="completed" className="mt-4">
              <OrderList
                orders={filteredOrders.filter(o => o.status === 'completed')}
                onOrderClick={handleOrderClick}
                onPrintKitchen={handlePrintKitchen}
                isLoading={isLoading}
              />
            </TabsContent>
            <TabsContent value="cancelled" className="mt-4">
              <OrderList
                orders={filteredOrders.filter(o => o.status === 'cancelled')}
                onOrderClick={handleOrderClick}
                onPrintKitchen={handlePrintKitchen}
                isLoading={isLoading}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <CreateOrderDialog
        open={isCreateOrderOpen}
        onOpenChange={setIsCreateOrderOpen}
        onSuccess={() => {
          refetch();
          setIsCreateOrderOpen(false);
        }}
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