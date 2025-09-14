import { format, addDays, startOfWeek, endOfWeek, isSameDay, parseISO } from 'date-fns';
import { Calendar, Clock, Plus, Users, ChevronLeft, ChevronRight, Edit, X } from 'lucide-react';
import { useState } from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Employee, Shift, CreateShiftInput, ShiftStatus } from '@/types/staff.types';


interface ShiftSchedulingProps {
  employees: Employee[];
  onRefresh: () => void;
}

export function ShiftScheduling({ employees, onRefresh }: ShiftSchedulingProps) {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [shifts, setShifts] = useState<Shift[]>([]);
  
  const [newShift, setNewShift] = useState<CreateShiftInput>({
    employeeId: '',
    date: format(selectedDate, 'yyyy-MM-dd'),
    startTime: '09:00',
    endTime: '17:00',
    breakDuration: 30,
    notes: '',
  });

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 0 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const activeEmployees = employees.filter(emp => emp.status === 'active');

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getShiftStatusColor = (status: ShiftStatus) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'started':
        return 'bg-green-100 text-green-800';
      case 'on_break':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'missed':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateShiftHours = (startTime: string, endTime: string, breakDuration: number) => {
    const start = new Date(`2000-01-01 ${startTime}`);
    const end = new Date(`2000-01-01 ${endTime}`);
    const totalMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
    return Math.max(0, (totalMinutes - breakDuration) / 60);
  };

  const handleCreateShift = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/shifts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(newShift),
      });

      if (response.ok) {
        const employee = employees.find(e => e._id === newShift.employeeId);
        toast({
          title: 'Shift Created',
          description: `Shift scheduled for ${employee?.firstName} ${employee?.lastName}`,
        });
        setIsCreateDialogOpen(false);
        resetNewShift();
        onRefresh();
        loadWeekShifts();
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.message || 'Failed to create shift',
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

  const handleUpdateShiftStatus = async (shiftId: string, status: ShiftStatus) => {
    try {
      const response = await fetch(`/api/shifts/${shiftId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        toast({
          title: 'Shift Updated',
          description: `Shift status changed to ${status}`,
        });
        loadWeekShifts();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update shift',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteShift = async (shiftId: string) => {
    try {
      const response = await fetch(`/api/shifts/${shiftId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        toast({
          title: 'Shift Deleted',
          description: 'Shift has been removed from the schedule',
        });
        loadWeekShifts();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete shift',
        variant: 'destructive',
      });
    }
  };

  const loadWeekShifts = async () => {
    try {
      const response = await fetch(`/api/shifts?startDate=${format(weekStart, 'yyyy-MM-dd')}&endDate=${format(weekEnd, 'yyyy-MM-dd')}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setShifts(data);
      }
    } catch (error) {
      console.error('Failed to load shifts:', error);
    }
  };

  const resetNewShift = () => {
    setNewShift({
      employeeId: '',
      date: format(selectedDate, 'yyyy-MM-dd'),
      startTime: '09:00',
      endTime: '17:00',
      breakDuration: 30,
      notes: '',
    });
  };

  const getShiftsForDate = (date: Date) => {
    return shifts.filter(shift => isSameDay(parseISO(shift.date), date));
  };

  const getEmployeeShift = (employeeId: string, date: Date) => {
    return shifts.find(shift => 
      shift.employeeId === employeeId && 
      isSameDay(parseISO(shift.date), date)
    );
  };

  const weeklyStats = {
    totalShifts: shifts.length,
    scheduledHours: shifts.reduce((total, shift) => 
      total + calculateShiftHours(shift.startTime, shift.endTime, shift.breakDuration), 0
    ),
    employeesScheduled: new Set(shifts.map(s => s.employeeId)).size,
    avgShiftsPerDay: shifts.length / 7,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Shift Scheduling</h2>
          <p className="text-muted-foreground">
            {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentWeek(addDays(currentWeek, -7))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentWeek(new Date())}
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentWeek(addDays(currentWeek, 7))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-restaurant-primary hover:bg-restaurant-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                Add Shift
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Schedule New Shift</DialogTitle>
                <DialogDescription>
                  Create a new shift for an employee
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Employee</Label>
                  <Select
                    value={newShift.employeeId}
                    onValueChange={(value) => setNewShift(prev => ({ ...prev, employeeId: value }))}
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
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={newShift.date}
                      onChange={(e) => setNewShift(prev => ({ ...prev, date: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Start Time</Label>
                    <Input
                      type="time"
                      value={newShift.startTime}
                      onChange={(e) => setNewShift(prev => ({ ...prev, startTime: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>End Time</Label>
                    <Input
                      type="time"
                      value={newShift.endTime}
                      onChange={(e) => setNewShift(prev => ({ ...prev, endTime: e.target.value }))}
                    />
                  </div>
                </div>
                <div>
                  <Label>Break Duration (minutes)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="120"
                    value={newShift.breakDuration}
                    onChange={(e) => setNewShift(prev => ({ ...prev, breakDuration: parseInt(e.target.value) }))}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Total hours: {calculateShiftHours(newShift.startTime, newShift.endTime, newShift.breakDuration).toFixed(1)}
                  </p>
                </div>
                <div>
                  <Label>Notes (optional)</Label>
                  <Input
                    value={newShift.notes}
                    onChange={(e) => setNewShift(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Any additional notes..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateShift}
                  disabled={!newShift.employeeId || isLoading}
                  className="bg-restaurant-primary hover:bg-restaurant-primary/90"
                >
                  {isLoading ? 'Creating...' : 'Create Shift'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Shifts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{weeklyStats.totalShifts}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Scheduled Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{weeklyStats.scheduledHours.toFixed(1)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Employees</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{weeklyStats.employeesScheduled}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Avg Per Day</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{weeklyStats.avgShiftsPerDay.toFixed(1)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Weekly Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-8 gap-2 text-sm font-medium text-muted-foreground">
              <div>Employee</div>
              {weekDays.map((day, index) => (
                <div key={index} className="text-center">
                  <div>{format(day, 'EEE')}</div>
                  <div className="text-xs">{format(day, 'MMM d')}</div>
                </div>
              ))}
            </div>
            
            {activeEmployees.map((employee) => (
              <div key={employee._id} className="grid grid-cols-8 gap-2 py-2 border-t">
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
                      {employee.role}
                    </div>
                  </div>
                </div>
                
                {weekDays.map((day, dayIndex) => {
                  const shift = getEmployeeShift(employee._id, day);
                  return (
                    <div key={dayIndex} className="text-center">
                      {shift ? (
                        <div className="space-y-1">
                          <Badge
                            variant="secondary"
                            className={`text-xs ${getShiftStatusColor(shift.status)}`}
                          >
                            {shift.startTime} - {shift.endTime}
                          </Badge>
                          <div className="flex justify-center space-x-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0"
                              onClick={() => setSelectedShift(shift)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                              onClick={() => handleDeleteShift(shift._id)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 rounded-full border-2 border-dashed border-muted-foreground/25 hover:border-restaurant-primary/50"
                          onClick={() => {
                            setSelectedDate(day);
                            setNewShift(prev => ({
                              ...prev,
                              employeeId: employee._id,
                              date: format(day, 'yyyy-MM-dd')
                            }));
                            setIsCreateDialogOpen(true);
                          }}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}