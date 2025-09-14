import { Router } from 'express';
import { ReportController } from '../controllers/report.controller';
import { authenticate } from '../middleware/auth';
import { branchContext } from '../middleware/branchContext';

const router = Router();

// Apply authentication middleware to all report routes
router.use(authenticate);
router.use(branchContext);

/**
 * @route POST /api/reports/sales
 * @desc Generate sales performance report
 * @access Private (Admin, Manager, Staff)
 * 
 * @body {object} Request body
 * @body {string} startDate - Start date in ISO format
 * @body {string} endDate - End date in ISO format  
 * @body {'pdf'|'excel'} format - Report format
 * @body {string} [branchId] - Specific branch ID for filtering
 * @body {string[]} [branchIds] - Multiple branch IDs for filtering
 * @body {'dine-in'|'takeaway'|'delivery'} [orderType] - Filter by order type
 * @body {'cash'|'card'|'mpesa'|'stripe'|'square'} [paymentMethod] - Filter by payment method
 * @body {'daily'|'weekly'|'monthly'} [period=daily] - Grouping period
 * @body {string} [fileName] - Custom file name
 * @body {boolean} [includeCharts=false] - Include charts in report
 * @body {boolean} [includeDetails=true] - Include detailed data
 * 
 * @returns {object} Report generation response with download URL
 */
router.post('/sales', ReportController.generateSalesReport);

/**
 * @route POST /api/reports/menu-performance
 * @desc Generate menu performance analysis report
 * @access Private (Admin, Manager, Staff)
 * 
 * @body {object} Request body
 * @body {string} startDate - Start date in ISO format
 * @body {string} endDate - End date in ISO format
 * @body {'pdf'|'excel'} format - Report format
 * @body {string} [branchId] - Specific branch ID for filtering
 * @body {string} [categoryId] - Specific category ID for filtering
 * @body {string} [fileName] - Custom file name
 * @body {boolean} [includeCharts=false] - Include charts in report
 * 
 * @returns {object} Report generation response with download URL
 */
router.post('/menu-performance', ReportController.generateMenuPerformanceReport);

/**
 * @route POST /api/reports/customer-analytics
 * @desc Generate customer analytics and behavior report
 * @access Private (Admin, Manager, Staff)
 * 
 * @body {object} Request body
 * @body {string} startDate - Start date in ISO format
 * @body {string} endDate - End date in ISO format
 * @body {'pdf'|'excel'} format - Report format
 * @body {string} [branchId] - Specific branch ID for filtering
 * @body {string} [fileName] - Custom file name
 * @body {boolean} [includeCharts=false] - Include charts in report
 * 
 * @returns {object} Report generation response with download URL
 */
router.post('/customer-analytics', ReportController.generateCustomerAnalyticsReport);

/**
 * @route POST /api/reports/financial-summary
 * @desc Generate comprehensive financial summary report
 * @access Private (Admin, Manager, SuperAdmin only)
 * 
 * @body {object} Request body
 * @body {string} startDate - Start date in ISO format
 * @body {string} endDate - End date in ISO format
 * @body {'pdf'|'excel'} format - Report format
 * @body {string} [branchId] - Specific branch ID for filtering
 * @body {'daily'|'weekly'|'monthly'} [period=daily] - Grouping period
 * @body {string} [fileName] - Custom file name
 * @body {boolean} [includeCharts=false] - Include charts in report
 * 
 * @returns {object} Report generation response with download URL
 */
router.post('/financial-summary', ReportController.generateFinancialSummaryReport);

/**
 * @route POST /api/reports/staff-performance
 * @desc Generate staff performance analysis report
 * @access Private (Admin, Manager, SuperAdmin only)
 * 
 * @body {object} Request body
 * @body {string} startDate - Start date in ISO format
 * @body {string} endDate - End date in ISO format
 * @body {'pdf'|'excel'} format - Report format
 * @body {string} [branchId] - Specific branch ID for filtering
 * @body {string} [fileName] - Custom file name
 * @body {boolean} [includeCharts=false] - Include charts in report
 * 
 * @returns {object} Report generation response with download URL
 */
router.post('/staff-performance', ReportController.generateStaffPerformanceReport);

