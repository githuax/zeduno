import Header from "@/components/layout/Header";
import HeroSection from "@/components/dashboard/HeroSection";
import QuickStats from "@/components/dashboard/QuickStats";
import ModuleCard from "@/components/dashboard/ModuleCard";
import { 
  ShoppingCart, 
  Utensils, 
  Package, 
  Truck, 
  Users, 
  BarChart3,
  Settings,
  CreditCard
} from "lucide-react";

const Dashboard = () => {
  const modules = [
    {
      title: "Order Management",
      description: "Create, track, and manage all orders in real-time",
      icon: ShoppingCart,
      stats: { label: "Active Orders", value: 23 },
      actionLabel: "Manage Orders",
      variant: "primary" as const
    },
    {
      title: "Dine-In Service",
      description: "Table management, reservations, and guest communication",
      icon: Utensils,
      stats: { label: "Tables Active", value: "18/24" },
      actionLabel: "View Tables"
    },
    {
      title: "Takeaway Orders",
      description: "Quick ordering flow with pickup notifications",
      icon: Package,
      stats: { label: "Ready for Pickup", value: 7 },
      actionLabel: "Manage Takeaway"
    },
    {
      title: "Delivery Service",
      description: "Third-party integration and delivery tracking",
      icon: Truck,
      stats: { label: "Out for Delivery", value: 12 },
      actionLabel: "Track Deliveries"
    },
    {
      title: "Staff Management",
      description: "Roles, schedules, and performance tracking",
      icon: Users,
      stats: { label: "Staff on Duty", value: 15 },
      actionLabel: "Manage Staff"
    },
    {
      title: "Analytics & Reports",
      description: "Sales insights, performance metrics, and trends",
      icon: BarChart3,
      stats: { label: "Today's Revenue", value: "$3,240" },
      actionLabel: "View Reports"
    },
    {
      title: "Payment Processing",
      description: "Multi-gateway support and receipt management",
      icon: CreditCard,
      stats: { label: "Transactions", value: 127 },
      actionLabel: "Payment Settings"
    },
    {
      title: "System Settings",
      description: "Menu management, inventory, and system configuration",
      icon: Settings,
      actionLabel: "Configure System"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="p-6 space-y-8">
        <HeroSection />
        
        <section>
          <h2 className="text-2xl font-bold text-foreground mb-6">Quick Overview</h2>
          <QuickStats />
        </section>
        
        <section>
          <h2 className="text-2xl font-bold text-foreground mb-6">Management Modules</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {modules.map((module, index) => (
              <ModuleCard key={index} {...module} />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;