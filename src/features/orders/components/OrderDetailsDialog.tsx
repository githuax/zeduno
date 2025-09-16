import { Printer, Split, Merge, Clock, DollarSign, User, Phone, MapPin, ChefHat, CreditCard } from 'lucide-react';
import { useState } from 'react';

import { PaymentDialog } from '@/components/payment/PaymentDialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { useCurrency } from '@/hooks/useCurrency';
import { cn } from '@/lib/utils';
import { Order, OrderStatus, PaymentStatus, PaymentMethod, OrderItem } from '@/types/order.types';

interface OrderDetailsDialogProps {
  order: Order;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

const statusColors: Record<OrderStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  preparing: 'bg-orange-100 text-orange-800',
  ready: 'bg-green-100 text-green-800',
  completed: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800',
};

export function OrderDetailsDialog({ order, open, onOpenChange, onUpdate }: OrderDetailsDialogProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [showSplitBill, setShowSplitBill] = useState(false);
  const [selectedItemsForSplit, setSelectedItemsForSplit] = useState<string[]>([]);
  const [splitGroups, setSplitGroups] = useState<string[][]>([]);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const { format: formatPrice } = useCurrency();

  const handleStatusUpdate = async (newStatus: OrderStatus) => {
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/orders/${order._id}/status`, {
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
        onUpdate();
      } else {
        throw new Error('Failed to update status');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update order status',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePaymentUpdate = async (paymentStatus: PaymentStatus, paymentMethod?: PaymentMethod) => {
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/orders/${order._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ paymentStatus, paymentMethod }),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Payment status updated',
        });
        onUpdate();
      } else {
        throw new Error('Failed to update payment');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update payment status',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePrintKitchen = async () => {
    try {
      const response = await fetch(`/api/orders/${order._id}/print-kitchen`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Create print content
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(`
            <html>
              <head>
                <title>Kitchen Order - ${order.orderNumber}</title>
                <style>
                  body { font-family: monospace; padding: 20px; }
                  h1 { text-align: center; border-bottom: 2px solid black; }
                  .header { margin-bottom: 20px; }
                  .item { margin: 10px 0; padding: 10px; border: 1px solid #ccc; }
                  .item-name { font-weight: bold; font-size: 18px; }
                  .customization { margin-left: 20px; font-style: italic; }
                  .instructions { margin-left: 20px; color: red; }
                  .footer { margin-top: 30px; text-align: center; }
                </style>
              </head>
              <body>
                <h1>KITCHEN ORDER</h1>
                <div class="header">
                  <p><strong>Order #:</strong> ${data.kitchenOrder.orderNumber}</p>
                  <p><strong>Type:</strong> ${data.kitchenOrder.orderType.toUpperCase()}</p>
                  ${data.kitchenOrder.table ? `<p><strong>Table:</strong> ${data.kitchenOrder.table}</p>` : ''}
                  <p><strong>Time:</strong> ${data.kitchenOrder.timestamp}</p>
                  <p><strong>Priority:</strong> ${data.kitchenOrder.priority}</p>
                </div>
                <hr>
                <h2>ITEMS:</h2>
                ${data.kitchenOrder.items.map((item: any) => `
                  <div class="item">
                    <div class="item-name">${item.quantity}x ${item.name}</div>
                    ${item.customizations?.map((c: any) => 
                      `<div class="customization">+ ${c.option}</div>`
                    ).join('') || ''}
                    ${item.specialInstructions ? 
                      `<div class="instructions">Note: ${item.specialInstructions}</div>` : ''}
                  </div>
                `).join('')}
                ${data.kitchenOrder.notes ? 
                  `<div class="footer"><p><strong>Order Notes:</strong> ${data.kitchenOrder.notes}</p></div>` : ''}
                <div class="footer">
                  <p>--- END OF ORDER ---</p>
                </div>
              </body>
            </html>
          `);
          printWindow.document.close();
          printWindow.print();
        }
        
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

  const handleSplitBill = async () => {
    if (splitGroups.length < 2) {
      toast({
        title: 'Error',
        description: 'Please create at least 2 split groups',
        variant: 'destructive',
      });
      return;
    }

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/orders/${order._id}/split`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          splits: splitGroups.map(group => ({ items: group }))
        }),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Bill split successfully',
        });
        setShowSplitBill(false);
        setSplitGroups([]);
        setSelectedItemsForSplit([]);
        onUpdate();
      } else {
        throw new Error('Failed to split bill');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to split bill',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const addToSplitGroup = () => {
    if (selectedItemsForSplit.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select items for this split',
        variant: 'destructive',
      });
      return;
    }
    setSplitGroups([...splitGroups, selectedItemsForSplit]);
    setSelectedItemsForSplit([]);
  };

  const toggleItemForSplit = (itemId: string) => {
    if (selectedItemsForSplit.includes(itemId)) {
      setSelectedItemsForSplit(selectedItemsForSplit.filter(id => id !== itemId));
    } else {
      setSelectedItemsForSplit([...selectedItemsForSplit, itemId]);
    }
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

  const nextStatus = getNextStatus(order.status);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Order Details - {order.orderNumber}</span>
            <Badge className={cn('ml-2', statusColors[order.status])}>
              {order.status}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Created at {new Date(order.createdAt).toLocaleString()}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Customer Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{order.customerName}</span>
                </div>
                {order.customerPhone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{order.customerPhone}</span>
                  </div>
                )}
                {order.orderType === 'dine-in' && order.tableId && typeof order.tableId === 'object' && (
                  <div className="flex items-center gap-2">
                    <ChefHat className="h-4 w-4 text-muted-foreground" />
                    <span>Table {order.tableId.tableNumber}</span>
                  </div>
                )}
                {order.orderType === 'delivery' && order.deliveryAddress && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p>{order.deliveryAddress.street}</p>
                      <p>{order.deliveryAddress.city}, {order.deliveryAddress.zipCode}</p>
                      {order.deliveryAddress.instructions && (
                        <p className="text-sm text-muted-foreground">{order.deliveryAddress.instructions}</p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Order Items</CardTitle>
              </CardHeader>
              <CardContent>
                {showSplitBill ? (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Select items for each split group:
                    </p>
                    {order.items.map((item) => {
                      const isInGroup = splitGroups.some(group => 
                        group.includes(item._id || '')
                      );
                      return (
                        <div key={item._id} className="flex items-start gap-3 p-3 border rounded">
                          <Checkbox
                            checked={selectedItemsForSplit.includes(item._id || '')}
                            onCheckedChange={() => toggleItemForSplit(item._id || '')}
                            disabled={isInGroup}
                          />
                          <div className="flex-1">
                            <p className="font-medium">
                              {item.menuItem && typeof item.menuItem === 'object' ? item.menuItem.name : 'Item'} x{item.quantity}
                            </p>
                            {item.customizations && item.customizations.length > 0 && (
                              <p className="text-sm text-muted-foreground">
                                {item.customizations.filter(c => c && c.option).map(c => c.option).join(', ')}
                              </p>
                            )}
                            {isInGroup && (
                              <Badge variant="secondary" className="mt-1">
                                Group {splitGroups.findIndex(g => g.includes(item._id || '')) + 1}
                              </Badge>
                            )}
                          </div>
                          <span className="font-medium">{formatPrice((item.price * item.quantity))}</span>
                        </div>
                      );
                    })}
                    
                    <div className="flex gap-2">
                      <Button
                        onClick={addToSplitGroup}
                        disabled={selectedItemsForSplit.length === 0}
                      >
                        Create Group {splitGroups.length + 1}
                      </Button>
                      {splitGroups.length >= 2 && (
                        <Button
                          onClick={handleSplitBill}
                          disabled={isUpdating}
                        >
                          Confirm Split
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowSplitBill(false);
                          setSplitGroups([]);
                          setSelectedItemsForSplit([]);
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex justify-between items-start pb-3 border-b last:border-0">
                        <div className="flex-1">
                          <p className="font-medium">
                            {item.menuItem && typeof item.menuItem === 'object' ? item.menuItem.name : 'Item'} x{item.quantity}
                          </p>
                          {item.customizations && item.customizations.length > 0 && (
                            <p className="text-sm text-muted-foreground">
                              {item.customizations.filter(c => c && c.option && c.price !== undefined).map(c => `${c.option} (+${formatPrice(c.price)})`).join(', ')}
                            </p>
                          )}
                          {item.specialInstructions && (
                            <p className="text-sm text-muted-foreground italic">
                              Note: {item.specialInstructions}
                            </p>
                          )}
                          <Badge variant="outline" className="mt-1">
                            {item.status}
                          </Badge>
                        </div>
                        <span className="font-medium">{formatPrice((item.price * item.quantity))}</span>
                      </div>
                    ))}
                  </div>
                )}

                {!showSplitBill && order.splitBills && order.splitBills.length > 0 && (
                  <div className="mt-4 p-3 bg-muted rounded">
                    <p className="font-medium mb-2">Split Bills:</p>
                    {order.splitBills.map((split, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span>Bill {split.billNumber}</span>
                        <span className="font-medium">{formatPrice(split.total)}</span>
                        <Badge variant={split.paymentStatus === 'paid' ? 'default' : 'secondary'}>
                          {split.paymentStatus}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}

                <Separator className="my-4" />
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatPrice(order.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax:</span>
                    <span>{formatPrice(order.tax)}</span>
                  </div>
                  {order.serviceCharge && order.serviceCharge > 0 && (
                    <div className="flex justify-between">
                      <span>Service Charge:</span>
                      <span>{formatPrice(order.serviceCharge)}</span>
                    </div>
                  )}
                  {order.discount && order.discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount:</span>
                      <span>-{formatPrice(order.discount)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total:</span>
                    <span>{formatPrice(order.total)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Payment Status:</span>
                  <Badge variant={order.paymentStatus === 'paid' ? 'default' : 'secondary'}>
                    {order.paymentStatus}
                  </Badge>
                </div>
                {order.paymentMethod && (
                  <div className="flex items-center justify-between">
                    <span>Payment Method:</span>
                    <span className="capitalize">{order.paymentMethod}</span>
                  </div>
                )}
                {order.paymentStatus !== 'paid' && (
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setShowPaymentDialog(true)}
                      className="flex items-center gap-2"
                    >
                      <CreditCard className="h-4 w-4" />
                      Process Payment
                    </Button>
                    <Select
                      onValueChange={(value) => handlePaymentUpdate('paid', value as PaymentMethod)}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Quick Mark Paid" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="card">Card</SelectItem>
                        <SelectItem value="upi">UPI</SelectItem>
                        <SelectItem value="wallet">Wallet</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </CardContent>
            </Card>

            {order.notes && (
              <Card>
                <CardHeader>
                  <CardTitle>Order Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{order.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>

        <div className="flex gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={handlePrintKitchen}
            disabled={isUpdating}
          >
            <Printer className="h-4 w-4 mr-2" />
            Print Kitchen
          </Button>
          
          {order.orderType === 'dine-in' && !order.splitBills && (
            <Button
              variant="outline"
              onClick={() => setShowSplitBill(true)}
              disabled={isUpdating || showSplitBill}
            >
              <Split className="h-4 w-4 mr-2" />
              Split Bill
            </Button>
          )}

          {nextStatus && (
            <Button
              className="ml-auto"
              onClick={() => handleStatusUpdate(nextStatus)}
              disabled={isUpdating}
            >
              Mark as {nextStatus}
            </Button>
          )}
          
          {order.status !== 'completed' && order.status !== 'cancelled' && (
            <Button
              variant="destructive"
              onClick={() => handleStatusUpdate('cancelled')}
              disabled={isUpdating}
            >
              Cancel Order
            </Button>
          )}
        </div>
      </DialogContent>
      
      <PaymentDialog
        open={showPaymentDialog}
        onOpenChange={setShowPaymentDialog}
        orderData={{
          id: order.orderNumber,
          amount: order.total,
          customerName: order.customerName,
          items: order.items.map(item => ({
            name: item.menuItem && typeof item.menuItem === 'object' ? item.menuItem.name : 'Item',
            quantity: item.quantity,
            price: item.price,
            alcoholic: (item.menuItem && typeof item.menuItem === 'object' && typeof item.menuItem.category === 'string')
              ? item.menuItem.category.toLowerCase() === 'alcohol'
              : false,
          }))
        }}
        onPaymentSuccess={(transactionId) => {
          handlePaymentUpdate('paid', 'card');
          toast({
            title: 'Payment Successful',
            description: `Transaction ${transactionId} completed successfully.`
          });
        }}
        onPaymentError={(error) => {
          toast({
            title: 'Payment Failed',
            description: error,
            variant: 'destructive'
          });
        }}
      />
    </Dialog>
  );
}
