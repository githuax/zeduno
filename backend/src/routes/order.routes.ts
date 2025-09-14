import { Router } from 'express';

import {
  getOrders,
  getOrder,
  createOrder,
  updateOrder,
  updateOrderStatus,
  updateItemStatus,
  splitOrder,
  mergeOrders,
  printKitchenOrder,
  deleteOrder,
  cancelOrder,
  getKitchenOrders,
  getDeliveryOrders,
  assignDriver,
  submitFeedback,
  getOrderAnalytics,
  getRealtimeStats
} from '../controllers/order.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Basic order management routes (authenticated)
router.use(authenticate);

router.get('/', getOrders);
router.get('/:id', getOrder);
router.post('/', authorize('admin', 'staff'), createOrder);
router.put('/:id', authorize('admin', 'staff'), updateOrder);
router.patch('/:id/status', authorize('admin', 'staff'), updateOrderStatus);
router.patch('/:id/items/:itemId/status', authorize('admin', 'staff'), updateItemStatus);
router.post('/:id/split', authorize('admin', 'staff'), splitOrder);
router.post('/merge', authorize('admin', 'staff'), mergeOrders);
router.post('/:id/print-kitchen', authorize('admin', 'staff'), printKitchenOrder);
router.delete('/:id', authorize('admin'), deleteOrder);

// Enhanced order management routes
router.patch('/:id/cancel', authorize('admin', 'staff'), cancelOrder);

// Kitchen Display System routes
router.get('/kitchen/orders', authorize('admin', 'staff'), getKitchenOrders);

// Delivery management routes
router.get('/delivery/orders', authorize('admin', 'staff'), getDeliveryOrders);
router.patch('/:id/assign-driver', authorize('admin', 'staff'), assignDriver);

// Customer feedback routes
router.post('/:id/feedback', submitFeedback);

// Analytics and reporting routes
router.get('/analytics/overview', authorize('admin'), getOrderAnalytics);
router.get('/analytics/realtime', authorize('admin', 'staff'), getRealtimeStats);

export default router;