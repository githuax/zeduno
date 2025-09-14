import { useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  tenantId?: string;
  tenantName?: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Check for existing token on mount
    const storedToken = localStorage.getItem('token') || 
                       localStorage.getItem('superadmin_token') ||
                       localStorage.getItem('auth_token');
    
    if (storedToken) {
      setToken(storedToken);
      // TODO: Validate token with backend
    }
    
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success && data.token) {
        localStorage.setItem('token', data.token);
        setToken(data.token);
        setUser(data.user);
        return { success: true, user: data.user };
      } else {
        throw new Error(data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Login failed' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('superadmin_token');
    localStorage.removeItem('auth_token');
    setToken(null);
    setUser(null);
  };

  const isAuthenticated = !!token;

  return {
    user,
    token,
    isLoading,
    isAuthenticated,
    login,
    logout,
  };
};
