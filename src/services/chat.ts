import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  onSnapshot,
  QuerySnapshot,
  DocumentData,
  arrayUnion,
  arrayRemove,
  setDoc,
  limit,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

/**
 * User roles in groups and rooms
 */
export enum UserRole {
  ADMIN = "admin",           // Full control - can manage everything
  SUB_ADMIN = "sub-admin",   // Can manage members and settings, but cannot delete group/room
  MEMBER = "member",         // Can only send messages and view content
}

/**
 * Room/Group types
 */
export enum RoomType {
  GROUP = "group",           // Top-level group/organization
  ROOM = "room",             // Regular chat room within a group
  SUB_TEAM = "sub-team",     // Sub-team within a room or group
  DIRECT = "direct",         // Direct message between two users
}

/**
 * Permissions for different actions
 */
export interface RoomPermissions {
  canSendMessages: boolean;
  canDeleteMessages: boolean;
  canEditRoom: boolean;
  canManageMembers: boolean;
  canDeleteRoom: boolean;
  canCreateSubTeam: boolean;
  canManageRoles: boolean;
}

/**
 * Chat Group (top-level organization)
 */
export interface ChatGroup {
  id?: string;
  name: string;
  description?: string;
  avatarUrl?: string;
  createdBy: string;          // uid of creator
  createdAt: Timestamp;
  updatedAt: Timestamp;
  memberCount: number;
  roomCount: number;
  isArchived: boolean;
}

/**
 * Chat Room (can be standalone, in a group, or a sub-team)
 */
export interface ChatRoom {
  id?: string;
  name: string;
  description?: string;
  type: RoomType;
  groupId?: string;           // Parent group (if part of a group)
  parentRoomId?: string;      // Parent room (if sub-team)
  createdBy: string;          // uid of creator
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastMessageAt?: Timestamp;
  lastMessage?: string;
  memberCount: number;
  isArchived: boolean;
  isPrivate: boolean;         // If true, members must be invited
}

/**
 * Room/Group membership with role
 */
export interface RoomMembership {
  id?: string;
  roomId: string;
  groupId?: string;           // If this is a group membership
  userId: string;
  userEmail: string;
  userName: string;
  userAvatar?: string;
  role: UserRole;
  joinedAt: Timestamp;
  invitedBy?: string;         // uid of person who invited
  permissions: RoomPermissions;
}

/**
 * Chat Message
 */
export interface Message {
  id?: string;
  roomId: string;
  userId: string;
  userEmail: string;
  userName: string;
  userAvatar?: string;
  content: string;
  timestamp: Timestamp;
  edited: boolean;
  editedAt?: Timestamp;
  replyTo?: string;           // Message ID this is replying to
  reactions: Record<string, string[]>; // emoji -> [userIds]
  attachments?: MessageAttachment[];
  isDeleted: boolean;
}

/**
 * Message attachment
 */
export interface MessageAttachment {
  type: "image" | "file" | "link";
  url: string;
  name?: string;
  size?: number;
}

/**
 * User typing indicator
 */
export interface TypingIndicator {
  roomId: string;
  userId: string;
  userName: string;
  timestamp: Timestamp;
}

// ============================================================================
// PERMISSION HELPERS
// ============================================================================

/**
 * Get default permissions for a role
 */
export function getDefaultPermissions(role: UserRole): RoomPermissions {
  switch (role) {
    case UserRole.ADMIN:
      return {
        canSendMessages: true,
        canDeleteMessages: true,
        canEditRoom: true,
        canManageMembers: true,
        canDeleteRoom: true,
        canCreateSubTeam: true,
        canManageRoles: true,
      };
    case UserRole.SUB_ADMIN:
      return {
        canSendMessages: true,
        canDeleteMessages: true,
        canEditRoom: true,
        canManageMembers: true,
        canDeleteRoom: false,
        canCreateSubTeam: true,
        canManageRoles: true,
      };
    case UserRole.MEMBER:
      return {
        canSendMessages: true,
        canDeleteMessages: false,
        canEditRoom: false,
        canManageMembers: false,
        canDeleteRoom: false,
        canCreateSubTeam: false,
        canManageRoles: false,
      };
  }
}

