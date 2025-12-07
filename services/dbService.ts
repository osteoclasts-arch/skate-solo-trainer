
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, getDocs, query, orderBy, Timestamp } from "firebase/firestore";
import { app } from "./authService";
import { SessionResult } from "../types";

// Initialize Firestore only if app is initialized
const db = app ? getFirestore(app) : null;

export interface UserProfileData {
  startDate: string;
  lastLogin?: string;
}

export const dbService = {
  /**
   * Save the start date to the user's profile document
   */
  async updateUserProfile(uid: string, data: Partial<UserProfileData>) {
    if (!db) return;
    try {
      const userRef = doc(db, "users", uid);
      await setDoc(userRef, { ...data }, { merge: true });
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  },

  /**
   * Fetch user profile (start date, etc.)
   */
  async getUserProfile(uid: string): Promise<UserProfileData | null> {
    if (!db) return null;
    try {
      const userRef = doc(db, "users", uid);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        return snap.data() as UserProfileData;
      }
      return null;
    } catch (error) {
      console.error("Error fetching profile:", error);
      return null;
    }
  },

  /**
   * Save a completed session to the user's 'sessions' subcollection
   */
  async saveSession(uid: string, session: SessionResult) {
    if (!db) return;
    try {
      // Create a reference to the sessions subcollection
      const sessionsRef = collection(db, "users", uid, "sessions");
      // Add the session document. We use the session ID as the doc ID or let Firestore generate one.
      // Using session.id (timestamp) is fine, but ensuring it's a string.
      await setDoc(doc(sessionsRef, session.id), session);
    } catch (error) {
      console.error("Error saving session:", error);
    }
  },

  /**
   * Load all sessions for a user, ordered by date
   */
  async getUserSessions(uid: string): Promise<SessionResult[]> {
    if (!db) return [];
    try {
      const sessionsRef = collection(db, "users", uid, "sessions");
      const q = query(sessionsRef, orderBy("date", "desc")); // Newest first
      const querySnapshot = await getDocs(q);
      
      const sessions: SessionResult[] = [];
      querySnapshot.forEach((doc) => {
        sessions.push(doc.data() as SessionResult);
      });
      return sessions;
    } catch (error) {
      console.error("Error loading sessions:", error);
      return [];
    }
  }
};
