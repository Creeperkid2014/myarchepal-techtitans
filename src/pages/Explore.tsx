import { Search, MapPin, Calendar, TrendingUp } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const discoveries = [
  {
    id: 1,
    title: "Ancient Roman Bath Complex",
    location: "Bath, England",
    date: "2 days ago",
    team: "Oxford Archaeological Unit",
    image: "🏛️",
    trending: true
  },
  {
    id: 2,
    title: "Viking Settlement Remains",
    location: "Reykjavik, Iceland",
    date: "1 week ago",
    team: "Nordic Research Institute",
    image: "⚔️",
    trending: true
  },
  {
    id: 3,
    title: "Egyptian Hieroglyph Tablets",
    location: "Luxor, Egypt",
    date: "2 weeks ago",
    team: "Cairo Museum Team",
    image: "📜",
    trending: false
  },
  {
    id: 4,
    title: "Mayan Ceramic Collection",
    location: "Yucatan, Mexico",
    date: "3 weeks ago",
    team: "Latin American Heritage",
    image: "🏺",
    trending: false
  },
];

const Explore = () => {
  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-md mx-auto">
        <header className="bg-card p-4 border-b border-border sticky top-0 z-10">
          <h1 className="text-xl font-semibold text-foreground mb-4">Explore</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search discoveries, locations..."
              className="pl-10 border-border"
            />
          </div>
        </header>

        <div className="p-4 space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h2 className="font-semibold text-foreground">Trending Discoveries</h2>
            </div>
            <div className="space-y-3">
              {discoveries.map((discovery) => (
                <Card 
                  key={discovery.id} 
                  className="p-4 border-border hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="flex gap-3">
                    <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-3xl">{discovery.image}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-semibold text-foreground line-clamp-1">
                          {discovery.title}
                        </h3>
                        {discovery.trending && (
                          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 flex-shrink-0">
                            Trending
                          </Badge>
                        )}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="w-3 h-3" />
                          <span>{discovery.location}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          <span>{discovery.date}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          by {discovery.team}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>

        <BottomNav />
      </div>
    </div>
  );
};

export default Explore;
