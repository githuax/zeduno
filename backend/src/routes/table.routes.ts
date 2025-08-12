import { Router } from 'express';
import {
  getTables,
  getTable,
  createTable,
  updateTable,
  updateTableStatus,
  deleteTable
} from '../controllers/table.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', getTables);
router.get('/:id', getTable);
router.post('/', authorize('admin'), createTable);
router.put('/:id', authorize('admin'), updateTable);
router.patch('/:id/status', authorize('admin', 'staff'), updateTableStatus);
router.delete('/:id', authorize('admin'), deleteTable);

export default router;