import React, { memo } from 'react';
import { VirtualizedOrderList } from './VirtualizedOrderList';
import { Order } from '@/types/order.types';

interface OrderListProps {
  orders: Order[];
  onOrderClick: (order: Order) => void;
  onPrintKitchen: (orderId: string) => void;
  onPrintReceipt?: (order: Order) => void;
  onEditOrder?: (order: Order) => void;
  isLoading?: boolean;
  containerHeight?: number;
  containerWidth?: number;
}

function OrderListComponent({ 
  orders, 
  onOrderClick, 
  onPrintKitchen, 
  onPrintReceipt, 
  onEditOrder, 
  isLoading,
  containerHeight,
  containerWidth
}: OrderListProps) {
  return (
    <VirtualizedOrderList
      orders={orders}
      onOrderClick={onOrderClick}
      onPrintKitchen={onPrintKitchen}
      onPrintReceipt={onPrintReceipt}
      onEditOrder={onEditOrder}
      isLoading={isLoading}
      containerHeight={containerHeight}
      containerWidth={containerWidth}
    />
  );
}

// Custom comparison function for React.memo
const areOrdersEqual = (prevProps: OrderListProps, nextProps: OrderListProps) => {
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

// Memoized export with custom comparison
export const OrderList = memo(OrderListComponent, areOrdersEqual);