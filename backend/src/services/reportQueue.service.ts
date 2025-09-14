import Queue from 'bull';
import mongoose from 'mongoose';
import { CronJob } from 'cron';
import Redis from 'ioredis';

import { ScheduledReport, IScheduledReport } from '../models/ScheduledReport';
import { AnalyticsService } from './analytics.service';
import { ReportService } from './report.service';
import { emailService, EmailData } from './email.service';
import { ReportType, ReportConfig, ReportTemplateContext } from '../types/report.types';

export interface ScheduledReportJob {
  scheduledReportId: string;
  tenantId: string;
  reportType: ReportType;
  parameters: any;
  recipients: string[];
  format: 'pdf' | 'excel';
  title: string;
  generatedBy: 'scheduler';
  executionTime: Date;
  scheduleId: string;
}

export interface QueueStats {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: boolean;
}

class ReportQueueService {
  private static instance: ReportQueueService;
  private reportQueue: Queue.Queue<ScheduledReportJob>;
  private schedulerJob: CronJob | null = null;
  private redis: Redis;
  private isInitialized = false;

  private constructor() {
    // Initialize Redis connection
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0'),
      enableReadyCheck: false,
      maxRetriesPerRequest: null,
    });

    // Initialize Bull queue for scheduled reports
    this.reportQueue = new Queue('scheduled-reports', {
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        db: parseInt(process.env.REDIS_DB || '0'),
      },
      defaultJobOptions: {
        removeOnComplete: 100, // Keep last 100 completed jobs
        removeOnFail: 50, // Keep last 50 failed jobs
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 60000, // Start with 1 minute delay
        },
      },
    });

    this.setupQueueProcessors();
    this.setupQueueEvents();
  }

  public static getInstance(): ReportQueueService {
    if (!ReportQueueService.instance) {
      ReportQueueService.instance = new ReportQueueService();
    }
    return ReportQueueService.instance;
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Test Redis connection
      await this.redis.ping();
      console.log('✅ Redis connection established for ReportQueue');

      // Start the scheduler cron job (every minute to check for due reports)
      this.schedulerJob = new CronJob('0 * * * * *', async () => {
        await this.checkAndQueueDueReports();
      });
      this.schedulerJob.start();

      this.isInitialized = true;
      console.log('✅ ReportQueue service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize ReportQueue service:', error);
      throw error;
    }
  }

  private setupQueueProcessors(): void {
    // Process scheduled report generation jobs
    this.reportQueue.process('generate-report', 5, async (job) => {
      const startTime = Date.now();
      const jobData: ScheduledReportJob = job.data;
      
      console.log(`🔄 Processing scheduled report job: ${job.id} for ${jobData.reportType}`);
      
      try {
        await this.processScheduledReport(jobData);
        
        const executionTime = Date.now() - startTime;
        console.log(`✅ Completed scheduled report job: ${job.id} in ${executionTime}ms`);
        
        return {
          success: true,
          executionTime,
          reportType: jobData.reportType,
          recipientCount: jobData.recipients.length
        };
      } catch (error) {
        console.error(`❌ Failed to process scheduled report job: ${job.id}`, error);
        throw error;
      }
    });
  }

  private setupQueueEvents(): void {
    this.reportQueue.on('completed', async (job, result) => {
      const jobData: ScheduledReportJob = job.data;
      
      // Update scheduled report with success
      const scheduledReport = await ScheduledReport.findById(jobData.scheduledReportId);
      if (scheduledReport) {
        scheduledReport.addExecutionHistory(
          'success',
          undefined,
          result.reportId,
          result.executionTime,
          result.recipientCount
        );
        await scheduledReport.save();
      }
    });

    this.reportQueue.on('failed', async (job, err) => {
      const jobData: ScheduledReportJob = job.data;
      
      console.error(`❌ Scheduled report job failed: ${job.id}`, err.message);
      
      // Update scheduled report with failure
      const scheduledReport = await ScheduledReport.findById(jobData.scheduledReportId);
      if (scheduledReport) {
        scheduledReport.addExecutionHistory(
          'failure',
          err.message,
          undefined,
          Date.now() - job.timestamp
        );
        await scheduledReport.save();

        // Send failure notification to report creator
        await this.sendFailureNotification(scheduledReport, err.message);
      }
    });

    this.reportQueue.on('stalled', (job) => {
      console.warn(`⚠️ Scheduled report job stalled: ${job.id}`);
    });

    this.reportQueue.on('error', (error) => {
      console.error('❌ Report queue error:', error);
    });
  }

  /**
   * Check for scheduled reports that are due and queue them for processing
   */
  private async checkAndQueueDueReports(): Promise<void> {
    try {
      const dueReports = await ScheduledReport.findReadyForExecution();
      
      for (const scheduledReport of dueReports) {
        await this.queueScheduledReport(scheduledReport);
      }

      if (dueReports.length > 0) {
        console.log(`📊 Queued ${dueReports.length} scheduled reports for processing`);
      }
    } catch (error) {
      console.error('❌ Error checking for due reports:', error);
    }
  }

  /**
   * Queue a scheduled report for processing
   */
  private async queueScheduledReport(scheduledReport: IScheduledReport): Promise<void> {
    const jobData: ScheduledReportJob = {
      scheduledReportId: scheduledReport._id.toString(),
      tenantId: scheduledReport.tenantId.toString(),
      reportType: scheduledReport.reportType,
      parameters: scheduledReport.parameters,
      recipients: scheduledReport.recipients,
      format: scheduledReport.format,
      title: scheduledReport.title,
      generatedBy: 'scheduler',
      executionTime: new Date(),
      scheduleId: scheduledReport._id.toString()
    };

    // Add job to queue with priority based on report type
    const priority = this.getReportPriority(scheduledReport.reportType);
    
    await this.reportQueue.add('generate-report', jobData, {
      priority,
      delay: 0,
      attempts: 3,
      backoff: { type: 'exponential', delay: 60000 },
      jobId: `scheduled_${scheduledReport._id}_${Date.now()}`,
    });

    // Update next run time
    scheduledReport.nextRun = scheduledReport.calculateNextRun();
    await scheduledReport.save();
  }

  /**
   * Process a scheduled report generation job
   */
  private async processScheduledReport(jobData: ScheduledReportJob): Promise<any> {
    const { tenantId, reportType, parameters, recipients, format, title } = jobData;
    
    try {
      // Calculate date range for auto mode
      const dateRange = this.calculateDateRange(parameters.dateRange);
      
      // Get report data from analytics service
      const analyticsService = AnalyticsService.getInstance();
      const reportData = await this.getReportData(
        analyticsService,
        reportType,
        new mongoose.Types.ObjectId(tenantId),
        dateRange,
        parameters
      );

      // Generate report using report service
      const reportService = ReportService.getInstance();
      const reportConfig: ReportConfig = {
        format,
        fileName: `${reportType}-${new Date().toISOString().split('T')[0]}.${format}`,
      };

      const templateContext: Omit<ReportTemplateContext, 'data' | 'config'> = {
        title,
        generatedAt: new Date(),
        formattedGeneratedAt: new Date().toLocaleString(),
        generatedBy: {
          userId: 'system',
          userName: 'System Scheduler',
          userRole: 'system'
        },
        companyInfo: {
          name: 'Restaurant Management',
          address: '123 Business Street',
          phone: '+1234567890',
          email: 'info@restaurant.com'
        }
      };

      const reportResult = await reportService.generateReport(
        reportType,
        reportData,
        reportConfig,
        templateContext
      );

      if (!reportResult.success) {
        throw new Error('Report generation failed');
      }

      // Send report via email to all recipients
      await this.emailReportToRecipients(
        recipients,
        reportResult,
        title,
        new mongoose.Types.ObjectId(tenantId),
        dateRange
      );

      return {
        success: true,
        reportId: reportResult.reportId,
        fileName: reportResult.fileName,
        recipientCount: recipients.length
      };

    } catch (error) {
      console.error('❌ Error processing scheduled report:', error);
      throw error;
    }
  }

  /**
   * Get report data based on report type
   */
  private async getReportData(
    analyticsService: AnalyticsService,
    reportType: ReportType,
    tenantId: mongoose.Types.ObjectId,
    dateRange: { startDate: Date; endDate: Date },
    parameters: any
  ): Promise<any> {
    const { startDate, endDate } = dateRange;
    const filtersBase = {
      tenantId: tenantId.toString(),
      startDate,
      endDate,
      ...(parameters?.branchId ? { branchId: parameters.branchId as string } : {}),
      ...(parameters?.period ? { period: parameters.period as 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' } : {}),
    };

    switch (reportType) {
      case 'sales':
        return await analyticsService.generateSalesAnalytics(filtersBase as any);

      case 'menu-performance':
        return await analyticsService.generateMenuPerformanceAnalytics(filtersBase as any);

      case 'customer-analytics':
        return await analyticsService.generateCustomerAnalytics(filtersBase as any);

      case 'financial-summary':
        return await analyticsService.generateFinancialSummary(filtersBase as any);

      case 'staff-performance':
        return await analyticsService.generateStaffPerformance(filtersBase as any);

      case 'branch-performance':
        return await analyticsService.generateBranchPerformance(filtersBase as any);

      default:
        throw new Error(`Unknown report type: ${reportType}`);
    }
  }

  /**
   * Calculate date range for auto mode based on frequency
   */
  private calculateDateRange(dateRange: 'auto' | number): { startDate: Date; endDate: Date } {
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999); // End of current day
    
    let startDate: Date;
    
    if (dateRange === 'auto') {
      // Auto mode: yesterday for daily, last week for weekly, etc.
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 1); // Yesterday
      startDate.setHours(0, 0, 0, 0);
      
      endDate.setDate(endDate.getDate() - 1); // Yesterday
    } else {
      // Specific number of days back
      startDate = new Date();
      startDate.setDate(startDate.getDate() - dateRange);
      startDate.setHours(0, 0, 0, 0);
    }
    
    return { startDate, endDate };
  }

  /**
   * Email report to all recipients
   */
  private async emailReportToRecipients(
    recipients: string[],
    reportResult: any,
    title: string,
    tenantId: mongoose.Types.ObjectId,
    dateRange: { startDate: Date; endDate: Date }
  ): Promise<void> {
    const { fileName, filePath } = reportResult;
    const { startDate, endDate } = dateRange;

    for (const recipientEmail of recipients) {
      const emailData: EmailData = {
        tenantId,
        to: recipientEmail,
        subject: `Scheduled Report: ${title}`,
        templateSlug: 'scheduled-report',
        templateData: {
          reportTitle: title,
          reportPeriod: `${startDate.toDateString()} - ${endDate.toDateString()}`,
          generatedAt: new Date().toLocaleString(),
          recipientEmail
        },
        category: 'system',
        type: 'scheduled-report',
        priority: 'normal',
        attachments: [{
          filename: fileName,
          path: filePath
        }]
      };

      try {
        await emailService.sendEmail(emailData);
      } catch (error) {
        console.error(`❌ Failed to send report to ${recipientEmail}:`, error);
        // Continue with other recipients
      }
    }
  }

  /**
   * Send failure notification to report creator
   */
  private async sendFailureNotification(
    scheduledReport: IScheduledReport,
    errorMessage: string
  ): Promise<void> {
    try {
      // Get creator email (assuming User model has email field)
      const creator = await mongoose.model('User').findById(scheduledReport.createdBy).select('email firstName lastName');
      
      if (creator) {
        const emailData: EmailData = {
          tenantId: scheduledReport.tenantId,
          to: creator.email,
          subject: `Scheduled Report Failed: ${scheduledReport.title}`,
          templateSlug: 'report-failure',
          templateData: {
            reportTitle: scheduledReport.title,
            errorMessage,
            failureCount: scheduledReport.failureCount,
            maxFailures: scheduledReport.maxFailures,
            scheduleId: scheduledReport._id.toString(),
            userName: `${creator.firstName} ${creator.lastName}`,
            willDisable: scheduledReport.failureCount >= scheduledReport.maxFailures
          },
          category: 'system',
          type: 'report-failure',
          priority: 'high'
        };

        await emailService.sendEmail(emailData);
      }
    } catch (error) {
      console.error('❌ Failed to send failure notification:', error);
    }
  }

  /**
   * Get report priority for queue processing
   */
  private getReportPriority(reportType: ReportType): number {
    const priorities = {
      'financial-summary': 10,
      'sales': 8,
      'branch-performance': 6,
      'staff-performance': 4,
      'customer-analytics': 2,
      'menu-performance': 1
    };
    
    return priorities[reportType] || 0;
  }

  /**
   * Public API methods
   */

  /**
   * Add a one-time report generation job
   */
  public async addReportJob(
    scheduledReport: IScheduledReport,
    delay: number = 0
  ): Promise<string> {
    const jobData: ScheduledReportJob = {
      scheduledReportId: scheduledReport._id.toString(),
      tenantId: scheduledReport.tenantId.toString(),
      reportType: scheduledReport.reportType,
      parameters: scheduledReport.parameters,
      recipients: scheduledReport.recipients,
      format: scheduledReport.format,
      title: scheduledReport.title,
      generatedBy: 'scheduler',
      executionTime: new Date(Date.now() + delay),
      scheduleId: scheduledReport._id.toString()
    };

    const job = await this.reportQueue.add('generate-report', jobData, {
      delay,
      priority: this.getReportPriority(scheduledReport.reportType),
      jobId: `manual_${scheduledReport._id}_${Date.now()}`,
    });

    return job.id?.toString() || 'unknown';
  }

  /**
   * Cancel pending jobs for a scheduled report
   */
  public async cancelScheduledJobs(scheduledReportId: string): Promise<void> {
    const jobs = await this.reportQueue.getJobs(['waiting', 'delayed']);
    
    for (const job of jobs) {
      if (job.data.scheduledReportId === scheduledReportId) {
        await job.remove();
      }
    }
  }

  /**
   * Get queue statistics
   */
  public async getQueueStats(): Promise<QueueStats> {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.reportQueue.getWaiting(),
      this.reportQueue.getActive(),
      this.reportQueue.getCompleted(),
      this.reportQueue.getFailed(),
      this.reportQueue.getDelayed()
    ]);

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
      delayed: delayed.length,
      paused: await this.reportQueue.isPaused()
    };
  }

  /**
   * Get recent jobs for monitoring
   */
  public async getRecentJobs(limit: number = 50): Promise<any[]> {
    const jobs = await this.reportQueue.getJobs(['completed', 'failed', 'active', 'waiting'], 0, limit);
    
    return jobs.map(job => ({
      id: job.id,
      data: job.data,
      status: job.finishedOn ? 'completed' : job.failedReason ? 'failed' : 'active',
      createdAt: new Date(job.timestamp),
      finishedAt: job.finishedOn ? new Date(job.finishedOn) : null,
      error: job.failedReason,
      progress: job.progress()
    }));
  }

  /**
   * Pause/resume queue processing
   */
  public async pauseQueue(): Promise<void> {
    await this.reportQueue.pause();
  }

  public async resumeQueue(): Promise<void> {
    await this.reportQueue.resume();
  }

  /**
   * Clean up completed and failed jobs
   */
  public async cleanQueue(): Promise<void> {
    await this.reportQueue.clean(24 * 60 * 60 * 1000, 'completed'); // Clean completed jobs older than 24h
    await this.reportQueue.clean(7 * 24 * 60 * 60 * 1000, 'failed'); // Clean failed jobs older than 7 days
  }

  /**
   * Shutdown the service gracefully
   */
  public async shutdown(): Promise<void> {
    console.log('🛑 Shutting down ReportQueue service...');
    
    if (this.schedulerJob) {
      this.schedulerJob.stop();
    }
    
    await this.reportQueue.close();
    await this.redis.disconnect();
    
    console.log('✅ ReportQueue service shutdown complete');
  }
}

export const reportQueueService = ReportQueueService.getInstance();
