

import { SessionResult, VisionAnalysis, Quest } from "../types";

export interface UserProfileData {
  startDate: string;
  lastLogin?: string;
  isPro?: boolean;
  proRequestStatus?: 'none' | 'pending' | 'rejected';
  age?: number;
  level?: number;
  xp?: number;
  dailyQuests?: Quest[];
  lastQuestDate?: string;
}

const STORAGE_KEYS = {
    USERS: "skate_db_users",
    SESSIONS: "skate_db_sessions",
    VISION: "skate_db_vision",
    ANALYSIS: "skate_db_analysis",
    LEGACY_SESSIONS: "skate_session_history" // Old key for backward compatibility
};

// Helper to simulate DB delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Generate default daily quests
const generateDailyQuests = (): Quest[] => [
    { id: 'q_login', title: 'QUEST_LOGIN', xp: 10, isCompleted: false, type: 'login' },
    { id: 'q_session', title: 'QUEST_SESSION', xp: 50, isCompleted: false, type: 'session' },
    { id: 'q_practice', title: 'QUEST_PRACTICE', xp: 30, isCompleted: false, type: 'practice' }
];

export const dbService = {
  /**
   * Save the start date to the user's profile
   */
  async updateUserProfile(uid: string, data: Partial<UserProfileData>) {
    await delay(50);
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || "{}");
    
    // Merge existing with new data
    const existing = users[uid] || {};
    const updated = { ...existing, ...data };
    
    // Check Date for Quests
    const today = new Date().toISOString().split('T')[0];
    if (updated.lastQuestDate !== today) {
        // Keep existing quests if same day, otherwise reset
        updated.dailyQuests = generateDailyQuests();
        updated.lastQuestDate = today;
    }

    users[uid] = updated;
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    return updated; // Return updated profile to refresh state
  },

  /**
   * Fetch user profile (start date, etc.)
   */
  async getUserProfile(uid: string): Promise<UserProfileData | null> {
    await delay(50);
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || "{}");
    let profile = users[uid];
    
    if (profile) {
        // Daily Quest Logic on Fetch
        const today = new Date().toISOString().split('T')[0];
        
        // Ensure quests exist and are up to date
        if (profile.lastQuestDate !== today || !profile.dailyQuests) {
            profile.dailyQuests = generateDailyQuests();
            profile.lastQuestDate = today;
            
            // Save back to DB immediately to persist the generated quests
            users[uid] = profile;
            localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
        }
        
        // Init XP/Level if missing (Migration for existing users)
        if (profile.level === undefined) profile.level = 1;
        if (profile.xp === undefined) profile.xp = 0;
    }
    
    return profile || null;
  },

  /**
   * Save a completed session
   */
  async saveSession(uid: string, session: SessionResult) {
    await delay(50);
    const allSessions = JSON.parse(localStorage.getItem(STORAGE_KEYS.SESSIONS) || "{}");
    const userSessions = allSessions[uid] || [];
    
    // Prevent duplicates if ID exists
    if (!userSessions.find((s: SessionResult) => s.id === session.id)) {
        userSessions.unshift(session); // Add to beginning
        allSessions[uid] = userSessions;
        localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(allSessions));
    }
  },

  /**
   * Load all sessions for a user
   */
  async getUserSessions(uid: string): Promise<SessionResult[]> {
    await delay(50);
    const allSessions = JSON.parse(localStorage.getItem(STORAGE_KEYS.SESSIONS) || "{}");
    return allSessions[uid] || [];
  },

  /**
   * MIGRATE LEGACY DATA
   * Checks for old "skate_session_history" array in localStorage
   * and moves it to the current user's DB entry if not already present.
   */
  async migrateLegacySessions(uid: string) {
      try {
          const legacyData = localStorage.getItem(STORAGE_KEYS.LEGACY_SESSIONS);
          if (!legacyData) return; // No legacy data

          const legacySessions: SessionResult[] = JSON.parse(legacyData);
          if (!Array.isArray(legacySessions) || legacySessions.length === 0) return;

          const allSessions = JSON.parse(localStorage.getItem(STORAGE_KEYS.SESSIONS) || "{}");
          const currentSessions = allSessions[uid] || [];

          // Filter out sessions that are already in the DB (avoid duplicates)
          const newToImport = legacySessions.filter(ls => 
              !currentSessions.some((cs: SessionResult) => cs.id === ls.id)
          );

          if (newToImport.length > 0) {
              console.log(`[Migration] Importing ${newToImport.length} legacy sessions to user ${uid}`);
              const merged = [...newToImport, ...currentSessions];
              // Sort by date desc
              merged.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
              
              allSessions[uid] = merged;
              localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(allSessions));
          }
      } catch (e) {
          console.error("Migration failed", e);
      }
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