import React, { useState, useEffect } from 'react';
import { TRANSLATIONS } from '../constants';
import { Play, BookOpen, Eye, Edit2, LogOut, CheckCircle, Zap, UserPlus, Calendar, ArrowUpRight, TrendingUp, Target, Shield, Check, Star, X, MapPin, Moon, Sun, Instagram } from 'lucide-react';
import { SessionResult, Language, User as UserType, Quest } from '../types';
import { dbService } from '../services/dbService';

interface Props {
  onStart: () => void;
  onLearning: () => void;
  history: SessionResult[];
  language: Language;
  onLanguageToggle: () => void;
  daysSkating: number;
  startDate: string;
  onUpdateStartDate: (date: string) => void;
  user: UserType | null;
  onLogin: (data?: { name: string; age: number; startDate: string }) => void;
  onLogout: () => void;
  onRequestPro: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

const STREET_SPOTS = [
  "용두공원", 
  "코엑스 앞", 
  "서울대 정문", 
  "낙성대 공원", 
  "신대방 (다리 밑)", 
  "디디미 (다리 밑)", 
  "이촌 한강공원"
];

const PARK_SPOTS = [
  "뚝섬 한강공원", 
  "보라매 x게임장 (헬멧 필수)", 
  "서울숲 스케이트파크", 
  "컬트 (훈련원 공원)", 
  "난지 파크", 
  "K88 (실내 파크)", 
  "트랜지션 정글 (실내 파크)", 
  "크래프터 평택 (실내 파크)"
];

const Dashboard: React.FC<Props> = ({ 
    onStart, 
    onLearning, 
    history, 
    language, 
    onLanguageToggle,
    daysSkating,
    startDate,
    onUpdateStartDate,
    user,
    onLogin,
    onLogout,
    onRequestPro,
    isDarkMode,
    onToggleTheme
}) => {
  // Add fallback to avoid crash if language key is missing (e.g. initial load or corrupted state)
  const t = TRANSLATIONS[language] || TRANSLATIONS['KR'];
  
  const [isEditingDate, setIsEditingDate] = useState(false);
  const [tempDate, setTempDate] = useState(startDate);

  // Profile Setup State
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [setupName, setSetupName] = useState("");
  const [setupAge, setSetupAge] = useState("");
  const [setupDate, setSetupDate] = useState(startDate);

  // Gamification State
  const [dailyQuests, setDailyQuests] = useState<Quest[]>([]);
  const [xp, setXp] = useState(0);
  const [showLevelModal, setShowLevelModal] = useState(false);

  // Location Suggestion State
  const [suggestedSpot, setSuggestedSpot] = useState("");
  
  // Spot List Modal State
  const [spotListModal, setSpotListModal] = useState<{ title: string, spots: string[] } | null>(null);

  useEffect(() => {
    if (language === 'KR') {
        const isRainyMood = Math.random() < 0.15; 
        const sunnySpots = ["뚝섬 한강공원", "보라매 x게임장 (헬멧 필수)", "서울숲 스케이트파크", "컬트 (훈련원 공원)", "난지 파크", "이촌 한강공원", "용두공원", "코엑스 앞", "서울대 정문", "낙성대 공원"];
        const rainySpots = ["신대방 (다리 밑)", "디디미 (다리 밑)", "K88 (실내 파크)", "트랜지션 정글 (실내 파크)", "크래프터 평택 (실내 파크)", "집 거실 (카페트 보딩)"];

        if (isRainyMood) {
            const spot = rainySpots[Math.floor(Math.random() * rainySpots.length)];
            setSuggestedSpot(`혹시 비가 오나요? ${spot} 추천!`);
        } else {
            const spot = sunnySpots[Math.floor(Math.random() * sunnySpots.length)];
            setSuggestedSpot(`오늘은 ${spot} 어때요?`);
        }
    } else {
        const spots = ["the local park", "a covered spot", "the skatepark", "a street spot", "your garage"];
        const spot = spots[Math.floor(Math.random() * spots.length)];
        setSuggestedSpot(`How about ${spot} today?`);
    }
  }, [language]);

  useEffect(() => {
    if (user) {
        if (user.dailyQuests) setDailyQuests(user.dailyQuests);
        if (user.xp !== undefined) setXp(user.xp);
    }
  }, [user]);

  const getDisplayStatus = () => {
      if (user?.isPro) return { title: 'PRO', sub: `Professional`, isSpecial: true };
      if (daysSkating > 60) return { title: 'AMATEUR', sub: `Day ${daysSkating}`, isSpecial: true };
      return { title: `LV. ${daysSkating}`, sub: t.LEVEL_BEGINNER, isSpecial: false };
  };

  const status = getDisplayStatus();
  const completedQuestsCount = dailyQuests.filter(q => q.isCompleted).length;
  const totalQuestsCount = Math.max(1, dailyQuests.length);
  const dailyProgress = (completedQuestsCount / totalQuestsCount) * 100;

  const getCurrentTier = () => {
      if (user?.isPro) return 'PRO';
      if (daysSkating > 60) return 'AMATEUR';
      return 'BEGINNER';
  };
  const currentTier = getCurrentTier();

  const handleClaimQuest = async (questId: string) => {
      if (!user) { alert("Please login to claim rewards."); return; }
      const questIndex = dailyQuests.findIndex(q => q.id === questId);
      if (questIndex === -1) return;
      const quest = dailyQuests[questIndex];
      if (quest.progress < quest.target || quest.isCompleted) return;

      const newQuests = [...dailyQuests];
      newQuests[questIndex] = { ...quest, isCompleted: true };
      const gainedXp = quest.xp;
      const newTotalXp = xp + gainedXp;
      
      setDailyQuests(newQuests);
      setXp(newTotalXp);
      await dbService.updateUserProfile(user.uid, { dailyQuests: newQuests, xp: newTotalXp });
  };

  const handleSaveDate = () => { onUpdateStartDate(tempDate); setIsEditingDate(false); };

  const handleProfileSubmit = () => {
      if (!setupName.trim()) { alert(language === 'KR' ? "닉네임을 입력해주세요." : "Please enter a nickname."); return; }
      onLogin({ name: setupName, age: parseInt(setupAge) || 0, startDate: setupDate });
      setShowProfileSetup(false);
  };

  const recentSessions = history.slice(0, 3);

  return (
    <div className="flex flex-col h-full p-6 space-y-6 overflow-y-auto pb-32 relative animate-fade-in font-sans bg-skate-bg dark:bg-zinc-950 transition-colors duration-300">
      
      {/* Level Info Modal */}
      {showLevelModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in">
              <div className="bg-[#1C1917] dark:bg-zinc-900 w-full max-w-sm rounded-[2rem] p-6 text-white relative border border-gray-800 dark:border-zinc-800 shadow-2xl">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-2xl font-black flex items-center gap-2">
                         <Star className="text-skate-yellow fill-skate-yellow w-6 h-6" /> {t.LEVEL_INFO_TITLE}
                      </h3>
                      <button onClick={() => setShowLevelModal(false)} className="p-2 bg-gray-800 rounded-full hover:bg-gray-700"><X className="w-5 h-5" /></button>
                  </div>
                  <div className="space-y-4">
                      {/* Tiers */}
                      <div className={`p-5 rounded-2xl border transition-all ${currentTier === 'BEGINNER' ? 'bg-gray-800 border-gray-600' : 'bg-transparent border-gray-800 opacity-40'}`}>
                         <div className="flex justify-between items-center mb-2">
                            <span className={`font-bold text-lg ${currentTier === 'BEGINNER' ? 'text-white' : 'text-gray-500'}`}>{t.LEVEL_BEGINNER}</span>
                            <span className="font-mono text-xs text-gray-400 font-bold tracking-wider">{t.LEVEL_BEGINNER_RANGE}</span>
                         </div>
                         <p className="text-sm text-gray-400 leading-relaxed">{t.LEVEL_BEGINNER_DESC}</p>
                      </div>
                      <div className={`p-5 rounded-2xl border transition-all ${currentTier === 'AMATEUR' ? 'bg-[#2E1065] border-[#8B5CF6] shadow-[0_0_15px_rgba(139,92,246,0.3)]' : 'bg-transparent border-gray-800 opacity-40'}`}>
                         <div className="flex justify-between items-center mb-2">
                            <span className={`font-bold text-lg ${currentTier === 'AMATEUR' ? 'text-[#C4B5FD]' : 'text-gray-500'}`}>{t.LEVEL_INTERMEDIATE}</span>
                            <span className="font-mono text-xs text-gray-400 font-bold tracking-wider">{t.LEVEL_AMATEUR_RANGE}</span>
                         </div>
                         <p className="text-sm text-gray-400 leading-relaxed">{t.LEVEL_AMATEUR_DESC}</p>
                      </div>
                      <div className={`p-5 rounded-2xl border transition-all ${currentTier === 'PRO' ? 'bg-skate-yellow text-skate-black border-skate-yellow' : 'bg-transparent border-gray-800 opacity-40'}`}>
                         <div className="flex justify-between items-center mb-2">
                            <span className={`font-bold text-lg ${currentTier === 'PRO' ? 'text-skate-black' : 'text-gray-500'}`}>{t.LEVEL_ADVANCED}</span>
                            <span className="font-mono text-xs font-bold tracking-wider text-gray-400">{t.LEVEL_PRO_RANGE}</span>
                         </div>
                         <p className={`text-sm leading-relaxed mb-4 ${currentTier === 'PRO' ? 'text-skate-black/80' : 'text-gray-400'}`}>{t.LEVEL_PRO_DESC}</p>
                         {currentTier !== 'PRO' && (
                             <button onClick={onRequestPro} disabled={user?.proRequestStatus === 'pending'} className={`w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${user?.proRequestStatus === 'pending' ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-gray-800 text-white hover:bg-gray-700 border border-gray-700'}`}>
                                 <CheckCircle className="w-4 h-4" /> {user?.proRequestStatus === 'pending' ? t.REQUEST_PENDING : t.PRO_BTN_TEXT}
                             </button>
                         )}
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Date Edit Modal */}
      {isEditingDate && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in">
              <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] w-full max-w-sm shadow-2xl dark:border dark:border-zinc-800">
                  <h3 className="text-2xl font-bold text-skate-black dark:text-white mb-2">{t.SET_START_DATE}</h3>
                  <input type="date" value={tempDate} onChange={(e) => setTempDate(e.target.value)} className="w-full bg-skate-lightGray dark:bg-zinc-800 border-none rounded-2xl p-4 text-skate-black dark:text-white mb-6 focus:ring-2 focus:ring-skate-yellow outline-none" />
                  <div className="flex gap-3">
                      <button onClick={() => setIsEditingDate(false)} className="flex-1 py-4 bg-gray-100 dark:bg-zinc-800 text-gray-500 font-bold rounded-2xl hover:bg-gray-200 dark:hover:bg-zinc-700 transition-all">{t.CANCEL}</button>
                      <button onClick={handleSaveDate} className="flex-1 py-4 bg-skate-black dark:bg-white text-white dark:text-black font-bold rounded-2xl hover:bg-gray-800 transition-all">{t.SAVE}</button>
                  </div>
              </div>
          </div>
      )}

