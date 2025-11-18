import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import {
  ChatGroup,
  ChatRoom,
  Message,
  RoomMembership,
  ChatService,
  UserRole,
  RoomType,
} from "@/services/chat";
import { useAuth } from "./use-auth";
import { useToast } from "./use-toast";

// ============================================================================
// CONTEXT TYPE
// ============================================================================

interface ChatContextType {
  // Groups
  groups: ChatGroup[];
  currentGroup: ChatGroup | null;
  setCurrentGroup: (group: ChatGroup | null) => void;
  createGroup: (name: string, description?: string) => Promise<string>;
  deleteGroup: (groupId: string) => Promise<void>;

  // Rooms
  rooms: ChatRoom[];
  currentRoom: ChatRoom | null;
  setCurrentRoom: (room: ChatRoom | null) => void;
  createRoom: (
    name: string,
    type: RoomType,
    groupId?: string,
    parentRoomId?: string,
    description?: string,
    isPrivate?: boolean
  ) => Promise<string>;
  deleteRoom: (roomId: string) => Promise<void>;

  // Messages
  messages: Message[];
  sendMessage: (content: string) => Promise<void>;
  editMessage: (messageId: string, content: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;

  // Members
  currentRoomMembers: RoomMembership[];
  addMember: (userId: string, email: string, name: string, role?: UserRole) => Promise<void>;
  removeMember: (userId: string) => Promise<void>;
  updateMemberRole: (userId: string, role: UserRole) => Promise<void>;

  // State
  loading: boolean;
  error: string | null;

  // Current user's membership
  currentUserMembership: RoomMembership | null;
}

// ============================================================================
// CONTEXT
// ============================================================================

const ChatContext = createContext<ChatContextType | undefined>(undefined);

// ============================================================================
// PROVIDER
// ============================================================================

export function ChatProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { toast } = useToast();

