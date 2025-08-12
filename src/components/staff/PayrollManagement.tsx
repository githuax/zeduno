import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { DollarSign, Download, Calendar, TrendingUp, Users, Clock, Plus, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { Employee, PayrollPeriod } from '@/types/staff.types';
import { toast } from '@/hooks/use-toast';
import { format, startOfWeek, endOfWeek, subWeeks, addWeeks, startOfMonth, endOfMonth, subMonths, addMonths } from 'date-fns';

interface PayrollManagementProps {
  employees: Employee[];
  onRefresh: () => void;
}

export function PayrollManagement({ employees, onRefresh }: PayrollManagementProps) {
  const [payrollPeriods, setPayrollPeriods] = useState<PayrollPeriod[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<PayrollPeriod | null>(null);
  const [isCreatePayrollOpen, setIsCreatePayrollOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [periodType, setPeriodType] = useState<'weekly' | 'biweekly' | 'monthly'>('weekly');

  const [newPayroll, setNewPayroll] = useState({
    startDate: format(startOfWeek(new Date()), 'yyyy-MM-dd'),
    endDate: format(endOfWeek(new Date()), 'yyyy-MM-dd'),
    periodType: 'weekly' as const,
  });

  const activeEmployees = employees.filter(emp => emp.status === 'active');

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getStatusColor = (status: 'draft' | 'processed' | 'paid') => {
    switch (status) {
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'processed':
        return 'bg-blue-100 text-blue-800';
      case 'paid':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: 'draft' | 'processed' | 'paid') => {
    switch (status) {
      case 'draft':
        return <FileText className="h-4 w-4" />;
      case 'processed':
        return <AlertCircle className="h-4 w-4" />;
      case 'paid':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const calculatePayrollDates = (type: 'weekly' | 'biweekly' | 'monthly', baseDate: Date = new Date()) => {
    switch (type) {
      case 'weekly':
        return {
          startDate: format(startOfWeek(baseDate), 'yyyy-MM-dd'),
          endDate: format(endOfWeek(baseDate), 'yyyy-MM-dd'),
        };
      case 'biweekly':
        const biweeklyStart = startOfWeek(subWeeks(baseDate, 1));
        return {
          startDate: format(biweeklyStart, 'yyyy-MM-dd'),
          endDate: format(endOfWeek(baseDate), 'yyyy-MM-dd'),
        };
      case 'monthly':
        return {
          startDate: format(startOfMonth(baseDate), 'yyyy-MM-dd'),
          endDate: format(endOfMonth(baseDate), 'yyyy-MM-dd'),
        };
      default:
        return {
          startDate: format(startOfWeek(baseDate), 'yyyy-MM-dd'),
          endDate: format(endOfWeek(baseDate), 'yyyy-MM-dd'),
        };
    }
  };

  const handleCreatePayroll = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/payroll', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(newPayroll),
      });

      if (response.ok) {
        toast({
          title: 'Payroll Period Created',
          description: `Payroll period for ${format(new Date(newPayroll.startDate), 'MMM d')} - ${format(new Date(newPayroll.endDate), 'MMM d, yyyy')} has been created`,
        });
        setIsCreatePayrollOpen(false);
        loadPayrollPeriods();
        onRefresh();
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.message || 'Failed to create payroll period',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Network error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleProcessPayroll = async (payrollId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/payroll/${payrollId}/process`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        toast({
          title: 'Payroll Processed',
          description: 'Payroll has been calculated and is ready for payment',
        });
        loadPayrollPeriods();
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.message || 'Failed to process payroll',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Network error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsPaid = async (payrollId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/payroll/${payrollId}/pay`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        toast({
          title: 'Payroll Paid',
          description: 'Payroll has been marked as paid',
        });
        loadPayrollPeriods();
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.message || 'Failed to mark payroll as paid',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Network error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadPayrollPeriods = async () => {
    try {
      const response = await fetch('/api/payroll', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPayrollPeriods(data);
      }
    } catch (error) {
      console.error('Failed to load payroll periods:', error);
    }
  };

  const exportPayroll = async (payrollId: string) => {
    try {
      const response = await fetch(`/api/payroll/${payrollId}/export`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `payroll-${format(new Date(), 'yyyy-MM-dd')}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        
        toast({
          title: 'Export Complete',
          description: 'Payroll data has been exported successfully',
        });
      }
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: 'Failed to export payroll data',
        variant: 'destructive',
      });
    }
  };

  const updatePayrollDates = (type: 'weekly' | 'biweekly' | 'monthly') => {
    const dates = calculatePayrollDates(type);
    setNewPayroll(prev => ({
      ...prev,
      periodType: type,
      startDate: dates.startDate,
      endDate: dates.endDate,
    }));
  };

  const payrollStats = {
    totalPayrolls: payrollPeriods.length,
    totalPayroll: payrollPeriods.reduce((sum, period) => sum + period.totalPayroll, 0),
    avgPayroll: payrollPeriods.length > 0 
      ? payrollPeriods.reduce((sum, period) => sum + period.totalPayroll, 0) / payrollPeriods.length
      : 0,
    pendingPayrolls: payrollPeriods.filter(p => p.status === 'draft').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Payroll Management</h2>
          <p className="text-muted-foreground">
            Manage employee payroll and compensation
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Dialog open={isCreatePayrollOpen} onOpenChange={setIsCreatePayrollOpen}>
            <DialogTrigger asChild>
              <Button className="bg-restaurant-primary hover:bg-restaurant-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                New Payroll
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Payroll Period</DialogTitle>
                <DialogDescription>
                  Set up a new payroll period for employee compensation
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Period Type</Label>
                  <Select
                    value={newPayroll.periodType}
                    onValueChange={(value: 'weekly' | 'biweekly' | 'monthly') => updatePayrollDates(value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="biweekly">Bi-weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={newPayroll.startDate}
                      onChange={(e) => setNewPayroll(prev => ({ ...prev, startDate: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>End Date</Label>
                    <Input
                      type="date"
                      value={newPayroll.endDate}
                      onChange={(e) => setNewPayroll(prev => ({ ...prev, endDate: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Period Summary:</strong> {format(new Date(newPayroll.startDate), 'MMM d')} - {format(new Date(newPayroll.endDate), 'MMM d, yyyy')}
                  </p>
                  <p className="text-sm text-blue-600 mt-1">
                    This will include {activeEmployees.length} active employees
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreatePayrollOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreatePayroll}
                  disabled={isLoading}
                  className="bg-restaurant-primary hover:bg-restaurant-primary/90"
                >
                  {isLoading ? 'Creating...' : 'Create Payroll'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center">
              <FileText className="h-4 w-4 mr-2" />
              Total Payrolls
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{payrollStats.totalPayrolls}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center">
              <DollarSign className="h-4 w-4 mr-2" />
              Total Paid
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${payrollStats.totalPayroll.toFixed(0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center">
              <TrendingUp className="h-4 w-4 mr-2" />
              Avg Payroll
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              ${payrollStats.avgPayroll.toFixed(0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center">
              <AlertCircle className="h-4 w-4 mr-2" />
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {payrollStats.pendingPayrolls}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="periods" className="w-full">
        <TabsList>
          <TabsTrigger value="periods">Payroll Periods</TabsTrigger>
          <TabsTrigger value="employees">Employee Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="periods" className="mt-4">
          {payrollPeriods.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <DollarSign className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No payroll periods found</p>
                <Button 
                  className="mt-4"
                  onClick={() => setIsCreatePayrollOpen(true)}
                >
                  Create First Payroll
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {payrollPeriods.map((period) => (
                <Card key={period._id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          {format(new Date(period.startDate), 'MMM d')} - {format(new Date(period.endDate), 'MMM d, yyyy')}
                        </CardTitle>
                        <CardDescription className="flex items-center space-x-4 mt-2">
                          <span>{period.employees.length} employees</span>
                          <span>•</span>
                          <span>${period.totalPayroll.toFixed(2)} total</span>
                        </CardDescription>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge
                          variant="secondary"
                          className={`${getStatusColor(period.status)} flex items-center space-x-1`}
                        >
                          {getStatusIcon(period.status)}
                          <span>{period.status}</span>
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => exportPayroll(period._id)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Employee</TableHead>
                          <TableHead>Regular Hours</TableHead>
                          <TableHead>Overtime</TableHead>
                          <TableHead>Regular Pay</TableHead>
                          <TableHead>Overtime Pay</TableHead>
                          <TableHead>Deductions</TableHead>
                          <TableHead>Net Pay</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {period.employees.slice(0, 5).map((emp) => {
                          const employee = employees.find(e => e._id === emp.employeeId);
                          if (!employee) return null;

                          return (
                            <TableRow key={emp.employeeId}>
                              <TableCell>
                                <div className="flex items-center space-x-2">
                                  <Avatar className="h-8 w-8">
                                    <AvatarImage src={employee.avatar} />
                                    <AvatarFallback className="text-xs">
                                      {getInitials(employee.firstName, employee.lastName)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <div className="text-sm font-medium">
                                      {employee.firstName} {employee.lastName}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {employee.position}
                                    </div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>{emp.regularHours.toFixed(1)}h</TableCell>
                              <TableCell>{emp.overtimeHours.toFixed(1)}h</TableCell>
                              <TableCell>${emp.regularPay.toFixed(2)}</TableCell>
                              <TableCell>${emp.overtimePay.toFixed(2)}</TableCell>
                              <TableCell>${(emp.deductions || 0).toFixed(2)}</TableCell>
                              <TableCell className="font-medium">${emp.netPay.toFixed(2)}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                    
                    {period.employees.length > 5 && (
                      <p className="text-sm text-muted-foreground text-center mt-2">
                        +{period.employees.length - 5} more employees
                      </p>
                    )}

                    <Separator className="my-4" />
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        {period.processedAt && (
                          <span>
                            Processed {format(new Date(period.processedAt), 'MMM d, yyyy')}
                          </span>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        {period.status === 'draft' && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                className="bg-blue-600 hover:bg-blue-700"
                                disabled={isLoading}
                              >
                                Process Payroll
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Process Payroll</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will calculate all employee payments for the period 
                                  {format(new Date(period.startDate), 'MMM d')} - {format(new Date(period.endDate), 'MMM d, yyyy')}.
                                  This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleProcessPayroll(period._id)}
                                  className="bg-blue-600 hover:bg-blue-700"
                                >
                                  Process Payroll
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                        
                        {period.status === 'processed' && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                                disabled={isLoading}
                              >
                                Mark as Paid
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Mark as Paid</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Confirm that all employees have been paid for the period 
                                  {format(new Date(period.startDate), 'MMM d')} - {format(new Date(period.endDate), 'MMM d, yyyy')}.
                                  Total payroll: ${period.totalPayroll.toFixed(2)}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleMarkAsPaid(period._id)}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  Mark as Paid
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="employees" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Employee Compensation Summary</CardTitle>
              <CardDescription>
                Current hourly rates and weekly earnings for all active employees
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Hourly Rate</TableHead>
                    <TableHead>Weekly Hours</TableHead>
                    <TableHead>Weekly Earnings</TableHead>
                    <TableHead>Monthly Est.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeEmployees.map((employee) => (
                    <TableRow key={employee._id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={employee.avatar} />
                            <AvatarFallback className="bg-restaurant-primary/10 text-restaurant-primary">
                              {getInitials(employee.firstName, employee.lastName)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">
                              {employee.firstName} {employee.lastName}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {employee.employeeId}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          {employee.role}
                        </Badge>
                        <div className="text-sm text-muted-foreground mt-1">
                          {employee.position}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        ${employee.hourlyRate.toFixed(2)}/hr
                      </TableCell>
                      <TableCell>{employee.weeklyHours}h</TableCell>
                      <TableCell className="font-medium text-green-600">
                        ${(employee.hourlyRate * employee.weeklyHours).toFixed(2)}
                      </TableCell>
                      <TableCell className="font-medium text-blue-600">
                        ${(employee.hourlyRate * employee.weeklyHours * 4.33).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}