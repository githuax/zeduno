import {
  ChevronDown,
  ChevronRight,
  Building2,
  MapPin,
  Users,
  Search,
  Filter,
  Eye,
  Edit2,
  Plus,
  MoreVertical,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Zap,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import React, { useState, useMemo } from 'react';

// UI Components
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// Types
import { Branch, BranchHierarchy } from '@/types/branch.types';

interface BranchHierarchyViewProps {
  hierarchy: BranchHierarchy[];
  onSelectBranch?: (branch: Branch) => void;
  onEditBranch?: (branch: Branch) => void;
  onCreateChild?: (parentBranch: Branch) => void;
  expandedNodes?: Set<string>;
  onToggleExpansion?: (nodeId: string) => void;
  showMetrics?: boolean;
  showActions?: boolean;
  canEdit?: (branch: Branch) => boolean;
  loading?: boolean;
  className?: string;
}

interface HierarchyNodeProps {
  node: BranchHierarchy;
  level: number;
  isExpanded: boolean;
  onToggleExpansion: (nodeId: string) => void;
  onSelectBranch?: (branch: Branch) => void;
  onEditBranch?: (branch: Branch) => void;
  onCreateChild?: (parentBranch: Branch) => void;
  showMetrics: boolean;
  showActions: boolean;
  canEdit?: (branch: Branch) => boolean;
  searchTerm?: string;
  statusFilter?: string;
}

// Status and type configurations
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
  main: { label: 'Main', icon: Building2, color: 'default' as const },
  branch: { label: 'Branch', icon: MapPin, color: 'secondary' as const },
  franchise: { label: 'Franchise', icon: Users, color: 'outline' as const }
};

