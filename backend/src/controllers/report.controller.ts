import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { body, query, validationResult } from 'express-validator';
import mongoose from 'mongoose';

import ReportService from '../services/report.service';
import AnalyticsService from '../services/analytics.service';
import { emailService, EmailData } from '../services/email.service';
import { Tenant } from '../models/Tenant';
import { Branch } from '../models/Branch';
import {
  ReportType,
  ReportFilters,
  ReportConfig,
  ReportTemplateContext,
  ReportGenerationRequest,
  ReportGenerationResponse,
  ReportValidationError,
  ReportGenerationError,
  ReportError
} from '../types/report.types';

interface AuthenticatedRequest extends Request {
  user?: {
    _id: string;
    firstName: string;
    lastName: string;
    role: string;
    tenantId: string;
    currentBranch?: string;
  };
}

export class ReportController {
  /**
   * Generate Sales Report
   */
  static generateSalesReport = [
    // Validation rules
    body('startDate').isISO8601().withMessage('Start date must be a valid ISO date'),
    body('endDate').isISO8601().withMessage('End date must be a valid ISO date'),
    body('format').isIn(['pdf', 'excel']).withMessage('Format must be pdf or excel'),
    body('branchId').optional().isMongoId().withMessage('Branch ID must be a valid MongoDB ID'),
    body('branchIds').optional().isArray().withMessage('Branch IDs must be an array'),
    body('orderType').optional().isIn(['dine-in', 'takeaway', 'delivery']).withMessage('Invalid order type'),
    body('paymentMethod').optional().isIn(['cash', 'card', 'upi', 'wallet', 'online', 'mpesa', 'stripe', 'square']).withMessage('Invalid payment method'),

    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({
            success: false,
            error: 'Validation failed',
            details: errors.array()
          });
        }

        if (!req.user) {
          return res.status(401).json({
            success: false,
            error: 'Authentication required'
          });
        }

        // Validate date range
        const startDate = new Date(req.body.startDate);
        const endDate = new Date(req.body.endDate);
        
        if (startDate >= endDate) {
          return res.status(400).json({
            success: false,
            error: 'Start date must be before end date'
          });
        }

        // Build filters
        const filters: ReportFilters = {
          tenantId: req.user.tenantId,
          startDate,
          endDate,
          branchId: req.body.branchId,
          branchIds: req.body.branchIds,
          orderType: req.body.orderType,
          paymentMethod: req.body.paymentMethod,
          period: req.body.period || 'daily'
        };

        // Build config
        const config: ReportConfig = {
          format: req.body.format,
          fileName: req.body.fileName,
          includeCharts: req.body.includeCharts || false,
          includeDetails: req.body.includeDetails !== false,
          groupBy: req.body.groupBy,
          sortBy: req.body.sortBy || 'date',
          sortOrder: req.body.sortOrder || 'desc',
          timezone: req.body.timezone || 'UTC',
          currency: req.body.currency || 'USD'
        };

        // Get company info
        const tenant = await Tenant.findById(req.user.tenantId);
        if (!tenant) {
          return res.status(404).json({
            success: false,
            error: 'Tenant not found'
          });
        }

        // Generate analytics data
        const analyticsData = await AnalyticsService.generateSalesAnalytics(filters);

        // Prepare template context
        const context: Omit<ReportTemplateContext, 'data' | 'config'> = {
          title: 'Sales Performance Report',
          subtitle: `Sales analysis from ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`,
          companyInfo: {
            name: tenant.name,
            logo: tenant.logo,
            address: tenant.address,
            phone: tenant.phone,
            email: tenant.email
          },
          generatedBy: {
            userId: req.user._id,
            userName: `${req.user.firstName} ${req.user.lastName}`,
            userRole: req.user.role
          },
          generatedAt: new Date(),
          formattedGeneratedAt: new Date().toLocaleString()
        };

        // Generate report
        const result = await ReportService.generateReport('sales', analyticsData, config, context);

