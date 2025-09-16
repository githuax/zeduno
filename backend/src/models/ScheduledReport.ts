import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IScheduledReport extends Document {
  _id: mongoose.Types.ObjectId;
  tenantId: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  reportType: 'sales' | 'menu-performance' | 'customer-analytics' | 'financial-summary' | 'staff-performance' | 'branch-performance';
  frequency: 'daily' | 'weekly' | 'monthly' | 'custom';
  cronExpression?: string; // for custom schedules
  recipients: string[]; // email addresses
  format: 'pdf' | 'excel';
  parameters: {
    branchId?: mongoose.Types.ObjectId;
    dateRange?: 'auto' | number; // auto or days back
    includeCharts?: boolean;
    includeDetails?: boolean;
    customFilters?: Record<string, any>;
  };
  scheduledTime: {
    hour: number; // 0-23
    minute: number; // 0-59
    dayOfWeek?: number; // 1-7 (Monday-Sunday) for weekly
    dayOfMonth?: number; // 1-31 for monthly
  };
  timezone: string;
  isActive: boolean;
  nextRun?: Date;
  lastRun?: Date;
  lastSuccess?: Date;
  lastFailure?: Date;
  failureCount: number;
  maxFailures: number;
  totalRuns: number;
  successfulRuns: number;
  executionHistory: {
    runDate: Date;
    status: 'success' | 'failure';
    error?: string;
    reportId?: string;
    executionTime?: number; // milliseconds
    recipientCount?: number;
  }[];
  createdAt: Date;
  updatedAt: Date;
  
  // Method signatures
  getSuccessRate(): number;
  calculateNextRun(): Date | null;
  addExecutionHistory(status: 'success' | 'failure', error?: string, reportId?: string, executionTime?: number, recipientCount?: number): void;
}

export interface IScheduledReportModel extends Model<IScheduledReport> {
  findReadyForExecution(): Promise<IScheduledReport[]>;
}

const ScheduledReportSchema = new Schema<IScheduledReport>(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000
    },
    reportType: {
      type: String,
      required: true,
      enum: ['sales', 'menu-performance', 'customer-analytics', 'financial-summary', 'staff-performance', 'branch-performance'],
      index: true
    },
    frequency: {
      type: String,
      required: true,
      enum: ['daily', 'weekly', 'monthly', 'custom'],
      index: true
    },
    cronExpression: {
      type: String,
      validate: {
        validator: function(value: string) {
          // Only validate if frequency is custom
          if (this.frequency === 'custom') {
            return value && value.length > 0;
          }
          return true;
        },
        message: 'Cron expression is required for custom frequency'
      }
    },
    recipients: {
      type: [String],
      required: true,
      validate: {
        validator: function(emails: string[]) {
          if (!emails || emails.length === 0) return false;
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          return emails.every(email => emailRegex.test(email));
        },
        message: 'All recipients must be valid email addresses'
      }
    },
    format: {
      type: String,
      required: true,
      enum: ['pdf', 'excel'],
      default: 'pdf'
    },
    parameters: {
      branchId: {
        type: Schema.Types.ObjectId,
        ref: 'Branch'
      },
      dateRange: {
        type: Schema.Types.Mixed, // Can be 'auto' string or number
        default: 'auto'
      },
      includeCharts: {
        type: Boolean,
        default: true
      },
      includeDetails: {
        type: Boolean,
        default: true
      },
      customFilters: {
        type: Schema.Types.Mixed,
        default: {}
      }
    },
    scheduledTime: {
      hour: {
        type: Number,
        required: true,
        min: 0,
        max: 23
      },
      minute: {
        type: Number,
        required: true,
        min: 0,
        max: 59
      },
      dayOfWeek: {
        type: Number,
        min: 1,
        max: 7,
        validate: {
          validator: function(value: number) {
            // Only validate if frequency is weekly
            if (this.frequency === 'weekly') {
              return value >= 1 && value <= 7;
            }
            return true;
          },
          message: 'Day of week must be between 1 (Monday) and 7 (Sunday) for weekly schedules'
        }
      },
      dayOfMonth: {
        type: Number,
        min: 1,
        max: 31,
        validate: {
          validator: function(value: number) {
            // Only validate if frequency is monthly
            if (this.frequency === 'monthly') {
              return value >= 1 && value <= 31;
            }
            return true;
          },
          message: 'Day of month must be between 1 and 31 for monthly schedules'
        }
      }
    },
    timezone: {
      type: String,
      required: true,
      default: 'UTC'
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    nextRun: {
      type: Date,
      index: true
    },
    lastRun: {
      type: Date
    },
    lastSuccess: {
      type: Date
    },
    lastFailure: {
      type: Date
    },
    failureCount: {
      type: Number,
      default: 0,
      min: 0
    },
    maxFailures: {
      type: Number,
      default: 3,
      min: 1
    },
    totalRuns: {
      type: Number,
      default: 0,
      min: 0
    },
    successfulRuns: {
      type: Number,
      default: 0,
      min: 0
    },
    executionHistory: [{
      runDate: {
        type: Date,
        required: true
      },
      status: {
        type: String,
        required: true,
        enum: ['success', 'failure']
      },
      error: {
        type: String
      },
      reportId: {
        type: String
      },
      executionTime: {
        type: Number // milliseconds
      },
      recipientCount: {
        type: Number
      }
    }]
  },
  {
    timestamps: true,
    versionKey: false,
    collection: 'scheduledreports'
  }
);

