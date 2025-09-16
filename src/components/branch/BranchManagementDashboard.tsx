import { 
  Search,
  Filter,
  Plus,
  MoreHorizontal,
  Grid3X3,
  List,
  Download,
  Upload,
  Trash2,
  Edit2,
  Eye,
  Copy,
  Users,
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  MapPin,
  Phone,
  Mail,
  Clock,
  DollarSign,
  TrendingUp,
  Building2,
  ChevronRight,
  ChevronDown,
  Settings,
  BarChart3,
  Calendar,
  FileUp,
  FileDown,
  UserPlus,
  UserMinus,
  Zap,
  Shield,
  CheckSquare,
  Square,
  Loader2,
  RefreshCw
} from 'lucide-react';
import React, { useState, useEffect, useCallback, useMemo } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useBranchContext, useCanManageBranches, useUserBranches } from '@/contexts/BranchContext';
import { Branch, BranchHierarchy, CreateBranchData, UpdateBranchData, BranchFilters } from '@/types/branch.types';
import { formatCurrency as formatCurrencyUtil } from '@/utils/currency';

import { BranchCard } from './BranchCard';
import { BranchHierarchyView } from './BranchHierarchyView';
import { CreateBranchModal } from './CreateBranchModal';
import { EditBranchModal } from './EditBranchModal';
import { ModernBranchCard } from './ModernBranchCard';
import { ModernDashboardHeader } from './ModernDashboardHeader';

// UI Components
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

// Types
interface ViewMode {
  type: 'table' | 'grid';
}

interface BulkAction {
  type: 'activate' | 'deactivate' | 'delete' | 'assign' | 'clone';
  branches: string[];
}

interface ImportExportData {
  branches: Branch[];
  metadata: {
    exportDate: string;
    version: string;
    totalCount: number;
  };
}

interface WizardStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

interface BranchFormData extends CreateBranchData {
  operations: {
    openTime: string;
    closeTime: string;
    timezone: string;
    daysOpen: string[];
    seatingCapacity?: number;
    deliveryRadius?: number;
  };
  financial: {
    currency: string;
    taxRate: number;
    serviceChargeRate?: number;
    tipEnabled: boolean;
    paymentMethods: string[];
  };
  inventory: {
    trackInventory: boolean;
    lowStockAlertEnabled: boolean;
    autoReorderEnabled: boolean;
  };
  staffing: {
    maxStaff: number;
    roles: string[];
  };
  integrations: {
    onlineOrderingEnabled: boolean;
  };
  settings: {
    orderPrefix: string;
    theme?: string;
  };
}

// Status configuration
const statusConfig = {
  active: { 
    label: 'Active', 
    color: 'success', 
    icon: CheckCircle2,
    description: 'Branch is operational'
  },
  inactive: { 
    label: 'Inactive', 
    color: 'secondary', 
    icon: XCircle,
    description: 'Branch is temporarily closed'
  },
  suspended: { 
    label: 'Suspended', 
    color: 'destructive', 
    icon: AlertCircle,
    description: 'Branch operations suspended'
  }
};

const typeConfig = {
  main: { label: 'Main Branch', icon: Building2, color: 'default' },
  branch: { label: 'Branch', icon: MapPin, color: 'secondary' },
  franchise: { label: 'Franchise', icon: Users, color: 'outline' }
};

// Utility functions
const formatCurrency = (amount: number, currency: string = 'KES'): string => {
  // Use shared currency utility to honor selected branch currency and symbols
  return formatCurrencyUtil(amount, currency);
};

const formatAddress = (address: Branch['address']): string => {
  return `${address.street}, ${address.city}, ${address.state} ${address.postalCode}`;
};

const formatTime = (time: string): string => {
  return new Date(`2000-01-01T${time}`).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};

