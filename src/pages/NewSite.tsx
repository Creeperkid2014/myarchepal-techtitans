import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, FileText, Save, Loader2, Upload, Image as ImageIcon } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BottomNav } from "@/components/BottomNav";
import { useToast } from "@/components/ui/use-toast";
import { SitesService } from "@/services/sites";
import { Timestamp } from "firebase/firestore";
import { useAuth } from "@/hooks/use-auth";
import { useArchaeologist } from "@/hooks/use-archaeologist";

// Default coordinates for Raleigh, North Carolina
const DEFAULT_LOCATION = {
  latitude: 35.7796,
  longitude: -78.6382
};

const NewSite = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { isArchaeologist, loading: archaeologistLoading, canCreate } = useArchaeologist();
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [locationLoading, setLocationLoading] = useState(true);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    location: {
      latitude: "",
      longitude: ""
    },
    period: "",
    status: "active",
    dateDiscovered: new Date().toISOString().split('T')[0]
  });

  // Get user's location on component mount
  useEffect(() => {
    const getUserLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setFormData(prev => ({
              ...prev,
              location: {
                latitude: position.coords.latitude.toString(),
                longitude: position.coords.longitude.toString()
              }
            }));
            setLocationLoading(false);
            console.log('✅ User location obtained:', position.coords.latitude, position.coords.longitude);
            toast({
              title: "Location Detected",
              description: "Your current location has been set",
            });
          },
          (error) => {
            console.warn('⚠️ Location permission denied or unavailable:', error.message);
            console.log('🏛️ Using default location: Raleigh, NC');
            setFormData(prev => ({
              ...prev,
              location: {
                latitude: DEFAULT_LOCATION.latitude.toString(),
                longitude: DEFAULT_LOCATION.longitude.toString()
              }
            }));
            setLocationLoading(false);
            toast({
              title: "Default Location Set",
              description: "Using Raleigh, NC as default location",
            });
          },
          {
            enableHighAccuracy: false,
            timeout: 5000,
            maximumAge: 0
          }
        );
      } else {
        console.warn('⚠️ Geolocation is not supported by this browser');
        console.log('🏛️ Using default location: Raleigh, NC');
        setFormData(prev => ({
          ...prev,
          location: {
            latitude: DEFAULT_LOCATION.latitude.toString(),
            longitude: DEFAULT_LOCATION.longitude.toString()
          }
        }));
        setLocationLoading(false);
      }
    };

    getUserLocation();
  }, [toast]);

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

    // Debug: Log user information
    console.log('🏛️ Creating site - User info:', {
      user: user,
      uid: user?.uid,
      email: user?.email,
      isAuthenticated: !!user
    });

    // Basic validation
    if (!formData.name || !formData.description) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    if (!user) {
      toast({
        title: "Authentication Error",
        description: "You must be signed in to create a site",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const siteData = {
        name: formData.name,
        description: formData.description,
        location: {
          latitude: formData.location.latitude ? parseFloat(formData.location.latitude) : DEFAULT_LOCATION.latitude,
          longitude: formData.location.longitude ? parseFloat(formData.location.longitude) : DEFAULT_LOCATION.longitude
        },
        period: formData.period || "",
        status: formData.status as "active" | "inactive" | "archived",
        dateDiscovered: Timestamp.fromDate(new Date(formData.dateDiscovered)),
        artifacts: [],
        images: [],
        createdBy: user?.uid || "anonymous"
      };

      const siteId = await SitesService.createSite(siteData);

      // Upload image if selected
      if (selectedImage && siteId) {
        try {
          const imageUrl = await SitesService.uploadSiteImage(siteId, selectedImage);
          await SitesService.updateSiteImages(siteId, [imageUrl]);
        } catch (imageError) {
          console.error("Error uploading image:", imageError);
          toast({
            title: "Warning",
            description: "Site created but image upload failed",
            variant: "destructive"
          });
        }
      }

      toast({
        title: "Success!",
        description: "Archaeological site has been added successfully",
      });

      // Navigate to site lists after successful creation
      setTimeout(() => {
        navigate("/site-lists");
      }, 1500);

    } catch (error) {
      console.error("Error creating site:", error);
      toast({
        title: "Error",
        description: "Failed to create site. Please check your Firebase configuration.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <header className="bg-card p-4 border-b border-border sticky top-0 z-10">
          <PageHeader />
        </header>

        {/* Auth & Archaeologist Status */}
        <div className="p-4 bg-muted/50">
          <div className="text-sm space-y-1">
            <div>
              <strong>Auth Status:</strong> {user ? `✅ Signed in as ${user.email}` : '❌ Not signed in'}
            </div>
            <div>
              <strong>Archaeologist Status:</strong> {
                archaeologistLoading ? '⏳ Checking...' :
                isArchaeologist ? '✅ Verified Archaeologist' : '❌ Not an archaeologist'
              }
            </div>
            <div>
              <strong>Can Create:</strong> {canCreate ? '✅ Yes' : '❌ No'}
            </div>
          </div>
        </div>

        {/* Show message for non-archaeologists */}
        {!canCreate && (
          <div className="p-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground mb-4">
                  {!user ? 'Please sign in as an archaeologist to create archaeological sites.' :
                   !isArchaeologist ? 'Only verified archaeologists can create sites.' :
                   'Loading...'}
                </p>
                {!user && (
                  <Button
                    onClick={() => navigate('/authentication/sign-in')}
                    variant="outline"
                  >
                    Sign In as Archaeologist
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Form - Only show if user can create */}
        {canCreate && (
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Image Upload Section - Moved to top */}
          <Card className="p-6 border-border">
            {imagePreview ? (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Site preview"
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={removeImage}
                >
                  Remove
                </Button>
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
                  {selectedImage ? 'Change Image' : 'Upload Image'}
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
                Location Coordinates
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {locationLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground mr-2" />
                  <span className="text-sm text-muted-foreground">Detecting location...</span>
                </div>
              ) : (
                <>
                  <div className="text-sm text-muted-foreground">
                    Location has been automatically detected. You can modify the coordinates below if needed.
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="location.latitude">Latitude *</Label>
                      <Input
                        id="location.latitude"
                        name="location.latitude"
                        type="number"
                        step="0.000001"
                        placeholder="35.7796"
                        value={formData.location.latitude}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="location.longitude">Longitude *</Label>
                      <Input
                        id="location.longitude"
                        name="location.longitude"
                        type="number"
                        step="0.000001"
                        placeholder="-78.6382"
                        value={formData.location.longitude}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="pt-4">
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating Site...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Archaeological Site
                </>
              )}
            </Button>
          </div>
        </form>
        )}

        <BottomNav />
      </div>
    </div>
  );
};

export default NewSite;