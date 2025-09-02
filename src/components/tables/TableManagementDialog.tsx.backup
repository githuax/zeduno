import { useState } from 'react';
import { Users, Clock, DollarSign, Utensils, AlertCircle, CheckCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Table } from '@/types/order.types';
import { useOrder } from '@/hooks/useOrders';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface TableManagementDialogProps {
  table?: Table | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateStatus: (tableId: string, status: string) => void;
  onRefresh: () => void;
}

export function TableManagementDialog({
  table,
  open,
  onOpenChange,
  onUpdateStatus,
  onRefresh,
}: TableManagementDialogProps) {
  const navigate = useNavigate();
  const [isUpdating, setIsUpdating] = useState(false);
  
  const { data: currentOrder } = useOrder(
    table?.currentOrderId || ''
  );

  const handleStatusChange = async (newStatus: string) => {
    if (!table) return;
    setIsUpdating(true);
    try {
      await onUpdateStatus(table._id, newStatus);
      if (newStatus === 'available' && currentOrder) {
        // Also mark the order as completed if clearing the table
        const response = await fetch(`/api/orders/${currentOrder._id}/status`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({ status: 'completed' }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to update order status');
        }
      }
      onRefresh();
      onOpenChange(false);
      toast({
        title: 'Success',
        description: `Table ${table.tableNumber} status updated to ${newStatus}`,
      });
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to update table status';
      const details = error?.response?.data?.details;
      
      toast({
        title: 'Error',
        description: details 
          ? `${errorMessage}\nOrder: ${details.orderNumber} (Customer: ${details.customerName}) is still ${details.status}`
          : errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleViewOrder = () => {
    if (currentOrder) {
      navigate(`/orders?highlight=${currentOrder._id}`);
      onOpenChange(false);
    }
  };

  const handleAddOrder = () => {
    if (!table) return;
    navigate(`/orders?table=${table._id}`);
    onOpenChange(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'occupied':
        return <Utensils className="h-5 w-5 text-orange-600" />;
      case 'reserved':
        return <Clock className="h-5 w-5 text-blue-600" />;
      case 'maintenance':
        return <AlertCircle className="h-5 w-5 text-gray-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'occupied':
        return 'bg-orange-100 text-orange-800';
      case 'reserved':
        return 'bg-blue-100 text-blue-800';
      case 'maintenance':
        return 'bg-gray-100 text-gray-800';
      default:
        return '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Table {table.tableNumber} Management</span>
            <Badge className={getStatusColor(table.status)}>
              <span className="flex items-center gap-1">
                {getStatusIcon(table.status)}
                {table.status}
              </span>
            </Badge>
          </DialogTitle>
          <DialogDescription>
            {table.section} Section • Floor {table.floor} • Capacity: {table.capacity} guests
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Table Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Table Number</p>
                  <p className="font-medium">{table.tableNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Capacity</p>
                  <p className="font-medium">{table.capacity} guests</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Section</p>
                  <p className="font-medium">{table.section}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Floor</p>
                  <p className="font-medium">Floor {table.floor}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {currentOrder && table.status === 'occupied' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Current Order</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Order Number</p>
                    <p className="font-medium">{currentOrder.orderNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Customer</p>
                    <p className="font-medium">{currentOrder.customerName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Items</p>
                    <p className="font-medium">{currentOrder.items.length} items</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="font-medium text-lg">${currentOrder.total.toFixed(2)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={currentOrder.status === 'completed' ? 'default' : 'secondary'}>
                    {currentOrder.status}
                  </Badge>
                  <Badge variant={currentOrder.paymentStatus === 'paid' ? 'default' : 'secondary'}>
                    Payment: {currentOrder.paymentStatus}
                  </Badge>
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleViewOrder}
                >
                  View Order Details
                </Button>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {table.status === 'available' && (
                  <>
                    <Button
                      onClick={() => handleStatusChange('occupied')}
                      disabled={isUpdating}
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Seat Guests
                    </Button>
                    <Button
                      onClick={() => handleStatusChange('reserved')}
                      disabled={isUpdating}
                      variant="outline"
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      Reserve Table
                    </Button>
                    <Button
                      onClick={handleAddOrder}
                      disabled={isUpdating}
                      className="bg-restaurant-primary hover:bg-restaurant-primary/90"
                    >
                      <Utensils className="h-4 w-4 mr-2" />
                      Create Order
                    </Button>
                    <Button
                      onClick={() => handleStatusChange('maintenance')}
                      disabled={isUpdating}
                      variant="outline"
                    >
                      <AlertCircle className="h-4 w-4 mr-2" />
                      Set Maintenance
                    </Button>
                  </>
                )}
                
                {table.status === 'occupied' && (
                  <>
                    <Button
                      onClick={() => handleStatusChange('available')}
                      disabled={isUpdating || (currentOrder && currentOrder.paymentStatus !== 'paid')}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Clear Table
                    </Button>
                    <Button
                      onClick={handleViewOrder}
                      disabled={isUpdating || !currentOrder}
                      variant="outline"
                    >
                      <DollarSign className="h-4 w-4 mr-2" />
                      Process Payment
                    </Button>
                  </>
                )}
                
                {table.status === 'reserved' && (
                  <>
                    <Button
                      onClick={() => handleStatusChange('occupied')}
                      disabled={isUpdating}
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Check In Guests
                    </Button>
                    <Button
                      onClick={() => handleStatusChange('available')}
                      disabled={isUpdating}
                      variant="outline"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Cancel Reservation
                    </Button>
                  </>
                )}
                
                {table.status === 'maintenance' && (
                  <Button
                    onClick={() => handleStatusChange('available')}
                    disabled={isUpdating}
                    className="bg-green-600 hover:bg-green-700 col-span-2"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark as Available
                  </Button>
                )}
              </div>
              
              {table.status === 'occupied' && currentOrder && currentOrder.paymentStatus !== 'paid' && (
                <p className="text-sm text-muted-foreground mt-3">
                  Note: Clear table only after payment is processed
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}