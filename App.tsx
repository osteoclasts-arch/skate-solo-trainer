


import React, { useState, useEffect } from 'react';
import { ViewState, SessionSettings, Trick, SessionResult, Difficulty, Language, Stance, User } from './types';
import Dashboard from './components/Dashboard';
import SessionSetup from './components/SessionSetup';
import ActiveSession from './components/ActiveSession';
import SessionSummary from './components/SessionSummary';
import Analytics from './components/Analytics';
import TrickLearning from './components/TrickLearning';
import AIVision from './components/AIVision';
import { BASE_TRICKS, TRANSLATIONS } from './constants';
import { generateAISession } from './services/geminiService';
import { signInWithGoogle, logout, getFirebaseAuth } from './services/authService';
import { dbService } from './services/dbService';
import { onAuthStateChanged } from 'firebase/auth';
import { Home, BarChart2, BookOpen, Layers, Eye } from 'lucide-react';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('DASHBOARD');
  const [activeTricks, setActiveTricks] = useState<Trick[]>([]);
  
  // User Authentication State
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  // Initialize session history from localStorage (Default for Guest)
  const [sessionHistory, setSessionHistory] = useState<SessionResult[]>(() => {
    try {
        const saved = localStorage.getItem('skate_session_history');
        return saved ? JSON.parse(saved) : [];
    } catch (e) {
        console.error("Failed to load history", e);
        return [];
    }
  });

  const [lastResult, setLastResult] = useState<SessionResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem('skate_app_language') as Language) || 'KR';
  });

  // Profile State
  const [startDate, setStartDate] = useState<string>(() => {
      return localStorage.getItem('skate_start_date') || new Date().toISOString().split('T')[0];
  });

  // Handle Authentication Persistence & Data Sync
  useEffect(() => {
    const auth = getFirebaseAuth();
    if (auth) {
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          // 1. Set User Basic Info
          const newUser: User = {
            uid: firebaseUser.uid,
            name: firebaseUser.displayName || 'Skater',
            email: firebaseUser.email || '',
            photoURL: firebaseUser.photoURL || undefined
          };

          // 2. Fetch Cloud Data
          setIsLoadingData(true);
          try {
             // Load Profile (Start Date & Pro Status)
             const profile = await dbService.getUserProfile(firebaseUser.uid);
             if (profile) {
                 if (profile.startDate) {
                    setStartDate(profile.startDate);
                    localStorage.setItem('skate_start_date', profile.startDate);
                 }
                 // Sync Pro Status
                 newUser.isPro = profile.isPro;
                 newUser.proRequestStatus = profile.proRequestStatus;
             }

             // Load History
             const cloudSessions = await dbService.getUserSessions(firebaseUser.uid);
             if (cloudSessions.length > 0) {
                 setSessionHistory(cloudSessions);
                 localStorage.setItem('skate_session_history', JSON.stringify(cloudSessions));
             }
          } catch (e) {
             console.error("Error syncing data", e);
          } finally {
             setIsLoadingData(false);
          }
          
          setUser(newUser);

        } else {
          setUser(null);
        }
        setIsAuthChecking(false);
      });
      return () => unsubscribe();
    } else {
        setIsAuthChecking(false);
    }
  }, []);

  const handleLogin = async () => {
    const loggedInUser = await signInWithGoogle();
    if (loggedInUser) {
      setUser(loggedInUser);
    }
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    window.location.reload(); 
  };

  const updateStartDate = async (date: string) => {
      setStartDate(date);
      localStorage.setItem('skate_start_date', date);
      
      if (user) {
          await dbService.updateUserProfile(user.uid, { startDate: date });
      }
  };

  const handleRequestPro = async () => {
      if (user) {
          await dbService.requestProVerification(user.uid);
          setUser(prev => prev ? ({ ...prev, proRequestStatus: 'pending' }) : null);
      }
  };

  const calculateDaysSkating = () => {
      const start = new Date(startDate);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
  };

  const startSession = async (settings: SessionSettings) => {
    setIsGenerating(true);
    let tricks: Trick[] = [];

    if (settings.useAI) {
       tricks = await generateAISession(settings);
    } else {
       tricks = generateLocalTricks(settings);
    }
    
    // Fallback if AI fails or returns empty
    if (tricks.length === 0) {
        tricks = generateLocalTricks(settings);
    }

    setActiveTricks(tricks);
    setIsGenerating(false);
    setView('ACTIVE_SESSION');
  };

  const generateLocalTricks = (settings: SessionSettings): Trick[] => {
      // 1. Filter by category
      let filtered = BASE_TRICKS.filter(t => settings.categories.includes(t.category));
      
      // 2. Filter by difficulty
      filtered = filtered.filter(t => t.difficulty === settings.difficulty);
      
      if (filtered.length === 0) {
          // Fallback to all if too strict
          filtered = BASE_TRICKS;
      }

      // 3. Shuffle and pick
      const shuffled = [...filtered].sort(() => 0.5 - Math.random());
      const selectedTricks = shuffled.slice(0, settings.trickCount);

      // 4. If we need more tricks than available, cycle through
      while (selectedTricks.length < settings.trickCount) {
          const randomTrick = filtered[Math.floor(Math.random() * filtered.length)];
          selectedTricks.push(randomTrick);
      }

      // 5. Apply Stances Mix
      return selectedTricks.map((trick, index) => {
          // Randomly assign a stance from selectedStances
          const randomStance = settings.selectedStances[Math.floor(Math.random() * settings.selectedStances.length)];
          return {
              ...trick,
              id: `${trick.id}-${index}-${Date.now()}`, // Unique ID for session
              stance: randomStance
          };
      });
  };

  const handleSessionComplete = async (result: SessionResult) => {
    const newHistory = [result, ...sessionHistory];
    setSessionHistory(newHistory);
    setLastResult(result);
    localStorage.setItem('skate_session_history', JSON.stringify(newHistory));
    
    // Save to Cloud if logged in
    if (user) {
        await dbService.saveSession(user.uid, result);
    }

    setView('SUMMARY');
  };

  const renderView = () => {
    if (isAuthChecking) {
        return (
            <div className="flex h-screen items-center justify-center bg-black">
                <div className="animate-spin h-8 w-8 border-4 border-skate-neon rounded-full border-t-transparent"></div>
            </div>
        );
    }

    switch (view) {
      case 'DASHBOARD':
        return (
          <Dashboard 
            onStart={() => setView('SETUP')} 
            onLearning={() => setView('LEARNING')}
            history={sessionHistory}
            language={language}
            onLanguageToggle={() => setLanguage(l => {
                const next = l === 'EN' ? 'KR' : 'EN';
                localStorage.setItem('skate_app_language', next);
                return next;
            })}
            daysSkating={calculateDaysSkating()}
            startDate={startDate}
            onUpdateStartDate={updateStartDate}
            user={user}
            onLogin={handleLogin}
            onLogout={handleLogout}
          />
        );
      case 'SETUP':
        return (
          <SessionSetup 
            onStart={startSession} 
            onBack={() => setView('DASHBOARD')}
            isGenerating={isGenerating}
            language={language}
          />
        );
      case 'ACTIVE_SESSION':
        return (
          <ActiveSession 
            tricks={activeTricks} 
            onComplete={handleSessionComplete} 
            onAbort={() => setView('DASHBOARD')} 
            language={language}
          />
        );
      case 'SUMMARY':
        return lastResult ? (
          <SessionSummary 
            result={lastResult} 
            onHome={() => setView('DASHBOARD')}
            language={language}
          />
        ) : null;
      case 'ANALYTICS':
        return (
          <Analytics 
            history={sessionHistory} 
            language={language}
            daysSkating={calculateDaysSkating()}
            user={user}
            onLogin={handleLogin}
            onRequestPro={handleRequestPro}
          />
        );
      case 'LEARNING':
        return <TrickLearning language={language} />;
      case 'AI_VISION':
        return <AIVision language={language} />;
      default:
        return null;
    }
  };

  return (
    <div className="h-screen w-full bg-black text-white overflow-hidden font-sans relative">
      {renderView()}

      {/* Floating Island Navigation */}
      {!isAuthChecking && (view === 'DASHBOARD' || view === 'ANALYTICS' || view === 'LEARNING' || view === 'SUMMARY' || view === 'AI_VISION') && (
         <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 w-[95%] max-w-md z-50">
            <nav className="glass-nav rounded-full px-6 py-4 flex justify-between items-center shadow-2xl">
                <button 
                    onClick={() => setView('DASHBOARD')}
                    className={`flex flex-col items-center space-y-1 transition-all ${view === 'DASHBOARD' ? 'text-skate-neon scale-110' : 'text-gray-500 hover:text-white'}`}
                >
                    <Home className={`w-5 h-5 ${view === 'DASHBOARD' && 'drop-shadow-[0_0_8px_rgba(204,255,0,0.5)]'}`} />
                </button>
                <button 
                    onClick={() => setView('LEARNING')}
                    className={`flex flex-col items-center space-y-1 transition-all ${view === 'LEARNING' ? 'text-skate-neon scale-110' : 'text-gray-500 hover:text-white'}`}
                >
                    <BookOpen className={`w-5 h-5 ${view === 'LEARNING' && 'drop-shadow-[0_0_8px_rgba(204,255,0,0.5)]'}`} />
                </button>
                 <button 
                    onClick={() => setView('AI_VISION')}
                    className={`flex flex-col items-center space-y-1 transition-all ${view === 'AI_VISION' ? 'text-skate-neon scale-110' : 'text-gray-500 hover:text-white'}`}
                >
                    <div className="relative">
                        {view === 'AI_VISION' && <div className="absolute inset-0 bg-skate-neon blur-md opacity-50 rounded-full"></div>}
                        <Eye className={`w-6 h-6 relative z-10 ${view === 'AI_VISION' && 'fill-skate-neon text-black'}`} />
                    </div>
                </button>
                <button 
                    onClick={() => setView('ANALYTICS')}
                    className={`flex flex-col items-center space-y-1 transition-all ${view === 'ANALYTICS' ? 'text-skate-neon scale-110' : 'text-gray-500 hover:text-white'}`}
                >
                    <BarChart2 className={`w-5 h-5 ${view === 'ANALYTICS' && 'drop-shadow-[0_0_8px_rgba(204,255,0,0.5)]'}`} />
                </button>
            </nav>
         </div>
      )}
    </div>
  );
};

export default App;
