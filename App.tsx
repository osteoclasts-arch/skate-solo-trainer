
import React, { useState, useEffect } from 'react';
import { ViewState, SessionSettings, Trick, SessionResult, Difficulty, Language, Stance, User } from './types';
import Dashboard from './components/Dashboard';
import SessionSetup from './components/SessionSetup';
import ActiveSession from './components/ActiveSession';
import SessionSummary from './components/SessionSummary';
import Analytics from './components/Analytics';
import TrickLearning from './components/TrickLearning';
import { BASE_TRICKS, TRANSLATIONS } from './constants';
import { generateAISession } from './services/geminiService';
import { signInWithGoogle, logout, getFirebaseAuth } from './services/authService';
import { dbService } from './services/dbService';
import { onAuthStateChanged } from 'firebase/auth';
import { Home, BarChart2, BookOpen, Layers } from 'lucide-react';

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
          // 1. Set User
          setUser({
            uid: firebaseUser.uid,
            name: firebaseUser.displayName || 'Skater',
            email: firebaseUser.email || '',
            photoURL: firebaseUser.photoURL || undefined
          });

          // 2. Fetch Cloud Data
          setIsLoadingData(true);
          try {
             // Load Profile (Start Date)
             const profile = await dbService.getUserProfile(firebaseUser.uid);
             if (profile && profile.startDate) {
                setStartDate(profile.startDate);
                // Also update local storage to keep in sync
                localStorage.setItem('skate_start_date', profile.startDate);
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

  const calculateDaysSkating = () => {
      const start = new Date(startDate);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      return diffDays || 1; 
  };

  const daysSkating = calculateDaysSkating();

  const toggleLanguage = () => {
    const newLang = language === 'EN' ? 'KR' : 'EN';
    setLanguage(newLang);
    localStorage.setItem('skate_app_language', newLang);
  };

  const t = TRANSLATIONS[language];

  // Weighted Random Stance Generator
  const getRandomStance = (allowed: Stance[]): Stance => {
    if (allowed.length === 0) return Stance.REGULAR;
    if (allowed.length === 1) return allowed[0];

    const weights: Record<Stance, number> = {
        [Stance.REGULAR]: 0.40,
        [Stance.FAKIE]: 0.25,
        [Stance.SWITCH]: 0.20,
        [Stance.NOLLIE]: 0.15
    };

    let totalWeight = 0;
    allowed.forEach(s => totalWeight += weights[s]);

    const r = Math.random() * totalWeight;

    let cumulative = 0;
    for (const s of allowed) {
        cumulative += weights[s];
        if (r <= cumulative) return s;
    }
    return allowed[0];
  };

  const generateLocalTricks = (settings: SessionSettings): Trick[] => {
    const categoryTricks = BASE_TRICKS.filter(t => settings.categories.includes(t.category));
    
    const easyPool = categoryTricks.filter(t => t.difficulty === Difficulty.EASY);
    const mediumPool = categoryTricks.filter(t => t.difficulty === Difficulty.MEDIUM);
    const hardPool = categoryTricks.filter(t => t.difficulty === Difficulty.HARD);
    const proPool = categoryTricks.filter(t => t.difficulty === Difficulty.PRO);
    
    const advancedPool = [...hardPool, ...proPool];

    let selectedTricks: Trick[] = [];
    const targetCount = settings.trickCount;

    const selectRandomUnique = (pool: Trick[], count: number) => {
        if (pool.length === 0) return [];
        const shuffled = [...pool].sort(() => Math.random() - 0.5);
        let selected: Trick[] = [];

        if (count <= shuffled.length) {
            selected = shuffled.slice(0, count);
        } else {
            selected = [...shuffled];
            while (selected.length < count) {
                selected.push(shuffled[Math.floor(Math.random() * shuffled.length)]);
            }
        }
        return selected.map(t => ({ ...t }));
    };

    let countEasy = 0;
    let countMedium = 0;
    let countAdvanced = 0;

    switch (settings.difficulty) {
      case Difficulty.EASY:
        selectedTricks = selectRandomUnique(easyPool, targetCount);
        break;
      case Difficulty.MEDIUM:
        countEasy = Math.round(targetCount * 0.30);
        countMedium = targetCount - countEasy;
        selectedTricks = [
            ...selectRandomUnique(easyPool, countEasy),
            ...selectRandomUnique(mediumPool, countMedium)
        ];
        break;
      case Difficulty.HARD:
        countEasy = Math.round(targetCount * 0.10);
        countMedium = Math.round(targetCount * 0.30);
        countAdvanced = targetCount - countEasy - countMedium;
        selectedTricks = [
            ...selectRandomUnique(easyPool, countEasy),
            ...selectRandomUnique(mediumPool, countMedium),
            ...selectRandomUnique(hardPool, countAdvanced)
        ];
        break;
      case Difficulty.PRO:
        countEasy = Math.round(targetCount * 0.05);
        countMedium = Math.round(targetCount * 0.20);
        countAdvanced = targetCount - countEasy - countMedium;
        selectedTricks = [
            ...selectRandomUnique(easyPool, countEasy),
            ...selectRandomUnique(mediumPool, countMedium),
            ...selectRandomUnique(advancedPool, countAdvanced)
        ];
        break;
    }

    if (selectedTricks.length < targetCount) {
        const remaining = targetCount - selectedTricks.length;
        const filler = selectRandomUnique(categoryTricks, remaining);
        selectedTricks = [...selectedTricks, ...filler];
    }

    selectedTricks = selectedTricks.sort(() => 0.5 - Math.random());
    
    return selectedTricks.map((trick, index) => ({
      ...trick,
      id: `${trick.id}-${Date.now()}-${index}`,
      stance: getRandomStance(settings.selectedStances)
    }));
  };

  const handleStartSession = async (settings: SessionSettings) => {
    setIsGenerating(true);
    try {
      let tricks: Trick[] = [];

      if (settings.useAI) {
        tricks = await generateAISession(settings);
      } 
      
      if (tricks.length === 0) {
        tricks = generateLocalTricks(settings);
      }

      setActiveTricks(tricks);
      setView('ACTIVE_SESSION');
    } catch (e) {
      console.error("Failed to start session", e);
      setActiveTricks(generateLocalTricks(settings));
      setView('ACTIVE_SESSION');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSessionComplete = async (result: SessionResult) => {
    setLastResult(result);
    setSessionHistory(prev => {
        const newHistory = [result, ...prev];
        localStorage.setItem('skate_session_history', JSON.stringify(newHistory));
        return newHistory;
    });

    if (user) {
        await dbService.saveSession(user.uid, result);
    }
    setView('SUMMARY');
  };

  const handleAbort = () => {
    if (confirm(t.CONFIRM_ABORT)) {
      setView('DASHBOARD');
    }
  };

  const renderContent = () => {
    if (isAuthChecking) {
        return (
            <div className="flex flex-col items-center justify-center h-full space-y-4">
                <div className="w-12 h-12 border-4 border-skate-neon rounded-full border-t-transparent animate-spin"></div>
            </div>
        );
    }

    if (isLoadingData && view === 'DASHBOARD') {
        return <div className="flex items-center justify-center h-full text-skate-neon animate-pulse font-display text-xl tracking-widest">SYNCING DATA...</div>;
    }

    switch (view) {
        case 'DASHBOARD':
             return (
                <Dashboard 
                    onStart={() => setView('SETUP')} 
                    onLearning={() => setView('LEARNING')}
                    history={sessionHistory} 
                    language={language}
                    onLanguageToggle={toggleLanguage}
                    daysSkating={daysSkating}
                    startDate={startDate}
                    onUpdateStartDate={updateStartDate}
                    user={user}
                    onLogin={handleLogin}
                    onLogout={handleLogout}
                />
             );
        case 'ANALYTICS':
             return (
                <Analytics 
                  history={sessionHistory} 
                  language={language} 
                  daysSkating={daysSkating}
                  user={user}
                  onLogin={handleLogin}
                />
             );
        case 'LEARNING':
             return <TrickLearning language={language} />;
        case 'SETUP':
             return (
                <SessionSetup 
                  onStart={handleStartSession} 
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
                  onAbort={handleAbort}
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
        default:
            return null;
    }
  };

  const showNav = ['DASHBOARD', 'ANALYTICS', 'LEARNING'].includes(view);

  return (
    <div className="h-[100dvh] w-full text-white font-sans overflow-hidden flex flex-col">
      <div className="flex-1 overflow-hidden relative">
        {renderContent()}
      </div>

      {showNav && (
        <div className="absolute bottom-6 left-0 right-0 px-6 z-50 pointer-events-none">
            <div className="glass-nav rounded-full px-2 py-2 flex justify-between items-center shadow-2xl pointer-events-auto max-w-sm mx-auto">
                <button 
                    onClick={() => setView('DASHBOARD')}
                    className={`flex flex-col items-center justify-center w-14 h-14 rounded-full transition-all duration-300 ${view === 'DASHBOARD' ? 'bg-skate-neon text-black shadow-[0_0_15px_rgba(204,255,0,0.5)] transform -translate-y-2' : 'text-gray-400 hover:text-white'}`}
                >
                    <Home className={`w-6 h-6 ${view === 'DASHBOARD' ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                </button>
                <button 
                    onClick={() => setView('LEARNING')}
                    className={`flex flex-col items-center justify-center w-14 h-14 rounded-full transition-all duration-300 ${view === 'LEARNING' ? 'bg-skate-neon text-black shadow-[0_0_15px_rgba(204,255,0,0.5)] transform -translate-y-2' : 'text-gray-400 hover:text-white'}`}
                >
                    <BookOpen className={`w-6 h-6 ${view === 'LEARNING' ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                </button>
                <button 
                    onClick={() => setView('ANALYTICS')}
                    className={`flex flex-col items-center justify-center w-14 h-14 rounded-full transition-all duration-300 ${view === 'ANALYTICS' ? 'bg-skate-neon text-black shadow-[0_0_15px_rgba(204,255,0,0.5)] transform -translate-y-2' : 'text-gray-400 hover:text-white'}`}
                >
                    <BarChart2 className={`w-6 h-6 ${view === 'ANALYTICS' ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                </button>
            </div>
        </div>
      )}
    </div>
  );
};

export default App;
