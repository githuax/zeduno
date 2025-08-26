import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { getApiUrl } from '@/config/api';
import {
  Building2,
  Users,
  BarChart3,
  Settings,
  Shield,
  LogOut,
  Menu,
  X,
  Home,
  CreditCard
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface SuperAdminLayoutProps {
  children: React.ReactNode;
}

const SuperAdminLayout = ({ children }: SuperAdminLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    // Fetch system logo
    const fetchLogo = async () => {
      try {
        const response = await fetch(getApiUrl('superadmin/settings/logo'));
        const data = await response.json();
        
        if (data.success && data.logoUrl) {
          setLogoUrl(`http://localhost:5000${data.logoUrl}`);
        }
      } catch (error) {
        console.error('Error fetching logo:', error);
      }
    };
    
    fetchLogo();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    {
      title: 'Dashboard',
      icon: Home,
      path: '/superadmin/dashboard',
    },
    {
      title: 'Tenant Management',
      icon: Building2,
      path: '/superadmin/tenants',
    },
    {
      title: 'User Management',
      icon: Users,
      path: '/superadmin/users',
    },
    {
      title: 'Payment Gateways',
      icon: CreditCard,
      path: '/superadmin/payment-settings',
    },
    {
      title: 'System Analytics',
      icon: BarChart3,
      path: '/superadmin/analytics',
    },
    {
      title: 'System Settings',
      icon: Settings,
      path: '/superadmin/settings',
    },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden"
            >
              {isSidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
            <div className="flex items-center space-x-3">
              {logoUrl ? (
                <img 
                  src={logoUrl} 
                  alt="ZedUno Logo" 
                  className="h-16 object-contain"
                />
              ) : (
                <Shield className="h-8 w-8 text-[#032541]" />
              )}
              <div>
                <h1 className="text-xl font-bold text-gray-900">ZedUno SuperAdmin</h1>
                <p className="text-sm text-gray-500">System Administration Panel</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <Badge className="bg-[#032541] text-white">
              SuperAdmin
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-[#032541] rounded-full flex items-center justify-center text-white text-sm font-medium">
                    {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                  </div>
                  <span className="hidden md:block">{user?.firstName} {user?.lastName}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <Users className="mr-2 h-4 w-4" />
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

      <div className="flex">
        {/* Sidebar */}
        <aside className={cn(
          "bg-white border-r border-gray-200 transition-all duration-300 shadow-sm",
          isSidebarOpen ? "w-64" : "w-0 overflow-hidden lg:w-16"
        )}>
          <div className="p-4">
            <nav className="space-y-2">
              {menuItems.map((item) => (
                <Button
                  key={item.path}
                  variant={isActive(item.path) ? "default" : "ghost"}
                  className={cn(
                    "w-full justify-start",
                    isActive(item.path) 
                      ? "bg-[#032541] hover:bg-[#021a2e] text-white" 
                      : "hover:bg-gray-100",
                    !isSidebarOpen && "lg:justify-center lg:px-2"
                  )}
                  onClick={() => navigate(item.path)}
                >
                  <item.icon className={cn("h-4 w-4", !isSidebarOpen && "lg:mr-0", isSidebarOpen && "mr-2")} />
                  <span className={cn(isSidebarOpen ? "block" : "hidden lg:hidden")}>
                    {item.title}
                  </span>
                </Button>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className={cn(
          "flex-1 p-6 transition-all duration-300",
          isSidebarOpen ? "lg:ml-0" : "lg:ml-0"
        )}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default SuperAdminLayout;