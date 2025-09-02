import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Users, Clock, DollarSign, Loader2 } from "lucide-react";
import { useCurrency } from '@/hooks/useCurrency';
import { useDashboardStats } from '@/hooks/useDashboardStats';

const QuickStats = () => {
  const { format: formatPrice } = useCurrency();
  const { data: dashboardStats, isLoading, error } = useDashboardStats();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border-0 shadow-sm bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-8 w-8 bg-gray-200 rounded-lg animate-pulse"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="border-0 shadow-sm bg-white col-span-full">
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center text-muted-foreground">
              <p className="text-sm">Unable to load dashboard statistics</p>
              <p className="text-xs mt-1">{error.message}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!dashboardStats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="border-0 shadow-sm bg-white col-span-full">
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center text-muted-foreground">
              <p className="text-sm">No dashboard data available</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const occupancyPercentage = dashboardStats.tables.total > 0 
    ? Math.round((dashboardStats.tables.occupied / dashboardStats.tables.total) * 100)
    : 0;

  const stats = [
    {
      title: "Today's Orders",
      value: dashboardStats.orders.totalToday.toString(),
      change: `${dashboardStats.orders.active} active`,
      icon: TrendingUp,
      color: "text-green-600"
    },
    {
      title: "Active Tables",
      value: `${dashboardStats.tables.occupied}/${dashboardStats.tables.total}`,
      change: `${occupancyPercentage}% occupied`,
      icon: Users,
      color: "text-blue-600"
    },
    {
      title: "Staff on Shift",
      value: dashboardStats.staff.onShift.toString(),
      change: `${dashboardStats.staff.active} active`,
      icon: Clock,
      color: "text-[#032541]"
    },
    {
      title: "Daily Revenue",
      value: formatPrice(dashboardStats.revenue.today),
      change: "Today's earnings",
      icon: DollarSign,
      color: "text-green-600"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {stats.map((stat, index) => (
        <Card key={index} className="border-0 shadow-sm bg-white hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <div className="p-2 rounded-lg bg-gray-50">
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-foreground">{stat.value}</div>
            <p className={`text-sm ${stat.color} mt-1`}>
              {stat.change} from yesterday
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default QuickStats;