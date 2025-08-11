import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import restaurantHero from "@/assets/restaurant-hero.jpg";

const HeroSection = () => {
  return (
    <div className="relative bg-gradient-to-r from-restaurant-primary to-restaurant-secondary rounded-xl overflow-hidden mb-8">
      <div className="absolute inset-0 bg-black/20" />
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-30"
        style={{ backgroundImage: `url(${restaurantHero})` }}
      />
      <div className="relative z-10 p-8 md:p-12 text-white">
        <div className="max-w-2xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Welcome to DineServe Hub
          </h2>
          <p className="text-lg md:text-xl mb-6 text-white/90">
            Streamline your restaurant operations with our comprehensive management system.
            Manage orders, tables, inventory, and staff all in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              variant="secondary" 
              size="lg" 
              className="bg-white text-restaurant-primary hover:bg-white/90"
            >
              Quick Tour
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="border-white text-white hover:bg-white/10"
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