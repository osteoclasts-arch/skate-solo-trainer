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
import { loginAsGuest, logout, checkLocalSession } from './services/authService';
import { dbService } from './services/dbService';
import { Home, BarChart2, BookOpen, Layers, Eye, Instagram } from 'lucide-react';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('DASHBOARD');
  const [activeTricks, setActiveTricks] = useState<Trick[]>([]);
  
  // User Authentication State
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [showSplash, setShowSplash] = useState(true);

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

  // Minimum Splash Screen Duration
  useEffect(() => {
    const timer = setTimeout(() => {
        setShowSplash(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  // Handle Authentication (Local Storage Version)
  useEffect(() => {
    const initAuth = async () => {
        const localUser = checkLocalSession();
        if (localUser) {
            setUser(localUser);
            setIsLoadingData(true);
            try {
                // Load Profile
                const profile = await dbService.getUserProfile(localUser.uid);
                if (profile) {
                    if (profile.startDate) {
                        setStartDate(profile.startDate);
                    }
                    localUser.isPro = profile.isPro;
                    localUser.proRequestStatus = profile.proRequestStatus;
                    localUser.age = profile.age; // Load age
                    setUser({ ...localUser }); // Update with profile data
                }

                // Load History (Merge local history with DB history for seamlessness)
                const cloudSessions = await dbService.getUserSessions(localUser.uid);
                if (cloudSessions.length > 0) {
                    setSessionHistory(cloudSessions);
                    localStorage.setItem('skate_session_history', JSON.stringify(cloudSessions));
                }
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
    // If data provided (from Profile Setup), pass it to auth
    const loggedInUser = await loginAsGuest(data?.name, data?.age);
    if (loggedInUser) {
      setUser(loggedInUser);
      setIsLoadingData(true);
      
      // Update Start Date if provided
      if (data?.startDate) {
          await updateStartDate(data.startDate);
      }
      
      // Also save profile to DB if new fields provided
      if (data) {
          await dbService.updateUserProfile(loggedInUser.uid, {
              startDate: data.startDate,
              age: data.age
          });
      }

      // Load Profile
      const profile = await dbService.getUserProfile(loggedInUser.uid);
      if (profile && profile.startDate) {
          setStartDate(profile.startDate);
      }
      
      // Load Sessions
      const sessions = await dbService.getUserSessions(loggedInUser.uid);
      if (sessions.length > 0) setSessionHistory(sessions);
      
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
    
    // Save to Cloud (now Local DB) if logged in
    if (user) {
        await dbService.saveSession(user.uid, result);
    }

    setView('SUMMARY');
  };

  const renderView = () => {
    if (isAuthChecking || showSplash) {
        return (
            <div className="flex h-screen flex-col items-center justify-center bg-black space-y-12 animate-fade-in relative overflow-hidden">
                {/* Background ambient glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-skate-neon/10 rounded-full blur-[100px] animate-pulse-slow"></div>

                <div className="text-center relative z-10 scale-110">
                    <h1 className="text-[5rem] font-display font-bold text-white tracking-tighter leading-[0.85] mb-6">
                        보드<br/>
                        <span className="text-skate-neon text-glow drop-shadow-[0_0_15px_rgba(204,255,0,0.5)]">탈래말래</span>
                    </h1>
                    <div className="flex items-center justify-center space-x-3">
                        <div className="h-1 w-1 bg-gray-500 rounded-full animate-bounce"></div>
                        <div className="h-1 w-1 bg-white rounded-full animate-bounce delay-75"></div>
                        <div className="h-1 w-1 bg-skate-neon rounded-full animate-bounce delay-150"></div>
                    </div>
                </div>
                
                <div className="absolute bottom-16 flex flex-col items-center space-y-3 opacity-90">
                    <a 
                        href="https://instagram.com/osteoclasts_" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center space-x-2 bg-white/5 px-6 py-3 rounded-full border border-white/5 hover:bg-white/10 transition-colors animate-slide-up"
                    >
                        <Instagram className="w-5 h-5 text-gray-300" />
                        <span className="text-sm font-bold text-white tracking-widest font-display">
                            @OSTEOCLASTS_
                        </span>
                    </a>
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
            onLogin={() => {
                // For Analytics login, we can redirect to Dashboard or show a simple login
                // For simplicity, let's just trigger the dashboard logic by switching view temporarily or passing the handler down
                // Ideally analytics should have its own modal, but let's route to Dashboard for profile setup
                setView('DASHBOARD');
            }}
            onRequestPro={handleRequestPro}
          />
        );
      case 'LEARNING':
        return <TrickLearning language={language} />;
      case 'AI_VISION':
        return <AIVision language={language} user={user} />;
      default:
        return null;
    }
  };

  return (
    <div className="h-screen w-full bg-black text-white overflow-hidden font-sans relative">
      {renderView()}

      {/* Floating Island Navigation */}
      {!isAuthChecking && !showSplash && (view === 'DASHBOARD' || view === 'ANALYTICS' || view === 'LEARNING' || view === 'SUMMARY' || view === 'AI_VISION') && (
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