/**
 * @route POST /api/reports/branch-performance
 * @desc Generate branch performance comparison report
 * @access Private (Admin, Manager, SuperAdmin only)
 * 
 * @body {object} Request body
 * @body {string} startDate - Start date in ISO format
 * @body {string} endDate - End date in ISO format
 * @body {'pdf'|'excel'} format - Report format
 * @body {string[]} [branchIds] - Multiple branch IDs for comparison
 * @body {'daily'|'weekly'|'monthly'} [period=daily] - Grouping period
 * @body {string} [fileName] - Custom file name
 * @body {boolean} [includeCharts=false] - Include charts in report
 * 
 * @returns {object} Report generation response with download URL
 */
router.post('/branch-performance', ReportController.generateBranchPerformanceReport);

/**
 * @route GET /api/reports/download/:fileName
 * @desc Download generated report file
 * @access Public (with valid file name)
 * 
 * @param {string} fileName - Name of the report file to download
 * 
 * @returns {file} Report file (PDF or Excel)
 */
router.get('/download/:fileName', ReportController.downloadReport);

/**
 * @route GET /api/reports/types
 * @desc Get list of available report types for current user
 * @access Private (All authenticated users)
 * 
 * @returns {object} List of available report types with permissions
 */
router.get('/types', ReportController.listReportTypes);

/**
 * @route GET /api/reports/branches
 * @desc Get user's accessible branches for report filtering
 * @access Private (All authenticated users)
 * 
 * @returns {object} List of branches user can generate reports for
 */
router.get('/branches', ReportController.getUserBranches);

/**
 * @route POST /api/reports/email
 * @desc Email generated report to specified recipients
 * @access Private (All authenticated users)
 * 
 * @body {object} Request body
 * @body {'sales'|'menu-performance'|'customer-analytics'|'financial-summary'|'staff-performance'|'branch-performance'} reportType - Type of report to generate and email
 * @body {string} startDate - Start date in ISO format
 * @body {string} endDate - End date in ISO format
 * @body {'pdf'|'excel'|'csv'} format - Report format
 * @body {string[]} recipients - Array of email addresses to send report to
 * @body {string} [subject] - Custom email subject line
 * @body {string} [message] - Custom message to include in email
 * @body {string} [branchId] - Specific branch ID for filtering
 * @body {string[]} [branchIds] - Multiple branch IDs for filtering
 * @body {'daily'|'weekly'|'monthly'} [period=daily] - Grouping period
 * @body {boolean} [includeCharts=false] - Include charts in report
 * 
 * @returns {object} Email delivery confirmation
 */
router.post('/email', ReportController.emailReport);

/**
 * @route DELETE /api/reports/cleanup
 * @desc Clean up expired report files (SuperAdmin only)
 * @access Private (SuperAdmin only)
 * 
 * @returns {object} Success message
 */
router.delete('/cleanup', ReportController.cleanupExpiredReports);

// Additional utility routes for report management

/**
 * @route POST /api/reports/bulk
 * @desc Generate multiple reports in batch
 * @access Private (Admin, Manager, SuperAdmin only)
 * 
 * @body {object} Request body
 * @body {object[]} reports - Array of report configurations
 * @body {string} reports[].type - Report type
 * @body {object} reports[].filters - Report filters
 * @body {object} reports[].config - Report configuration
 * 
 * @returns {object} Batch generation results
 */
// router.post('/bulk', ReportController.generateBulkReports);

/**
 * @route GET /api/reports/schedule
 * @desc Get scheduled reports for current tenant
 * @access Private (Admin, Manager, SuperAdmin only)
 * 
 * @returns {object} List of scheduled reports
 */
// router.get('/schedule', ReportController.getScheduledReports);

/**
 * @route POST /api/reports/schedule
 * @desc Schedule automatic report generation
 * @access Private (Admin, Manager, SuperAdmin only)
 * 
 * @body {object} Request body
 * @body {string} reportType - Type of report to schedule
 * @body {string} frequency - Schedule frequency (daily, weekly, monthly)
 * @body {object} filters - Report filters
 * @body {object} config - Report configuration
 * @body {string[]} recipients - Email recipients
 * 
 * @returns {object} Scheduled report details
 */
// router.post('/schedule', ReportController.scheduleReport);

/**
 * @route DELETE /api/reports/schedule/:scheduleId
 * @desc Cancel scheduled report
 * @access Private (Admin, Manager, SuperAdmin only)
 * 
 * @param {string} scheduleId - Schedule ID to cancel
 * 
 * @returns {object} Success message
 */
// router.delete('/schedule/:scheduleId', ReportController.cancelScheduledReport);

export default router;