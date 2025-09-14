import { Router } from 'express';
import { body } from 'express-validator';
import multer from 'multer';

import { 
  superAdminLogin, 
  getTenants, 
  switchTenant, 
  createTenant,
  updateTenant,
  deleteTenant,
  updateTenantStatus,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  updateUserStatus,
  getSystemAnalytics,
  getTenantAnalytics,
  uploadSystemLogo,
  getSystemLogo
} from '../controllers/superadmin.controller';
import { authenticateSuperAdmin } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimiter';

const router = Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max file size
  },
  fileFilter: (req, file, cb) => {
    // Only allow image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// SuperAdmin authentication
router.post(
  '/login',
  authLimiter,
  [
    body('email').notEmpty().withMessage('Email or username is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  superAdminLogin
);

// SuperAdmin tenant management
router.get('/tenants', authenticateSuperAdmin, getTenants);
router.post('/switch-tenant', authenticateSuperAdmin, switchTenant);
router.post('/tenants', authenticateSuperAdmin, createTenant);
router.put('/tenants/:id', authenticateSuperAdmin, updateTenant);
router.delete('/tenants/:id', authenticateSuperAdmin, deleteTenant);
router.patch('/tenants/:id/status', authenticateSuperAdmin, updateTenantStatus);

// SuperAdmin user management
router.get('/users', authenticateSuperAdmin, getUsers);
router.post('/users', authenticateSuperAdmin, createUser);
router.put('/users/:id', authenticateSuperAdmin, updateUser);
router.delete('/users/:id', authenticateSuperAdmin, deleteUser);
router.patch('/users/:id/status', authenticateSuperAdmin, updateUserStatus);

// SuperAdmin analytics
router.get('/analytics/system', authenticateSuperAdmin, getSystemAnalytics);
router.get('/analytics/tenants', authenticateSuperAdmin, getTenantAnalytics);

// System settings - Logo management
router.post('/settings/logo', authenticateSuperAdmin, upload.single('logo'), uploadSystemLogo);
router.get('/settings/logo', getSystemLogo);

export default router;