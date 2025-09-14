import { Router } from 'express';
import { body, param, query } from 'express-validator';

import { BranchController } from '../controllers/branch.controller';
import { authenticate, authorize } from '../middleware/auth';
import { 
  branchContext, 
  requireBranch, 
  requireBranchManager,
  requireMultiBranchAccess 
} from '../middleware/branchContext';

const router = Router();

// Validation rules
const createBranchValidation = [
  body('name').notEmpty().withMessage('Branch name is required'),
  body('type').isIn(['main', 'branch', 'franchise']).withMessage('Invalid branch type'),
  body('address.street').notEmpty().withMessage('Street address is required'),
  body('address.city').notEmpty().withMessage('City is required'),
  body('address.state').notEmpty().withMessage('State is required'),
  body('address.postalCode').notEmpty().withMessage('Postal code is required'),
  body('address.country').notEmpty().withMessage('Country is required'),
  body('contact.phone').notEmpty().withMessage('Contact phone is required'),
  body('contact.email').isEmail().withMessage('Valid email is required'),
  body('operations.openTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid open time format'),
  body('operations.closeTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid close time format'),
  body('financial.currency').notEmpty().withMessage('Currency is required'),
  body('financial.taxRate').isNumeric().withMessage('Tax rate must be numeric'),
];

const updateBranchValidation = [
  body('name').optional().notEmpty().withMessage('Branch name cannot be empty'),
  body('type').optional().isIn(['main', 'branch', 'franchise']).withMessage('Invalid branch type'),
  body('status').optional().isIn(['active', 'inactive', 'suspended']).withMessage('Invalid status'),
  body('operations.openTime').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid open time format'),
  body('operations.closeTime').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid close time format'),
  body('financial.taxRate').optional().isNumeric().withMessage('Tax rate must be numeric'),
];

// Public routes (no auth required)
// None for branches - all require authentication

// Protected routes (authentication required)
router.use(authenticate);

// Get all branches for the tenant
router.get(
  '/',
  branchContext,
  authorize('admin', 'manager', 'staff'),
  BranchController.getBranches
);

// Get branch hierarchy
router.get(
  '/hierarchy',
  branchContext,
  authorize('admin', 'manager'),
  BranchController.getBranchHierarchy
);

// Get consolidated metrics across all branches
router.get(
  '/metrics/consolidated',
  branchContext,
  authorize('admin'),
  BranchController.getConsolidatedMetrics
);

// Get specific branch by ID
router.get(
  '/:branchId',
  branchContext,
  authorize('admin', 'manager', 'staff'),
  param('branchId').isMongoId().withMessage('Invalid branch ID'),
  BranchController.getBranchById
);

// Get branch metrics
router.get(
  '/:branchId/metrics',
  branchContext,
  requireBranchManager,
  param('branchId').isMongoId().withMessage('Invalid branch ID'),
  query('startDate').optional().isISO8601().withMessage('Invalid start date'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date'),
  BranchController.getBranchMetrics
);

// Create new branch
router.post(
  '/',
  branchContext,
  authorize('admin'),
  createBranchValidation,
  BranchController.createBranch
);

// Clone existing branch
router.post(
  '/:sourceBranchId/clone',
  branchContext,
  authorize('admin'),
  param('sourceBranchId').isMongoId().withMessage('Invalid source branch ID'),
  createBranchValidation,
  BranchController.cloneBranch
);

// Update branch
router.put(
  '/:branchId',
  branchContext,
  requireBranchManager,
  param('branchId').isMongoId().withMessage('Invalid branch ID'),
  updateBranchValidation,
  BranchController.updateBranch
);

// Delete branch (soft delete)
router.delete(
  '/:branchId',
  branchContext,
  authorize('admin'),
  param('branchId').isMongoId().withMessage('Invalid branch ID'),
  BranchController.deleteBranch
);

// User-Branch Management Routes
// Assign user to branch
router.post(
  '/:branchId/users',
  branchContext,
  requireBranchManager,
  param('branchId').isMongoId().withMessage('Invalid branch ID'),
  body('userId').isMongoId().withMessage('Invalid user ID'),
  BranchController.assignUserToBranch
);

// Remove user from branch
router.delete(
  '/:branchId/users/:userId',
  branchContext,
  requireBranchManager,
  param('branchId').isMongoId().withMessage('Invalid branch ID'),
  param('userId').isMongoId().withMessage('Invalid user ID'),
  BranchController.removeUserFromBranch
);

// Switch current branch for authenticated user
router.post(
  '/switch',
  branchContext,
  requireMultiBranchAccess,
  body('branchId').isMongoId().withMessage('Invalid branch ID'),
  BranchController.switchBranch
);

export default router;