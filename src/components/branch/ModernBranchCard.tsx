import {
  MapPin,
  Phone,
  Mail,
  Users,
  TrendingUp,
  DollarSign,
  Clock,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Building2,
  Activity,
  ChevronRight
} from 'lucide-react';
import React from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { Branch } from '@/types/branch.types';
import { formatCurrency } from '@/utils/currency';

interface ModernBranchCardProps {
  branch: Branch;
  onEdit?: (branch: Branch) => void;
  onDelete?: (branch: Branch) => void;
  onView?: (branch: Branch) => void;
  className?: string;
}

export const ModernBranchCard: React.FC<ModernBranchCardProps> = ({
  branch,
  onEdit,
  onDelete,
  onView,
  className
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-green-500/25';
      case 'inactive':
        return 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-red-500/25';
      case 'pending':
        return 'bg-gradient-to-r from-yellow-500 to-amber-600 text-white shadow-yellow-500/25';
      default:
        return 'bg-gradient-to-r from-gray-500 to-slate-600 text-white shadow-gray-500/25';
    }
  };

  const getBranchTypeIcon = (type: string) => {
    switch (type) {
      case 'headquarters':
        return <Building2 className="h-5 w-5" />;
      case 'regional':
        return <Activity className="h-5 w-5" />;
      default:
        return <MapPin className="h-5 w-5" />;
    }
  };

  // Derive metrics from branch where available
  const metrics = {
    revenue: formatCurrency(branch?.metrics?.totalRevenue || 0, branch?.financial?.currency || 'KES'),
    orders: branch?.metrics?.totalOrders ?? 0,
    staff: branch?.staffing?.currentStaff ?? 0,
    growth: '+15%'
  };

  return (
    <Card className={cn(
      "group relative overflow-hidden transition-all duration-300",
      "hover:shadow-2xl hover:-translate-y-1",
      "bg-gradient-to-br from-white via-gray-50 to-gray-100",
      "dark:from-gray-900 dark:via-gray-800 dark:to-gray-900",
      "border-gray-200 dark:border-gray-700",
      className
    )}>
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Status Badge */}
      <div className="absolute top-4 right-4 z-10">
        <Badge className={cn(
          "px-3 py-1.5 text-xs font-semibold shadow-lg",
          getStatusColor(branch.status)
        )}>
          {branch.status.toUpperCase()}
        </Badge>
      </div>

      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className="p-2.5 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl">
              {getBranchTypeIcon(branch.type)}
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {branch.name}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {branch.code}
              </p>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Contact Information */}
        <div className="space-y-2">
          {branch.address && (
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <MapPin className="h-4 w-4 mr-2 text-gray-400" />
              <span className="truncate">
                {branch.address.street}, {branch.address.city}
              </span>
            </div>
          )}
          {branch.contact?.phone && (
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <Phone className="h-4 w-4 mr-2 text-gray-400" />
              <span>{branch.contact.phone}</span>
            </div>
          )}
          {branch.contact?.email && (
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <Mail className="h-4 w-4 mr-2 text-gray-400" />
              <span className="truncate">{branch.contact.email}</span>
            </div>
          )}
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg">
            <div className="flex items-center justify-between">
              <DollarSign className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                {metrics.growth}
              </span>
            </div>
            <p className="text-sm font-bold text-gray-900 dark:text-white mt-1">
              {metrics.revenue}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Revenue</p>
          </div>

          <div className="p-3 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg">
            <div className="flex items-center justify-between">
              <Activity className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
            <p className="text-sm font-bold text-gray-900 dark:text-white mt-1">
              {metrics.orders}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Orders</p>
          </div>

          <div className="p-3 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg">
            <div className="flex items-center justify-between">
              <Users className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-sm font-bold text-gray-900 dark:text-white mt-1">
              {metrics.staff}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Staff</p>
          </div>

          <div className="p-3 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 rounded-lg">
            <div className="flex items-center justify-between">
              <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <p className="text-sm font-bold text-gray-900 dark:text-white mt-1">
              9-5 PM
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Hours</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onView?.(branch)}
            className="text-xs hover:bg-primary/10 hover:text-primary transition-colors"
          >
            <Eye className="h-4 w-4 mr-1" />
            View Details
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onEdit?.(branch)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Branch
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDelete?.(branch)}
                className="text-red-600 dark:text-red-400"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Branch
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>

      {/* Hover Effect Border */}
      <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-primary via-purple-500 to-pink-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
    </Card>
  );
};

export default ModernBranchCard;
