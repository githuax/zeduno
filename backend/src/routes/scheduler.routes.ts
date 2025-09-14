import express from 'express';
import { param } from 'express-validator';

import SchedulerController from '../controllers/scheduler.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

/**
 * @route GET /api/scheduler/reports
 * @desc Get all scheduled reports for the current tenant
 * @access Private (Manager, Admin, SuperAdmin)
 * @query page - Page number for pagination (default: 1)
 * @query limit - Items per page (default: 10)
 * @query status - Filter by status: active, inactive
 * @query reportType - Filter by report type
 * @query isActive - Filter by active status: true, false
 */
router.get(
  '/reports',
  authorize('manager', 'admin', 'superadmin'),
  SchedulerController.getScheduledReports
);

/**
 * @route GET /api/scheduler/reports/:id
 * @desc Get a specific scheduled report
 * @access Private (Manager, Admin, SuperAdmin)
 */
router.get(
  '/reports/:id',
  authorize('manager', 'admin', 'superadmin'),
  param('id').isMongoId().withMessage('Invalid scheduled report ID'),
  SchedulerController.getScheduledReport
);

/**
 * @route POST /api/scheduler/reports
 * @desc Create a new scheduled report
 * @access Private (Manager, Admin, SuperAdmin)
 * @body {
 *   title: string,
 *   description?: string,
 *   reportType: 'sales' | 'menu-performance' | 'customer-analytics' | 'financial-summary' | 'staff-performance' | 'branch-performance',
 *   frequency: 'daily' | 'weekly' | 'monthly' | 'custom',
 *   cronExpression?: string,
 *   recipients: string[],
 *   format: 'pdf' | 'excel',
 *   scheduledTime: {
 *     hour: number,
 *     minute: number,
 *     dayOfWeek?: number,
 *     dayOfMonth?: number
 *   },
 *   timezone: string,
 *   parameters: {
 *     branchId?: ObjectId,
 *     dateRange?: 'auto' | number,
 *     includeCharts?: boolean,
 *     includeDetails?: boolean,
 *     customFilters?: object
 *   },
 *   maxFailures?: number
 * }
 */
router.post(
  '/reports',
  authorize('manager', 'admin', 'superadmin'),
  SchedulerController.validateScheduledReport(),
  SchedulerController.createScheduledReport
);

/**
 * @route PUT /api/scheduler/reports/:id
 * @desc Update a scheduled report
 * @access Private (Manager, Admin, SuperAdmin)
 */
router.put(
  '/reports/:id',
  authorize('manager', 'admin', 'superadmin'),
  param('id').isMongoId().withMessage('Invalid scheduled report ID'),
  SchedulerController.validateScheduledReport(),
  SchedulerController.updateScheduledReport
);

/**
 * @route DELETE /api/scheduler/reports/:id
 * @desc Delete a scheduled report
 * @access Private (Admin, SuperAdmin)
 */
router.delete(
  '/reports/:id',
  authorize('admin', 'superadmin'),
  param('id').isMongoId().withMessage('Invalid scheduled report ID'),
  SchedulerController.deleteScheduledReport
);

/**
 * @route POST /api/scheduler/reports/:id/toggle
 * @desc Pause or resume a scheduled report
 * @access Private (Manager, Admin, SuperAdmin)
 * @body { isActive: boolean }
 */
router.post(
  '/reports/:id/toggle',
  authorize('manager', 'admin', 'superadmin'),
  param('id').isMongoId().withMessage('Invalid scheduled report ID'),
  SchedulerController.toggleScheduledReport
);

/**
 * @route POST /api/scheduler/reports/:id/run
 * @desc Run a scheduled report immediately
 * @access Private (Manager, Admin, SuperAdmin)
 */
router.post(
  '/reports/:id/run',
  authorize('manager', 'admin', 'superadmin'),
  param('id').isMongoId().withMessage('Invalid scheduled report ID'),
  SchedulerController.runScheduledReportNow
);

/**
 * @route GET /api/scheduler/reports/:id/history
 * @desc Get execution history for a scheduled report
 * @access Private (Manager, Admin, SuperAdmin)
 * @query page - Page number for pagination (default: 1)
 * @query limit - Items per page (default: 20)
 */
router.get(
  '/reports/:id/history',
  authorize('manager', 'admin', 'superadmin'),
  param('id').isMongoId().withMessage('Invalid scheduled report ID'),
  SchedulerController.getExecutionHistory
);

/**
 * @route GET /api/scheduler/queue/stats
 * @desc Get queue statistics and recent jobs
 * @access Private (Admin, SuperAdmin)
 */
router.get(
  '/queue/stats',
  authorize('admin', 'superadmin'),
  SchedulerController.getQueueStats
);

/**
 * @route GET /api/scheduler/dashboard
 * @desc Get dashboard summary for scheduled reports
 * @access Private (Manager, Admin, SuperAdmin)
 */
router.get(
  '/dashboard',
  authorize('manager', 'admin', 'superadmin'),
  SchedulerController.getDashboardSummary
);

export default router;