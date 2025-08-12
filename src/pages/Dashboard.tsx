import Header from "@/components/layout/Header";
import HeroSection from "@/components/dashboard/HeroSection";
import QuickStats from "@/components/dashboard/QuickStats";
import ModuleCard from "@/components/dashboard/ModuleCard";
import { useNavigate } from "react-router-dom";
import { useTenant, TenantSelector, FeatureGate } from "@/contexts/TenantContext";
import { Badge } from "@/components/ui/badge";
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
  Building
} from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();
  const { context } = useTenant();
  
  const modules = [
    {
      title: "Order Management",
      description: "Create, track, and manage all customer orders",
      icon: ShoppingCart,
      status: "active" as const,
      stats: "23 Active",
      onClick: () => navigate("/orders")
    },
    {
      title: "Dine-In Service",
      description: "Table management and in-restaurant service",
      icon: Users,
      status: "active" as const,
      stats: "18/24 Tables",
      onClick: () => navigate("/dine-in")
    },
    {
      title: "Takeaway Orders",
      description: "Quick service and pickup management",
      icon: Package,
      status: "active" as const,
      stats: "12 Pending",
      onClick: () => navigate("/takeaway")
    },
    {
      title: "Delivery Service",
      description: "Delivery tracking and logistics",
      icon: Truck,
      status: "active" as const,
      stats: "8 En Route",
      onClick: () => navigate("/delivery")
    },
    {
      title: "Staff Management",
      description: "Employee scheduling and role management",
      icon: UserCheck,
      status: "active" as const,
      stats: "15 On Shift",
      onClick: () => navigate("/staff")
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
      stats: "$2,847 Today",
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
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="p-6">
        {/* Tenant Information Header */}
        {context && (
          <div className="mb-6 p-4 bg-card rounded-lg border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Building className="h-6 w-6 text-primary" />
                <div>
                  <h2 className="text-xl font-bold">{context.tenant.name}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">
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
          <h3 className="text-2xl font-bold text-foreground mb-2">Restaurant Modules</h3>
          <p className="text-muted-foreground">
            Access all restaurant management features from your central dashboard
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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