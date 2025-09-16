import {
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  RefreshCw,
  Grid3X3,
  List,
  Building2,
  TrendingUp,
  BarChart3,
  ChevronDown,
  Copy,
  FileText,
  Loader2
} from 'lucide-react';
import React, { useEffect } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface ModernDashboardHeaderProps {
  onCreateBranch: () => void;
  onCloneBranch?: () => void;
  onCreateFromTemplate?: () => void;
  onSearch: (query: string) => void;
  onFilterChange: (filters: any) => void;
  onViewChange: (view: 'grid' | 'list') => void;
  onExport: () => void;
  onImport: () => void;
  onRefresh: () => void;
  currentView: 'grid' | 'list';
  branchCount: number;
  activeCount: number;
  isCreating?: boolean;
  canCreateBranch?: boolean;
}

export const ModernDashboardHeader: React.FC<ModernDashboardHeaderProps> = ({
  onCreateBranch,
  onCloneBranch,
  onCreateFromTemplate,
  onSearch,
  onFilterChange,
  onViewChange,
  onExport,
  onImport,
  onRefresh,
  currentView,
  branchCount,
  activeCount,
  isCreating = false,
  canCreateBranch = true
}) => {
  // Add keyboard shortcut support
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'n' && canCreateBranch) {
        event.preventDefault();
        onCreateBranch();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onCreateBranch, canCreateBranch]);
  return (
    <div className="space-y-6">
      {/* Header with Gradient Background */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary via-purple-600 to-pink-600 p-8 text-white">
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
        
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <Building2 className="h-8 w-8" />
                <h1 className="text-3xl font-bold">Branch Management</h1>
              </div>
              <p className="text-white/80 text-lg">
                Manage and monitor all your business locations
              </p>
            </div>
            
            <TooltipProvider>
              <div className="flex items-center gap-2">
                {/* Main Create Branch Button */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={onCreateBranch}
                      size="lg"
                      className="bg-white text-primary hover:bg-white/90 shadow-xl"
                      disabled={!canCreateBranch || isCreating}
                    >
                      {isCreating ? (
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      ) : (
                        <Plus className="h-5 w-5 mr-2" />
                      )}
                      {isCreating ? 'Creating...' : 'Create Branch'}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Create a new branch (Ctrl+N)</p>
                  </TooltipContent>
                </Tooltip>

                {/* Quick Actions Dropdown */}
                {canCreateBranch && !isCreating && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="lg"
                        className="bg-white text-primary hover:bg-white/90 shadow-xl px-3"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuItem onClick={onCreateBranch}>
                        <Plus className="h-4 w-4 mr-2" />
                        New Branch
                        <span className="ml-auto text-xs text-muted-foreground">Ctrl+N</span>
                      </DropdownMenuItem>
                      {onCloneBranch && (
                        <DropdownMenuItem onClick={onCloneBranch}>
                          <Copy className="h-4 w-4 mr-2" />
                          Clone Branch
                        </DropdownMenuItem>
                      )}
                      {onCreateFromTemplate && (
                        <DropdownMenuItem onClick={onCreateFromTemplate}>
                          <FileText className="h-4 w-4 mr-2" />
                          From Template
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </TooltipProvider>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-4 gap-4 mt-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/70 text-sm">Total Branches</p>
                  <p className="text-2xl font-bold mt-1">{branchCount}</p>
                </div>
                <Building2 className="h-8 w-8 text-white/50" />
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/70 text-sm">Active</p>
                  <p className="text-2xl font-bold mt-1">{activeCount}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-400" />
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/70 text-sm">Revenue</p>
                  <p className="text-2xl font-bold mt-1">$124.5K</p>
                </div>
                <BarChart3 className="h-8 w-8 text-white/50" />
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/70 text-sm">Growth</p>
                  <p className="text-2xl font-bold mt-1">+23%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-400" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search branches..."
              className="pl-10 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
              onChange={(e) => onSearch(e.target.value)}
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3">
            <Select onValueChange={(value) => onFilterChange({ status: value })}>
              <SelectTrigger className="w-40 bg-gray-50 dark:bg-gray-800">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>

            <Select onValueChange={(value) => onFilterChange({ type: value })}>
              <SelectTrigger className="w-40 bg-gray-50 dark:bg-gray-800">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="headquarters">Headquarters</SelectItem>
                <SelectItem value="regional">Regional</SelectItem>
                <SelectItem value="local">Local</SelectItem>
              </SelectContent>
            </Select>

            {/* View Toggle */}
            <div className="flex items-center bg-gray-50 dark:bg-gray-800 rounded-lg p-1">
              <Button
                variant={currentView === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onViewChange('grid')}
                className="px-3"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={currentView === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onViewChange('list')}
                className="px-3"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pl-3 border-l border-gray-200 dark:border-gray-700">
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                className="hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onImport}
                className="hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <Upload className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onExport}
                className="hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModernDashboardHeader;