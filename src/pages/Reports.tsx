import { Download, FileText, Calendar, Share2 } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const reports = [
  {
    id: 1,
    title: "Monthly Excavation Report",
    date: "January 2025",
    type: "Monthly Summary",
    status: "Final",
    pages: 24,
    downloads: 12
  },
  {
    id: 2,
    title: "Artifact Catalog Q4 2024",
    date: "December 2024",
    type: "Catalog",
    status: "Final",
    pages: 89,
    downloads: 45
  },
  {
    id: 3,
    title: "Site Analysis - Sector A",
    date: "January 15, 2025",
    type: "Site Analysis",
    status: "Draft",
    pages: 12,
    downloads: 3
  },
  {
    id: 4,
    title: "Conservation Report",
    date: "January 10, 2025",
    type: "Conservation",
    status: "Review",
    pages: 18,
    downloads: 7
  },
];

const Reports = () => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Final": return "bg-success/10 text-success border-success/20";
      case "Draft": return "bg-warning/10 text-warning border-warning/20";
      case "Review": return "bg-accent/10 text-accent border-accent/20";
      default: return "";
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-md mx-auto">
        <header className="bg-card p-4 border-b border-border sticky top-0 z-10">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold text-foreground">Reports</h1>
            <Button size="sm">
              <FileText className="w-4 h-4 mr-2" />
              New Report
            </Button>
          </div>
          
          <div className="grid grid-cols-3 gap-3">
            <Card className="p-3 border-border text-center">
              <p className="text-2xl font-bold text-primary">{reports.length}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </Card>
            <Card className="p-3 border-border text-center">
              <p className="text-2xl font-bold text-success">2</p>
              <p className="text-xs text-muted-foreground">Final</p>
            </Card>
            <Card className="p-3 border-border text-center">
              <p className="text-2xl font-bold text-warning">2</p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </Card>
          </div>
        </header>

        <div className="p-4 space-y-3">
          {reports.map((report) => (
            <Card key={report.id} className="p-4 border-border hover:shadow-md transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-1">{report.title}</h3>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                    <Calendar className="w-3 h-3" />
                    <span>{report.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {report.type}
                    </Badge>
                    <Badge variant="outline" className={getStatusColor(report.status)}>
                      {report.status}
                    </Badge>
                  </div>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border">
                <div className="text-xs text-muted-foreground">
                  {report.pages} pages • {report.downloads} downloads
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Share2 className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <BottomNav />
      </div>
    </div>
  );
};

export default Reports;
