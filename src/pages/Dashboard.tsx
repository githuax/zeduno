import Header from "@/components/layout/Header";
import HeroSection from "@/components/dashboard/HeroSection";
import QuickStats from "@/components/dashboard/QuickStats";
import ModuleCard from "@/components/dashboard/ModuleCard";
import { 
  ShoppingCart, 
  Users, 
  Truck, 
  Package, 
  BarChart3, 
  CreditCard, 
  Settings, 
  UserCheck 
} from "lucide-react";

const Dashboard = () => {
  const modules = [
    {
      title: "Order Management",
      description: "Create, track, and manage all customer orders",
      icon: ShoppingCart,
      status: "active" as const,
      stats: "23 Active",
      onClick: () => console.log("Order Management clicked")
    },
    {
      title: "Dine-In Service",
      description: "Table management and in-restaurant service",
      icon: Users,
      status: "active" as const,
      stats: "18/24 Tables",
      onClick: () => console.log("Dine-In clicked")
    },
    {
      title: "Takeaway Orders",
      description: "Quick service and pickup management",
      icon: Package,
      status: "active" as const,
      stats: "12 Pending",
      onClick: () => console.log("Takeaway clicked")
    },
    {
      title: "Delivery Service",
      description: "Delivery tracking and logistics",
      icon: Truck,
      status: "active" as const,
      stats: "8 En Route",
      onClick: () => console.log("Delivery clicked")
    },
    {
      title: "Staff Management",
      description: "Employee scheduling and role management",
      icon: UserCheck,
      status: "active" as const,
      stats: "15 On Shift",
      onClick: () => console.log("Staff clicked")
    },
    {
      title: "Analytics & Reports",
      description: "Business insights and performance metrics",
      icon: BarChart3,
      status: "active" as const,
      stats: "View Reports",
      onClick: () => console.log("Analytics clicked")
    },
    {
      title: "Payment Processing",
      description: "Handle transactions and financial operations",
      icon: CreditCard,
      status: "active" as const,
      stats: "$2,847 Today",
      onClick: () => console.log("Payments clicked")
    },
    {
      title: "System Settings",
      description: "Configure restaurant and system preferences",
      icon: Settings,
      status: "active" as const,
      onClick: () => console.log("Settings clicked")
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="p-6">
        <HeroSection />
        <QuickStats />
        
        <div className="mb-6">
          <h3 className="text-2xl font-bold text-foreground mb-2">Restaurant Modules</h3>
          <p className="text-muted-foreground">
            Access all restaurant management features from your central dashboard
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {modules.map((module, index) => (
            <ModuleCard
              key={index}
              title={module.title}
              description={module.description}
              icon={module.icon}
              status={module.status}
              stats={module.stats}
              onClick={module.onClick}
            />
          ))}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;