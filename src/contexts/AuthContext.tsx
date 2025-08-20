import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getApiUrl } from '../config/api';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'superadmin' | 'admin' | 'manager' | 'staff' | 'user';
  tenantId?: string;
  tenantName?: string;
  tenant?: any; // Store the full tenant object from the backend
  permissions?: string[];
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
      // Determine endpoint based on email domain
      const endpoint = email === 'superadmin@hotelzed.com' 
        ? getApiUrl('superadmin/login')
        : getApiUrl('auth/login');
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }

      const data = await response.json();
      
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
        permissions: data.user.permissions
      };
      
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(mappedUser));
      
      // For superadmin, also store in superadmin-specific keys
      if (mappedUser.role === 'superadmin') {
        localStorage.setItem('superadmin_token', data.token);
        localStorage.setItem('superadmin_user', JSON.stringify(mappedUser));
      }
      
      setUser(mappedUser);

      // Redirect based on role and tenant
      redirectBasedOnRole(mappedUser);
    } catch (error) {
      console.error('Login error:', error);
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