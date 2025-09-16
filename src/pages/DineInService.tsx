import { Plus, Users, Clock, DollarSign, Filter, RefreshCw, Calendar } from 'lucide-react';
import { useState, useEffect } from 'react';

import { ReservationDialog } from '@/components/tables/ReservationDialog';
import { SimpleTableDialog } from '@/components/tables/SimpleTableDialog';
import { TableGrid } from '@/components/tables/TableGrid';
import { TableManagementDialog } from '@/components/tables/TableManagementDialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RESTAURANT_FLOORS, getFloorOptions, getSectionOptions } from '@/config/restaurant';
import { CreateOrderDialog } from '@/features/orders';
import { useOrders } from '@/features/orders';
import { toast } from '@/hooks/use-toast';
import { useTables } from '@/hooks/useTables';
import { Table } from '@/types/order.types';

export default function DineInService() {
  const [selectedFloor, setSelectedFloor] = useState<number>(1);
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [isTableManagementOpen, setIsTableManagementOpen] = useState(false);
  const [isTableEditOpen, setIsTableEditOpen] = useState(false);
  const [isReservationOpen, setIsReservationOpen] = useState(false);
  const [isCreateOrderOpen, setIsCreateOrderOpen] = useState(false);
  const [selectedTableForOrder, setSelectedTableForOrder] = useState<string>('');

  const { data: tables = [], isLoading: tablesLoading, refetch: refetchTables } = useTables({
    floor: selectedFloor,
    section: selectedSection !== 'all' ? selectedSection : undefined,
  });

  const { data: activeOrders = [] } = useOrders({
    orderType: 'dine-in',
    status: 'preparing',
  });

  const stats = {
    totalTables: tables.length,
    occupiedTables: tables.filter(t => t.status === 'occupied').length,
    availableTables: tables.filter(t => t.status === 'available').length,
    reservedTables: tables.filter(t => t.status === 'reserved').length,
    totalGuests: tables.filter(t => t.status === 'occupied').reduce((sum, t) => sum + t.capacity, 0),
    activeOrders: activeOrders.length,
  };

  const occupancyRate = stats.totalTables > 0 
    ? Math.round((stats.occupiedTables / stats.totalTables) * 100) 
    : 0;

  const handleTableClick = (table: Table) => {
    setSelectedTable(table);
    if (table.status === 'available') {
      setSelectedTableForOrder(table._id);
      setIsCreateOrderOpen(true);
    } else {
      // Use TableManagementDialog for occupied/reserved tables
      setIsTableManagementOpen(true);
    }
  };

  const handleUpdateTableStatus = async (tableId: string, status: string) => {
    try {
      const response = await fetch(`/api/tables/${tableId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Table status updated',
        });
        refetchTables();
        return true;
      } else {
        const errorData = await response.json().catch(() => ({}));
        const details = errorData.details;
        
        toast({
          title: 'Error',
          description: details 
            ? `${errorData.message}\nOrder: ${details.orderNumber} (Customer: ${details.customerName}) is still ${details.status}`
            : errorData.message || 'Failed to update table status',
          variant: 'destructive',
        });
        throw new Error(errorData.message || 'Failed to update table status');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update table status',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const handleRefresh = () => {
    refetchTables();
    toast({
      title: 'Refreshed',
      description: 'Table data updated',
    });
  };

  const handleManageTables = () => {
    setSelectedTable(null); // No specific table selected
    setIsTableEditOpen(true); // Open table creation/edit dialog
  };

  const sections = ['all', ...new Set(tables.map(t => t.section))];
  const floorOptions = getFloorOptions();
  const sectionOptions = getSectionOptions();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-restaurant-dark">Dine-In Service</h1>
          <p className="text-muted-foreground mt-2">
            Manage tables, reservations, and in-restaurant dining
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={handleRefresh}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button 
            variant="outline"
            onClick={handleManageTables}
          >
            <Plus className="mr-2 h-4 w-4" />
            Manage Tables
          </Button>
          <Button 
            variant="outline"
            onClick={() => setIsReservationOpen(true)}
          >
            <Calendar className="mr-2 h-4 w-4" />
            Reservations
          </Button>
          <Button 
            onClick={() => setIsCreateOrderOpen(true)}
            className="bg-restaurant-primary hover:bg-restaurant-primary/90"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Order
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Occupancy Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{occupancyRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.occupiedTables}/{stats.totalTables} tables
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Available</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.availableTables}</div>
            <p className="text-xs text-muted-foreground mt-1">Ready for guests</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Occupied</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.occupiedTables}</div>
            <p className="text-xs text-muted-foreground mt-1">Currently dining</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Reserved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.reservedTables}</div>
            <p className="text-xs text-muted-foreground mt-1">Upcoming bookings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Guests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalGuests}</div>
            <p className="text-xs text-muted-foreground mt-1">Current capacity</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-restaurant-primary">{stats.activeOrders}</div>
            <p className="text-xs text-muted-foreground mt-1">In preparation</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Table Layout</CardTitle>
            <div className="flex gap-2">
              <Select
                value={selectedFloor.toString()}
                onValueChange={(value) => setSelectedFloor(parseInt(value))}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Floor" />
                </SelectTrigger>
                <SelectContent>
                  {floorOptions.map(floor => (
                    <SelectItem key={floor.value} value={floor.value}>
                      {floor.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select
                value={selectedSection}
                onValueChange={setSelectedSection}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Section" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sections</SelectItem>
                  {sectionOptions.map(section => (
                    <SelectItem key={section.value} value={section.value}>
                      {section.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span>Available</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-orange-500 rounded"></div>
                <span>Occupied</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-500 rounded"></div>
                <span>Reserved</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-500 rounded"></div>
                <span>Maintenance</span>
              </div>
            </div>

            <TableGrid
              tables={tables}
              onTableClick={handleTableClick}
              isLoading={tablesLoading}
            />
          </div>
        </CardContent>
      </Card>

      {/* Table Management Dialog - for managing occupied/reserved tables */}
      <TableManagementDialog
        table={selectedTable}
        open={isTableManagementOpen}
        onOpenChange={setIsTableManagementOpen}
        onUpdateStatus={handleUpdateTableStatus}
        onRefresh={refetchTables}
      />

      {/* Simple Table Dialog - for creating/editing table properties */}
      <SimpleTableDialog
        table={selectedTable}
        open={isTableEditOpen}
        onOpenChange={setIsTableEditOpen}
        onRefresh={refetchTables}
      />

      <ReservationDialog
        open={isReservationOpen}
        onOpenChange={setIsReservationOpen}
        tables={tables.filter(t => t.status === 'available')}
        onSuccess={refetchTables}
      />

      <CreateOrderDialog
        open={isCreateOrderOpen}
        onOpenChange={setIsCreateOrderOpen}
        onSuccess={() => {
          refetchTables();
          setIsCreateOrderOpen(false);
        }}
        preselectedTableId={selectedTableForOrder}
      />
    </div>
  );
}
