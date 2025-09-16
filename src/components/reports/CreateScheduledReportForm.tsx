import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Clock, Mail, Calendar, Settings } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

import { useCreateScheduledReport, CreateScheduledReportRequest } from '@/hooks/useScheduledReports';
import { useUserBranches } from '@/hooks/useReports';

const createScheduleSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  reportType: z.enum(['sales', 'menu-performance', 'customer-analytics', 'financial-summary', 'staff-performance', 'branch-performance']),
  frequency: z.enum(['daily', 'weekly', 'monthly', 'custom']),
  cronExpression: z.string().optional(),
  recipients: z.array(z.string().email('Invalid email address')).min(1, 'At least one recipient required'),
  format: z.enum(['pdf', 'excel']),
  scheduledTime: z.object({
    hour: z.number().min(0).max(23),
    minute: z.number().min(0).max(59),
    dayOfWeek: z.number().min(1).max(7).optional(),
    dayOfMonth: z.number().min(1).max(31).optional(),
  }),
  timezone: z.string().min(1, 'Timezone is required'),
  parameters: z.object({
    branchId: z.string().optional(),
    dateRange: z.union([z.literal('auto'), z.number().positive()]).default('auto'),
    includeCharts: z.boolean().default(true),
    includeDetails: z.boolean().default(true),
    customFilters: z.record(z.any()).default({}),
  }),
  maxFailures: z.number().min(1).max(10).default(3),
});

type CreateScheduleFormData = z.infer<typeof createScheduleSchema>;

interface CreateScheduledReportFormProps {
  onSuccess: () => void;
}

