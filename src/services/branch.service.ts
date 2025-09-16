/**
 * Branch Service - API service for branch operations
 * Handles all branch-related API calls with proper error handling and tenant context
 */

import { getApiUrl } from '@/config/api';
import { 
  Branch, 
  BranchHierarchy, 
  BranchMetrics, 
  ConsolidatedMetrics,
  CreateBranchData, 
  UpdateBranchData, 
  BranchFilters,
  BranchApiResponse,
  BranchMetricsApiResponse
} from '@/types/branch.types';

/**
 * Enhanced API request utility with better error handling and auth support
 */
const makeApiRequest = async <T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<T> => {
  const url = getApiUrl(endpoint);
  
  // Get auth token - prefer superadmin token if available
  const superadminToken = localStorage.getItem('superadmin_token');
  const regularToken = localStorage.getItem('token');
  const token = superadminToken || regularToken;
  
  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }
  
  // Add tenant context header if available
  const user = localStorage.getItem('user') || localStorage.getItem('superadmin_user');
  if (user) {
    try {
      const userData = JSON.parse(user);
      if (userData.tenantId) {
        defaultHeaders['x-tenant-id'] = userData.tenantId;
      }
      
      // Smart branch context: Only add branch-id for non-branch-discovery endpoints
      const isBranchDiscoveryEndpoint = endpoint === 'branches' || endpoint === 'branches/hierarchy';
      if (userData.currentBranch && !isBranchDiscoveryEndpoint) {
        defaultHeaders['x-branch-id'] = userData.currentBranch;
      }
    } catch (error) {
      console.warn('Failed to parse user data for tenant context:', error);
    }
  }
  
  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };
  
  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      let errorMessage = 'Request failed';
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || `HTTP ${response.status}`;
      } catch {
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      }
      
      throw new Error(errorMessage);
    }
    
    // Handle empty responses (like DELETE operations)
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return {} as T;
    }
    
    return await response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Network error or unexpected response format');
  }
};

/**
 * Branch Service Class
 * Organized collection of all branch-related API operations
 */
export class BranchService {
  private static readonly BASE_PATH = 'branches';

  /**
   * Fetch all branches for the current tenant with optional filtering
   */
  static async getBranches(filters?: BranchFilters): Promise<Branch[]> {
    const params = new URLSearchParams();
    
    if (filters?.includeInactive) {
      params.append('includeInactive', 'true');
    }
    if (filters?.status) {
      params.append('status', filters.status);
    }
    if (filters?.type) {
      params.append('type', filters.type);
    }
    if (filters?.search) {
      params.append('search', filters.search);
    }
    
    const queryString = params.toString();
    const endpoint = queryString 
      ? `${this.BASE_PATH}?${queryString}` 
      : this.BASE_PATH;
    
    const response = await makeApiRequest<BranchApiResponse>(endpoint);
    return Array.isArray(response.data) ? response.data : [];
  }

  /**
   * Get branch hierarchy (tree structure of branches)
   */
  static async getBranchHierarchy(): Promise<BranchHierarchy[]> {
    const response = await makeApiRequest<{ success: boolean; data: BranchHierarchy[] }>(
      `${this.BASE_PATH}/hierarchy`
    );
    return response.data || [];
  }

  /**
   * Get single branch by ID
   */
  static async getBranchById(branchId: string): Promise<Branch> {
    const response = await makeApiRequest<BranchApiResponse>(
      `${this.BASE_PATH}/${branchId}`
    );
    
    if (!response.success || !response.data || Array.isArray(response.data)) {
      throw new Error('Branch not found');
    }
    return response.data;
  }

  /**
   * Create new branch
   */
  static async createBranch(data: CreateBranchData): Promise<Branch> {
    const response = await makeApiRequest<BranchApiResponse>(
      this.BASE_PATH,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
    
    if (!response.success || !response.data || Array.isArray(response.data)) {
      throw new Error(response.error || 'Failed to create branch');
    }
    return response.data;
  }

  /**
   * Update existing branch
   */
  static async updateBranch(branchId: string, data: UpdateBranchData): Promise<Branch> {
    const response = await makeApiRequest<BranchApiResponse>(
      `${this.BASE_PATH}/${branchId}`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      }
    );
    
    if (!response.success || !response.data || Array.isArray(response.data)) {
      throw new Error(response.error || 'Failed to update branch');
    }
    return response.data;
  }

