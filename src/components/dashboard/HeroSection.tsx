import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import restaurantHero from "@/assets/restaurant-hero.jpg";

const HeroSection = () => {
  return (
    <div className="relative bg-gradient-to-r from-blue-50 to-white rounded-2xl border border-border overflow-hidden mb-8 shadow-sm">
      <div className="relative p-8 md:p-12">
        <div className="max-w-2xl">
          <h2 className="text-3xl md:text-4xl font-semibold mb-4 text-foreground">
            Welcome to ZedUno
          </h2>
          <p className="text-lg md:text-xl mb-6 text-muted-foreground leading-relaxed">
            Streamline your restaurant operations with our clean, modern management system.
            Manage orders, tables, inventory, and staff with simplicity and efficiency.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              variant="default" 
              size="lg" 
              className="shadow-sm"
            >
              Quick Tour
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="lg"
            >
              View Analytics
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;