// Utility functions
const formatCurrency = (amount: number, currency: string = 'KES'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const getPerformanceIndicator = (current: number, previous: number) => {
  if (previous === 0) return { trend: 'neutral', percentage: 0 };
  
  const percentage = ((current - previous) / previous) * 100;
  const trend = percentage > 0 ? 'up' : percentage < 0 ? 'down' : 'neutral';
  
  return { trend, percentage: Math.abs(percentage) };
};

// Hierarchy Node Component
const HierarchyNode: React.FC<HierarchyNodeProps> = ({
  node,
  level,
  isExpanded,
  onToggleExpansion,
  onSelectBranch,
  onEditBranch,
  onCreateChild,
  showMetrics,
  showActions,
  canEdit,
  searchTerm,
  statusFilter,
}) => {
  const hasChildren = node.children && node.children.length > 0;
  const StatusIcon = statusConfig[node.status]?.icon || XCircle;
  const TypeIcon = typeConfig[node.type]?.icon || Building2;
  const isEditable = canEdit?.(node) ?? false;

  // Filter logic
  const matchesSearch = !searchTerm || 
    node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    node.code.toLowerCase().includes(searchTerm.toLowerCase());
    
  const matchesStatus = !statusFilter || node.status === statusFilter;
  
  const shouldShow = matchesSearch && matchesStatus;

  // Performance metrics (mock data for demo - replace with real data)
  const revenueGrowth = getPerformanceIndicator(node.metrics.totalRevenue, node.metrics.totalRevenue * 0.9);
  const orderGrowth = getPerformanceIndicator(node.metrics.totalOrders, node.metrics.totalOrders * 0.85);

  if (!shouldShow) return null;

  return (
    <div className="select-none">
      <div
        className={`
          flex items-center gap-2 p-3 rounded-lg transition-colors hover:bg-accent/50 cursor-pointer
          ${level > 0 ? `ml-${Math.min(level * 6, 24)}` : ''}
        `}
        onClick={() => onSelectBranch?.(node)}
      >
        {/* Expansion Toggle */}
        <div className="w-6 flex justify-center">
          {hasChildren ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpansion(node._id);
              }}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          ) : (
            <div className="h-6 w-6 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-muted" />
            </div>
          )}
        </div>

        {/* Branch Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            {/* Branch Icon */}
            <div className={`
              h-10 w-10 rounded-lg flex items-center justify-center
              ${node.settings?.logoUrl ? '' : 'bg-muted'}
            `}>
              {node.settings?.logoUrl ? (
                <img 
                  src={node.settings.logoUrl} 
                  alt={node.name}
                  className="h-10 w-10 rounded-lg object-cover"
                />
              ) : (
                <TypeIcon className="h-5 w-5 text-muted-foreground" />
              )}
            </div>

            {/* Branch Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium truncate">{node.name}</h4>
                <Badge variant={typeConfig[node.type].color} className="text-xs">
                  {typeConfig[node.type].label}
                </Badge>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant={statusConfig[node.status].color} className="gap-1">
                        <StatusIcon className="h-3 w-3" />
                        <span className="sr-only">{statusConfig[node.status].label}</span>
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      {statusConfig[node.status].description}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="font-mono">{node.code}</span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {node.address.city}, {node.address.state}
                </span>
                {node.contact.managerName && (
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {node.contact.managerName}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Metrics */}
        {showMetrics && (
          <div className="flex items-center gap-6 text-sm">
            <div className="text-center min-w-[80px]">
              <div className="font-medium">
                {formatCurrency(node.metrics.totalRevenue, node.financial.currency)}
              </div>
              <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                {revenueGrowth.trend === 'up' ? (
                  <TrendingUp className="h-3 w-3 text-green-600" />
                ) : revenueGrowth.trend === 'down' ? (
                  <TrendingDown className="h-3 w-3 text-red-600" />
                ) : null}
                Revenue
              </div>
            </div>
            
            <div className="text-center min-w-[60px]">
              <div className="font-medium">{node.metrics.totalOrders.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                {orderGrowth.trend === 'up' ? (
                  <TrendingUp className="h-3 w-3 text-green-600" />
                ) : orderGrowth.trend === 'down' ? (
                  <TrendingDown className="h-3 w-3 text-red-600" />
                ) : null}
                Orders
              </div>
            </div>
            
            <div className="text-center min-w-[60px]">
              <div className="font-medium">
                {formatCurrency(node.metrics.avgOrderValue, node.financial.currency)}
              </div>
              <div className="text-xs text-muted-foreground">AOV</div>
            </div>

            {hasChildren && (
              <div className="text-center min-w-[60px]">
                <div className="font-medium">{node.children.length}</div>
                <div className="text-xs text-muted-foreground">Branches</div>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        {showActions && (
          <div className="flex items-center gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectBranch?.(node);
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>View Details</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {isEditable && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEditBranch?.(node)}>
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit Branch
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onCreateChild?.(node)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Child Branch
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        )}
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div className="mt-2">
          {node.children.map((child) => (
            <HierarchyNode
              key={child._id}
              node={child}
              level={level + 1}
              isExpanded={false} // Child expansion would need separate tracking
              onToggleExpansion={onToggleExpansion}
              onSelectBranch={onSelectBranch}
              onEditBranch={onEditBranch}
              onCreateChild={onCreateChild}
              showMetrics={showMetrics}
              showActions={showActions}
              canEdit={canEdit}
              searchTerm={searchTerm}
              statusFilter={statusFilter}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Main Component
export const BranchHierarchyView: React.FC<BranchHierarchyViewProps> = ({
  hierarchy,
  onSelectBranch,
  onEditBranch,
  onCreateChild,
  expandedNodes = new Set(),
  onToggleExpansion = () => {},
  showMetrics = true,
  showActions = true,
  canEdit = () => false,
  loading = false,
  className = '',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const getAllBranches = (nodes: BranchHierarchy[]): Branch[] => {
      const branches: Branch[] = [];
      nodes.forEach(node => {
        branches.push(node);
        if (node.children) {
          branches.push(...getAllBranches(node.children));
        }
      });
      return branches;
    };

    const allBranches = getAllBranches(hierarchy);
    
    return {
      total: allBranches.length,
      active: allBranches.filter(b => b.status === 'active').length,
      inactive: allBranches.filter(b => b.status === 'inactive').length,
      suspended: allBranches.filter(b => b.status === 'suspended').length,
      totalRevenue: allBranches.reduce((sum, b) => sum + b.metrics.totalRevenue, 0),
      totalOrders: allBranches.reduce((sum, b) => sum + b.metrics.totalOrders, 0),
      mainBranches: allBranches.filter(b => b.type === 'main').length,
      branches: allBranches.filter(b => b.type === 'branch').length,
      franchises: allBranches.filter(b => b.type === 'franchise').length,
    };
  }, [hierarchy]);

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-6 w-40 bg-muted animate-pulse rounded" />
              <div className="h-4 w-60 bg-muted animate-pulse rounded" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3">
                <div className="h-10 w-10 bg-muted animate-pulse rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                  <div className="h-3 w-48 bg-muted animate-pulse rounded" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Branch Hierarchy
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Visual representation of your branch structure and relationships
            </p>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>

        {/* Summary Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <div className="text-2xl font-bold">{summaryStats.total}</div>
            <div className="text-sm text-muted-foreground">Total Branches</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <div className="text-2xl font-bold text-green-600">{summaryStats.active}</div>
            <div className="text-sm text-muted-foreground">Active</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <div className="text-2xl font-bold">
              {formatCurrency(summaryStats.totalRevenue)}
            </div>
            <div className="text-sm text-muted-foreground">Total Revenue</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <div className="text-2xl font-bold">{summaryStats.totalOrders.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">Total Orders</div>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <>
            <Separator />
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search branches..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="w-48">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 text-sm border rounded-md bg-background"
                >
                  <option value="">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            </div>
          </>
        )}
      </CardHeader>

      <CardContent>
        <ScrollArea className="h-[600px]">
          {hierarchy.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-4" />
              <h3 className="text-lg font-medium mb-2">No branches found</h3>
              <p className="text-sm text-muted-foreground">
                {searchTerm || statusFilter
                  ? 'Try adjusting your search or filter criteria'
                  : 'Create your first branch to get started'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Column Headers */}
              {showMetrics && (
                <div className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground border-b">
                  <div className="w-6"></div>
                  <div className="flex-1">Branch</div>
                  <div className="flex items-center gap-6">
                    <div className="text-center min-w-[80px]">Revenue</div>
                    <div className="text-center min-w-[60px]">Orders</div>
                    <div className="text-center min-w-[60px]">AOV</div>
                    <div className="text-center min-w-[60px]">Children</div>
                  </div>
                  {showActions && <div className="w-20">Actions</div>}
                </div>
              )}

              {/* Hierarchy Nodes */}
              {hierarchy.map((node) => (
                <HierarchyNode
                  key={node._id}
                  node={node}
                  level={0}
                  isExpanded={expandedNodes.has(node._id)}
                  onToggleExpansion={onToggleExpansion}
                  onSelectBranch={onSelectBranch}
                  onEditBranch={onEditBranch}
                  onCreateChild={onCreateChild}
                  showMetrics={showMetrics}
                  showActions={showActions}
                  canEdit={canEdit}
                  searchTerm={searchTerm}
                  statusFilter={statusFilter}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default BranchHierarchyView;
