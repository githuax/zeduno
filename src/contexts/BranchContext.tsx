/**
 * Branch Context Provider
 * Global state management for branch-related data with React Context
 */

import { useQueryClient } from '@tanstack/react-query';
import React, { createContext, useContext, useCallback, useEffect } from 'react';

import { useAuth } from '@/contexts/AuthContext';
import { useBranches, useBranchHierarchy } from '@/hooks/useBranches';
import { 
  Branch, 
  BranchContextType, 
  BranchFilters,
  CreateBranchData,
  UpdateBranchData
} from '@/types/branch.types';

// Create the context
const BranchContext = createContext<BranchContextType | undefined>(undefined);

// Custom hook to use the branch context
export const useBranchContext = (): BranchContextType => {
  const context = useContext(BranchContext);
  if (!context) {
    throw new Error('useBranchContext must be used within a BranchProvider');
  }
  return context;
};

// Provider component props
interface BranchProviderProps {
  children: React.ReactNode;
  defaultFilters?: BranchFilters;
}

/**
 * Branch Context Provider Component
 * Provides branch state and operations to the entire application
 */
export const BranchProvider: React.FC<BranchProviderProps> = ({ 
  children, 
  defaultFilters 
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Use the branches hook with default filters
  const branchesHook = useBranches(defaultFilters);
  const hierarchyHook = useBranchHierarchy();

  // Get current branch from user data and branches list
  const getCurrentBranch = useCallback((): Branch | undefined => {
    if (!user?.currentBranch || !branchesHook.branches.length) {
      return undefined;
    }
    
    return branchesHook.branches.find(branch => branch._id === user.currentBranch);
  }, [user?.currentBranch, branchesHook.branches]);

  // Enhanced branch operations with context updates
  const createBranch = useCallback(async (data: CreateBranchData): Promise<Branch> => {
    try {
      const newBranch = await branchesHook.createBranch(data);
      
      // Invalidate hierarchy to ensure it's updated with the new branch
      queryClient.invalidateQueries({ queryKey: ['branches', 'hierarchy'] });
      
      return newBranch;
    } catch (error) {
      console.error('BranchContext: Failed to create branch:', error);
      throw error;
    }
  }, [branchesHook.createBranch, queryClient]);

  const updateBranch = useCallback(async (id: string, data: UpdateBranchData): Promise<Branch> => {
    try {
      const updatedBranch = await branchesHook.updateBranch({ branchId: id, data });
      
      // If the updated branch is the current branch, update related queries
      if (user?.currentBranch === id) {
        queryClient.invalidateQueries({ queryKey: ['user'] });
        queryClient.invalidateQueries({ queryKey: ['tenant-context'] });
      }
      
      return updatedBranch;
    } catch (error) {
      console.error('BranchContext: Failed to update branch:', error);
      throw error;
    }
  }, [branchesHook.updateBranch, user?.currentBranch, queryClient]);

  const deleteBranch = useCallback(async (id: string): Promise<void> => {
    try {
      await branchesHook.deleteBranch(id);
      
      // If the deleted branch was the current branch, clear it
      if (user?.currentBranch === id) {
        // Update user's current branch to undefined or first available branch
        const remainingBranches = branchesHook.branches.filter(b => b._id !== id);
        if (remainingBranches.length > 0) {
          await branchesHook.switchBranch(remainingBranches[0]._id);
        }
      }
      
      // Invalidate hierarchy
      queryClient.invalidateQueries({ queryKey: ['branches', 'hierarchy'] });
    } catch (error) {
      console.error('BranchContext: Failed to delete branch:', error);
      throw error;
    }
  }, [branchesHook.deleteBranch, branchesHook.switchBranch, branchesHook.branches, user?.currentBranch, queryClient]);

  const cloneBranch = useCallback(async (sourceBranchId: string, data: CreateBranchData): Promise<Branch> => {
    try {
      const clonedBranch = await branchesHook.cloneBranch({ sourceBranchId, data });
      
      // Invalidate hierarchy to include the cloned branch
      queryClient.invalidateQueries({ queryKey: ['branches', 'hierarchy'] });
      
      return clonedBranch;
    } catch (error) {
      console.error('BranchContext: Failed to clone branch:', error);
      throw error;
    }
  }, [branchesHook.cloneBranch, queryClient]);

  const switchBranch = useCallback(async (branchId: string): Promise<void> => {
    try {
      await branchesHook.switchBranch(branchId);
      
      // Invalidate all user-related queries to reflect the branch switch
      queryClient.invalidateQueries({ queryKey: ['user'] });
      queryClient.invalidateQueries({ queryKey: ['tenant-context'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['menu'] });
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      
      // Emit custom event for other components to react to branch switch
      window.dispatchEvent(new CustomEvent('branchSwitched', { 
        detail: { branchId, branch: branchesHook.branches.find(b => b._id === branchId) }
      }));
    } catch (error) {
      console.error('BranchContext: Failed to switch branch:', error);
      throw error;
    }
  }, [branchesHook.switchBranch, branchesHook.branches, queryClient]);

  const assignUserToBranch = useCallback(async (userId: string, branchId: string): Promise<void> => {
    try {
      await branchesHook.assignUserToBranch({ userId, branchId });
      
      // Invalidate user and employee queries
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    } catch (error) {
      console.error('BranchContext: Failed to assign user to branch:', error);
      throw error;
    }
  }, [branchesHook.assignUserToBranch, queryClient]);

  const removeUserFromBranch = useCallback(async (userId: string, branchId: string): Promise<void> => {
    try {
      await branchesHook.removeUserFromBranch({ userId, branchId });
      
      // Invalidate user and employee queries
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    } catch (error) {
      console.error('BranchContext: Failed to remove user from branch:', error);
      throw error;
    }
  }, [branchesHook.removeUserFromBranch, queryClient]);

  // Enhanced fetch branches with context-aware error handling
  const fetchBranches = useCallback(async (filters?: BranchFilters): Promise<void> => {
    try {
      await branchesHook.refetch();
    } catch (error) {
      console.error('BranchContext: Failed to fetch branches:', error);
      throw error;
    }
  }, [branchesHook.refetch]);

  const fetchBranchHierarchy = useCallback(async () => {
    try {
      const result = await hierarchyHook.refetch();
      return result.data || [];
    } catch (error) {
      console.error('BranchContext: Failed to fetch branch hierarchy:', error);
      return [];
    }
  }, [hierarchyHook.refetch]);

  const fetchBranchMetrics = useCallback(async (
    branchId: string, 
    startDate?: Date, 
    endDate?: Date
  ) => {
    // This will be handled by the useBranchMetrics hook when called
    // We include it here for interface compatibility
    console.warn('fetchBranchMetrics should be called directly via useBranchMetrics hook');
    throw new Error('Use useBranchMetrics hook directly for metrics');
  }, []);

  const fetchConsolidatedMetrics = useCallback(async (
    startDate?: Date, 
    endDate?: Date
  ) => {
    // This will be handled by the useConsolidatedMetrics hook when called
    // We include it here for interface compatibility
    console.warn('fetchConsolidatedMetrics should be called directly via useConsolidatedMetrics hook');
    throw new Error('Use useConsolidatedMetrics hook directly for consolidated metrics');
  }, []);

  // Auto-refresh branches when user changes
  useEffect(() => {
    if (user) {
      branchesHook.refetch();
    }
  }, [user?.id, branchesHook.refetch]);

  // Context value
  const contextValue: BranchContextType = {
    // State
    branches: branchesHook.branches,
    currentBranch: getCurrentBranch(),
    loading: branchesHook.isLoading || hierarchyHook.isLoading,
    error: branchesHook.error?.message || hierarchyHook.error?.message,
    
    // Actions
    fetchBranches,
    fetchBranchHierarchy,
    createBranch,
    updateBranch,
    deleteBranch,
    cloneBranch,
    
    // User-Branch operations
    switchBranch,
    assignUserToBranch,
    removeUserFromBranch,
    
    // Metrics (interface compliance - actual implementation via hooks)
    fetchBranchMetrics,
    fetchConsolidatedMetrics,
  };

  return (
    <BranchContext.Provider value={contextValue}>
      {children}
    </BranchContext.Provider>
  );
};

/**
 * Higher-Order Component for branch context
 */
export const withBranchContext = <P extends object>(
  Component: React.ComponentType<P>
): React.ComponentType<P> => {
  return (props: P) => (
    <BranchProvider>
      <Component {...props} />
    </BranchProvider>
  );
};

/**
 * Utility hooks for common branch operations
 */

// Hook to get branches by specific criteria
export const useFilteredBranches = (filter: (branch: Branch) => boolean) => {
  const { branches } = useBranchContext();
  return React.useMemo(() => branches.filter(filter), [branches, filter]);
};

// Hook to get active branches only
export const useActiveBranches = () => {
  return useFilteredBranches(branch => branch.status === 'active');
};

// Hook to get branches by type
export const useBranchesByType = (type: 'main' | 'branch' | 'franchise') => {
  return useFilteredBranches(branch => branch.type === type);
};

// Hook to check if current user can manage branches
export const useCanManageBranches = () => {
  const { user } = useAuth();
  
  return React.useMemo(() => {
    if (!user) return false;
    return user.role === 'admin' || user.role === 'superadmin';
  }, [user]);
};

// Hook to get user's assigned branches
export const useUserBranches = () => {
  const { branches } = useBranchContext();
  const { user } = useAuth();
  
  return React.useMemo(() => {
    if (!user || !branches.length) return [];
    
    // Admins and superadmins can access all branches
    if (user.role === 'admin' || user.role === 'superadmin') {
      return branches;
    }
    
    // Regular users only access assigned branches
    return branches.filter(branch => 
      user.assignedBranches?.includes(branch._id)
    );
  }, [branches, user]);
};

// Hook for branch switching capability
export const useCanSwitchBranches = () => {
  const userBranches = useUserBranches();
  const { user } = useAuth();
  
  return React.useMemo(() => {
    if (!user) return false;
    if (user.role === 'admin' || user.role === 'superadmin') return true;
    
    return userBranches.length > 1;
  }, [user, userBranches.length]);
};

export default BranchContext;