import React, { useState, useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Clock, Mail, Settings } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

import { useUpdateScheduledReport, UpdateScheduledReportRequest, ScheduledReport } from '@/hooks/useScheduledReports';
import { useUserBranches } from '@/hooks/useReports';

const updateScheduleSchema = z.object({
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
  isActive: z.boolean().optional(),
});

type UpdateScheduleFormData = z.infer<typeof updateScheduleSchema>;

interface EditScheduledReportFormProps {
  schedule: ScheduledReport;
  onSuccess: () => void;
}

const EditScheduledReportForm: React.FC<EditScheduledReportFormProps> = ({
  schedule,
  onSuccess,
}) => {
  const { toast } = useToast();
  const [recipientInput, setRecipientInput] = useState('');
  const updateMutation = useUpdateScheduledReport();
  const { data: branches } = useUserBranches();

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<UpdateScheduleFormData>({
    resolver: zodResolver(updateScheduleSchema),
    defaultValues: {
      title: schedule.title,
      description: schedule.description || '',
      reportType: schedule.reportType,
      frequency: schedule.frequency,
      cronExpression: schedule.cronExpression || '',
      recipients: schedule.recipients,
      format: schedule.format,
      scheduledTime: schedule.scheduledTime,
      timezone: schedule.timezone,
      parameters: {
        ...schedule.parameters,
        dateRange: schedule.parameters.dateRange || 'auto',
        includeCharts: schedule.parameters.includeCharts ?? true,
        includeDetails: schedule.parameters.includeDetails ?? true,
      },
      maxFailures: schedule.maxFailures,
      isActive: schedule.isActive,
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

  const onSubmit = async (data: UpdateScheduleFormData) => {
    try {
      await updateMutation.mutateAsync({
        id: schedule._id,
        data,
      });
      toast({
        title: 'Success',
        description: 'Scheduled report updated successfully',
      });
      onSuccess();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update scheduled report',
        variant: 'destructive',
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Status Toggle */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="isActive" className="text-base font-medium">
                Schedule Active
              </Label>
              <p className="text-sm text-muted-foreground">
                Enable or disable this scheduled report
              </p>
            </div>
            <Controller
              name="isActive"
              control={control}
              render={({ field }) => (
                <Switch
                  id="isActive"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
          </div>
        </CardContent>
      </Card>

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
                    <SelectValue />
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
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end space-x-2">
        <Button
          type="submit"
          disabled={isSubmitting || updateMutation.isPending}
          className="min-w-[120px]"
        >
          {(isSubmitting || updateMutation.isPending) ? 'Updating...' : 'Update Schedule'}
        </Button>
      </div>
    </form>
  );
};

export default EditScheduledReportForm;