        res.json(result);

      } catch (error) {
        console.error('Sales report generation error:', error);
        
        if (error instanceof ReportValidationError) {
          return res.status(400).json({
            success: false,
            error: error.message
          });
        }
        
        if (error instanceof ReportGenerationError) {
          return res.status(500).json({
            success: false,
            error: error.message
          });
        }

        res.status(500).json({
          success: false,
          error: 'Failed to generate sales report'
        });
      }
    }
  ];

  /**
   * Generate Menu Performance Report
   */
  static generateMenuPerformanceReport = [
    // Validation rules
    body('startDate').isISO8601().withMessage('Start date must be a valid ISO date'),
    body('endDate').isISO8601().withMessage('End date must be a valid ISO date'),
    body('format').isIn(['pdf', 'excel']).withMessage('Format must be pdf or excel'),
    body('branchId').optional().isMongoId().withMessage('Branch ID must be a valid MongoDB ID'),
    body('categoryId').optional().isMongoId().withMessage('Category ID must be a valid MongoDB ID'),

    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({
            success: false,
            error: 'Validation failed',
            details: errors.array()
          });
        }

        if (!req.user) {
          return res.status(401).json({
            success: false,
            error: 'Authentication required'
          });
        }

        const startDate = new Date(req.body.startDate);
        const endDate = new Date(req.body.endDate);

        const filters: ReportFilters = {
          tenantId: req.user.tenantId,
          startDate,
          endDate,
          branchId: req.body.branchId,
          categoryId: req.body.categoryId,
          period: req.body.period || 'daily'
        };

        const config: ReportConfig = {
          format: req.body.format,
          fileName: req.body.fileName,
          includeCharts: req.body.includeCharts || false,
          includeDetails: req.body.includeDetails !== false
        };

        const tenant = await Tenant.findById(req.user.tenantId);
        if (!tenant) {
          return res.status(404).json({
            success: false,
            error: 'Tenant not found'
          });
        }

        const analyticsData = await AnalyticsService.generateMenuPerformanceAnalytics(filters);

        const context: Omit<ReportTemplateContext, 'data' | 'config'> = {
          title: 'Menu Performance Report',
          subtitle: `Menu analysis from ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`,
          companyInfo: {
            name: tenant.name,
            logo: tenant.logo,
            address: tenant.address,
            phone: tenant.phone,
            email: tenant.email
          },
          generatedBy: {
            userId: req.user._id,
            userName: `${req.user.firstName} ${req.user.lastName}`,
            userRole: req.user.role
          },
          generatedAt: new Date(),
          formattedGeneratedAt: new Date().toLocaleString()
        };

        const result = await ReportService.generateReport('menu-performance', analyticsData, config, context);

        res.json(result);

      } catch (error) {
        console.error('Menu performance report generation error:', error);
        ReportController.handleReportError(error, res);
      }
    }
  ];

  /**
   * Generate Customer Analytics Report
   */
  static generateCustomerAnalyticsReport = [
    body('startDate').isISO8601().withMessage('Start date must be a valid ISO date'),
    body('endDate').isISO8601().withMessage('End date must be a valid ISO date'),
    body('format').isIn(['pdf', 'excel']).withMessage('Format must be pdf or excel'),

    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({
            success: false,
            error: 'Validation failed',
            details: errors.array()
          });
        }

        if (!req.user) {
          return res.status(401).json({
            success: false,
            error: 'Authentication required'
          });
        }

        const startDate = new Date(req.body.startDate);
        const endDate = new Date(req.body.endDate);

        const filters: ReportFilters = {
          tenantId: req.user.tenantId,
          startDate,
          endDate,
          branchId: req.body.branchId,
          period: req.body.period || 'daily'
        };

        const config: ReportConfig = {
          format: req.body.format,
          fileName: req.body.fileName,
          includeCharts: req.body.includeCharts || false,
          includeDetails: req.body.includeDetails !== false
        };

        const tenant = await Tenant.findById(req.user.tenantId);
        if (!tenant) {
          return res.status(404).json({
            success: false,
            error: 'Tenant not found'
          });
        }

        const analyticsData = await AnalyticsService.generateCustomerAnalytics(filters);

        const context: Omit<ReportTemplateContext, 'data' | 'config'> = {
          title: 'Customer Analytics Report',
          subtitle: `Customer insights from ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`,
          companyInfo: {
            name: tenant.name,
            logo: tenant.logo,
            address: tenant.address,
            phone: tenant.phone,
            email: tenant.email
          },
          generatedBy: {
            userId: req.user._id,
            userName: `${req.user.firstName} ${req.user.lastName}`,
            userRole: req.user.role
          },
          generatedAt: new Date(),
          formattedGeneratedAt: new Date().toLocaleString()
        };

        const result = await ReportService.generateReport('customer-analytics', analyticsData, config, context);

        res.json(result);

      } catch (error) {
        console.error('Customer analytics report generation error:', error);
        ReportController.handleReportError(error, res);
      }
    }
  ];

  /**
   * Generate Financial Summary Report
   */
  static generateFinancialSummaryReport = [
    body('startDate').isISO8601().withMessage('Start date must be a valid ISO date'),
    body('endDate').isISO8601().withMessage('End date must be a valid ISO date'),
    body('format').isIn(['pdf', 'excel']).withMessage('Format must be pdf or excel'),

    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({
            success: false,
            error: 'Validation failed',
            details: errors.array()
          });
        }

        if (!req.user) {
          return res.status(401).json({
            success: false,
            error: 'Authentication required'
          });
        }

        // Only allow admin and superadmin roles for financial reports
        if (!['admin', 'superadmin', 'manager'].includes(req.user.role)) {
          return res.status(403).json({
            success: false,
            error: 'Insufficient permissions for financial reports'
          });
        }

        const startDate = new Date(req.body.startDate);
        const endDate = new Date(req.body.endDate);

        const filters: ReportFilters = {
          tenantId: req.user.tenantId,
          startDate,
          endDate,
          branchId: req.body.branchId,
          period: req.body.period || 'daily'
        };

        const config: ReportConfig = {
          format: req.body.format,
          fileName: req.body.fileName,
          includeCharts: req.body.includeCharts || false,
          includeDetails: req.body.includeDetails !== false
        };

        const tenant = await Tenant.findById(req.user.tenantId);
        if (!tenant) {
          return res.status(404).json({
            success: false,
            error: 'Tenant not found'
          });
        }

        const analyticsData = await AnalyticsService.generateFinancialSummary(filters);

        const context: Omit<ReportTemplateContext, 'data' | 'config'> = {
          title: 'Financial Summary Report',
          subtitle: `Financial analysis from ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`,
          companyInfo: {
            name: tenant.name,
            logo: tenant.logo,
            address: tenant.address,
            phone: tenant.phone,
            email: tenant.email
          },
          generatedBy: {
            userId: req.user._id,
            userName: `${req.user.firstName} ${req.user.lastName}`,
            userRole: req.user.role
          },
          generatedAt: new Date(),
          formattedGeneratedAt: new Date().toLocaleString()
        };

        const result = await ReportService.generateReport('financial-summary', analyticsData, config, context);

        res.json(result);

      } catch (error) {
        console.error('Financial summary report generation error:', error);
        ReportController.handleReportError(error, res);
      }
    }
  ];

  /**
   * Generate Staff Performance Report
   */
  static generateStaffPerformanceReport = [
    body('startDate').isISO8601().withMessage('Start date must be a valid ISO date'),
    body('endDate').isISO8601().withMessage('End date must be a valid ISO date'),
    body('format').isIn(['pdf', 'excel']).withMessage('Format must be pdf or excel'),

    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({
            success: false,
            error: 'Validation failed',
            details: errors.array()
          });
        }

        if (!req.user) {
          return res.status(401).json({
            success: false,
            error: 'Authentication required'
          });
        }

        // Only allow admin and manager roles
        if (!['admin', 'superadmin', 'manager'].includes(req.user.role)) {
          return res.status(403).json({
            success: false,
            error: 'Insufficient permissions for staff reports'
          });
        }

        const startDate = new Date(req.body.startDate);
        const endDate = new Date(req.body.endDate);

        const filters: ReportFilters = {
          tenantId: req.user.tenantId,
          startDate,
          endDate,
          branchId: req.body.branchId,
          period: req.body.period || 'daily'
        };

        const config: ReportConfig = {
          format: req.body.format,
          fileName: req.body.fileName,
          includeCharts: req.body.includeCharts || false,
          includeDetails: req.body.includeDetails !== false
        };

        const tenant = await Tenant.findById(req.user.tenantId);
        if (!tenant) {
          return res.status(404).json({
            success: false,
            error: 'Tenant not found'
          });
        }

        const analyticsData = await AnalyticsService.generateStaffPerformance(filters);

        const context: Omit<ReportTemplateContext, 'data' | 'config'> = {
          title: 'Staff Performance Report',
          subtitle: `Staff analysis from ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`,
          companyInfo: {
            name: tenant.name,
            logo: tenant.logo,
            address: tenant.address,
            phone: tenant.phone,
            email: tenant.email
          },
          generatedBy: {
            userId: req.user._id,
            userName: `${req.user.firstName} ${req.user.lastName}`,
            userRole: req.user.role
          },
          generatedAt: new Date(),
          formattedGeneratedAt: new Date().toLocaleString()
        };

        const result = await ReportService.generateReport('staff-performance', analyticsData, config, context);

        res.json(result);

      } catch (error) {
        console.error('Staff performance report generation error:', error);
        ReportController.handleReportError(error, res);
      }
    }
  ];

  /**
   * Generate Branch Performance Report
   */
  static generateBranchPerformanceReport = [
    body('startDate').isISO8601().withMessage('Start date must be a valid ISO date'),
    body('endDate').isISO8601().withMessage('End date must be a valid ISO date'),
    body('format').isIn(['pdf', 'excel']).withMessage('Format must be pdf or excel'),

    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({
            success: false,
            error: 'Validation failed',
            details: errors.array()
          });
        }

        if (!req.user) {
          return res.status(401).json({
            success: false,
            error: 'Authentication required'
          });
        }

        // Only allow admin and superadmin roles
        if (!['admin', 'superadmin', 'manager'].includes(req.user.role)) {
          return res.status(403).json({
            success: false,
            error: 'Insufficient permissions for branch reports'
          });
        }

        const startDate = new Date(req.body.startDate);
        const endDate = new Date(req.body.endDate);

        const filters: ReportFilters = {
          tenantId: req.user.tenantId,
          startDate,
          endDate,
          branchIds: req.body.branchIds,
          period: req.body.period || 'daily'
        };

        const config: ReportConfig = {
          format: req.body.format,
          fileName: req.body.fileName,
          includeCharts: req.body.includeCharts || false,
          includeDetails: req.body.includeDetails !== false
        };

        const tenant = await Tenant.findById(req.user.tenantId);
        if (!tenant) {
          return res.status(404).json({
            success: false,
            error: 'Tenant not found'
          });
        }

        const analyticsData = await AnalyticsService.generateBranchPerformance(filters);

        const context: Omit<ReportTemplateContext, 'data' | 'config'> = {
          title: 'Branch Performance Report',
          subtitle: `Branch analysis from ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`,
          companyInfo: {
            name: tenant.name,
            logo: tenant.logo,
            address: tenant.address,
            phone: tenant.phone,
            email: tenant.email
          },
          generatedBy: {
            userId: req.user._id,
            userName: `${req.user.firstName} ${req.user.lastName}`,
            userRole: req.user.role
          },
          generatedAt: new Date(),
          formattedGeneratedAt: new Date().toLocaleString()
        };

        const result = await ReportService.generateReport('branch-performance', analyticsData, config, context);

        res.json(result);

      } catch (error) {
        console.error('Branch performance report generation error:', error);
        ReportController.handleReportError(error, res);
      }
    }
  ];

  /**
   * Download Report File
   */
  static downloadReport = async (req: Request, res: Response) => {
    try {
      const { fileName } = req.params;

      if (!fileName || !fileName.match(/^[a-zA-Z0-9._-]+$/)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid file name'
        });
      }

      const filePath = path.join(process.cwd(), 'reports', fileName);

      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          success: false,
          error: 'Report file not found'
        });
      }

      // Check if file is expired (older than 24 hours)
      const stats = fs.statSync(filePath);
      const now = Date.now();
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours

      if (now - stats.mtime.getTime() > maxAge) {
        fs.unlinkSync(filePath);
        return res.status(404).json({
          success: false,
          error: 'Report file has expired'
        });
      }

      // Set appropriate headers based on file extension
      const ext = path.extname(fileName).toLowerCase();
      let contentType = 'application/octet-stream';

      if (ext === '.pdf') {
        contentType = 'application/pdf';
      } else if (ext === '.xlsx') {
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      }

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.setHeader('Cache-Control', 'no-cache');

      // Stream the file
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);

      // Handle stream errors
      fileStream.on('error', (error) => {
        console.error('File stream error:', error);
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            error: 'Failed to download report'
          });
        }
      });

    } catch (error) {
      console.error('Download report error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to download report'
      });
    }
  };

  /**
   * List Available Report Types
   */
  static listReportTypes = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const reportTypes = [
        {
          type: 'sales',
          name: 'Sales Performance Report',
          description: 'Comprehensive sales analysis including revenue, orders, and performance metrics',
          requiredRole: ['admin', 'manager', 'staff'],
          formats: ['pdf', 'excel']
        },
        {
          type: 'menu-performance',
          name: 'Menu Performance Report',
          description: 'Analysis of menu item popularity, category performance, and inventory alerts',
          requiredRole: ['admin', 'manager', 'staff'],
          formats: ['pdf', 'excel']
        },
        {
          type: 'customer-analytics',
          name: 'Customer Analytics Report',
          description: 'Customer behavior, segmentation, and satisfaction analysis',
          requiredRole: ['admin', 'manager', 'staff'],
          formats: ['pdf', 'excel']
        },
        {
          type: 'financial-summary',
          name: 'Financial Summary Report',
          description: 'Detailed financial breakdown including revenue, taxes, and payment methods',
          requiredRole: ['admin', 'manager', 'superadmin'],
          formats: ['pdf', 'excel']
        },
        {
          type: 'staff-performance',
          name: 'Staff Performance Report',
          description: 'Staff productivity and performance analysis',
          requiredRole: ['admin', 'manager', 'superadmin'],
          formats: ['pdf', 'excel']
        },
        {
          type: 'branch-performance',
          name: 'Branch Performance Report',
          description: 'Comparative analysis of branch performance and metrics',
          requiredRole: ['admin', 'manager', 'superadmin'],
          formats: ['pdf', 'excel']
        }
      ];

      // Filter reports based on user role
      const availableReports = reportTypes.filter(report =>
        report.requiredRole.includes(req.user!.role)
      );

      res.json({
        success: true,
        reports: availableReports
      });

    } catch (error) {
      console.error('List report types error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to list report types'
      });
    }
  };

  /**
   * Get User's Branches for Report Filtering
   */
  static getUserBranches = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      let branches;

      if (req.user.role === 'superadmin') {
        // Superadmin can see all branches across tenants
        branches = await Branch.find({ isActive: true })
          .select('_id name code tenantId')
          .populate('tenantId', 'name')
          .sort({ name: 1 });
      } else if (['admin', 'manager'].includes(req.user.role)) {
        // Admin and manager can see all branches in their tenant
        branches = await Branch.find({
          tenantId: req.user.tenantId,
          isActive: true
        })
        .select('_id name code')
        .sort({ name: 1 });
      } else {
        // Staff can only see their assigned branches
        const user = await mongoose.model('User').findById(req.user._id).populate('assignedBranches');
        branches = user?.assignedBranches || [];
      }

      res.json({
        success: true,
        branches
      });

    } catch (error) {
      console.error('Get user branches error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get user branches'
      });
    }
  };

  /**
   * Cleanup Expired Reports (Utility endpoint)
   */
  static cleanupExpiredReports = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user || req.user.role !== 'superadmin') {
        return res.status(403).json({
          success: false,
          error: 'Superadmin access required'
        });
      }

      await ReportService.cleanupExpiredReports();

      res.json({
        success: true,
        message: 'Expired reports cleaned up successfully'
      });

    } catch (error) {
      console.error('Cleanup expired reports error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to cleanup expired reports'
      });
    }
  };

  /**
   * Email Report with Attachment
   */
  static emailReport = [
    // Validation rules
    body('reportType').isIn(['sales', 'menu-performance', 'customer-analytics', 'financial-summary', 'staff-performance', 'branch-performance'])
      .withMessage('Invalid report type'),
    body('startDate').isISO8601().withMessage('Start date must be a valid ISO date'),
    body('endDate').isISO8601().withMessage('End date must be a valid ISO date'),
    body('format').isIn(['pdf', 'excel', 'csv']).withMessage('Format must be pdf, excel, or csv'),
    body('recipients').isArray({ min: 1 }).withMessage('At least one recipient email is required'),
    body('recipients.*').isEmail().withMessage('Invalid email address'),
    body('subject').optional().isLength({ min: 1, max: 200 }).withMessage('Subject must be 1-200 characters'),
    body('message').optional().isLength({ max: 1000 }).withMessage('Message must be less than 1000 characters'),
    body('branchId').optional().isMongoId().withMessage('Branch ID must be a valid MongoDB ID'),

    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({
            success: false,
            error: 'Validation failed',
            details: errors.array()
          });
        }

        if (!req.user) {
          return res.status(401).json({
            success: false,
            error: 'Authentication required'
          });
        }

        const { reportType, startDate, endDate, format, recipients, subject, message, branchId } = req.body;

        // Validate date range
        const startDateObj = new Date(startDate);
        const endDateObj = new Date(endDate);
        
        if (startDateObj >= endDateObj) {
          return res.status(400).json({
            success: false,
            error: 'Start date must be before end date'
          });
        }

        // Check role permissions for report type
        const rolePermissions = {
          'financial-summary': ['admin', 'superadmin', 'manager'],
          'staff-performance': ['admin', 'superadmin', 'manager'],
          'branch-performance': ['admin', 'superadmin', 'manager']
        };

        if (rolePermissions[reportType] && !rolePermissions[reportType].includes(req.user.role)) {
          return res.status(403).json({
            success: false,
            error: `Insufficient permissions for ${reportType} reports`
          });
        }

        // Build filters based on report type
        const filters: ReportFilters = {
          tenantId: req.user.tenantId,
          startDate: startDateObj,
          endDate: endDateObj,
          branchId,
          period: req.body.period || 'daily'
        };

        // Build config
        const config: ReportConfig = {
          format: format === 'csv' ? 'excel' : format, // CSV is handled as Excel with CSV export
          fileName: req.body.fileName,
          includeCharts: req.body.includeCharts || false,
          includeDetails: req.body.includeDetails !== false,
          timezone: req.body.timezone || 'UTC',
          currency: req.body.currency || 'USD'
        };

        // Get tenant info
        const tenant = await Tenant.findById(req.user.tenantId);
        if (!tenant) {
          return res.status(404).json({
            success: false,
            error: 'Tenant not found'
          });
        }

        // Get branch info if specified
        let branchName: string | undefined;
        if (branchId) {
          const branch = await Branch.findById(branchId);
          branchName = branch?.name;
        }

        // Generate analytics data based on report type
        let analyticsData: any;
        let reportTitle: string;
        
        switch (reportType) {
          case 'sales':
            analyticsData = await AnalyticsService.generateSalesAnalytics(filters);
            reportTitle = 'Sales Performance Report';
            break;
          case 'menu-performance':
            analyticsData = await AnalyticsService.generateMenuPerformanceAnalytics(filters);
            reportTitle = 'Menu Performance Report';
            break;
          case 'customer-analytics':
            analyticsData = await AnalyticsService.generateCustomerAnalytics(filters);
            reportTitle = 'Customer Analytics Report';
            break;
          case 'financial-summary':
            analyticsData = await AnalyticsService.generateFinancialSummary(filters);
            reportTitle = 'Financial Summary Report';
            break;
          case 'staff-performance':
            analyticsData = await AnalyticsService.generateStaffPerformance(filters);
            reportTitle = 'Staff Performance Report';
            break;
          case 'branch-performance':
            analyticsData = await AnalyticsService.generateBranchPerformance(filters);
            reportTitle = 'Branch Performance Report';
            break;
          default:
            return res.status(400).json({
              success: false,
              error: 'Invalid report type'
            });
        }

        // Prepare template context
        const context: Omit<ReportTemplateContext, 'data' | 'config'> = {
          title: reportTitle,
          subtitle: `${reportTitle} from ${startDateObj.toLocaleDateString()} to ${endDateObj.toLocaleDateString()}`,
          companyInfo: {
            name: tenant.name,
            logo: tenant.logo,
            address: tenant.address,
            phone: tenant.phone,
            email: tenant.email
          },
          generatedBy: {
            userId: req.user._id,
            userName: `${req.user.firstName} ${req.user.lastName}`,
            userRole: req.user.role
          },
          generatedAt: new Date(),
          formattedGeneratedAt: new Date().toLocaleString()
        };

        // Generate report file
        const result = await ReportService.generateReport(reportType, analyticsData, config, context);

        if (!result.success) {
          return res.status(500).json({
            success: false,
            error: 'Failed to generate report'
          });
        }

        // Extract key metrics for email template
        const keyMetrics = ReportController.extractKeyMetrics(reportType, analyticsData);

        // Determine content type based on format
        const contentType = format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        
        // Prepare email data for each recipient
        const emailPromises = recipients.map(async (email: string) => {
          const emailData: EmailData = {
            tenantId: new mongoose.Types.ObjectId(req.user!.tenantId),
            to: email,
            toName: email.split('@')[0], // Use email prefix as name fallback
            subject: subject || `${reportTitle} - ${tenant.name}`,
            templateSlug: 'report-delivery',
            templateData: {
              recipientName: email.split('@')[0],
              companyName: tenant.name,
              reportTitle,
              reportType: reportType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
              dateRange: `${startDateObj.toLocaleDateString()} to ${endDateObj.toLocaleDateString()}`,
              format: format.toUpperCase(),
              branchName,
              keyMetrics,
              customMessage: message,
              generatedBy: `${req.user!.firstName} ${req.user!.lastName}`,
              generatedDate: new Date().toLocaleDateString(),
              companyAddress: tenant.address,
              companyPhone: tenant.phone,
              companyEmail: tenant.email
            },
            category: 'system',
            type: 'report-delivery',
            priority: 'normal',
            attachments: [{
              filename: result.fileName!,
              path: result.filePath!,
              contentType
            }]
          };

          return emailService.sendEmail(emailData);
        });

        // Send emails to all recipients
        await Promise.all(emailPromises);

        // Clean up the temporary report file after a delay (optional)
        setTimeout(() => {
          try {
            if (fs.existsSync(result.filePath!)) {
              fs.unlinkSync(result.filePath!);
            }
          } catch (error) {
            console.warn('Failed to cleanup report file:', error);
          }
        }, 300000); // Delete after 5 minutes

        res.json({
          success: true,
          message: `Report emailed successfully to ${recipients.length} recipient(s)`,
          reportId: result.reportId,
          recipients: recipients.length,
          reportType: reportTitle
        });

      } catch (error) {
        console.error('Email report error:', error);
        
        if (error instanceof ReportValidationError) {
          return res.status(400).json({
            success: false,
            error: error.message
          });
        }
        
        if (error instanceof ReportGenerationError) {
          return res.status(500).json({
            success: false,
            error: error.message
          });
        }

        res.status(500).json({
          success: false,
          error: 'Failed to email report'
        });
      }
    }
  ];

  /**
   * Extract Key Metrics for Email Template
   */
  private static extractKeyMetrics(reportType: string, analyticsData: any): Array<{label: string, value: string}> {
    const metrics: Array<{label: string, value: string}> = [];

    try {
      switch (reportType) {
        case 'sales':
          if (analyticsData.summary) {
            metrics.push({ label: 'Total Revenue', value: analyticsData.summary.totalRevenue?.toLocaleString() || '0' });
            metrics.push({ label: 'Total Orders', value: analyticsData.summary.totalOrders?.toString() || '0' });
            metrics.push({ label: 'Avg Order Value', value: analyticsData.summary.averageOrderValue?.toLocaleString() || '0' });
          }
          break;
        case 'menu-performance':
          if (analyticsData.topItems?.length > 0) {
            metrics.push({ label: 'Top Item', value: analyticsData.topItems[0].name || 'N/A' });
            metrics.push({ label: 'Items Sold', value: analyticsData.totalItemsSold?.toString() || '0' });
            metrics.push({ label: 'Categories', value: analyticsData.categoryCount?.toString() || '0' });
          }
          break;
        case 'customer-analytics':
          if (analyticsData.summary) {
            metrics.push({ label: 'Total Customers', value: analyticsData.summary.totalCustomers?.toString() || '0' });
            metrics.push({ label: 'New Customers', value: analyticsData.summary.newCustomers?.toString() || '0' });
            metrics.push({ label: 'Return Rate', value: `${analyticsData.summary.returnRate || 0}%` });
          }
          break;
        case 'financial-summary':
          if (analyticsData.summary) {
            metrics.push({ label: 'Gross Revenue', value: analyticsData.summary.grossRevenue?.toLocaleString() || '0' });
            metrics.push({ label: 'Net Revenue', value: analyticsData.summary.netRevenue?.toLocaleString() || '0' });
            metrics.push({ label: 'Total Tax', value: analyticsData.summary.totalTax?.toLocaleString() || '0' });
          }
          break;
        case 'staff-performance':
          if (analyticsData.summary) {
            metrics.push({ label: 'Total Staff', value: analyticsData.summary.totalStaff?.toString() || '0' });
            metrics.push({ label: 'Avg Performance', value: `${analyticsData.summary.averagePerformance || 0}%` });
            metrics.push({ label: 'Total Hours', value: analyticsData.summary.totalHours?.toString() || '0' });
          }
          break;
        case 'branch-performance':
          if (analyticsData.branches?.length > 0) {
            metrics.push({ label: 'Top Branch', value: analyticsData.branches[0].name || 'N/A' });
            metrics.push({ label: 'Total Branches', value: analyticsData.branches.length.toString() });
            metrics.push({ label: 'Avg Performance', value: `${analyticsData.averagePerformance || 0}%` });
          }
          break;
      }
    } catch (error) {
      console.warn('Failed to extract key metrics:', error);
    }

    return metrics;
  }

  /**
   * Handle Report Generation Errors
   */
  private static handleReportError(error: any, res: Response) {
    if (error instanceof ReportValidationError) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    
    if (error instanceof ReportGenerationError) {
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }

    if (error instanceof ReportError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: 'An unexpected error occurred while generating the report'
    });
  }
}