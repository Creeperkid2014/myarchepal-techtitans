import { Message } from "@/services/chat";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MoreVertical, Edit2, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";

interface MessageItemProps {
  message: Message;
  onEdit?: (messageId: string) => void;
  onDelete?: (messageId: string) => void;
  canDelete?: boolean;
}

export function MessageItem({
  message,
  onEdit,
  onDelete,
  canDelete = false,
}: MessageItemProps) {
  const { user } = useAuth();
  const isOwnMessage = user?.uid === message.userId;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return format(date, "MMM d, yyyy 'at' h:mm a");
  };

  return (
    <div
      className={`flex gap-3 p-3 hover:bg-accent/50 rounded-lg group ${
        isOwnMessage ? "flex-row-reverse" : ""
      }`}
    >
      <Avatar className="h-10 w-10 flex-shrink-0">
        <AvatarImage src={message.userAvatar} />
        <AvatarFallback>{getInitials(message.userName)}</AvatarFallback>
      </Avatar>

      <div className={`flex-1 min-w-0 ${isOwnMessage ? "text-right" : ""}`}>
        <div className="flex items-baseline gap-2 mb-1">
          <span className="font-semibold text-sm">{message.userName}</span>
          <span className="text-xs text-muted-foreground">
            {formatTimestamp(message.timestamp)}
          </span>
          {message.edited && (
            <span className="text-xs text-muted-foreground italic">(edited)</span>
          )}
        </div>

        <div
          className={`inline-block px-3 py-2 rounded-lg ${
            isOwnMessage
              ? "bg-primary text-primary-foreground"
              : "bg-muted"
          }`}
        >
          <p className="text-sm whitespace-pre-wrap break-words">
            {message.content}
          </p>
        </div>

        {/* Reactions */}
        {message.reactions && Object.keys(message.reactions).length > 0 && (
          <div className="flex gap-1 mt-1 flex-wrap">
            {Object.entries(message.reactions).map(([emoji, userIds]) => (
              <span
                key={emoji}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-accent rounded-full text-xs"
              >
                {emoji} {userIds.length}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Message actions */}
      {(isOwnMessage || canDelete) && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {isOwnMessage && onEdit && (
              <DropdownMenuItem onClick={() => onEdit(message.id!)}>
                <Edit2 className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
            )}
            {(isOwnMessage || canDelete) && onDelete && (
              <DropdownMenuItem
                onClick={() => onDelete(message.id!)}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}