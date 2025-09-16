import React, { memo, useMemo, useCallback, useRef, useEffect } from 'react';
import { Grid } from 'react-window';
import { Clock, DollarSign, MapPin, Printer, Users, ChefHat, Edit2 } from 'lucide-react';

import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';
import { useVirtualizationAccessibility } from '@/hooks/useVirtualizationAccessibility';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrency } from '@/hooks/useCurrency';
import { cn } from '@/lib/utils';
import { Order, OrderStatus, OrderType } from '@/types/order.types';

interface VirtualizedOrderListProps {
  orders: Order[];
  onOrderClick: (order: Order) => void;
  onPrintKitchen: (orderId: string) => void;
  onPrintReceipt?: (order: Order) => void;
  onEditOrder?: (order: Order) => void;
  isLoading?: boolean;
  containerHeight?: number;
  containerWidth?: number;
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

interface OrderCardProps {
  columnIndex: number;
  rowIndex: number;
  style: React.CSSProperties;
  data: {
    orders: Order[];
    onOrderClick: (order: Order) => void;
    onPrintKitchen: (orderId: string) => void;
    onPrintReceipt?: (order: Order) => void;
    onEditOrder?: (order: Order) => void;
    formatPrice: (amount: number) => string;
    columnsPerRow: number;
  };
}

const OrderCard = memo(({ columnIndex, rowIndex, style, data }: OrderCardProps) => {
  const { 
    orders, 
    onOrderClick, 
    onPrintKitchen, 
    onPrintReceipt, 
    onEditOrder, 
    formatPrice,
    columnsPerRow
  } = data;

  const orderIndex = rowIndex * columnsPerRow + columnIndex;
  const order = orders[orderIndex];

  if (!order) {
    return <div style={style} />;
  }

  return (
    <div style={style} className="p-2">
      <Card
        className="cursor-pointer hover:shadow-lg transition-shadow h-full"
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
              <span className="font-semibold text-lg">{formatPrice(order.total)}</span>
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

            <div className="flex gap-1 pt-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
              <Button
                size="sm"
                variant="outline"
                onClick={() => order.status === 'pending' ? onEditOrder?.(order) : null}
                title={order.status === 'pending' ? "Edit Order" : `Cannot edit ${order.status} order`}
                disabled={order.status !== 'pending' || !onEditOrder}
                className={order.status !== 'pending' ? 'opacity-50 cursor-not-allowed' : ''}
              >
                <Edit2 className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onPrintKitchen(order._id)}
                title="Print Kitchen Order"
              >
                <Printer className="h-3 w-3" />
              </Button>
              {onPrintReceipt && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onPrintReceipt(order)}
                  title="Print Customer Receipt"
                  className="text-xs"
                >
                  <Printer className="h-3 w-3 mr-1" />
                  Receipt
                </Button>
              )}
              {order.status === 'pending' && (
                <Button size="sm" className="flex-1 bg-restaurant-primary hover:bg-restaurant-primary/90 text-xs">
                  Confirm
                </Button>
              )}
              {order.status === 'ready' && (
                <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700 text-xs">
                  Complete
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

OrderCard.displayName = 'OrderCard';

// Custom comparison function for React.memo
const areOrdersEqual = (prevProps: VirtualizedOrderListProps, nextProps: VirtualizedOrderListProps) => {
  if (prevProps.isLoading !== nextProps.isLoading) return false;
  if (prevProps.orders.length !== nextProps.orders.length) return false;
  if (prevProps.containerHeight !== nextProps.containerHeight) return false;
  if (prevProps.containerWidth !== nextProps.containerWidth) return false;
  
  return prevProps.orders.every((prevOrder, index) => {
    const nextOrder = nextProps.orders[index];
    return (
      prevOrder._id === nextOrder._id &&
      prevOrder.status === nextOrder.status &&
      prevOrder.paymentStatus === nextOrder.paymentStatus &&
      prevOrder.total === nextOrder.total &&
      prevOrder.orderNumber === nextOrder.orderNumber &&
      prevOrder.items.length === nextOrder.items.length
    );
  });
};

function VirtualizedOrderListComponent({ 
  orders, 
  onOrderClick, 
  onPrintKitchen, 
  onPrintReceipt, 
  onEditOrder, 
  isLoading,
  containerHeight = 600,
  containerWidth,
}: VirtualizedOrderListProps) {
  const { format: formatPrice } = useCurrency();
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = React.useState({ width: containerWidth || 1200, height: containerHeight });

  // Performance monitoring
  const { metrics } = usePerformanceMonitor({
    componentName: 'VirtualizedOrderList',
    enabled: process.env.NODE_ENV === 'development',
  });

  // Accessibility support
  const {
    containerAriaProps,
    AnnouncementArea,
  } = useVirtualizationAccessibility({
    totalItems: orders.length,
    visibleRange: { start: 0, end: Math.min(9, orders.length - 1) }, // Approximate visible range
    itemHeight: 320,
    containerHeight,
  });

  // Responsive columns calculation
  const columnsPerRow = useMemo(() => {
    const width = dimensions.width;
    if (width >= 1200) return 3; // lg:grid-cols-3
    if (width >= 768) return 2;  // md:grid-cols-2
    return 1; // grid-cols-1
  }, [dimensions.width]);

  const itemWidth = useMemo(() => Math.floor(dimensions.width / columnsPerRow), [dimensions.width, columnsPerRow]);
  const itemHeight = 320; // Fixed height for order cards
  
  const rowCount = useMemo(() => Math.ceil(orders.length / columnsPerRow), [orders.length, columnsPerRow]);

  // Handle container resize
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver(entries => {
      const entry = entries[0];
      if (entry) {
        setDimensions({
          width: entry.contentRect.width,
          height: containerHeight,
        });
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, [containerHeight]);

  // Memoized grid data
  const gridData = useMemo(() => ({
    orders,
    onOrderClick,
    onPrintKitchen,
    onPrintReceipt,
    onEditOrder,
    formatPrice,
    columnsPerRow,
  }), [orders, onOrderClick, onPrintKitchen, onPrintReceipt, onEditOrder, formatPrice, columnsPerRow]);

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

  // For small datasets (< 50 orders), use regular grid for better UX
  if (orders.length < 50) {
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
                  <span className="font-semibold text-lg">{formatPrice(order.total)}</span>
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
                    onClick={() => order.status === 'pending' ? onEditOrder?.(order) : null}
                    title={order.status === 'pending' ? "Edit Order" : `Cannot edit ${order.status} order`}
                    disabled={order.status !== 'pending' || !onEditOrder}
                    className={order.status !== 'pending' ? 'opacity-50 cursor-not-allowed' : ''}
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onPrintKitchen(order._id)}
                    title="Print Kitchen Order"
                  >
                    <Printer className="h-3 w-3" />
                  </Button>
                  {onPrintReceipt && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onPrintReceipt(order)}
                      title="Print Customer Receipt"
                    >
                      <Printer className="h-3 w-3 mr-1" />
                      Receipt
                    </Button>
                  )}
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

  // For large datasets, use virtualization
  return (
    <>
      <AnnouncementArea />
      <div ref={containerRef} className="w-full" {...containerAriaProps}>
        <div className="mb-4 flex justify-between items-center text-sm text-muted-foreground">
          <span>Showing {orders.length} orders (virtualized for performance)</span>
          {metrics && process.env.NODE_ENV === 'development' && (
            <div className="flex gap-4 text-xs bg-gray-100 px-2 py-1 rounded">
              <span>Renders: {metrics.rerenderCount}</span>
              <span>Last: {metrics.renderTime.toFixed(1)}ms</span>
              {metrics.memoryUsage && (
                <span>Memory: {(metrics.memoryUsage / 1024 / 1024).toFixed(1)}MB</span>
              )}
            </div>
          )}
        </div>
        
        <Grid
          columnCount={columnsPerRow}
          columnWidth={itemWidth}
          height={dimensions.height}
          rowCount={rowCount}
          rowHeight={itemHeight}
          width={dimensions.width}
          itemData={gridData}
          overscanRowCount={2}
          overscanColumnCount={1}
        >
          {OrderCard}
        </Grid>
      </div>
    </>
  );
}

// Memoized export with custom comparison
export const VirtualizedOrderList = memo(VirtualizedOrderListComponent, areOrdersEqual);