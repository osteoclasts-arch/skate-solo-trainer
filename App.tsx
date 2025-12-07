

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
import { onAuthStateChanged } from 'firebase/auth';
import { Home, BarChart2, BookOpen } from 'lucide-react';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('DASHBOARD');
  const [activeTricks, setActiveTricks] = useState<Trick[]>([]);
  
  // User Authentication State
  const [user, setUser] = useState<User | null>(null);

  // Initialize session history from localStorage
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
    return (localStorage.getItem('skate_app_language') as Language) || 'EN';
  });

  // Profile State
  const [startDate, setStartDate] = useState<string>(() => {
      return localStorage.getItem('skate_start_date') || new Date().toISOString().split('T')[0];
  });

  // Handle Authentication Persistence
  useEffect(() => {
    const auth = getFirebaseAuth();
    if (auth) {
      const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        if (firebaseUser) {
          setUser({
            uid: firebaseUser.uid,
            name: firebaseUser.displayName || 'Skater',
            email: firebaseUser.email || '',
            photoURL: firebaseUser.photoURL || undefined
          });
        } else {
          setUser(null);
        }
      });
      return () => unsubscribe();
    } else {
      // Fallback: Check local storage for mock user persistence if needed
      // For now, we assume mock session is per-reload unless we impl local storage for it
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
  };

  const updateStartDate = (date: string) => {
      setStartDate(date);
      localStorage.setItem('skate_start_date', date);
  };

  const calculateDaysSkating = () => {
      const start = new Date(startDate);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      return diffDays || 1; // Minimum 1 day
  };

  const daysSkating = calculateDaysSkating();

  const toggleLanguage = () => {
    const newLang = language === 'EN' ? 'KR' : 'EN';
    setLanguage(newLang);
    localStorage.setItem('skate_app_language', newLang);
  };

  const t = TRANSLATIONS[language];

  // Weighted Random Stance Generator based on selected stances
  const getRandomStance = (allowed: Stance[]): Stance => {
    if (allowed.length === 0) return Stance.REGULAR;
    if (allowed.length === 1) return allowed[0];

    // Base weights from requirement
    const weights: Record<Stance, number> = {
        [Stance.REGULAR]: 0.40,
        [Stance.FAKIE]: 0.25,
        [Stance.SWITCH]: 0.20,
        [Stance.NOLLIE]: 0.15
    };

    // Calculate total weight of selected stances
    let totalWeight = 0;
    allowed.forEach(s => totalWeight += weights[s]);

    // Random value between 0 and totalWeight
    const r = Math.random() * totalWeight;

    let cumulative = 0;
    for (const s of allowed) {
        cumulative += weights[s];
        if (r <= cumulative) return s;
    }
    return allowed[0];
  };

  // Logic: Weighted Trick Generation based on Difficulty
  const generateLocalTricks = (settings: SessionSettings): Trick[] => {
    // 1. Filter by Category first
    const categoryTricks = BASE_TRICKS.filter(t => settings.categories.includes(t.category));
    
    // 2. Separate into Pools
    const easyPool = categoryTricks.filter(t => t.difficulty === Difficulty.EASY);
    const mediumPool = categoryTricks.filter(t => t.difficulty === Difficulty.MEDIUM);
    const hardPool = categoryTricks.filter(t => t.difficulty === Difficulty.HARD);
    const proPool = categoryTricks.filter(t => t.difficulty === Difficulty.PRO);
    
    // Combine Hard and Pro for "Advanced" logic
    const advancedPool = [...hardPool, ...proPool];

    let selectedTricks: Trick[] = [];
    const targetCount = settings.trickCount;

    // Helper to select N random items from a pool
    const selectRandom = (pool: Trick[], count: number) => {
        if (pool.length === 0) return [];
        const result = [];
        for (let i = 0; i < count; i++) {
            const randomTrick = pool[Math.floor(Math.random() * pool.length)];
            result.push({ ...randomTrick });
        }
        return result;
    };

    // 3. Apply Weighted Logic
    let countEasy = 0;
    let countMedium = 0;
    let countAdvanced = 0;

    switch (settings.difficulty) {
      case Difficulty.EASY:
        // Easy: 100% Easy
        selectedTricks = selectRandom(easyPool, targetCount);
        break;

      case Difficulty.MEDIUM:
        // Medium: 30% Easy, 70% Medium
        countEasy = Math.round(targetCount * 0.30);
        countMedium = targetCount - countEasy;
        
        selectedTricks = [
            ...selectRandom(easyPool, countEasy),
            ...selectRandom(mediumPool, countMedium)
        ];
        break;

      case Difficulty.HARD:
        // Hard: 10% Easy, 30% Medium, 60% Advanced (Hard)
        countEasy = Math.round(targetCount * 0.10);
        countMedium = Math.round(targetCount * 0.30);
        countAdvanced = targetCount - countEasy - countMedium;

        selectedTricks = [
            ...selectRandom(easyPool, countEasy),
            ...selectRandom(mediumPool, countMedium),
            ...selectRandom(hardPool, countAdvanced) // Using specific Hard pool
        ];
        break;

      case Difficulty.PRO:
        // Pro: 5% Easy, 20% Medium, 75% Advanced (Pro/Hard mix)
        countEasy = Math.round(targetCount * 0.05);
        countMedium = Math.round(targetCount * 0.20);
        countAdvanced = targetCount - countEasy - countMedium;

        selectedTricks = [
            ...selectRandom(easyPool, countEasy),
            ...selectRandom(mediumPool, countMedium),
            ...selectRandom(advancedPool, countAdvanced) // Using Hard+Pro
        ];
        break;
    }

    // Fallback if pools empty
    if (selectedTricks.length < targetCount) {
        const remaining = targetCount - selectedTricks.length;
        const filler = selectRandom(categoryTricks, remaining);
        selectedTricks = [...selectedTricks, ...filler];
    }

    // 4. Shuffle Final List
    selectedTricks = selectedTricks.sort(() => 0.5 - Math.random());
    
    // 5. Apply Random Stances & Unique IDs
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

  const handleSessionComplete = (result: SessionResult) => {
    setLastResult(result);
    setSessionHistory(prev => {
        const newHistory = [result, ...prev];
        // Persist to localStorage
        localStorage.setItem('skate_session_history', JSON.stringify(newHistory));
        return newHistory;
    });
    setView('SUMMARY');
  };

  const handleAbort = () => {
    if (confirm(t.CONFIRM_ABORT)) {
      setView('DASHBOARD');
    }
  };

  const renderContent = () => {
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
                />
             );
        case 'LEARNING':
             return <TrickLearning language={language} />;
        case 'SETUP':
             return (
                <SessionSetup 
                  onStart={handleStartSession} 
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
    <div className="h-screen w-full bg-black text-white font-sans overflow-hidden flex flex-col">
      
      <div className="flex-1 overflow-hidden relative">
        {renderContent()}
      </div>

      {showNav && (
        <div className="bg-black border-t border-gray-800 p-2 safe-area-pb">
            <div className="flex justify-around items-center">
                <button 
                    onClick={() => setView('DASHBOARD')}
                    className={`flex flex-col items-center p-2 rounded-xl w-1/3 transition-colors ${view === 'DASHBOARD' ? 'text-skate-neon' : 'text-gray-500'}`}
                >
                    <Home className="w-6 h-6 mb-1" />
                    <span className="text-xs font-bold uppercase">{t.DASHBOARD}</span>
                </button>
                <button 
                    onClick={() => setView('LEARNING')}
                    className={`flex flex-col items-center p-2 rounded-xl w-1/3 transition-colors ${view === 'LEARNING' ? 'text-skate-neon' : 'text-gray-500'}`}
                >
                    <BookOpen className="w-6 h-6 mb-1" />
                    <span className="text-xs font-bold uppercase">{t.LEARNING}</span>
                </button>
                <button 
                    onClick={() => setView('ANALYTICS')}
                    className={`flex flex-col items-center p-2 rounded-xl w-1/3 transition-colors ${view === 'ANALYTICS' ? 'text-skate-neon' : 'text-gray-500'}`}
                >
                    <BarChart2 className="w-6 h-6 mb-1" />
                    <span className="text-xs font-bold uppercase">{t.ANALYTICS}</span>
                </button>
            </div>
        </div>
      )}
    </div>
  );
};

export default App;