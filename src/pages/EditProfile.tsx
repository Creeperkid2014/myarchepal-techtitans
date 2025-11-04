/**
 * Edit Profile Page Component
 * 
 * Allows authenticated users to edit their profile information.
 * Features:
 * - Loads current user data from authentication storage
 * - Updates user profile with new information
 * - Saves changes to localStorage via auth utilities
 * - Automatically refreshes auth context after update
 * 
 * Routes: /edit-profile
 * Requires: Authentication (redirects to sign-in if not authenticated)
 1*/

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Upload, Mail, Phone, MapPin, User } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { updateUserProfile } from "@/lib/auth";

const EditProfile = () => {
  // React Router hook for navigation
  const navigate = useNavigate();
  // Toast notification hook for user feedback
  const { toast } = useToast();
  // Auth context hook to get current user and refresh function
  const { user, refreshUser } = useAuth();
  
  // Form state management - stores user's profile data
  const [formData, setFormData] = useState({
    name: "",
    title: "",
    email: "",
    phone: "",
    location: "",
    avatar: "",
  });

  /**
   * Load current user data into form when user is available
   * Redirects to sign-in if user is not authenticated
   */
  useEffect(() => {
    if (user) {
      // Populate form with current user data
      setFormData({
        name: user.name || "",
        title: user.title || "",
        email: user.email || "",
        phone: user.phone || "",
        location: user.location || "",
        avatar: user.avatar || "",
      });
    } else {
      // Redirect to sign-in if not authenticated
      navigate("/authentication/sign-in");
    }
  }, [user, navigate]);

  /**
   * Handle form submission
   * Updates user profile in localStorage and refreshes auth context
   * @param e - Form submit event
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();  // Prevent default form submission
    
    // Double-check authentication before updating
    if (!user) {
      toast({
        title: "Error",
        description: "Please sign in to update your profile",
        variant: "destructive",
      });
      navigate("/authentication/sign-in");
      return;
    }

    try {
      // Update user profile in localStorage via auth utility
      updateUserProfile(user.id, {
        name: formData.name,
        title: formData.title,
        email: formData.email,
        phone: formData.phone,
        location: formData.location,
        avatar: formData.avatar,
      });

      // Refresh auth context to reflect updated user data
      refreshUser();
      
      // Show success notification
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
      
      // Navigate back to account page
      navigate("/account");
    } catch (error: any) {
      // Show error notification if update fails
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
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
              onClick={() => navigate("/account")}
              className="hover:bg-muted"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-semibold text-foreground">Edit Profile</h1>
          </div>
        </header>

        <div className="p-4 space-y-6">
          <Card className="p-6 border-border">
            <div className="flex flex-col items-center mb-6">
              <Avatar className="w-24 h-24 mb-4">
                <AvatarImage src={formData.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username}`} />
                <AvatarFallback>
                  {user?.name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2 w-full">
                <Input
                  placeholder="Avatar URL"
                  value={formData.avatar}
                  onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                  className="border-border"
                />
                <Button variant="outline" className="w-full" size="sm" type="button">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Profile Photo URL
                </Button>
              </div>
            </div>
          </Card>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-foreground">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="name"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="pl-10 border-border"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title" className="text-foreground">Job Title</Label>
              <Input
                id="title"
                placeholder="Enter your job title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                className="border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="pl-10 border-border"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-foreground">Phone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Enter your phone number"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                  className="pl-10 border-border"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location" className="text-foreground">Location</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="location"
                  placeholder="Enter your location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  required
                  className="pl-10 border-border"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => navigate("/account")}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                Save Changes
              </Button>
            </div>
          </form>
        </div>

        <BottomNav />
      </div>
    </div>
  );
};

export default EditProfile;