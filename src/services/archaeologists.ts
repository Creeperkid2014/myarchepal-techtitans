import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  getDocs,
  Timestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';

export interface Archaeologist {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  institution?: string;
  specialization?: string;
  credentials?: string;
  approvedAt: Date | Timestamp;
  approvedBy: string;
  status: 'pending' | 'approved' | 'rejected';
  activeProjectId?: string; // ID of the site marked as active project
}

export class ArchaeologistService {
  // Check if a user is an approved archaeologist
  static async isArchaeologist(uid: string): Promise<boolean> {
    try {
      if (!db) return false;

      const archaeologistDoc = doc(db, 'archaeologists', uid);
      const archaeologistSnap = await getDoc(archaeologistDoc);

      if (archaeologistSnap.exists()) {
        const data = archaeologistSnap.data();
        return data.status === 'approved';
      }

      return false;
    } catch (error) {
      console.error('Error checking archaeologist status:', error);
      return false;
    }
  }

  // Register a user as an archaeologist (pending approval)
  static async registerAsArchaeologist(
    uid: string,
    email: string,
    displayName?: string,
    institution?: string,
    specialization?: string,
    credentials?: string
  ): Promise<void> {
    try {
      if (!db) throw new Error('Firestore not initialized');

      const archaeologistData: Archaeologist = {
        uid,
        email,
        displayName,
        institution,
        specialization,
        credentials,
        approvedAt: Timestamp.now(),
        approvedBy: uid, // Self-registration for now
        status: 'approved' // Auto-approve for demo purposes
      };

      const archaeologistDoc = doc(db, 'archaeologists', uid);
      await setDoc(archaeologistDoc, archaeologistData);

      console.log('✅ User registered as archaeologist:', uid);
    } catch (error) {
      console.error('❌ Error registering archaeologist:', error);
      throw error;
    }
  }

  // Approve an archaeologist (admin function)
  static async approveArchaeologist(uid: string, approvedBy: string): Promise<void> {
    try {
      if (!db) throw new Error('Firestore not initialized');

      const archaeologistDoc = doc(db, 'archaeologists', uid);
      await setDoc(archaeologistDoc, {
        status: 'approved',
        approvedAt: Timestamp.now(),
        approvedBy
      }, { merge: true });

      console.log('✅ Archaeologist approved:', uid);
    } catch (error) {
      console.error('❌ Error approving archaeologist:', error);
      throw error;
    }
  }

  // Remove archaeologist status
  static async removeArchaeologist(uid: string): Promise<void> {
    try {
      if (!db) throw new Error('Firestore not initialized');

      const archaeologistDoc = doc(db, 'archaeologists', uid);
      await deleteDoc(archaeologistDoc);

      console.log('✅ Archaeologist status removed:', uid);
    } catch (error) {
      console.error('❌ Error removing archaeologist:', error);
      throw error;
    }
  }

  // Get archaeologist profile by UID
  static async getArchaeologistProfile(uid: string): Promise<Archaeologist | null> {
    try {
      if (!db) return null;

      const archaeologistDoc = doc(db, 'archaeologists', uid);
      const archaeologistSnap = await getDoc(archaeologistDoc);

      if (archaeologistSnap.exists()) {
        return archaeologistSnap.data() as Archaeologist;
      }

      return null;
    } catch (error) {
      console.error('❌ Error fetching archaeologist profile:', error);
      return null;
    }
  }

  // Update archaeologist profile
  static async updateArchaeologistProfile(
    uid: string,
    updates: Partial<Omit<Archaeologist, 'uid' | 'approvedAt' | 'approvedBy' | 'status'>>
  ): Promise<void> {
    try {
      if (!db) throw new Error('Firestore not initialized');

      const archaeologistDoc = doc(db, 'archaeologists', uid);
      await setDoc(archaeologistDoc, updates, { merge: true });

      console.log('✅ Archaeologist profile updated:', uid);
    } catch (error) {
      console.error('❌ Error updating archaeologist profile:', error);
      throw error;
    }
  }

  // Get all archaeologists
  static async getAllArchaeologists(): Promise<Archaeologist[]> {
    try {
      if (!db) return [];

      const archaeologistsCollection = collection(db, 'archaeologists');
      const querySnapshot = await getDocs(archaeologistsCollection);

      return querySnapshot.docs.map(doc => ({
        ...doc.data()
      } as Archaeologist));
    } catch (error) {
      console.error('❌ Error fetching archaeologists:', error);
      return [];
    }
  }

