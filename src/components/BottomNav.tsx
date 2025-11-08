import { Home, Compass, Plus, Heart, Newspaper, Package, PlusSquare, Calendar } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useArchaeologist } from "@/hooks/use-archaeologist";

// Navigation items available to all users
const navItems = [
  { icon: Home, label: "Home", path: "/" },
  { icon: Compass, label: "Sites", path: "/site-lists" },
  { icon: Package, label: "Artifacts", path: "/artifacts" },
  { icon: Newspaper, label: "Articles", path: "/articles" },
  { icon: Calendar, label: "Events", path: "/events" },
  { icon: Heart, label: "Donate", path: "/donations" }
];

const createContentOptions = [
  { icon: Newspaper, label: "Create Article", description: "Write a new article for the Articles page", path: "/create-article" },
  { icon: Package, label: "Create Artifact", description: "Add a new artifact to the catalog", path: "/create-artifact" },
  { icon: PlusSquare, label: "Create Site", description: "Add a new archaeological site", path: "/new-site" },
  { icon: Calendar, label: "Create Event", description: "Add a new event to the calendar", path: "/create-event" },
];

export const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const { isArchaeologist } = useArchaeologist();
  const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false);

  const handleCreateClick = () => {
    setIsCreateSheetOpen(true);
  };

  const handleContentOptionClick = (path: string) => {
    setIsCreateSheetOpen(false);
    navigate(path);
  };

  const leftItems = navItems.slice(0, 3);
  const rightItems = navItems.slice(3);

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border px-4 py-3 shadow-lg transition-all duration-300 z-50">
        <div className="flex items-center justify-around max-w-md mx-auto transition-all duration-300">
          {leftItems.map((item) => (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-1 transition-all duration-300 ${
                location.pathname === item.path
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          ))}

          {/* Show create button only for archaeologists */}
          {isAuthenticated && isArchaeologist ? (
            <button
              onClick={handleCreateClick}
              className="bg-primary text-primary-foreground p-3 rounded-full -mt-6 shadow-lg hover:bg-primary/90 transition-all duration-300"
            >
              <Plus className="w-6 h-6" />
            </button>
          ) : (
            <div className="p-3 rounded-full -mt-6 bg-muted">
              <div className="w-6 h-6" />
            </div>
          )}

          {rightItems.map((item) => (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-1 transition-all duration-300 ${
                location.pathname === item.path
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      <Sheet open={isCreateSheetOpen} onOpenChange={setIsCreateSheetOpen}>
        <SheetContent side="bottom" className="max-w-md mx-auto">
          <SheetHeader>
            <SheetTitle>Create Content</SheetTitle>
            <SheetDescription>
              Choose what you'd like to create
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-3">
            {createContentOptions.map((option) => (
              <Button
                key={option.label}
                variant="outline"
                className="w-full h-auto py-4 flex items-start gap-3 hover:bg-accent hover:text-accent-foreground"
                onClick={() => handleContentOptionClick(option.path)}
              >
                <option.icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <div className="text-left flex-1">
                  <div className="font-medium">{option.label}</div>
                  <div className="text-xs opacity-70 font-normal mt-1">
                    {option.description}
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};
