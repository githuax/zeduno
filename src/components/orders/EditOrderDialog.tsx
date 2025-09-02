import { useState, useEffect } from 'react';
import { Plus, Minus, X, Edit2, Trash2, Replace, ChefHat, AlertCircle, Printer } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useMenuItems } from '@/hooks/useMenuItems';
import { useCurrency } from '@/hooks/useCurrency';
import { Order, MenuItem, OrderItemCustomization } from '@/types/order.types';
import { toast } from '@/hooks/use-toast';

interface EditOrderDialogProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface OrderAdjustment {
  type: 'add' | 'remove' | 'replace' | 'modify';
  itemId?: string;
  reason: string;
  timestamp: Date;
  details?: string;
}

interface EditableItem {
  id: string;
  menuItem: MenuItem;
  quantity: number;
  customizations: OrderItemCustomization[];
  specialInstructions: string;
  totalPrice: number;
  status: 'existing' | 'new' | 'modified' | 'removed';
  replacedBy?: string;
  adjustmentReason?: string;
}

const ADJUSTMENT_REASONS = {
  add: [
    'Customer Request',
    'Missing Item',
    'Complementary Addition',
    'Order Correction',
    'Special Offer'
  ],
  remove: [
    'Customer Request',
    'Item Not Available',
    'Allergic Reaction',
    'Wrong Item',
    'Quality Issue',
    'Duplicate Item'
  ],
  replace: [
    'Customer Request',
    'Item Not Available',
    'Wrong Item Ordered',
    'Dietary Restriction',
    'Quality Issue'
  ],
  modify: [
    'Customer Request',
    'Allergy/Dietary Need',
    'Preparation Preference',
    'Size Change'
  ]
};

