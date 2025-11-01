import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Camera, MapPin, Calendar, FileText, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const NewFind = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    date: new Date().toISOString().split('T')[0],
    description: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Find Documented",
      description: "Your archaeological find has been successfully recorded.",
    });
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-md mx-auto">
        <header className="bg-card p-4 border-b border-border sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
              className="hover:bg-muted"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-semibold text-foreground">New Find</h1>
          </div>
        </header>

        <div className="p-4 space-y-6">
          <Card className="p-6 border-border">
            <div className="flex items-center justify-center h-48 bg-muted rounded-lg mb-4 cursor-pointer hover:bg-muted/80 transition-colors">
              <div className="text-center">
                <Camera className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Tap to capture photo</p>
              </div>
            </div>
            <Button variant="outline" className="w-full" size="sm">
              <Upload className="w-4 h-4 mr-2" />
              Upload from Gallery
            </Button>
          </Card>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-foreground">Artifact Name</Label>
              <Input
                id="name"
                placeholder="e.g., Bronze Coin, Ceramic Fragment"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location" className="text-foreground">Location</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="location"
                  placeholder="Sector, Grid Reference"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  required
                  className="pl-10 border-border"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date" className="text-foreground">Discovery Date</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                  className="pl-10 border-border"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-foreground">Description</Label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Textarea
                  id="description"
                  placeholder="Detailed description of the artifact, condition, context..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  className="pl-10 min-h-32 border-border"
                />
              </div>
            </div>

            <Button type="submit" className="w-full">
              Document Find
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default NewFind;
