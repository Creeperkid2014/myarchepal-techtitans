import { useNavigate } from "react-router-dom";
import { ArrowLeft, FlaskConical, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const analyses = [
  { 
    id: 1, 
    name: "Bronze Coin Dating", 
    artifact: "Bronze Coin", 
    status: "completed", 
    progress: 100,
    result: "Roman Empire, 1st century CE",
    date: "2 hours ago"
  },
  { 
    id: 2, 
    name: "Ceramic Fragment Analysis", 
    artifact: "Ceramic Fragment", 
    status: "in-progress", 
    progress: 65,
    result: "Preliminary: Local pottery",
    date: "5 hours ago"
  },
  { 
    id: 3, 
    name: "Iron Blade Composition", 
    artifact: "Iron Blade", 
    status: "pending", 
    progress: 0,
    result: "Awaiting lab review",
    date: "Yesterday"
  },
];

const Analysis = () => {
  const navigate = useNavigate();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-success/10 text-success border-success/20";
      case "in-progress": return "bg-warning/10 text-warning border-warning/20";
      case "pending": return "bg-muted-foreground/10 text-muted-foreground border-muted-foreground/20";
      default: return "";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle2 className="w-4 h-4" />;
      case "in-progress": return <Clock className="w-4 h-4" />;
      case "pending": return <AlertCircle className="w-4 h-4" />;
      default: return null;
    }
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
            <h1 className="text-xl font-semibold text-foreground">Lab Analysis</h1>
          </div>
        </header>

        <div className="p-4 space-y-4">
          <Card className="p-4 border-border bg-primary/5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                <FlaskConical className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">Active Tests</h2>
                <p className="text-sm text-muted-foreground">
                  {analyses.filter(a => a.status !== 'pending').length} running
                </p>
              </div>
            </div>
          </Card>

          <div className="space-y-3">
            <h3 className="font-semibold text-foreground">Recent Analyses</h3>
            {analyses.map((analysis) => (
              <Card key={analysis.id} className="p-4 border-border hover:shadow-md transition-all cursor-pointer">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground mb-1">{analysis.name}</h4>
                    <p className="text-sm text-muted-foreground mb-2">{analysis.artifact}</p>
                  </div>
                  <Badge variant="outline" className={getStatusColor(analysis.status)}>
                    <span className="flex items-center gap-1">
                      {getStatusIcon(analysis.status)}
                      <span className="capitalize">{analysis.status.replace('-', ' ')}</span>
                    </span>
                  </Badge>
                </div>

                {analysis.status !== 'pending' && (
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-muted-foreground">Progress</span>
                      <span className="text-xs font-medium text-foreground">{analysis.progress}%</span>
                    </div>
                    <Progress value={analysis.progress} className="h-2" />
                  </div>
                )}

                <div className="space-y-1">
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-medium text-foreground">Result:</span>
                    <span className="text-xs text-muted-foreground flex-1">{analysis.result}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{analysis.date}</p>
                </div>
              </Card>
            ))}
          </div>

          <Button className="w-full">
            <FlaskConical className="w-4 h-4 mr-2" />
            Request New Analysis
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Analysis;
