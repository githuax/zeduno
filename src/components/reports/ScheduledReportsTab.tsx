import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  Mail, 
  Play, 
  Pause, 
  Edit, 
  Trash2, 
  Eye,
  Plus,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RotateCcw
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

import { useScheduledReports, useScheduledReportActions } from '@/hooks/useScheduledReports';
import CreateScheduledReportForm from './CreateScheduledReportForm';
import EditScheduledReportForm from './EditScheduledReportForm';
import ScheduleHistoryModal from './ScheduleHistoryModal';

interface ScheduledReportsTabProps {
  onCreateSuccess?: () => void;
}

const ScheduledReportsTab: React.FC<ScheduledReportsTabProps> = ({ onCreateSuccess }) => {
  const { toast } = useToast();
  const [selectedSchedule, setSelectedSchedule] = useState<any>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const { 
    data: scheduledReports, 
    isLoading, 
    refetch 
  } = useScheduledReports();

  const {
    toggleScheduleMutation,
    runNowMutation,
    deleteScheduleMutation
  } = useScheduledReportActions();

  const handleToggleSchedule = async (id: string, isActive: boolean) => {
    try {
      await toggleScheduleMutation.mutateAsync({
        scheduleId: id,
        isActive: !isActive
      });
      toast({
        title: 'Success',
        description: `Schedule ${!isActive ? 'resumed' : 'paused'} successfully`,
      });
      refetch();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update schedule',
        variant: 'destructive',
      });
    }
  };

  const handleRunNow = async (id: string, title: string) => {
    try {
      await runNowMutation.mutateAsync(id);
      toast({
        title: 'Report Queued',
        description: `${title} has been queued for immediate execution`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to queue report',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) {
      return;
    }

    try {
      await deleteScheduleMutation.mutateAsync(id);
      toast({
        title: 'Success',
        description: 'Scheduled report deleted successfully',
      });
      refetch();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete schedule',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">Scheduled</Badge>;
      case 'active':
        return <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inactive</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'ready':
        return <Badge variant="default" className="bg-orange-100 text-orange-800">Ready</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getNextRunText = (nextRun: string | null) => {
    if (!nextRun) return 'Not scheduled';
    const nextRunDate = new Date(nextRun);
    if (nextRunDate < new Date()) {
      return 'Ready to run';
    }
    return formatDistanceToNow(nextRunDate, { addSuffix: true });
  };

  const getFrequencyText = (frequency: string) => {
    const frequencyMap = {
      daily: 'Daily',
      weekly: 'Weekly',
      monthly: 'Monthly',
      custom: 'Custom'
    };
    return frequencyMap[frequency as keyof typeof frequencyMap] || frequency;
  };

  const summaryStats = scheduledReports ? {
    total: scheduledReports.length,
    active: scheduledReports.filter(s => s.isActive).length,
    failed: scheduledReports.filter(s => s.status === 'failed').length,
    avgSuccessRate: scheduledReports.reduce((acc, s) => acc + (s.successRate || 0), 0) / (scheduledReports.length || 1)
  } : { total: 0, active: 0, failed: 0, avgSuccessRate: 0 };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading scheduled reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Schedules</p>
                <p className="text-2xl font-bold">{summaryStats.total}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-green-600">{summaryStats.active}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Failed</p>
                <p className="text-2xl font-bold text-red-600">{summaryStats.failed}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold">{Math.round(summaryStats.avgSuccessRate)}%</p>
              </div>
              <div className="w-8 h-8 flex items-center justify-center">
                <Progress value={summaryStats.avgSuccessRate} className="w-8 h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Header with Create Button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Scheduled Reports</h2>
          <p className="text-muted-foreground">
            Manage automated report generation and delivery schedules
          </p>
        </div>
        <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Schedule
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Scheduled Report</DialogTitle>
              <DialogDescription>
                Set up automated report generation and email delivery
              </DialogDescription>
            </DialogHeader>
            <CreateScheduledReportForm
              onSuccess={() => {
                setShowCreateForm(false);
                refetch();
                onCreateSuccess?.();
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Scheduled Reports Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Scheduled Reports</CardTitle>
          <CardDescription>
            View and manage your automated report schedules
          </CardDescription>
        </CardHeader>
        <CardContent>
          {scheduledReports && scheduledReports.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Report</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead>Recipients</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Success Rate</TableHead>
                  <TableHead>Next Run</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scheduledReports.map((schedule) => (
                  <TableRow key={schedule._id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{schedule.title}</p>
                        {schedule.description && (
                          <p className="text-sm text-muted-foreground">{schedule.description}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {schedule.reportType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Badge>
                    </TableCell>
                    <TableCell>{getFrequencyText(schedule.frequency)}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Mail className="h-4 w-4" />
                        <span>{schedule.recipients.length}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(schedule.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Progress value={schedule.successRate || 0} className="w-12 h-2" />
                        <span className="text-sm">{schedule.successRate || 0}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {getNextRunText(schedule.nextRun)}
                        {schedule.lastRun && (
                          <p className="text-xs text-muted-foreground">
                            Last: {format(new Date(schedule.lastRun), 'MMM d, HH:mm')}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedSchedule(schedule);
                            setShowHistoryModal(true);
                          }}
                          title="View History"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRunNow(schedule._id, schedule.title)}
                          disabled={runNowMutation.isPending}
                          title="Run Now"
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleSchedule(schedule._id, schedule.isActive)}
                          disabled={toggleScheduleMutation.isPending}
                          title={schedule.isActive ? 'Pause' : 'Resume'}
                        >
                          {schedule.isActive ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedSchedule(schedule);
                            setShowEditForm(true);
                          }}
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(schedule._id, schedule.title)}
                          disabled={deleteScheduleMutation.isPending}
                          title="Delete"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No scheduled reports</h3>
              <p className="mt-2 text-muted-foreground">
                Get started by creating your first automated report schedule.
              </p>
              <Button
                className="mt-4"
                onClick={() => setShowCreateForm(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Schedule
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Schedule Modal */}
      {selectedSchedule && (
        <Dialog open={showEditForm} onOpenChange={setShowEditForm}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Scheduled Report</DialogTitle>
              <DialogDescription>
                Update the schedule configuration for "{selectedSchedule.title}"
              </DialogDescription>
            </DialogHeader>
            <EditScheduledReportForm
              schedule={selectedSchedule}
              onSuccess={() => {
                setShowEditForm(false);
                setSelectedSchedule(null);
                refetch();
              }}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* History Modal */}
      {selectedSchedule && (
        <ScheduleHistoryModal
          schedule={selectedSchedule}
          open={showHistoryModal}
          onClose={() => {
            setShowHistoryModal(false);
            setSelectedSchedule(null);
          }}
        />
      )}
    </div>
  );
};

export default ScheduledReportsTab;