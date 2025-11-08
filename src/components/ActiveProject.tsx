import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Loader2 } from "lucide-react";
import { useSites } from "@/hooks/use-sites";
import { useAuth } from "@/hooks/use-auth";
import { useArchaeologist } from "@/hooks/use-archaeologist";
import { ArchaeologistService } from "@/services/archaeologists";
import { Timestamp } from "firebase/firestore";
import { useState, useEffect } from "react";

export const ActiveProject = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isArchaeologist } = useArchaeologist();
  const { sites, loading } = useSites();
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [fetchingActiveProject, setFetchingActiveProject] = useState(false);

  // Fetch active project ID for archaeologist
  useEffect(() => {
    const fetchActiveProject = async () => {
      if (user && isArchaeologist) {
        try {
          setFetchingActiveProject(true);
          const activeId = await ArchaeologistService.getActiveProjectId(user.uid);
          setActiveProjectId(activeId);
        } catch (error) {
          console.error("Error fetching active project:", error);
        } finally {
          setFetchingActiveProject(false);
        }
      }
    };

    fetchActiveProject();
  }, [user, isArchaeologist]);

  // For archaeologists: show their active project + 2 latest sites
  // For non-archaeologists: show 2 latest sites
  const getDisplaySites = () => {
    if (isArchaeologist && activeProjectId) {
      // Find the active project
      const activeProject = sites.find(site => site.id === activeProjectId);

      // Get latest sites sorted by creation date, excluding the active project
      const latestSites = sites
        .filter(site => site.id !== activeProjectId)
        .sort((a, b) => {
          const dateA = a.createdAt instanceof Timestamp ? a.createdAt.toDate() : a.createdAt;
          const dateB = b.createdAt instanceof Timestamp ? b.createdAt.toDate() : b.createdAt;
          return (dateB?.getTime() || 0) - (dateA?.getTime() || 0);
        })
        .slice(0, 2);

      // Return active project first, then latest sites
      return activeProject ? [activeProject, ...latestSites] : latestSites;
    } else {
      // Show 2 most recent sites
      return sites
        .sort((a, b) => {
          const dateA = a.createdAt instanceof Timestamp ? a.createdAt.toDate() : a.createdAt;
          const dateB = b.createdAt instanceof Timestamp ? b.createdAt.toDate() : b.createdAt;
          return (dateB?.getTime() || 0) - (dateA?.getTime() || 0);
        })
        .slice(0, 2);
    }
  };

  const displaySites = getDisplaySites();

  const formatDate = (date: Date | Timestamp | undefined) => {
    if (!date) return "Unknown date";
    const d = date instanceof Timestamp ? date.toDate() : date;
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };

  const getLocationDisplay = (site: any) => {
    const parts = [];
    if (site.location?.region) parts.push(site.location.region);
    if (site.location?.country) parts.push(site.location.country);
    return parts.join(", ") || "Location not specified";
  };

  if (loading || fetchingActiveProject) {
    return (
      <div className="px-4 py-6 bg-muted/30">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 bg-muted/30">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-foreground">
          {isArchaeologist && activeProjectId ? "Active Project & Recent Sites" : "Recent Sites"}
        </h3>
        <button
          onClick={() => navigate("/site-lists")}
          className="text-sm text-primary font-medium"
        >
          View All
        </button>
      </div>

      {displaySites.length === 0 ? (
        <Card className="p-6 border-border text-center">
          <p className="text-muted-foreground text-sm">No sites available</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {displaySites.map((site) => {
            const isActiveProject = isArchaeologist && site.id === activeProjectId;
            return (
            <Card
              key={site.id}
              className="p-4 border-border hover:shadow-md transition-all cursor-pointer"
              onClick={() => navigate(`/site/${site.id}`)}
            >
              <div className="flex gap-3">
                <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {site.images && site.images.length > 0 ? (
                    <img
                      src={site.images[0]}
                      alt={site.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.onerror = null;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          parent.innerHTML = '<span class="text-2xl">🏛️</span>';
                        }
                      }}
                    />
                  ) : (
                    <span className="text-2xl">🏛️</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="font-semibold text-foreground line-clamp-1">{site.name}</h4>
                    {isActiveProject && (
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 flex-shrink-0">
                        Active Project
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="w-3 h-3" />
                      <span>{getLocationDisplay(site)}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      <span>Discovered: {formatDate(site.dateDiscovered)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
