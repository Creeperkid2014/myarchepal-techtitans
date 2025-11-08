import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Calendar, FileText, Camera, Save, Loader2, AlertCircle, Upload, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BottomNav } from "@/components/BottomNav";
import { useToast } from "@/components/ui/use-toast";
import { SitesService, Site } from "@/services/sites";
import { Timestamp } from "firebase/firestore";
import { useAuth } from "@/hooks/use-auth";
import { useArchaeologist } from "@/hooks/use-archaeologist";
import { SiteConditions } from "@/components/SiteConditions";

const EditSite = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { isArchaeologist, loading: archaeologistLoading } = useArchaeologist();
  const [loading, setLoading] = useState(false);
  const [siteLoading, setSiteLoading] = useState(true);
  const [site, setSite] = useState<Site | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    location: {
      address: "",
      country: "",
      region: "",
      latitude: "",
      longitude: ""
    },
    period: "",
    status: "active" as "active" | "inactive" | "archived",
    dateDiscovered: ""
  });

  useEffect(() => {
    const fetchSite = async () => {
      if (!id) {
        setError("Site ID not found");
        setSiteLoading(false);
        return;
      }

      try {
        setSiteLoading(true);
        const siteData = await SitesService.getSiteById(id);

        if (!siteData) {
          setError("Site not found");
          return;
        }

        setSite(siteData);

        // Convert Timestamp to date string for input
        const dateDiscovered = siteData.dateDiscovered instanceof Timestamp
          ? siteData.dateDiscovered.toDate().toISOString().split('T')[0]
          : siteData.dateDiscovered instanceof Date
          ? siteData.dateDiscovered.toISOString().split('T')[0]
          : "";

        // Populate form with existing data
        setFormData({
          name: siteData.name || "",
          description: siteData.description || "",
          location: {
            address: siteData.location?.address || "",
            country: siteData.location?.country || "",
            region: siteData.location?.region || "",
            latitude: siteData.location?.latitude?.toString() || "",
            longitude: siteData.location?.longitude?.toString() || ""
          },
          period: siteData.period || "",
          status: siteData.status || "active",
          dateDiscovered
        });
      } catch (error) {
        console.error("Error fetching site:", error);
        setError("Failed to load site details");
      } finally {
        setSiteLoading(false);
      }
    };

    fetchSite();
  }, [id]);

  // Check if user can edit this site
  const canEdit = user && isArchaeologist && site && site.createdBy === user.uid;

  useEffect(() => {
    if (!siteLoading && !archaeologistLoading && !canEdit) {
      toast({
        title: "Access Denied",
        description: "You can only edit sites that you created",
        variant: "destructive"
      });
      navigate(`/site/${id}`);
    }
  }, [canEdit, siteLoading, archaeologistLoading, navigate, id, toast]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name.startsWith("location.")) {
      const locationField = name.split(".")[1];
      setFormData(prev => ({
        ...prev,
        location: {
          ...prev.location,
          [locationField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSelectChange = (value: string, field: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 5MB",
          variant: "destructive"
        });
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file",
          variant: "destructive"
        });
        return;
      }

      setSelectedImage(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!site) {
      toast({
        title: "Error",
        description: "Site data not loaded",
        variant: "destructive"
      });
      return;
    }

    // Basic validation
    if (!formData.name || !formData.description) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const updateData = {
        name: formData.name,
        description: formData.description,
        location: {
          address: formData.location.address || "",
          country: formData.location.country || "",
          region: formData.location.region || "",
          latitude: formData.location.latitude ? parseFloat(formData.location.latitude) : 0,
          longitude: formData.location.longitude ? parseFloat(formData.location.longitude) : 0
        },
        period: formData.period || "",
        status: formData.status,
        dateDiscovered: Timestamp.fromDate(new Date(formData.dateDiscovered)),
      };

      await SitesService.updateSite(site.id!, updateData);

      // Upload new image if selected
      if (selectedImage && site.id) {
        try {
          const imageUrl = await SitesService.uploadSiteImage(site.id, selectedImage);
          const existingImages = site.images || [];
          await SitesService.updateSiteImages(site.id, [imageUrl, ...existingImages]);
        } catch (imageError) {
          console.error("Error uploading image:", imageError);
          toast({
            title: "Warning",
            description: "Site updated but image upload failed",
            variant: "destructive"
          });
        }
      }

      toast({
        title: "Success!",
        description: "Site has been updated successfully",
      });

      // Navigate back to site details
      navigate(`/site/${site.id}`);

    } catch (error) {
      console.error("Error updating site:", error);
      toast({
        title: "Error",
        description: "Failed to update site. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (siteLoading || archaeologistLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading site...</p>
        </div>
      </div>
    );
  }

  if (error || !site) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <p className="text-red-500 mb-4">{error || "Site not found"}</p>
          <Button onClick={() => navigate("/site-lists")} variant="outline">
            Back to Sites
          </Button>
        </div>
      </div>
    );
  }

  if (!canEdit) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
          <p className="text-muted-foreground mb-4">You can only edit sites that you created</p>
          <Button onClick={() => navigate(`/site/${id}`)} variant="outline">
            Back to Site Details
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
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(`/site/${id}`)}
              className="hover:bg-muted"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-semibold text-foreground">Edit Site</h1>
          </div>
        </header>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Site Conditions - Weather based on site coordinates */}
          {site.location?.latitude && site.location?.longitude && (
            <SiteConditions
              latitude={site.location.latitude}
              longitude={site.location.longitude}
            />
          )}

          {/* Image Upload Section */}
          <Card className="p-6 border-border">
            {imagePreview || (site.images && site.images.length > 0) ? (
              <div className="relative">
                <img
                  src={imagePreview || site.images?.[0]}
                  alt="Site preview"
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />
                {imagePreview && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={removeImage}
                  >
                    Remove
                  </Button>
                )}
              </div>
            ) : (
              <label htmlFor="image-upload" className="cursor-pointer">
                <div className="flex items-center justify-center h-48 bg-muted rounded-lg mb-4 hover:bg-muted/80 transition-colors">
                  <div className="text-center">
                    <ImageIcon className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Click to add site image</p>
                    <p className="text-xs text-muted-foreground mt-1">Max 5MB (JPG, PNG, GIF)</p>
                  </div>
                </div>
              </label>
            )}
            <input
              id="image-upload"
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
            <label htmlFor="image-upload">
              <Button variant="outline" className="w-full" size="sm" type="button" asChild>
                <span>
                  <Upload className="w-4 h-4 mr-2" />
                  {selectedImage || (site.images && site.images.length > 0) ? 'Change Image' : 'Upload Image'}
                </span>
              </Button>
            </label>
          </Card>

          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Site Name *</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="e.g., Ancient Roman Villa"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Provide a detailed description of the archaeological site..."
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  required
                />
              </div>

              <div>
                <Label htmlFor="period">Historical Period</Label>
                <Input
                  id="period"
                  name="period"
                  placeholder="e.g., Roman Empire, Bronze Age"
                  value={formData.period}
                  onChange={handleInputChange}
                />
              </div>

              <div>
                <Label htmlFor="dateDiscovered">Date Discovered</Label>
                <Input
                  id="dateDiscovered"
                  name="dateDiscovered"
                  type="date"
                  value={formData.dateDiscovered}
                  onChange={handleInputChange}
                />
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleSelectChange(value, "status")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Location Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Location Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="location.address">Address</Label>
                <Input
                  id="location.address"
                  name="location.address"
                  placeholder="Street address or location description"
                  value={formData.location.address}
                  onChange={handleInputChange}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="location.region">Region/State</Label>
                  <Input
                    id="location.region"
                    name="location.region"
                    placeholder="e.g., Lazio"
                    value={formData.location.region}
                    onChange={handleInputChange}
                  />
                </div>

                <div>
                  <Label htmlFor="location.country">Country</Label>
                  <Input
                    id="location.country"
                    name="location.country"
                    placeholder="e.g., Italy"
                    value={formData.location.country}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="location.latitude">Latitude</Label>
                  <Input
                    id="location.latitude"
                    name="location.latitude"
                    type="number"
                    step="0.000001"
                    placeholder="41.902783"
                    value={formData.location.latitude}
                    onChange={handleInputChange}
                  />
                </div>

                <div>
                  <Label htmlFor="location.longitude">Longitude</Label>
                  <Input
                    id="location.longitude"
                    name="location.longitude"
                    type="number"
                    step="0.000001"
                    placeholder="12.496365"
                    value={formData.location.longitude}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="pt-4 space-y-2">
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating Site...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Update Site
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => navigate(`/site/${id}`)}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </form>

        <BottomNav />
      </div>
    </div>
  );
};

export default EditSite;