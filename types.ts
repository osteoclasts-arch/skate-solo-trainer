
export enum Stance {
  REGULAR = 'Regular',
  FAKIE = 'Fakie',
  SWITCH = 'Switch',
  NOLLIE = 'Nollie'
}

export enum Difficulty {
  EASY = 'Easy',
  MEDIUM = 'Medium',
  HARD = 'Hard',
  PRO = 'Pro'
}

export enum TrickCategory {
  FLATGROUND = 'Flatground',
  GRIND = 'Grind',
  // MANUAL removed
  TRANSITION = 'Transition'
}

export interface User {
  uid: string;
  name: string;
  email?: string;
  photoURL?: string;
  isPro?: boolean;
  proRequestStatus?: 'none' | 'pending' | 'rejected';
}

export interface StanceContent {
  videoUrl?: string;
  description?: {
    EN: string;
    KR: string;
  };
}

export interface Trick {
  id: string;
  name: string;
  category: TrickCategory;
  difficulty: Difficulty;
  stance?: Stance; // Applied dynamically in session
  videoUrl?: string; // Default (Regular) video
  description?: {
    EN: string;
    KR: string;
  };
  stanceDocs?: {
    [key in Stance]?: StanceContent;
  };
}

export interface SessionSettings {
  trickCount: number;
  difficulty: Difficulty;
  categories: TrickCategory[];
  selectedStances: Stance[]; // Added for stance mixing
  isProgressive: boolean;
  useAI: boolean; // Use AI to generate the trick list
  customFocus?: string; // User input for AI, e.g. "Focus on heelflips"
}

export interface SessionResult {
  id: string;
  date: string; // ISO string
  totalTricks: number;
  landedCount: number;
  failedCount: number;
  letters: string; // "S", "SK", etc.
  trickHistory: TrickAttempt[];
  aiAnalysis?: string;
}

export interface TrickAttempt {
  trick: Trick;
  landed: boolean;
  timestamp: number;
}

export interface TrickTip {
  text: {
    EN: string;
    KR: string;
  };
  source: string;
  video?: string;
  videoUrl?: string;
  subtitleUrl?: string;
}

export interface AnalyticsInsight {
  diagnosis: string;
  summary: string;
  weaknessAnalysis: string;
  improvementSuggestions: string[];
  aiFeedback: string;
}

export interface VisionAnalysis {
  trickName: string;
  confidence: number;
  formScore: number; // 0-10
  heightEstimate: string; // e.g., "30cm" or "High"
  postureAnalysis: string;
  landingAnalysis: string;
  improvementTip: string;
}

export type ViewState = 'DASHBOARD' | 'ANALYTICS' | 'SETUP' | 'ACTIVE_SESSION' | 'SUMMARY' | 'LEARNING' | 'AI_VISION';

export type Language = 'EN' | 'KR';
