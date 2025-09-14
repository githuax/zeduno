import { Users, Clock, Utensils } from 'lucide-react';

import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Table } from '@/types/order.types';

interface TableGridProps {
  tables: Table[];
  onTableClick: (table: Table) => void;
  isLoading?: boolean;
}

const statusColors = {
  available: 'bg-green-100 hover:bg-green-200 border-green-500',
  occupied: 'bg-orange-100 hover:bg-orange-200 border-orange-500',
  reserved: 'bg-blue-100 hover:bg-blue-200 border-blue-500',
  maintenance: 'bg-gray-100 hover:bg-gray-200 border-gray-500',
};

const statusIcons = {
  available: null,
  occupied: <Utensils className="h-4 w-4" />,
  reserved: <Clock className="h-4 w-4" />,
  maintenance: null,
};

export function TableGrid({ tables, onTableClick, isLoading }: TableGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {[...Array(12)].map((_, i) => (
          <Skeleton key={i} className="h-32 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (tables.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Utensils className="h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900">No tables found</h3>
        <p className="text-gray-500 mt-2">Add tables to start managing your restaurant floor</p>
      </div>
    );
  }

  // Group tables by section for better visualization
  const tablesBySection = tables.reduce((acc, table) => {
    const section = table.section || 'main';
    if (!acc[section]) acc[section] = [];
    acc[section].push(table);
    return acc;
  }, {} as Record<string, Table[]>);

  return (
    <div className="space-y-6">
      {Object.entries(tablesBySection).map(([section, sectionTables]) => (
        <div key={section}>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase">
            {section} Section
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
            {sectionTables.map((table) => (
              <TableCard
                key={table._id}
                table={table}
                onClick={() => onTableClick(table)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

interface TableCardProps {
  table: Table;
  onClick: () => void;
}

function TableCard({ table, onClick }: TableCardProps) {
  const isOccupied = table.status === 'occupied';
  const hasOrder = isOccupied && table.currentOrderId;

  return (
    <button
      onClick={onClick}
      className={cn(
        'relative p-4 rounded-lg border-2 transition-all duration-200',
        'flex flex-col items-center justify-center min-h-[120px]',
        'hover:shadow-lg hover:scale-105',
        statusColors[table.status]
      )}
    >
      {statusIcons[table.status] && (
        <div className="absolute top-2 right-2">
          {statusIcons[table.status]}
        </div>
      )}
      
      <div className="text-2xl font-bold text-gray-800">
        {table.tableNumber}
      </div>
      
      <div className="flex items-center gap-1 mt-2 text-sm text-gray-600">
        <Users className="h-3 w-3" />
        <span>{table.capacity}</span>
      </div>
      
      <div className="mt-2 text-xs font-medium capitalize">
        {table.status}
      </div>
      
      {hasOrder && (
        <div className="absolute bottom-1 right-1">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
        </div>
      )}
    </button>
  );
}