import { formatDistanceToNow } from 'date-fns';
import { Clock, Clock8, Phone, Mail, MapPin, Users, ToggleLeft, ToggleRight } from 'lucide-react';
import { useState } from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Employee } from '@/types/staff.types';


interface EmployeeListProps {
  employees: Employee[];
  onEmployeeClick: (employee: Employee) => void;
  onClockIn: (employeeId: string) => Promise<void>;
  onClockOut: (employeeId: string) => Promise<void>;
  onStatusToggle: (employeeId: string, currentStatus: string) => Promise<void>;
  isLoading: boolean;
  roleColors: Record<string, string>;
}

export function EmployeeList({ 
  employees, 
  onEmployeeClick, 
  onClockIn, 
  onClockOut, 
  onStatusToggle,
  isLoading,
  roleColors 
}: EmployeeListProps) {
  const [clockingEmployees, setClockingEmployees] = useState<Set<string>>(new Set());
  const [statusToggling, setStatusToggling] = useState<Set<string>>(new Set());

  const handleClockAction = async (employeeId: string, action: 'in' | 'out') => {
    setClockingEmployees(prev => new Set([...prev, employeeId]));
    try {
      if (action === 'in') {
        await onClockIn(employeeId);
      } else {
        await onClockOut(employeeId);
      }
    } finally {
      setClockingEmployees(prev => {
        const newSet = new Set(prev);
        newSet.delete(employeeId);
        return newSet;
      });
    }
  };

  const handleStatusToggle = async (employeeId: string, currentStatus: string) => {
    setStatusToggling(prev => new Set([...prev, employeeId]));
    try {
      await onStatusToggle(employeeId, currentStatus);
    } finally {
      setStatusToggling(prev => {
        const newSet = new Set(prev);
        newSet.delete(employeeId);
        return newSet;
      });
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'on_leave':
        return 'bg-yellow-100 text-yellow-800';
      case 'terminated':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (employees.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Users className="mx-auto h-12 w-12 mb-4 opacity-50" />
        <p>No employees found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {employees.map((employee) => (
        <Card 
          key={employee._id} 
          className="hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => onEmployeeClick(employee)}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={employee.avatar} />
                  <AvatarFallback className="bg-restaurant-primary/10 text-restaurant-primary">
                    {getInitials(employee.firstName, employee.lastName)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-sm">
                    {employee.firstName} {employee.lastName}
                  </h3>
                  <p className="text-xs text-muted-foreground">{employee.employeeId}</p>
                </div>
              </div>
              <div className="flex flex-col items-end space-y-1">
                <Badge 
                  variant="secondary" 
                  className={`text-xs ${roleColors[employee.role] || 'bg-gray-100 text-gray-800'}`}
                >
                  {employee.role}
                </Badge>
                <Badge 
                  variant="secondary" 
                  className={`text-xs ${getStatusColor(employee.status)}`}
                >
                  {employee.status.replace('_', ' ')}
                </Badge>
              </div>
            </div>

            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex items-center space-x-2">
                <MapPin className="h-3 w-3" />
                <span className="truncate">{employee.position}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="h-3 w-3" />
                <span className="truncate">{employee.email}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="h-3 w-3" />
                <span>{employee.phone}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="h-3 w-3" />
                  <span>${employee.hourlyRate}/hr</span>
                </div>
                <span className="text-restaurant-primary font-medium">
                  {employee.weeklyHours}h/week
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between mt-4 pt-3 border-t">
              <span className="text-xs text-muted-foreground">
                Hired {formatDistanceToNow(new Date(employee.hireDate), { addSuffix: true })}
              </span>
              <div className="flex space-x-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClockAction(employee._id, 'in');
                  }}
                  disabled={clockingEmployees.has(employee._id)}
                  className="h-7 px-2 text-xs"
                >
                  <Clock8 className="h-3 w-3 mr-1" />
                  In
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClockAction(employee._id, 'out');
                  }}
                  disabled={clockingEmployees.has(employee._id)}
                  className="h-7 px-2 text-xs"
                >
                  <Clock className="h-3 w-3 mr-1" />
                  Out
                </Button>
                <Button
                  size="sm"
                  variant={employee.status === 'active' ? 'default' : 'secondary'}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStatusToggle(employee._id, employee.status);
                  }}
                  disabled={statusToggling.has(employee._id)}
                  className="h-7 px-2 text-xs"
                  title={`Toggle status (currently ${employee.status})`}
                >
                  {employee.status === 'active' ? 
                    <ToggleRight className="h-3 w-3" /> : 
                    <ToggleLeft className="h-3 w-3" />
                  }
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}