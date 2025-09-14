import { Request, Response } from 'express';
import { validationResult, body, param, query } from 'express-validator';
import mongoose from 'mongoose';

import { EmailConfig, IEmailConfig } from '../models/EmailConfig';
import { EmailLog, IEmailLog } from '../models/EmailLog';
import { EmailTemplate, IEmailTemplate } from '../models/EmailTemplate';
import { emailService, EmailData, BulkEmailData } from '../services/email.service';

export class EmailController {
  // Email Configuration endpoints
  public async createEmailConfig(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ success: false, errors: errors.array() });
        return;
      }

      const { tenantId } = req.params;
      const configData = req.body;

      // Check if config already exists
      const existingConfig = await EmailConfig.findOne({ tenantId });
      if (existingConfig) {
        res.status(409).json({
          success: false,
          message: 'Email configuration already exists for this tenant'
        });
        return;
      }

      const emailConfig = new EmailConfig({
        tenantId,
        ...configData
      });

      await emailConfig.save();

      // Remove sensitive data before sending response
      const response = emailConfig.toObject();
      if (response.smtpConfig?.auth) {
        response.smtpConfig.auth.pass = '***';
      }
      if (response.sendgridConfig?.apiKey) {
        response.sendgridConfig.apiKey = '***';
      }

      res.status(201).json({
        success: true,
        data: response,
        message: 'Email configuration created successfully'
      });
    } catch (error) {
      console.error('Error creating email configuration:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create email configuration'
      });
    }
  }

  public async getEmailConfig(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = req.params;

      const emailConfig = await EmailConfig.findOne({ tenantId }).lean();
      if (!emailConfig) {
        res.status(404).json({
          success: false,
          message: 'Email configuration not found'
        });
        return;
      }

      // Remove sensitive data
      if (emailConfig.smtpConfig?.auth) {
        emailConfig.smtpConfig.auth.pass = '***';
      }
      if (emailConfig.sendgridConfig?.apiKey) {
        emailConfig.sendgridConfig.apiKey = '***';
      }

      res.json({
        success: true,
        data: emailConfig
      });
    } catch (error) {
      console.error('Error getting email configuration:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get email configuration'
      });
    }
  }

  public async updateEmailConfig(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ success: false, errors: errors.array() });
        return;
      }

      const { tenantId } = req.params;
      const updates = req.body;

      const emailConfig = await EmailConfig.findOneAndUpdate(
        { tenantId },
        { ...updates, updatedAt: new Date() },
        { new: true, runValidators: true }
      );

      if (!emailConfig) {
        res.status(404).json({
          success: false,
          message: 'Email configuration not found'
        });
        return;
      }

      // Remove sensitive data
      const response = emailConfig.toObject();
      if (response.smtpConfig?.auth) {
        response.smtpConfig.auth.pass = '***';
      }
      if (response.sendgridConfig?.apiKey) {
        response.sendgridConfig.apiKey = '***';
      }

      res.json({
        success: true,
        data: response,
        message: 'Email configuration updated successfully'
      });
    } catch (error) {
      console.error('Error updating email configuration:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update email configuration'
      });
    }
  }

  // Email Template endpoints
  public async createEmailTemplate(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ success: false, errors: errors.array() });
        return;
      }

      const { tenantId } = req.params;
      const templateData = req.body;

      const emailTemplate = new EmailTemplate({
        tenantId,
        createdBy: (req as any).user?.id,
        ...templateData
      });

      await emailTemplate.save();

      res.status(201).json({
        success: true,
        data: emailTemplate,
        message: 'Email template created successfully'
      });
    } catch (error) {
      console.error('Error creating email template:', error);
      if (error instanceof mongoose.Error.ValidationError) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: Object.values(error.errors).map(err => err.message)
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to create email template'
        });
      }
    }
  }

  public async getEmailTemplates(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = req.params;
      const { 
        category, 
        type, 
        isActive = 'true', 
        page = '1', 
        limit = '20',
        search 
      } = req.query;

      const filter: any = {
        $or: [
          { tenantId },
          { isDefault: true }
        ]
      };

      if (category) filter.category = category;
      if (type) filter.type = type;
      if (isActive !== 'all') filter.isActive = isActive === 'true';
      if (search) {
        filter.$and = [
          filter.$or ? { $or: filter.$or } : {},
          {
            $or: [
              { name: { $regex: search, $options: 'i' } },
              { subject: { $regex: search, $options: 'i' } }
            ]
          }
        ];
      }

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      const [templates, totalCount] = await Promise.all([
        EmailTemplate.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limitNum)
          .lean(),
        EmailTemplate.countDocuments(filter)
      ]);

      res.json({
        success: true,
        data: {
          templates,
          pagination: {
            currentPage: pageNum,
            totalPages: Math.ceil(totalCount / limitNum),
            totalItems: totalCount,
            itemsPerPage: limitNum
          }
        }
      });
    } catch (error) {
      console.error('Error getting email templates:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get email templates'
      });
    }
  }

  public async getEmailTemplate(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId, templateId } = req.params;

      const emailTemplate = await EmailTemplate.findOne({
        _id: templateId,
        $or: [
          { tenantId },
          { isDefault: true }
        ]
      }).lean();

      if (!emailTemplate) {
        res.status(404).json({
          success: false,
          message: 'Email template not found'
        });
        return;
      }

      res.json({
        success: true,
        data: emailTemplate
      });
    } catch (error) {
      console.error('Error getting email template:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get email template'
      });
    }
  }

  public async updateEmailTemplate(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ success: false, errors: errors.array() });
        return;
      }

      const { tenantId, templateId } = req.params;
      const updates = req.body;

      // Can only update templates that belong to the tenant (not default templates)
      const emailTemplate = await EmailTemplate.findOneAndUpdate(
        { 
          _id: templateId, 
          tenantId, 
          isDefault: { $ne: true } 
        },
        { ...updates, updatedAt: new Date() },
        { new: true, runValidators: true }
      );

      if (!emailTemplate) {
        res.status(404).json({
          success: false,
          message: 'Email template not found or cannot be modified'
        });
        return;
      }

      res.json({
        success: true,
        data: emailTemplate,
        message: 'Email template updated successfully'
      });
    } catch (error) {
      console.error('Error updating email template:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update email template'
      });
    }
  }

  public async deleteEmailTemplate(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId, templateId } = req.params;

      const emailTemplate = await EmailTemplate.findOneAndDelete({
        _id: templateId,
        tenantId,
        isDefault: { $ne: true }
      });

      if (!emailTemplate) {
        res.status(404).json({
          success: false,
          message: 'Email template not found or cannot be deleted'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Email template deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting email template:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete email template'
      });
    }
  }

  // Email sending endpoints
  public async sendEmail(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ success: false, errors: errors.array() });
        return;
      }

      const { tenantId } = req.params;
      const emailData: EmailData = {
        tenantId: new mongoose.Types.ObjectId(tenantId),
        ...req.body
      };

      const jobId = await emailService.sendEmail(emailData);

      res.json({
        success: true,
        data: { jobId },
        message: 'Email queued for sending'
      });
    } catch (error) {
      console.error('Error queuing email:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to queue email'
      });
    }
  }

  public async sendBulkEmail(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ success: false, errors: errors.array() });
        return;
      }

      const { tenantId } = req.params;
      const bulkEmailData: BulkEmailData = {
        tenantId: new mongoose.Types.ObjectId(tenantId),
        ...req.body
      };

      const jobId = await emailService.sendBulkEmail(bulkEmailData);

      res.json({
        success: true,
        data: { jobId },
        message: `Bulk email queued for ${bulkEmailData.recipients.length} recipients`
      });
    } catch (error) {
      console.error('Error queuing bulk email:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to queue bulk email'
      });
    }
  }

  // Email logs and analytics
  public async getEmailLogs(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = req.params;
      const { 
        status, 
        category, 
        startDate, 
        endDate, 
        page = '1', 
        limit = '50' 
      } = req.query;

      const filter: any = { tenantId };
      
      if (status) filter.status = status;
      if (category) filter.category = category;
      
      if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.createdAt.$gte = new Date(startDate as string);
        if (endDate) filter.createdAt.$lte = new Date(endDate as string);
      }

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      const [logs, totalCount] = await Promise.all([
        EmailLog.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limitNum)
          .populate('templateId', 'name slug')
          .lean(),
        EmailLog.countDocuments(filter)
      ]);

      res.json({
        success: true,
        data: {
          logs,
          pagination: {
            currentPage: pageNum,
            totalPages: Math.ceil(totalCount / limitNum),
            totalItems: totalCount,
            itemsPerPage: limitNum
          }
        }
      });
    } catch (error) {
      console.error('Error getting email logs:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get email logs'
      });
    }
  }

  public async getEmailStats(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = req.params;
      const { days = '30' } = req.query;

      const stats = await emailService.getEmailStats(
        new mongoose.Types.ObjectId(tenantId), 
        parseInt(days as string)
      );

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error getting email stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get email statistics'
      });
    }
  }

  public async retryFailedEmails(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = req.params;

      const retryCount = await emailService.retryFailedEmails(
        new mongoose.Types.ObjectId(tenantId)
      );

      res.json({
        success: true,
        data: { retryCount },
        message: `Retried ${retryCount} failed emails`
      });
    } catch (error) {
      console.error('Error retrying failed emails:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retry failed emails'
      });
    }
  }
}

