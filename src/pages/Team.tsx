import { useNavigate } from "react-router-dom";
import { ArrowLeft, UserPlus, Mail, Phone, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const teamMembers = [
  {
    id: 1,
    name: "Dr. Sarah Johnson",
    role: "Lead Archaeologist",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sarah",
    initials: "SJ",
    status: "online",
    email: "sarah.j@archepal.com",
    phone: "+1 234 567 8901"
  },
  {
    id: 2,
    name: "Prof. Michael Chen",
    role: "Senior Researcher",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=michael",
    initials: "MC",
    status: "online",
    email: "m.chen@archepal.com",
    phone: "+1 234 567 8902"
  },
  {
    id: 3,
    name: "Emma Rodriguez",
    role: "Field Technician",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=emma",
    initials: "ER",
    status: "away",
    email: "emma.r@archepal.com",
    phone: "+1 234 567 8903"
  },
  {
    id: 4,
    name: "James Wilson",
    role: "Documentation Specialist",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=james",
    initials: "JW",
    status: "offline",
    email: "j.wilson@archepal.com",
    phone: "+1 234 567 8904"
  },
];

const Team = () => {
  const navigate = useNavigate();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online": return "bg-success";
      case "away": return "bg-warning";
      case "offline": return "bg-muted-foreground";
      default: return "bg-muted-foreground";
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-md mx-auto">
        <header className="bg-card p-4 border-b border-border sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/")}
                className="hover:bg-muted"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-xl font-semibold text-foreground">Team</h1>
            </div>
            <Button size="sm" className="gap-2">
              <UserPlus className="w-4 h-4" />
              Invite
            </Button>
          </div>
        </header>

        <div className="p-4 space-y-4">
          <Card className="p-4 border-border bg-primary/5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-foreground">Roman Villa Team</h2>
                <p className="text-sm text-muted-foreground">{teamMembers.length} members</p>
              </div>
              <div className="flex -space-x-2">
                {teamMembers.slice(0, 3).map((member) => (
                  <Avatar key={member.id} className="w-8 h-8 border-2 border-card">
                    <AvatarImage src={member.avatar} />
                    <AvatarFallback>{member.initials}</AvatarFallback>
                  </Avatar>
                ))}
                {teamMembers.length > 3 && (
                  <div className="w-8 h-8 rounded-full bg-muted border-2 border-card flex items-center justify-center">
                    <span className="text-xs font-medium text-foreground">+{teamMembers.length - 3}</span>
                  </div>
                )}
              </div>
            </div>
          </Card>

          <div className="space-y-3">
            <h3 className="font-semibold text-foreground">Team Members</h3>
            {teamMembers.map((member) => (
              <Card key={member.id} className="p-4 border-border hover:shadow-md transition-all">
                <div className="flex items-start gap-3 mb-3">
                  <div className="relative">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={member.avatar} />
                      <AvatarFallback>{member.initials}</AvatarFallback>
                    </Avatar>
                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 ${getStatusColor(member.status)} rounded-full border-2 border-card`} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground">{member.name}</h4>
                    <p className="text-sm text-muted-foreground">{member.role}</p>
                    <Badge variant="outline" className="mt-1 text-xs capitalize">
                      {member.status}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2 mb-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="w-4 h-4" />
                    <span className="text-xs">{member.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="w-4 h-4" />
                    <span className="text-xs">{member.phone}</span>
                  </div>
                </div>

                <Button variant="outline" size="sm" className="w-full">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Message
                </Button>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Team;
