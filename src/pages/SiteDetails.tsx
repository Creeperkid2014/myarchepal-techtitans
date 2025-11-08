import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MapPin, Calendar, Users, FileText, Edit, Share2, Loader2, ChevronRight } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { PageHeader } from "@/components/PageHeader";
import { SiteConditions } from "@/components/SiteConditions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SitesService, Site } from "@/services/sites";
import { ArtifactsService, Artifact } from "@/services/artifacts";
import { useAuth } from "@/hooks/use-auth";
import { useArchaeologist } from "@/hooks/use-archaeologist";
import { useToast } from "@/components/ui/use-toast";
import { Timestamp } from "firebase/firestore";

const SiteDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isArchaeologist } = useArchaeologist();
  const { toast } = useToast();
  const [site, setSite] = useState<Site | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [siteArtifacts, setSiteArtifacts] = useState<Artifact[]>([]);
  const [artifactsLoading, setArtifactsLoading] = useState(false);

  useEffect(() => {
    const fetchSite = async () => {
      if (!id) {
        setError("Site ID not found");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const siteData = await SitesService.getSiteById(id);
        setSite(siteData);
      } catch (error) {
        console.error("Error fetching site:", error);
        setError("Failed to load site details");
      } finally {
        setLoading(false);
      }
    };

    fetchSite();
  }, [id]);

  // Fetch artifacts for this site
  useEffect(() => {
    const fetchSiteArtifacts = async () => {
      if (!id) return;

      try {
        setArtifactsLoading(true);
        const artifacts = await ArtifactsService.getArtifactsBySite(id);
        setSiteArtifacts(artifacts);
      } catch (error) {
        console.error("Error fetching site artifacts:", error);
      } finally {
        setArtifactsLoading(false);
      }
    };

    fetchSiteArtifacts();
  }, [id]);

  const formatDate = (date: Date | Timestamp | undefined) => {
    if (!date) return "Unknown date";
    const d = date instanceof Timestamp ? date.toDate() : date;
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  const getLocationDisplay = (site: Site) => {
    const parts = [];
    if (site.location?.address) parts.push(site.location.address);
    if (site.location?.region) parts.push(site.location.region);
    if (site.location?.country) parts.push(site.location.country);
    return parts.join(", ") || "Location not specified";
  };

  const handleShare = async () => {
    if (navigator.share && site) {
      try {
        await navigator.share({
          title: site.name,
          text: site.description,
          url: window.location.href,
        });
      } catch (error) {
        console.log("Error sharing:", error);
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: "Link copied!",
          description: "Site link has been copied to clipboard",
        });
      } catch (error) {
        toast({
          title: "Share failed",
          description: "Unable to share or copy link",
          variant: "destructive"
        });
      }
    }
  };

  const canEdit = user && isArchaeologist && site && site.createdBy === user.uid;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading site details...</p>
        </div>
      </div>
    );
  }

  if (error || !site) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error || "Site not found"}</p>
          <Button onClick={() => navigate("/site-lists")} variant="outline">
            Back to Sites
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <header className="bg-card p-4 border-b border-border sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <PageHeader />
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleShare}
                className="hover:bg-muted"
              >
                <Share2 className="w-4 h-4" />
              </Button>
              {canEdit && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate(`/edit-site/${site.id}`)}
                  className="hover:bg-muted"
                >
                  <Edit className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </header>

        <div className="p-4 space-y-4">
          {/* Site Images */}
          {site.images && site.images.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="w-full h-64 relative overflow-hidden rounded-lg">
                  <img
                    src={site.images[0]}
                    alt={site.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                </div>
                {site.images.length > 1 && (
                  <div className="flex gap-2 mt-2 overflow-x-auto">
                    {site.images.slice(1).map((image, index) => (
                      <img
                        key={index}
                        src={image}
                        alt={`${site.name} ${index + 2}`}
                        className="w-20 h-20 object-cover rounded-lg flex-shrink-0 cursor-pointer hover:opacity-80"
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Site Conditions - Weather based on site coordinates */}
          {site.location?.latitude && site.location?.longitude && (
            <SiteConditions
              latitude={site.location.latitude}
              longitude={site.location.longitude}
            />
          )}

          {/* Site Header */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
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
                          parent.innerHTML = '<span class="text-4xl">🏛️</span>';
                        }
                      }}
                    />
                  ) : (
                    <span className="text-4xl">🏛️</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold text-foreground mb-2">
                    {site.name}
                  </h2>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span>{getLocationDisplay(site)}</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>Discovered: {formatDate(site.dateDiscovered)}</span>
                    </div>
                    {site.period && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Users className="w-4 h-4" />
                        <span>{site.period}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {site.description || "No description available"}
              </p>
            </CardContent>
          </Card>

          {/* Location Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Location Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {site.location?.address && (
                <div>
                  <span className="text-sm font-medium">Address:</span>
                  <p className="text-muted-foreground">{site.location.address}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                {site.location?.region && (
                  <div>
                    <span className="text-sm font-medium">Region:</span>
                    <p className="text-muted-foreground">{site.location.region}</p>
                  </div>
                )}
                {site.location?.country && (
                  <div>
                    <span className="text-sm font-medium">Country:</span>
                    <p className="text-muted-foreground">{site.location.country}</p>
                  </div>
                )}
              </div>
              {(site.location?.latitude && site.location?.longitude) && (
                <div>
                  <span className="text-sm font-medium">Coordinates:</span>
                  <p className="text-muted-foreground">
                    {site.location.latitude}, {site.location.longitude}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Artifacts */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Artifacts ({siteArtifacts.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {artifactsLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  <span className="text-muted-foreground text-sm">Loading artifacts...</span>
                </div>
              ) : siteArtifacts.length > 0 ? (
                <div className="space-y-2">
                  {siteArtifacts.map((artifact) => (
                    <div
                      key={artifact.id}
                      className="p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors cursor-pointer flex items-center justify-between"
                      onClick={() => navigate(`/artifact/${artifact.id}`)}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">
                          {artifact.type === 'Coin' ? '🪙' :
                           artifact.type === 'Ceramic' ? '🏺' :
                           artifact.type === 'Weapon' ? '🗡️' :
                           artifact.type === 'Glass' ? '🍶' :
                           artifact.type === 'Personal Ornament' ? '📎' :
                           artifact.type === 'Sculpture' ? '🗿' :
                           '🏺'}
                        </span>
                        <div>
                          <p className="text-sm font-medium">{artifact.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {artifact.material} • {artifact.condition}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  No artifacts cataloged yet
                </p>
              )}
            </CardContent>
          </Card>

          {/* Site Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Site Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Created:</span>
                <span className="text-muted-foreground text-sm">
                  {formatDate(site.createdAt)}
                </span>
              </div>
              {site.updatedAt && (
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Last Updated:</span>
                  <span className="text-muted-foreground text-sm">
                    {formatDate(site.updatedAt)}
                  </span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Site ID:</span>
                <span className="text-muted-foreground text-sm font-mono">
                  {site.id}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        <BottomNav />
      </div>
    </div>
  );
};

export default SiteDetails;