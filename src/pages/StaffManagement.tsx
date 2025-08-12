import { useState } from 'react';
import { Plus, Users, Clock, DollarSign, Calendar, UserCheck, Star, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { EmployeeList } from '@/components/staff/EmployeeList';
import { ShiftScheduling } from '@/components/staff/ShiftScheduling';
import { TimeTracking } from '@/components/staff/TimeTracking';
import { PerformanceMonitoring } from '@/components/staff/PerformanceMonitoring';
import { PayrollManagement } from '@/components/staff/PayrollManagement';
import { AddEmployeeDialog } from '@/components/staff/AddEmployeeDialog';
import { EmployeeDetailsDialog } from '@/components/staff/EmployeeDetailsDialog';
import { useEmployees } from '@/hooks/useEmployees';
import { useShifts } from '@/hooks/useShifts';
import { useAttendance } from '@/hooks/useAttendance';
import { Employee, EmployeeRole, EmploymentStatus } from '@/types/staff.types';
import { toast } from '@/hooks/use-toast';

export default function StaffManagement() {
  const [selectedRole, setSelectedRole] = useState<EmployeeRole | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<EmploymentStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddEmployeeOpen, setIsAddEmployeeOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const { data: employees = [], isLoading: employeesLoading, refetch: refetchEmployees } = useEmployees({
    role: selectedRole !== 'all' ? selectedRole : undefined,
    status: selectedStatus !== 'all' ? selectedStatus : undefined,
  });

  const { data: todayShifts = [] } = useShifts({
    date: new Date().toISOString().split('T')[0],
  });

  const { data: todayAttendance = [] } = useAttendance({
    date: new Date().toISOString().split('T')[0],
  });

  const filteredEmployees = employees.filter(employee => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        employee.firstName.toLowerCase().includes(query) ||
        employee.lastName.toLowerCase().includes(query) ||
        employee.employeeId.toLowerCase().includes(query) ||
        employee.email.toLowerCase().includes(query) ||
        employee.position.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const stats = {
    totalEmployees: employees.length,
    activeEmployees: employees.filter(e => e.status === 'active').length,
    onShiftToday: todayShifts.filter(s => s.status === 'started' || s.status === 'on_break').length,
    scheduledToday: todayShifts.length,
    presentToday: todayAttendance.filter(a => a.status === 'present').length,
    lateToday: todayAttendance.filter(a => a.status === 'late').length,
    absentToday: todayAttendance.filter(a => a.status === 'absent').length,
    avgHourlyRate: employees.length > 0 
      ? employees.reduce((sum, emp) => sum + emp.hourlyRate, 0) / employees.length 
      : 0,
    totalWeeklyHours: employees
      .filter(e => e.status === 'active')
      .reduce((sum, emp) => sum + emp.weeklyHours, 0),
    estimatedWeeklyPayroll: employees
      .filter(e => e.status === 'active')
      .reduce((sum, emp) => sum + (emp.hourlyRate * emp.weeklyHours), 0),
  };

  const roleColors = {
    admin: 'bg-purple-100 text-purple-800',
    manager: 'bg-blue-100 text-blue-800',
    chef: 'bg-orange-100 text-orange-800',
    server: 'bg-green-100 text-green-800',
    host: 'bg-pink-100 text-pink-800',
    cashier: 'bg-yellow-100 text-yellow-800',
    cleaner: 'bg-gray-100 text-gray-800',
    delivery: 'bg-indigo-100 text-indigo-800',
  };

  const handleEmployeeClick = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsDetailsOpen(true);
  };

  const handleClockIn = async (employeeId: string) => {
    try {
      const response = await fetch('/api/attendance/clock-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          employeeId,
          type: 'clock_in',
          timestamp: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        toast({
          title: 'Clocked In',
          description: 'Employee successfully clocked in',
        });
        refetchEmployees();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to clock in employee',
        variant: 'destructive',
      });
    }
  };

  const handleClockOut = async (employeeId: string) => {
    try {
      const response = await fetch('/api/attendance/clock-out', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          employeeId,
          type: 'clock_out',
          timestamp: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        toast({
          title: 'Clocked Out',
          description: 'Employee successfully clocked out',
        });
        refetchEmployees();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to clock out employee',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-restaurant-dark">Staff Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage employees, schedules, attendance, and performance
          </p>
        </div>
        <Button 
          onClick={() => setIsAddEmployeeOpen(true)}
          className="bg-restaurant-primary hover:bg-restaurant-primary/90"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Employee
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEmployees}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.activeEmployees} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">On Shift Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.onShiftToday}</div>
            <p className="text-xs text-muted-foreground mt-1">
              of {stats.scheduledToday} scheduled
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Attendance Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.presentToday}</div>
            <div className="flex gap-2 mt-1 text-xs">
              {stats.lateToday > 0 && (
                <span className="text-yellow-600">{stats.lateToday} late</span>
              )}
              {stats.absentToday > 0 && (
                <span className="text-red-600">{stats.absentToday} absent</span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Avg Hourly Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-restaurant-primary">
              ${stats.avgHourlyRate.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Per hour</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Weekly Payroll</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${stats.estimatedWeeklyPayroll.toFixed(0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.totalWeeklyHours}h total
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="employees" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="employees">Employees</TabsTrigger>
          <TabsTrigger value="scheduling">Scheduling</TabsTrigger>
          <TabsTrigger value="attendance">Time Tracking</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="payroll">Payroll</TabsTrigger>
        </TabsList>

        <TabsContent value="employees" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 flex gap-2">
                  <div className="relative flex-1">
                    <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search employees..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select
                    value={selectedRole}
                    onValueChange={(value) => setSelectedRole(value as EmployeeRole | 'all')}
                  >
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="chef">Chef</SelectItem>
                      <SelectItem value="server">Server</SelectItem>
                      <SelectItem value="host">Host</SelectItem>
                      <SelectItem value="cashier">Cashier</SelectItem>
                      <SelectItem value="cleaner">Cleaner</SelectItem>
                      <SelectItem value="delivery">Delivery</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={selectedStatus}
                    onValueChange={(value) => setSelectedStatus(value as EmploymentStatus | 'all')}
                  >
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="on_leave">On Leave</SelectItem>
                      <SelectItem value="terminated">Terminated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <EmployeeList
                employees={filteredEmployees}
                onEmployeeClick={handleEmployeeClick}
                onClockIn={handleClockIn}
                onClockOut={handleClockOut}
                isLoading={employeesLoading}
                roleColors={roleColors}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scheduling" className="mt-4">
          <ShiftScheduling
            employees={employees}
            onRefresh={refetchEmployees}
          />
        </TabsContent>

        <TabsContent value="attendance" className="mt-4">
          <TimeTracking
            employees={employees}
            onRefresh={refetchEmployees}
          />
        </TabsContent>

        <TabsContent value="performance" className="mt-4">
          <PerformanceMonitoring
            employees={employees}
            onRefresh={refetchEmployees}
          />
        </TabsContent>

        <TabsContent value="payroll" className="mt-4">
          <PayrollManagement
            employees={employees}
            onRefresh={refetchEmployees}
          />
        </TabsContent>
      </Tabs>

      <AddEmployeeDialog
        open={isAddEmployeeOpen}
        onOpenChange={setIsAddEmployeeOpen}
        onSuccess={() => {
          refetchEmployees();
          setIsAddEmployeeOpen(false);
        }}
      />

      {selectedEmployee && (
        <EmployeeDetailsDialog
          employee={selectedEmployee}
          open={isDetailsOpen}
          onOpenChange={setIsDetailsOpen}
          onUpdate={() => refetchEmployees()}
        />
      )}
    </div>
  );
}