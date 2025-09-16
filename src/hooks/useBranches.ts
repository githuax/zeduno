/**
 * Branch Management React Hook
 * Modern React Query-based hook for branch operations with caching and state management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useAuth } from '@/contexts/AuthContext';
import { BranchService } from '@/services/branch.service';
import { 
  Branch, 
  BranchHierarchy, 
  BranchMetrics, 
  ConsolidatedMetrics,
  CreateBranchData, 
  UpdateBranchData, 
  BranchFilters 
} from '@/types/branch.types';

// Query Keys for React Query cache management
const QUERY_KEYS = {
  branches: (filters?: BranchFilters) => ['branches', filters],
  branch: (id: string) => ['branches', id],
  hierarchy: () => ['branches', 'hierarchy'],
  metrics: (branchId: string, startDate?: Date, endDate?: Date) => [
    'branches', branchId, 'metrics', startDate?.toISOString(), endDate?.toISOString()
  ],
  consolidatedMetrics: (startDate?: Date, endDate?: Date) => [
    'branches', 'metrics', 'consolidated', startDate?.toISOString(), endDate?.toISOString()
  ],
} as const;

/**
 * Main branch management hook with React Query integration
 */
export const useBranches = (filters?: BranchFilters) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Fetch branches with React Query caching
  const branchesQuery = useQuery({
    queryKey: QUERY_KEYS.branches(filters),
    queryFn: () => BranchService.getBranches(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes (formerly cacheTime)
    retry: (failureCount, error) => {
      // Don't retry on 401/403 errors
      if (error instanceof Error && error.message.includes('401') || error.message.includes('403')) {
        return false;
      }
      return failureCount < 3;
    },
    enabled: !!user, // Only fetch when user is authenticated
  });

  // Create branch mutation
  const createBranchMutation = useMutation({
    mutationFn: (data: CreateBranchData) => BranchService.createBranch(data),
    onSuccess: (newBranch) => {
      // Update branches cache
      queryClient.setQueryData<Branch[]>(
        QUERY_KEYS.branches(filters),
        (oldBranches) => oldBranches ? [...oldBranches, newBranch] : [newBranch]
      );
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.hierarchy() });
    },
    onError: (error) => {
      console.error('Failed to create branch:', error);
    },
  });

  // Update branch mutation
  const updateBranchMutation = useMutation({
    mutationFn: ({ branchId, data }: { branchId: string; data: UpdateBranchData }) => 
      BranchService.updateBranch(branchId, data),
    onSuccess: (updatedBranch, { branchId }) => {
      // Update specific branch in cache
      queryClient.setQueryData<Branch>(QUERY_KEYS.branch(branchId), updatedBranch);
      
      // Update branches list cache
      queryClient.setQueryData<Branch[]>(
        QUERY_KEYS.branches(filters),
        (oldBranches) => oldBranches?.map(branch => 
          branch._id === branchId ? updatedBranch : branch
        )
      );
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['branches'] });
    },
    onError: (error) => {
      console.error('Failed to update branch:', error);
    },
  });

  // Delete branch mutation
  const deleteBranchMutation = useMutation({
    mutationFn: (branchId: string) => BranchService.deleteBranch(branchId),
    onSuccess: (_, branchId) => {
      // Remove branch from cache
      queryClient.removeQueries({ queryKey: QUERY_KEYS.branch(branchId) });
      
      // Update branches list cache
      queryClient.setQueryData<Branch[]>(
        QUERY_KEYS.branches(filters),
        (oldBranches) => oldBranches?.filter(branch => branch._id !== branchId)
      );
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.hierarchy() });
    },
    onError: (error) => {
      console.error('Failed to delete branch:', error);
    },
  });

  // Clone branch mutation
  const cloneBranchMutation = useMutation({
    mutationFn: ({ sourceBranchId, data }: { sourceBranchId: string; data: CreateBranchData }) =>
      BranchService.cloneBranch(sourceBranchId, data),
    onSuccess: (clonedBranch) => {
      // Add cloned branch to cache
      queryClient.setQueryData<Branch[]>(
        QUERY_KEYS.branches(filters),
        (oldBranches) => oldBranches ? [...oldBranches, clonedBranch] : [clonedBranch]
      );
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.hierarchy() });
    },
    onError: (error) => {
      console.error('Failed to clone branch:', error);
    },
  });

  // Switch branch mutation
  const switchBranchMutation = useMutation({
    mutationFn: (branchId: string) => BranchService.switchBranch(branchId),
    onSuccess: (currentBranchId) => {
      // Invalidate user-related queries to refresh current branch info
      queryClient.invalidateQueries({ queryKey: ['user'] });
      queryClient.invalidateQueries({ queryKey: ['auth'] });
      
      // Update local storage if needed
      const userData = localStorage.getItem('user');
      if (userData) {
        try {
          const user = JSON.parse(userData);
          user.currentBranch = currentBranchId;
          localStorage.setItem('user', JSON.stringify(user));
        } catch (error) {
          console.warn('Failed to update user data in localStorage:', error);
        }
      }
    },
    onError: (error) => {
      console.error('Failed to switch branch:', error);
    },
  });

  // User assignment mutations
  const assignUserMutation = useMutation({
    mutationFn: ({ branchId, userId }: { branchId: string; userId: string }) =>
      BranchService.assignUserToBranch(branchId, userId),
    onSuccess: () => {
      // Invalidate user-related queries
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['branches'] });
    },
    onError: (error) => {
      console.error('Failed to assign user to branch:', error);
    },
  });

  const removeUserMutation = useMutation({
    mutationFn: ({ branchId, userId }: { branchId: string; userId: string }) =>
      BranchService.removeUserFromBranch(branchId, userId),
    onSuccess: () => {
      // Invalidate user-related queries
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['branches'] });
    },
    onError: (error) => {
      console.error('Failed to remove user from branch:', error);
    },
  });

  // Helper functions
  const getUserAssignedBranches = useCallback((): Branch[] => {
    if (!user?.assignedBranches || !branchesQuery.data) return branchesQuery.data || [];
    
    // Admins and superadmins can access all branches
    if (user.role === 'admin' || user.role === 'superadmin') {
      return branchesQuery.data;
    }
    
    return branchesQuery.data.filter(branch => 
      user.assignedBranches?.includes(branch._id)
    );
  }, [branchesQuery.data, user]);

  const canUserAccessBranch = useCallback((branchId: string): boolean => {
    if (!user) return false;
    if (user.role === 'admin' || user.role === 'superadmin') return true;
    
    return user.assignedBranches?.includes(branchId) || false;
  }, [user]);

  const canUserSwitchBranches = useCallback((): boolean => {
    if (!user) return false;
    if (user.role === 'admin' || user.role === 'superadmin') return true;
    
    // Check if user has access to multiple branches
    const assignedBranches = user.assignedBranches || [];
    return assignedBranches.length > 1;
  }, [user]);

  const getCurrentBranch = useCallback((): Branch | undefined => {
    if (!branchesQuery.data || !user?.currentBranch) return undefined;
    
    return branchesQuery.data.find(branch => branch._id === user.currentBranch);
  }, [branchesQuery.data, user?.currentBranch]);

  return {
    // Query state
    branches: branchesQuery.data || [],
    isLoading: branchesQuery.isLoading,
    isError: branchesQuery.isError,
    error: branchesQuery.error as Error | null,
    refetch: branchesQuery.refetch,
    
    // Current branch info
    currentBranch: getCurrentBranch(),
    userAssignedBranches: getUserAssignedBranches(),
    
    // Mutation functions
    createBranch: createBranchMutation.mutateAsync,
    updateBranch: updateBranchMutation.mutateAsync,
    deleteBranch: deleteBranchMutation.mutateAsync,
    cloneBranch: cloneBranchMutation.mutateAsync,
    switchBranch: switchBranchMutation.mutateAsync,
    assignUserToBranch: assignUserMutation.mutateAsync,
    removeUserFromBranch: removeUserMutation.mutateAsync,
    
    // Mutation states
    isCreating: createBranchMutation.isPending,
    isUpdating: updateBranchMutation.isPending,
    isDeleting: deleteBranchMutation.isPending,
    isCloning: cloneBranchMutation.isPending,
    isSwitching: switchBranchMutation.isPending,
    isAssigning: assignUserMutation.isPending,
    isRemoving: removeUserMutation.isPending,
    
    // Helper functions
    canUserAccessBranch,
    canUserSwitchBranches,
    
    // Utility functions for common operations
    getActiveBranches: () => branchesQuery.data?.filter(b => b.status === 'active') || [],
    getBranchesByType: (type: 'main' | 'branch' | 'franchise') => 
      branchesQuery.data?.filter(b => b.type === type) || [],
  };
};

