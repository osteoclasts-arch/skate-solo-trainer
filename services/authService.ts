
declare var process: {
  env: {
    FIREBASE_API_KEY?: string;
    FIREBASE_AUTH_DOMAIN?: string;
    FIREBASE_PROJECT_ID?: string;
    FIREBASE_STORAGE_BUCKET?: string;
    FIREBASE_MESSAGING_SENDER_ID?: string;
    FIREBASE_APP_ID?: string;
  };
};

import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut, Auth, User as FirebaseUser, setPersistence, browserLocalPersistence } from "firebase/auth";
import { User } from "../types";

// Configuration from environment variables or hardcoded fallback
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "AIzaSyBG2wa-oAXGu5ZXB9G_aBu8fFBBvjiwDUc",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "skate-trainer-auth.firebaseapp.com",
  projectId: process.env.FIREBASE_PROJECT_ID || "skate-trainer-auth",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "skate-trainer-auth.firebasestorage.app",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "1020843311660",
  appId: process.env.FIREBASE_APP_ID || "1:1020843311660:web:7be66ce53a75a0f1328789"
};

// Export app so dbService can use it
export let app: FirebaseApp | undefined;
let auth: Auth | undefined;

// Initialize Firebase only if config is present
const isConfigured = !!firebaseConfig.apiKey;

if (isConfigured && getApps().length === 0) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
  } catch (error) {
    console.error("Firebase initialization failed:", error);
  }
} else if (isConfigured) {
  app = getApps()[0];
  auth = getAuth(app);
}

export const signInWithGoogle = async (): Promise<User | null> => {
  if (!auth) {
    alert("Firebase 초기화 실패. 설정값을 확인해주세요.");
    return mockLogin();
  }

  try {
    // Set persistence to LOCAL (survives browser restart)
    await setPersistence(auth, browserLocalPersistence);

    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    
    return {
      uid: user.uid,
      name: user.displayName || 'Skater',
      email: user.email || '',
      photoURL: user.photoURL || undefined
    };
  } catch (error: any) {
    console.error("Login Failed", error);
    if (error.code === 'auth/unauthorized-domain') {
        alert(`도메인 권한 오류: Firebase 콘솔 > Authentication > Settings > Authorized domains 에 현재 도메인을 추가해주세요.\n(현재 도메인: ${window.location.hostname})`);
    } else if (error.code === 'auth/popup-closed-by-user') {
      // User closed the popup, no need to alert
    } else if (error.code === 'auth/configuration-not-found') {
        alert("Firebase 콘솔에서 Google 로그인을 활성화해야 합니다.");
    } else {
        alert(`로그인 실패: ${error.message}`);
    }
    return null;
  }
};

export const logout = async () => {
  if (!auth) {
    console.log("Mock logout");
    return;
  }
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error("Logout failed", error);
  }
};

export const getFirebaseAuth = () => auth;

// Fallback for when Firebase isn't configured
const mockLogin = (): User => {
  return {
    uid: 'mock-user-123',
    name: 'Skater (Guest)',
    email: 'guest@skate.solo',
    photoURL: 'https://lh3.googleusercontent.com/a/default-user=s96-c'
  };
};
