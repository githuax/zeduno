import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { 
  getAllUsers, 
  getUserById, 
  updateUser, 
  deleteUser,
  getProfile,
  updateProfile
} from '../controllers/user.controller';

const router = Router();

router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);

router.get('/', authenticate, authorize('admin'), getAllUsers);
router.get('/:id', authenticate, authorize('admin'), getUserById);
router.put('/:id', authenticate, authorize('admin'), updateUser);
router.delete('/:id', authenticate, authorize('admin'), deleteUser);

export default router;