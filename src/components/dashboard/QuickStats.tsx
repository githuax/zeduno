import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  change: {
    value: string;
    trend: "up" | "down";
  };
  period: string;
}

const StatCard = ({ title, value, change, period }: StatCardProps) => {
  const isPositive = change.trend === "up";
  
  return (
    <Card className="hover:shadow-card transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="text-2xl font-bold text-foreground">{value}</div>
            <div className="flex items-center gap-1 mt-1">
              {isPositive ? (
                <TrendingUp className="w-4 h-4 text-accent" />
              ) : (
                <TrendingDown className="w-4 h-4 text-destructive" />
              )}
              <span className={`text-sm font-medium ${
                isPositive ? "text-accent" : "text-destructive"
              }`}>
                {change.value}
              </span>
              <span className="text-sm text-muted-foreground">{period}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const QuickStats = () => {
  const stats = [
    {
      title: "Today's Orders",
      value: 127,
      change: { value: "+12%", trend: "up" as const },
      period: "vs yesterday"
    },
    {
      title: "Revenue",
      value: "$3,240",
      change: { value: "+8%", trend: "up" as const },
      period: "vs yesterday"
    },
    {
      title: "Active Tables",
      value: "18/24",
      change: { value: "+2", trend: "up" as const },
      period: "tables occupied"
    },
    {
      title: "Avg. Order Time",
      value: "12m",
      change: { value: "-2m", trend: "up" as const },
      period: "improvement"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  );
};

export default QuickStats;