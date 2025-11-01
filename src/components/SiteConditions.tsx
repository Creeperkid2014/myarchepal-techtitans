import { Card } from "@/components/ui/card";
import { Sun, Droplets, Wind, Gauge } from "lucide-react";

export const SiteConditions = () => {
  return (
    <div className="px-4 py-6 pb-24">
      <h3 className="text-base font-semibold text-foreground mb-4">Site Conditions</h3>
      
      <Card className="p-4 border-border">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-warning/20 rounded-full flex items-center justify-center">
              <Sun className="w-7 h-7 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Sunny</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-foreground">24°C</p>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4 mb-3 pb-3 border-b border-border">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Droplets className="w-4 h-4 text-accent" />
            </div>
            <p className="text-lg font-semibold text-foreground">45%</p>
            <p className="text-xs text-muted-foreground">Humidity</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Wind className="w-4 h-4 text-accent" />
            </div>
            <p className="text-lg font-semibold text-foreground">8 km/h</p>
            <p className="text-xs text-muted-foreground">Wind</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Gauge className="w-4 h-4 text-accent" />
            </div>
            <p className="text-lg font-semibold text-foreground">6</p>
            <p className="text-xs text-muted-foreground">UV Index</p>
          </div>
        </div>
        
        <p className="text-xs text-center text-muted-foreground">
          Perfect conditions for excavation work
        </p>
      </Card>
    </div>
  );
};
