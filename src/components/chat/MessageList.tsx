import { useEffect, useRef } from "react";
import { Message } from "@/services/chat";
import { MessageItem } from "./MessageItem";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";

interface MessageListProps {
  messages: Message[];
  loading?: boolean;
  canDeleteMessages?: boolean;
  onEditMessage?: (messageId: string) => void;
  onDeleteMessage?: (messageId: string) => void;
}

export function MessageList({
  messages,
  loading = false,
  canDeleteMessages = false,
  onEditMessage,
  onDeleteMessage,
}: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full px-4" ref={scrollRef}>
      <div className="space-y-1 py-4">
        {messages.map((message) => (
          <MessageItem
            key={message.id}
            message={message}
            onEdit={onEditMessage}
            onDelete={onDeleteMessage}
            canDelete={canDeleteMessages}
          />
        ))}
      </div>
    </ScrollArea>
  );
}