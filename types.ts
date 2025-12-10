

export enum Stance {
  REGULAR = 'Regular',
  FAKIE = 'Fakie',
  SWITCH = 'Switch',
  NOLLIE = 'Nollie'
}

export enum Difficulty {
  BEGINNER = 'Beginner',
  AMATEUR_1 = 'Amateur 1',
  AMATEUR_2 = 'Amateur 2',
  AMATEUR_3 = 'Amateur 3',
  PRO = 'Pro'
}

export enum TrickCategory {
  FLATGROUND = 'Flatground',
  GRIND = 'Grind',
  // MANUAL removed
  TRANSITION = 'Transition'
}

export interface Quest {
  id: string;
  title: string; // Translation Key
  description?: string; // Optional detailed description
  xp: number;
  isCompleted: boolean;
  type: 'login' | 'session' | 'practice' | 'land_tricks' | 'perfect_session';
  progress: number;
  target: number;
}

export interface User {
  uid: string;
  name: string;
  email?: string;
  photoURL?: string;
  age?: number; 
  isPro?: boolean;
  proRequestStatus?: 'none' | 'pending' | 'rejected';
  level?: number;
  xp?: number;
  dailyQuests?: Quest[];
  lastQuestDate?: string;
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
  difficulty?: Difficulty;
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

// Updated Vision Analysis Type matching the new requirements
export interface VisionAnalysis {
  id: string;
  timestamp: string;
  trickName: string; // e.g., "Kickflip"
  isLanded: boolean;
  confidence: number; // 0.0 - 1.0
  score: number; // 0 - 100
  heightMeters: number; // e.g., 0.45
  rotationDegrees: number; // e.g., 180
  videoUrl?: string; // Optional if we store it
  
  // AI Coaching Feedback
  feedbackText?: string; 
  improvementTip?: string; 

  // Physics Analysis
  boardPhysics?: {
    axis: 'ROLL' | 'YAW' | 'MIXED' | 'NONE';
    description: string;
  };

  // Legacy fields for backward compatibility if needed
  formScore?: number; 
  heightEstimate?: string; 
  postureAnalysis?: string; 
  landingAnalysis?: string; 
}

// Data structure for frame-by-frame tracking
export interface TrackingDataPoint {
  frame: number;
  relX: number; // Relative center X (-0.5 to 0.5)
  relY: number; // Relative center Y (-0.5 to 0.5)
  width: number; // Relative width
  height: number; // Relative height
  aspectRatio: number; // w / h
  confidence: number;
}

export type ViewState = 'DASHBOARD' | 'ANALYTICS' | 'SETUP' | 'ACTIVE_SESSION' | 'SUMMARY' | 'LEARNING' | 'AI_VISION';

export type Language = 'EN' | 'KR';