// Validation rules
export const emailConfigValidation = [
  body('provider').isIn(['smtp', 'sendgrid', 'mailgun', 'ses']),
  body('defaultFromEmail').isEmail().normalizeEmail(),
  body('defaultFromName').isLength({ min: 1, max: 100 }).trim(),
  body('smtpConfig.host').optional().isLength({ min: 1 }),
  body('smtpConfig.port').optional().isInt({ min: 1, max: 65535 }),
  body('smtpConfig.auth.user').optional().isLength({ min: 1 }),
  body('smtpConfig.auth.pass').optional().isLength({ min: 1 })
];

export const emailTemplateValidation = [
  body('name').isLength({ min: 1, max: 200 }).trim(),
  body('subject').isLength({ min: 1, max: 500 }).trim(),
  body('htmlTemplate').isLength({ min: 1 }),
  body('category').isIn(['user', 'order', 'marketing', 'system', 'staff']),
  body('type').isLength({ min: 1, max: 50 }),
  body('variables').optional().isArray()
];

export const sendEmailValidation = [
  body('to').isEmail().normalizeEmail(),
  body('subject').optional().isLength({ min: 1, max: 500 }).trim(),
  body('templateSlug').optional().isLength({ min: 1 }),
  body('category').isIn(['user', 'order', 'marketing', 'system', 'staff']),
  body('type').isLength({ min: 1, max: 50 }),
  body('priority').optional().isIn(['low', 'normal', 'high', 'urgent'])
];

export const sendBulkEmailValidation = [
  body('recipients').isArray({ min: 1, max: 1000 }),
  body('recipients.*.email').isEmail().normalizeEmail(),
  body('templateSlug').isLength({ min: 1 }),
  body('category').isIn(['user', 'order', 'marketing', 'system', 'staff']),
  body('type').isLength({ min: 1, max: 50 }),
  body('priority').optional().isIn(['low', 'normal', 'high', 'urgent'])
];

export const emailController = new EmailController();