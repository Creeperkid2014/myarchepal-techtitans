import { Home, Compass, Plus, UserCircle, Heart, Newspaper, Package, FileText, BookOpen, PlusSquare } from "lucide-react";
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

const primaryNavItems = [
  { icon: Home, label: "Home", path: "/" },
  { icon: Compass, label: "Sites", path: "/explore" },
  { icon: Package, label: "Artifacts", path: "/artifacts" },
  { icon: Newspaper, label: "Articles", path: "/articles" },
  { icon: Heart, label: "Donate", path: "/donations" },
  { icon: UserCircle, label: "Account", path: "/account" },
];

const createContentOptions = [
  { icon: Newspaper, label: "Create Article", description: "Write a new article for the Articles page", path: "/create-article" },
  { icon: BookOpen, label: "Create Blog", description: "Write a new blog post for the Blogs page", path: "/create-blog" },
  { icon: PlusSquare, label: "New Find", description: "Document a new archaeological find", path: "/new-find" },
];

export const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false);

  const handleCreateClick = () => {
    setIsCreateSheetOpen(true);
  };

  const handleContentOptionClick = (path: string) => {
    setIsCreateSheetOpen(false);
    navigate(path);
  };

  const leftItems = primaryNavItems.slice(0, 3);
  const rightItems = primaryNavItems.slice(3);

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

          <button
            onClick={handleCreateClick}
            className="bg-primary text-primary-foreground p-3 rounded-full -mt-6 shadow-lg hover:bg-primary/90 transition-all duration-300"
          >
            <Plus className="w-6 h-6" />
          </button>

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
                className="w-full h-auto py-4 flex items-start gap-3 hover:bg-muted"
                onClick={() => handleContentOptionClick(option.path)}
              >
                <option.icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <div className="text-left flex-1">
                  <div className="font-medium">{option.label}</div>
                  <div className="text-xs text-muted-foreground font-normal mt-1">
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
