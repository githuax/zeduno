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
  deleteOrder
} from '../controllers/order.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

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

export default router;