import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  getShifts,
  createShift,
  updateShift,
  deleteShift
} from '../controllers/shift.controller';

const router = Router();

// Apply authentication to all shift routes
router.use(authenticate);

// Shift routes
router.get('/', getShifts);
router.post('/', authorize('admin', 'manager'), createShift);
router.put('/:id', authorize('admin', 'manager'), updateShift);
router.delete('/:id', authorize('admin', 'manager'), deleteShift);

export default router;