  // Upload profile picture to Firebase Storage
  static async uploadProfilePicture(uid: string, file: File): Promise<string> {
    try {
      console.log('🔄 Starting profile picture upload...');
      console.log('Storage instance:', storage ? '✅ Available' : '❌ Not available');
      console.log('File info:', { name: file.name, size: file.size, type: file.type });

      if (!storage) {
        console.error('❌ Firebase Storage is not initialized');
        throw new Error('Firebase Storage is not properly initialized');
      }

      // Create a unique filename
      const timestamp = Date.now();
      const filename = `profile-pictures/${uid}/${timestamp}_${file.name}`;
      console.log('📁 Upload path:', filename);

      const storageRef = ref(storage, filename);
      console.log('🎯 Storage ref created:', storageRef.toString());

      // Upload the file
      console.log('⬆️ Uploading file...');
      const snapshot = await uploadBytes(storageRef, file);
      console.log('✅ Upload completed:', snapshot.metadata);

      // Get the download URL
      console.log('🔗 Getting download URL...');
      const downloadURL = await getDownloadURL(snapshot.ref);
      console.log('✅ Download URL obtained:', downloadURL);

      return downloadURL;
    } catch (error: any) {
      console.error('❌ Error uploading profile picture:');
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Full error:', error);

      // Provide more specific error messages
      if (error.code === 'storage/unauthorized') {
        throw new Error('Upload unauthorized. Please check Firebase Storage security rules.');
      } else if (error.code === 'storage/quota-exceeded') {
        throw new Error('Storage quota exceeded. Please upgrade your Firebase plan.');
      } else if (error.code === 'storage/unauthenticated') {
        throw new Error('You must be signed in to upload images.');
      } else {
        throw new Error(`Upload failed: ${error.message || 'Unknown error'}`);
      }
    }
  }

  // Delete profile picture from Firebase Storage
  static async deleteProfilePicture(photoURL: string): Promise<void> {
    try {
      if (!storage) {
        throw new Error('Firebase Storage is not properly initialized');
      }

      // Create a reference from the URL
      const imageRef = ref(storage, photoURL);

      // Delete the file
      await deleteObject(imageRef);
      console.log('✅ Profile picture deleted');
    } catch (error) {
      console.error('❌ Error deleting profile picture:', error);
      // Don't throw error as image might already be deleted
    }
  }

  // Set active project for an archaeologist
  static async setActiveProject(uid: string, siteId: string | null): Promise<void> {
    try {
      if (!db) throw new Error('Firestore not initialized');

      const archaeologistDoc = doc(db, 'archaeologists', uid);
      await setDoc(archaeologistDoc, {
        activeProjectId: siteId
      }, { merge: true });

      console.log('✅ Active project set for archaeologist:', uid, 'Site:', siteId);
    } catch (error) {
      console.error('❌ Error setting active project:', error);
      throw error;
    }
  }

  // Get active project ID for an archaeologist
  static async getActiveProjectId(uid: string): Promise<string | null> {
    try {
      if (!db) return null;

      const archaeologistDoc = doc(db, 'archaeologists', uid);
      const archaeologistSnap = await getDoc(archaeologistDoc);

      if (archaeologistSnap.exists()) {
        const data = archaeologistSnap.data();
        return data.activeProjectId || null;
      }

      return null;
    } catch (error) {
      console.error('❌ Error fetching active project:', error);
      return null;
    }
  }

  // Clear all active project assignments for all archaeologists
  static async clearAllActiveProjects(): Promise<void> {
    try {
      if (!db) throw new Error('Firestore not initialized');

      const archaeologistsCollection = collection(db, 'archaeologists');
      const querySnapshot = await getDocs(archaeologistsCollection);

      const updatePromises = querySnapshot.docs.map(async (docSnapshot) => {
        const archaeologistDoc = doc(db, 'archaeologists', docSnapshot.id);
        await setDoc(archaeologistDoc, {
          activeProjectId: null
        }, { merge: true });
      });

      await Promise.all(updatePromises);
      console.log('✅ All active projects cleared');
    } catch (error) {
      console.error('❌ Error clearing active projects:', error);
      throw error;
    }
  }
}