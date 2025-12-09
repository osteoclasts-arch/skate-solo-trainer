
import { User } from "../types";

// Local Storage Key for persistent login state
const STORAGE_KEY = "skate_user_auth";

// Check for existing local session
export const checkLocalSession = (): User | null => {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            return JSON.parse(saved);
        }
    } catch (e) {
        console.error("Auth load error", e);
    }
    return null;
};

export const loginAsGuest = async (name?: string, age?: number): Promise<User | null> => {
  const existing = checkLocalSession();
  if (existing) {
      // If logging in again with new details, update existing
      if (name) {
          const updated = { ...existing, name: name, age: age };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
          return updated;
      }
      return existing;
  }

  const newUser: User = {
    uid: 'local-user-' + Date.now(),
    name: name || 'Skater (Local)',
    age: age,
    email: 'local@skate.solo',
    photoURL: undefined 
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
  return newUser;
};

export const logout = async () => {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem('skate_session_history'); // Also clear history on reset
  localStorage.removeItem('skate_start_date');
};
