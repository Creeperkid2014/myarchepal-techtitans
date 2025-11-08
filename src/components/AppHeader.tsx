/**
 * App Header Component
 *
 * Displays the main header with:
 * - App title
 * - User authentication status
 * - Sign in/Sign up buttons when not authenticated
 * - User avatar and greeting when authenticated
 */

import { useState, useEffect } from "react";
import { Bell, User, LogIn, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { ArchaeologistService, Archaeologist } from "@/services/archaeologists";

export const AppHeader = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [archaeologistProfile, setArchaeologistProfile] = useState<Archaeologist | null>(null);

  // Fetch archaeologist profile when user is available
  useEffect(() => {
    const fetchProfile = async () => {
      if (user?.uid) {
        try {
          const profile = await ArchaeologistService.getArchaeologistProfile(user.uid);
          setArchaeologistProfile(profile);
        } catch (error) {
          console.error('Error fetching archaeologist profile:', error);
        }
      } else {
        setArchaeologistProfile(null);
      }
    };

    fetchProfile();
  }, [user?.uid]);

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  // Get display name from archaeologist profile or Firebase user
  const displayName = archaeologistProfile?.displayName || user?.displayName || user?.email?.split('@')[0] || "Guest";

  // Generate initials from display name for avatar fallback
  const initials = user ? displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) : "G";

  return (
    <header className="bg-card p-4 pb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <img
            src="/archepal.png"
            alt="ArchePal Logo"
            className="w-8 h-8 object-contain"
          />
          <h1 className="text-xl font-semibold text-foreground">ArchePal</h1>
        </div>
        <div className="flex items-center gap-3">
          {isAuthenticated && (
            <button
              className="p-2 hover:bg-muted rounded-full transition-colors"
              onClick={() => navigate("/account")}
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5 text-muted-foreground" />
            </button>
          )}
          {isAuthenticated ? (
            <button
              className="p-2 hover:bg-muted rounded-full transition-colors"
              onClick={() => navigate("/account")}
              aria-label="Account"
            >
              <User className="w-5 h-5 text-muted-foreground" />
            </button>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/contact")}
                className="gap-2"
              >
                <Mail className="w-4 h-4" />
                Contact
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/authentication/sign-in")}
                className="gap-2"
              >
                <LogIn className="w-4 h-4" />
                Sign In
              </Button>
            </>
          )}
        </div>
      </div>
      
      {isAuthenticated && user ? (
        <div className="flex items-center gap-3">
          <Avatar className="w-12 h-12 bg-muted">
            {(archaeologistProfile?.photoURL || user.photoURL) ? (
              <AvatarImage src={archaeologistProfile?.photoURL || user.photoURL || undefined} />
            ) : (
              <AvatarFallback className="bg-muted border border-border"></AvatarFallback>
            )}
          </Avatar>
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              {getGreeting()}, {displayName}
            </h2>
            <p className="text-sm text-muted-foreground">Ready for new discoveries?</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              {getGreeting()}, Welcome to ArchePal
            </h2>
            <p className="text-sm text-muted-foreground">
              Sign in to access your projects and discoveries
            </p>
          </div>
          
        </div>
      )}
    </header>
  );
};