const CreateScheduledReportForm: React.FC<CreateScheduledReportFormProps> = ({
  onSuccess,
}) => {
  const { toast } = useToast();
  const [recipientInput, setRecipientInput] = useState('');
  const createMutation = useCreateScheduledReport();
  const { data: branches } = useUserBranches();

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateScheduleFormData>({
    resolver: zodResolver(createScheduleSchema),
    defaultValues: {
      format: 'pdf',
      frequency: 'daily',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      scheduledTime: {
        hour: 8,
        minute: 0,
      },
      parameters: {
        dateRange: 'auto',
        includeCharts: true,
        includeDetails: true,
        customFilters: {},
      },
      maxFailures: 3,
      recipients: [],
    },
  });

  const frequency = watch('frequency');
  const recipients = watch('recipients');

  const reportTypeOptions = [
    { value: 'sales', label: 'Sales Report', description: 'Revenue, orders, and sales performance' },
    { value: 'menu-performance', label: 'Menu Performance', description: 'Item popularity and revenue' },
    { value: 'customer-analytics', label: 'Customer Analytics', description: 'Customer behavior and satisfaction' },
    { value: 'financial-summary', label: 'Financial Summary', description: 'Comprehensive financial overview' },
    { value: 'staff-performance', label: 'Staff Performance', description: 'Employee productivity and metrics' },
    { value: 'branch-performance', label: 'Branch Performance', description: 'Multi-location comparison' },
  ];

  const timezoneOptions = [
    'UTC',
    'America/New_York',
    'America/Chicago',
    'America/Denver', 
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris',
    'Asia/Tokyo',
    'Australia/Sydney',
  ];

  const addRecipient = () => {
    if (!recipientInput.trim()) return;
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientInput)) {
      toast({
        title: 'Invalid Email',
        description: 'Please enter a valid email address',
        variant: 'destructive',
      });
      return;
    }

    if (recipients.includes(recipientInput)) {
      toast({
        title: 'Duplicate Email',
        description: 'This email is already in the recipient list',
        variant: 'destructive',
      });
      return;
    }

    setValue('recipients', [...recipients, recipientInput]);
    setRecipientInput('');
  };

  const removeRecipient = (email: string) => {
    setValue('recipients', recipients.filter(r => r !== email));
  };

  const onSubmit = async (data: CreateScheduleFormData) => {
    try {
      await createMutation.mutateAsync(data);
      toast({
        title: 'Success',
        description: 'Scheduled report created successfully',
      });
      onSuccess();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create scheduled report',
        variant: 'destructive',
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Basic Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Daily Sales Report"
              {...register('title')}
            />
            {errors.title && (
              <p className="text-sm text-red-600 mt-1">{errors.title.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Optional description for this scheduled report"
              rows={2}
              {...register('description')}
            />
            {errors.description && (
              <p className="text-sm text-red-600 mt-1">{errors.description.message}</p>
            )}
          </div>

          <div>
            <Label>Report Type *</Label>
            <Controller
              name="reportType"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select report type" />
                  </SelectTrigger>
                  <SelectContent>
                    {reportTypeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div>
                          <div className="font-medium">{option.label}</div>
                          <div className="text-sm text-muted-foreground">{option.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.reportType && (
              <p className="text-sm text-red-600 mt-1">{errors.reportType.message}</p>
            )}
          </div>

          <div>
            <Label>Format *</Label>
            <Controller
              name="format"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="excel">Excel</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </CardContent>
      </Card>

      {/* Schedule Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Schedule Configuration</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Frequency *</Label>
            <Controller
              name="frequency"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="custom">Custom (Cron)</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {frequency === 'custom' && (
            <div>
              <Label htmlFor="cronExpression">Cron Expression *</Label>
              <Input
                id="cronExpression"
                placeholder="0 8 * * *"
                {...register('cronExpression')}
              />
              <p className="text-sm text-muted-foreground mt-1">
                Use standard cron format (minute hour day month weekday)
              </p>
              {errors.cronExpression && (
                <p className="text-sm text-red-600 mt-1">{errors.cronExpression.message}</p>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="hour">Hour (0-23) *</Label>
              <Controller
                name="scheduledTime.hour"
                control={control}
                render={({ field }) => (
                  <Input
                    id="hour"
                    type="number"
                    min="0"
                    max="23"
                    value={field.value}
                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                  />
                )}
              />
              {errors.scheduledTime?.hour && (
                <p className="text-sm text-red-600 mt-1">{errors.scheduledTime.hour.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="minute">Minute (0-59) *</Label>
              <Controller
                name="scheduledTime.minute"
                control={control}
                render={({ field }) => (
                  <Input
                    id="minute"
                    type="number"
                    min="0"
                    max="59"
                    value={field.value}
                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                  />
                )}
              />
              {errors.scheduledTime?.minute && (
                <p className="text-sm text-red-600 mt-1">{errors.scheduledTime.minute.message}</p>
              )}
            </div>
          </div>

          {frequency === 'weekly' && (
            <div>
              <Label htmlFor="dayOfWeek">Day of Week *</Label>
              <Controller
                name="scheduledTime.dayOfWeek"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value?.toString()}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select day" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Monday</SelectItem>
                      <SelectItem value="2">Tuesday</SelectItem>
                      <SelectItem value="3">Wednesday</SelectItem>
                      <SelectItem value="4">Thursday</SelectItem>
                      <SelectItem value="5">Friday</SelectItem>
                      <SelectItem value="6">Saturday</SelectItem>
                      <SelectItem value="7">Sunday</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.scheduledTime?.dayOfWeek && (
                <p className="text-sm text-red-600 mt-1">{errors.scheduledTime.dayOfWeek.message}</p>
              )}
            </div>
          )}

          {frequency === 'monthly' && (
            <div>
              <Label htmlFor="dayOfMonth">Day of Month (1-31) *</Label>
              <Controller
                name="scheduledTime.dayOfMonth"
                control={control}
                render={({ field }) => (
                  <Input
                    id="dayOfMonth"
                    type="number"
                    min="1"
                    max="31"
                    value={field.value || ''}
                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                  />
                )}
              />
              {errors.scheduledTime?.dayOfMonth && (
                <p className="text-sm text-red-600 mt-1">{errors.scheduledTime.dayOfMonth.message}</p>
              )}
            </div>
          )}

          <div>
            <Label>Timezone *</Label>
            <Controller
              name="timezone"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {timezoneOptions.map((tz) => (
                      <SelectItem key={tz} value={tz}>
                        {tz}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </CardContent>
      </Card>

      {/* Recipients */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Mail className="h-5 w-5" />
            <span>Recipients</span>
          </CardTitle>
          <CardDescription>
            Add email addresses to receive the scheduled reports
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <Input
              placeholder="Enter email address"
              value={recipientInput}
              onChange={(e) => setRecipientInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addRecipient();
                }
              }}
            />
            <Button type="button" onClick={addRecipient}>
              Add
            </Button>
          </div>

          {recipients.length > 0 && (
            <div className="space-y-2">
              <Label>Recipients ({recipients.length})</Label>
              <div className="flex flex-wrap gap-2">
                {recipients.map((email) => (
                  <Badge
                    key={email}
                    variant="secondary"
                    className="cursor-pointer hover:bg-red-100"
                    onClick={() => removeRecipient(email)}
                  >
                    {email} ×
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {errors.recipients && (
            <p className="text-sm text-red-600 mt-1">{errors.recipients.message}</p>
          )}
        </CardContent>
      </Card>

      {/* Parameters */}
      <Card>
        <CardHeader>
          <CardTitle>Report Parameters</CardTitle>
          <CardDescription>
            Configure what data to include in the report
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {branches && branches.length > 1 && (
            <div>
              <Label>Branch (Optional)</Label>
              <Controller
                name="parameters.branchId"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="All branches" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All branches</SelectItem>
                      {branches.map((branch) => (
                        <SelectItem key={branch._id} value={branch._id}>
                          {branch.name} ({branch.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          )}

          <div>
            <Label>Date Range</Label>
            <Controller
              name="parameters.dateRange"
              control={control}
              render={({ field }) => (
                <Select 
                  onValueChange={(value) => field.onChange(value === 'auto' ? 'auto' : parseInt(value))} 
                  defaultValue={field.value === 'auto' ? 'auto' : field.value.toString()}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Auto (Yesterday for daily, last week for weekly, etc.)</SelectItem>
                    <SelectItem value="7">Last 7 days</SelectItem>
                    <SelectItem value="30">Last 30 days</SelectItem>
                    <SelectItem value="90">Last 90 days</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Controller
                name="parameters.includeCharts"
                control={control}
                render={({ field }) => (
                  <Switch
                    id="includeCharts"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <Label htmlFor="includeCharts">Include charts and visualizations</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Controller
                name="parameters.includeDetails"
                control={control}
                render={({ field }) => (
                  <Switch
                    id="includeDetails"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <Label htmlFor="includeDetails">Include detailed data tables</Label>
            </div>
          </div>

          <div>
            <Label htmlFor="maxFailures">Max Failures Before Auto-Disable</Label>
            <Controller
              name="maxFailures"
              control={control}
              render={({ field }) => (
                <Input
                  id="maxFailures"
                  type="number"
                  min="1"
                  max="10"
                  value={field.value}
                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                />
              )}
            />
            <p className="text-sm text-muted-foreground mt-1">
              Schedule will be automatically disabled after this many consecutive failures
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end space-x-2">
        <Button
          type="submit"
          disabled={isSubmitting || createMutation.isPending}
          className="min-w-[120px]"
        >
          {(isSubmitting || createMutation.isPending) ? 'Creating...' : 'Create Schedule'}
        </Button>
      </div>
    </form>
  );
};

export default CreateScheduledReportForm;