// Main Dashboard Component
export const BranchManagementDashboard: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const {
    branches,
    currentBranch,
    loading,
    error,
    fetchBranches,
    fetchBranchHierarchy,
    createBranch,
    updateBranch,
    deleteBranch,
    cloneBranch,
    assignUserToBranch,
    removeUserFromBranch,
  } = useBranchContext();

  // State management
  const [viewMode, setViewMode] = useState<ViewMode>({ type: 'table' });
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<BranchFilters>({});
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [branchHierarchy, setBranchHierarchy] = useState<BranchHierarchy[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  
  // Modal states
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showUserAssignDialog, setShowUserAssignDialog] = useState(false);
  
  // Form states
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [wizardStep, setWizardStep] = useState(0);
  const [formData, setFormData] = useState<Partial<BranchFormData>>({});
  const [bulkAction, setBulkAction] = useState<BulkAction | null>(null);
  const [importData, setImportData] = useState<File | null>(null);
  const [isCreatingBranch, setIsCreatingBranch] = useState(false);
  
  // Real-time updates
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Permission checks
  const canManageBranches = useCanManageBranches();
  const userBranches = useUserBranches();
  
  const canUserAccessBranch = useCallback((branchId: string) => {
    // Admins can access all branches
    if (user?.role === 'admin' || user?.role === 'superadmin') return true;
    // Regular users can only access their assigned branches
    return userBranches.some(branch => branch._id === branchId);
  }, [user?.role, userBranches]);
  
  const canEditBranch = useCallback((branch: Branch) => {
    if (!canManageBranches) return false;
    return canUserAccessBranch(branch._id);
  }, [canManageBranches, canUserAccessBranch]);

  // Wizard steps configuration
  const wizardSteps: WizardStep[] = [
    { id: 'basic', title: 'Basic Information', description: 'Branch name, type, and parent', completed: false },
    { id: 'address', title: 'Address & Contact', description: 'Location and contact details', completed: false },
    { id: 'operations', title: 'Operations', description: 'Hours, capacity, and operational settings', completed: false },
    { id: 'financial', title: 'Financial Settings', description: 'Currency, taxes, and payment methods', completed: false },
    { id: 'additional', title: 'Additional Settings', description: 'Inventory, staffing, and integrations', completed: false },
    { id: 'review', title: 'Review & Create', description: 'Review all settings before creating', completed: false }
  ];

  // Initialize data
  useEffect(() => {
    const loadData = async () => {
      try {
        await fetchBranches(filters);
        const hierarchy = await fetchBranchHierarchy();
        setBranchHierarchy(hierarchy);
      } catch (error) {
        toast({
          title: "Error loading branches",
          description: error instanceof Error ? error.message : "Unknown error occurred",
          variant: "destructive",
        });
      }
    };

    loadData();
  }, [fetchBranches, fetchBranchHierarchy, filters, toast]);

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(async () => {
      try {
        await fetchBranches(filters);
        setLastUpdated(new Date());
      } catch (error) {
        // Silent refresh failure
      }
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, fetchBranches, filters]);

  // Filter and search logic
  const filteredBranches = useMemo(() => {
    return branches.filter(branch => {
      // Search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const matchesSearch = 
          branch.name.toLowerCase().includes(search) ||
          branch.code.toLowerCase().includes(search) ||
          branch.contact.email.toLowerCase().includes(search) ||
          formatAddress(branch.address).toLowerCase().includes(search) ||
          branch.contact.managerName?.toLowerCase().includes(search);
        
        if (!matchesSearch) return false;
      }

      // Status filter
      if (filters.status && branch.status !== filters.status) return false;
      
      // Type filter  
      if (filters.type && branch.type !== filters.type) return false;

      // Permission filter
      if (!canUserAccessBranch(branch._id)) return false;

      return true;
    });
  }, [branches, searchTerm, filters, canUserAccessBranch]);

  // Selection handlers
  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      setSelectedBranches(filteredBranches.map(b => b._id));
    } else {
      setSelectedBranches([]);
    }
  }, [filteredBranches]);

  const handleSelectBranch = useCallback((branchId: string, checked: boolean) => {
    if (checked) {
      setSelectedBranches(prev => [...prev, branchId]);
    } else {
      setSelectedBranches(prev => prev.filter(id => id !== branchId));
    }
  }, []);

  // CRUD handlers
  const handleCreateBranch = useCallback(async (data: CreateBranchData) => {
    if (!canManageBranches) return;

    setIsCreatingBranch(true);
    try {
      await createBranch(data);
      setShowCreateDialog(false);
      
      toast({
        title: "Branch created successfully",
        description: `${data.name} has been added to your branch network`,
      });
      
      // Refresh branches list
      await fetchBranches();
    } catch (error) {
      toast({
        title: "Failed to create branch",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsCreatingBranch(false);
    }
  }, [canManageBranches, createBranch, toast, fetchBranches]);

  const handleCreateFromTemplate = useCallback(() => {
    // This would open a template selection dialog
    toast({
      title: "Create from Template", 
      description: "Template-based branch creation coming soon!",
    });
  }, [toast]);

  const handleCloneBranchFromDropdown = useCallback(() => {
    // For dropdown usage, we need to show a dialog to select which branch to clone
    // For now, we'll show a message that it needs implementation
    toast({
      title: "Clone Branch",
      description: "Please select a branch from the grid to clone it.",
    });
  }, [toast]);

  const handleUpdateBranch = useCallback(async () => {
    if (!selectedBranch || !formData || !canEditBranch(selectedBranch)) return;

    try {
      const updateData: UpdateBranchData = { ...formData };
      await updateBranch(selectedBranch._id, updateData);
      setShowEditDialog(false);
      setSelectedBranch(null);
      setFormData({});

      toast({
        title: "Branch updated successfully",
        description: `${selectedBranch.name} has been updated`,
      });
    } catch (error) {
      toast({
        title: "Failed to update branch",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    }
  }, [selectedBranch, formData, updateBranch, canEditBranch, toast]);

  const handleDeleteBranch = useCallback(async () => {
    if (!selectedBranch || !canEditBranch(selectedBranch)) return;

    try {
      await deleteBranch(selectedBranch._id);
      setShowDeleteDialog(false);
      setSelectedBranch(null);

      toast({
        title: "Branch deleted successfully",
        description: `${selectedBranch.name} has been removed from your branch network`,
      });
    } catch (error) {
      toast({
        title: "Failed to delete branch",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    }
  }, [selectedBranch, deleteBranch, canEditBranch, toast]);

  const handleCloneBranch = useCallback(async (sourceBranch: Branch) => {
    if (!canManageBranches) return;

    try {
      const cloneData: CreateBranchData = {
        name: `${sourceBranch.name} - Copy`,
        type: sourceBranch.type,
        parentBranchId: sourceBranch.parentBranchId,
        address: { ...sourceBranch.address },
        contact: { ...sourceBranch.contact },
        operations: { ...sourceBranch.operations },
        financial: { ...sourceBranch.financial }
      };

      await cloneBranch(sourceBranch._id, cloneData);
      
      toast({
        title: "Branch cloned successfully",
        description: `${cloneData.name} has been created based on ${sourceBranch.name}`,
      });
    } catch (error) {
      toast({
        title: "Failed to clone branch",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    }
  }, [canManageBranches, cloneBranch, toast]);

  // Bulk operations
  const handleBulkAction = useCallback(async () => {
    if (!bulkAction || selectedBranches.length === 0) return;

    try {
      switch (bulkAction.type) {
        case 'activate':
          for (const branchId of selectedBranches) {
            await updateBranch(branchId, { status: 'active' });
          }
          toast({
            title: "Branches activated",
            description: `${selectedBranches.length} branches have been activated`,
          });
          break;

        case 'deactivate':
          for (const branchId of selectedBranches) {
            await updateBranch(branchId, { status: 'inactive' });
          }
          toast({
            title: "Branches deactivated",
            description: `${selectedBranches.length} branches have been deactivated`,
          });
          break;

        case 'delete':
          for (const branchId of selectedBranches) {
            await deleteBranch(branchId);
          }
          toast({
            title: "Branches deleted",
            description: `${selectedBranches.length} branches have been deleted`,
          });
          break;
      }

      setSelectedBranches([]);
      setBulkAction(null);
      setShowBulkDialog(false);
    } catch (error) {
      toast({
        title: "Bulk operation failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    }
  }, [bulkAction, selectedBranches, updateBranch, deleteBranch, toast]);

  // Import/Export functionality
  const handleExportBranches = useCallback(() => {
    const exportData: ImportExportData = {
      branches: filteredBranches,
      metadata: {
        exportDate: new Date().toISOString(),
        version: '1.0',
        totalCount: filteredBranches.length
      }
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `branches-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Export completed",
      description: `${filteredBranches.length} branches exported successfully`,
    });
  }, [filteredBranches, toast]);

  const handleImportBranches = useCallback(async () => {
    if (!importData || !canManageBranches) return;

    try {
      const text = await importData.text();
      const data: ImportExportData = JSON.parse(text);
      
      let successCount = 0;
      let errorCount = 0;

      for (const branchData of data.branches) {
        try {
          const createData: CreateBranchData = {
            name: branchData.name,
            type: branchData.type,
            parentBranchId: branchData.parentBranchId,
            address: branchData.address,
            contact: branchData.contact,
            operations: branchData.operations,
            financial: branchData.financial
          };
          
          await createBranch(createData);
          successCount++;
        } catch {
          errorCount++;
        }
      }

      setShowImportDialog(false);
      setImportData(null);

      toast({
        title: "Import completed",
        description: `Successfully imported ${successCount} branches${errorCount > 0 ? `, ${errorCount} failed` : ''}`,
        variant: errorCount > 0 ? "destructive" : "default",
      });
    } catch (error) {
      toast({
        title: "Import failed",
        description: "Failed to parse import file. Please check the file format.",
        variant: "destructive",
      });
    }
  }, [importData, canManageBranches, createBranch, toast]);

  // Hierarchy management
  const toggleNodeExpansion = useCallback((nodeId: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  }, []);

  // Search and filter handlers
  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
  }, []);

  const handleFilterChange = useCallback((key: keyof BranchFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
    setSearchTerm('');
  }, []);

  // Real-time refresh
  const handleRefresh = useCallback(async () => {
    try {
      await fetchBranches(filters);
      const hierarchy = await fetchBranchHierarchy();
      setBranchHierarchy(hierarchy);
      setLastUpdated(new Date());
      
      toast({
        title: "Data refreshed",
        description: "Branch information has been updated",
      });
    } catch (error) {
      toast({
        title: "Refresh failed",
        description: "Failed to refresh branch data",
        variant: "destructive",
      });
    }
  }, [fetchBranches, fetchBranchHierarchy, filters, toast]);

  // Branch Details Dialog Component
  const BranchDetailsDialog = ({ 
    open, 
    onOpenChange, 
    branch, 
    onEdit, 
    onClone, 
    canEdit 
  }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    branch: Branch | null;
    onEdit: () => void;
    onClone: () => void;
    canEdit: boolean;
  }) => {
    if (!branch) return null;
    
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{branch.name}</DialogTitle>
            <DialogDescription>
              Branch details and information
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Type</Label>
                <p className="text-sm text-muted-foreground capitalize">{branch.type}</p>
              </div>
              <div>
                <Label>Status</Label>
                <p className="text-sm text-muted-foreground capitalize">{branch.status}</p>
              </div>
              <div>
                <Label>Address</Label>
                <p className="text-sm text-muted-foreground">{branch.address || 'N/A'}</p>
              </div>
              <div>
                <Label>Contact</Label>
                <p className="text-sm text-muted-foreground">{branch.contact?.phone || 'N/A'}</p>
              </div>
            </div>
            
            <div className="flex gap-2 pt-4">
              {canEdit && (
                <Button onClick={onEdit} variant="outline">
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              )}
              <Button onClick={onClone} variant="outline">
                <Copy className="w-4 h-4 mr-2" />
                Clone
              </Button>
              <Button onClick={() => onOpenChange(false)} variant="outline">
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  // Import Branches Dialog Component  
  const ImportBranchesDialog = ({
    open,
    onOpenChange,
    onFileChange,
    onSubmit,
    loading
  }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onFileChange: (file: File | null) => void;
    onSubmit: () => void;
    loading: boolean;
  }) => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0] || null;
      if (file && file.type === 'application/json') {
        setSelectedFile(file);
        onFileChange(file);
      } else if (file) {
        toast({
          title: "Invalid file type",
          description: "Please select a JSON file",
          variant: "destructive",
        });
      }
    };

    const handleSubmit = () => {
      if (selectedFile) {
        onSubmit();
        setSelectedFile(null);
      }
    };

    const handleClose = (open: boolean) => {
      if (!open) {
        setSelectedFile(null);
        onFileChange(null);
      }
      onOpenChange(open);
    };

    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Import Branches</DialogTitle>
            <DialogDescription>
              Upload a JSON file containing branch data to import multiple branches at once.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="import-file">Select JSON File</Label>
              <Input
                id="import-file"
                type="file"
                accept=".json,application/json"
                onChange={handleFileSelect}
                className="mt-2"
              />
              {selectedFile && (
                <p className="text-sm text-muted-foreground mt-2">
                  Selected: {selectedFile.name}
                </p>
              )}
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => handleClose(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!selectedFile || loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Import
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  // Loading states
  if (loading && branches.length === 0) {
    return (
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96 mt-2" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="flex gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="p-6 space-y-6">
        {/* Modern Header */}
        <ModernDashboardHeader
          onCreateBranch={() => setShowCreateDialog(true)}
          onCloneBranch={handleCloneBranchFromDropdown}
          onCreateFromTemplate={handleCreateFromTemplate}
          onSearch={handleSearchChange}
          onFilterChange={(newFilters) => setFilters(prev => ({ ...prev, ...newFilters }))}
          onViewChange={(view) => setViewMode({ type: view })}
          onExport={handleExportBranches}
          onImport={handleImportBranches}
          onRefresh={handleRefresh}
          currentView={viewMode.type as 'grid' | 'list'}
          branchCount={filteredBranches.length}
          activeCount={filteredBranches.filter(b => b.status === 'active').length}
          isCreating={isCreatingBranch}
          canCreateBranch={canManageBranches}
        />

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{typeof error === 'string' ? error : error.message || 'An error occurred'}</AlertDescription>
        </Alert>
      )}

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search branches by name, code, email, address, or manager..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* View Toggle */}
            <div className="flex items-center border rounded-lg p-1">
              <Button
                variant={viewMode.type === 'table' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode({ type: 'table' })}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode.type === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode({ type: 'grid' })}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
            </div>

            {/* Filter Toggle */}
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className={showFilters ? 'bg-accent' : ''}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {Object.keys(filters).length > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 flex items-center justify-center">
                  {Object.keys(filters).length}
                </Badge>
              )}
            </Button>

            {/* Actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <MoreHorizontal className="h-4 w-4 mr-2" />
                  Actions
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Import/Export</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setShowImportDialog(true)}>
                  <Upload className="h-4 w-4 mr-2" />
                  Import Branches
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportBranches}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Branches
                </DropdownMenuItem>
                
                {selectedBranches.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Bulk Actions ({selectedBranches.length})</DropdownMenuLabel>
                    <DropdownMenuItem 
                      onClick={() => {
                        setBulkAction({ type: 'activate', branches: selectedBranches });
                        setShowBulkDialog(true);
                      }}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Activate Selected
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => {
                        setBulkAction({ type: 'deactivate', branches: selectedBranches });
                        setShowBulkDialog(true);
                      }}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Deactivate Selected
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => {
                        setBulkAction({ type: 'delete', branches: selectedBranches });
                        setShowBulkDialog(true);
                      }}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Selected
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <>
              <Separator className="my-4" />
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <Select
                    value={filters.status || ''}
                    onValueChange={(value) => handleFilterChange('status', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All statuses</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium">Type</Label>
                  <Select
                    value={filters.type || ''}
                    onValueChange={(value) => handleFilterChange('type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All types</SelectItem>
                      <SelectItem value="main">Main Branch</SelectItem>
                      <SelectItem value="branch">Branch</SelectItem>
                      <SelectItem value="franchise">Franchise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-3 lg:col-span-1 flex items-end">
                  <Button
                    variant="outline"
                    onClick={clearFilters}
                    disabled={Object.keys(filters).length === 0 && !searchTerm}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Clear
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div>
          Showing {filteredBranches.length} of {branches.length} branches
          {selectedBranches.length > 0 && (
            <span className="ml-2 font-medium">
              • {selectedBranches.length} selected
            </span>
          )}
        </div>
        {Object.keys(filters).length > 0 && (
          <Button
            variant="link"
            size="sm"
            onClick={clearFilters}
            className="h-auto p-0 text-xs"
          >
            Clear all filters
          </Button>
        )}
      </div>

      {/* Branch List/Grid */}
      {viewMode.type === 'table' ? (
        <BranchTable
          branches={filteredBranches}
          selectedBranches={selectedBranches}
          onSelectAll={handleSelectAll}
          onSelectBranch={handleSelectBranch}
          onEditBranch={(branch) => {
            setSelectedBranch(branch);
            setFormData(branch);
            setShowEditDialog(true);
          }}
          onViewBranch={(branch) => {
            setSelectedBranch(branch);
            setShowDetailsDialog(true);
          }}
          onCloneBranch={handleCloneBranch}
          onDeleteBranch={(branch) => {
            setSelectedBranch(branch);
            setShowDeleteDialog(true);
          }}
          canEdit={canEditBranch}
          loading={loading}
        />
      ) : (
        <BranchGrid
          branches={filteredBranches}
          selectedBranches={selectedBranches}
          onSelectBranch={handleSelectBranch}
          onEditBranch={(branch) => {
            setSelectedBranch(branch);
            setFormData(branch);
            setShowEditDialog(true);
          }}
          onViewBranch={(branch) => {
            setSelectedBranch(branch);
            setShowDetailsDialog(true);
          }}
          onCloneBranch={handleCloneBranch}
          onDeleteBranch={(branch) => {
            setSelectedBranch(branch);
            setShowDeleteDialog(true);
          }}
          canEdit={canEditBranch}
          loading={loading}
        />
      )}

      {/* Branch Hierarchy Tab */}
      <Card>
        <CardHeader>
          <CardTitle>Branch Hierarchy</CardTitle>
          <CardDescription>
            Visual representation of your branch structure and relationships
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BranchHierarchyView
            hierarchy={branchHierarchy}
            expandedNodes={expandedNodes}
            onToggleExpansion={toggleNodeExpansion}
            onSelectBranch={(branch) => {
              setSelectedBranch(branch);
              setShowDetailsDialog(true);
            }}
          />
        </CardContent>
      </Card>

      {/* Create Branch Dialog */}
      <CreateBranchModal
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSubmit={handleCreateBranch}
        branches={branches}
        loading={isCreatingBranch}
      />

      {/* Edit Branch Dialog */}
      <EditBranchModal
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        branch={selectedBranch}
        formData={formData}
        onFormDataChange={setFormData}
        onSubmit={handleUpdateBranch}
        loading={loading}
      />

      {/* Branch Details Dialog */}
      <BranchDetailsDialog
        open={showDetailsDialog}
        onOpenChange={setShowDetailsDialog}
        branch={selectedBranch}
        onEdit={() => {
          setShowDetailsDialog(false);
          setFormData(selectedBranch || {});
          setShowEditDialog(true);
        }}
        onClone={() => {
          if (selectedBranch) {
            handleCloneBranch(selectedBranch);
          }
        }}
        canEdit={selectedBranch ? canEditBranch(selectedBranch) : false}
      />

      {/* Bulk Action Confirmation Dialog */}
      <AlertDialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Confirm Bulk Action
            </AlertDialogTitle>
            <AlertDialogDescription>
              {bulkAction && (
                <>
                  You are about to {bulkAction.type} {selectedBranches.length} branches.
                  {bulkAction.type === 'delete' && (
                    <span className="text-destructive font-medium">
                      {' '}This action cannot be undone.
                    </span>
                  )}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkAction}
              className={bulkAction?.type === 'delete' ? 'bg-destructive hover:bg-destructive/90' : ''}
            >
              {bulkAction?.type === 'delete' ? 'Delete' : 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Branch</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedBranch?.name}"?
              <span className="text-destructive font-medium">
                {' '}This action cannot be undone.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteBranch}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Import Dialog */}
      <ImportBranchesDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        onFileChange={setImportData}
        onSubmit={handleImportBranches}
        loading={loading}
      />
    </div>
    </div>
  );
};

// Branch Table Component
interface BranchTableProps {
  branches: Branch[];
  selectedBranches: string[];
  onSelectAll: (checked: boolean) => void;
  onSelectBranch: (branchId: string, checked: boolean) => void;
  onEditBranch: (branch: Branch) => void;
  onViewBranch: (branch: Branch) => void;
  onCloneBranch: (branch: Branch) => void;
  onDeleteBranch: (branch: Branch) => void;
  canEdit: (branch: Branch) => boolean;
  loading: boolean;
}

const BranchTable: React.FC<BranchTableProps> = ({
  branches,
  selectedBranches,
  onSelectAll,
  onSelectBranch,
  onEditBranch,
  onViewBranch,
  onCloneBranch,
  onDeleteBranch,
  canEdit,
  loading
}) => {
  const allSelected = branches.length > 0 && selectedBranches.length === branches.length;
  const someSelected = selectedBranches.length > 0 && selectedBranches.length < branches.length;

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={allSelected}
                onCheckedChange={onSelectAll}
                ref={(el) => {
                  if (el) el.indeterminate = someSelected;
                }}
              />
            </TableHead>
            <TableHead>Branch</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Manager</TableHead>
            <TableHead>Performance</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {branches.map((branch) => {
            const StatusIcon = statusConfig[branch.status].icon;
            const TypeIcon = typeConfig[branch.type].icon;
            
            return (
              <TableRow key={branch._id}>
                <TableCell>
                  <Checkbox
                    checked={selectedBranches.includes(branch._id)}
                    onCheckedChange={(checked) => 
                      onSelectBranch(branch._id, Boolean(checked))
                    }
                  />
                </TableCell>
                
                <TableCell>
                  <div className="flex items-center gap-3">
                    {branch.settings?.logoUrl ? (
                      <img 
                        src={branch.settings.logoUrl} 
                        alt={branch.name}
                        className="h-10 w-10 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                    <div>
                      <div className="font-medium">{branch.name}</div>
                      <div className="text-sm text-muted-foreground">{branch.code}</div>
                    </div>
                  </div>
                </TableCell>

                <TableCell>
                  <Badge variant={typeConfig[branch.type].color as any} className="gap-1">
                    <TypeIcon className="h-3 w-3" />
                    {typeConfig[branch.type].label}
                  </Badge>
                </TableCell>

                <TableCell>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge 
                          variant={statusConfig[branch.status].color as any}
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
                </TableCell>

                <TableCell>
                  <div className="text-sm">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {branch.address.city}, {branch.address.state}
                    </div>
                  </div>
                </TableCell>

                <TableCell>
                  {branch.contact.managerName ? (
                    <div className="text-sm">
                      <div>{branch.contact.managerName}</div>
                      <div className="text-muted-foreground">
                        {branch.contact.managerPhone || branch.contact.phone}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">Not assigned</div>
                  )}
                </TableCell>

                <TableCell>
                  <div className="text-sm space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Revenue:</span>
                      <span className="font-medium">
                        {formatCurrency(branch.metrics.totalRevenue, branch.financial.currency)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Orders:</span>
                      <span>{branch.metrics.totalOrders.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">AOV:</span>
                      <span>
                        {formatCurrency(branch.metrics.avgOrderValue, branch.financial.currency)}
                      </span>
                    </div>
                  </div>
                </TableCell>

                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      
                      {canEdit(branch) && (
                        <>
                          <DropdownMenuItem onClick={() => onEditBranch(branch)}>
                            <Edit2 className="h-4 w-4 mr-2" />
                            Edit Branch
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onCloneBranch(branch)}>
                            <Copy className="h-4 w-4 mr-2" />
                            Clone Branch
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => onDeleteBranch(branch)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Branch
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {branches.length === 0 && !loading && (
        <div className="p-8 text-center text-muted-foreground">
          <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium">No branches found</h3>
          <p>Try adjusting your search criteria or filters</p>
        </div>
      )}
    </Card>
  );
};

// Branch Grid Component
interface BranchGridProps extends Omit<BranchTableProps, 'onSelectAll'> {}

const BranchGrid: React.FC<BranchGridProps> = ({
  branches,
  selectedBranches,
  onSelectBranch,
  onEditBranch,
  onViewBranch,
  onCloneBranch,
  onDeleteBranch,
  canEdit,
  loading
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {branches.map((branch) => {
        return (
          <ModernBranchCard
            key={branch._id}
            branch={branch}
            onEdit={() => onEditBranch(branch)}
            onDelete={() => onDeleteBranch(branch)}
            onView={() => onViewBranch(branch)}
          />
        );
      })}

      {branches.length === 0 && !loading && (
        <div className="col-span-full p-8 text-center text-muted-foreground">
          <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium">No branches found</h3>
          <p>Try adjusting your search criteria or filters</p>
        </div>
      )}
    </div>
  );
};

export default BranchManagementDashboard;
