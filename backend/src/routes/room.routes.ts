import { Router } from 'express';

import {
  getAllRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom,
  getAvailableRooms
} from '../controllers/room.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/', getAllRooms);
router.get('/available', getAvailableRooms);
router.get('/:id', getRoomById);

router.post('/', authenticate, authorize('admin', 'staff'), createRoom);
router.put('/:id', authenticate, authorize('admin', 'staff'), updateRoom);
router.delete('/:id', authenticate, authorize('admin'), deleteRoom);

export default router;