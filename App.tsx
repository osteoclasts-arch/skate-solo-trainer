import React, { useState, useEffect } from 'react';
import { ViewState, SessionSettings, Trick, SessionResult, Difficulty, Language, Stance, User } from './types';
import Dashboard from './components/Dashboard';
import SessionSetup from './components/SessionSetup';
import ActiveSession from './components/ActiveSession';
import SessionSummary from './components/SessionSummary';
import Analytics from './components/Analytics';
import TrickLearning from './components/TrickLearning';
import AIVision from './components/AIVision';
import LineGenerator from './components/LineGenerator';
import { BASE_TRICKS, TRANSLATIONS } from './constants';
import { generateAISession } from './services/geminiService';
import { loginAsGuest, logout, checkLocalSession } from './services/authService';
import { dbService } from './services/dbService';
import { Home, BarChart2, BookOpen, Eye, Instagram, ArrowUpRight } from 'lucide-react';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('DASHBOARD');
  const [activeTricks, setActiveTricks] = useState<Trick[]>([]);
  const [activeDifficulty, setActiveDifficulty] = useState<Difficulty>(Difficulty.AMATEUR_1);
  
  // User Authentication State
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [showSplash, setShowSplash] = useState(true);

  // Initialize session history from localStorage (Default for Guest fallback)
  const [sessionHistory, setSessionHistory] = useState<SessionResult[]>([]);

  const [lastResult, setLastResult] = useState<SessionResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Robust Language Initialization: Fixes 'undefined' errors
  const [language, setLanguage] = useState<Language>(() => {
    try {
        const saved = localStorage.getItem('skate_app_language');
        return (saved === 'EN' || saved === 'KR') ? (saved as Language) : 'KR';
    } catch {
        return 'KR';
    }
  });

  // Dark Mode State
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('skate_app_theme') === 'dark';
  });

  // Profile State
  const [startDate, setStartDate] = useState<string>(() => {
      return localStorage.getItem('skate_start_date') || new Date().toISOString().split('T')[0];
  });

  // Apply Dark Mode Class
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('skate_app_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('skate_app_theme', 'light');
    }
  }, [isDarkMode]);

  // Minimum Splash Screen Duration
  useEffect(() => {
    const timer = setTimeout(() => {
        setShowSplash(false);
    }, 2800); 
    return () => clearTimeout(timer);
  }, []);

  // Handle Authentication & Data Migration
  useEffect(() => {
    const initAuth = async () => {
        const localUser = checkLocalSession();
        if (localUser) {
            setUser(localUser);
            setIsLoadingData(true);
            try {
                // 1. Load Profile
                const profile = await dbService.getUserProfile(localUser.uid);
                if (profile) {
                    if (profile.startDate) {
                        setStartDate(profile.startDate);
                    }
                    localUser.isPro = profile.isPro;
                    localUser.proRequestStatus = profile.proRequestStatus;
                    localUser.age = profile.age; 
                    localUser.level = profile.level;
                    localUser.xp = profile.xp;
                    localUser.dailyQuests = profile.dailyQuests;
                    
                    // Mark login quest as complete if exists
                    if (localUser.dailyQuests) {
                        const loginQuest = localUser.dailyQuests.find(q => q.type === 'login');
                        if (loginQuest && !loginQuest.isCompleted) {
                            // We just set progress to 1/1 here, user claims it in UI
                             const questIdx = localUser.dailyQuests.indexOf(loginQuest);
                             const newQuests = [...localUser.dailyQuests];
                             newQuests[questIdx] = { ...loginQuest, progress: 1 };
                             localUser.dailyQuests = newQuests;
                             await dbService.updateUserProfile(localUser.uid, { dailyQuests: newQuests });
                        }
                    }

                    setUser({ ...localUser }); 
                }

                // 2. MIGRATE LEGACY DATA (Crucial for updates)
                // This ensures if the user had data before the DB structure update, it gets moved to their UID
                await dbService.migrateLegacySessions(localUser.uid);

                // 3. Load Sessions (from DB)
                const cloudSessions = await dbService.getUserSessions(localUser.uid);
                setSessionHistory(cloudSessions);
                
            } catch (e) {
                console.error("Error loading user data", e);
            } finally {
                setIsLoadingData(false);
            }
        }
        setIsAuthChecking(false);
    };

    initAuth();
  }, []);

  const handleLogin = async (data?: { name: string; age: number; startDate: string }) => {
    const loggedInUser = await loginAsGuest(data?.name, data?.age);
    if (loggedInUser) {
      setUser(loggedInUser);
      setIsLoadingData(true);
      
      // Update Start Date if provided
      if (data?.startDate) {
          await updateStartDate(data.startDate);
      }
      
      // Save profile to DB
      if (data) {
          await dbService.updateUserProfile(loggedInUser.uid, {
              startDate: data.startDate,
              age: data.age
          });
      }

      // Refresh Data
      const profile = await dbService.getUserProfile(loggedInUser.uid);
      if (profile) {
         if(profile.startDate) setStartDate(profile.startDate);
         setUser(prev => prev ? ({...prev, level: profile.level, xp: profile.xp, dailyQuests: profile.dailyQuests}) : null);
      }
      
      // Attempt migration just in case
      await dbService.migrateLegacySessions(loggedInUser.uid);

      const sessions = await dbService.getUserSessions(loggedInUser.uid);
      setSessionHistory(sessions);
      
      setIsLoadingData(false);
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
      start.setHours(0, 0, 0, 0);
      now.setHours(0, 0, 0, 0);
      
      const diffTime = now.getTime() - start.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      return Math.max(1, diffDays + 1);
  };

  const startSession = async (settings: SessionSettings) => {
    setIsGenerating(true);
    let tricks: Trick[] = [];

    setActiveDifficulty(settings.difficulty);

    if (settings.useAI) {
       tricks = await generateAISession(settings);
    } else {
       tricks = generateLocalTricks(settings);
    }
    
    if (tricks.length === 0) {
        tricks = generateLocalTricks(settings);
    }

    setActiveTricks(tricks);
    setIsGenerating(false);
    setView('ACTIVE_SESSION');
  };

  const generateLocalTricks = (settings: SessionSettings): Trick[] => {
      let filtered = BASE_TRICKS.filter(t => settings.categories.includes(t.category));
      filtered = filtered.filter(t => t.difficulty === settings.difficulty);
      
      if (filtered.length === 0) {
          filtered = BASE_TRICKS;
      }

      const shuffled = [...filtered].sort(() => 0.5 - Math.random());
      const selectedTricks = shuffled.slice(0, settings.trickCount);

      while (selectedTricks.length < settings.trickCount) {
          const randomTrick = filtered[Math.floor(Math.random() * filtered.length)];
          selectedTricks.push(randomTrick);
      }

      return selectedTricks.map((trick, index) => {
          const randomStance = settings.selectedStances[Math.floor(Math.random() * settings.selectedStances.length)];
          return {
              ...trick,
              id: `${trick.id}-${index}-${Date.now()}`,
              stance: randomStance
          };
      });
  };

  const handleSessionComplete = async (result: SessionResult) => {
    const newHistory = [result, ...sessionHistory];
    setSessionHistory(newHistory);
    setLastResult(result);
    
    if (user) {
        await dbService.saveSession(user.uid, result);
        
        if (user.dailyQuests) {
            let updatedQuests = [...user.dailyQuests];
            let hasUpdates = false;

            const sessionQuestIdx = updatedQuests.findIndex(q => q.type === 'session' && !q.isCompleted);
            if (sessionQuestIdx !== -1) {
                updatedQuests[sessionQuestIdx].progress += 1;
                hasUpdates = true;
            }

            const landQuestIdx = updatedQuests.findIndex(q => q.type === 'land_tricks' && !q.isCompleted);
            if (landQuestIdx !== -1) {
                updatedQuests[landQuestIdx].progress += result.landedCount;
                hasUpdates = true;
            }

            const perfectQuestIdx = updatedQuests.findIndex(q => q.type === 'perfect_session' && !q.isCompleted);
            if (perfectQuestIdx !== -1 && result.letters === '') { 
                updatedQuests[perfectQuestIdx].progress += 1;
                hasUpdates = true;
            }

            if (hasUpdates) {
                await dbService.updateUserProfile(user.uid, { dailyQuests: updatedQuests });
                setUser(prev => prev ? ({ ...prev, dailyQuests: updatedQuests }) : null);
            }
        }
    } else {
        localStorage.setItem('skate_session_history', JSON.stringify(newHistory));
    }

    setView('SUMMARY');
  };

  const renderView = () => {
    if (isAuthChecking || showSplash) {
        return (
            <div className="flex h-screen w-full flex-col items-center justify-center bg-[#E5E5E5] space-y-4 font-sans select-none overflow-hidden">
                <div className="grid grid-cols-2 gap-4">
                    <div className="w-32 h-32 relative group animate-key-press" style={{ animationDelay: '0s' }}>
                        <div className="absolute inset-x-0 bottom-0 h-full rounded-[2rem] bg-[#D1D5DB]"></div>
                        <div className="absolute inset-x-0 top-0 h-[85%] rounded-[2rem] bg-[#F3F4F6] flex items-center justify-center shadow-sm">
                            <span className="text-4xl font-black text-[#1C1917] font-mono tracking-tighter">Do</span>
                        </div>
                    </div>
                    <div className="w-32 h-32 relative group animate-key-press" style={{ animationDelay: '0.2s' }}>
                        <div className="absolute inset-x-0 bottom-0 h-full rounded-[2rem] bg-[#D1D5DB]"></div>
                        <div className="absolute inset-x-0 top-0 h-[85%] rounded-[2rem] bg-[#F3F4F6] flex items-center justify-center shadow-sm">
                            <span className="text-4xl font-black text-[#1C1917] font-mono tracking-tighter">A</span>
                        </div>
                    </div>
                </div>
                <div className="w-[17rem] h-32 relative group animate-key-press" style={{ animationDelay: '0.4s' }}>
                    <div className="absolute inset-x-0 bottom-0 h-full rounded-[2rem] bg-skate-deepOrange"></div>
                    <div className="absolute inset-x-0 top-0 h-[85%] rounded-[2rem] bg-skate-orange flex items-center justify-center shadow-sm flex-col gap-1">
                        <span className="text-4xl font-black text-white font-mono tracking-tight italic">Kickflip!</span>
                        <ArrowUpRight className="w-8 h-8 text-white/80" />
                    </div>
                </div>
            </div>
        );
    }

    switch (view) {
      case 'DASHBOARD':
        return (
          <Dashboard 
            onStart={() => setView('SETUP')} 
            onLearning={() => setView('LEARNING')}
            onLineGen={() => setView('LINE_GENERATOR')}
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
            onRequestPro={handleRequestPro}
            isDarkMode={isDarkMode}
            onToggleTheme={() => setIsDarkMode(!isDarkMode)}
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
            difficulty={activeDifficulty}
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
            onLogin={() => {
                setView('DASHBOARD');
            }}
            onRequestPro={handleRequestPro}
          />
        );
      case 'LEARNING':
        return <TrickLearning language={language} />;
      case 'AI_VISION':
        return <AIVision language={language} user={user} />;
      case 'LINE_GENERATOR':
        return <LineGenerator language={language} user={user} onBack={() => setView('DASHBOARD')} />;
      default:
        return null;
    }
  };

  return (
    <div className={`h-screen w-full bg-skate-bg dark:bg-zinc-950 text-skate-black dark:text-white overflow-hidden font-sans relative transition-colors duration-300`}>
      {renderView()}

      {!isAuthChecking && !showSplash && (view === 'DASHBOARD' || view === 'ANALYTICS' || view === 'LEARNING' || view === 'SUMMARY' || view === 'AI_VISION' || view === 'LINE_GENERATOR') && (
         <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 w-auto z-50">
            <nav className="glass-nav rounded-full px-6 py-4 flex items-center gap-6 shadow-pop">
                <button 
                    onClick={() => setView('DASHBOARD')}
                    className={`transition-all duration-300 p-2 rounded-full ${view === 'DASHBOARD' ? 'bg-skate-yellow text-skate-black' : 'text-gray-400 hover:text-white'}`}
                >
                    <Home className="w-5 h-5" />
                </button>
                <button 
                    onClick={() => setView('LEARNING')}
                    className={`transition-all duration-300 p-2 rounded-full ${view === 'LEARNING' ? 'bg-skate-yellow text-skate-black' : 'text-gray-400 hover:text-white'}`}
                >
                    <BookOpen className="w-5 h-5" />
                </button>
                 <button 
                    onClick={() => setView('AI_VISION')}
                    className={`transition-all duration-300 p-2 rounded-full ${view === 'AI_VISION' ? 'bg-skate-yellow text-skate-black' : 'text-gray-400 hover:text-white'}`}
                >
                    <Eye className="w-5 h-5" />
                </button>
                <button 
                    onClick={() => setView('ANALYTICS')}
                    className={`transition-all duration-300 p-2 rounded-full ${view === 'ANALYTICS' ? 'bg-skate-yellow text-skate-black' : 'text-gray-400 hover:text-white'}`}
                >
                    <BarChart2 className="w-5 h-5" />
                </button>
            </nav>
         </div>
      )}
    </div>
  );
};

export default App;