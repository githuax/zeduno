import { Router } from 'express';

import { 
  getAllUsers, 
  getUserById, 
  updateUser, 
  deleteUser,
  getProfile,
  updateProfile,
  createUser,
  getUserAuditLogs,
  changePassword
} from '../controllers/user.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);
router.get('/audit-logs', authenticate, getUserAuditLogs);
router.post('/change-password', authenticate, changePassword);

router.post('/', authenticate, authorize('admin', 'manager'), createUser);
router.get('/', authenticate, authorize('admin', 'manager'), getAllUsers);
router.get('/:id', authenticate, authorize('admin', 'manager'), getUserById);
router.put('/:id', authenticate, authorize('admin', 'manager'), updateUser);
router.delete('/:id', authenticate, authorize('admin'), deleteUser);

export default router;