import {
  ChevronDown,
  Search,
  MapPin,
  Building2,
  Users,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Phone,
  Mail,
  ArrowRight,
  Star,
  Zap,
  History,
  Plus,
  Settings,
} from 'lucide-react';
import React, { useState, useEffect, useMemo } from 'react';

// UI Components
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
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

// Hooks and Types
import { useAuth } from '@/contexts/AuthContext';
import { useBranches } from '@/hooks/useBranches';
import { Branch } from '@/types/branch.types';

interface BranchNavigationSwitcherProps {
  showCreateButton?: boolean;
  showManageButton?: boolean;
  onCreateBranch?: () => void;
  onManageBranches?: () => void;
  variant?: 'default' | 'compact' | 'minimal';
  className?: string;
}

interface QuickBranchCardProps {
  branch: Branch;
  isActive: boolean;
  isRecent?: boolean;
  onClick: (branchId: string) => void;
  showMetrics?: boolean;
}

// Status configuration
const statusConfig = {
  active: { 
    label: 'Active', 
    color: 'success' as const, 
    icon: CheckCircle2,
    bgColor: 'bg-green-100',
    textColor: 'text-green-800'
  },
  inactive: { 
    label: 'Inactive', 
    color: 'secondary' as const, 
    icon: XCircle,
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-800'
  },
  suspended: { 
    label: 'Suspended', 
    color: 'destructive' as const, 
    icon: AlertCircle,
    bgColor: 'bg-red-100',
    textColor: 'text-red-800'
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

const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

// Quick Branch Card Component
const QuickBranchCard: React.FC<QuickBranchCardProps> = ({
  branch,
  isActive,
  isRecent,
  onClick,
  showMetrics = true,
}) => {
  const StatusIcon = statusConfig[branch.status].icon;
  const TypeIcon = typeConfig[branch.type].icon;

  return (
    <div
      className={`group cursor-pointer p-3 rounded-lg transition-all duration-200 ${
        isActive 
          ? 'bg-primary/10 border border-primary/20' 
          : 'hover:bg-accent/50 border border-transparent'
      }`}
      onClick={() => onClick(branch._id)}
    >
      <div className="flex items-start gap-3">
        {/* Branch Avatar/Icon */}
        <div className="relative">
          <Avatar className="h-10 w-10">
            {branch.settings?.logoUrl ? (
              <AvatarImage src={branch.settings.logoUrl} alt={branch.name} />
            ) : (
              <AvatarFallback className="bg-muted">
                {getInitials(branch.name)}
              </AvatarFallback>
            )}
          </Avatar>
          {isRecent && (
            <div className="absolute -top-1 -right-1 h-3 w-3 bg-blue-500 rounded-full border-2 border-white">
              <History className="h-2 w-2 text-white ml-0.5 mt-0.5" />
            </div>
          )}
        </div>

        {/* Branch Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className={`font-medium truncate ${isActive ? 'text-primary' : 'text-foreground'}`}>
              {branch.name}
            </h4>
            <Badge variant={typeConfig[branch.type].color} className="text-xs shrink-0">
              {typeConfig[branch.type].label}
            </Badge>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <span className="font-mono">{branch.code}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {branch.address.city}, {branch.address.state}
            </span>
          </div>

          {/* Status and Performance */}
          <div className="flex items-center justify-between">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                    statusConfig[branch.status].bgColor
                  } ${statusConfig[branch.status].textColor}`}>
                    <StatusIcon className="h-3 w-3" />
                    <span>{statusConfig[branch.status].label}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  Branch is {statusConfig[branch.status].label.toLowerCase()}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {showMetrics && (
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <div className="text-right">
                  <div className="font-medium text-foreground">
                    {formatCurrency(branch.metrics.totalRevenue, branch.financial.currency)}
                  </div>
                  <div>{branch.metrics.totalOrders} orders</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Active indicator */}
        {isActive && (
          <div className="shrink-0">
            <div className="h-2 w-2 bg-primary rounded-full" />
          </div>
        )}
      </div>
    </div>
  );
};

// Main Component
export const BranchNavigationSwitcher: React.FC<BranchNavigationSwitcherProps> = ({
  showCreateButton = false,
  showManageButton = true,
  onCreateBranch,
  onManageBranches,
  variant = 'default',
  className = '',
}) => {
  const { user } = useAuth();
  const {
    branches,
    currentBranch,
    userAssignedBranches,
    switchBranch,
    canUserSwitchBranches,
    isSwitching,
    isLoading,
  } = useBranches();

  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [recentBranches, setRecentBranches] = useState<string[]>([]);

  // Load recent branches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentBranches');
    if (saved) {
      try {
        setRecentBranches(JSON.parse(saved));
      } catch {
        setRecentBranches([]);
      }
    }
  }, []);

  // Save recent branches to localStorage
  const updateRecentBranches = (branchId: string) => {
    const updated = [branchId, ...recentBranches.filter(id => id !== branchId)].slice(0, 5);
    setRecentBranches(updated);
    localStorage.setItem('recentBranches', JSON.stringify(updated));
  };

  // Available branches for switching
  const availableBranches = useMemo(() => {
    if (!canUserSwitchBranches() || !branches.length) return [];
    
    return user?.role === 'admin' || user?.role === 'superadmin' 
      ? branches 
      : userAssignedBranches;
  }, [branches, userAssignedBranches, canUserSwitchBranches, user]);

  // Filter branches based on search
  const filteredBranches = useMemo(() => {
    if (!searchTerm.trim()) return availableBranches;

    return availableBranches.filter(branch => 
      branch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      branch.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      branch.address.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      branch.address.state.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [availableBranches, searchTerm]);

  // Group branches
  const groupedBranches = useMemo(() => {
    const recent = filteredBranches.filter(branch => 
      recentBranches.includes(branch._id) && branch._id !== currentBranch?._id
    ).sort((a, b) => {
      const aIndex = recentBranches.indexOf(a._id);
      const bIndex = recentBranches.indexOf(b._id);
      return aIndex - bIndex;
    });

    const others = filteredBranches.filter(branch => 
      !recentBranches.includes(branch._id) && branch._id !== currentBranch?._id
    ).sort((a, b) => a.name.localeCompare(b.name));

    return { recent, others };
  }, [filteredBranches, recentBranches, currentBranch]);

  // Handle branch switch
  const handleBranchSwitch = async (branchId: string) => {
    if (branchId === currentBranch?._id) {
      setIsOpen(false);
      return;
    }

    try {
      await switchBranch(branchId);
      updateRecentBranches(branchId);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to switch branch:', error);
    }
  };

  // Don't show if user can't switch branches
  if (!canUserSwitchBranches() || availableBranches.length <= 1) {
    return null;
  }

  if (variant === 'minimal') {
    return (
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className={`gap-2 ${className}`}>
            <Building2 className="h-4 w-4" />
            <span className="sr-only">{currentBranch?.name || 'Select Branch'}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          {filteredBranches.slice(0, 5).map(branch => (
            <DropdownMenuItem
              key={branch._id}
              onClick={() => handleBranchSwitch(branch._id)}
              disabled={isSwitching}
            >
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-xs">
                    {getInitials(branch.name)}
                  </AvatarFallback>
                </Avatar>
                <span>{branch.name}</span>
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  if (variant === 'compact') {
    return (
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            className={`gap-2 max-w-[200px] ${className}`}
            disabled={isSwitching}
          >
            <Avatar className="h-5 w-5">
              {currentBranch?.settings?.logoUrl ? (
                <AvatarImage src={currentBranch.settings.logoUrl} alt={currentBranch.name} />
              ) : (
                <AvatarFallback className="text-xs">
                  {currentBranch ? getInitials(currentBranch.name) : '?'}
                </AvatarFallback>
              )}
            </Avatar>
            <span className="truncate">
              {currentBranch?.name || 'Select Branch'}
            </span>
            <ChevronDown className="h-4 w-4 shrink-0" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-96">
          <div className="p-2">
            <Input
              placeholder="Search branches..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mb-2"
            />
          </div>
          <ScrollArea className="max-h-80">
            <div className="space-y-1 p-2">
              {filteredBranches.map(branch => (
                <QuickBranchCard
                  key={branch._id}
                  branch={branch}
                  isActive={branch._id === currentBranch?._id}
                  isRecent={recentBranches.includes(branch._id)}
                  onClick={handleBranchSwitch}
                  showMetrics={false}
                />
              ))}
            </div>
          </ScrollArea>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Default variant
  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className={`gap-3 h-auto p-3 ${className}`}
          disabled={isSwitching}
        >
          <Avatar className="h-8 w-8">
            {currentBranch?.settings?.logoUrl ? (
              <AvatarImage src={currentBranch.settings.logoUrl} alt={currentBranch.name} />
            ) : (
              <AvatarFallback>
                {currentBranch ? getInitials(currentBranch.name) : '?'}
              </AvatarFallback>
            )}
          </Avatar>
          <div className="flex flex-col items-start min-w-0">
            <span className="font-medium truncate max-w-[150px]">
              {currentBranch?.name || 'Select Branch'}
            </span>
            {currentBranch && (
              <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                {currentBranch.address.city}, {currentBranch.address.state}
              </span>
            )}
          </div>
          <ChevronDown className="h-4 w-4 shrink-0" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-[450px]">
        {/* Search */}
        <div className="p-3 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search branches by name, code, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <ScrollArea className="max-h-96">
          <div className="p-2">
            {/* Current Branch */}
            {currentBranch && (
              <>
                <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
                  Current Branch
                </DropdownMenuLabel>
                <QuickBranchCard
                  branch={currentBranch}
                  isActive={true}
                  onClick={handleBranchSwitch}
                />
                <DropdownMenuSeparator className="my-2" />
              </>
            )}

            {/* Recent Branches */}
            {groupedBranches.recent.length > 0 && (
              <>
                <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
                  Recently Used
                </DropdownMenuLabel>
                <div className="space-y-1 mb-3">
                  {groupedBranches.recent.map(branch => (
                    <QuickBranchCard
                      key={branch._id}
                      branch={branch}
                      isActive={false}
                      isRecent={true}
                      onClick={handleBranchSwitch}
                    />
                  ))}
                </div>
                <DropdownMenuSeparator className="my-2" />
              </>
            )}

            {/* All Other Branches */}
            {groupedBranches.others.length > 0 && (
              <>
                <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
                  All Branches ({groupedBranches.others.length})
                </DropdownMenuLabel>
                <div className="space-y-1">
                  {groupedBranches.others.map(branch => (
                    <QuickBranchCard
                      key={branch._id}
                      branch={branch}
                      isActive={false}
                      onClick={handleBranchSwitch}
                    />
                  ))}
                </div>
              </>
            )}

            {filteredBranches.length === 0 && (
              <div className="text-center py-6 text-muted-foreground">
                <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No branches found</p>
                <p className="text-xs">Try adjusting your search</p>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Actions */}
        {(showCreateButton || showManageButton) && (
          <>
            <DropdownMenuSeparator />
            <div className="p-2 space-y-1">
              {showCreateButton && onCreateBranch && (
                <DropdownMenuItem onClick={onCreateBranch}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Branch
                </DropdownMenuItem>
              )}
              {showManageButton && onManageBranches && (
                <DropdownMenuItem onClick={onManageBranches}>
                  <Settings className="h-4 w-4 mr-2" />
                  Manage Branches
                </DropdownMenuItem>
              )}
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default BranchNavigationSwitcher;
