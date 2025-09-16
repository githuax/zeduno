import React from 'react';
import { format } from 'date-fns';
import { Clock, CheckCircle, XCircle, FileText, Users, Zap } from 'lucide-react';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';

import { useScheduleExecutionHistory, ScheduledReport } from '@/hooks/useScheduledReports';

interface ScheduleHistoryModalProps {
  schedule: ScheduledReport;
  open: boolean;
  onClose: () => void;
}

const ScheduleHistoryModal: React.FC<ScheduleHistoryModalProps> = ({
  schedule,
  open,
  onClose,
}) => {
  const {
    data: historyData,
    isLoading,
  } = useScheduleExecutionHistory(schedule._id, { limit: 50 });

  const formatExecutionTime = (timeMs: number | undefined) => {
    if (!timeMs) return 'N/A';
    if (timeMs < 1000) return `${timeMs}ms`;
    if (timeMs < 60000) return `${(timeMs / 1000).toFixed(1)}s`;
    return `${(timeMs / 60000).toFixed(1)}m`;
  };

  const getStatusIcon = (status: 'success' | 'failure') => {
    return status === 'success' ? (
      <CheckCircle className="h-4 w-4 text-green-600" />
    ) : (
      <XCircle className="h-4 w-4 text-red-600" />
    );
  };

  const getStatusBadge = (status: 'success' | 'failure') => {
    return status === 'success' ? (
      <Badge variant="default" className="bg-green-100 text-green-800">Success</Badge>
    ) : (
      <Badge variant="destructive">Failed</Badge>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Execution History</span>
          </DialogTitle>
          <DialogDescription>
            Execution history and performance metrics for "{schedule.title}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Summary Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Runs</p>
                    <p className="text-2xl font-bold">{historyData?.summary?.totalRuns || 0}</p>
                  </div>
                  <FileText className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Successful Runs</p>
                    <p className="text-2xl font-bold text-green-600">{historyData?.summary?.successfulRuns || 0}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                    <p className="text-2xl font-bold">{historyData?.summary?.successRate || 0}%</p>
                  </div>
                  <div className="w-8 h-8 flex items-center justify-center">
                    <Progress value={historyData?.summary?.successRate || 0} className="w-8 h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Recipients</p>
                    <p className="text-2xl font-bold">{schedule.recipients.length}</p>
                  </div>
                  <Users className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Last Execution Status */}
          {historyData?.summary && (
            <Card>
              <CardHeader>
                <CardTitle>Latest Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-muted-foreground">Last Run</p>
                    <p>{historyData.summary.lastRun ? format(new Date(historyData.summary.lastRun), 'PPP p') : 'Never'}</p>
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground">Last Success</p>
                    <p className="text-green-600">
                      {historyData.summary.lastSuccess ? format(new Date(historyData.summary.lastSuccess), 'PPP p') : 'Never'}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground">Current Failure Count</p>
                    <p className={`font-semibold ${historyData.summary.failureCount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {historyData.summary.failureCount} / {schedule.maxFailures}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Separator />

          {/* Execution History Table */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Executions</CardTitle>
              <CardDescription>
                Detailed execution history with performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-sm text-muted-foreground">Loading history...</p>
                  </div>
                </div>
              ) : historyData?.data && historyData.data.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Execution Time</TableHead>
                      <TableHead>Recipients</TableHead>
                      <TableHead>Error Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {historyData.data.map((execution, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium">
                              {format(new Date(execution.runDate), 'MMM d, yyyy')}
                            </div>
                            <div className="text-muted-foreground">
                              {format(new Date(execution.runDate), 'HH:mm:ss')}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(execution.status)}
                            {getStatusBadge(execution.status)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <Zap className="h-3 w-3 text-orange-500" />
                            <span className="text-sm">{formatExecutionTime(execution.executionTime)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {execution.recipientCount ? (
                              <span className="text-green-600">{execution.recipientCount} sent</span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {execution.error ? (
                            <div className="max-w-xs">
                              <p className="text-sm text-red-600 truncate" title={execution.error}>
                                {execution.error}
                              </p>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <Clock className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">No execution history</h3>
                  <p className="mt-2 text-muted-foreground">
                    This schedule hasn't been executed yet.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pagination Info */}
          {historyData?.pagination && (
            <div className="text-center text-sm text-muted-foreground">
              Showing {historyData.data?.length || 0} of {historyData.pagination.total} executions
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ScheduleHistoryModal;