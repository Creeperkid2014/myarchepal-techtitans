import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, Users } from "lucide-react";

export const ActiveProject = () => {
  return (
    <div className="px-4 py-6 bg-muted/30">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-foreground">Active Project</h3>
        <button className="text-sm text-primary font-medium">View All</button>
      </div>
      
      <Card className="p-4 border-border">
        <div className="flex gap-3 mb-3">
          <div className="w-14 h-14 bg-muted rounded-lg flex items-center justify-center">
            <span className="text-2xl">🏛️</span>
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-foreground mb-1">Roman Villa Excavation</h4>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Pompeii, Italy • Jan 15, 2025
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              <Avatar className="w-6 h-6 border-2 border-card">
                <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=member1" />
                <AvatarFallback>M1</AvatarFallback>
              </Avatar>
              <Avatar className="w-6 h-6 border-2 border-card">
                <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=member2" />
                <AvatarFallback>M2</AvatarFallback>
              </Avatar>
              <Avatar className="w-6 h-6 border-2 border-card">
                <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=member3" />
                <AvatarFallback>M3</AvatarFallback>
              </Avatar>
            </div>
            <span className="text-xs text-muted-foreground ml-1">+3</span>
          </div>
          <span className="text-sm font-semibold text-foreground">85% Complete</span>
        </div>
        
        <Progress value={85} className="h-2" />
      </Card>
    </div>
  );
};
