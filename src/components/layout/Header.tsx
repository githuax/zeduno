import { Bell, Settings, User, Shield, LogOut, ExternalLink, ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";



const Header = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { context: tenantContext } = useTenant();
  const [isSuperadmin, setIsSuperadmin] = useState(false);
  const [accessingTenant, setAccessingTenant] = useState<any>(null);

  useEffect(() => {
    // Check if superadmin is accessing a tenant
    const superadminUser = localStorage.getItem('superadmin_user');
    if (superadminUser) {
      setIsSuperadmin(true);
      const accessingTenantData = localStorage.getItem('superadmin_accessing_tenant');
      if (accessingTenantData) {
        try {
          setAccessingTenant(JSON.parse(accessingTenantData));
        } catch (error) {
          console.error('Failed to parse accessing tenant data:', error);
        }
      }
    }
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleExitTenantAccess = () => {
    localStorage.removeItem('superadmin_accessing_tenant');
    navigate('/superadmin/tenants');
  };

  return (
    <>
      {isSuperadmin && accessingTenant && (
        <div className="bg-yellow-100 border-b border-yellow-200 px-6 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4 text-yellow-700" />
              <span className="text-sm font-medium text-yellow-800">
                SuperAdmin Access: Currently viewing {accessingTenant.tenantName}
              </span>
              <Badge variant="outline" className="text-yellow-700 border-yellow-400">
                Superadmin Mode
              </Badge>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleExitTenantAccess}
              className="text-yellow-700 hover:text-yellow-800 hover:bg-yellow-200"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Exit Tenant Access
            </Button>
          </div>
        </div>
      )}
      <header className="bg-card border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Tenant Logo/Branding */}
          <div 
            className="cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => navigate('/dashboard')}
          >
            {tenantContext?.tenant?.settings?.logo ? (
              <img 
                src={tenantContext.tenant.settings.logo} 
                alt={`${tenantContext.tenant.name} Logo`}
                className="h-10 w-auto max-w-48 object-contain"
                onError={(e) => {
                  // Fallback to text if image fails to load
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            <h1 
              className={`text-2xl font-bold text-restaurant-primary ${
                tenantContext?.tenant?.settings?.logo ? 'hidden' : ''
              }`}
            >
              {tenantContext?.tenant?.name || 'ZedUno'}
            </h1>
          </div>
          <span className="text-sm text-muted-foreground">
            {tenantContext?.tenant?.settings?.tagline || 'Restaurant Management System'}
          </span>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon">
            <Bell className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <Settings className="h-5 w-5" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigate('/profile')}>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
    </>
  );
};

export default Header;