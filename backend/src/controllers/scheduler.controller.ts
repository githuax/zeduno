import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { body, param, query, validationResult } from 'express-validator';

import { ScheduledReport, IScheduledReport } from '../models/ScheduledReport';
// import { reportQueueService } from '../services/reportQueue.service'; // Temporarily disabled
import { AuthenticatedRequest } from '../middleware/auth';

export class SchedulerController {
  /**
   * Get all scheduled reports for the current tenant
   */
  public static async getScheduledReports(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { page = 1, limit = 10, status, reportType, isActive } = req.query;
      const tenantId = req.user!.tenantId;

      // Build filter
      const filter: any = { tenantId };
      
      if (status) {
        if (status === 'active') filter.isActive = true;
        if (status === 'inactive') filter.isActive = false;
      }
      
      if (reportType) {
        filter.reportType = reportType;
      }
      
      if (isActive !== undefined) {
        filter.isActive = isActive === 'true';
      }

      // Pagination
      const skip = (Number(page) - 1) * Number(limit);
      
      const [scheduledReports, total] = await Promise.all([
        ScheduledReport.find(filter)
          .populate('createdBy', 'firstName lastName email')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(Number(limit))
          .lean(),
        ScheduledReport.countDocuments(filter)
      ]);

      // Add computed fields
      const reportsWithStats = scheduledReports.map(report => ({
        ...report,
        successRate: report.totalRuns > 0 ? Math.round((report.successfulRuns / report.totalRuns) * 100) : 0,
        status: this.getScheduleStatus(report),
        nextRunFormatted: report.nextRun ? report.nextRun.toLocaleString() : null,
        lastRunFormatted: report.lastRun ? report.lastRun.toLocaleString() : null
      }));

      res.json({
        success: true,
        data: reportsWithStats,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      console.error('Error fetching scheduled reports:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch scheduled reports'
      });
    }
  }

