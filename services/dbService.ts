
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, getDocs, query, orderBy, Timestamp } from "firebase/firestore";
import { app } from "./authService";
import { SessionResult, VisionAnalysis } from "../types";

// Initialize Firestore only if app is initialized
const db = app ? getFirestore(app) : null;

export interface UserProfileData {
  startDate: string;
  lastLogin?: string;
  isPro?: boolean;
  proRequestStatus?: 'none' | 'pending' | 'rejected';
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
      const sessionsRef = collection(db, "users", uid, "sessions");
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
  },

  async requestProVerification(uid: string) {
    if (!db) return;
    try {
        const userRef = doc(db, "users", uid);
        await setDoc(userRef, { 
            proRequestStatus: 'pending',
            proRequestDate: new Date().toISOString()
        }, { merge: true });
    } catch (error) {
        console.error("Error requesting pro verification:", error);
    }
  },

  // --- VISION FEEDBACK & ANALYSIS ---

  async saveVisionFeedback(uid: string | null, feedback: any) {
      if (!db) return;
      try {
          const collectionRef = uid 
            ? collection(db, "users", uid, "vision_feedback")
            : collection(db, "vision_feedback");

          await addDoc(collectionRef, {
              uid: uid || 'anonymous',
              ...feedback,
              timestamp: new Date().toISOString()
          });
      } catch (e) {
          console.error("Error saving feedback", e);
      }
  },

  /**
   * Save a full analysis result to the user's history
   */
  async saveAnalysisResult(uid: string, analysis: VisionAnalysis) {
      if (!db) return;
      try {
          const collectionRef = collection(db, "users", uid, "analysis_history");
          await setDoc(doc(collectionRef, analysis.id), analysis);
      } catch (e) {
          console.error("Error saving analysis result", e);
      }
  }
};