/**
 * Check if user has permission to perform an action
 */
export async function checkPermission(
  userId: string,
  roomId: string,
  permission: keyof RoomPermissions
): Promise<boolean> {
  try {
    const membership = await ChatService.getRoomMembership(roomId, userId);
    if (!membership) return false;
    return membership.permissions[permission];
  } catch (error) {
    console.error("Error checking permission:", error);
    return false;
  }
}

// ============================================================================
// CHAT SERVICE
// ============================================================================

export class ChatService {
  // ==========================================================================
  // GROUPS
  // ==========================================================================

  /**
   * Create a new chat group
   */
  static async createGroup(
    groupData: Omit<ChatGroup, "id" | "createdAt" | "updatedAt" | "memberCount" | "roomCount">,
    creatorData: { email: string; name: string; avatar?: string }
  ): Promise<string> {
    try {
      const now = Timestamp.now();
      const newGroup: Omit<ChatGroup, "id"> = {
        ...groupData,
        createdAt: now,
        updatedAt: now,
        memberCount: 0,
        roomCount: 0,
        isArchived: false,
      };

      const docRef = await addDoc(collection(db, "ChatGroups"), newGroup);

      // Add creator as admin
      await this.addGroupMember(docRef.id, groupData.createdBy, {
        email: creatorData.email,
        name: creatorData.name,
        avatar: creatorData.avatar,
        role: UserRole.ADMIN,
      });

      return docRef.id;
    } catch (error) {
      console.error("Error creating group:", error);
      throw error;
    }
  }

  /**
   * Get all groups a user is part of
   */
  static async getUserGroups(userId: string): Promise<ChatGroup[]> {
    try {
      // Get user's group memberships
      const membershipsQuery = query(
        collection(db, "GroupMemberships"),
        where("userId", "==", userId)
      );
      const membershipsSnapshot = await getDocs(membershipsQuery);
      const groupIds = membershipsSnapshot.docs.map((doc) => doc.data().groupId);

      if (groupIds.length === 0) return [];

      // Get groups
      const groups: ChatGroup[] = [];
      for (const groupId of groupIds) {
        const group = await this.getGroup(groupId);
        if (group && !group.isArchived) {
          groups.push(group);
        }
      }

      return groups;
    } catch (error) {
      console.error("Error fetching user groups:", error);
      throw error;
    }
  }

  /**
   * Get a group by ID
   */
  static async getGroup(groupId: string): Promise<ChatGroup | null> {
    try {
      const docRef = doc(db, "ChatGroups", groupId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as ChatGroup;
      }
      return null;
    } catch (error) {
      console.error("Error fetching group:", error);
      throw error;
    }
  }

