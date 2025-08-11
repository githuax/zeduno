import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LucideIcon } from "lucide-react";

interface ModuleCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  status: "active" | "inactive" | "maintenance";
  stats?: string;
  onClick: () => void;
}

const ModuleCard = ({ title, description, icon: Icon, status, stats, onClick }: ModuleCardProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-restaurant-success text-white";
      case "inactive":
        return "bg-muted text-muted-foreground";
      case "maintenance":
        return "bg-restaurant-warning text-white";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer group" onClick={onClick}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="p-2 rounded-lg bg-restaurant-warm">
            <Icon className="h-6 w-6 text-restaurant-primary" />
          </div>
          <Badge className={getStatusColor(status)} variant="secondary">
            {status}
          </Badge>
        </div>
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        <CardDescription className="text-sm">{description}</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        {stats && (
          <div className="mb-4">
            <p className="text-2xl font-bold text-restaurant-primary">{stats}</p>
          </div>
        )}
        <Button 
          variant="default" 
          className="w-full group-hover:bg-restaurant-secondary group-hover:text-white transition-colors"
        >
          Open Module
        </Button>
      </CardContent>
    </Card>
  );
};

export default ModuleCard;