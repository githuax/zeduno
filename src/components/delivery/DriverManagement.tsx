import { useState } from 'react';
import { Plus, Users, Car, Bike, MapPin, Clock, Star, Phone, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Driver, DriverStatus, VehicleType } from '@/types/delivery.types';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface DriverManagementProps {
  drivers: Driver[];
  onRefresh: () => void;
}

const statusColors: Record<DriverStatus, string> = {
  available: 'bg-green-100 text-green-800',
  busy: 'bg-orange-100 text-orange-800',
  offline: 'bg-gray-100 text-gray-800',
  break: 'bg-blue-100 text-blue-800',
};

const vehicleIcons: Record<VehicleType, React.ReactNode> = {
  bike: <Bike className="h-4 w-4" />,
  scooter: <Car className="h-4 w-4" />,
  car: <Car className="h-4 w-4" />,
  walk: <Users className="h-4 w-4" />,
};

export function DriverManagement({ drivers, onRefresh }: DriverManagementProps) {
  const [isAddDriverOpen, setIsAddDriverOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    vehicleType: 'bike' as VehicleType,
    vehicleNumber: '',
    shiftStart: '09:00',
    shiftEnd: '21:00',
  });

  const stats = {
    total: drivers.length,
    available: drivers.filter(d => d.status === 'available').length,
    busy: drivers.filter(d => d.status === 'busy').length,
    onBreak: drivers.filter(d => d.status === 'break').length,
    offline: drivers.filter(d => d.status === 'offline').length,
    avgRating: drivers.length > 0 ? (drivers.reduce((sum, d) => sum + d.rating, 0) / drivers.length).toFixed(1) : '0',
  };

  const handleAddDriver = () => {
    setEditingDriver(null);
    setFormData({
      name: '',
      phone: '',
      email: '',
      vehicleType: 'bike',
      vehicleNumber: '',
      shiftStart: '09:00',
      shiftEnd: '21:00',
    });
    setIsAddDriverOpen(true);
  };

  const handleEditDriver = (driver: Driver) => {
    setEditingDriver(driver);
    setFormData({
      name: driver.name,
      phone: driver.phone,
      email: driver.email,
      vehicleType: driver.vehicleType,
      vehicleNumber: driver.vehicleNumber,
      shiftStart: driver.shift.start,
      shiftEnd: driver.shift.end,
    });
    setIsAddDriverOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingDriver ? `/api/drivers/${editingDriver._id}` : '/api/drivers';
      const method = editingDriver ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          ...formData,
          shift: {
            start: formData.shiftStart,
            end: formData.shiftEnd,
          },
        }),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: `Driver ${editingDriver ? 'updated' : 'added'} successfully`,
        });
        setIsAddDriverOpen(false);
        onRefresh();
      } else {
        throw new Error(`Failed to ${editingDriver ? 'update' : 'add'} driver`);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to ${editingDriver ? 'update' : 'add'} driver`,
        variant: 'destructive',
      });
    }
  };

  const handleStatusChange = async (driverId: string, status: DriverStatus) => {
    try {
      const response = await fetch(`/api/drivers/${driverId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        toast({
          title: 'Status Updated',
          description: 'Driver status has been updated',
        });
        onRefresh();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update driver status',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteDriver = async (driverId: string) => {
    if (!confirm('Are you sure you want to delete this driver?')) return;
    
    try {
      const response = await fetch(`/api/drivers/${driverId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        toast({
          title: 'Driver Deleted',
          description: 'Driver has been removed from the system',
        });
        onRefresh();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete driver',
        variant: 'destructive',
      });
    }
  };

  const getOnlineStatus = (driver: Driver): boolean => {
    if (driver.status === 'offline') return false;
    
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const [startHour, startMin] = driver.shift.start.split(':').map(Number);
    const [endHour, endMin] = driver.shift.end.split(':').map(Number);
    const shiftStart = startHour * 60 + startMin;
    const shiftEnd = endHour * 60 + endMin;
    
    return currentTime >= shiftStart && currentTime <= shiftEnd;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Driver Management</h2>
          <p className="text-muted-foreground">Manage delivery drivers and their assignments</p>
        </div>
        <Button onClick={handleAddDriver} className="bg-restaurant-primary hover:bg-restaurant-primary/90">
          <Plus className="mr-2 h-4 w-4" />
          Add Driver
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Drivers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Available</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.available}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Busy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.busy}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">On Break</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.onBreak}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Offline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{stats.offline}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.avgRating} ⭐</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {drivers.map((driver) => {
          const isOnline = getOnlineStatus(driver);
          
          return (
            <Card key={driver._id} className={cn(
              "relative",
              !isOnline && "opacity-75"
            )}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>
                        {driver.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">{driver.name}</h3>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        {vehicleIcons[driver.vehicleType]}
                        <span>{driver.vehicleNumber}</span>
                      </div>
                    </div>
                  </div>
                  <Badge className={statusColors[driver.status]}>
                    {driver.status}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-3 w-3 text-muted-foreground" />
                    <span>{driver.phone}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span>{driver.shift.start} - {driver.shift.end}</span>
                    {!isOnline && (
                      <Badge variant="outline" className="text-xs">Off Hours</Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Star className="h-3 w-3 text-yellow-500" />
                    <span>{driver.rating.toFixed(1)} ({driver.totalDeliveries} deliveries)</span>
                  </div>

                  {driver.currentLocation && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-3 w-3 text-green-500" />
                      <span className="text-green-600">Live location</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(driver.currentLocation.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  )}

                  <div className="flex gap-1 pt-2">
                    <Select
                      value={driver.status}
                      onValueChange={(status) => handleStatusChange(driver._id, status as DriverStatus)}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available">Available</SelectItem>
                        <SelectItem value="busy">Busy</SelectItem>
                        <SelectItem value="break">On Break</SelectItem>
                        <SelectItem value="offline">Offline</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditDriver(driver)}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteDriver(driver._id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={isAddDriverOpen} onOpenChange={setIsAddDriverOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingDriver ? 'Edit Driver' : 'Add New Driver'}</DialogTitle>
            <DialogDescription>
              {editingDriver ? 'Update driver information' : 'Add a new driver to the delivery team'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="vehicleType">Vehicle Type</Label>
                <Select
                  value={formData.vehicleType}
                  onValueChange={(value) => setFormData({...formData, vehicleType: value as VehicleType})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bike">Bike</SelectItem>
                    <SelectItem value="scooter">Scooter</SelectItem>
                    <SelectItem value="car">Car</SelectItem>
                    <SelectItem value="walk">Walking</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="vehicleNumber">Vehicle Number</Label>
                <Input
                  id="vehicleNumber"
                  value={formData.vehicleNumber}
                  onChange={(e) => setFormData({...formData, vehicleNumber: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="shiftStart">Shift Start</Label>
                <Input
                  id="shiftStart"
                  type="time"
                  value={formData.shiftStart}
                  onChange={(e) => setFormData({...formData, shiftStart: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="shiftEnd">Shift End</Label>
                <Input
                  id="shiftEnd"
                  type="time"
                  value={formData.shiftEnd}
                  onChange={(e) => setFormData({...formData, shiftEnd: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" className="flex-1">
                {editingDriver ? 'Update Driver' : 'Add Driver'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setIsAddDriverOpen(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}