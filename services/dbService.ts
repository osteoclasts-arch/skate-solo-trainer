
import { SessionResult, VisionAnalysis } from "../types";

export interface UserProfileData {
  startDate: string;
  lastLogin?: string;
  isPro?: boolean;
  proRequestStatus?: 'none' | 'pending' | 'rejected';
  age?: number;
}

const STORAGE_KEYS = {
    USERS: "skate_db_users",
    SESSIONS: "skate_db_sessions",
    VISION: "skate_db_vision",
    ANALYSIS: "skate_db_analysis"
};

// Helper to simulate DB delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const dbService = {
  /**
   * Save the start date to the user's profile
   */
  async updateUserProfile(uid: string, data: Partial<UserProfileData>) {
    await delay(50);
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || "{}");
    users[uid] = { ...users[uid], ...data };
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  },

  /**
   * Fetch user profile (start date, etc.)
   */
  async getUserProfile(uid: string): Promise<UserProfileData | null> {
    await delay(50);
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || "{}");
    return users[uid] || null;
  },

  /**
   * Save a completed session
   */
  async saveSession(uid: string, session: SessionResult) {
    await delay(50);
    const allSessions = JSON.parse(localStorage.getItem(STORAGE_KEYS.SESSIONS) || "{}");
    const userSessions = allSessions[uid] || [];
    userSessions.unshift(session); // Add to beginning
    allSessions[uid] = userSessions;
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(allSessions));
  },

  /**
   * Load all sessions for a user
   */
  async getUserSessions(uid: string): Promise<SessionResult[]> {
    await delay(50);
    const allSessions = JSON.parse(localStorage.getItem(STORAGE_KEYS.SESSIONS) || "{}");
    return allSessions[uid] || [];
  },

  async requestProVerification(uid: string) {
    await delay(50);
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || "{}");
    if (users[uid]) {
        users[uid].proRequestStatus = 'pending';
        users[uid].proRequestDate = new Date().toISOString();
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    }
  },

  // --- VISION FEEDBACK & ANALYSIS ---

  async saveVisionFeedback(uid: string | null, feedback: any) {
      const id = uid || "anonymous";
      const allFeedback = JSON.parse(localStorage.getItem(STORAGE_KEYS.VISION) || "[]");
      allFeedback.push({
          uid: id,
          ...feedback,
          timestamp: new Date().toISOString()
      });
      localStorage.setItem(STORAGE_KEYS.VISION, JSON.stringify(allFeedback));
  },

  /**
   * Get user's past feedback to use as context for AI learning
   */
  async getUserFeedbacks(uid: string): Promise<string[]> {
      const allFeedback = JSON.parse(localStorage.getItem(STORAGE_KEYS.VISION) || "[]");
      const userFeedback = allFeedback.filter((f: any) => f.uid === uid);
      
      const contexts: string[] = [];
      userFeedback.forEach((data: any) => {
          if (data.actualTrickName) {
              contexts.push(data.actualTrickName);
          }
      });
      // Return unique trick names
      return [...new Set(contexts)];
  },

  /**
   * Save a full analysis result to the user's history
   */
  async saveAnalysisResult(uid: string, analysis: VisionAnalysis) {
      const allAnalysis = JSON.parse(localStorage.getItem(STORAGE_KEYS.ANALYSIS) || "{}");
      const userAnalysis = allAnalysis[uid] || [];
      userAnalysis.push(analysis);
      allAnalysis[uid] = userAnalysis;
      localStorage.setItem(STORAGE_KEYS.ANALYSIS, JSON.stringify(allAnalysis));
  }
};
