import { 
  Building2, 
  MapPin, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Loader2,
  Store,
  Building
} from "lucide-react";
import React, { useState, useEffect } from 'react';

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useBranches } from "@/hooks/useBranches";
import { Branch } from "@/types/branch.types";

interface BranchSelectorProps {
  className?: string;
  showDetails?: boolean;
  compact?: boolean;
}

const BranchSelector: React.FC<BranchSelectorProps> = ({ 
  className, 
  showDetails = true, 
  compact = false 
}) => {
  const {
    currentBranch,
    loading,
    error,
    switchBranch,
    getUserAssignedBranches,
    canUserSwitchBranches,
  } = useBranches();
  
  const { toast } = useToast();
  const [switchingBranch, setSwitchingBranch] = useState<string | null>(null);

  const assignedBranches = getUserAssignedBranches();
  const canSwitch = canUserSwitchBranches();

  const getStatusIcon = (status: Branch['status']) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-3 w-3 text-green-500" />;
      case 'inactive':
        return <XCircle className="h-3 w-3 text-gray-500" />;
      case 'suspended':
        return <AlertCircle className="h-3 w-3 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: Branch['status']) => {
    const variants = {
      active: 'default',
      inactive: 'secondary',
      suspended: 'destructive'
    } as const;
    
    return (
      <Badge variant={variants[status]} className="text-xs">
        {status}
      </Badge>
    );
  };

  const getTypeIcon = (type: Branch['type']) => {
    switch (type) {
      case 'main':
        return <Building className="h-4 w-4 text-blue-600" />;
      case 'branch':
        return <Building2 className="h-4 w-4 text-green-600" />;
      case 'franchise':
        return <Store className="h-4 w-4 text-purple-600" />;
      default:
        return <Building2 className="h-4 w-4" />;
    }
  };

  const formatOperationHours = (branch: Branch) => {
    if (!branch.operations?.openTime || !branch.operations?.closeTime) {
      return 'Hours not set';
    }
    return `${branch.operations.openTime} - ${branch.operations.closeTime}`;
  };

  const handleBranchSwitch = async (branchId: string) => {
    if (!canSwitch) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to switch branches.",
        variant: "destructive",
      });
      return;
    }

    if (branchId === currentBranch?._id) {
      return; // Same branch, no need to switch
    }

    setSwitchingBranch(branchId);

    try {
      await switchBranch(branchId);
      
      const selectedBranch = assignedBranches.find(b => b._id === branchId);
      toast({
        title: "Branch Switched",
        description: `Successfully switched to ${selectedBranch?.name || 'selected branch'}.`,
        variant: "default",
      });
    } catch (error: any) {
      console.error('Failed to switch branch:', error);
      toast({
        title: "Switch Failed",
        description: error.message || "Failed to switch branch. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSwitchingBranch(null);
    }
  };

  // Loading state
  if (loading && !currentBranch) {
    return (
      <Card className={className}>
        <CardHeader className={compact ? "pb-2" : ""}>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Branch Selection
          </CardTitle>
          {!compact && (
            <CardDescription>
              Loading your branch information...
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full" />
          </div>
          {showDetails && !compact && (
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-16 w-full" />
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error && !currentBranch) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load branch information: {error}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // No branches available
  if (!assignedBranches.length) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <Alert>
            <Building2 className="h-4 w-4" />
            <AlertDescription>
              No branches are assigned to your account. Please contact your administrator.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className={compact ? "pb-2" : ""}>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Branch Selection
        </CardTitle>
        {!compact && (
          <CardDescription>
            {canSwitch 
              ? `Switch between your assigned branches (${assignedBranches.length} available)`
              : "View your current branch information"
            }
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label 
            className="text-sm font-medium mb-2 block"
            id="branch-selector-label"
          >
            Current Branch
          </label>
          <Select 
            value={currentBranch?._id || ""} 
            onValueChange={handleBranchSwitch}
            disabled={!canSwitch || switchingBranch !== null}
            aria-labelledby="branch-selector-label"
          >
            <SelectTrigger 
              className="min-h-[2.5rem]"
              aria-label={`Current branch: ${currentBranch?.name || 'No branch selected'}`}
            >
              <SelectValue placeholder="Select a branch">
                {currentBranch && (
                  <div className="flex items-center gap-2">
                    {getTypeIcon(currentBranch.type)}
                    <div className="flex flex-col text-left min-w-0">
                      <div className="font-medium truncate">
                        {currentBranch.name}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {currentBranch.code} • {currentBranch.address.city}
                      </div>
                    </div>
                  </div>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {assignedBranches.map((branch) => (
                <SelectItem 
                  key={branch._id} 
                  value={branch._id}
                  disabled={switchingBranch === branch._id}
                  aria-label={`Select ${branch.name} branch`}
                >
                  <div className="flex items-center justify-between w-full min-w-0">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {getTypeIcon(branch.type)}
                      <div className="flex flex-col min-w-0 flex-1">
                        <div className="font-medium truncate">
                          {branch.name}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {branch.code} • {branch.address.city}, {branch.address.state}
                        </div>
                      </div>
                      {switchingBranch === branch._id && (
                        <Loader2 className="h-3 w-3 animate-spin ml-2" />
                      )}
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      {getStatusIcon(branch.status)}
                      {getStatusBadge(branch.status)}
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {!canSwitch && (
            <p className="text-xs text-muted-foreground mt-1">
              You don't have permission to switch branches.
            </p>
          )}
        </div>

        {showDetails && currentBranch && !compact && (
          <div className="space-y-3 pt-4 border-t">
            <h4 className="font-medium text-sm text-muted-foreground">
              Branch Details
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Type:</span>
                <div className="font-medium capitalize flex items-center gap-1 mt-1">
                  {getTypeIcon(currentBranch.type)}
                  {currentBranch.type}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Status:</span>
                <div className="font-medium capitalize flex items-center gap-1 mt-1">
                  {getStatusIcon(currentBranch.status)}
                  {currentBranch.status}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Code:</span>
                <div className="font-medium mt-1">
                  {currentBranch.code}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Currency:</span>
                <div className="font-medium mt-1">
                  {currentBranch.financial?.currency || 'Not set'}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                Location
              </div>
              <div className="text-sm">
                <div>{currentBranch.address.street}</div>
                <div className="text-muted-foreground">
                  {currentBranch.address.city}, {currentBranch.address.state} {currentBranch.address.postalCode}
                </div>
                <div className="text-muted-foreground">
                  {currentBranch.address.country}
                </div>
              </div>
            </div>

            {currentBranch.operations && (
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Operating Hours
                </div>
                <div className="text-sm font-medium">
                  {formatOperationHours(currentBranch)}
                </div>
                {currentBranch.operations.daysOpen && (
                  <div className="text-xs text-muted-foreground">
                    Open: {currentBranch.operations.daysOpen.join(', ')}
                  </div>
                )}
              </div>
            )}

            {currentBranch.contact && (
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">
                  Contact Information
                </div>
                <div className="text-sm">
                  {currentBranch.contact.managerName && (
                    <div className="font-medium">
                      {currentBranch.contact.managerName}
                    </div>
                  )}
                  <div className="text-muted-foreground">
                    {currentBranch.contact.email}
                  </div>
                  <div className="text-muted-foreground">
                    {currentBranch.contact.phone}
                  </div>
                </div>
              </div>
            )}

            {assignedBranches.length > 1 && canSwitch && (
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Could open a branch management dialog or navigate to branch settings
                    console.log('View all branches');
                  }}
                  className="flex-1"
                >
                  View All Branches
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Switch in progress indicator */}
        {switchingBranch && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Switching branch...
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BranchSelector;