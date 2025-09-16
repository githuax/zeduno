import Queue from 'bull';
import * as handlebars from 'handlebars';
import mongoose from 'mongoose';
import nodemailer, { Transporter, SendMailOptions } from 'nodemailer';

import { EmailConfig, IEmailConfig } from '../models/EmailConfig';
import { EmailLog, IEmailLog } from '../models/EmailLog';
import { EmailTemplate, IEmailTemplate } from '../models/EmailTemplate';


export interface EmailData {
  tenantId: mongoose.Types.ObjectId;
  to: string;
  toName?: string;
  subject?: string; // Optional when using templateSlug
  templateSlug?: string;
  templateData?: Record<string, any>;
  htmlContent?: string;
  textContent?: string;
  category: 'user' | 'order' | 'marketing' | 'system' | 'staff';
  type: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  scheduledFor?: Date;
  metadata?: Record<string, any>;
  attachments?: Array<{
    filename: string;
    path?: string;
    content?: Buffer;
    contentType?: string;
  }>;
}

export interface BulkEmailData {
  tenantId: mongoose.Types.ObjectId;
  recipients: Array<{
    email: string;
    name?: string;
    customData?: Record<string, any>;
  }>;
  templateSlug: string;
  commonTemplateData?: Record<string, any>;
  category: 'user' | 'order' | 'marketing' | 'system' | 'staff';
  type: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  scheduledFor?: Date;
  metadata?: Record<string, any>;
}

class EmailService {
  private emailQueue: Queue.Queue | null = null;
  private transporters: Map<string, Transporter> = new Map();

  constructor() {
    // Initialize Bull queue for email processing (disabled for now)
    // this.emailQueue = new Queue('email processing');
    // this.setupQueueProcessor();
  }

  private setupQueueProcessor(): void {
    this.emailQueue.process('sendEmail', async (job) => {
      const emailData: EmailData = job.data;
      await this.processEmail(emailData);
    });

    this.emailQueue.process('sendBulkEmail', async (job) => {
      const bulkEmailData: BulkEmailData = job.data;
      await this.processBulkEmail(bulkEmailData);
    });

    // Retry failed emails with exponential backoff
    this.emailQueue.on('failed', (job, err) => {
      console.error(`Email job ${job.id} failed:`, err.message);
      
      if (job.attemptsMade < 3) {
        const delay = Math.pow(2, job.attemptsMade) * 60000; // 1min, 2min, 4min
        // job.retry(delay); // Bull queue handles retry automatically
      }
    });
  }

  private async getTransporter(tenantId: mongoose.Types.ObjectId): Promise<Transporter | null> {
    const tenantIdStr = tenantId.toString();
    
    // Check if transporter is already cached
    if (this.transporters.has(tenantIdStr)) {
      return this.transporters.get(tenantIdStr)!;
    }

    // Get email configuration for tenant
    const emailConfig = await EmailConfig.findOne({ 
      tenantId, 
      isActive: true 
    }).lean();

    if (!emailConfig) {
      console.warn(`No email configuration found for tenant: ${tenantId}`);
      return null;
    }

    let transporter: Transporter;

    try {
      switch (emailConfig.provider) {
        case 'smtp':
          if (!emailConfig.smtpConfig) {
            throw new Error('SMTP configuration missing');
          }
          transporter = nodemailer.createTransport({
            host: emailConfig.smtpConfig.host,
            port: emailConfig.smtpConfig.port,
            secure: emailConfig.smtpConfig.secure,
            auth: {
              user: emailConfig.smtpConfig.auth.user,
              pass: emailConfig.smtpConfig.auth.pass,
            }
          });
          break;

        case 'sendgrid':
          if (!emailConfig.sendgridConfig?.apiKey) {
            throw new Error('SendGrid API key missing');
          }
          transporter = nodemailer.createTransport({
            host: 'smtp.sendgrid.net',
            port: 587,
            secure: false,
            auth: {
              user: 'apikey',
              pass: emailConfig.sendgridConfig.apiKey,
            }
          });
          break;

        case 'mailgun':
          if (!emailConfig.mailgunConfig?.apiKey || !emailConfig.mailgunConfig?.domain) {
            throw new Error('Mailgun configuration missing');
          }
          transporter = nodemailer.createTransport({
            host: 'smtp.mailgun.org',
            port: 587,
            secure: false,
            auth: {
              user: emailConfig.mailgunConfig.apiKey,
              pass: emailConfig.mailgunConfig.domain,
            }
          });
          break;

        case 'ses':
          if (!emailConfig.sesConfig) {
            throw new Error('AWS SES configuration missing');
          }
          transporter = nodemailer.createTransport({
            host: `email-smtp.${emailConfig.sesConfig.region}.amazonaws.com`,
            port: 587,
            secure: false,
            auth: {
              user: emailConfig.sesConfig.accessKeyId,
              pass: emailConfig.sesConfig.secretAccessKey,
            }
          });
          break;

        default:
          throw new Error(`Unsupported email provider: ${emailConfig.provider}`);
      }

      // Verify transporter configuration
      await transporter.verify();
      
      // Cache the transporter
      this.transporters.set(tenantIdStr, transporter);
      
      return transporter;
    } catch (error) {
      console.error(`Failed to create transporter for tenant ${tenantId}:`, error);
      return null;
    }
  }

