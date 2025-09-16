import express from 'express';

import {
  createTenantWithAdmin,
  getAllTenants,
  getTenantById,
  updateTenant,
  updateTenantStatus,
  deleteTenant,
} from '../controllers/tenant.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

router.use(authenticate);
router.use(authorize('superadmin'));

router.post('/', createTenantWithAdmin);
router.get('/', getAllTenants);
router.get('/:id', getTenantById);
router.put('/:id', updateTenant);
router.patch('/:id/status', updateTenantStatus);
router.delete('/:id', deleteTenant);

export default router;