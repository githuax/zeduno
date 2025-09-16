import { 
  ShoppingCart, 
  Users, 
  Truck, 
  Package, 
  BarChart3, 
  CreditCard, 
  Settings, 
  UserCheck,
  Crown,
  Building,
  Menu,
  PackageSearch,
  GitBranch,
  ChefHat
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import HeroSection from "@/components/dashboard/HeroSection";
import ModuleCard from "@/components/dashboard/ModuleCard";
import QuickStats from "@/components/dashboard/QuickStats";
import Header from "@/components/layout/Header";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { useTenant, TenantSelector, FeatureGate } from "@/contexts/TenantContext";
import { useCurrency } from '@/hooks/useCurrency';
import { useDashboardStats } from '@/hooks/useDashboardStats';


const Dashboard = () => {
  const navigate = useNavigate();
  const { context } = useTenant();
  const { format: formatPrice } = useCurrency();
  const { data: stats, isLoading: statsLoading, error: statsError } = useDashboardStats();
  
  const modules = [
    {
      title: "Order Management",
      description: "Create, track, and manage all customer orders",
      icon: ShoppingCart,
      status: "active" as const,
      stats: statsLoading ? "Loading..." : `${stats?.orders?.active || 0} Active`,
      extra: statsLoading ? null : (
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
              Breakdown
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-sm space-y-1">
              <div>Pending: <strong>{stats?.orders?.pending ?? 0}</strong></div>
              <div>Preparing: <strong>{stats?.orders?.preparing ?? 0}</strong></div>
              <div>Ready: <strong>{stats?.orders?.ready ?? 0}</strong></div>
              <div>Takeaway: <strong>{stats?.orders?.takeaway ?? 0}</strong></div>
              <div>Delivery (active): <strong>{stats?.orders?.delivery ?? 0}</strong></div>
              <div>Today: <strong>{stats?.orders?.totalToday ?? 0}</strong></div>
            </div>
          </TooltipContent>
        </Tooltip>
      ),
      onClick: () => navigate("/orders")
    },
    {
      title: "Menu Management",
      description: "Manage menu items, categories and pricing",
      icon: Menu,
      status: "active" as const,
      stats: statsLoading ? "Loading..." : `${stats?.menu?.available || 0} Items`,
      onClick: () => navigate("/menu")
    },
    {
      title: "Inventory Management",
      description: "Track ingredients, stock levels and supplies",
      icon: PackageSearch,
      status: "active" as const,
      stats: statsLoading ? "Loading..." : `${stats?.inventory?.lowStock || 0} Low Stock`,
      extra: statsLoading ? null : (
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="secondary" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                Menu: {stats?.menu?.available ?? 0} available
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-sm space-y-1">
                <div>Available items: <strong>{stats?.menu?.available ?? 0}</strong></div>
                <div>Out of stock: <strong>{stats?.menu?.outOfStock ?? 0}</strong></div>
                <div>Total menu items: <strong>{stats?.menu?.total ?? 0}</strong></div>
                <div>Low stock ingredients: <strong>{stats?.inventory?.lowStock ?? 0}</strong></div>
              </div>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                variant="secondary"
                className="text-xs bg-red-50 text-red-700 border-red-200 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('/inventory?tab=ingredients&expiring=true');
                }}
                title="Click to view expiring ingredients"
              >
                Expiring: {stats?.inventory?.expiringSoon ?? 0}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-sm">
                Ingredients expiring in the next 7 days: <strong>{stats?.inventory?.expiringSoon ?? 0}</strong>
              </div>
            </TooltipContent>
          </Tooltip>
        </div>
      ),
      onClick: () => navigate("/inventory")
    },
    {
      title: "Dine-In Service",
      description: "Table management and in-restaurant service",
      icon: Users,
      status: "active" as const,
      stats: statsLoading ? "Loading..." : `${stats?.tables?.occupied || 0}/${stats?.tables?.total || 0} Tables`,
      extra: statsLoading ? null : (
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
              Occupancy: {stats?.tables?.occupancyRate ?? 0}%
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-sm space-y-1">
              <div>Occupied: <strong>{stats?.tables?.occupied ?? 0}</strong></div>
              <div>Available: <strong>{stats?.tables?.available ?? 0}</strong></div>
              <div>Reserved: <strong>{stats?.tables?.reserved ?? 0}</strong></div>
              <div>Total: <strong>{stats?.tables?.total ?? 0}</strong></div>
            </div>
          </TooltipContent>
        </Tooltip>
      ),
      onClick: () => navigate("/dine-in")
    },
    {
      title: "Takeaway Orders",
      description: "Quick service and pickup management",
      icon: Package,
      status: "active" as const,
      stats: statsLoading ? "Loading..." : `${stats?.orders?.takeaway || 0} Pending`,
      onClick: () => navigate("/takeaway")
    },
    {
      title: "Delivery Service",
      description: "Delivery tracking and logistics",
      icon: Truck,
      status: "active" as const,
      stats: statsLoading ? "Loading..." : `${stats?.orders?.delivery || 0} En Route`,
      extra: statsLoading ? null : (
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="secondary" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
              Active deliveries: {stats?.orders?.delivery ?? 0}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-sm space-y-1">
              <div>Preparing: <strong>{stats?.orders?.deliveryStatus?.preparing ?? 0}</strong></div>
              <div>Ready: <strong>{stats?.orders?.deliveryStatus?.ready ?? 0}</strong></div>
              <div>Out for delivery: <strong>{stats?.orders?.deliveryStatus?.outForDelivery ?? 0}</strong></div>
              <div>Delivered today: <strong>{stats?.orders?.deliveryStatus?.deliveredToday ?? 0}</strong></div>
              <div>Orders today (all types): <strong>{stats?.orders?.totalToday ?? 0}</strong></div>
            </div>
          </TooltipContent>
        </Tooltip>
      ),
      onClick: () => navigate("/delivery")
    },
    {
      title: "Kitchen Display",
      description: "Real-time kitchen order management and tracking",
      icon: ChefHat,
      status: "active" as const,
      stats: statsLoading ? "Loading..." : `${(stats?.orders?.active || 0)} Orders`,
      extra: statsLoading ? null : (
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="secondary" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
              Prep: {stats?.orders?.preparing ?? 0} • Ready: {stats?.orders?.ready ?? 0}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-sm space-y-1">
              <div>Preparing: <strong>{stats?.orders?.preparing ?? 0}</strong></div>
              <div>Ready: <strong>{stats?.orders?.ready ?? 0}</strong></div>
            </div>
          </TooltipContent>
        </Tooltip>
      ),
      onClick: () => navigate("/kitchen")
    },
    {
      title: "Staff Management",
      description: "Employee scheduling and role management",
      icon: UserCheck,
      status: "active" as const,
      stats: statsLoading ? "Loading..." : `${stats?.staff?.onShift || 0} On Shift`,
      onClick: () => navigate("/staff")
    },
    {
      title: "Branch Management",
      description: "Manage multiple locations and branch operations",
      icon: GitBranch,
      status: "active" as const,
      stats: statsLoading
        ? "Loading..."
        : `${stats?.branches?.active ?? 0}/${stats?.branches?.total ?? 0} Branches`,
      extra: statsLoading ? null : (
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="secondary" className="text-xs bg-green-50 text-green-700 border-green-200">
              Active: {stats?.branches?.active ?? 0}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-sm">
              <div><strong>{stats?.branches?.active ?? 0}</strong> active out of <strong>{stats?.branches?.total ?? 0}</strong> total branches</div>
              <div className="text-muted-foreground">Active = status "active" and enabled</div>
            </div>
          </TooltipContent>
        </Tooltip>
      ),
      onClick: () => navigate("/branches")
    },
    {
      title: "Analytics & Reports",
      description: "Business insights and performance metrics",
      icon: BarChart3,
      status: "active" as const,
      stats: "View Reports",
      onClick: () => navigate("/analytics")
    },
    {
      title: "Payment Processing",
      description: "Handle transactions and financial operations",
      icon: CreditCard,
      status: "active" as const,
      stats: statsLoading ? "Loading..." : `${formatPrice(stats?.revenue?.today || 0)} Today`,
      onClick: () => navigate("/payments")
    },
    {
      title: "System Settings",
      description: "Configure restaurant and system preferences",
      icon: Settings,
      status: "active" as const,
      onClick: () => navigate("/settings")
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="p-6">
        {/* Tenant Information Header */}
        {context && (
          <div className="mb-6 p-5 bg-white rounded-2xl border-0 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-50">
                  <Building className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-foreground">{context.tenant.name}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                      {context.subscription.plan.displayName}
                    </Badge>
                    <Badge 
                      variant={context.tenant.status === 'active' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {context.tenant.status}
                    </Badge>
                    {context.tenant.trialEndsAt && (
                      <Badge variant="outline" className="text-xs">
                        Trial ends {new Date(context.tenant.trialEndsAt).toLocaleDateString()}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <TenantSelector />
            </div>
          </div>
        )}
        
        <HeroSection />
        <QuickStats />
        
        <div className="mb-6">
          <h3 className="text-2xl font-semibold text-foreground mb-2">Restaurant Modules</h3>
          <p className="text-muted-foreground">
            Access all restaurant management features from your clean, organized dashboard
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {modules.map((module, index) => {
            // Check if advanced analytics is available for premium features
            if (module.title === "Analytics & Reports") {
              return (
                <FeatureGate 
                  key={index}
                  feature="advancedReporting"
                  fallback={
                    <ModuleCard
                      title={module.title}
                      description="Upgrade for advanced analytics"
                      icon={module.icon}
                      status="disabled"
                      onClick={() => navigate("/settings")}
                    />
                  }
                >
                  <ModuleCard
                    title={module.title}
                    description={module.description}
                    icon={module.icon}
                    status={module.status}
                    stats={module.stats}
                    onClick={module.onClick}
                  />
                </FeatureGate>
              );
            }
            
            return (
              <ModuleCard
                key={index}
                title={module.title}
                description={module.description}
                icon={module.icon}
                status={module.status}
                stats={module.stats}
                onClick={module.onClick}
              />
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
