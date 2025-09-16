import type { ReactNode } from "react";
import { LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";


interface ModuleCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  status: "active" | "inactive" | "maintenance" | "disabled";
  stats?: string;
  onClick: () => void;
  extra?: ReactNode;
}

const ModuleCard = ({ title, description, icon: Icon, status, stats, onClick, extra }: ModuleCardProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-700 border-green-200";
      case "inactive":
        return "bg-gray-100 text-gray-600 border-gray-200";
      case "maintenance":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "disabled":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-gray-100 text-gray-600 border-gray-200";
    }
  };

  return (
    <Card className="hover:shadow-md transition-all duration-200 cursor-pointer group border-0 shadow-sm bg-white" onClick={onClick}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="p-3 rounded-lg bg-blue-50">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          <Badge className={getStatusColor(status)} variant="outline">
            {status}
          </Badge>
        </div>
        <CardTitle className="text-lg font-medium text-foreground">{title}</CardTitle>
        <CardDescription className="text-sm text-muted-foreground leading-relaxed">{description}</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        {stats && (
          <div className="mb-4">
            <p className="text-xl font-semibold text-primary">{stats}</p>
          </div>
        )}
        {extra && (
          <div className="mb-4">
            {extra}
          </div>
        )}
        <Button 
          variant="outline" 
          className="w-full group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-colors"
        >
          Open Module
        </Button>
      </CardContent>
    </Card>
  );
};

export default ModuleCard;
