import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, getDoc, doc, updateDoc, deleteDoc, Timestamp, query, orderBy } from "firebase/firestore";

export interface Event {
  id?: string;
  title: string;
  description: string;
  restrictions?: string;
  date: Timestamp;
  startTime: string;
  endTime: string;
  locationName: string;
  locationAddress: string;
  category: string;
  maxAttendees?: number;
  ticketPrice?: number;
  createdBy: string;
  createdAt?: Timestamp;
}

export class EventsService {
  private static COLLECTION = "events";

  static async createEvent(eventData: Omit<Event, 'id'>): Promise<string> {
    try {
      if (!db) throw new Error("Firestore not initialized");

      const eventWithTimestamp = {
        ...eventData,
        createdAt: Timestamp.now()
      };

      const docRef = await addDoc(collection(db, this.COLLECTION), eventWithTimestamp);
      console.log("✅ Event created with ID:", docRef.id);
      return docRef.id;
    } catch (error) {
      console.error("❌ Error creating event:", error);
      throw error;
    }
  }

  static async getAllEvents(): Promise<Event[]> {
    try {
      if (!db) return [];

      const eventsQuery = query(
        collection(db, this.COLLECTION),
        orderBy("date", "desc")
      );
      const querySnapshot = await getDocs(eventsQuery);

      const events: Event[] = [];
      querySnapshot.forEach((doc) => {
        events.push({ id: doc.id, ...doc.data() } as Event);
      });

      console.log(`✅ Retrieved ${events.length} events`);
      return events;
    } catch (error) {
      console.error("❌ Error fetching events:", error);
      return [];
    }
  }

  static async getEventById(id: string): Promise<Event | null> {
    try {
      if (!db) return null;

      const eventDoc = doc(db, this.COLLECTION, id);
      const eventSnap = await getDoc(eventDoc);

      if (eventSnap.exists()) {
        return { id: eventSnap.id, ...eventSnap.data() } as Event;
      }

      return null;
    } catch (error) {
      console.error("❌ Error fetching event:", error);
      return null;
    }
  }

  static async updateEvent(id: string, eventData: Partial<Event>): Promise<void> {
    try {
      if (!db) throw new Error("Firestore not initialized");

      const eventDoc = doc(db, this.COLLECTION, id);
      await updateDoc(eventDoc, eventData);
      console.log("✅ Event updated:", id);
    } catch (error) {
      console.error("❌ Error updating event:", error);
      throw error;
    }
  }

  static async deleteEvent(id: string): Promise<void> {
    try {
      if (!db) throw new Error("Firestore not initialized");

      const eventDoc = doc(db, this.COLLECTION, id);
      await deleteDoc(eventDoc);
      console.log("✅ Event deleted:", id);
    } catch (error) {
      console.error("❌ Error deleting event:", error);
      throw error;
    }
  }
}
