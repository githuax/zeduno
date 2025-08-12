import { Router } from 'express';
import {
  getMenuItems,
  getMenuItem,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  toggleAvailability
} from '../controllers/menu.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/', getMenuItems);
router.get('/:id', getMenuItem);
router.post('/', authenticate, authorize('admin', 'staff'), createMenuItem);
router.put('/:id', authenticate, authorize('admin', 'staff'), updateMenuItem);
router.patch('/:id/toggle-availability', authenticate, authorize('admin', 'staff'), toggleAvailability);
router.delete('/:id', authenticate, authorize('admin'), deleteMenuItem);

export default router;