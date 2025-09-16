import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getFloorOptions, getSectionOptions } from '@/config/restaurant';
import { toast } from '@/hooks/use-toast';
import { useCreateTable, useUpdateTable } from '@/hooks/useTables';
import { Table } from '@/types/order.types';

interface SimpleTableDialogProps {
  table?: Table | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRefresh: () => void;
}

export function SimpleTableDialog({ table, open, onOpenChange, onRefresh }: SimpleTableDialogProps) {
  const [formData, setFormData] = useState({
    tableNumber: table?.tableNumber || '',
    capacity: table?.capacity || 4,
    section: table?.section || '',
    floor: table?.floor || 1,
    status: table?.status || 'available'
  });

  const createTable = useCreateTable();
  const updateTable = useUpdateTable();
  
  const floorOptions = getFloorOptions();
  const sectionOptions = getSectionOptions();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (table) {
        // Update existing table
        await updateTable.mutateAsync({
          id: table._id,
          data: formData
        });
        toast({
          title: "Table updated",
          description: `Table ${formData.tableNumber} has been updated successfully.`
        });
      } else {
        // Create new table
        await createTable.mutateAsync(formData);
        toast({
          title: "Table created",
          description: `Table ${formData.tableNumber} has been created successfully.`
        });
      }
      
      onRefresh();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${table ? 'update' : 'create'} table. Please try again.`,
        variant: "destructive"
      });
    }
  };

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {table ? `Edit Table ${table.tableNumber}` : 'Create New Table'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tableNumber">Table Number</Label>
            <Input
              id="tableNumber"
              value={formData.tableNumber}
              onChange={(e) => handleChange('tableNumber', e.target.value)}
              placeholder="e.g., T-01, Table 1"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="capacity">Capacity (seats)</Label>
            <Input
              id="capacity"
              type="number"
              min="1"
              max="20"
              value={formData.capacity}
              onChange={(e) => handleChange('capacity', parseInt(e.target.value))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="section">Section</Label>
            <Select value={formData.section} onValueChange={(value) => handleChange('section', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a section" />
              </SelectTrigger>
              <SelectContent>
                {sectionOptions.map(section => (
                  <SelectItem key={section.value} value={section.label}>
                    {section.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="floor">Floor</Label>
            <Select value={formData.floor.toString()} onValueChange={(value) => handleChange('floor', parseInt(value))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {floorOptions.map(floor => (
                  <SelectItem key={floor.value} value={floor.value}>
                    {floor.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {table && (
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => handleChange('status', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="occupied">Occupied</SelectItem>
                  <SelectItem value="reserved">Reserved</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1"
              disabled={createTable.isPending || updateTable.isPending}
            >
              {createTable.isPending || updateTable.isPending 
                ? 'Saving...' 
                : table ? 'Update Table' : 'Create Table'
              }
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}