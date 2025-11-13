import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MapPin, Calendar, Edit, Share2, Loader2, Building2, Ruler, Star, ShoppingCart, DollarSign, Trash2, Image as ImageIcon } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArtifactsService, Artifact } from "@/services/artifacts";
import { SitesService, Site } from "@/services/sites";
import { useAuth } from "@/hooks/use-auth";
import { useArchaeologist } from "@/hooks/use-archaeologist";
import { useToast } from "@/components/ui/use-toast";
import { Timestamp } from "firebase/firestore";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const ArtifactDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isArchaeologist } = useArchaeologist();
  const { toast } = useToast();
  const [artifact, setArtifact] = useState<Artifact | null>(null);
  const [site, setSite] = useState<Site | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting3DImage, setDeleting3DImage] = useState(false);

  useEffect(() => {
    const fetchArtifact = async () => {
      if (!id) {
        setError("Artifact ID not found");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const artifactData = await ArtifactsService.getArtifactById(id);
        setArtifact(artifactData);

        // Fetch site data if artifact has a siteId
        if (artifactData?.siteId) {
          try {
            const siteData = await SitesService.getSiteById(artifactData.siteId);
            setSite(siteData);
          } catch (siteError) {
            console.error("Error fetching site data:", siteError);
            // Don't set error here, just log it - artifact details can still be shown
          }
        }
      } catch (error) {
        console.error("Error fetching artifact:", error);
        setError("Failed to load artifact details");
      } finally {
        setLoading(false);
      }
    };

    fetchArtifact();
  }, [id]);

  const getSignificanceColor = (significance: string) => {
    switch (significance) {
      case "Very High": return "bg-red-500/10 text-red-600 border-red-500/20";
      case "High": return "bg-orange-500/10 text-orange-600 border-orange-500/20";
      case "Medium": return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
      case "Low": return "bg-green-500/10 text-green-600 border-green-500/20";
      default: return "";
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case "Excellent": return "bg-green-500/10 text-green-600 border-green-500/20";
      case "Good": return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "Fair": return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
      case "Fragment": return "bg-orange-500/10 text-orange-600 border-orange-500/20";
      case "Poor": return "bg-red-500/10 text-red-600 border-red-500/20";
      default: return "";
    }
  };

  const formatDate = (date: Date | Timestamp | undefined) => {
    if (!date) return "Unknown date";
    const d = date instanceof Timestamp ? date.toDate() : date;
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  const handleShare = async () => {
    if (navigator.share && artifact) {
      try {
        await navigator.share({
          title: artifact.name,
          text: artifact.description,
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
          description: "Artifact link has been copied to clipboard",
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

  const handleSiteClick = () => {
    if (site?.id) {
      navigate(`/site/${site.id}`);
    } else if (artifact?.siteId) {
      navigate(`/site/${artifact.siteId}`);
    }
  };

  const handle3DImageDelete = async () => {
    if (!artifact?.id) return;

    try {
      setDeleting3DImage(true);

      // Update artifact to remove 3D model data
      await ArtifactsService.updateArtifact(artifact.id, {
        model3D: null,
        model3DFileName: null,
        model3DForSale: false,
        model3DPrice: null,
      });

      // Refresh artifact data
      const updatedArtifact = await ArtifactsService.getArtifactById(artifact.id);
      setArtifact(updatedArtifact);

      toast({
        title: "Success",
        description: "3D image has been deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting 3D image:", error);
      toast({
        title: "Error",
        description: "Failed to delete 3D image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeleting3DImage(false);
      setShowDeleteDialog(false);
    }
  };

  const canEdit = user && isArchaeologist && artifact && artifact.createdBy === user.uid;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading artifact details...</p>
        </div>
      </div>
    );
  }

  if (error || !artifact) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error || "Artifact not found"}</p>
          <Button onClick={() => navigate("/artifacts")} variant="outline">
            Back to Artifacts
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
                  onClick={() => navigate(`/edit-artifact/${artifact.id}`)}
                  className="hover:bg-muted"
                >
                  <Edit className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </header>

        <div className="p-4 space-y-4">
          {/* Artifact Images */}
          {artifact.images && artifact.images.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="w-full h-64 relative overflow-hidden rounded-lg">
                  <img
                    src={artifact.images[0]}
                    alt={artifact.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                </div>
                {artifact.images.length > 1 && (
                  <div className="flex gap-2 mt-2 overflow-x-auto">
                    {artifact.images.slice(1).map((image, index) => (
                      <img
                        key={index}
                        src={image}
                        alt={`${artifact.name} ${index + 2}`}
                        className="w-20 h-20 object-cover rounded-lg flex-shrink-0 cursor-pointer hover:opacity-80"
                        onClick={() => {
                          // Could add image modal here
                        }}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Artifact Header */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                  {artifact.images && artifact.images.length > 0 ? (
                    <img
                      src={artifact.images[0]}
                      alt={artifact.name}
                      className="w-full h-full object-cover rounded-lg"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.onerror = null;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          parent.innerHTML = `<span class="text-4xl">${
                            artifact.type === 'Coin' ? '🪙' :
                            artifact.type === 'Ceramic' ? '🏺' :
                            artifact.type === 'Weapon' ? '🗡️' :
                            artifact.type === 'Glass' ? '🍶' :
                            artifact.type === 'Personal Ornament' ? '📎' :
                            artifact.type === 'Sculpture' ? '🗿' :
                            '🏺'
                          }</span>`;
                        }
                      }}
                    />
                  ) : (
                    <span className="text-4xl">
                      {artifact.type === 'Coin' ? '🪙' :
                       artifact.type === 'Ceramic' ? '🏺' :
                       artifact.type === 'Weapon' ? '🗡️' :
                       artifact.type === 'Glass' ? '🍶' :
                       artifact.type === 'Personal Ornament' ? '📎' :
                       artifact.type === 'Sculpture' ? '🗿' :
                       '🏺'}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h2 className="text-xl font-bold text-foreground">
                      {artifact.name}
                    </h2>
                    <Badge variant="outline" className={getSignificanceColor(artifact.significance)}>
                      <Star className="w-3 h-3 mr-1" />
                      <span className="capitalize">{artifact.significance}</span>
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Building2 className="w-4 h-4" />
                      <button
                        onClick={handleSiteClick}
                        className="hover:text-primary hover:underline"
                        disabled={!site}
                      >
                        {site ? site.name : (artifact.siteName || "Unknown Site")}
                      </button>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span>{artifact.location}</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>Excavated: {formatDate(artifact.excavationDate)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Classification */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Classification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium">Type:</span>
                  <p className="text-muted-foreground">{artifact.type}</p>
                </div>
                <div>
                  <span className="text-sm font-medium">Period:</span>
                  <p className="text-muted-foreground">{artifact.period}</p>
                </div>
              </div>
              {artifact.date && (
                <div>
                  <span className="text-sm font-medium">Dating:</span>
                  <p className="text-muted-foreground">{artifact.date}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium">Material:</span>
                  <p className="text-muted-foreground">{artifact.material}</p>
                </div>
                <div>
                  <span className="text-sm font-medium">Condition:</span>
                  <Badge variant="outline" className={getConditionColor(artifact.condition)}>
                    {artifact.condition}
                  </Badge>
                </div>
              </div>
              {artifact.dimensions && (
                <div>
                  <span className="text-sm font-medium">Dimensions:</span>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Ruler className="w-3 h-3" />
                    <span>{artifact.dimensions}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 3D Image Section - Show for logged in users */}
          {user && artifact.model3D && (
            <Card className={artifact.model3DForSale && artifact.model3DPrice ? "border-primary/50 bg-gradient-to-br from-primary/5 to-primary/10" : ""}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ImageIcon className="w-5 h-5" />
                    3D Digital Image
                  </CardTitle>
                  {canEdit && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/edit-artifact/${artifact.id}`)}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setShowDeleteDialog(true)}
                        disabled={deleting3DImage}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 3D Image Preview */}
                <div className="relative">
                  <img
                    src={artifact.model3D}
                    alt={`${artifact.name} 3D Image`}
                    className="w-full h-64 object-cover rounded-lg border border-border"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                  {artifact.model3DFileName && (
                    <div className="mt-2 text-sm text-muted-foreground">
                      <span className="font-medium">File:</span> {artifact.model3DFileName}
                    </div>
                  )}
                </div>

                {/* Purchase Section - Only show if marked for sale */}
                {artifact.model3DForSale && artifact.model3DPrice && (
                  <>
                    <Separator />
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <ShoppingCart className="w-5 h-5 text-primary" />
                        <h3 className="text-lg font-semibold">Purchase & Download</h3>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">3D Digital Image Download</p>
                          <p className="text-xs text-muted-foreground">
                            High-quality 3D image for visualization
                          </p>
                        </div>
                        <div className="flex items-center gap-1 text-lg font-bold text-primary">
                          <DollarSign className="w-5 h-5" />
                          <span>{artifact.model3DPrice.toFixed(2)}</span>
                        </div>
                      </div>

                      <div className="bg-card/50 rounded-lg p-3 space-y-2">
                        <p className="text-sm font-medium">What's included:</p>
                        <ul className="text-xs text-muted-foreground space-y-1 ml-4">
                          <li>• Instant digital download of 3D image</li>
                          <li>• 3D print will be shipped to your address</li>
                          <li>• High-resolution file suitable for 3D visualization</li>
                          <li>• Personal use license included</li>
                        </ul>
                      </div>

                      <Button
                        className="w-full"
                        size="lg"
                        onClick={() => navigate(`/checkout/${artifact.id}`)}
                      >
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Buy Now - ${artifact.model3DPrice.toFixed(2)}
                      </Button>

                      <p className="text-xs text-center text-muted-foreground">
                        Secure payment processing • Instant download after purchase
                      </p>
                    </div>
                  </>
                )}

                {/* Not for sale message */}
                {!artifact.model3DForSale && (
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-sm text-muted-foreground text-center">
                      This 3D image is currently not available for purchase
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {artifact.description || "No description available"}
              </p>
            </CardContent>
          </Card>

          {/* AI Image Analysis */}
          {artifact.aiImageSummary && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  🤖 AI Image Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  {artifact.aiImageSummary}
                </p>
                <p className="text-xs text-muted-foreground mt-3 italic">
                  This analysis was automatically generated by AI when the artifact image was uploaded.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Archaeological Context */}
          {artifact.findContext && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Archaeological Context</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{artifact.findContext}</p>
              </CardContent>
            </Card>
          )}

          {/* Tags */}
          {artifact.tags && artifact.tags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {artifact.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Additional Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Additional Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {artifact.finder && (
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Finder:</span>
                  <span className="text-muted-foreground text-sm">
                    {artifact.finder}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Cataloged:</span>
                <span className="text-muted-foreground text-sm">
                  {formatDate(artifact.createdAt)}
                </span>
              </div>
              {artifact.updatedAt && (
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Last Updated:</span>
                  <span className="text-muted-foreground text-sm">
                    {formatDate(artifact.updatedAt)}
                  </span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Artifact ID:</span>
                <span className="text-muted-foreground text-sm font-mono">
                  {artifact.id}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        <BottomNav />
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete 3D Image</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this 3D image? This action cannot be undone.
              The image will be permanently removed from this artifact.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting3DImage}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handle3DImageDelete}
              disabled={deleting3DImage}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting3DImage ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ArtifactDetails;