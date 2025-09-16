/**
 * API Configuration Utility
 * Handles API endpoint resolution for different environments
 */

export const getApiUrl = (): string => {
  // For development on network IP, use direct backend connection
  if (window.location.hostname === '192.168.2.43') {
    return 'http://192.168.2.43:5000/api';
  }
  
  // For localhost development, use Vite proxy
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return '/api';
  }
  
  // For production, use relative paths
  return '/api';
};

export const apiRequest = async <T = any>(endpoint: string, options: RequestInit = {}): Promise<T> => {
  const url = `${getApiUrl()}${endpoint}`;
  
  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  // Add auth token if available
  const token = localStorage.getItem('token');
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }
  
  // Add current branch ID if available (except for certain endpoints that don't need it)
  const branchExemptEndpoints = [
    '/auth/login',
    '/auth/register',
    '/auth/verify',
    '/branches',
    '/branches/switch',
    '/superadmin'
  ];
  
  const needsBranchContext = !branchExemptEndpoints.some(exemptEndpoint => 
    endpoint.startsWith(exemptEndpoint)
  );
  
  if (needsBranchContext) {
    const userDataString = localStorage.getItem('user');
    if (userDataString) {
      try {
        const userData = JSON.parse(userDataString);
        if (userData?.currentBranch) {
          defaultHeaders['x-branch-id'] = userData.currentBranch;
        } else if (userData?.defaultBranch) {
          // Fallback to default branch if no current branch is set
          defaultHeaders['x-branch-id'] = userData.defaultBranch;
        }
      } catch (error) {
        console.warn('Failed to parse user data from localStorage:', error);
      }
    }
  }
  
  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };
  
  const response = await fetch(url, config);
  
  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    
    try {
      const errorData = JSON.parse(errorText);
      errorMessage = errorData.error || errorData.message || errorMessage;
    } catch {
      // If not JSON, use the text as error message
      errorMessage = errorText || errorMessage;
    }
    
    throw new Error(errorMessage);
  }
  
  return response.json();
};

// Lightweight axios-like wrapper used by some hooks/components
export const api = {
  get: async <T = any>(endpoint: string) => ({ data: await apiRequest<T>(endpoint) }),
  post: async <T = any>(endpoint: string, body?: any) => ({
    data: await apiRequest<T>(endpoint, { method: 'POST', body: body !== undefined ? JSON.stringify(body) : undefined }),
  }),
  put: async <T = any>(endpoint: string, body?: any) => ({
    data: await apiRequest<T>(endpoint, { method: 'PUT', body: body !== undefined ? JSON.stringify(body) : undefined }),
  }),
  delete: async <T = any>(endpoint: string) => ({
    data: await apiRequest<T>(endpoint, { method: 'DELETE' }),
  }),
};

export default { getApiUrl, apiRequest };