/**
 * Hook for fetching branch hierarchy
 */
export const useBranchHierarchy = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: QUERY_KEYS.hierarchy(),
    queryFn: () => BranchService.getBranchHierarchy(),
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    enabled: !!user,
  });
};

/**
 * Hook for fetching individual branch data
 */
export const useBranch = (branchId: string) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: QUERY_KEYS.branch(branchId),
    queryFn: () => BranchService.getBranchById(branchId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    enabled: !!user && !!branchId,
  });
};

/**
 * Hook for branch metrics and analytics
 */
export const useBranchMetrics = (
  branchId: string, 
  startDate?: Date, 
  endDate?: Date
) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: QUERY_KEYS.metrics(branchId, startDate, endDate),
    queryFn: () => BranchService.getBranchMetrics(branchId, startDate, endDate),
    staleTime: 2 * 60 * 1000, // 2 minutes for metrics
    gcTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!user && !!branchId,
  });
};

/**
 * Hook for consolidated metrics across all branches
 */
export const useConsolidatedMetrics = (startDate?: Date, endDate?: Date) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: QUERY_KEYS.consolidatedMetrics(startDate, endDate),
    queryFn: () => BranchService.getConsolidatedMetrics(startDate, endDate),
    staleTime: 2 * 60 * 1000, // 2 minutes for metrics
    gcTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!user,
  });
};

/**
 * Hook for batch branch operations
 */
export const useBatchBranchOperations = () => {
  const queryClient = useQueryClient();
  
  const updateMultipleBranches = useMutation({
    mutationFn: (updates: Array<{ branchId: string; data: UpdateBranchData }>) =>
      BranchService.updateMultipleBranches(updates),
    onSuccess: () => {
      // Invalidate all branch-related queries
      queryClient.invalidateQueries({ queryKey: ['branches'] });
    },
    onError: (error) => {
      console.error('Failed to update multiple branches:', error);
    },
  });

  return {
    updateMultipleBranches: updateMultipleBranches.mutateAsync,
    isUpdatingMultiple: updateMultipleBranches.isPending,
  };
};

// Export default for backward compatibility
export default useBranches;