import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Edit, Trash2, Phone, Mail, MapPin, Calendar, DollarSign, Clock, User } from 'lucide-react';
import { Employee, EmployeeRole, EmploymentStatus } from '@/types/staff.types';
import { toast } from '@/hooks/use-toast';
import { formatDistanceToNow, format } from 'date-fns';

interface EmployeeDetailsDialogProps {
  employee: Employee;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

export function EmployeeDetailsDialog({ 
  employee, 
  open, 
  onOpenChange, 
  onUpdate 
}: EmployeeDetailsDialogProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState(employee);

  const handleInputChange = (field: string, value: string | number) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof Employee] as any),
          [child]: value,
        },
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const handleUpdate = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/employees/${employee._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({
          title: 'Employee Updated',
          description: `${formData.firstName} ${formData.lastName}'s information has been updated`,
        });
        onUpdate();
        setIsEditing(false);
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.message || 'Failed to update employee',
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

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/employees/${employee._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        toast({
          title: 'Employee Deleted',
          description: `${employee.firstName} ${employee.lastName} has been removed from the system`,
        });
        onUpdate();
        onOpenChange(false);
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.message || 'Failed to delete employee',
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

  const getRoleColor = (role: string) => {
    const colors = {
      admin: 'bg-purple-100 text-purple-800',
      manager: 'bg-blue-100 text-blue-800',
      chef: 'bg-orange-100 text-orange-800',
      server: 'bg-green-100 text-green-800',
      host: 'bg-pink-100 text-pink-800',
      cashier: 'bg-yellow-100 text-yellow-800',
      cleaner: 'bg-gray-100 text-gray-800',
      delivery: 'bg-indigo-100 text-indigo-800',
    };
    return colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={employee.avatar} />
                <AvatarFallback className="bg-restaurant-primary/10 text-restaurant-primary text-lg">
                  {getInitials(employee.firstName, employee.lastName)}
                </AvatarFallback>
              </Avatar>
              <div>
                <DialogTitle className="text-xl">
                  {employee.firstName} {employee.lastName}
                </DialogTitle>
                <DialogDescription className="flex items-center gap-2 mt-1">
                  <span>{employee.employeeId}</span>
                  <Badge variant="secondary" className={getRoleColor(employee.role)}>
                    {employee.role}
                  </Badge>
                  <Badge variant="secondary" className={getStatusColor(employee.status)}>
                    {employee.status.replace('_', ' ')}
                  </Badge>
                </DialogDescription>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
                disabled={isLoading}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isLoading}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Employee</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete {employee.firstName} {employee.lastName}? 
                      This action cannot be undone and will remove all associated data.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="employment">Employment</TabsTrigger>
            <TabsTrigger value="contact">Contact</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Hourly Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-restaurant-primary">
                    ${employee.hourlyRate.toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground">per hour</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    Weekly Hours
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {employee.weeklyHours}
                  </div>
                  <p className="text-xs text-muted-foreground">hours per week</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    Tenure
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {formatDistanceToNow(new Date(employee.hireDate))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    since {format(new Date(employee.hireDate), 'MMM d, yyyy')}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium min-w-0">Position:</span>
                  <span className="text-sm">{employee.position}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium min-w-0">Email:</span>
                  <span className="text-sm">{employee.email}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium min-w-0">Phone:</span>
                  <span className="text-sm">{employee.phone}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium min-w-0">Department:</span>
                  <span className="text-sm">{employee.department}</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="employment" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Employment Details</CardTitle>
                {isEditing && (
                  <CardDescription>
                    Edit employment information for {employee.firstName} {employee.lastName}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Role</Label>
                        <Select
                          value={formData.role}
                          onValueChange={(value) => handleInputChange('role', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
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
                      </div>
                      <div>
                        <Label>Status</Label>
                        <Select
                          value={formData.status}
                          onValueChange={(value) => handleInputChange('status', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                            <SelectItem value="on_leave">On Leave</SelectItem>
                            <SelectItem value="terminated">Terminated</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Hourly Rate ($)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.hourlyRate}
                          onChange={(e) => handleInputChange('hourlyRate', parseFloat(e.target.value))}
                        />
                      </div>
                      <div>
                        <Label>Weekly Hours</Label>
                        <Input
                          type="number"
                          value={formData.weeklyHours}
                          onChange={(e) => handleInputChange('weeklyHours', parseInt(e.target.value))}
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div>
                        <Label className="text-muted-foreground">Role</Label>
                        <p className="text-sm font-medium">{employee.role}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Department</Label>
                        <p className="text-sm font-medium">{employee.department}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Position</Label>
                        <p className="text-sm font-medium">{employee.position}</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-muted-foreground">Hire Date</Label>
                        <p className="text-sm font-medium">
                          {format(new Date(employee.hireDate), 'MMM d, yyyy')}
                        </p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Hourly Rate</Label>
                        <p className="text-sm font-medium">${employee.hourlyRate.toFixed(2)}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Weekly Hours</Label>
                        <p className="text-sm font-medium">{employee.weeklyHours} hours</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contact" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Address</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{employee.address.street}</p>
                  <p className="text-sm">
                    {employee.address.city}, {employee.address.state} {employee.address.zipCode}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Emergency Contact</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <Label className="text-muted-foreground">Name</Label>
                    <p className="text-sm font-medium">{employee.emergencyContact.name}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Relationship</Label>
                    <p className="text-sm font-medium">{employee.emergencyContact.relationship}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Phone</Label>
                    <p className="text-sm font-medium">{employee.emergencyContact.phone}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Performance Overview</CardTitle>
                <CardDescription>
                  Performance metrics and reviews will be displayed here
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center py-8">
                  Performance tracking coming soon...
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {isEditing && (
          <DialogFooter className="mt-6">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsEditing(false);
                setFormData(employee);
              }}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpdate}
              disabled={isLoading}
              className="bg-restaurant-primary hover:bg-restaurant-primary/90"
            >
              {isLoading ? 'Updating...' : 'Update Employee'}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}