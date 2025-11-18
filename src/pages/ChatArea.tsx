import { useState } from "react";
import { useChat } from "@/hooks/use-chat";
import { useAuth } from "@/hooks/use-auth";
import { PageHeader } from "@/components/PageHeader";
import { RoomSidebar } from "@/components/chat/RoomSidebar";
import { MessageList } from "@/components/chat/MessageList";
import { MessageInput } from "@/components/chat/MessageInput";
import { MemberManagement } from "@/components/chat/MemberManagement";
import { CreateGroupDialog } from "@/components/chat/CreateGroupDialog";
import { CreateRoomDialog } from "@/components/chat/CreateRoomDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Settings,
  Users,
  Hash,
  Lock,
  MoreVertical,
  Trash2,
  UserPlus,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { UserRole, RoomType } from "@/services/chat";

export default function ChatArea() {
  const { user } = useAuth();
  const {
    groups,
    rooms,
    currentGroup,
    currentRoom,
    messages,
    currentRoomMembers,
    currentUserMembership,
    setCurrentGroup,
    setCurrentRoom,
    createGroup,
    createRoom,
    deleteRoom,
    sendMessage,
    editMessage,
    deleteMessage,
    updateMemberRole,
    removeMember,
    loading,
  } = useChat();

  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [createRoomOpen, setCreateRoomOpen] = useState(false);

  // Check permissions
  const canManageMembers =
    currentUserMembership?.permissions.canManageMembers || false;
  const canDeleteMessages =
    currentUserMembership?.permissions.canDeleteMessages || false;
  const canDeleteRoom = currentUserMembership?.permissions.canDeleteRoom || false;
  const canEditRoom = currentUserMembership?.permissions.canEditRoom || false;

  const getRoomIcon = () => {
    if (!currentRoom) return <Hash className="h-5 w-5" />;
    if (currentRoom.isPrivate) return <Lock className="h-5 w-5" />;
    if (currentRoom.type === RoomType.SUB_TEAM)
      return <Users className="h-5 w-5" />;
    return <Hash className="h-5 w-5" />;
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return "default";
      case UserRole.SUB_ADMIN:
        return "secondary";
      default:
        return "outline";
    }
  };

  const handleDeleteRoom = async () => {
    if (!currentRoom?.id) return;
    if (!confirm("Are you sure you want to delete this room? This action cannot be undone.")) {
      return;
    }
    await deleteRoom(currentRoom.id);
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader />

      <div className="h-[calc(100vh-64px)] flex">
        {/* Sidebar */}
        <RoomSidebar
          groups={groups}
          rooms={rooms}
          currentGroup={currentGroup}
          currentRoom={currentRoom}
          onGroupSelect={setCurrentGroup}
          onRoomSelect={setCurrentRoom}
          onCreateGroup={() => setCreateGroupOpen(true)}
          onCreateRoom={() => setCreateRoomOpen(true)}
        />

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {currentRoom ? (
            <>
              {/* Room Header */}
              <div className="border-b bg-background px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getRoomIcon()}
                    <div>
                      <h2 className="text-xl font-semibold">{currentRoom.name}</h2>
                      {currentRoom.description && (
                        <p className="text-sm text-muted-foreground">
                          {currentRoom.description}
                        </p>
                      )}
                    </div>
                    {currentRoom.type === RoomType.SUB_TEAM && (
                      <Badge variant="outline">Sub-Team</Badge>
                    )}
                    {currentUserMembership && (
                      <Badge variant={getRoleBadgeColor(currentUserMembership.role)}>
                        {currentUserMembership.role}
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <MemberManagement
                      members={currentRoomMembers}
                      currentUserRole={currentUserMembership?.role}
                      onUpdateRole={canManageMembers ? updateMemberRole : undefined}
                      onRemoveMember={canManageMembers ? removeMember : undefined}
                    />

                    {(canEditRoom || canDeleteRoom) && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {canEditRoom && (
                            <>
                              <DropdownMenuItem>
                                <Settings className="mr-2 h-4 w-4" />
                                Room Settings
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <UserPlus className="mr-2 h-4 w-4" />
                                Invite Members
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                            </>
                          )}
                          {canDeleteRoom && (
                            <DropdownMenuItem
                              onClick={handleDeleteRoom}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Room
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-hidden">
                <MessageList
                  messages={messages}
                  loading={loading}
                  canDeleteMessages={canDeleteMessages}
                  onEditMessage={(messageId) => {
                    const message = messages.find((m) => m.id === messageId);
                    if (message) {
                      const newContent = prompt("Edit message:", message.content);
                      if (newContent) {
                        editMessage(messageId, newContent);
                      }
                    }
                  }}
                  onDeleteMessage={deleteMessage}
                />
              </div>

              {/* Message Input */}
              {currentUserMembership?.permissions.canSendMessages && (
                <MessageInput
                  onSend={sendMessage}
                  placeholder={`Message #${currentRoom.name}`}
                />
              )}
            </>
          ) : (
            // No room selected
            <div className="flex-1 flex items-center justify-center p-8">
              <Card className="max-w-md w-full">
                <CardHeader>
                  <CardTitle className="text-center">Welcome to Chat</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-center text-muted-foreground">
                    Select a room from the sidebar to start chatting, or create a new
                    group or room to get started.
                  </p>

                  <div className="space-y-2">
                    <Button
                      className="w-full"
                      onClick={() => setCreateGroupOpen(true)}
                    >
                      Create New Group
                    </Button>
                    <Button
                      className="w-full"
                      variant="outline"
                      onClick={() => setCreateRoomOpen(true)}
                    >
                      Create New Room
                    </Button>
                  </div>

                  {groups.length > 0 && (
                    <div className="pt-4 border-t">
                      <p className="text-sm font-semibold mb-2">Your Groups</p>
                      <div className="space-y-1">
                        {groups.map((group) => (
                          <Button
                            key={group.id}
                            variant="ghost"
                            className="w-full justify-start"
                            onClick={() => setCurrentGroup(group)}
                          >
                            <Users className="mr-2 h-4 w-4" />
                            {group.name}
                            <Badge variant="outline" className="ml-auto">
                              {group.memberCount}
                            </Badge>
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {rooms.length > 0 && (
                    <div className="pt-4 border-t">
                      <p className="text-sm font-semibold mb-2">Your Rooms</p>
                      <div className="space-y-1">
                        {rooms.slice(0, 5).map((room) => (
                          <Button
                            key={room.id}
                            variant="ghost"
                            className="w-full justify-start"
                            onClick={() => setCurrentRoom(room)}
                          >
                            {room.isPrivate ? (
                              <Lock className="mr-2 h-4 w-4" />
                            ) : (
                              <Hash className="mr-2 h-4 w-4" />
                            )}
                            {room.name}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <CreateGroupDialog
        open={createGroupOpen}
        onOpenChange={setCreateGroupOpen}
        onCreateGroup={createGroup}
      />
      <CreateRoomDialog
        open={createRoomOpen}
        onOpenChange={setCreateRoomOpen}
        onCreateRoom={createRoom}
        groups={groups}
        currentGroupId={currentGroup?.id}
      />
    </div>
  );
}