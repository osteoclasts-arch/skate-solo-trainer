import React, { useState, useEffect } from 'react';
import { TRANSLATIONS, BASE_TRICKS } from '../constants';
import { Play, BookOpen, Eye, Zap, Calendar, ArrowUpRight, TrendingUp, Target, Shield, Star, X, MapPin, Instagram, ListVideo, Settings, Sparkles, ChevronRight, Check, Flame, Trophy, Bell, MoreHorizontal, User, Moon, Sun, Edit2, List, Map as MapIcon, Navigation } from 'lucide-react';
import { SessionResult, Language, User as UserType, Quest, Trick } from '../types';
import { dbService } from '../services/dbService';
import CalendarModal from './CalendarModal';

interface Props {
  onStart: () => void;
  onLearning: () => void;
  onLineGen: () => void;
  onAnalytics: () => void;
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
  // New props for calendar
  skateDates?: string[];
  onToggleDate?: (date: string) => void;
}

const STREET_SPOTS = [
  "세운상가 (Seun Plaza)",
  "용두공원 (Yongdu Park)", 
  "코엑스 앞 (Coex)", 
  "서울대 정문 (SNU Gate)", 
  "서울대 잔디광장 지하 (SNU Lawn Plaza Basement)",
  "낙성대 공원 (Nakseongdae)",
  "미추홀공원 (Michuhol Park)",
  "만석공원 (Manseok Park)",
  "펍지 성수 (PUBG Seongsu)",
  "망우역 이노시티앞 (Mangu Station Innocity)",
  "노을공원 (Noeul Park)",
  "투사스케이트보드 앞 (Tussa Skateboard)",
  "해그늘생활체육공원 (Haegneul Park)",
  "열린송현녹지광장 (Songhyeon Green Plaza)",
  "서울대 폐수영장 (SNU Abandoned Pool)",
  "여의도 물빛광장 (Yeouido Mulbit Square)",
  "영등포공원 (Yeongdeungpo Park)",
  "노원중앙도서관 뒤 (Nowon Central Library)",
  "잠실한강공원 통로 (Jamsil Han River Passage)",
  "메가박스 신촌 (Megabox Sinchon)",
  "성북천 분수광장 (Seongbukcheon Fountain Plaza)",
  "신림 별빛내린천 (Sillim Starlight Stream)",
  "스타벅스 고대안암병원점 지하 (Starbucks Korea Univ. Hospital)",
  "신논현역 8번출구 (Sinnonhyeon Stn Exit 8)",
  "동대문디자인플라자 (DDP)",
  "성동구민종합체육센터앞 (Seongdong Sports Center)",
  "용답역 2번출구 (Yongdap Stn Exit 2)",
  "한양대역 3번출구 (Hanyang Univ. Stn Exit 3)",
  "제주 북수구광장 (Jeju Buksugu Plaza)",
  "제주 탐라문화광장 (Jeju Tamla Culture Plaza)"
];

const PARK_SPOTS = [
  "뚝섬 한강공원 (Ttukseom)", 
  "이촌 한강공원 (Ichon)", 
  "보라매 공원 (Boramae)", 
  "서울숲 스케이트파크 (Seoul Forest)", 
  "컬트 (Cult Park)", 
  "난지 파크 (Nanji)", 
  "신대방 (Sindaebang)", 
  "디디미 (Didimi)",
  "탄천 x게임장 (Tancheon X-Game)",
  "평화의공원 평화광장 (Peace Park Plaza)",
  "은평 x게임장 (Eunpyeong X-Game)",
  "운정건강공원 x게임장 (Unjeong Health Park)",
  "마리미공원 x게임장 (Marimi Park)",
  "논현포대근린공원 x게임장 (Nonhyeon Podae Park)",
  "안산호수공원 x게임장 (Ansan Lake Park)",
  "죽마체육공원 x게임장 (Jukma Park)",
  "광나루 스케이트파크 (Gwangnaru Skatepark)",
  "보정동 x파크 공원 (Bojeong-dong X-Park)",
  "노해 x-top (Nohae X-Top)"
];