  private async renderTemplate(
    templateSlug: string, 
    tenantId: mongoose.Types.ObjectId, 
    templateData: Record<string, any> = {}
  ): Promise<{ subject: string; html: string; text?: string } | null> {
    try {
      // First, try to find tenant-specific template
      let template = await EmailTemplate.findOne({
        tenantId,
        slug: templateSlug,
        isActive: true
      }).lean();

      // If not found, fall back to default template
      if (!template) {
        template = await EmailTemplate.findOne({
          slug: templateSlug,
          isDefault: true,
          isActive: true
        }).lean();
      }

      if (!template) {
        console.warn(`Template not found: ${templateSlug} for tenant: ${tenantId}`);
        return null;
      }

      // Compile templates
      const subjectTemplate = handlebars.compile(template.subject);
      const htmlTemplate = handlebars.compile(template.htmlTemplate);
      const textTemplate = template.textTemplate ? handlebars.compile(template.textTemplate) : null;

      return {
        subject: subjectTemplate(templateData),
        html: htmlTemplate(templateData),
        text: textTemplate ? textTemplate(templateData) : undefined
      };
    } catch (error) {
      console.error(`Error rendering template ${templateSlug}:`, error);
      return null;
    }
  }

  public async sendEmail(emailData: EmailData): Promise<string | null> {
    try {
      // Process email directly (queue disabled for now)
      await this.processEmail(emailData);
      return 'direct-processing';
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  public async sendBulkEmail(bulkEmailData: BulkEmailData): Promise<string | null> {
    try {
      // Process bulk email directly (queue disabled for now)
      await this.processBulkEmail(bulkEmailData);
      return 'direct-processing-bulk';
    } catch (error) {
      console.error('Error sending bulk email:', error);
      throw error;
    }
  }

  private async processEmail(emailData: EmailData): Promise<void> {
    const logData: Partial<IEmailLog> = {
      tenantId: emailData.tenantId,
      recipientEmail: emailData.to,
      recipientName: emailData.toName,
      subject: emailData.subject,
      category: emailData.category,
      type: emailData.type,
      priority: emailData.priority || 'normal',
      metadata: emailData.metadata || {} as any,
      scheduledFor: emailData.scheduledFor,
      status: 'pending'
    };

    let emailLog: IEmailLog | null = null;

    try {
      // Get email configuration
      const emailConfig = await EmailConfig.findOne({ 
        tenantId: emailData.tenantId, 
        isActive: true 
      }).lean();

      if (!emailConfig) {
        throw new Error('No email configuration found for tenant');
      }

      logData.senderEmail = emailConfig.defaultFromEmail;
      logData.senderName = emailConfig.defaultFromName;

      // Create email log entry
      emailLog = new EmailLog(logData);
      await emailLog.save();

      let subject: string, html: string, text: string | undefined;

      if (emailData.templateSlug) {
        // Render from template
        const rendered = await this.renderTemplate(
          emailData.templateSlug, 
          emailData.tenantId, 
          emailData.templateData || {}
        );

        if (!rendered) {
          throw new Error(`Failed to render template: ${emailData.templateSlug}`);
        }

        subject = rendered.subject;
        html = rendered.html;
        text = rendered.text;

        // Store template reference
        const template = await EmailTemplate.findOne({
          $or: [
            { tenantId: emailData.tenantId, slug: emailData.templateSlug },
            { slug: emailData.templateSlug, isDefault: true }
          ],
          isActive: true
        });
        
        if (template) {
          emailLog.templateId = template._id as mongoose.Types.ObjectId;
        }
      } else {
        // Use provided content
        subject = emailData.subject;
        html = emailData.htmlContent || '';
        text = emailData.textContent;
      }

      // Update log with content
      emailLog.subject = subject;
      emailLog.htmlContent = html;
      emailLog.textContent = text;
      await emailLog.save();

      // Get transporter
      const transporter = await this.getTransporter(emailData.tenantId);
      if (!transporter) {
        throw new Error('Failed to create email transporter');
      }

      // Prepare mail options
      const mailOptions: SendMailOptions = {
        from: {
          name: emailConfig.defaultFromName,
          address: emailConfig.defaultFromEmail
        },
        to: {
          name: emailData.toName || emailData.to,
          address: emailData.to
        },
        subject,
        html,
        text,
        attachments: emailData.attachments || []
      };

      // Send email
      emailLog.deliveryAttempts += 1;
      emailLog.lastAttemptAt = new Date();
      await emailLog.save();

      const result = await transporter.sendMail(mailOptions);

      // Update log with success
      emailLog.status = 'sent';
      emailLog.sentAt = new Date();
      emailLog.providerMessageId = result.messageId;
      emailLog.providerResponse = result;
      await emailLog.save();

      console.log(`Email sent successfully: ${result.messageId}`);
    } catch (error) {
      console.error('Error processing email:', error);

      if (emailLog) {
        emailLog.status = 'failed';
        emailLog.failedAt = new Date();
        emailLog.errorMessage = error instanceof Error ? error.message : 'Unknown error';
        await emailLog.save();
      }

      throw error;
    }
  }

  private async processBulkEmail(bulkEmailData: BulkEmailData): Promise<void> {
    const { tenantId, recipients, templateSlug, commonTemplateData, category, type, priority, metadata } = bulkEmailData;

    for (const recipient of recipients) {
      const emailData: EmailData = {
        tenantId,
        to: recipient.email,
        toName: recipient.name,
        subject: '', // Will be set from template
        templateSlug,
        templateData: { ...commonTemplateData, ...recipient.customData },
        category,
        type,
        priority,
        metadata
      };

      // Process each email individually
      try {
        await this.processEmail(emailData);
      } catch (error) {
        console.error(`Failed to send bulk email to ${recipient.email}:`, error);
        // Continue with other recipients
      }
    }
  }

  private getPriorityWeight(priority: 'low' | 'normal' | 'high' | 'urgent'): number {
    switch (priority) {
      case 'urgent': return 10;
      case 'high': return 5;
      case 'normal': return 0;
      case 'low': return -5;
      default: return 0;
    }
  }

  public async getEmailStats(tenantId: mongoose.Types.ObjectId, days: number = 30): Promise<any> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const stats = await EmailLog.aggregate([
      {
        $match: {
          tenantId,
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const categoryStats = await EmailLog.aggregate([
      {
        $match: {
          tenantId,
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);

    return {
      statusStats: stats,
      categoryStats,
      totalEmails: stats.reduce((sum, stat) => sum + stat.count, 0)
    };
  }

  public async retryFailedEmails(tenantId: mongoose.Types.ObjectId): Promise<number> {
    const failedEmails = await EmailLog.find({
      tenantId,
      status: 'failed',
      deliveryAttempts: { $lt: 3 }
    }).limit(100);

    let retryCount = 0;
    
    for (const emailLog of failedEmails) {
      try {
        const emailData: EmailData = {
          tenantId: emailLog.tenantId,
          to: emailLog.recipientEmail,
          toName: emailLog.recipientName,
          subject: emailLog.subject,
          htmlContent: emailLog.htmlContent,
          textContent: emailLog.textContent,
          category: emailLog.category,
          type: emailLog.type,
          priority: emailLog.priority,
          metadata: emailLog.metadata
        };

        await this.processEmail(emailData);
        retryCount++;
      } catch (error) {
        console.error(`Retry failed for email ${emailLog._id}:`, error);
      }
    }

    return retryCount;
  }
}

export const emailService = new EmailService();