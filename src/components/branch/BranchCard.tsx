import {
  MapPin,
  Clock,
  DollarSign,
  Phone,
  Mail,
  Users,
  Building2,
  MoreHorizontal,
  Eye,
  Edit2,
  Copy,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import React from 'react';

// UI Components
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// Types
import { Branch } from '@/types/branch.types';

interface BranchCardProps {
  branch: Branch;
  selected: boolean;
  onSelect: (branchId: string, checked: boolean) => void;
  onView: (branch: Branch) => void;
  onEdit: (branch: Branch) => void;
  onClone: (branch: Branch) => void;
  onDelete: (branch: Branch) => void;
  canEdit: (branch: Branch) => boolean;
  loading?: boolean;
}

// Status configuration
const statusConfig = {
  active: { 
    label: 'Active', 
    color: 'success' as const, 
    icon: CheckCircle2,
    description: 'Branch is operational'
  },
  inactive: { 
    label: 'Inactive', 
    color: 'secondary' as const, 
    icon: XCircle,
    description: 'Branch is temporarily closed'
  },
  suspended: { 
    label: 'Suspended', 
    color: 'destructive' as const, 
    icon: AlertCircle,
    description: 'Branch operations suspended'
  }
};

const typeConfig = {
  main: { label: 'Main Branch', icon: Building2, color: 'default' as const },
  branch: { label: 'Branch', icon: MapPin, color: 'secondary' as const },
  franchise: { label: 'Franchise', icon: Users, color: 'outline' as const }
};

// Utility functions
const formatCurrency = (amount: number, currency: string = 'KES'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

const formatAddress = (address: Branch['address']): string => {
  return `${address.street}, ${address.city}, ${address.state} ${address.postalCode}`;
};

const formatTime = (time: string): string => {
  try {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  } catch {
    return time;
  }
};

export const BranchCard: React.FC<BranchCardProps> = ({
  branch,
  selected,
  onSelect,
  onView,
  onEdit,
  onClone,
  onDelete,
  canEdit,
  loading = false
}) => {
  const StatusIcon = statusConfig[branch.status]?.icon || XCircle;
  const TypeIcon = typeConfig[branch.type]?.icon || Building2;
  const isEditable = canEdit(branch);

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-muted" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-32" />
                <div className="h-3 bg-muted rounded w-20" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 bg-muted rounded" />
              <div className="h-8 w-8 bg-muted rounded" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-6 w-20 bg-muted rounded" />
            <div className="h-6 w-16 bg-muted rounded" />
          </div>
        </CardHeader>
        <CardContent className="pt-0 space-y-4">
          <div className="space-y-2">
            <div className="h-3 bg-muted rounded w-full" />
            <div className="h-3 bg-muted rounded w-3/4" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="h-8 bg-muted rounded" />
            <div className="h-8 bg-muted rounded" />
            <div className="h-8 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className={`relative transition-all duration-200 cursor-pointer group ${
        selected ? 'ring-2 ring-primary shadow-md' : 'hover:shadow-lg'
      }`}
      onClick={() => onView(branch)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {/* Branch Logo/Icon */}
            {branch.settings?.logoUrl ? (
              <img 
                src={branch.settings.logoUrl} 
                alt={branch.name}
                className="h-12 w-12 rounded-lg object-cover"
              />
            ) : (
              <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                <Building2 className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
            
            {/* Branch Name and Code */}
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold truncate text-foreground">{branch.name}</h3>
              <p className="text-sm text-muted-foreground">{branch.code}</p>
            </div>
          </div>
          
          {/* Selection and Actions */}
          <div className="flex items-center gap-2">
            <Checkbox
              checked={selected}
              onCheckedChange={(checked) => onSelect(branch._id, Boolean(checked))}
              onClick={(e) => e.stopPropagation()}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => onView(branch)}>
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </DropdownMenuItem>
                
                {isEditable && (
                  <>
                    <DropdownMenuItem onClick={() => onEdit(branch)}>
                      <Edit2 className="h-4 w-4 mr-2" />
                      Edit Branch
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onClone(branch)}>
                      <Copy className="h-4 w-4 mr-2" />
                      Clone Branch
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => onDelete(branch)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Branch
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Type and Status Badges */}
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant={typeConfig[branch.type].color} className="gap-1">
                  <TypeIcon className="h-3 w-3" />
                  {typeConfig[branch.type].label}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                Branch Type: {typeConfig[branch.type].label}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge 
                  variant={statusConfig[branch.status].color}
                  className="gap-1"
                >
                  <StatusIcon className="h-3 w-3" />
                  {statusConfig[branch.status].label}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                {statusConfig[branch.status].description}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-4">
        {/* Location */}
        <div className="flex items-start gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div className="text-sm min-w-0">
            <div className="truncate text-foreground">{formatAddress(branch.address)}</div>
          </div>
        </div>

        {/* Manager Information */}
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <div className="text-sm min-w-0">
            {branch.contact.managerName ? (
              <>
                <div className="truncate text-foreground">{branch.contact.managerName}</div>
                <div className="text-muted-foreground truncate">
                  {branch.contact.managerPhone || branch.contact.phone}
                </div>
              </>
            ) : (
              <div className="text-muted-foreground">No manager assigned</div>
            )}
          </div>
        </div>

        {/* Contact Information */}
        {(branch.contact.phone || branch.contact.email) && (
          <div className="flex items-center gap-4 text-sm">
            {branch.contact.phone && (
              <div className="flex items-center gap-1">
                <Phone className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">{branch.contact.phone}</span>
              </div>
            )}
            {branch.contact.email && (
              <div className="flex items-center gap-1">
                <Mail className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground truncate">{branch.contact.email}</span>
              </div>
            )}
          </div>
        )}

        {/* Performance Metrics */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t">
          <div className="text-center">
            <div className="text-xs text-muted-foreground">Revenue</div>
            <div className="text-sm font-medium text-foreground">
              {formatCurrency(branch.metrics.totalRevenue, branch.financial.currency)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground">Orders</div>
            <div className="text-sm font-medium text-foreground">
              {branch.metrics.totalOrders.toLocaleString()}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground">AOV</div>
            <div className="text-sm font-medium text-foreground">
              {formatCurrency(branch.metrics.avgOrderValue, branch.financial.currency)}
            </div>
          </div>
        </div>

        {/* Operations */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>
              {formatTime(branch.operations.openTime)} - {formatTime(branch.operations.closeTime)}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <DollarSign className="h-3 w-3" />
            <span>{branch.financial.currency}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BranchCard;
