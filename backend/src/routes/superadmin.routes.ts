import { Router } from 'express';
import { body } from 'express-validator';
import { authLimiter } from '../middleware/rateLimiter';
import { 
  superAdminLogin, 
  getTenants, 
  switchTenant, 
  createTenant 
} from '../controllers/superadmin.controller';

const router = Router();

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
router.get('/tenants', getTenants);
router.post('/switch-tenant', switchTenant);
router.post('/tenants', createTenant);

export default router;