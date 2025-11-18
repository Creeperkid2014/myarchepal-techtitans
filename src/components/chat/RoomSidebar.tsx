import { useState } from "react";
import { ChatGroup, ChatRoom, RoomType } from "@/services/chat";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Hash,
  Lock,
  Users,
  ChevronDown,
  ChevronRight,
  Search,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";

interface RoomSidebarProps {
  groups: ChatGroup[];
  rooms: ChatRoom[];
  currentGroup: ChatGroup | null;
  currentRoom: ChatRoom | null;
  onGroupSelect: (group: ChatGroup) => void;
  onRoomSelect: (room: ChatRoom) => void;
  onCreateGroup?: () => void;
  onCreateRoom?: () => void;
}

export function RoomSidebar({
  groups,
  rooms,
  currentGroup,
  currentRoom,
  onGroupSelect,
  onRoomSelect,
  onCreateGroup,
  onCreateRoom,
}: RoomSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const toggleGroup = (groupId: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  const getRoomIcon = (room: ChatRoom) => {
    if (room.isPrivate) return <Lock className="h-4 w-4" />;
    if (room.type === RoomType.SUB_TEAM) return <Users className="h-4 w-4" />;
    return <Hash className="h-4 w-4" />;
  };

  const filterRooms = (roomsList: ChatRoom[]) => {
    if (!searchQuery) return roomsList;
    return roomsList.filter((room) =>
      room.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const getRoomsForGroup = (groupId: string) => {
    return filterRooms(rooms.filter((room) => room.groupId === groupId));
  };

  const getStandaloneRooms = () => {
    return filterRooms(rooms.filter((room) => !room.groupId));
  };

  return (
    <div className="w-64 border-r bg-muted/30 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <h2 className="font-semibold text-lg mb-3">Chat Rooms</h2>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search rooms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* Rooms List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {/* Groups */}
          {groups.map((group) => {
            const groupRooms = getRoomsForGroup(group.id!);
            const isExpanded = expandedGroups.has(group.id!);
            const isActive = currentGroup?.id === group.id;

            return (
              <Collapsible
                key={group.id}
                open={isExpanded}
                onOpenChange={() => toggleGroup(group.id!)}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-1">
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                    </CollapsibleTrigger>
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      className="flex-1 justify-start h-8 px-2"
                      onClick={() => onGroupSelect(group)}
                    >
                      <Users className="h-4 w-4 mr-2" />
                      <span className="truncate">{group.name}</span>
                      <Badge variant="outline" className="ml-auto text-xs">
                        {group.memberCount}
                      </Badge>
                    </Button>
                  </div>

                  <CollapsibleContent>
                    <div className="ml-4 space-y-1">
                      {groupRooms.map((room) => (
                        <Button
                          key={room.id}
                          variant={
                            currentRoom?.id === room.id ? "secondary" : "ghost"
                          }
                          className="w-full justify-start h-8 px-2"
                          onClick={() => onRoomSelect(room)}
                        >
                          {getRoomIcon(room)}
                          <span className="ml-2 truncate">{room.name}</span>
                          {room.type === RoomType.SUB_TEAM && (
                            <Badge
                              variant="outline"
                              className="ml-auto text-xs"
                            >
                              Sub
                            </Badge>
                          )}
                        </Button>
                      ))}
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            );
          })}

          {/* Standalone Rooms */}
          {getStandaloneRooms().length > 0 && (
            <div className="space-y-1 mt-4">
              <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase">
                Direct Rooms
              </div>
              {getStandaloneRooms().map((room) => (
                <Button
                  key={room.id}
                  variant={currentRoom?.id === room.id ? "secondary" : "ghost"}
                  className="w-full justify-start h-8 px-2"
                  onClick={() => onRoomSelect(room)}
                >
                  {getRoomIcon(room)}
                  <span className="ml-2 truncate">{room.name}</span>
                </Button>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Actions */}
      <div className="p-2 border-t space-y-1">
        {onCreateGroup && (
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={onCreateGroup}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Group
          </Button>
        )}
        {onCreateRoom && (
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={onCreateRoom}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Room
          </Button>
        )}
      </div>
    </div>
  );
}