import { Calendar, Clock, Users, Phone, User } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { Table } from '@/types/order.types';

interface ReservationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tables: Table[];
  onSuccess: () => void;
}

export function ReservationDialog({
  open,
  onOpenChange,
  tables,
  onSuccess,
}: ReservationDialogProps) {
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    date: '',
    time: '',
    partySize: '',
    tableId: '',
    specialRequests: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.customerName || !formData.date || !formData.time || !formData.partySize || !formData.tableId) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Update table status to reserved
      const response = await fetch(`/api/tables/${formData.tableId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ status: 'reserved' }),
      });

      if (response.ok) {
        // In a real app, you'd also save the reservation details
        toast({
          title: 'Success',
          description: `Reservation confirmed for ${formData.customerName}`,
        });
        onSuccess();
        onOpenChange(false);
        resetForm();
      } else {
        throw new Error('Failed to create reservation');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create reservation',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      customerName: '',
      customerPhone: '',
      date: '',
      time: '',
      partySize: '',
      tableId: '',
      specialRequests: '',
    });
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const availableTablesForParty = tables.filter(
    table => !formData.partySize || table.capacity >= parseInt(formData.partySize)
  );

  // Generate time slots
  const timeSlots = [];
  for (let hour = 11; hour <= 22; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      timeSlots.push(time);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Make a Reservation</DialogTitle>
          <DialogDescription>
            Book a table for your guests
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="customerName">
                <User className="h-3 w-3 inline mr-1" />
                Customer Name *
              </Label>
              <Input
                id="customerName"
                value={formData.customerName}
                onChange={(e) => handleChange('customerName', e.target.value)}
                placeholder="Enter name"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="customerPhone">
                <Phone className="h-3 w-3 inline mr-1" />
                Phone Number
              </Label>
              <Input
                id="customerPhone"
                value={formData.customerPhone}
                onChange={(e) => handleChange('customerPhone', e.target.value)}
                placeholder="Enter phone"
                type="tel"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date">
                <Calendar className="h-3 w-3 inline mr-1" />
                Date *
              </Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleChange('date', e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="time">
                <Clock className="h-3 w-3 inline mr-1" />
                Time *
              </Label>
              <Select value={formData.time} onValueChange={(value) => handleChange('time', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map(slot => (
                    <SelectItem key={slot} value={slot}>
                      {slot}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="partySize">
                <Users className="h-3 w-3 inline mr-1" />
                Party Size *
              </Label>
              <Select value={formData.partySize} onValueChange={(value) => handleChange('partySize', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Number of guests" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(size => (
                    <SelectItem key={size} value={size.toString()}>
                      {size} {size === 1 ? 'Guest' : 'Guests'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="table">
                Table *
              </Label>
              <Select 
                value={formData.tableId} 
                onValueChange={(value) => handleChange('tableId', value)}
                disabled={!formData.partySize}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select table" />
                </SelectTrigger>
                <SelectContent>
                  {availableTablesForParty.map(table => (
                    <SelectItem key={table._id} value={table._id}>
                      Table {table.tableNumber} (Capacity: {table.capacity})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formData.partySize && availableTablesForParty.length === 0 && (
                <p className="text-xs text-red-500 mt-1">
                  No available tables for {formData.partySize} guests
                </p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="specialRequests">
              Special Requests
            </Label>
            <Textarea
              id="specialRequests"
              value={formData.specialRequests}
              onChange={(e) => handleChange('specialRequests', e.target.value)}
              placeholder="Any special requirements or notes..."
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              className="flex-1 bg-restaurant-primary hover:bg-restaurant-primary/90"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Confirm Reservation'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}