const INDOOR_SPOTS = [
  "로프라운지 (Loaf)",
  "K88", 
  "트랜지션 정글 (Jungle)", 
  "크래프터 평택 (Crafter)",
  "보문파크뷰자이 지하 (Bomun Parkview Xi Basement)",
  "플립보드스쿨 (Flip Board School)",
  "고속터미널역 지하통로 (Express Bus Terminal Underground)",
  "오버헤드 (Overhead)",
  "대구 플레이그라운드 스케이트파크 (Daegu Playground)",
  "그레이 스케이트보드파크 (Gray Skateboard Park)"
];

// Region Helper
const getRegion = (spot: string) => {
    const s = spot.toLowerCase();
    if (s.includes('제주')) return 'Jeju';
    if (s.includes('대구')) return 'Daegu';
    if (s.includes('부산') || s.includes('오버헤드')) return 'Busan';
    if (s.includes('인천') || s.includes('미추홀') || s.includes('논현포대')) return 'Incheon';
    if (s.includes('경기') || s.includes('수원') || s.includes('만석') || s.includes('운정') || s.includes('마리미') || s.includes('안산') || s.includes('죽마') || s.includes('보정') || s.includes('평택') || s.includes('크래프터') || s.includes('로프') || s.includes('k88') || s.includes('정글') || s.includes('그레이')) return 'Gyeonggi';
    return 'Seoul'; // Default
};

// Map Query Helper
const getQueryName = (spot: string) => spot.split('(')[0].trim();

