/**
 * Account Page Component
 * 
 * Displays user account information and settings options.
 * Features:
 * - User profile display (avatar, name, title, contact info)
 * - Edit profile navigation
 * - Settings menu items
 * - Logout functionality
 * 
 * Routes: /account
 * Requires: Authentication (redirects to sign-in if not authenticated)
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Settings, Bell, Shield, HelpCircle, LogOut, Building2, Award, Calendar, Loader2, UserPlus } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { ArchaeologistService, Archaeologist } from "@/services/archaeologists";
import { Timestamp } from "firebase/firestore";

const Account = () => {
  // React Router hook for navigation
  const navigate = useNavigate();
  // Auth context hook to get current user and logout function
  const { user, logout } = useAuth();
  // Toast notification hook for user feedback
  const { toast } = useToast();
  // State for archaeologist profile data
  const [archaeologistProfile, setArchaeologistProfile] = useState<Archaeologist | null>(null);
  // Loading state for profile data
  const [profileLoading, setProfileLoading] = useState(false);

  /**
   * Fetch archaeologist profile data when user is available
   */
  useEffect(() => {
    const fetchArchaeologistProfile = async () => {
      if (user?.uid) {
        setProfileLoading(true);
        try {
          const profile = await ArchaeologistService.getArchaeologistProfile(user.uid);
          setArchaeologistProfile(profile);
        } catch (error) {
          console.error('Error fetching archaeologist profile:', error);
        } finally {
          setProfileLoading(false);
        }
      }
    };

    fetchArchaeologistProfile();
  }, [user?.uid]);

  /**
   * Format date for display
   */
  const formatDate = (date: Date | Timestamp | undefined) => {
    if (!date) return "Unknown";
    const d = date instanceof Timestamp ? date.toDate() : date;
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  /**
   * Handle logout button click
   * Signs out user, shows notification, and redirects to sign-in page
   */
  const handleLogout = () => {
    logout();  // Clear auth state from localStorage and context
    toast({
      title: "Signed out",
      description: "You have been successfully signed out.",
    });
    navigate("/authentication/sign-in");  // Redirect to sign-in page
  };

  // Redirect to sign-in if not authenticated
  // This protects the account page from unauthorized access
  if (!user) {
    navigate("/authentication/sign-in");
    return null;
  }

  // Get display name from Firebase user or archaeologist profile
  const displayName = archaeologistProfile?.displayName || user.displayName || user.email || "User";

  // Generate initials from display name for avatar fallback
  const initials = displayName
    ? displayName
        .split(" ")
        .map((n) => n[0])  // Get first letter of each word
        .join("")
        .toUpperCase()
        .slice(0, 2)  // Take only first 2 letters
    : "U";  // Default fallback initial

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-md mx-auto">
        <header className="bg-card p-4 border-b border-border">
          <PageHeader />
        </header>

        <div className="p-4 space-y-4">
          <Card className="p-6 border-border">
            {profileLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Loading profile...</span>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-4 mb-4">
                  <Avatar className="w-20 h-20">
                    <AvatarImage src={archaeologistProfile?.photoURL || user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`} />
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-foreground">{displayName}</h2>
                    <p className="text-sm text-muted-foreground mb-2">
                      {archaeologistProfile?.status === 'approved' ? 'Approved Archaeologist' : 'User'}
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate("/edit-profile")}
                    >
                      Edit Profile
                    </Button>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="text-foreground">{user.email}</span>
                  </div>

                  {archaeologistProfile?.institution && (
                    <div className="flex items-center gap-3 text-sm">
                      <Building2 className="w-4 h-4 text-muted-foreground" />
                      <span className="text-foreground">{archaeologistProfile.institution}</span>
                    </div>
                  )}

                  {archaeologistProfile?.specialization && (
                    <div className="flex items-center gap-3 text-sm">
                      <Award className="w-4 h-4 text-muted-foreground" />
                      <span className="text-foreground">{archaeologistProfile.specialization}</span>
                    </div>
                  )}

                  {archaeologistProfile?.credentials && (
                    <div className="flex items-center gap-3 text-sm">
                      <Shield className="w-4 h-4 text-muted-foreground" />
                      <span className="text-foreground">{archaeologistProfile.credentials}</span>
                    </div>
                  )}

                  {archaeologistProfile?.approvedAt && (
                    <div className="flex items-center gap-3 text-sm">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-foreground">Approved: {formatDate(archaeologistProfile.approvedAt)}</span>
                    </div>
                  )}
                </div>
              </>
            )}
          </Card>

          {/* Show archaeologist application card if user is not an archaeologist */}
          {!profileLoading && !archaeologistProfile && (
            <Card className="p-6 border-border bg-gradient-to-r from-primary/5 to-secondary/5">
              <div className="text-center space-y-3">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <UserPlus className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground">Become an Archaeologist</h3>
                <p className="text-sm text-muted-foreground">
                  Apply to become a verified archaeologist to access additional features like creating sites and cataloging artifacts.
                </p>
                <Button
                  onClick={() => navigate("/authentication/sign-up")}
                  className="mt-4"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Apply Now
                </Button>
              </div>
            </Card>
          )}

          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground px-1">Settings</h3>
            
            <Card className="border-border divide-y divide-border">
              <button className="w-full p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors">
                <Settings className="w-5 h-5 text-muted-foreground" />
                <span className="flex-1 text-left text-foreground">General Settings</span>
              </button>
              
              <button className="w-full p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors">
                <Bell className="w-5 h-5 text-muted-foreground" />
                <span className="flex-1 text-left text-foreground">Notifications</span>
              </button>
              
              <button className="w-full p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors">
                <Shield className="w-5 h-5 text-muted-foreground" />
                <span className="flex-1 text-left text-foreground">Privacy & Security</span>
              </button>
              
              <button className="w-full p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors">
                <HelpCircle className="w-5 h-5 text-muted-foreground" />
                <span className="flex-1 text-left text-foreground">Help & Support</span>
              </button>
            </Card>
          </div>

          <Card className="border-border">
            <button 
              onClick={handleLogout}
              className="w-full p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors text-destructive"
            >
              <LogOut className="w-5 h-5" />
              <span className="flex-1 text-left font-medium">Log Out</span>
            </button>
          </Card>

          <div className="text-center text-xs text-muted-foreground pt-4">
            <p>ArchePal v1.0.0</p>
            <p className="mt-1">© 2025 All rights reserved</p>
          </div>
        </div>

        <BottomNav />
      </div>
    </div>
  );
};

export default Account;
