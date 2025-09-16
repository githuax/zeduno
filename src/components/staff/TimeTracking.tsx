import { format, addDays, subDays, parseISO, differenceInHours, differenceInMinutes, isToday } from 'date-fns';
import { Clock, Calendar, Coffee, CheckCircle, XCircle, AlertCircle, Timer, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useState } from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { Employee, Attendance, AttendanceStatus } from '@/types/staff.types';


interface TimeTrackingProps {
  employees: Employee[];
  onRefresh: () => void;
}

export function TimeTracking({ employees, onRefresh }: TimeTrackingProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isManualEntryOpen, setIsManualEntryOpen] = useState(false);
  
  const [manualEntry, setManualEntry] = useState({
    employeeId: '',
    clockIn: format(new Date(), 'HH:mm'),
    clockOut: '',
    breakStart: '',
    breakEnd: '',
    notes: '',
  });

  const activeEmployees = employees.filter(emp => emp.status === 'active');

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getStatusColor = (status: AttendanceStatus) => {
    switch (status) {
      case 'present':
        return 'bg-green-100 text-green-800';
      case 'late':
        return 'bg-yellow-100 text-yellow-800';
      case 'absent':
        return 'bg-red-100 text-red-800';
      case 'early_leave':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: AttendanceStatus) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'late':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'absent':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'early_leave':
        return <Clock className="h-4 w-4 text-orange-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatTime = (timeString: string | undefined) => {
    if (!timeString) return '--:--';
    return format(parseISO(timeString), 'HH:mm');
  };

  const calculateTotalHours = (attendance: Attendance) => {
    if (!attendance.clockIn || !attendance.clockOut) return 0;
    const start = parseISO(attendance.clockIn);
    const end = parseISO(attendance.clockOut);
    const totalMinutes = differenceInMinutes(end, start);
    return Math.max(0, (totalMinutes - (attendance.totalBreakTime * 60)) / 60);
  };

  const getEmployeeAttendance = (employeeId: string) => {
    return attendance.find(att => att.employeeId === employeeId);
  };

  const handleClockAction = async (employeeId: string, type: 'clock_in' | 'clock_out' | 'break_start' | 'break_end') => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/attendance/${type.replace('_', '-')}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          employeeId,
          type,
          timestamp: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        const employee = employees.find(e => e._id === employeeId);
        toast({
          title: 'Success',
          description: `${employee?.firstName} ${employee?.lastName} ${type.replace('_', ' ')}`,
        });
        loadAttendance();
        onRefresh();
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.message || `Failed to ${type.replace('_', ' ')}`,
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

  const handleManualEntry = async () => {
    if (!manualEntry.employeeId || !manualEntry.clockIn) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          ...manualEntry,
          date: format(selectedDate, 'yyyy-MM-dd'),
        }),
      });

      if (response.ok) {
        const employee = employees.find(e => e._id === manualEntry.employeeId);
        toast({
          title: 'Manual Entry Added',
          description: `Attendance recorded for ${employee?.firstName} ${employee?.lastName}`,
        });
        setIsManualEntryOpen(false);
        resetManualEntry();
        loadAttendance();
        onRefresh();
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.message || 'Failed to add manual entry',
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

  const loadAttendance = async () => {
    try {
      const response = await fetch(`/api/attendance?date=${format(selectedDate, 'yyyy-MM-dd')}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAttendance(data);
      }
    } catch (error) {
      console.error('Failed to load attendance:', error);
    }
  };

  const resetManualEntry = () => {
    setManualEntry({
      employeeId: '',
      clockIn: format(new Date(), 'HH:mm'),
      clockOut: '',
      breakStart: '',
      breakEnd: '',
      notes: '',
    });
  };

  const attendanceStats = {
    present: attendance.filter(a => a.status === 'present').length,
    late: attendance.filter(a => a.status === 'late').length,
    absent: activeEmployees.length - attendance.length,
    totalHours: attendance.reduce((total, att) => total + calculateTotalHours(att), 0),
    avgHoursPerEmployee: attendance.length > 0 
      ? attendance.reduce((total, att) => total + calculateTotalHours(att), 0) / attendance.length 
      : 0,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Time Tracking</h2>
          <p className="text-muted-foreground">
            {format(selectedDate, 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedDate(subDays(selectedDate, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedDate(new Date())}
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedDate(addDays(selectedDate, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Dialog open={isManualEntryOpen} onOpenChange={setIsManualEntryOpen}>
            <DialogTrigger asChild>
              <Button className="bg-restaurant-primary hover:bg-restaurant-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                Manual Entry
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Manual Attendance Entry</DialogTitle>
                <DialogDescription>
                  Record attendance for {format(selectedDate, 'MMMM d, yyyy')}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Employee</Label>
                  <Select
                    value={manualEntry.employeeId}
                    onValueChange={(value) => setManualEntry(prev => ({ ...prev, employeeId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeEmployees.map((employee) => (
                        <SelectItem key={employee._id} value={employee._id}>
                          <div className="flex items-center space-x-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={employee.avatar} />
                              <AvatarFallback className="text-xs">
                                {getInitials(employee.firstName, employee.lastName)}
                              </AvatarFallback>
                            </Avatar>
                            <span>{employee.firstName} {employee.lastName}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Clock In</Label>
                    <Input
                      type="time"
                      value={manualEntry.clockIn}
                      onChange={(e) => setManualEntry(prev => ({ ...prev, clockIn: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Clock Out</Label>
                    <Input
                      type="time"
                      value={manualEntry.clockOut}
                      onChange={(e) => setManualEntry(prev => ({ ...prev, clockOut: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Break Start (optional)</Label>
                    <Input
                      type="time"
                      value={manualEntry.breakStart}
                      onChange={(e) => setManualEntry(prev => ({ ...prev, breakStart: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Break End (optional)</Label>
                    <Input
                      type="time"
                      value={manualEntry.breakEnd}
                      onChange={(e) => setManualEntry(prev => ({ ...prev, breakEnd: e.target.value }))}
                    />
                  </div>
                </div>
                <div>
                  <Label>Notes (optional)</Label>
                  <Input
                    value={manualEntry.notes}
                    onChange={(e) => setManualEntry(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Any additional notes..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsManualEntryOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleManualEntry}
                  disabled={!manualEntry.employeeId || !manualEntry.clockIn || isLoading}
                  className="bg-restaurant-primary hover:bg-restaurant-primary/90"
                >
                  {isLoading ? 'Adding...' : 'Add Entry'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center">
              <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
              Present
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{attendanceStats.present}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center">
              <AlertCircle className="h-4 w-4 mr-2 text-yellow-600" />
              Late
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{attendanceStats.late}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center">
              <XCircle className="h-4 w-4 mr-2 text-red-600" />
              Absent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{attendanceStats.absent}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {attendanceStats.totalHours.toFixed(1)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Avg Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-restaurant-primary">
              {attendanceStats.avgHoursPerEmployee.toFixed(1)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="today" className="w-full">
        <TabsList>
          <TabsTrigger value="today">Today's Attendance</TabsTrigger>
          <TabsTrigger value="clock">Quick Clock</TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Attendance Records</CardTitle>
              <CardDescription>
                {format(selectedDate, 'MMMM d, yyyy')} attendance overview
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activeEmployees.map((employee) => {
                  const empAttendance = getEmployeeAttendance(employee._id);
                  return (
                    <div
                      key={employee._id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={employee.avatar} />
                          <AvatarFallback className="bg-restaurant-primary/10 text-restaurant-primary">
                            {getInitials(employee.firstName, employee.lastName)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-semibold">
                            {employee.firstName} {employee.lastName}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {employee.position} • {employee.role}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-6">
                        {empAttendance ? (
                          <>
                            <div className="text-center">
                              <div className="text-xs text-muted-foreground">Clock In</div>
                              <div className="text-sm font-medium">
                                {formatTime(empAttendance.clockIn)}
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-xs text-muted-foreground">Clock Out</div>
                              <div className="text-sm font-medium">
                                {formatTime(empAttendance.clockOut)}
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-xs text-muted-foreground">Total Hours</div>
                              <div className="text-sm font-medium">
                                {calculateTotalHours(empAttendance).toFixed(1)}h
                              </div>
                            </div>
                            <Badge
                              variant="secondary"
                              className={`${getStatusColor(empAttendance.status)} flex items-center space-x-1`}
                            >
                              {getStatusIcon(empAttendance.status)}
                              <span>{empAttendance.status.replace('_', ' ')}</span>
                            </Badge>
                          </>
                        ) : (
                          <>
                            <div className="text-center">
                              <div className="text-xs text-muted-foreground">Clock In</div>
                              <div className="text-sm font-medium">--:--</div>
                            </div>
                            <div className="text-center">
                              <div className="text-xs text-muted-foreground">Clock Out</div>
                              <div className="text-sm font-medium">--:--</div>
                            </div>
                            <div className="text-center">
                              <div className="text-xs text-muted-foreground">Total Hours</div>
                              <div className="text-sm font-medium">0.0h</div>
                            </div>
                            <Badge
                              variant="secondary"
                              className="bg-gray-100 text-gray-800 flex items-center space-x-1"
                            >
                              <XCircle className="h-4 w-4 text-gray-600" />
                              <span>No Record</span>
                            </Badge>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clock" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {activeEmployees.map((employee) => {
              const empAttendance = getEmployeeAttendance(employee._id);
              const isClockedIn = empAttendance?.clockIn && !empAttendance.clockOut;
              const isOnBreak = empAttendance?.breakStart && !empAttendance.breakEnd;
              
              return (
                <Card key={employee._id}>
                  <CardHeader className="pb-4">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={employee.avatar} />
                        <AvatarFallback className="bg-restaurant-primary/10 text-restaurant-primary">
                          {getInitials(employee.firstName, employee.lastName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">
                          {employee.firstName} {employee.lastName}
                        </CardTitle>
                        <CardDescription>{employee.position}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Status:</span>
                        <Badge
                          variant="secondary"
                          className={
                            isClockedIn 
                              ? isOnBreak 
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }
                        >
                          {isClockedIn 
                            ? isOnBreak 
                              ? 'On Break' 
                              : 'Clocked In'
                            : 'Clocked Out'
                          }
                        </Badge>
                      </div>
                      
                      {empAttendance && (
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Clock In:</span>
                            <span>{formatTime(empAttendance.clockIn)}</span>
                          </div>
                          {empAttendance.clockOut && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Clock Out:</span>
                              <span>{formatTime(empAttendance.clockOut)}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Hours:</span>
                            <span>{calculateTotalHours(empAttendance).toFixed(1)}h</span>
                          </div>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2 pt-2">
                        {!isClockedIn && isToday(selectedDate) && (
                          <Button
                            size="sm"
                            onClick={() => handleClockAction(employee._id, 'clock_in')}
                            disabled={isLoading}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Clock className="h-4 w-4 mr-1" />
                            Clock In
                          </Button>
                        )}
                        
                        {isClockedIn && !isOnBreak && isToday(selectedDate) && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleClockAction(employee._id, 'break_start')}
                              disabled={isLoading}
                            >
                              <Coffee className="h-4 w-4 mr-1" />
                              Start Break
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleClockAction(employee._id, 'clock_out')}
                              disabled={isLoading}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              <Timer className="h-4 w-4 mr-1" />
                              Clock Out
                            </Button>
                          </>
                        )}
                        
                        {isOnBreak && isToday(selectedDate) && (
                          <Button
                            size="sm"
                            onClick={() => handleClockAction(employee._id, 'break_end')}
                            disabled={isLoading}
                            className="bg-yellow-600 hover:bg-yellow-700"
                          >
                            <Coffee className="h-4 w-4 mr-1" />
                            End Break
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}