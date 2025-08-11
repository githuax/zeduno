import { Button } from "@/components/ui/button";
import { ArrowRight, Play } from "lucide-react";
import heroImage from "@/assets/restaurant-hero.jpg";

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-hero rounded-2xl shadow-elegant">
      <div className="absolute inset-0 bg-black/40" />
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-60"
        style={{ backgroundImage: `url(${heroImage})` }}
      />
      
      <div className="relative z-10 px-8 py-16 lg:px-16 lg:py-20">
        <div className="max-w-2xl">
          <h1 className="text-4xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            Streamline Your
            <span className="text-accent block">Restaurant Operations</span>
          </h1>
          
          <p className="text-xl text-white/90 mb-8 leading-relaxed">
            Comprehensive management system for orders, inventory, staff, and customer experience. 
            Everything you need to run a successful restaurant operation.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Button variant="hero" size="lg" className="text-lg">
              Get Started Today
              <ArrowRight className="w-5 h-5" />
            </Button>
            
            <Button variant="outline" size="lg" className="text-lg bg-white/10 border-white/30 text-white hover:bg-white/20">
              <Play className="w-5 h-5" />
              Watch Demo
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;