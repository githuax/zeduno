import { Router } from 'express';

import { getDashboardStats } from '../controllers/dashboard.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Dashboard stats endpoint
router.get('/stats', authenticate, authorize('admin', 'manager', 'staff'), getDashboardStats);

export default router;