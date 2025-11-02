import { Home, Compass, Plus, FileText, UserCircle } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

const navItems = [
  { icon: Home, label: "Home", path: "/" },
  { icon: Compass, label: "Explore", path: "/explore" },
  { icon: Plus, label: "Add", path: "/new-find", isPrimary: true },
  { icon: FileText, label: "Reports", path: "/reports" },
  { icon: UserCircle, label: "Account", path: "/account" },
];

export const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border px-4 py-3 shadow-lg">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => (
          <button
            key={item.label}
            onClick={() => navigate(item.path)}
            className={`flex flex-col items-center gap-1 transition-colors ${
              item.isPrimary
                ? "bg-primary text-primary-foreground p-3 rounded-full -mt-6 shadow-lg hover:bg-primary/90"
                : location.pathname === item.path
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <item.icon className={item.isPrimary ? "w-6 h-6" : "w-5 h-5"} />
            {!item.isPrimary && (
              <span className="text-xs font-medium">{item.label}</span>
            )}
          </button>
        ))}
      </div>
    </nav>
  );
};
