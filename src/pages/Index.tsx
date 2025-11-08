import { useState, useEffect } from "react";
import { AppHeader } from "@/components/AppHeader";
import { QuickActions } from "@/components/QuickActions";
import { ActiveProject } from "@/components/ActiveProject";
import { RecentFinds } from "@/components/RecentFinds";
import { SiteConditions } from "@/components/SiteConditions";
import { BottomNav } from "@/components/BottomNav";
import { useAuth } from "@/hooks/use-auth";

// Default coordinates for Raleigh, North Carolina
const DEFAULT_LOCATION = {
  latitude: 35.7796,
  longitude: -78.6382
};

const Index = () => {
  const { isAuthenticated } = useAuth();
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(true);

  // Get user's location on component mount
  useEffect(() => {
    const getUserLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setUserLocation({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            });
            setLocationLoading(false);
            console.log('✅ User location obtained:', position.coords.latitude, position.coords.longitude);
          },
          (error) => {
            console.warn('⚠️ Location permission denied or unavailable:', error.message);
            console.log('🏛️ Using default location: Raleigh, NC');
            setUserLocation(DEFAULT_LOCATION);
            setLocationLoading(false);
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
        setUserLocation(DEFAULT_LOCATION);
        setLocationLoading(false);
      }
    };

    getUserLocation();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto bg-background min-h-screen">
        <AppHeader />
        <QuickActions />

        {/* Show Site Conditions for non-authenticated users */}
        {!isAuthenticated && !locationLoading && userLocation && (
          <SiteConditions
            latitude={userLocation.latitude}
            longitude={userLocation.longitude}
          />
        )}

        <ActiveProject />
        <RecentFinds />
        <BottomNav />
      </div>
    </div>
  );
};

export default Index;
