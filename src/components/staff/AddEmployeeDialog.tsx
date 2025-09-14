import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getApiUrl } from '@/config/api';
import { toast } from '@/hooks/use-toast';
import { CreateEmployeeInput, EmployeeRole } from '@/types/staff.types';

interface AddEmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AddEmployeeDialog({ open, onOpenChange, onSuccess }: AddEmployeeDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<CreateEmployeeInput>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'server',
    department: '',
    position: '',
    hireDate: new Date().toISOString().split('T')[0],
    hourlyRate: 15,
    weeklyHours: 40,
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
    },
    emergencyContact: {
      name: '',
      relationship: '',
      phone: '',
    },
    dateOfBirth: '',
  });

  const handleInputChange = (field: string, value: string | number) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof CreateEmployeeInput] as any),
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Map employee roles to valid user roles that backend accepts
      const roleMapping: Record<string, string> = {
        'admin': 'admin',
        'manager': 'manager', 
        'chef': 'staff',
        'server': 'staff',
        'host': 'staff',
        'cashier': 'staff',
        'cleaner': 'staff',
        'delivery': 'staff',
      };

      // Transform the complex employee data to simple user data that backend expects
      const userData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        role: roleMapping[formData.role] || 'staff', // Default to 'staff' for unknown roles
        password: 'TempPassword123!', // Temporary password - user should change on first login
        mustChangePassword: true,
      };

      const response = await fetch(getApiUrl('users'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(userData),
      });

      if (response.ok) {
        toast({
          title: 'Employee Added',
          description: `${formData.firstName} ${formData.lastName} has been added successfully`,
        });
        onSuccess();
        resetForm();
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.message || 'Failed to add employee',
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

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      role: 'server',
      department: '',
      position: '',
      hireDate: new Date().toISOString().split('T')[0],
      hourlyRate: 15,
      weeklyHours: 40,
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
      },
      emergencyContact: {
        name: '',
        relationship: '',
        phone: '',
      },
      dateOfBirth: '',
    });
  };

  const departments = {
    admin: 'Administration',
    manager: 'Management',
    chef: 'Kitchen',
    server: 'Front of House',
    host: 'Front of House',
    cashier: 'Front of House',
    cleaner: 'Maintenance',
    delivery: 'Delivery',
  };

  const positions = {
    admin: ['System Administrator', 'HR Manager', 'Office Manager'],
    manager: ['General Manager', 'Assistant Manager', 'Shift Manager'],
    chef: ['Head Chef', 'Sous Chef', 'Line Cook', 'Prep Cook'],
    server: ['Server', 'Lead Server', 'Food Runner'],
    host: ['Host', 'Hostess', 'Greeter'],
    cashier: ['Cashier', 'Lead Cashier'],
    cleaner: ['Janitor', 'Dishwasher', 'Maintenance'],
    delivery: ['Delivery Driver', 'Delivery Coordinator'],
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Employee</DialogTitle>
          <DialogDescription>
            Fill out the employee information to add them to the system.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="employment">Employment</TabsTrigger>
              <TabsTrigger value="contact">Contact & Emergency</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Personal Information</CardTitle>
                  <CardDescription>Basic personal details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone *</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="employment" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Employment Details</CardTitle>
                  <CardDescription>Role, department, and compensation</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="role">Role *</Label>
                      <Select
                        value={formData.role}
                        onValueChange={(value) => {
                          handleInputChange('role', value);
                          handleInputChange('department', departments[value as EmployeeRole]);
                          handleInputChange('position', '');
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
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
                      <Label htmlFor="department">Department</Label>
                      <Input
                        id="department"
                        value={formData.department}
                        onChange={(e) => handleInputChange('department', e.target.value)}
                        disabled
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="position">Position *</Label>
                    <Select
                      value={formData.position}
                      onValueChange={(value) => handleInputChange('position', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select position" />
                      </SelectTrigger>
                      <SelectContent>
                        {positions[formData.role]?.map((pos) => (
                          <SelectItem key={pos} value={pos}>
                            {pos}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="hireDate">Hire Date *</Label>
                      <Input
                        id="hireDate"
                        type="date"
                        value={formData.hireDate}
                        onChange={(e) => handleInputChange('hireDate', e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="hourlyRate">Hourly Rate ($) *</Label>
                      <Input
                        id="hourlyRate"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.hourlyRate}
                        onChange={(e) => handleInputChange('hourlyRate', parseFloat(e.target.value))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="weeklyHours">Weekly Hours *</Label>
                      <Input
                        id="weeklyHours"
                        type="number"
                        min="0"
                        max="60"
                        value={formData.weeklyHours}
                        onChange={(e) => handleInputChange('weeklyHours', parseInt(e.target.value))}
                        required
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="contact" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Address</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="street">Street Address *</Label>
                    <Input
                      id="street"
                      value={formData.address.street}
                      onChange={(e) => handleInputChange('address.street', e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        value={formData.address.city}
                        onChange={(e) => handleInputChange('address.city', e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">State *</Label>
                      <Input
                        id="state"
                        value={formData.address.state}
                        onChange={(e) => handleInputChange('address.state', e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="zipCode">Zip Code *</Label>
                      <Input
                        id="zipCode"
                        value={formData.address.zipCode}
                        onChange={(e) => handleInputChange('address.zipCode', e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Emergency Contact</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="emergencyName">Name *</Label>
                      <Input
                        id="emergencyName"
                        value={formData.emergencyContact.name}
                        onChange={(e) => handleInputChange('emergencyContact.name', e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="relationship">Relationship *</Label>
                      <Input
                        id="relationship"
                        value={formData.emergencyContact.relationship}
                        onChange={(e) => handleInputChange('emergencyContact.relationship', e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="emergencyPhone">Phone *</Label>
                    <Input
                      id="emergencyPhone"
                      value={formData.emergencyContact.phone}
                      onChange={(e) => handleInputChange('emergencyContact.phone', e.target.value)}
                      required
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading}
              className="bg-restaurant-primary hover:bg-restaurant-primary/90"
            >
              {isLoading ? 'Adding...' : 'Add Employee'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}