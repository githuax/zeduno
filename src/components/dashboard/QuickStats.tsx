import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Users, Clock, DollarSign } from "lucide-react";
import { useCurrency } from '@/hooks/useCurrency';

const QuickStats = () => {
  const { format: formatPrice } = useCurrency();
  
  const stats = [
    {
      title: "Today's Orders",
      value: "127",
      change: "+12%",
      icon: TrendingUp,
      color: "text-green-600"
    },
    {
      title: "Active Tables",
      value: "18/24",
      change: "75% occupied",
      icon: Users,
      color: "text-blue-600"
    },
    {
      title: "Avg. Wait Time",
      value: "12 min",
      change: "-3 min",
      icon: Clock,
      color: "text-[#032541]"
    },
    {
      title: "Daily Revenue",
      value: formatPrice(2847),
      change: "+8%",
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