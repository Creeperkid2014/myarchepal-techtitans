import { Card } from "@/components/ui/card";
import { ChevronRight } from "lucide-react";

const finds = [
  { name: "Bronze Coin", location: "Sector A", time: "2 hours ago", emoji: "🪙" },
  { name: "Ceramic Fragment", location: "Sector B", time: "5 hours ago", emoji: "🏺" },
  { name: "Iron Blade", location: "Sector D2", time: "Yesterday", emoji: "🗡️" },
];

export const RecentFinds = () => {
  return (
    <div className="px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-foreground">Recent Finds</h3>
        <button className="text-sm text-primary font-medium">See All</button>
      </div>
      
      <div className="space-y-2">
        {finds.map((find) => (
          <Card 
            key={find.name}
            className="p-3 hover:shadow-md transition-all cursor-pointer border-border flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                <span className="text-2xl">{find.emoji}</span>
              </div>
              <div>
                <h4 className="font-semibold text-sm text-foreground">{find.name}</h4>
                <p className="text-xs text-muted-foreground">{find.location} • {find.time}</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </Card>
        ))}
      </div>
    </div>
  );
};
