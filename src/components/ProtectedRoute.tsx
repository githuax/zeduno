import { Loader2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  requireTenant?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles = [],
  requireTenant = false,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const location = useLocation();

  useEffect(() => {
    checkAuth();
  }, [location.pathname]);

  const checkAuth = async () => {
    try {
      // Check if this is a superadmin route
      const isSuperAdminRoute = location.pathname.startsWith('/superadmin');
      
      let token, userData;
      
      // First, check for superadmin tokens (these take priority)
      const superadminToken = localStorage.getItem('superadmin_token');
      const superadminUser = localStorage.getItem('superadmin_user');
      
      if (superadminToken && superadminUser) {
        // User is a superadmin
        token = superadminToken;
        userData = superadminUser;
      } else if (!isSuperAdminRoute) {
        // For regular routes, check regular tokens only if not superadmin
        token = localStorage.getItem('token');
        userData = localStorage.getItem('user');
      }
      
      if (!token || !userData) {
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Auth check failed:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Superadmin can access everything - bypass role restrictions
  if (user?.role === 'superadmin') {
    return <>{children}</>;
  }

  // For non-superadmin users, check role restrictions
  if (allowedRoles.length > 0 && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Check tenant requirement (superadmin is already handled above)
  if (requireTenant && (!user?.tenantId || user.role === 'superadmin')) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