  // State
  const [groups, setGroups] = useState<ChatGroup[]>([]);
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentGroup, setCurrentGroup] = useState<ChatGroup | null>(null);
  const [currentRoom, setCurrentRoom] = useState<ChatRoom | null>(null);
  const [currentRoomMembers, setCurrentRoomMembers] = useState<RoomMembership[]>([]);
  const [currentUserMembership, setCurrentUserMembership] = useState<RoomMembership | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ==========================================================================
  // LOAD USER'S GROUPS AND ROOMS
  // ==========================================================================

  useEffect(() => {
    if (!user) {
      setGroups([]);
      setRooms([]);
      setMessages([]);
      setCurrentGroup(null);
      setCurrentRoom(null);
      return;
    }

    setLoading(true);

    // Listen to user's groups
    const unsubscribeGroups = ChatService.onUserGroupsListener(user.uid, (updatedGroups) => {
      setGroups(updatedGroups);
      setLoading(false);
    });

    // Listen to user's rooms
    const unsubscribeRooms = ChatService.onUserRoomsListener(user.uid, (updatedRooms) => {
      setRooms(updatedRooms);
      setLoading(false);
    });

    return () => {
      unsubscribeGroups();
      unsubscribeRooms();
    };
  }, [user]);

  // ==========================================================================
  // LOAD CURRENT ROOM'S MESSAGES AND MEMBERS
  // ==========================================================================

  useEffect(() => {
    if (!currentRoom?.id || !user) {
      setMessages([]);
      setCurrentRoomMembers([]);
      setCurrentUserMembership(null);
      return;
    }

    // Listen to messages
    const unsubscribeMessages = ChatService.onMessagesListener(
      currentRoom.id,
      (updatedMessages) => {
        setMessages(updatedMessages);
      }
    );

    // Listen to members
    const unsubscribeMembers = ChatService.onRoomMembersListener(
      currentRoom.id,
      (updatedMembers) => {
        setCurrentRoomMembers(updatedMembers);

        // Find current user's membership
        const userMembership = updatedMembers.find((m) => m.userId === user.uid);
        setCurrentUserMembership(userMembership || null);
      }
    );

    return () => {
      unsubscribeMessages();
      unsubscribeMembers();
    };
  }, [currentRoom, user]);

  // ==========================================================================
  // GROUP OPERATIONS
  // ==========================================================================

  const createGroup = async (name: string, description?: string): Promise<string> => {
    if (!user) {
      throw new Error("User must be authenticated");
    }

    try {
      setLoading(true);
      setError(null);

      const groupId = await ChatService.createGroup(
        {
          name,
          description,
          createdBy: user.uid,
          isArchived: false,
        },
        {
          email: user.email || "",
          name: user.displayName || user.email || "Anonymous",
          avatar: user.photoURL || "",
        }
      );

      toast({
        title: "Group created",
        description: `${name} has been created successfully.`,
      });

      return groupId;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create group";
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteGroup = async (groupId: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      await ChatService.deleteGroup(groupId);

      if (currentGroup?.id === groupId) {
        setCurrentGroup(null);
      }

      toast({
        title: "Group deleted",
        description: "The group has been deleted successfully.",
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete group";
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================================
  // ROOM OPERATIONS
  // ==========================================================================

  const createRoom = async (
    name: string,
    type: RoomType,
    groupId?: string,
    parentRoomId?: string,
    description?: string,
    isPrivate = false
  ): Promise<string> => {
    if (!user) {
      throw new Error("User must be authenticated");
    }

    try {
      setLoading(true);
      setError(null);

      const roomId = await ChatService.createRoom(
        {
          name,
          description,
          type,
          groupId,
          parentRoomId,
          createdBy: user.uid,
          isArchived: false,
          isPrivate,
        },
        {
          email: user.email || "",
          name: user.displayName || user.email || "Anonymous",
          avatar: user.photoURL || "",
        }
      );

      toast({
        title: "Room created",
        description: `${name} has been created successfully.`,
      });

      return roomId;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create room";
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteRoom = async (roomId: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      await ChatService.deleteRoom(roomId);

      if (currentRoom?.id === roomId) {
        setCurrentRoom(null);
      }

      toast({
        title: "Room deleted",
        description: "The room has been deleted successfully.",
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete room";
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================================
  // MESSAGE OPERATIONS
  // ==========================================================================

  const sendMessage = async (content: string): Promise<void> => {
    if (!user || !currentRoom?.id) {
      throw new Error("Cannot send message: no user or room selected");
    }

    try {
      await ChatService.sendMessage({
        roomId: currentRoom.id,
        userId: user.uid,
        userEmail: user.email || "",
        userName: user.displayName || user.email || "Anonymous",
        userAvatar: user.photoURL || "",
        content,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to send message";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  };

  const editMessage = async (messageId: string, content: string): Promise<void> => {
    try {
      await ChatService.updateMessage(messageId, content);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to edit message";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  };

  const deleteMessage = async (messageId: string): Promise<void> => {
    try {
      await ChatService.deleteMessage(messageId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete message";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  };

  // ==========================================================================
  // MEMBER OPERATIONS
  // ==========================================================================

  const addMember = async (
    userId: string,
    email: string,
    name: string,
    role: UserRole = UserRole.MEMBER
  ): Promise<void> => {
    if (!currentRoom?.id) {
      throw new Error("No room selected");
    }

    try {
      setLoading(true);
      await ChatService.addRoomMember(currentRoom.id, userId, { email, name, role });

      toast({
        title: "Member added",
        description: `${name} has been added to the room.`,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to add member";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const removeMember = async (userId: string): Promise<void> => {
    if (!currentRoom?.id) {
      throw new Error("No room selected");
    }

    try {
      setLoading(true);
      await ChatService.removeRoomMember(currentRoom.id, userId);

      toast({
        title: "Member removed",
        description: "The member has been removed from the room.",
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to remove member";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateMemberRole = async (userId: string, role: UserRole): Promise<void> => {
    if (!currentRoom?.id) {
      throw new Error("No room selected");
    }

    try {
      setLoading(true);
      await ChatService.updateRoomMemberRole(currentRoom.id, userId, role);

      toast({
        title: "Role updated",
        description: "The member's role has been updated.",
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update role";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================================
  // CONTEXT VALUE
  // ==========================================================================

  const value: ChatContextType = {
    // Groups
    groups,
    currentGroup,
    setCurrentGroup,
    createGroup,
    deleteGroup,

    // Rooms
    rooms,
    currentRoom,
    setCurrentRoom,
    createRoom,
    deleteRoom,

    // Messages
    messages,
    sendMessage,
    editMessage,
    deleteMessage,

    // Members
    currentRoomMembers,
    addMember,
    removeMember,
    updateMemberRole,

    // State
    loading,
    error,
    currentUserMembership,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

// ============================================================================
// HOOK
// ============================================================================

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}