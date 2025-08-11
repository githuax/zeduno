import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Users, Clock, DollarSign } from "lucide-react";

const QuickStats = () => {
  const stats = [
    {
      title: "Today's Orders",
      value: "127",
      change: "+12%",
      icon: TrendingUp,
      color: "text-restaurant-success"
    },
    {
      title: "Active Tables",
      value: "18/24",
      change: "75% occupied",
      icon: Users,
      color: "text-restaurant-primary"
    },
    {
      title: "Avg. Wait Time",
      value: "12 min",
      change: "-3 min",
      icon: Clock,
      color: "text-restaurant-warning"
    },
    {
      title: "Daily Revenue",
      value: "$2,847",
      change: "+8%",
      icon: DollarSign,
      color: "text-restaurant-success"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => (
        <Card key={index} className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className={`text-xs ${stat.color}`}>
              {stat.change} from yesterday
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default QuickStats;