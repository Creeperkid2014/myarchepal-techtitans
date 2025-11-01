import { useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Layers, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const sectors = [
  { id: "A", finds: 12, color: "bg-primary" },
  { id: "B", finds: 8, color: "bg-secondary" },
  { id: "C", finds: 5, color: "bg-accent" },
  { id: "D", finds: 15, color: "bg-destructive" },
];

const SiteMap = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-md mx-auto">
        <header className="bg-card p-4 border-b border-border sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/")}
                className="hover:bg-muted"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-xl font-semibold text-foreground">Site Map</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="hover:bg-muted">
                <Layers className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" className="hover:bg-muted">
                <Maximize2 className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </header>

        <div className="p-4 space-y-4">
          <Card className="p-4 border-border">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-semibold text-foreground">Roman Villa Excavation</h2>
                <p className="text-sm text-muted-foreground">Pompeii, Italy</p>
              </div>
              <MapPin className="w-5 h-5 text-primary" />
            </div>

            <div className="relative bg-muted rounded-lg p-6 h-80 flex items-center justify-center">
              <div className="grid grid-cols-2 gap-4 w-full max-w-xs">
                {sectors.map((sector) => (
                  <div
                    key={sector.id}
                    className={`${sector.color}/20 border-2 border-current rounded-lg p-6 cursor-pointer hover:scale-105 transition-transform flex flex-col items-center justify-center`}
                  >
                    <div className={`w-12 h-12 ${sector.color} rounded-full flex items-center justify-center mb-2`}>
                      <span className="text-white font-bold text-lg">{sector.id}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {sector.finds} finds
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-center gap-4 mt-4">
              <Button variant="outline" size="icon">
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-sm text-muted-foreground">100%</span>
              <Button variant="outline" size="icon">
                <ZoomIn className="w-4 h-4" />
              </Button>
            </div>
          </Card>

          <div className="space-y-2">
            <h3 className="font-semibold text-foreground">Sector Legend</h3>
            {sectors.map((sector) => (
              <div key={sector.id} className="flex items-center justify-between p-3 bg-card rounded-lg border border-border">
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 ${sector.color} rounded`} />
                  <span className="font-medium text-foreground">Sector {sector.id}</span>
                </div>
                <span className="text-sm text-muted-foreground">{sector.finds} artifacts</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SiteMap;