const Dashboard: React.FC<Props> = ({ 
    onStart, 
    onLearning, 
    onLineGen, 
    onAnalytics,
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
    onToggleTheme,
    skateDates = [],
    onToggleDate
}) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS['KR'];
  
  const [isEditingDate, setIsEditingDate] = useState(false);
  const [tempDate, setTempDate] = useState(startDate);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [setupName, setSetupName] = useState("");
  const [setupAge, setSetupAge] = useState("");
  const [setupDate, setSetupDate] = useState(startDate);
  const [dailyQuests, setDailyQuests] = useState<Quest[]>([]);
  const [xp, setXp] = useState(0);
  const [showLevelModal, setShowLevelModal] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  
  // Tabs for Spot Filter
  const [selectedTab, setSelectedTab] = useState<'All' | 'Street' | 'Park' | 'Indoor'>('All');

  // Spot Suggestion State
  const [suggestedSpot, setSuggestedSpot] = useState("");
  // Updated to handle grouped spots & View Mode
  const [spotListModal, setSpotListModal] = useState<{ title: string, groupedSpots: Record<string, string[]> } | null>(null);
  const [spotListMode, setSpotListMode] = useState<'list' | 'map'>('list');
  const [activeMapSpot, setActiveMapSpot] = useState<string>("");
  
  // Daily Trick
  const [dailyTrick, setDailyTrick] = useState<Trick | null>(null);

  useEffect(() => {
    if (user) {
        if (user.dailyQuests) setDailyQuests(user.dailyQuests);
        if (user.xp !== undefined) setXp(user.xp);
    }
    // Set a random daily trick
    setDailyTrick(BASE_TRICKS[Math.floor(Math.random() * BASE_TRICKS.length)]);
  }, [user]);

  // Pre-fill profile data when opening modal if user exists
  useEffect(() => {
      if (showProfileSetup && user) {
          setSetupName(user.name);
          setSetupAge(user.age?.toString() || "");
          setSetupDate(startDate);
      }
  }, [showProfileSetup, user, startDate]);

  // Generate Suggestion Logic based on Selected Tab
  useEffect(() => {
    const getRandomSpot = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
    
    let spot = "";
    if (language === 'KR') {
        if (selectedTab === 'Indoor') {
             spot = `비 올 땐? ${getRandomSpot(INDOOR_SPOTS)} 추천!`;
        } else if (selectedTab === 'Street') {
             spot = `오늘 ${getRandomSpot(STREET_SPOTS)} 스트릿 어때요?`;
        } else if (selectedTab === 'Park') {
             spot = `오늘은 ${getRandomSpot(PARK_SPOTS)} 어때요?`;
        } else {
             // All: Random mix
             const allSpots = [...STREET_SPOTS, ...PARK_SPOTS, ...INDOOR_SPOTS];
             spot = `오늘은 ${getRandomSpot(allSpots)} 어때요?`;
        }
    } else {
        const type = selectedTab === 'All' ? 'Spot' : selectedTab;
        spot = `How about a local ${type} today?`;
    }
    setSuggestedSpot(spot);
  }, [language, selectedTab]);

  const getDisplayStatus = () => {
      if (user?.isPro) return { title: 'PRO', sub: `Verified`, gradient: 'from-skate-yellow to-orange-400' };
      if (daysSkating > 60) return { title: 'AMATEUR', sub: `Day ${daysSkating}`, gradient: 'from-white to-gray-300' };
      return { title: 'BEGINNER', sub: `Day ${daysSkating}`, gradient: 'from-white to-gray-200' };
  };

  const status = getDisplayStatus();
  const completedQuestsCount = dailyQuests.filter(q => q.isCompleted).length;
  const totalQuestsCount = Math.max(1, dailyQuests.length);
  const dailyProgress = (completedQuestsCount / totalQuestsCount) * 100;

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

  const handleProfileSubmit = () => {
      if (!setupName.trim()) { alert("Please enter a nickname."); return; }
      onLogin({ name: setupName, age: parseInt(setupAge) || 0, startDate: setupDate });
      setShowProfileSetup(false);
  };

  const handleSaveDate = () => { onUpdateStartDate(tempDate); setIsEditingDate(false); };

  const handleCalendarClick = () => {
      if (!user) {
          setShowProfileSetup(true);
      } else {
          setShowCalendar(true);
      }
  };

  const getCurrentSpots = (filter?: string) => {
      const tab = filter || selectedTab;
      if (tab === 'Street') return STREET_SPOTS;
      if (tab === 'Park') return PARK_SPOTS;
      if (tab === 'Indoor') return INDOOR_SPOTS;
      return [...STREET_SPOTS, ...PARK_SPOTS, ...INDOOR_SPOTS];
  };

  const openSpotList = (mode: 'list' | 'map') => {
      const spots = getCurrentSpots();

      // Group by region (Only needed for List Mode)
      const grouped: Record<string, string[]> = {
          'Seoul': [],
          'Gyeonggi/Incheon': [],
          'Others': []
      };

      spots.forEach(spot => {
          const region = getRegion(spot);
          if (region === 'Seoul') grouped['Seoul'].push(spot);
          else if (region === 'Gyeonggi' || region === 'Incheon') grouped['Gyeonggi/Incheon'].push(spot);
          else grouped['Others'].push(spot);
      });

      Object.keys(grouped).forEach(key => {
          if (grouped[key].length === 0) delete grouped[key];
      });

      setSpotListMode(mode);
      if (mode === 'map') {
          // Initialize map with first spot of current selection
          setActiveMapSpot(spots[0]);
      }
      setSpotListModal({
          title: selectedTab === 'All' ? 'All Spots' : `${selectedTab} Spots`,
          groupedSpots: grouped
      });
  };

  // Helper to change active spot map
  const handleMapSpotChange = (spot: string) => {
      setActiveMapSpot(spot);
  };

  return (
    <div className="flex flex-col h-full p-5 space-y-6 overflow-y-auto pb-48 relative animate-fade-in font-sans bg-gray-50 dark:bg-crit-bg text-black dark:text-white selection:bg-crit-accent selection:text-black transition-colors duration-300">
      
      {/* Header */}
      <header className="flex flex-col py-2 shrink-0 gap-2">
        <div className="flex justify-between items-start gap-3">
             <div className="flex flex-col gap-1 flex-1 min-w-0">
                 <div className="flex items-center gap-2">
                     <div 
                        onClick={() => setShowProfileSetup(true)} 
                        className={`px-3 py-1 rounded-full cursor-pointer shadow-glow flex items-center gap-2 transition-transform active:scale-95 ${user ? 'bg-gray-100 dark:bg-zinc-800' : 'bg-crit-accent'}`}
                     >
                        {user ? (
                            <>
                                <User className="w-3 h-3 text-black dark:text-white" />
                                <span className="text-[10px] font-black text-black dark:text-white uppercase tracking-wider">{user.name}</span>
                                <Edit2 className="w-3 h-3 text-gray-400" />
                            </>
                        ) : (
                            <span className="text-[10px] font-black text-black uppercase tracking-wider">{t.LOGIN_GUEST}</span>
                        )}
                     </div>
                 </div>
                 <h1 className="text-3xl font-black tracking-tighter leading-none mt-1">
                     <span className="text-black dark:text-white">crete</span><br/>
                     <span className="text-gray-300 dark:text-gray-600 flex items-center gap-1">
                         Daily Skating <Sparkles className="w-5 h-5 text-gray-300 dark:text-gray-600 fill-gray-300 dark:fill-gray-600" />
                     </span>
                 </h1>
             </div>
             
             <div className="flex gap-2 shrink-0">
                 <button 
                    onClick={() => window.open('https://instagram.com/osteoclasts_', '_blank')}
                    className="w-10 h-10 rounded-full bg-white dark:bg-crit-surface border border-gray-200 dark:border-white/5 flex items-center justify-center text-gray-400 hover:text-black dark:hover:text-white transition-all shadow-sm"
                 >
                    <Instagram className="w-4 h-4" />
                 </button>
                 <button onClick={onToggleTheme} className="w-10 h-10 rounded-full bg-white dark:bg-crit-surface border border-gray-200 dark:border-white/5 flex items-center justify-center text-gray-400 hover:text-black dark:hover:text-white transition-all shadow-sm"
                 >
                    {isDarkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                 </button>
                 <button onClick={onLanguageToggle} className="w-10 h-10 rounded-full bg-white dark:bg-crit-surface border border-gray-200 dark:border-white/5 flex items-center justify-center text-[10px] font-black text-gray-400 hover:text-black dark:hover:text-white transition-all shadow-sm">
                    {language}
                 </button>
             </div>
        </div>

        {/* Location - Full width below title and buttons */}
        <div className="flex items-center gap-1.5 opacity-80 w-full">
            <MapPin className="w-3 h-3 text-black dark:text-white shrink-0" />
            <span className="text-xs font-bold tracking-wide text-gray-600 dark:text-gray-400 whitespace-nowrap">{suggestedSpot}</span>
        </div>
      </header>

      {/* Filter Tabs & List Button - Layout Fixed with compact sizes */}
      <div className="flex items-center shrink-0 gap-2 overflow-hidden px-1 py-1 relative">
          <div className="flex-1 overflow-x-auto scrollbar-hide flex gap-1.5 min-w-0 pr-2">
            {['All', 'Street', 'Park', 'Indoor'].map((tab) => (
                <button 
                    key={tab}
                    onClick={() => setSelectedTab(tab as any)}
                    className={`px-3.5 py-2 rounded-full text-xs font-black transition-all whitespace-nowrap border-2 shrink-0 ${
                        selectedTab === tab 
                        ? 'bg-crit-accent text-black border-crit-accent shadow-[0_0_15px_rgba(230,255,0,0.4)]' 
                        : 'bg-transparent text-gray-500 border-gray-200 dark:border-zinc-800 hover:border-gray-400 dark:hover:border-zinc-600'
                    }`}
                >
                    {tab}
                </button>
            ))}
          </div>
          <div className="flex items-center gap-1 shrink-0 pl-2 border-l border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-crit-bg z-10">
             <button 
                onClick={() => openSpotList('list')}
                className="w-9 h-9 rounded-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 flex items-center justify-center text-skate-black dark:text-white hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors shrink-0 shadow-sm"
             >
                 <List className="w-4 h-4" />
             </button>
             <button 
                onClick={() => openSpotList('map')}
                className="w-9 h-9 rounded-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 flex items-center justify-center text-skate-black dark:text-white hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors shrink-0 shadow-sm"
             >
                 <MapIcon className="w-4 h-4" />
             </button>
          </div>
      </div>

      {/* Main Hero Card (Yellow) */}
      <div className="w-full bg-[#FFE500] rounded-[2.5rem] p-6 relative overflow-hidden shadow-pop text-black shrink-0">
          {/* Top Right Badge - Now clickable to fix date */}
          <button 
            onClick={() => setShowProfileSetup(true)}
            className="absolute top-6 right-6 px-3 py-1.5 bg-white/50 backdrop-blur-sm rounded-full z-10 hover:bg-white/80 transition-colors cursor-pointer"
          >
              <span className="text-[10px] font-black uppercase tracking-widest text-black/70">
                  {t.DAYS_SKATING}: {daysSkating}
              </span>
          </button>

          <div className="mt-4 relative z-10">
              <div className="flex items-center gap-3 mb-2">
                  <Shield className="w-8 h-8 fill-black text-black" />
                  <span className="text-4xl font-black tracking-tighter">LV. {user?.level || 1}</span>
              </div>
              <p className="text-sm font-bold opacity-70 ml-1">{status.title} - {status.sub}</p>
          </div>

          {/* Progress Bar with Stripes */}
          <div className="mt-6 mb-1 relative h-6 bg-white/30 rounded-full overflow-hidden z-10">
               <div 
                 className="h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 absolute inset-0 z-0 pointer-events-none"
               ></div>
               <div 
                 className="h-full bg-white/50 relative z-10 transition-all duration-1000"
                 style={{ 
                     width: `${dailyProgress}%`,
                     backgroundImage: 'linear-gradient(45deg,rgba(255,255,255,.15) 25%,transparent 25%,transparent 50%,rgba(255,255,255,.15) 50%,rgba(255,255,255,.15) 75%,transparent 75%,transparent)',
                     backgroundSize: '1rem 1rem'
                 }}
               ></div>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-8 relative z-10">
              {t.DAILY_QUESTS}: {Math.round(dailyProgress)}%
          </p>

          <div className="flex justify-between items-end relative z-10">
              <div className="flex gap-2">
                  <button onClick={handleCalendarClick} className="w-12 h-12 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center transition-colors relative">
                      <Calendar className="w-5 h-5 text-black" />
                      {user?.skateDates && user.skateDates.length > 0 && (
                          <div className="absolute top-3 right-3 w-2 h-2 bg-black rounded-full"></div>
                      )}
                  </button>
                  <button onClick={onAnalytics} className="w-12 h-12 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center transition-colors">
                      <TrendingUp className="w-5 h-5 text-black" />
                  </button>
              </div>
              
              <button onClick={() => setShowLevelModal(true)} className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest opacity-60 hover:opacity-100 transition-opacity">
                  VIEW LEVEL INFO <ArrowUpRight className="w-3 h-3" />
              </button>
          </div>
      </div>

      {/* Action Buttons & Quests */}
      <div className="space-y-4 shrink-0">
          
          {/* Start Session Button */}
          <button 
            onClick={onStart}
            className="w-full py-5 bg-white dark:bg-zinc-900 text-black dark:text-white rounded-[2rem] flex items-center justify-between px-8 shadow-lg group active:scale-[0.98] transition-all border border-gray-200 dark:border-zinc-800"
          >
              <span className="text-xl font-black uppercase tracking-tight">{t.START_SESSION_TITLE.replace('\n', ' ')}</span>
              <div className="w-10 h-10 rounded-full bg-black dark:bg-white flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Play className="w-4 h-4 text-crit-accent fill-crit-accent dark:text-black dark:fill-black ml-0.5" />
              </div>
          </button>

          {/* Secondary Actions Grid */}
          <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={onLearning}
                className="p-5 bg-zinc-900 dark:bg-zinc-900 rounded-[2rem] border border-transparent dark:border-zinc-800 text-left hover:border-gray-500 transition-colors"
              >
                   <BookOpen className="w-6 h-6 text-white mb-3" />
                   <span className="block text-sm font-bold text-gray-500 uppercase tracking-widest mb-0.5">{t.LIBRARY}</span>
                   <span className="block text-lg font-black text-white leading-none">{t.TRICK_GUIDE_TITLE_MAIN}</span>
              </button>
              <button 
                onClick={onLineGen}
                className="p-5 bg-[#1A1A1A] dark:bg-zinc-800 rounded-[2rem] text-left relative overflow-hidden group"
              >
                   <ListVideo className="w-6 h-6 text-white mb-3 opacity-80" />
                   <span className="block text-sm font-bold text-gray-400 uppercase tracking-widest mb-0.5">{t.AI_GEN}</span>
                   <span className="block text-lg font-black text-white leading-none">{t.LINE_MAKER_TITLE.replace('\n', ' ')}</span>
                   <div className="absolute right-0 bottom-0 opacity-10 group-hover:opacity-20 transition-opacity">
                       <Sparkles className="w-24 h-24 text-white" />
                   </div>
              </button>
          </div>

          {/* Quests List */}
          <div className="pt-4">
              <div className="flex items-center justify-between px-2 mb-3">
                  <h3 className="text-lg font-black text-black dark:text-white tracking-tight">{t.DAILY_QUESTS}</h3>
                  <span className="text-xs font-bold text-gray-500">{completedQuestsCount}/{totalQuestsCount}</span>
              </div>
              <div className="space-y-2">
                  {dailyQuests.length > 0 ? dailyQuests.map((quest) => {
                      const isReady = quest.progress >= quest.target && !quest.isCompleted;
                      return (
                          <div key={quest.id} className="bg-white dark:bg-crit-surface border border-gray-200 dark:border-white/5 p-4 rounded-[2rem] flex items-center justify-between shadow-sm">
                              <div className="flex items-center gap-4">
                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${quest.isCompleted ? 'bg-crit-accent border-crit-accent text-black' : 'bg-transparent border-gray-200 dark:border-white/10 text-gray-400 dark:text-gray-500'}`}>
                                      {quest.isCompleted ? <Check className="w-5 h-5" /> : <Star className="w-4 h-4" />}
                                  </div>
                                  <div className="flex flex-col">
                                      <h4 className={`text-sm font-bold leading-none mb-1 text-left ${quest.isCompleted ? 'text-gray-400 line-through' : 'text-black dark:text-white'}`}>
                                          {/* @ts-ignore */}
                                          {t[quest.title] || quest.title}
                                      </h4>
                                      <span className="text-[10px] text-crit-accent dark:text-crit-accent font-bold text-left">+{quest.xp} XP</span>
                                  </div>
                              </div>
                              
                              <button 
                                onClick={() => handleClaimQuest(quest.id)}
                                disabled={!isReady || quest.isCompleted}
                                className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-wider transition-all ${
                                    quest.isCompleted ? 'opacity-0' : 
                                    isReady ? 'bg-crit-pink text-white shadow-glow hover:scale-105' : 
                                    'bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                                }`}
                              >
                                  {t.CLAIM}
                              </button>
                          </div>
                      );
                  }) : (
                      <div onClick={user ? undefined : () => setShowProfileSetup(true)} className="p-8 text-center bg-white dark:bg-crit-surface rounded-[2rem] border border-dashed border-gray-300 dark:border-white/5 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                          <p className="text-gray-400 dark:text-gray-500 text-xs font-bold">{t.SIGN_IN_QUESTS}</p>
                      </div>
                  )}
              </div>
          </div>
      </div>

      {/* Footer Instagram Link */}
      <div className="mt-8 mb-4 flex justify-center opacity-50 hover:opacity-100 transition-opacity">
           <a 
             href="https://instagram.com/osteoclasts_" 
             target="_blank"
             rel="noreferrer"
             className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest hover:text-crit-pink transition-colors"
           >
               <Instagram className="w-3 h-3" />
               <span>Developed by @osteoclasts_</span>
           </a>
      </div>

      {/* Spot View - Conditionally Render List vs Map */}
      {spotListModal && (
          <div className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-black animate-fade-in">
             {spotListMode === 'map' ? (
                 // --- FULL SCREEN MAP MODE ---
                 <div className="relative flex-1 flex flex-col overflow-hidden">
                     {/* Map Iframe Background */}
                     <div className="absolute inset-0 z-0 bg-gray-200 dark:bg-zinc-900">
                         <iframe 
                             width="100%" 
                             height="100%" 
                             frameBorder="0" 
                             style={{ border: 0 }} 
                             src={`https://maps.google.com/maps?q=${encodeURIComponent(getQueryName(activeMapSpot))}&t=&z=16&ie=UTF8&iwloc=&output=embed`}
                             title={activeMapSpot}
                             className="w-full h-full grayscale opacity-80"
                         ></iframe>
                     </div>

                     {/* Top Bar Overlay */}
                     <div className="relative z-10 p-4 bg-gradient-to-b from-black/80 to-transparent flex items-start justify-between">
                         <div className="flex items-center gap-2">
                             <div className="bg-white/10 backdrop-blur-md p-1.5 rounded-full flex gap-1 border border-white/20">
                                 {['Street', 'Park', 'Indoor'].map((tab) => (
                                     <button 
                                         key={tab}
                                         onClick={() => {
                                             setSelectedTab(tab as any);
                                             const newSpots = getCurrentSpots(tab);
                                             setActiveMapSpot(newSpots[0]);
                                         }}
                                         className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all ${
                                             selectedTab === tab 
                                             ? 'bg-skate-yellow text-skate-black' 
                                             : 'text-white/70 hover:text-white'
                                         }`}
                                     >
                                         {tab}
                                     </button>
                                 ))}
                             </div>
                         </div>
                         <button 
                             onClick={() => setSpotListModal(null)} 
                             className="p-2 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 border border-white/20"
                         >
                             <X className="w-6 h-6" />
                         </button>
                     </div>

                     {/* Bottom Carousel Overlay */}
                     <div className="relative z-10 mt-auto p-4 pb-8 bg-gradient-to-t from-black/90 to-transparent">
                         <div className="flex gap-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory py-2">
                             {getCurrentSpots().map((spot) => (
                                 <button
                                     key={spot}
                                     onClick={() => setActiveMapSpot(spot)}
                                     className={`snap-center flex-shrink-0 w-64 p-4 rounded-2xl border transition-all text-left flex items-center gap-3 ${
                                         activeMapSpot === spot 
                                         ? 'bg-skate-yellow border-skate-yellow shadow-[0_0_20px_rgba(230,255,0,0.5)] scale-105' 
                                         : 'bg-white/10 backdrop-blur-md border-white/10 hover:bg-white/20'
                                     }`}
                                 >
                                     <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${activeMapSpot === spot ? 'bg-skate-black text-skate-yellow' : 'bg-white/20 text-white'}`}>
                                         <Navigation className={`w-4 h-4 ${activeMapSpot === spot ? 'fill-skate-yellow' : 'fill-white'}`} />
                                     </div>
                                     <div>
                                         <p className={`text-xs font-black uppercase tracking-wider mb-0.5 ${activeMapSpot === spot ? 'text-skate-black/60' : 'text-white/60'}`}>
                                             {getRegion(spot)}
                                         </p>
                                         <p className={`text-sm font-bold leading-tight ${activeMapSpot === spot ? 'text-skate-black' : 'text-white'}`}>
                                             {getQueryName(spot)}
                                         </p>
                                     </div>
                                 </button>
                             ))}
                         </div>
                     </div>
                 </div>
             ) : (
                 // --- LIST MODE (Original) ---
                 <div className="flex flex-col h-full bg-white dark:bg-crit-surface">
                     {/* Modal Header */}
                     <div className="flex justify-between items-center p-6 pb-2 shrink-0">
                          <div className="flex items-center gap-2">
                               <h3 className="text-2xl font-black text-skate-black dark:text-white">
                                   {spotListModal.title}
                               </h3>
                          </div>
                          <button onClick={() => setSpotListModal(null)} className="p-2 bg-gray-100 dark:bg-white/5 rounded-full hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"><X className="w-6 h-6 text-skate-black dark:text-white" /></button>
                     </div>
                     
                     {/* Content */}
                     <div className="flex-1 overflow-y-auto px-6 pb-10 space-y-8">
                          {Object.entries(spotListModal.groupedSpots).map(([region, spots]) => (
                              <div key={region} className="space-y-4">
                                  <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 sticky top-0 bg-white/95 dark:bg-crit-surface/95 py-3 backdrop-blur-sm z-10 border-b border-gray-100 dark:border-white/5">{region}</h4>
                                  <div className="space-y-3">
                                      {spots.map((spot, idx) => (
                                          <div key={idx} className="p-5 bg-gray-50 dark:bg-white/5 rounded-[1.5rem] border border-gray-200 dark:border-white/5 flex items-center gap-4 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                                              <div className="w-8 h-8 rounded-full bg-crit-accent/20 flex items-center justify-center font-black text-xs text-crit-accent shrink-0">
                                                  {idx + 1}
                                              </div>
                                              <span className="font-bold text-base text-gray-800 dark:text-gray-200 leading-snug">{spot}</span>
                                          </div>
                                      ))}
                                  </div>
                              </div>
                          ))}
                          
                          {Object.keys(spotListModal.groupedSpots).length === 0 && (
                               <div className="text-center py-12 text-gray-400 text-sm font-bold">
                                   No spots found for this category.
                               </div>
                          )}
                     </div>
                 </div>
             )}
          </div>
      )}

      {/* Profile Setup Modal */}
      {showProfileSetup && (
           <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-fade-in">
               <div className="bg-white dark:bg-crit-surface p-8 rounded-[2.5rem] w-full max-w-sm relative overflow-hidden border border-gray-200 dark:border-white/10 shadow-2xl">
                   <h3 className="text-3xl font-black text-black dark:text-white mb-2 tracking-tight">{t.PROFILE_SETUP}</h3>
                   <div className="space-y-4 mt-8">
                       <input type="text" placeholder={t.NICKNAME} value={setupName} onChange={(e) => setSetupName(e.target.value)} className="w-full bg-gray-100 dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-2xl p-4 text-black dark:text-white focus:border-crit-accent outline-none transition-colors font-bold placeholder-gray-400 dark:placeholder-gray-600" />
                       <input type="number" placeholder={t.AGE} value={setupAge} onChange={(e) => setSetupAge(e.target.value)} className="w-full bg-gray-100 dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-2xl p-4 text-black dark:text-white focus:border-crit-accent outline-none transition-colors font-bold placeholder-gray-400 dark:placeholder-gray-600" />
                       <input type="date" value={setupDate} onChange={(e) => setSetupDate(e.target.value)} className="w-full bg-gray-100 dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-2xl p-4 text-black dark:text-white focus:border-crit-accent outline-none transition-colors font-bold" />
                   </div>
                   <div className="flex gap-3 mt-8">
                       <button onClick={() => setShowProfileSetup(false)} className="flex-1 py-4 bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 font-bold rounded-2xl hover:bg-gray-200 dark:hover:bg-white/10 transition-all">{t.CANCEL}</button>
                       <button onClick={handleProfileSubmit} className="flex-1 py-4 bg-crit-accent text-black font-bold rounded-2xl hover:bg-crit-accent/90 shadow-glow transition-all">{t.SAVE}</button>
                   </div>
               </div>
           </div>
      )}

      {/* Level Info Modal */}
      {showLevelModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-fade-in">
              <div className="bg-white dark:bg-crit-surface w-full max-w-sm rounded-[2.5rem] p-6 text-black dark:text-white relative border border-gray-200 dark:border-white/10 shadow-2xl">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-black flex items-center gap-2">{t.LEVEL_INFO_TITLE}</h3>
                      <button onClick={() => setShowLevelModal(false)} className="p-2 bg-gray-100 dark:bg-white/5 rounded-full hover:bg-gray-200 dark:hover:bg-white/10"><X className="w-5 h-5" /></button>
                  </div>
                  <div className="space-y-4">
                      {['BEGINNER', 'AMATEUR', 'PRO'].map((tier) => (
                          <div key={tier} className="p-5 rounded-[1.5rem] bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/5">
                             <span className="text-xs font-bold text-amber-600 dark:text-crit-accent tracking-widest uppercase">
                                 {/* @ts-ignore */}
                                 {t[`LEVEL_${tier}_RANGE`] || tier}
                             </span>
                             <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 font-medium">
                                 {/* @ts-ignore */}
                                 {t[`LEVEL_${tier}_DESC`] || "Keep skating to unlock this level."}
                             </p>
                             {tier === 'PRO' && (
                                 <div className="mt-2">
                                     {(!user?.isPro) && (
                                         <button 
                                             onClick={onRequestPro}
                                             disabled={user?.proRequestStatus === 'pending'}
                                             className={`w-full py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                                                 user?.proRequestStatus === 'pending' 
                                                 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                                                 : 'bg-black text-white dark:bg-crit-accent dark:text-black hover:scale-[1.02]'
                                             }`}
                                         >
                                             {user?.proRequestStatus === 'pending' ? t.REQUEST_PENDING : t.PRO_BTN_TEXT}
                                         </button>
                                     )}
                                 </div>
                             )}
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      )}

      {/* Calendar Modal */}
      {showCalendar && (
          <CalendarModal 
              onClose={() => setShowCalendar(false)} 
              skateDates={skateDates} 
              onToggleDate={onToggleDate || (() => {})} 
              language={language} 
          />
      )}

    </div>
  );
};

export default Dashboard;