  /**
   * Update a group
   */
  static async updateGroup(
    groupId: string,
    updates: Partial<ChatGroup>
  ): Promise<void> {
    try {
      const docRef = doc(db, "ChatGroups", groupId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error("Error updating group:", error);
      throw error;
    }
  }

  /**
   * Delete a group
   */
  static async deleteGroup(groupId: string): Promise<void> {
    try {
      // Delete all rooms in the group
      const roomsQuery = query(
        collection(db, "ChatRooms"),
        where("groupId", "==", groupId)
      );
      const roomsSnapshot = await getDocs(roomsQuery);
      for (const roomDoc of roomsSnapshot.docs) {
        await this.deleteRoom(roomDoc.id);
      }

      // Delete all group memberships
      const membershipsQuery = query(
        collection(db, "GroupMemberships"),
        where("groupId", "==", groupId)
      );
      const membershipsSnapshot = await getDocs(membershipsQuery);
      for (const membershipDoc of membershipsSnapshot.docs) {
        await deleteDoc(membershipDoc.ref);
      }

      // Delete the group
      await deleteDoc(doc(db, "ChatGroups", groupId));
    } catch (error) {
      console.error("Error deleting group:", error);
      throw error;
    }
  }

  // ==========================================================================
  // GROUP MEMBERS
  // ==========================================================================

  /**
   * Add a member to a group
   */
  static async addGroupMember(
    groupId: string,
    userId: string,
    userData: { email: string; name: string; avatar?: string; role?: UserRole }
  ): Promise<void> {
    try {
      const membershipId = `${groupId}_${userId}`;
      const membership: Omit<RoomMembership, "id"> = {
        groupId,
        roomId: groupId, // For consistency
        userId,
        userEmail: userData.email,
        userName: userData.name,
        userAvatar: userData.avatar,
        role: userData.role || UserRole.MEMBER,
        joinedAt: Timestamp.now(),
        permissions: getDefaultPermissions(userData.role || UserRole.MEMBER),
      };

      await setDoc(doc(db, "GroupMemberships", membershipId), membership);

      // Update member count
      const groupRef = doc(db, "ChatGroups", groupId);
      const groupSnap = await getDoc(groupRef);
      if (groupSnap.exists()) {
        await updateDoc(groupRef, {
          memberCount: (groupSnap.data().memberCount || 0) + 1,
        });
      }
    } catch (error) {
      console.error("Error adding group member:", error);
      throw error;
    }
  }

  /**
   * Remove a member from a group
   */
  static async removeGroupMember(groupId: string, userId: string): Promise<void> {
    try {
      const membershipId = `${groupId}_${userId}`;
      await deleteDoc(doc(db, "GroupMemberships", membershipId));

      // Update member count
      const groupRef = doc(db, "ChatGroups", groupId);
      const groupSnap = await getDoc(groupRef);
      if (groupSnap.exists()) {
        await updateDoc(groupRef, {
          memberCount: Math.max(0, (groupSnap.data().memberCount || 1) - 1),
        });
      }
    } catch (error) {
      console.error("Error removing group member:", error);
      throw error;
    }
  }

  /**
   * Update a member's role in a group
   */
  static async updateGroupMemberRole(
    groupId: string,
    userId: string,
    role: UserRole
  ): Promise<void> {
    try {
      const membershipId = `${groupId}_${userId}`;
      await updateDoc(doc(db, "GroupMemberships", membershipId), {
        role,
        permissions: getDefaultPermissions(role),
      });
    } catch (error) {
      console.error("Error updating member role:", error);
      throw error;
    }
  }

  /**
   * Get all members of a group
   */
  static async getGroupMembers(groupId: string): Promise<RoomMembership[]> {
    try {
      const q = query(
        collection(db, "GroupMemberships"),
        where("groupId", "==", groupId)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as RoomMembership)
      );
    } catch (error) {
      console.error("Error fetching group members:", error);
      throw error;
    }
  }

  // ==========================================================================
  // ROOMS
  // ==========================================================================

  /**
   * Create a new chat room
   */
  static async createRoom(
    roomData: Omit<ChatRoom, "id" | "createdAt" | "updatedAt" | "memberCount">,
    creatorData: { email: string; name: string; avatar?: string }
  ): Promise<string> {
    try {
      const now = Timestamp.now();

      // Remove undefined fields to avoid Firestore errors
      const cleanedRoomData: any = {
        name: roomData.name,
        type: roomData.type,
        createdBy: roomData.createdBy,
        createdAt: now,
        updatedAt: now,
        memberCount: 0,
        isArchived: false,
        isPrivate: roomData.isPrivate,
      };

      // Only add optional fields if they are defined
      if (roomData.description) cleanedRoomData.description = roomData.description;
      if (roomData.groupId) cleanedRoomData.groupId = roomData.groupId;
      if (roomData.parentRoomId) cleanedRoomData.parentRoomId = roomData.parentRoomId;

      const docRef = await addDoc(collection(db, "ChatRooms"), cleanedRoomData);

      // Add creator as admin
      await this.addRoomMember(docRef.id, roomData.createdBy, {
        email: creatorData.email,
        name: creatorData.name,
        avatar: creatorData.avatar,
        role: UserRole.ADMIN,
      });

      // Update room count if part of a group
      if (roomData.groupId) {
        const groupRef = doc(db, "ChatGroups", roomData.groupId);
        const groupSnap = await getDoc(groupRef);
        if (groupSnap.exists()) {
          await updateDoc(groupRef, {
            roomCount: (groupSnap.data().roomCount || 0) + 1,
          });
        }
      }

      return docRef.id;
    } catch (error) {
      console.error("Error creating room:", error);
      throw error;
    }
  }

