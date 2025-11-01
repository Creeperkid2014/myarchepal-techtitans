import { User, Mail, Phone, MapPin, Settings, Bell, Shield, HelpCircle, LogOut } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const Account = () => {
  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-md mx-auto">
        <header className="bg-card p-4 border-b border-border">
          <h1 className="text-xl font-semibold text-foreground">Account</h1>
        </header>

        <div className="p-4 space-y-4">
          <Card className="p-6 border-border">
            <div className="flex items-center gap-4 mb-4">
              <Avatar className="w-20 h-20">
                <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=DrSmith" />
                <AvatarFallback>DS</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-foreground">Dr. Smith</h2>
                <p className="text-sm text-muted-foreground mb-2">Lead Archaeologist</p>
                <Button size="sm" variant="outline">Edit Profile</Button>
              </div>
            </div>

            <Separator className="my-4" />

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span className="text-foreground">dr.smith@archepal.com</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span className="text-foreground">+1 234 567 8900</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span className="text-foreground">Pompeii Archaeological Site</span>
              </div>
            </div>
          </Card>

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
            <button className="w-full p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors text-destructive">
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
