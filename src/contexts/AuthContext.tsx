import { useQueryClient } from '@tanstack/react-query';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { getApiUrl } from '@/config/api';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'superadmin' | 'admin' | 'manager' | 'staff' | 'user';
  tenantId?: string;
  tenantName?: string;
  tenant?: any; // Store the full tenant object from the backend
  permissions?: string[];
  mustChangePassword?: boolean;
  // Branch management fields
  currentBranch?: string;
  assignedBranches?: string[];
  defaultBranch?: string;
  canSwitchBranches?: boolean;
  branchRole?: 'branch_manager' | 'branch_staff' | 'multi_branch';
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      // Check for both regular and superadmin tokens
      let token = localStorage.getItem('token');
      let userData = localStorage.getItem('user');
      const superadminToken = localStorage.getItem('superadmin_token');
      const superadminUser = localStorage.getItem('superadmin_user');
      
      // Prefer superadmin token if it exists
      if (superadminToken && superadminUser) {
        token = superadminToken;
        userData = superadminUser;
      }
      
      if (!token || !userData) {
        setIsLoading(false);
        return;
      }

      try {
        const parsedUser = JSON.parse(userData);
        setUser({
          id: parsedUser.id,
          email: parsedUser.email,
          name: `${parsedUser.firstName} ${parsedUser.lastName}`,
          firstName: parsedUser.firstName,
          lastName: parsedUser.lastName,
          role: parsedUser.role,
          tenantId: parsedUser.tenantId,
          tenantName: parsedUser.tenantName,
          tenant: parsedUser.tenant, // Include the tenant object
          permissions: parsedUser.permissions
        } as any);
      } catch (parseError) {
        console.error('Failed to parse user data:', parseError);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('superadmin_token');
        localStorage.removeItem('superadmin_user');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('superadmin_token');
      localStorage.removeItem('superadmin_user');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      console.log('Starting login attempt for:', email);
      
      // Determine endpoint based on email domain
      const endpoint = email === 'superadmin@zeduno.com' 
        ? getApiUrl('superadmin/login')
        : getApiUrl('auth/login');
      
      console.log('Making request to:', endpoint);
      
      // Add a shorter initial timeout with retry logic
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      let response;
      let retryCount = 0;
      const maxRetries = 2;
      
      while (retryCount <= maxRetries) {
        try {
          response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
            signal: controller.signal,
          });
          break; // Success, exit retry loop
        } catch (error: any) {
          if (error.name === 'AbortError' && retryCount < maxRetries) {
            console.log(`Login attempt ${retryCount + 1} timed out, retrying...`);
            retryCount++;
            // Reset controller for retry
            controller.abort();
            const newController = new AbortController();
            Object.assign(controller, newController);
            clearTimeout(timeoutId);
            const newTimeoutId = setTimeout(() => controller.abort(), 10000);
            Object.assign({ timeoutId }, { timeoutId: newTimeoutId });
          } else {
            throw error;
          }
        }
      }
      
      if (!response) {
        throw new Error('Failed to connect to server after multiple attempts');
      }
      
      clearTimeout(timeoutId);
      
      console.log('Response status:', response.status);
      console.log('Response content-type:', response.headers.get('content-type'));
      
      if (!response.ok) {
        // Check if response has content and is JSON before trying to parse
        const contentType = response.headers.get('content-type');
        let errorMessage = 'Login failed';
        
        if (contentType && contentType.includes('application/json')) {
          try {
            const error = await response.json();
            console.log('Login error response:', error);
            errorMessage = error.message || 'Login failed';
          } catch (jsonError) {
            console.error('Failed to parse error response as JSON:', jsonError);
            errorMessage = `Server error (${response.status}): Unable to process response`;
          }
        } else {
          // For non-JSON responses (like empty 500 responses)
          const responseText = await response.text();
          console.log('Login error response (text):', responseText);
          
          if (response.status === 500) {
            errorMessage = 'Server error: The login service is currently unavailable. Please try again later or contact support.';
          } else if (response.status === 404) {
            errorMessage = 'Login endpoint not found. Please contact support.';
          } else if (response.status >= 500) {
            errorMessage = `Server error (${response.status}): Please try again later.`;
          } else if (response.status === 401) {
            errorMessage = 'Invalid email or password.';
          } else {
            errorMessage = `Login failed (${response.status}): ${responseText || 'Unknown error'}`;
          }
        }
        
        throw new Error(errorMessage);
      }

      // Check if successful response has content before parsing
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned an invalid response format. Expected JSON.');
      }

      const data = await response.json();
      console.log('Login success data:', data);
      
      // Map backend user format to frontend User interface
      const mappedUser: User = {
        id: data.user._id || data.user.id,
        email: data.user.email,
        name: data.user.firstName && data.user.lastName 
          ? `${data.user.firstName} ${data.user.lastName}`
          : data.user.name || data.user.email,
        role: data.user.role === 'customer' ? 'user' : data.user.role,
        tenantId: data.user.tenantId,
        tenantName: data.user.tenantName || data.user.tenant?.name,
        tenant: data.user.tenant, // Store the full tenant object
        permissions: data.user.permissions,
        mustChangePassword: data.user.mustChangePassword || false,
        // Map branch management fields
        currentBranch: data.user.currentBranch,
        assignedBranches: data.user.assignedBranches,
        defaultBranch: data.user.defaultBranch,
        canSwitchBranches: data.user.canSwitchBranches,
        branchRole: data.user.branchRole
      };
      
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(mappedUser));
      
      // For superadmin, also store in superadmin-specific keys
      if (mappedUser.role === 'superadmin') {
        localStorage.setItem('superadmin_token', data.token);
        localStorage.setItem('superadmin_user', JSON.stringify(mappedUser));
      }
      
      setUser(mappedUser);
      
      // Invalidate tenant context queries to force refresh with new user data
      queryClient.invalidateQueries({ queryKey: ['tenant-context'] });

      // Check if password change is required
      if (mappedUser.mustChangePassword) {
        // For users who must change password, redirect to a password change page
        // or show a modal (we'll handle this in the Login component)
        return; // Don't redirect yet, let the Login component handle it
      }

      // Redirect based on role and tenant
      redirectBasedOnRole(mappedUser);
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Handle timeout errors
      if (error.name === 'AbortError') {
        throw new Error('Login request timed out. The server may be slow or unavailable. Please try again.');
      }
      
      // Handle network errors
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Network error. Please check your connection and try again.');
      }
      
      throw error;
    }
  };

  const redirectBasedOnRole = (user: User) => {
    switch (user.role) {
      case 'superadmin':
        navigate('/superadmin/dashboard');
        break;
      case 'admin':
        navigate('/dashboard');
        break;
      case 'manager':
        navigate('/dashboard');
        break;
      case 'staff':
        navigate('/orders');
        break;
      case 'user':
        navigate('/orders');
        break;
      default:
        navigate('/');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('superadmin_token');
    localStorage.removeItem('superadmin_user');
    localStorage.removeItem('currentTenantId'); // Clear tenant ID cache
    
    // Invalidate tenant queries to ensure fresh data on next login
    queryClient.invalidateQueries({ queryKey: ['tenant-context'] });
    queryClient.removeQueries({ queryKey: ['tenant-context'] });
    
    setUser(null);
    navigate('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isLoading,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
