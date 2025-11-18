import { useState } from "react";
import { RoomMembership, UserRole } from "@/services/chat";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Users, MoreVertical, Shield, ShieldCheck, User, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface MemberManagementProps {
  members: RoomMembership[];
  currentUserRole?: UserRole;
  onUpdateRole?: (userId: string, role: UserRole) => Promise<void>;
  onRemoveMember?: (userId: string) => Promise<void>;
  trigger?: React.ReactNode;
}

export function MemberManagement({
  members,
  currentUserRole,
  onUpdateRole,
  onRemoveMember,
  trigger,
}: MemberManagementProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  const canManageMembers =
    currentUserRole === UserRole.ADMIN || currentUserRole === UserRole.SUB_ADMIN;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return (
          <Badge variant="default" className="gap-1">
            <Shield className="h-3 w-3" />
            Admin
          </Badge>
        );
      case UserRole.SUB_ADMIN:
        return (
          <Badge variant="secondary" className="gap-1">
            <ShieldCheck className="h-3 w-3" />
            Sub-Admin
          </Badge>
        );
      case UserRole.MEMBER:
        return (
          <Badge variant="outline" className="gap-1">
            <User className="h-3 w-3" />
            Member
          </Badge>
        );
    }
  };

  const canChangeRole = (member: RoomMembership) => {
    if (!canManageMembers) return false;
    if (member.userId === user?.uid) return false; // Can't change own role
    if (currentUserRole === UserRole.SUB_ADMIN && member.role === UserRole.ADMIN) {
      return false; // Sub-admins can't change admin roles
    }
    return true;
  };

  const canRemove = (member: RoomMembership) => {
    if (!canManageMembers) return false;
    if (member.userId === user?.uid) return false; // Can't remove self
    if (currentUserRole === UserRole.SUB_ADMIN && member.role === UserRole.ADMIN) {
      return false; // Sub-admins can't remove admins
    }
    return true;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Users className="h-4 w-4 mr-2" />
            Members ({members.length})
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Room Members</DialogTitle>
          <DialogDescription>
            Manage members and their roles in this room
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[400px] pr-4">
          <div className="space-y-3">
            {members.map((member) => (
              <div
                key={member.userId}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent"
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={member.userAvatar} />
                  <AvatarFallback>{getInitials(member.userName)}</AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    {member.userName}
                    {member.userId === user?.uid && (
                      <span className="text-muted-foreground ml-1">(You)</span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {member.userEmail}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {getRoleBadge(member.role)}

                  {(canChangeRole(member) || canRemove(member)) && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {canChangeRole(member) && onUpdateRole && (
                          <>
                            <DropdownMenuItem
                              onClick={() => onUpdateRole(member.userId, UserRole.ADMIN)}
                              disabled={member.role === UserRole.ADMIN}
                            >
                              <Shield className="mr-2 h-4 w-4" />
                              Make Admin
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                onUpdateRole(member.userId, UserRole.SUB_ADMIN)
                              }
                              disabled={member.role === UserRole.SUB_ADMIN}
                            >
                              <ShieldCheck className="mr-2 h-4 w-4" />
                              Make Sub-Admin
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => onUpdateRole(member.userId, UserRole.MEMBER)}
                              disabled={member.role === UserRole.MEMBER}
                            >
                              <User className="mr-2 h-4 w-4" />
                              Make Member
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                          </>
                        )}
                        {canRemove(member) && onRemoveMember && (
                          <DropdownMenuItem
                            onClick={() => onRemoveMember(member.userId)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Remove Member
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}