// Indexes for efficient queries
ScheduledReportSchema.index({ tenantId: 1, isActive: 1 });
ScheduledReportSchema.index({ nextRun: 1, isActive: 1 });
ScheduledReportSchema.index({ createdBy: 1, tenantId: 1 });
ScheduledReportSchema.index({ reportType: 1, tenantId: 1 });
ScheduledReportSchema.index({ frequency: 1, isActive: 1 });

// Pre-save middleware to calculate next run time
ScheduledReportSchema.pre('save', function(next) {
  if (this.isNew || this.isModified('frequency') || this.isModified('scheduledTime') || this.isModified('timezone')) {
    this.nextRun = this.calculateNextRun();
  }
  next();
});

// Method to calculate next run time based on frequency and timezone
ScheduledReportSchema.methods.calculateNextRun = function(): Date {
  const now = new Date();
  const { hour, minute, dayOfWeek, dayOfMonth } = this.scheduledTime;
  
  let nextRun = new Date();
  nextRun.setHours(hour, minute, 0, 0);
  
  switch (this.frequency) {
    case 'daily':
      // If the time has passed today, schedule for tomorrow
      if (nextRun <= now) {
        nextRun.setDate(nextRun.getDate() + 1);
      }
      break;
      
    case 'weekly':
      // Calculate next occurrence of the specified day of week
      const currentDayOfWeek = nextRun.getDay() || 7; // Convert Sunday (0) to 7
      const daysUntilTarget = ((dayOfWeek! - currentDayOfWeek + 7) % 7) || 7;
      
      if (daysUntilTarget === 0 && nextRun <= now) {
        // If it's the same day but time has passed, schedule for next week
        nextRun.setDate(nextRun.getDate() + 7);
      } else {
        nextRun.setDate(nextRun.getDate() + daysUntilTarget);
      }
      break;
      
    case 'monthly':
      // Set to the specified day of month
      nextRun.setDate(dayOfMonth!);
      
      // If the date has passed this month or is today but time has passed, move to next month
      if (nextRun <= now) {
        nextRun.setMonth(nextRun.getMonth() + 1);
        nextRun.setDate(dayOfMonth!);
      }
      
      // Handle edge cases like February 30th
      if (nextRun.getDate() !== dayOfMonth) {
        // Day doesn't exist in the target month, use last day of month
        nextRun = new Date(nextRun.getFullYear(), nextRun.getMonth() + 1, 0);
        nextRun.setHours(hour, minute, 0, 0);
      }
      break;
      
    case 'custom':
      // For custom cron expressions, we'll calculate in the service layer
      // This is a placeholder - actual calculation happens in reportQueue.service.ts
      nextRun.setTime(now.getTime() + 24 * 60 * 60 * 1000); // Default to 24 hours
      break;
  }
  
  return nextRun;
};

// Method to update execution history (keep only last 50 entries)
ScheduledReportSchema.methods.addExecutionHistory = function(
  status: 'success' | 'failure',
  error?: string,
  reportId?: string,
  executionTime?: number,
  recipientCount?: number
) {
  const historyEntry = {
    runDate: new Date(),
    status,
    error,
    reportId,
    executionTime,
    recipientCount
  };
  
  this.executionHistory.push(historyEntry);
  
  // Keep only the last 50 executions
  if (this.executionHistory.length > 50) {
    this.executionHistory = this.executionHistory.slice(-50);
  }
  
  // Update counters
  this.totalRuns += 1;
  if (status === 'success') {
    this.successfulRuns += 1;
    this.lastSuccess = historyEntry.runDate;
    this.failureCount = 0; // Reset failure count on success
  } else {
    this.failureCount += 1;
    this.lastFailure = historyEntry.runDate;
    
    // Auto-disable if max failures reached
    if (this.failureCount >= this.maxFailures) {
      this.isActive = false;
    }
  }
  
  this.lastRun = historyEntry.runDate;
  this.nextRun = this.calculateNextRun();
};

// Method to get success rate percentage
ScheduledReportSchema.methods.getSuccessRate = function(): number {
  if (this.totalRuns === 0) return 0;
  return Math.round((this.successfulRuns / this.totalRuns) * 100);
};

// Static method to find schedules ready for execution
ScheduledReportSchema.statics.findReadyForExecution = function() {
  return this.find({
    isActive: true,
    nextRun: { $lte: new Date() }
  }).populate('createdBy', 'firstName lastName email')
    .populate('tenantId', 'name domain')
    .sort({ nextRun: 1 });
};

// Virtual for schedule status
ScheduledReportSchema.virtual('status').get(function() {
  if (!this.isActive) return 'inactive';
  if (this.failureCount >= this.maxFailures) return 'failed';
  if (this.nextRun && this.nextRun > new Date()) return 'scheduled';
  return 'ready';
});

// Ensure virtuals are included in JSON output
ScheduledReportSchema.set('toJSON', { virtuals: true });
ScheduledReportSchema.set('toObject', { virtuals: true });

export const ScheduledReport = mongoose.model<IScheduledReport, IScheduledReportModel>('ScheduledReport', ScheduledReportSchema);