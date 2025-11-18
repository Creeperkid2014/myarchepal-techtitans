import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChatGroup, RoomType } from "@/services/chat";

interface CreateRoomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateRoom: (
    name: string,
    type: RoomType,
    groupId?: string,
    parentRoomId?: string,
    description?: string,
    isPrivate?: boolean
  ) => Promise<void>;
  groups: ChatGroup[];
  currentGroupId?: string;
}

export function CreateRoomDialog({
  open,
  onOpenChange,
  onCreateRoom,
  groups,
  currentGroupId,
}: CreateRoomDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<RoomType>(RoomType.ROOM);
  const [groupId, setGroupId] = useState(currentGroupId || "");
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      await onCreateRoom(
        name.trim(),
        type,
        groupId || undefined,
        undefined,
        description.trim() || undefined,
        isPrivate
      );
      setName("");
      setDescription("");
      setType(RoomType.ROOM);
      setGroupId(currentGroupId || "");
      setIsPrivate(false);
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to create room:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Room</DialogTitle>
            <DialogDescription>
              Create a new chat room or sub-team
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="room-name">Room Name</Label>
              <Input
                id="room-name"
                placeholder="e.g., General Discussion"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="room-type">Room Type</Label>
              <Select value={type} onValueChange={(value) => setType(value as RoomType)}>
                <SelectTrigger id="room-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={RoomType.ROOM}>Regular Room</SelectItem>
                  <SelectItem value={RoomType.SUB_TEAM}>Sub-Team</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {groups.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="room-group">Group (Optional)</Label>
                <Select value={groupId} onValueChange={setGroupId}>
                  <SelectTrigger id="room-group">
                    <SelectValue placeholder="No group (standalone room)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No group</SelectItem>
                    {groups.map((group) => (
                      <SelectItem key={group.id} value={group.id!}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="room-description">Description (Optional)</Label>
              <Textarea
                id="room-description"
                placeholder="Describe the purpose of this room..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="room-private">Private Room</Label>
              <Switch
                id="room-private"
                checked={isPrivate}
                onCheckedChange={setIsPrivate}
              />
            </div>
            {isPrivate && (
              <p className="text-sm text-muted-foreground">
                Members must be invited to join this room
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || loading}>
              {loading ? "Creating..." : "Create Room"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}