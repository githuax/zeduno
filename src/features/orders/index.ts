// Orders feature exports
export { CreateOrderDialog } from './components/CreateOrderDialog';
export { EditOrderDialog } from './components/EditOrderDialog';
export { OrderDetailsDialog } from './components/OrderDetailsDialog';
export { OrderList } from './components/OrderList';

// Components sub-module for cleaner imports within feature  
export * from './components';

// Hooks
export { useOrders, useOrder } from './hooks/useOrders';

// Pages
export { default as OrderManagement } from './pages/OrderManagement';