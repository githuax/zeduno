import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface ModuleCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  stats?: {
    label: string;
    value: string | number;
  };
  actionLabel: string;
  variant?: "default" | "primary" | "secondary";
}

const ModuleCard = ({ 
  title, 
  description, 
  icon: Icon, 
  stats, 
  actionLabel, 
  variant = "default" 
}: ModuleCardProps) => {
  const cardVariant = variant === "primary" ? "bg-gradient-secondary" : "";
  
  return (
    <Card className={`hover:shadow-elegant transition-all duration-300 hover:scale-105 ${cardVariant}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-lg ${
              variant === "primary" 
                ? "bg-gradient-primary text-primary-foreground shadow-glow" 
                : "bg-muted text-foreground"
            }`}>
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <CardTitle className="text-lg">{title}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {stats && (
          <div className="mb-4 p-3 bg-muted rounded-lg">
            <div className="text-2xl font-bold text-foreground">{stats.value}</div>
            <div className="text-sm text-muted-foreground">{stats.label}</div>
          </div>
        )}
        <Button 
          variant={variant === "primary" ? "hero" : "default"} 
          className="w-full"
        >
          {actionLabel}
        </Button>
      </CardContent>
    </Card>
  );
};

export default ModuleCard;