      {/* Profile Setup Modal */}
      {showProfileSetup && (
           <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in">
               <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] w-full max-w-sm shadow-2xl relative overflow-hidden dark:border dark:border-zinc-800">
                   <h3 className="text-3xl font-bold text-skate-black dark:text-white mb-2">{t.PROFILE_SETUP}</h3>
                   <div className="space-y-4 mt-6">
                       <input type="text" placeholder={t.ENTER_NICKNAME} value={setupName} onChange={(e) => setSetupName(e.target.value)} className="w-full bg-skate-lightGray dark:bg-zinc-800 border-none rounded-2xl p-4 text-skate-black dark:text-white focus:ring-2 focus:ring-skate-yellow outline-none" />
                       <input type="number" placeholder={t.AGE} value={setupAge} onChange={(e) => setSetupAge(e.target.value)} className="w-full bg-skate-lightGray dark:bg-zinc-800 border-none rounded-2xl p-4 text-skate-black dark:text-white focus:ring-2 focus:ring-skate-yellow outline-none" />
                       <input type="date" value={setupDate} onChange={(e) => setSetupDate(e.target.value)} className="w-full bg-skate-lightGray dark:bg-zinc-800 border-none rounded-2xl p-4 text-skate-black dark:text-white focus:ring-2 focus:ring-skate-yellow outline-none" />
                   </div>
                   <div className="flex gap-3 mt-8">
                       <button onClick={() => setShowProfileSetup(false)} className="flex-1 py-4 bg-gray-100 dark:bg-zinc-800 text-gray-500 font-bold rounded-2xl hover:bg-gray-200 dark:hover:bg-zinc-700 transition-all">{t.CANCEL}</button>
                       <button onClick={handleProfileSubmit} className="flex-1 py-4 bg-skate-yellow text-skate-black font-bold rounded-2xl hover:opacity-90 transition-all">{t.SAVE}</button>
                   </div>
               </div>
           </div>
      )}

      {/* Spot List Modal */}
      {spotListModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in">
              <div className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-[2rem] p-6 shadow-2xl relative overflow-hidden flex flex-col max-h-[80vh] dark:border dark:border-zinc-800">
                  <div className="flex justify-between items-center mb-6 shrink-0">
                      <h3 className="text-2xl font-black flex items-center gap-2 text-skate-black dark:text-white">
                         <MapPin className="text-skate-deep dark:text-skate-yellow fill-skate-deep dark:fill-skate-yellow w-6 h-6" /> {spotListModal.title}
                      </h3>
                      <button onClick={() => setSpotListModal(null)} className="p-2 bg-gray-100 dark:bg-zinc-800 rounded-full hover:bg-gray-200 dark:hover:bg-zinc-700"><X className="w-5 h-5 text-skate-black dark:text-white" /></button>
                  </div>
                  <div className="overflow-y-auto space-y-3 pr-2">
                      {spotListModal.spots.map((spot, idx) => (
                          <div key={idx} className="p-4 bg-gray-50 dark:bg-zinc-800 rounded-2xl border border-gray-100 dark:border-zinc-700 flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-skate-yellow flex items-center justify-center font-black text-xs text-skate-black shrink-0">
                                  {idx + 1}
                              </div>
                              <span className="font-bold text-skate-black dark:text-white text-sm">{spot}</span>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      )}

      {/* Header */}
      <header className="flex justify-between items-start shrink-0 pt-2">
        <div>
            <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 dark:bg-zinc-800 border-2 border-white dark:border-zinc-700 shadow-sm">
                    <div className="w-full h-full bg-gradient-to-br from-skate-yellow to-skate-orange"></div>
                </div>
                 {user ? (
                     <button onClick={onLogout} className="text-xs font-bold text-gray-400 bg-white dark:bg-zinc-900 px-2 py-1 rounded-full border border-gray-100 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800">
                        {t.LOGOUT}
                     </button>
                 ) : (
                     <button onClick={() => setShowProfileSetup(true)} className="text-xs font-bold text-skate-black bg-skate-yellow px-2 py-1 rounded-full hover:opacity-80">
                        {t.LOGIN_GUEST}
                     </button>
                 )}
            </div>
            <h1 className="text-4xl font-display font-black text-skate-black dark:text-white leading-[0.9] tracking-tight">
                {user ? user.name : "Skater"}'s<br />
                <span className="text-gray-400">Daily Skating</span>
                <span className="text-skate-yellow ml-1 animate-pulse">✨</span>
            </h1>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-1.5 animate-fade-in">
                <MapPin className="w-3.5 h-3.5 text-skate-deep dark:text-skate-yellow" />
                {suggestedSpot}
            </p>
        </div>
        
        <div className="flex gap-2">
            {/* Instagram Button */}
            <button 
                onClick={() => window.open('https://www.instagram.com', '_blank')}
                className="w-10 h-10 rounded-full bg-white dark:bg-zinc-900 flex items-center justify-center text-xs font-bold text-skate-black dark:text-white shadow-sm border border-gray-100 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
            >
                <Instagram className="w-5 h-5" />
            </button>
             {/* Dark Mode Toggle */}
            <button 
                onClick={onToggleTheme}
                className="w-10 h-10 rounded-full bg-white dark:bg-zinc-900 flex items-center justify-center text-xs font-bold text-skate-black dark:text-white shadow-sm border border-gray-100 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
            >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button 
                onClick={onLanguageToggle}
                className="w-10 h-10 rounded-full bg-white dark:bg-zinc-900 flex items-center justify-center text-xs font-bold text-skate-black dark:text-white shadow-sm border border-gray-100 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
            >
                {language}
            </button>
        </div>
      </header>

      {/* Chips */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide shrink-0">
          <button onClick={() => setSpotListModal(null)} className="px-5 py-2 rounded-full bg-skate-black dark:bg-white text-white dark:text-black text-sm font-bold shadow-md whitespace-nowrap active:scale-95 transition-transform">
            All
          </button>
          <button onClick={() => setSpotListModal({ title: language === 'KR' ? '스트릿 스팟' : 'Street Spots', spots: STREET_SPOTS })} className="px-5 py-2 rounded-full bg-white dark:bg-zinc-900 text-gray-400 dark:text-gray-300 text-sm font-bold border border-gray-100 dark:border-zinc-800 whitespace-nowrap active:scale-95 transition-transform hover:bg-gray-50 dark:hover:bg-zinc-800 hover:text-skate-black dark:hover:text-white">
            Street
          </button>
          <button onClick={() => setSpotListModal({ title: language === 'KR' ? '스케이트 파크' : 'Skate Parks', spots: PARK_SPOTS })} className="px-5 py-2 rounded-full bg-white dark:bg-zinc-900 text-gray-400 dark:text-gray-300 text-sm font-bold border border-gray-100 dark:border-zinc-800 whitespace-nowrap active:scale-95 transition-transform hover:bg-gray-50 dark:hover:bg-zinc-800 hover:text-skate-black dark:hover:text-white">
            Park
          </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 gap-6">
          
          {/* Hero Card */}
          <div className="w-full p-7 rounded-[2.5rem] bg-skate-yellow relative overflow-hidden shadow-pop pop-card min-h-[220px] flex flex-col justify-between group cursor-pointer hover:shadow-xl transition-shadow" onClick={() => setShowLevelModal(true)}>
             <div className="absolute top-4 right-4 bg-white/30 backdrop-blur-md px-3 py-1 rounded-full cursor-pointer hover:bg-white/50 transition-colors z-20" onClick={(e) => { e.stopPropagation(); setIsEditingDate(true); }}>
                <span className="text-xs font-black text-skate-black uppercase tracking-wider">{t.DAYS_SKATING}: {daysSkating}</span>
             </div>
             <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-white/20 rounded-full blur-xl group-hover:scale-110 transition-transform duration-500"></div>
             <div className="relative z-10 mt-2">
                <div className="flex items-center gap-3 mb-2">
                    <Shield className="w-8 h-8 fill-skate-black text-skate-black" />
                    <span className="text-4xl font-black text-skate-black tracking-tight">{status.title}</span>
                </div>
                <p className="text-sm font-bold text-skate-black/80 uppercase tracking-wide mb-4 pl-1">{status.sub}</p>
                <div className="w-full max-w-[200px] h-4 bg-white/40 rounded-full overflow-hidden backdrop-blur-sm relative">
                    <div className="h-full bg-skate-black rounded-full transition-all duration-1000 ease-out" style={{ width: `${dailyProgress}%` }}></div>
                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(45deg, #000 25%, transparent 25%, transparent 50%, #000 50%, #000 75%, transparent 75%, transparent)', backgroundSize: '10px 10px' }}></div>
                </div>
                <p className="text-[10px] font-bold text-skate-black/60 mt-1 uppercase tracking-wide">
                    {language === 'KR' ? '오늘의 퀘스트' : 'Daily Quests'}: {Math.round(dailyProgress)}%
                </p>
             </div>
             <div className="flex gap-2 relative z-10 mt-4">
                 <div className="w-10 h-10 rounded-full bg-white/40 flex items-center justify-center"><Calendar className="w-5 h-5 text-skate-black" /></div>
                 <div className="w-10 h-10 rounded-full bg-skate-black/10 flex items-center justify-center"><TrendingUp className="w-5 h-5 text-skate-black" /></div>
                 <div className="ml-auto flex items-center gap-1 opacity-50 text-skate-black text-[10px] font-bold uppercase tracking-widest"><span>View Level Info</span><ArrowUpRight className="w-3 h-3" /></div>
             </div>
          </div>

          {/* DAILY QUESTS */}
          <div className="w-full space-y-3">
              <div className="flex justify-between items-end px-2">
                  <h3 className="text-xl font-black text-skate-black dark:text-white italic">{t.DAILY_QUESTS}</h3>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{t.QUEST_REFRESH}</span>
              </div>
              {user ? dailyQuests.map((quest) => {
                  const isReadyToClaim = quest.progress >= quest.target && !quest.isCompleted;
                  const progressPercent = Math.min(100, (quest.progress / quest.target) * 100);
                  return (
                    <div key={quest.id} className={`pop-card p-4 relative overflow-hidden transition-all ${quest.isCompleted ? 'bg-gray-100 dark:bg-zinc-800/50 opacity-60' : 'bg-white dark:bg-zinc-900 dark:border-zinc-800'}`}>
                        {!quest.isCompleted && (
                            <div className="absolute bottom-0 left-0 h-1 bg-gray-100 dark:bg-zinc-800 w-full">
                                <div className="h-full bg-skate-yellow transition-all duration-1000 ease-out" style={{ width: `${progressPercent}%` }} />
                            </div>
                        )}
                        <div className="flex items-center justify-between relative z-10">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${quest.isCompleted ? 'bg-gray-200 dark:bg-zinc-800 text-gray-400' : isReadyToClaim ? 'bg-skate-yellow animate-pulse text-skate-black' : 'bg-skate-black text-white'}`}>
                                    {quest.type === 'login' && <CheckCircle className="w-6 h-6" />}
                                    {quest.type === 'session' && <Zap className="w-6 h-6" />}
                                    {quest.type === 'practice' && <BookOpen className="w-6 h-6" />}
                                    {quest.type === 'land_tricks' && <Target className="w-6 h-6" />}
                                    {quest.type === 'perfect_session' && <Star className="w-6 h-6" />}
                                </div>
                                <div>
                                    <p className={`font-bold text-sm ${quest.isCompleted ? 'text-gray-400 line-through' : 'text-skate-black dark:text-white'}`}>
                                        {/* @ts-ignore */}
                                        {t[quest.title] || quest.title} {quest.target > 1 ? `(${quest.progress}/${quest.target})` : ''}
                                    </p>
                                    <p className="text-[10px] font-black text-skate-yellow bg-skate-black inline-block px-1.5 py-0.5 rounded mt-1">+{quest.xp} XP</p>
                                </div>
                            </div>
                            <button onClick={() => handleClaimQuest(quest.id)} disabled={!isReadyToClaim} className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wide transition-all ${quest.isCompleted ? 'bg-transparent text-gray-400 border border-gray-200 dark:border-zinc-700' : isReadyToClaim ? 'bg-skate-yellow text-skate-black hover:bg-yellow-400 shadow-md active:scale-95 animate-bounce-slow' : 'bg-gray-50 dark:bg-zinc-800 text-gray-300 dark:text-gray-600 border border-gray-100 dark:border-zinc-700 cursor-not-allowed'}`}>
                                {quest.isCompleted ? t.COMPLETED : t.CLAIM}
                            </button>
                        </div>
                    </div>
                  );
              }) : (
                  <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] text-center shadow-pop border border-gray-100 dark:border-zinc-800">
                      <p className="text-gray-400 font-bold text-sm">Log in to view daily quests.</p>
                  </div>
              )}
          </div>

          {/* Action Row */}
          <div className="flex gap-4 h-40">
              <button onClick={onStart} className="flex-[1.5] bg-white dark:bg-zinc-900 rounded-[2.5rem] p-6 shadow-pop pop-card relative overflow-hidden flex flex-col justify-between group dark:border-zinc-800">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-skate-black rounded-bl-[2.5rem] flex items-center justify-center group-hover:scale-105 transition-transform"><ArrowUpRight className="w-8 h-8 text-skate-yellow" /></div>
                  <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center"><Play className="w-5 h-5 ml-1 text-skate-black dark:text-white" /></div>
                  <div><h3 className="text-2xl font-black text-skate-black dark:text-white leading-none">Train</h3><p className="text-xs text-gray-400 font-bold mt-1">START SESSION</p></div>
              </button>
              <button onClick={onLearning} className="flex-1 bg-skate-deep rounded-[2.5rem] p-6 shadow-pop pop-card relative overflow-hidden flex flex-col justify-between text-white group">
                  <div className="absolute -right-4 -top-4 w-20 h-20 bg-white/10 rounded-full blur-xl"></div>
                  <BookOpen className="w-8 h-8 text-white/80" />
                  <div><h3 className="text-xl font-bold leading-none">Learn</h3><p className="text-[10px] text-white/60 font-bold mt-1 uppercase">Trick Guide</p></div>
              </button>
          </div>

          {/* Recent History */}
          <div className="w-full bg-skate-deep rounded-[2.5rem] p-6 shadow-pop text-white relative overflow-hidden min-h-[200px]">
              <div className="absolute -right-12 bottom-4 w-40 h-40 rounded-full border-[12px] border-white/5 opacity-50"></div>
              <div className="absolute -right-12 bottom-4 w-40 h-40 rounded-full border-[40px] border-black/20 opacity-30"></div>
              <div className="relative z-10 mb-4 flex justify-between items-center">
                  <div><h3 className="text-2xl font-black text-white/90">Recent<br/>History</h3><p className="text-white/50 text-xs font-bold mt-1">{recentSessions.length} sessions recorded</p></div>
                  <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur flex items-center justify-center"><Calendar className="w-5 h-5 text-white" /></div>
              </div>
              <div className="relative z-10 space-y-3">
                  {recentSessions.length > 0 ? recentSessions.map((session, idx) => (
                      <div key={idx} className="flex items-center gap-3 bg-white/10 backdrop-blur-sm p-3 rounded-2xl border border-white/5">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-black ${session.landedCount/session.totalTricks >= 0.5 ? 'bg-skate-yellow text-skate-black' : 'bg-white/20 text-white'}`}>{Math.round((session.landedCount / session.totalTricks) * 100)}%</div>
                          <div className="flex-1"><p className="text-sm font-bold text-white">{new Date(session.date).toLocaleDateString()}</p><p className="text-[10px] text-white/60 font-medium uppercase">{session.totalTricks} Tricks • {session.difficulty || 'Custom'}</p></div>
                      </div>
                  )) : <div className="text-white/40 text-sm font-medium py-4 text-center">No sessions yet. Let's skate!</div>}
              </div>
          </div>
      </div>
    </div>
  );
};

export default Dashboard;