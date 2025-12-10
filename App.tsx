import React, { useState, useEffect } from 'react';
import { ViewState, SessionSettings, Trick, SessionResult, Difficulty, Language, Stance, User, Quest } from './types';
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
import { Home, BarChart2, BookOpen, Eye, ListVideo, Sparkles, User as UserIcon, Instagram } from 'lucide-react';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('DASHBOARD');
  const [activeTricks, setActiveTricks] = useState<Trick[]>([]);
  const [activeDifficulty, setActiveDifficulty] = useState<Difficulty>(Difficulty.AMATEUR_1);
  
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const [sessionHistory, setSessionHistory] = useState<SessionResult[]>([]);
  const [lastResult, setLastResult] = useState<SessionResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Theme State
  const [isDarkMode, setIsDarkMode] = useState(() => {
      // Default to true (Dark) if not set, or check preference
      const saved = localStorage.getItem('skate_app_theme');
      if (saved) return saved === 'dark';
      return true; 
  });
  
  const [language, setLanguage] = useState<Language>(() => {
    try {
        const saved = localStorage.getItem('skate_app_language');
        return (saved === 'EN' || saved === 'KR') ? (saved as Language) : 'KR';
    } catch { return 'KR'; }
  });

  const [startDate, setStartDate] = useState<string>(() => {
      const saved = localStorage.getItem('skate_start_date');
      if (saved) return saved;
      
      // Fix: Use local time for default start date to avoid timezone issues (e.g. UTC vs KST causing Day 2 instantly)
      const date = new Date();
      const offset = date.getTimezoneOffset() * 60000;
      return new Date(date.getTime() - offset).toISOString().split('T')[0];
  });

  // Apply Theme Class
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('skate_app_theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  useEffect(() => {
    const timer = setTimeout(() => { setShowSplash(false); }, 2000); 
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const initAuth = async () => {
        const localUser = checkLocalSession();
        if (localUser) {
            setUser(localUser);
            setIsLoadingData(true);
            try {
                const profile = await dbService.getUserProfile(localUser.uid);
                if (profile) {
                    if (profile.startDate) setStartDate(profile.startDate);
                    localUser.isPro = profile.isPro;
                    localUser.proRequestStatus = profile.proRequestStatus;
                    localUser.age = profile.age; 
                    localUser.level = profile.level;
                    localUser.xp = profile.xp;
                    localUser.dailyQuests = profile.dailyQuests;
                    localUser.skateDates = profile.skateDates;
                    setUser({ ...localUser }); 
                    
                    // Check Login Quest
                    if (profile.dailyQuests) {
                        await checkQuestProgress(profile.dailyQuests, 'login', localUser.uid);
                    }
                }
                await dbService.migrateLegacySessions(localUser.uid);
                const cloudSessions = await dbService.getUserSessions(localUser.uid);
                setSessionHistory(cloudSessions);
            } catch (e) { console.error("Error loading user data", e); } 
            finally { setIsLoadingData(false); }
        }
        setIsAuthChecking(false);
    };
    initAuth();
  }, []);

  const toggleTheme = () => setIsDarkMode(prev => !prev);

  const handleLogin = async (data?: { name: string; age: number; startDate: string }) => {
    const loggedInUser = await loginAsGuest(data?.name, data?.age);
    if (loggedInUser) {
      setUser(loggedInUser);
      setIsLoadingData(true);
      if (data?.startDate) await updateStartDate(data.startDate);
      if (data) await dbService.updateUserProfile(loggedInUser.uid, { startDate: data.startDate, age: data.age });
      
      const profile = await dbService.getUserProfile(loggedInUser.uid);
      if (profile) {
         if(profile.startDate) setStartDate(profile.startDate);
         setUser(prev => prev ? ({...prev, level: profile.level, xp: profile.xp, dailyQuests: profile.dailyQuests, skateDates: profile.skateDates}) : null);
         if (profile.dailyQuests) await checkQuestProgress(profile.dailyQuests, 'login', loggedInUser.uid);
      }
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
      if (user) await dbService.updateUserProfile(user.uid, { startDate: date });
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
      return Math.max(1, Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
  };

  const handleToggleSkateDate = async (date: string) => {
      if (user) {
          const newDates = await dbService.toggleSkateDate(user.uid, date);
          setUser(prev => prev ? ({ ...prev, skateDates: newDates }) : null);
      }
  };

  // Central Quest Logic
  const checkQuestProgress = async (
      currentQuests: Quest[], 
      triggerType: 'login' | 'session' | 'practice' | 'land_tricks' | 'perfect_session',
      uid: string,
      details?: { result?: SessionResult, trickId?: string }
  ) => {
      let updated = false;
      const newQuests = currentQuests.map(q => {
          if (q.isCompleted) return q;
          
          let increment = 0;
          if (triggerType === 'login' && q.type === 'login') increment = 1;
          
          if (triggerType === 'session' && q.type === 'session') increment = 1;

          if (triggerType === 'perfect_session' && q.type === 'perfect_session') {
               if (details?.result?.letters === '') increment = 1;
          }

          if (triggerType === 'land_tricks' && q.type === 'land_tricks' && details?.result) {
               if (q.targetTrickId) {
                   // Count specific trick lands
                   const count = details.result.trickHistory.filter(t => t.landed && t.trick.id === q.targetTrickId).length;
                   increment = count;
               } else {
                   // Count any trick lands
                   increment = details.result.landedCount;
               }
          }

          if (triggerType === 'practice' && q.type === 'practice' && details?.trickId) {
               if (!q.targetTrickId || q.targetTrickId === details.trickId) {
                   increment = 1;
               }
          }

          if (increment > 0) {
              updated = true;
              const newProgress = Math.min(q.target, q.progress + increment);
              return { ...q, progress: newProgress };
          }
          return q;
      });

      if (updated) {
          await dbService.updateUserProfile(uid, { dailyQuests: newQuests });
          setUser(prev => prev ? ({ ...prev, dailyQuests: newQuests }) : null);
      }
  };

  const handleTrickPractice = async (trickId: string) => {
      if (user && user.dailyQuests) {
          await checkQuestProgress(user.dailyQuests, 'practice', user.uid, { trickId });
      }
  }

  const startSession = async (settings: SessionSettings) => {
    setIsGenerating(true);
    let tricks: Trick[] = [];
    setActiveDifficulty(settings.difficulty);
    if (settings.useAI) tricks = await generateAISession(settings);
    else tricks = generateLocalTricks(settings);
    if (tricks.length === 0) tricks = generateLocalTricks(settings);
    setActiveTricks(tricks);
    setIsGenerating(false);
    setView('ACTIVE_SESSION');
  };

  const generateLocalTricks = (settings: SessionSettings): Trick[] => {
      let filtered = BASE_TRICKS.filter(t => settings.categories.includes(t.category));
      filtered = filtered.filter(t => t.difficulty === settings.difficulty);
      if (filtered.length === 0) filtered = BASE_TRICKS;
      const shuffled = [...filtered].sort(() => 0.5 - Math.random());
      const selectedTricks = shuffled.slice(0, settings.trickCount);
      while (selectedTricks.length < settings.trickCount) {
          const randomTrick = filtered[Math.floor(Math.random() * filtered.length)];
          selectedTricks.push(randomTrick);
      }
      return selectedTricks.map((trick, index) => {
          const randomStance = settings.selectedStances[Math.floor(Math.random() * settings.selectedStances.length)];
          return { ...trick, id: `${trick.id}-${index}-${Date.now()}`, stance: randomStance };
      });
  };

  const handleSessionComplete = async (result: SessionResult) => {
    const newHistory = [result, ...sessionHistory];
    setSessionHistory(newHistory);
    setLastResult(result);
    if (user) {
        await dbService.saveSession(user.uid, result);
        
        // Update Quests
        if (user.dailyQuests) {
            // Trigger 3 types of updates
            await checkQuestProgress(user.dailyQuests, 'session', user.uid, { result });
            await checkQuestProgress(user.dailyQuests, 'land_tricks', user.uid, { result });
            await checkQuestProgress(user.dailyQuests, 'perfect_session', user.uid, { result });
        }
    } else {
        localStorage.setItem('skate_session_history', JSON.stringify(newHistory));
    }
    setView('SUMMARY');
  };

  const renderView = () => {
    if (isAuthChecking || showSplash) {
        return (
            <div className="flex h-screen w-full flex-col items-center justify-center bg-white dark:bg-black font-sans relative overflow-hidden transition-colors duration-300">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-crit-accent rounded-full blur-[150px] opacity-20 animate-pulse-slow"></div>
                
                {/* Text Logo Wordmark */}
                <div className="relative z-10 flex flex-col items-center animate-slide-up">
                    <div className="relative flex items-center justify-center">
                        <h1 className="text-7xl md:text-9xl font-black text-black dark:text-white tracking-tighter leading-none z-10 select-none">
                            crete
                        </h1>
                        <Sparkles className="absolute -top-4 -right-8 w-10 h-10 md:w-14 md:h-14 text-crit-accent fill-crit-accent z-20 animate-bounce-subtle" />
                    </div>
                </div>

                {/* FOOTER */}
                <div className="absolute bottom-10 z-20 flex flex-col items-center animate-fade-in text-gray-400 dark:text-gray-600 text-[10px] font-bold tracking-widest delay-300">
                    <span className="opacity-50">CREATED BY</span>
                    <a href="https://instagram.com/osteoclasts_" target="_blank" rel="noreferrer" className="mt-2 flex items-center gap-1.5 text-black dark:text-white hover:text-crit-accent dark:hover:text-crit-accent transition-colors">
                        <Instagram className="w-3 h-3" />
                        <span>@osteoclasts_</span>
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
            onLineGen={() => setView('LINE_GENERATOR')}
            onAnalytics={() => setView('ANALYTICS')}
            history={sessionHistory}
            language={language}
            onLanguageToggle={() => setLanguage(l => { const next = l === 'EN' ? 'KR' : 'EN'; localStorage.setItem('skate_app_language', next); return next; })}
            daysSkating={calculateDaysSkating()}
            startDate={startDate}
            onUpdateStartDate={updateStartDate}
            user={user}
            onLogin={handleLogin}
            onLogout={handleLogout}
            onRequestPro={handleRequestPro}
            isDarkMode={isDarkMode}
            onToggleTheme={toggleTheme}
            skateDates={user?.skateDates}
            onToggleDate={handleToggleSkateDate}
          />
        );
      case 'SETUP': return <SessionSetup onStart={startSession} onBack={() => setView('DASHBOARD')} isGenerating={isGenerating} language={language} />;
      case 'ACTIVE_SESSION': return <ActiveSession tricks={activeTricks} difficulty={activeDifficulty} onComplete={handleSessionComplete} onAbort={() => setView('DASHBOARD')} language={language} />;
      case 'SUMMARY': return lastResult ? <SessionSummary result={lastResult} onHome={() => setView('DASHBOARD')} language={language} /> : null;
      case 'ANALYTICS': return <Analytics history={sessionHistory} language={language} daysSkating={calculateDaysSkating()} user={user} onLogin={() => setView('DASHBOARD')} onRequestPro={handleRequestPro} />;
      case 'LEARNING': return <TrickLearning language={language} onPractice={handleTrickPractice} />;
      case 'AI_VISION': return <AIVision language={language} user={user} />;
      case 'LINE_GENERATOR': return <LineGenerator language={language} user={user} onBack={() => setView('DASHBOARD')} />;
      default: return null;
    }
  };

  return (
    <div className="h-screen w-full bg-gray-50 dark:bg-crit-bg text-black dark:text-white overflow-hidden font-sans relative selection:bg-crit-accent transition-colors duration-300">
      {renderView()}

      {!isAuthChecking && !showSplash && (view === 'DASHBOARD' || view === 'ANALYTICS' || view === 'LEARNING' || view === 'SUMMARY' || view === 'AI_VISION' || view === 'LINE_GENERATOR') && (
         <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-[300px]">
            <nav className="glass-nav rounded-[2rem] px-2 py-2 flex items-center justify-between shadow-2xl transition-all duration-300">
                {[
                  { id: 'DASHBOARD', icon: Home, label: 'Home' },
                  { id: 'LEARNING', icon: BookOpen, label: 'Guide' },
                  { id: 'AI_VISION', icon: Eye, label: 'Vision' },
                  { id: 'ANALYTICS', icon: BarChart2, label: 'Stats' }
                ].map((item) => (
                    <button 
                        key={item.id}
                        onClick={() => setView(item.id as ViewState)}
                        className={`p-3.5 rounded-full transition-all duration-300 relative group ${
                            view === item.id 
                            ? 'bg-crit-accent text-black shadow-[0_0_15px_rgba(230,255,0,0.4)]' 
                            : 'text-gray-400 dark:text-gray-500 hover:text-black dark:hover:text-white'
                        }`}
                    >
                        <item.icon className={`w-5 h-5 ${view === item.id ? 'stroke-[3px]' : 'stroke-2'}`} />
                        {view === item.id && (
                          <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[10px] font-bold text-crit-accent dark:text-crit-accent opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-black/80 px-2 py-1 rounded-md pointer-events-none">
                            {item.label}
                          </span>
                        )}
                    </button>
                ))}
            </nav>
         </div>
      )}
    </div>
  );
};

export default App;