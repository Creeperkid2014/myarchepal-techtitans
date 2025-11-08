import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { ChevronRight, Loader2 } from "lucide-react";
import { ArtifactsService, Artifact } from "@/services/artifacts";
import { Timestamp } from "firebase/firestore";

export const RecentFinds = () => {
  const navigate = useNavigate();
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArtifacts = async () => {
      try {
        setLoading(true);
        const allArtifacts = await ArtifactsService.getAllArtifacts();
        setArtifacts(allArtifacts);
      } catch (error) {
        console.error("Error fetching artifacts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchArtifacts();
  }, []);

  // Get the 3 most recently created artifacts
  const recentArtifacts = artifacts
    .sort((a, b) => {
      const dateA = a.createdAt instanceof Timestamp ? a.createdAt.toDate() : a.createdAt;
      const dateB = b.createdAt instanceof Timestamp ? b.createdAt.toDate() : b.createdAt;
      return (dateB?.getTime() || 0) - (dateA?.getTime() || 0);
    })
    .slice(0, 3);

  const formatDate = (date: Date | Timestamp | undefined) => {
    if (!date) return "Unknown date";
    const d = date instanceof Timestamp ? date.toDate() : date;
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours} hours ago`;
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const getArtifactIcon = (type: string) => {
    switch (type) {
      case 'Coin': return '🪙';
      case 'Ceramic': return '🏺';
      case 'Weapon': return '🗡️';
      case 'Glass': return '🍶';
      case 'Personal Ornament': return '📎';
      case 'Sculpture': return '🗿';
      default: return '🏺';
    }
  };

  if (loading) {
    return (
      <div className="px-4 py-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 pb-24">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-foreground">Recent Artifacts</h3>
        <button
          onClick={() => navigate("/artifacts")}
          className="text-sm text-primary font-medium"
        >
          See All
        </button>
      </div>

      {recentArtifacts.length === 0 ? (
        <Card className="p-6 border-border text-center">
          <p className="text-muted-foreground text-sm">No recent artifacts</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {recentArtifacts.map((artifact) => (
            <Card
              key={artifact.id}
              className="p-3 hover:shadow-md transition-all cursor-pointer border-border flex items-center justify-between"
              onClick={() => navigate(`/artifact/${artifact.id}`)}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                  {artifact.images && artifact.images.length > 0 ? (
                    <img
                      src={artifact.images[0]}
                      alt={artifact.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.onerror = null;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          parent.innerHTML = `<span class="text-2xl">${getArtifactIcon(artifact.type)}</span>`;
                        }
                      }}
                    />
                  ) : (
                    <span className="text-2xl">{getArtifactIcon(artifact.type)}</span>
                  )}
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-foreground line-clamp-1">{artifact.name}</h4>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <span>{artifact.type} • {artifact.material}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatDate(artifact.createdAt)}
                  </div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