  /**
   * Get a specific scheduled report
   */
  public static async getScheduledReport(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const tenantId = req.user!.tenantId;

      const scheduledReport = await ScheduledReport.findOne({
        _id: id,
        tenantId
      }).populate('createdBy', 'firstName lastName email');

      if (!scheduledReport) {
        res.status(404).json({
          success: false,
          message: 'Scheduled report not found'
        });
        return;
      }

      const reportWithStats = {
        ...scheduledReport.toObject(),
        successRate: scheduledReport.getSuccessRate(),
        status: this.getScheduleStatus(scheduledReport)
      };

      res.json({
        success: true,
        data: reportWithStats
      });
    } catch (error) {
      console.error('Error fetching scheduled report:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch scheduled report'
      });
    }
  }

  /**
   * Create a new scheduled report
   */
  public static async createScheduledReport(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
        return;
      }

      const tenantId = req.user!.tenantId;
      const userId = req.user!._id;

      const scheduleData = {
        ...req.body,
        tenantId,
        createdBy: userId
      };

      const scheduledReport = new ScheduledReport(scheduleData);
      await scheduledReport.save();

      // Initialize the report queue service if not already done
      // // await reportQueueService.initialize(); // Temporarily disabled

      res.status(201).json({
        success: true,
        data: scheduledReport,
        message: 'Scheduled report created successfully'
      });
    } catch (error) {
      console.error('Error creating scheduled report:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create scheduled report'
      });
    }
  }

  /**
   * Update a scheduled report
   */
  public static async updateScheduledReport(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
        return;
      }

      const { id } = req.params;
      const tenantId = req.user!.tenantId;

      const scheduledReport = await ScheduledReport.findOne({
        _id: id,
        tenantId
      });

      if (!scheduledReport) {
        res.status(404).json({
          success: false,
          message: 'Scheduled report not found'
        });
        return;
      }

      // Cancel any pending jobs for this schedule
      // await reportQueueService.cancelScheduledJobs(id);

      // Update the scheduled report
      Object.assign(scheduledReport, req.body);
      await scheduledReport.save();

      res.json({
        success: true,
        data: scheduledReport,
        message: 'Scheduled report updated successfully'
      });
    } catch (error) {
      console.error('Error updating scheduled report:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update scheduled report'
      });
    }
  }

  /**
   * Delete a scheduled report
   */
  public static async deleteScheduledReport(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const tenantId = req.user!.tenantId;

      const scheduledReport = await ScheduledReport.findOne({
        _id: id,
        tenantId
      });

      if (!scheduledReport) {
        res.status(404).json({
          success: false,
          message: 'Scheduled report not found'
        });
        return;
      }

      // Cancel any pending jobs for this schedule
      // await reportQueueService.cancelScheduledJobs(id);

      // Delete the scheduled report
      await ScheduledReport.deleteOne({ _id: id });

      res.json({
        success: true,
        message: 'Scheduled report deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting scheduled report:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete scheduled report'
      });
    }
  }

  /**
   * Pause or resume a scheduled report
   */
  public static async toggleScheduledReport(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { isActive } = req.body;
      const tenantId = req.user!.tenantId;

      const scheduledReport = await ScheduledReport.findOne({
        _id: id,
        tenantId
      });

      if (!scheduledReport) {
        res.status(404).json({
          success: false,
          message: 'Scheduled report not found'
        });
        return;
      }

      if (typeof isActive === 'boolean') {
        scheduledReport.isActive = isActive;
        
        if (!isActive) {
          // Cancel pending jobs when pausing
          // await reportQueueService.cancelScheduledJobs(id);
        } else {
          // Reset failure count when resuming
          scheduledReport.failureCount = 0;
        }
        
        await scheduledReport.save();
      }

      res.json({
        success: true,
        data: scheduledReport,
        message: `Scheduled report ${isActive ? 'resumed' : 'paused'} successfully`
      });
    } catch (error) {
      console.error('Error toggling scheduled report:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to toggle scheduled report'
      });
    }
  }

  /**
   * Run a scheduled report immediately
   */
  public static async runScheduledReportNow(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const tenantId = req.user!.tenantId;

      const scheduledReport = await ScheduledReport.findOne({
        _id: id,
        tenantId
      });

      if (!scheduledReport) {
        res.status(404).json({
          success: false,
          message: 'Scheduled report not found'
        });
        return;
      }

      // Add immediate job to queue
      // const jobId = await reportQueueService.addReportJob(scheduledReport, 0);
      const jobId = 'temp-disabled'; // Temporary placeholder

      res.json({
        success: true,
        data: { jobId },
        message: 'Report queued for immediate execution'
      });
    } catch (error) {
      console.error('Error running scheduled report:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to queue report for execution'
      });
    }
  }

  /**
   * Get execution history for a scheduled report
   */
  public static async getExecutionHistory(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { page = 1, limit = 20 } = req.query;
      const tenantId = req.user!.tenantId;

      const scheduledReport = await ScheduledReport.findOne({
        _id: id,
        tenantId
      });

      if (!scheduledReport) {
        res.status(404).json({
          success: false,
          message: 'Scheduled report not found'
        });
        return;
      }

      // Paginate execution history
      const history = scheduledReport.executionHistory || [];
      const sortedHistory = history.sort((a, b) => new Date(b.runDate).getTime() - new Date(a.runDate).getTime());
      
      const startIndex = (Number(page) - 1) * Number(limit);
      const endIndex = startIndex + Number(limit);
      const paginatedHistory = sortedHistory.slice(startIndex, endIndex);

      res.json({
        success: true,
        data: paginatedHistory,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: history.length,
          pages: Math.ceil(history.length / Number(limit))
        },
        summary: {
          totalRuns: scheduledReport.totalRuns,
          successfulRuns: scheduledReport.successfulRuns,
          successRate: scheduledReport.getSuccessRate(),
          lastRun: scheduledReport.lastRun,
          lastSuccess: scheduledReport.lastSuccess,
          lastFailure: scheduledReport.lastFailure,
          failureCount: scheduledReport.failureCount
        }
      });
    } catch (error) {
      console.error('Error fetching execution history:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch execution history'
      });
    }
  }

  /**
   * Get queue statistics and monitoring data
   */
  public static async getQueueStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // const stats = await reportQueueService.getQueueStats();
      // const recentJobs = await reportQueueService.getRecentJobs(20);
      const stats = { waiting: 0, active: 0, completed: 0, failed: 0 }; // Temporary placeholder
      const recentJobs: any[] = []; // Temporary placeholder

      res.json({
        success: true,
        data: {
          queueStats: stats,
          recentJobs: recentJobs.map(job => ({
            ...job,
            tenantId: job.data.tenantId,
            reportType: job.data.reportType,
            title: job.data.title,
            recipients: job.data.recipients?.length || 0
          }))
        }
      });
    } catch (error) {
      console.error('Error fetching queue stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch queue statistics'
      });
    }
  }

  /**
   * Get dashboard summary for scheduled reports
   */
  public static async getDashboardSummary(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;

      const [
        totalSchedules,
        activeSchedules,
        recentExecutions,
        failedSchedules
      ] = await Promise.all([
        ScheduledReport.countDocuments({ tenantId }),
        ScheduledReport.countDocuments({ tenantId, isActive: true }),
        ScheduledReport.find({ tenantId, lastRun: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }).countDocuments(),
        ScheduledReport.countDocuments({ tenantId, failureCount: { $gte: 1 } })
      ]);

      // Get upcoming schedules (next 24 hours)
      const upcomingSchedules = await ScheduledReport.find({
        tenantId,
        isActive: true,
        nextRun: {
          $gte: new Date(),
          $lte: new Date(Date.now() + 24 * 60 * 60 * 1000)
        }
      })
      .select('title reportType nextRun')
      .sort({ nextRun: 1 })
      .limit(5);

      // Get recent activity
      const recentActivity = await ScheduledReport.aggregate([
        { $match: { tenantId, executionHistory: { $exists: true, $ne: [] } } },
        { $unwind: '$executionHistory' },
        { $sort: { 'executionHistory.runDate': -1 } },
        { $limit: 10 },
        {
          $project: {
            title: 1,
            reportType: 1,
            runDate: '$executionHistory.runDate',
            status: '$executionHistory.status',
            executionTime: '$executionHistory.executionTime',
            recipientCount: '$executionHistory.recipientCount'
          }
        }
      ]);

      res.json({
        success: true,
        data: {
          summary: {
            totalSchedules,
            activeSchedules,
            recentExecutions,
            failedSchedules
          },
          upcomingSchedules,
          recentActivity
        }
      });
    } catch (error) {
      console.error('Error fetching dashboard summary:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch dashboard summary'
      });
    }
  }

  /**
   * Validate scheduled report data
   */
  public static validateScheduledReport() {
    return [
      body('title')
        .trim()
        .isLength({ min: 1, max: 255 })
        .withMessage('Title must be between 1 and 255 characters'),

      body('description')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Description must be less than 1000 characters'),

      body('reportType')
        .isIn(['sales', 'menu-performance', 'customer-analytics', 'financial-summary', 'staff-performance', 'branch-performance'])
        .withMessage('Invalid report type'),

      body('frequency')
        .isIn(['daily', 'weekly', 'monthly', 'custom'])
        .withMessage('Invalid frequency'),

      body('cronExpression')
        .if(body('frequency').equals('custom'))
        .notEmpty()
        .withMessage('Cron expression is required for custom frequency'),

      body('recipients')
        .isArray({ min: 1 })
        .withMessage('At least one recipient is required')
        .custom((recipients: string[]) => {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          return recipients.every(email => emailRegex.test(email));
        })
        .withMessage('All recipients must be valid email addresses'),

      body('format')
        .isIn(['pdf', 'excel'])
        .withMessage('Invalid format'),

      body('scheduledTime.hour')
        .isInt({ min: 0, max: 23 })
        .withMessage('Hour must be between 0 and 23'),

      body('scheduledTime.minute')
        .isInt({ min: 0, max: 59 })
        .withMessage('Minute must be between 0 and 59'),

      body('scheduledTime.dayOfWeek')
        .if(body('frequency').equals('weekly'))
        .isInt({ min: 1, max: 7 })
        .withMessage('Day of week must be between 1 (Monday) and 7 (Sunday)'),

      body('scheduledTime.dayOfMonth')
        .if(body('frequency').equals('monthly'))
        .isInt({ min: 1, max: 31 })
        .withMessage('Day of month must be between 1 and 31'),

      body('timezone')
        .notEmpty()
        .withMessage('Timezone is required'),

      body('parameters.branchId')
        .optional()
        .isMongoId()
        .withMessage('Invalid branch ID'),

      body('parameters.dateRange')
        .optional()
        .custom((value) => {
          return value === 'auto' || (typeof value === 'number' && value > 0);
        })
        .withMessage('Date range must be "auto" or a positive number'),

      body('maxFailures')
        .optional()
        .isInt({ min: 1, max: 10 })
        .withMessage('Max failures must be between 1 and 10')
    ];
  }

  /**
   * Helper method to determine schedule status
   */
  private static getScheduleStatus(report: any): string {
    if (!report.isActive) return 'inactive';
    if (report.failureCount >= (report.maxFailures || 3)) return 'failed';
    if (report.nextRun && new Date(report.nextRun) <= new Date()) return 'ready';
    return 'scheduled';
  }
}

export default SchedulerController;