  /**
   * Delete branch (soft delete)
   */
  static async deleteBranch(branchId: string): Promise<void> {
    const response = await makeApiRequest<{ success: boolean; message?: string; error?: string }>(
      `${this.BASE_PATH}/${branchId}`, 
      { method: 'DELETE' }
    );
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to delete branch');
    }
  }

  /**
   * Clone branch with new configuration
   */
  static async cloneBranch(sourceBranchId: string, data: CreateBranchData): Promise<Branch> {
    const response = await makeApiRequest<BranchApiResponse>(
      `${this.BASE_PATH}/${sourceBranchId}/clone`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
    
    if (!response.success || !response.data || Array.isArray(response.data)) {
      throw new Error(response.error || 'Failed to clone branch');
    }
    return response.data;
  }

  /**
   * Assign user to branch
   */
  static async assignUserToBranch(branchId: string, userId: string): Promise<void> {
    const response = await makeApiRequest<{ success: boolean; error?: string }>(
      `${this.BASE_PATH}/${branchId}/assign`,
      {
        method: 'POST',
        body: JSON.stringify({ userId }),
      }
    );
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to assign user to branch');
    }
  }

  /**
   * Remove user from branch
   */
  static async removeUserFromBranch(branchId: string, userId: string): Promise<void> {
    const response = await makeApiRequest<{ success: boolean; error?: string }>(
      `${this.BASE_PATH}/${branchId}/users/${userId}`,
      { method: 'DELETE' }
    );
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to remove user from branch');
    }
  }

  /**
   * Switch current branch for authenticated user
   */
  static async switchBranch(branchId: string): Promise<string> {
    const response = await makeApiRequest<{ 
      success: boolean; 
      currentBranch?: string; 
      error?: string 
    }>(`${this.BASE_PATH}/switch`, {
      method: 'POST',
      body: JSON.stringify({ branchId }),
    });
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to switch branch');
    }
    
    return response.currentBranch || branchId;
  }

  /**
   * Get branch-specific metrics and analytics
   */
  static async getBranchMetrics(
    branchId: string, 
    startDate?: Date, 
    endDate?: Date
  ): Promise<BranchMetrics> {
    const params = new URLSearchParams();
    
    if (startDate) {
      params.append('startDate', startDate.toISOString());
    }
    if (endDate) {
      params.append('endDate', endDate.toISOString());
    }
    
    const queryString = params.toString();
    const endpoint = queryString 
      ? `${this.BASE_PATH}/${branchId}/metrics?${queryString}`
      : `${this.BASE_PATH}/${branchId}/metrics`;
    
    const response = await makeApiRequest<BranchMetricsApiResponse>(endpoint);
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to fetch branch metrics');
    }
    
    return response.data as BranchMetrics;
  }

  /**
   * Get consolidated metrics across all branches
   */
  static async getConsolidatedMetrics(
    startDate?: Date, 
    endDate?: Date
  ): Promise<ConsolidatedMetrics> {
    const params = new URLSearchParams();
    
    if (startDate) {
      params.append('startDate', startDate.toISOString());
    }
    if (endDate) {
      params.append('endDate', endDate.toISOString());
    }
    
    const queryString = params.toString();
    const endpoint = queryString 
      ? `${this.BASE_PATH}/metrics/consolidated?${queryString}`
      : `${this.BASE_PATH}/metrics/consolidated`;
    
    const response = await makeApiRequest<BranchMetricsApiResponse>(endpoint);
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to fetch consolidated metrics');
    }
    
    return response.data as ConsolidatedMetrics;
  }

  /**
   * Batch operations for multiple branches
   */
  static async updateMultipleBranches(
    updates: Array<{ branchId: string; data: UpdateBranchData }>
  ): Promise<Branch[]> {
    const promises = updates.map(({ branchId, data }) => 
      this.updateBranch(branchId, data)
    );
    return Promise.all(promises);
  }

  /**
   * Get branches by type (main, branch, franchise)
   */
  static async getBranchesByType(type: 'main' | 'branch' | 'franchise'): Promise<Branch[]> {
    return this.getBranches({ type });
  }

  /**
   * Get active branches only
   */
  static async getActiveBranches(): Promise<Branch[]> {
    return this.getBranches({ status: 'active' });
  }

  /**
   * Search branches by name or code
   */
  static async searchBranches(searchTerm: string): Promise<Branch[]> {
    return this.getBranches({ search: searchTerm });
  }
}

// Export default instance for convenience
export default BranchService;