  /**
   * Get a room by ID
   */
  static async getRoom(roomId: string): Promise<ChatRoom | null> {
    try {
      const docRef = doc(db, "ChatRooms", roomId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as ChatRoom;
      }
      return null;
    } catch (error) {
      console.error("Error fetching room:", error);
      throw error;
    }
  }

  /**
   * Get all rooms in a group
   */
  static async getGroupRooms(groupId: string): Promise<ChatRoom[]> {
    try {
      const q = query(
        collection(db, "ChatRooms"),
        where("groupId", "==", groupId),
        where("isArchived", "==", false)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as ChatRoom)
      );
    } catch (error) {
      console.error("Error fetching group rooms:", error);
      throw error;
    }
  }

  /**
   * Get all rooms a user is part of
   */
  static async getUserRooms(userId: string): Promise<ChatRoom[]> {
    try {
      // Get user's room memberships
      const membershipsQuery = query(
        collection(db, "RoomMemberships"),
        where("userId", "==", userId)
      );
      const membershipsSnapshot = await getDocs(membershipsQuery);
      const roomIds = membershipsSnapshot.docs.map((doc) => doc.data().roomId);

      if (roomIds.length === 0) return [];

      // Get rooms
      const rooms: ChatRoom[] = [];
      for (const roomId of roomIds) {
        const room = await this.getRoom(roomId);
        if (room && !room.isArchived) {
          rooms.push(room);
        }
      }

      return rooms;
    } catch (error) {
      console.error("Error fetching user rooms:", error);
      throw error;
    }
  }

  /**
   * Get sub-teams of a room
   */
  static async getSubTeams(roomId: string): Promise<ChatRoom[]> {
    try {
      const q = query(
        collection(db, "ChatRooms"),
        where("parentRoomId", "==", roomId),
        where("type", "==", RoomType.SUB_TEAM),
        where("isArchived", "==", false)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as ChatRoom)
      );
    } catch (error) {
      console.error("Error fetching sub-teams:", error);
      throw error;
    }
  }

  /**
   * Update a room
   */
  static async updateRoom(
    roomId: string,
    updates: Partial<ChatRoom>
  ): Promise<void> {
    try {
      const docRef = doc(db, "ChatRooms", roomId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error("Error updating room:", error);
      throw error;
    }
  }

  /**
   * Delete a room
   */
  static async deleteRoom(roomId: string): Promise<void> {
    try {
      // Delete all sub-teams
      const subTeams = await this.getSubTeams(roomId);
      for (const subTeam of subTeams) {
        if (subTeam.id) {
          await this.deleteRoom(subTeam.id);
        }
      }

      // Delete all messages
      const messagesQuery = query(
        collection(db, "Messages"),
        where("roomId", "==", roomId)
      );
      const messagesSnapshot = await getDocs(messagesQuery);
      for (const messageDoc of messagesSnapshot.docs) {
        await deleteDoc(messageDoc.ref);
      }

      // Delete all room memberships
      const membershipsQuery = query(
        collection(db, "RoomMemberships"),
        where("roomId", "==", roomId)
      );
      const membershipsSnapshot = await getDocs(membershipsQuery);
      for (const membershipDoc of membershipsSnapshot.docs) {
        await deleteDoc(membershipDoc.ref);
      }

      // Update group room count if applicable
      const room = await this.getRoom(roomId);
      if (room?.groupId) {
        const groupRef = doc(db, "ChatGroups", room.groupId);
        const groupSnap = await getDoc(groupRef);
        if (groupSnap.exists()) {
          await updateDoc(groupRef, {
            roomCount: Math.max(0, (groupSnap.data().roomCount || 1) - 1),
          });
        }
      }

      // Delete the room
      await deleteDoc(doc(db, "ChatRooms", roomId));
    } catch (error) {
      console.error("Error deleting room:", error);
      throw error;
    }
  }

  // ==========================================================================
  // ROOM MEMBERS
  // ==========================================================================

  /**
   * Add a member to a room
   */
  static async addRoomMember(
    roomId: string,
    userId: string,
    userData: { email: string; name: string; avatar?: string; role?: UserRole }
  ): Promise<void> {
    try {
      const membershipId = `${roomId}_${userId}`;
      const membership: Omit<RoomMembership, "id"> = {
        roomId,
        userId,
        userEmail: userData.email,
        userName: userData.name,
        userAvatar: userData.avatar,
        role: userData.role || UserRole.MEMBER,
        joinedAt: Timestamp.now(),
        permissions: getDefaultPermissions(userData.role || UserRole.MEMBER),
      };

      await setDoc(doc(db, "RoomMemberships", membershipId), membership);

      // Update member count
      const roomRef = doc(db, "ChatRooms", roomId);
      const roomSnap = await getDoc(roomRef);
      if (roomSnap.exists()) {
        await updateDoc(roomRef, {
          memberCount: (roomSnap.data().memberCount || 0) + 1,
        });
      }
    } catch (error) {
      console.error("Error adding room member:", error);
      throw error;
    }
  }

  /**
   * Remove a member from a room
   */
  static async removeRoomMember(roomId: string, userId: string): Promise<void> {
    try {
      const membershipId = `${roomId}_${userId}`;
      await deleteDoc(doc(db, "RoomMemberships", membershipId));

      // Update member count
      const roomRef = doc(db, "ChatRooms", roomId);
      const roomSnap = await getDoc(roomRef);
      if (roomSnap.exists()) {
        await updateDoc(roomRef, {
          memberCount: Math.max(0, (roomSnap.data().memberCount || 1) - 1),
        });
      }
    } catch (error) {
      console.error("Error removing room member:", error);
      throw error;
    }
  }

  /**
   * Update a member's role in a room
   */
  static async updateRoomMemberRole(
    roomId: string,
    userId: string,
    role: UserRole
  ): Promise<void> {
    try {
      const membershipId = `${roomId}_${userId}`;
      await updateDoc(doc(db, "RoomMemberships", membershipId), {
        role,
        permissions: getDefaultPermissions(role),
      });
    } catch (error) {
      console.error("Error updating member role:", error);
      throw error;
    }
  }

  /**
   * Get all members of a room
   */
  static async getRoomMembers(roomId: string): Promise<RoomMembership[]> {
    try {
      const q = query(
        collection(db, "RoomMemberships"),
        where("roomId", "==", roomId)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as RoomMembership)
      );
    } catch (error) {
      console.error("Error fetching room members:", error);
      throw error;
    }
  }

  /**
   * Get a user's membership in a room
   */
  static async getRoomMembership(
    roomId: string,
    userId: string
  ): Promise<RoomMembership | null> {
    try {
      const membershipId = `${roomId}_${userId}`;
      const docRef = doc(db, "RoomMemberships", membershipId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as RoomMembership;
      }
      return null;
    } catch (error) {
      console.error("Error fetching room membership:", error);
      throw error;
    }
  }

  // ==========================================================================
  // MESSAGES
  // ==========================================================================

  /**
   * Send a message in a room
   */
  static async sendMessage(
    messageData: Omit<Message, "id" | "timestamp" | "edited" | "reactions" | "isDeleted">
  ): Promise<string> {
    try {
      const newMessage: Omit<Message, "id"> = {
        ...messageData,
        timestamp: Timestamp.now(),
        edited: false,
        reactions: {},
        isDeleted: false,
      };

      const docRef = await addDoc(collection(db, "Messages"), newMessage);

      // Update room's last message
      await updateDoc(doc(db, "ChatRooms", messageData.roomId), {
        lastMessage: messageData.content,
        lastMessageAt: newMessage.timestamp,
        updatedAt: newMessage.timestamp,
      });

      return docRef.id;
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  }

  /**
   * Get messages in a room
   */
  static async getRoomMessages(
    roomId: string,
    limitCount = 50
  ): Promise<Message[]> {
    try {
      const q = query(
        collection(db, "Messages"),
        where("roomId", "==", roomId),
        where("isDeleted", "==", false),
        orderBy("timestamp", "desc"),
        limit(limitCount)
      );
      const snapshot = await getDocs(q);
      const messages = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Message)
      );
      return messages.reverse(); // Reverse to show oldest first
    } catch (error) {
      console.error("Error fetching messages:", error);
      throw error;
    }
  }

  /**
   * Update a message
   */
  static async updateMessage(
    messageId: string,
    content: string
  ): Promise<void> {
    try {
      await updateDoc(doc(db, "Messages", messageId), {
        content,
        edited: true,
        editedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error("Error updating message:", error);
      throw error;
    }
  }

  /**
   * Delete a message
   */
  static async deleteMessage(messageId: string): Promise<void> {
    try {
      await updateDoc(doc(db, "Messages", messageId), {
        isDeleted: true,
        content: "[Message deleted]",
      });
    } catch (error) {
      console.error("Error deleting message:", error);
      throw error;
    }
  }

  /**
   * Add a reaction to a message
   */
  static async addReaction(
    messageId: string,
    userId: string,
    emoji: string
  ): Promise<void> {
    try {
      const messageRef = doc(db, "Messages", messageId);
      const messageSnap = await getDoc(messageRef);

      if (messageSnap.exists()) {
        const message = messageSnap.data() as Message;
        const reactions = message.reactions || {};

        if (!reactions[emoji]) {
          reactions[emoji] = [];
        }

        if (!reactions[emoji].includes(userId)) {
          reactions[emoji].push(userId);
        }

        await updateDoc(messageRef, { reactions });
      }
    } catch (error) {
      console.error("Error adding reaction:", error);
      throw error;
    }
  }

  /**
   * Remove a reaction from a message
   */
  static async removeReaction(
    messageId: string,
    userId: string,
    emoji: string
  ): Promise<void> {
    try {
      const messageRef = doc(db, "Messages", messageId);
      const messageSnap = await getDoc(messageRef);

      if (messageSnap.exists()) {
        const message = messageSnap.data() as Message;
        const reactions = message.reactions || {};

        if (reactions[emoji]) {
          reactions[emoji] = reactions[emoji].filter((id) => id !== userId);
          if (reactions[emoji].length === 0) {
            delete reactions[emoji];
          }
        }

        await updateDoc(messageRef, { reactions });
      }
    } catch (error) {
      console.error("Error removing reaction:", error);
      throw error;
    }
  }

  // ==========================================================================
  // REAL-TIME LISTENERS
  // ==========================================================================

  /**
   * Listen to messages in a room
   */
  static onMessagesListener(
    roomId: string,
    callback: (messages: Message[]) => void
  ): () => void {
    const q = query(
      collection(db, "Messages"),
      where("roomId", "==", roomId),
      where("isDeleted", "==", false),
      orderBy("timestamp", "desc"),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Message)
      );
      callback(messages.reverse());
    });

    return unsubscribe;
  }

  /**
   * Listen to user's groups
   */
  static onUserGroupsListener(
    userId: string,
    callback: (groups: ChatGroup[]) => void
  ): () => void {
    const q = query(
      collection(db, "GroupMemberships"),
      where("userId", "==", userId)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const groupIds = snapshot.docs.map((doc) => doc.data().groupId);
      const groups: ChatGroup[] = [];

      for (const groupId of groupIds) {
        const group = await this.getGroup(groupId);
        if (group && !group.isArchived) {
          groups.push(group);
        }
      }

      callback(groups);
    });

    return unsubscribe;
  }

  /**
   * Listen to user's rooms
   */
  static onUserRoomsListener(
    userId: string,
    callback: (rooms: ChatRoom[]) => void
  ): () => void {
    const q = query(
      collection(db, "RoomMemberships"),
      where("userId", "==", userId)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const roomIds = snapshot.docs.map((doc) => doc.data().roomId);
      const rooms: ChatRoom[] = [];

      for (const roomId of roomIds) {
        const room = await this.getRoom(roomId);
        if (room && !room.isArchived) {
          rooms.push(room);
        }
      }

      callback(rooms);
    });

    return unsubscribe;
  }

  /**
   * Listen to room members
   */
  static onRoomMembersListener(
    roomId: string,
    callback: (members: RoomMembership[]) => void
  ): () => void {
    const q = query(
      collection(db, "RoomMemberships"),
      where("roomId", "==", roomId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const members = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as RoomMembership)
      );
      callback(members);
    });

    return unsubscribe;
  }
}