export function EditOrderDialog({ order, open, onOpenChange, onSuccess }: EditOrderDialogProps) {
  const [editableItems, setEditableItems] = useState<EditableItem[]>([]);
  const [existingAdjustments, setExistingAdjustments] = useState<OrderAdjustment[]>([]);
  const [sessionAdjustments, setSessionAdjustments] = useState<OrderAdjustment[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('current');
  const [selectedItemForAction, setSelectedItemForAction] = useState<string | null>(null);
  const [itemToReplace, setItemToReplace] = useState<string | null>(null); // Track the item being replaced
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [adjustmentNotes, setAdjustmentNotes] = useState('');
  const [showReasonDialog, setShowReasonDialog] = useState(false);
  const [currentAction, setCurrentAction] = useState<'add' | 'remove' | 'replace' | 'modify' | null>(null);

  const { data: menuItems = [] } = useMenuItems();
  const { format: formatPrice } = useCurrency();

  // Combine existing and session adjustments for display
  const allAdjustments = [...existingAdjustments, ...sessionAdjustments];

  // Initialize editable items from order
  useEffect(() => {
    if (order && open) {
      const items: EditableItem[] = order.items.map(item => ({
        id: item._id || Math.random().toString(),
        menuItem: item.menuItem as MenuItem,
        quantity: item.quantity,
        customizations: item.customizations || [],
        specialInstructions: item.specialInstructions || '',
        totalPrice: item.price * item.quantity,
        status: 'existing'
      }));
      setEditableItems(items);
      
      // Initialize adjustments from order data
      const loadedAdjustments: OrderAdjustment[] = order.adjustments ? 
        order.adjustments.map(adj => ({
          type: adj.type,
          itemId: adj.itemId,
          reason: adj.reason,
          timestamp: new Date(adj.timestamp),
          details: adj.details
        })) : [];
      
      setExistingAdjustments(loadedAdjustments);
      setSessionAdjustments([]); // Clear any session adjustments when reopening
      
      // Set adjustment notes if they exist
      if (order.adjustmentNotes) {
        setAdjustmentNotes(order.adjustmentNotes);
      }
      
      setActiveTab('current');
    }
  }, [order, open]);

  const categories = ['all', ...new Set(menuItems.map(item => 
    typeof item.category === 'string' ? item.category : item.category?.name || 'Unknown'
  ))];

  const filteredMenuItems = selectedCategory === 'all' 
    ? menuItems 
    : menuItems.filter(item => {
        const itemCategory = typeof item.category === 'string' ? item.category : item.category?.name || 'Unknown';
        return itemCategory === selectedCategory;
      });

  // Add item to order
  const handleAddItem = (menuItem: MenuItem, reason: string, notes?: string) => {
    const newItem: EditableItem = {
      id: `new-${Date.now()}`,
      menuItem,
      quantity: 1,
      customizations: [],
      specialInstructions: '',
      totalPrice: menuItem.price,
      status: 'new',
      adjustmentReason: reason
    };

    setEditableItems([...editableItems, newItem]);
    
    const adjustment: OrderAdjustment = {
      type: 'add',
      reason,
      timestamp: new Date(),
      details: notes
    };
    setSessionAdjustments([...sessionAdjustments, adjustment]);

    toast({
      title: 'Item Added',
      description: `${menuItem.name} has been added to the order`,
    });
  };

  // Remove item from order
  const handleRemoveItem = (itemId: string, reason: string, notes?: string) => {
    setEditableItems(items => 
      items.map(item => 
        item.id === itemId 
          ? { ...item, status: 'removed' as const, adjustmentReason: reason }
          : item
      )
    );

    const adjustment: OrderAdjustment = {
      type: 'remove',
      itemId,
      reason,
      timestamp: new Date(),
      details: notes
    };
    setSessionAdjustments([...sessionAdjustments, adjustment]);

    const item = editableItems.find(i => i.id === itemId);
    toast({
      title: 'Item Removed',
      description: `${item?.menuItem.name} has been removed from the order`,
    });
  };

  // Replace item in order
  const handleReplaceItem = (oldItemId: string, newMenuItem: MenuItem, reason: string, notes?: string) => {
    const oldItem = editableItems.find(i => i.id === oldItemId);
    if (!oldItem) return;

    const newItem: EditableItem = {
      id: `new-${Date.now()}`,
      menuItem: newMenuItem,
      quantity: oldItem.quantity,
      customizations: [],
      specialInstructions: oldItem.specialInstructions,
      totalPrice: newMenuItem.price * oldItem.quantity,
      status: 'new',
      adjustmentReason: reason
    };

    setEditableItems(items => [
      ...items.map(item => 
        item.id === oldItemId 
          ? { ...item, status: 'removed' as const, replacedBy: newItem.id, adjustmentReason: reason }
          : item
      ),
      newItem
    ]);

    const adjustment: OrderAdjustment = {
      type: 'replace',
      itemId: oldItemId,
      reason,
      timestamp: new Date(),
      details: `Replaced with ${newMenuItem.name}. ${notes || ''}`
    };
    setSessionAdjustments([...sessionAdjustments, adjustment]);

    toast({
      title: 'Item Replaced',
      description: `${oldItem.menuItem.name} has been replaced with ${newMenuItem.name}`,
    });
  };

  // Modify item quantity
  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) return;

    const item = editableItems.find(i => i.id === itemId);
    if (!item) return;

    // Only create adjustment if this is an existing item and quantity actually changed
    if (item.status === 'existing' && item.quantity !== newQuantity) {
      const adjustment: OrderAdjustment = {
        type: 'modify',
        itemId,
        reason: 'Quantity Changed',
        timestamp: new Date(),
        details: `Changed quantity from ${item.quantity} to ${newQuantity}`
      };
      setSessionAdjustments(prev => [...prev, adjustment]);
    }

    setEditableItems(items =>
      items.map(item => {
        if (item.id === itemId) {
          const customizationPrice = item.customizations.reduce((sum, c) => sum + c.price, 0);
          return {
            ...item,
            quantity: newQuantity,
            totalPrice: (item.menuItem.price + customizationPrice) * newQuantity,
            status: item.status === 'existing' ? 'modified' as const : item.status
          };
        }
        return item;
      })
    );
  };

  // Update customizations
  const handleCustomizationChange = (itemId: string, customizations: OrderItemCustomization[]) => {
    setEditableItems(items =>
      items.map(item => {
        if (item.id === itemId) {
          const customizationPrice = customizations.reduce((sum, c) => sum + c.price, 0);
          return {
            ...item,
            customizations,
            totalPrice: (item.menuItem.price + customizationPrice) * item.quantity,
            status: item.status === 'existing' ? 'modified' as const : item.status
          };
        }
        return item;
      })
    );
  };

  // Update special instructions
  const handleInstructionsChange = (itemId: string, instructions: string) => {
    const item = editableItems.find(i => i.id === itemId);
    if (!item) return;

    // Only create adjustment if this is an existing item and instructions actually changed
    if (item.status === 'existing' && item.specialInstructions !== instructions) {
      const adjustment: OrderAdjustment = {
        type: 'modify',
        itemId,
        reason: 'Special Instructions Updated',
        timestamp: new Date(),
        details: `Updated instructions: "${instructions}"`
      };
      setSessionAdjustments(prev => [...prev, adjustment]);
    }

    setEditableItems(items =>
      items.map(item => 
        item.id === itemId 
          ? { 
              ...item, 
              specialInstructions: instructions,
              status: item.status === 'existing' ? 'modified' as const : item.status
            }
          : item
      )
    );
  };

  // Calculate totals
  const calculateTotals = () => {
    const activeItems = editableItems.filter(item => item.status !== 'removed');
    const subtotal = activeItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const tax = subtotal * 0.18;
    const serviceCharge = order?.orderType === 'dine-in' ? subtotal * 0.1 : 0;
    const total = subtotal + tax + serviceCharge;

    return { subtotal, tax, serviceCharge, total };
  };

  // Submit order updates
  const handleSubmit = async () => {
    if (sessionAdjustments.length === 0) {
      toast({
        title: 'No Changes',
        description: 'No adjustments have been made to the order',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    const updatedItems = editableItems
      .filter(item => item.status !== 'removed')
      .map(item => ({
        menuItem: item.menuItem._id,
        quantity: item.quantity,
        customizations: item.customizations,
        specialInstructions: item.specialInstructions,
        price: item.menuItem.price
      }));

    const updateData = {
      items: updatedItems,
      adjustments: allAdjustments.map(adj => ({
        ...adj,
        timestamp: adj.timestamp.toISOString()
      })),
      adjustmentNotes,
      ...calculateTotals()
    };

    try {
      const response = await fetch(`/api/orders/${order?._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Order has been updated successfully',
        });
        onSuccess();
        onOpenChange(false);
      } else {
        throw new Error('Failed to update order');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update order',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const totals = calculateTotals();
  const hasChanges = sessionAdjustments.length > 0 || 
    editableItems.some(item => ['new', 'modified', 'removed'].includes(item.status));

  // Print function
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const currentItems = editableItems.filter(item => item.status !== 'removed');
    const printContent = generatePrintContent(order, currentItems, totals);
    
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
    printWindow.close();
  };

  const generatePrintContent = (order: any, items: EditableItem[], totals: any) => {
    const now = new Date().toLocaleString();
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Order Receipt - ${order?.orderNumber}</title>
        <style>
          @page { margin: 0.5in; size: A4; }
          body { 
            font-family: 'Courier New', monospace; 
            font-size: 12px; 
            line-height: 1.4;
            margin: 0;
            padding: 20px;
          }
          .header { 
            text-align: center; 
            border-bottom: 2px solid #000; 
            padding-bottom: 10px; 
            margin-bottom: 15px; 
          }
          .restaurant-name { 
            font-size: 18px; 
            font-weight: bold; 
            margin-bottom: 5px; 
          }
          .order-info { 
            margin-bottom: 15px; 
            border-bottom: 1px dashed #000; 
            padding-bottom: 10px; 
          }
          .order-info div { 
            display: flex; 
            justify-content: space-between; 
            margin: 2px 0; 
          }
          .items { 
            margin-bottom: 15px; 
          }
          .item { 
            display: flex; 
            justify-content: space-between; 
            margin: 3px 0; 
            padding: 2px 0;
          }
          .item-details { 
            flex: 1; 
          }
          .item-price { 
            text-align: right; 
            min-width: 80px; 
          }
          .customizations { 
            font-size: 10px; 
            color: #666; 
            margin-left: 10px; 
          }
          .instructions { 
            font-size: 10px; 
            font-style: italic; 
            color: #666; 
            margin-left: 10px; 
          }
          .totals { 
            border-top: 1px dashed #000; 
            padding-top: 10px; 
            margin-top: 15px; 
          }
          .total-line { 
            display: flex; 
            justify-content: space-between; 
            margin: 2px 0; 
          }
          .total-final { 
            font-weight: bold; 
            font-size: 14px; 
            border-top: 1px solid #000; 
            padding-top: 5px; 
            margin-top: 5px; 
          }
          .footer { 
            text-align: center; 
            margin-top: 20px; 
            font-size: 10px; 
            color: #666; 
          }
          @media print {
            body { margin: 0; padding: 10px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="restaurant-name">Restaurant Receipt</div>
          <div>Order #${order?.orderNumber || ''}</div>
          <div>${now}</div>
        </div>

        <div class="order-info">
          <div><span>Order Type:</span> <span>${order?.orderType?.toUpperCase() || ''}</span></div>
          <div><span>Customer:</span> <span>${order?.customerName || ''}</span></div>
          ${order?.customerPhone ? `<div><span>Phone:</span> <span>${order?.customerPhone}</span></div>` : ''}
          ${order?.orderType === 'dine-in' && order?.tableId ? 
            `<div><span>Table:</span> <span>${typeof order.tableId === 'object' ? order.tableId.tableNumber : order.tableId}</span></div>` : ''}
          <div><span>Status:</span> <span>${order?.status?.toUpperCase() || ''}</span></div>
        </div>

        <div class="items">
          <div style="font-weight: bold; border-bottom: 1px solid #000; padding-bottom: 5px; margin-bottom: 10px;">
            ORDER ITEMS
          </div>
          ${items.map(item => `
            <div class="item">
              <div class="item-details">
                <div>${item.quantity}x ${item.menuItem.name}</div>
                ${item.customizations.length > 0 ? 
                  `<div class="customizations">+ ${item.customizations.filter(c => c && c.option).map(c => c.option).join(', ')}</div>` : ''}
                ${item.specialInstructions ? 
                  `<div class="instructions">Note: ${item.specialInstructions}</div>` : ''}
              </div>
              <div class="item-price">KES ${item.totalPrice.toFixed(2)}</div>
            </div>
          `).join('')}
        </div>

        <div class="totals">
          <div class="total-line">
            <span>Subtotal:</span>
            <span>KES ${totals.subtotal.toFixed(2)}</span>
          </div>
          <div class="total-line">
            <span>Tax (18%):</span>
            <span>KES ${totals.tax.toFixed(2)}</span>
          </div>
          ${totals.serviceCharge > 0 ? `
          <div class="total-line">
            <span>Service Charge (10%):</span>
            <span>KES ${totals.serviceCharge.toFixed(2)}</span>
          </div>` : ''}
          <div class="total-line total-final">
            <span>TOTAL:</span>
            <span>KES ${totals.total.toFixed(2)}</span>
          </div>
        </div>

        ${order?.notes ? `
        <div style="margin-top: 15px; padding-top: 10px; border-top: 1px dashed #000;">
          <div style="font-weight: bold;">Order Notes:</div>
          <div style="margin-top: 5px;">${order.notes}</div>
        </div>` : ''}

        <div class="footer">
          <div>Thank you for your order!</div>
          <div>Printed: ${now}</div>
        </div>
      </body>
      </html>
    `;
  };

  // Don't allow editing of confirmed orders
  if (order && order.status !== 'pending') {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Order Cannot Be Edited</DialogTitle>
            <DialogDescription>
              This order has been {order.status} and cannot be modified.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center space-y-4 py-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Only pending orders can be edited. This order is currently {order.status}.
              </AlertDescription>
            </Alert>
            <Button onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Edit Order #{order?.orderNumber}</DialogTitle>
          <DialogDescription>
            Add, remove, or modify items in this order. All changes will be tracked.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(value) => {
          setActiveTab(value);
          // Clear replacement state when switching tabs
          if (value !== 'add') {
            setCurrentAction(null);
            setItemToReplace(null);
            setSelectedItemForAction(null);
          }
        }} className="flex-1">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="current">
              Current Order
              {editableItems.filter(i => i.status !== 'removed').length > 0 && (
                <Badge className="ml-2" variant="secondary">
                  {editableItems.filter(i => i.status !== 'removed').length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="add">Add Items</TabsTrigger>
            <TabsTrigger value="adjustments">
              Adjustments
              {sessionAdjustments.length > 0 && (
                <Badge className="ml-2" variant="default">
                  {sessionAdjustments.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="current" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Order Items</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-4">
                    {editableItems.map((item) => (
                      <div
                        key={item.id}
                        className={`p-4 border rounded-lg ${
                          item.status === 'removed' ? 'opacity-50 bg-red-50' :
                          item.status === 'new' ? 'bg-green-50' :
                          item.status === 'modified' ? 'bg-yellow-50' :
                          itemToReplace === item.id ? 'border-orange-500 bg-orange-50' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className={`font-semibold ${item.status === 'removed' ? 'line-through' : ''}`}>
                                {item.menuItem.name}
                              </h4>
                              {item.status === 'new' && (
                                <Badge variant="default" className="bg-green-600">New</Badge>
                              )}
                              {item.status === 'modified' && (
                                <Badge variant="default" className="bg-yellow-600">Modified</Badge>
                              )}
                              {item.status === 'removed' && (
                                <Badge variant="destructive">Removed</Badge>
                              )}
                              {itemToReplace === item.id && (
                                <Badge variant="secondary" className="bg-orange-500 text-white">Being Replaced</Badge>
                              )}
                            </div>
                            
                            {item.customizations.length > 0 && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {item.customizations.filter(c => c && c.option).map(c => c.option).join(', ')}
                              </p>
                            )}
                            
                            {item.specialInstructions && (
                              <p className="text-sm text-muted-foreground italic mt-1">
                                Note: {item.specialInstructions}
                              </p>
                            )}

                            {item.adjustmentReason && (
                              <p className="text-sm text-blue-600 mt-1">
                                Reason: {item.adjustmentReason}
                              </p>
                            )}

                            {item.status !== 'removed' && (
                              <div className="flex items-center gap-2 mt-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                                  disabled={item.quantity <= 1}
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <span className="font-medium w-8 text-center">{item.quantity}</span>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                                
                                <Input
                                  className="ml-4 text-sm"
                                  placeholder="Special instructions..."
                                  value={item.specialInstructions}
                                  onChange={(e) => handleInstructionsChange(item.id, e.target.value)}
                                />
                              </div>
                            )}
                          </div>

                          <div className="text-right ml-4">
                            <p className="font-semibold">{formatPrice(item.totalPrice)}</p>
                            {item.status !== 'removed' && (
                              <div className="flex gap-1 mt-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setItemToReplace(item.id); // Store the item to be replaced
                                    setSelectedItemForAction(null); // Clear the selected item
                                    setCurrentAction('replace');
                                    setActiveTab('add');
                                  }}
                                  title="Replace item"
                                >
                                  <Replace className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setSelectedItemForAction(item.id);
                                    setCurrentAction('remove');
                                    setShowReasonDialog(true);
                                  }}
                                  title="Remove item"
                                >
                                  <Trash2 className="h-4 w-4 text-red-600" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                <Separator className="my-4" />

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatPrice(totals.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax (18%):</span>
                    <span>{formatPrice(totals.tax)}</span>
                  </div>
                  {totals.serviceCharge > 0 && (
                    <div className="flex justify-between">
                      <span>Service Charge (10%):</span>
                      <span>{formatPrice(totals.serviceCharge)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total:</span>
                    <span>{formatPrice(totals.total)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="add" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>
                  {currentAction === 'replace' && selectedItemForAction
                    ? `Replace Item: ${editableItems.find(i => i.id === selectedItemForAction)?.menuItem.name}`
                    : 'Add New Items'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
                    <TabsList className="w-full flex-wrap h-auto">
                      {categories.map(cat => (
                        <TabsTrigger key={cat} value={cat} className="capitalize">
                          {cat}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </Tabs>
                </div>

                <ScrollArea className="h-[400px] pr-4">
                  <div className="grid grid-cols-1 gap-3">
                    {filteredMenuItems.map((item) => (
                      <Card key={item._id} className="cursor-pointer hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h4 className="font-semibold">{item.name}</h4>
                              <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                              <p className="font-semibold text-lg mt-2">{formatPrice(item.price)}</p>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => {
                                setCurrentAction(currentAction || 'add');
                                setShowReasonDialog(true);
                                setSelectedItemForAction(item._id);
                              }}
                              disabled={!item.isAvailable}
                            >
                              {currentAction === 'replace' && itemToReplace ? (
                                <>
                                  <Replace className="h-4 w-4 mr-1" />
                                  Select Replacement
                                </>
                              ) : (
                                <>
                                  <Plus className="h-4 w-4 mr-1" />
                                  Add
                                </>
                              )}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="adjustments" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Order Adjustments</CardTitle>
              </CardHeader>
              <CardContent>
                {allAdjustments.length === 0 ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      No adjustments have been made to this order yet.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-3">
                      {allAdjustments.map((adj, index) => {
                        const isNewAdjustment = index >= existingAdjustments.length;
                        return (
                          <div key={index} className={`p-3 border rounded-lg ${isNewAdjustment ? 'bg-blue-50 border-blue-200' : ''}`}>
                            <div className="flex items-center justify-between">
                              <div>
                                <Badge variant={
                                  adj.type === 'add' ? 'default' :
                                  adj.type === 'remove' ? 'destructive' :
                                  adj.type === 'replace' ? 'secondary' : 'outline'
                                }>
                                  {adj.type.toUpperCase()}
                                </Badge>
                                {isNewAdjustment && (
                                  <Badge variant="outline" className="ml-1 bg-blue-100 text-blue-800 border-blue-300">
                                    NEW
                                  </Badge>
                                )}
                                <span className="ml-2 font-medium">{adj.reason}</span>
                              </div>
                              <span className="text-sm text-muted-foreground">
                                {adj.timestamp.toLocaleTimeString()}
                              </span>
                            </div>
                            {adj.details && (
                              <p className="text-sm text-muted-foreground mt-1">{adj.details}</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                )}

                <div className="mt-4">
                  <Label htmlFor="adjustmentNotes">Additional Notes (Optional)</Label>
                  <Textarea
                    id="adjustmentNotes"
                    value={adjustmentNotes}
                    onChange={(e) => setAdjustmentNotes(e.target.value)}
                    placeholder="Add any additional notes about these adjustments..."
                    className="mt-2"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between items-center mt-4">
          <div>
            {hasChanges && (
              <Alert className="w-auto">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  You have {sessionAdjustments.length} unsaved {sessionAdjustments.length === 1 ? 'adjustment' : 'adjustments'}
                </AlertDescription>
              </Alert>
            )}
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handlePrint}
              disabled={isSubmitting}
              title="Print order receipt"
            >
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !hasChanges}
            >
              {isSubmitting ? 'Updating...' : 'Update Order'}
            </Button>
          </div>
        </div>
      </DialogContent>

      {/* Reason Dialog */}
      <Dialog open={showReasonDialog} onOpenChange={setShowReasonDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {currentAction === 'add' && 'Reason for Adding Item'}
              {currentAction === 'remove' && 'Reason for Removing Item'}
              {currentAction === 'replace' && 'Reason for Replacing Item'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Select Reason</Label>
              <Select value={adjustmentReason} onValueChange={setAdjustmentReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a reason" />
                </SelectTrigger>
                <SelectContent>
                  {currentAction && ADJUSTMENT_REASONS[currentAction].map(reason => (
                    <SelectItem key={reason} value={reason}>
                      {reason}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Additional Notes (Optional)</Label>
              <Textarea
                value={adjustmentNotes}
                onChange={(e) => setAdjustmentNotes(e.target.value)}
                placeholder="Add any additional details..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowReasonDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (!adjustmentReason) {
                    toast({
                      title: 'Error',
                      description: 'Please select a reason',
                      variant: 'destructive',
                    });
                    return;
                  }

                  if (currentAction === 'add') {
                    const menuItem = menuItems.find(m => m._id === selectedItemForAction);
                    if (menuItem) {
                      handleAddItem(menuItem, adjustmentReason, adjustmentNotes);
                    }
                  } else if (currentAction === 'remove' && selectedItemForAction) {
                    handleRemoveItem(selectedItemForAction, adjustmentReason, adjustmentNotes);
                  } else if (currentAction === 'replace' && selectedItemForAction && itemToReplace) {
                    const newMenuItem = menuItems.find(m => m._id === selectedItemForAction);
                    if (newMenuItem) {
                      handleReplaceItem(itemToReplace, newMenuItem, adjustmentReason, adjustmentNotes);
                    }
                  }

                  setShowReasonDialog(false);
                  setAdjustmentReason('');
                  setAdjustmentNotes('');
                  setSelectedItemForAction(null);
                  setItemToReplace(null);
                  setCurrentAction(null);
                }}
                disabled={!adjustmentReason}
              >
                Confirm
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}