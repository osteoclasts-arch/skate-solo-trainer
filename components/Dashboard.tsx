
import React, { useState } from 'react';
import { TRANSLATIONS } from '../constants';
import { ResponsiveContainer, AreaChart, Area, Tooltip } from 'recharts';
import { PlayCircle, Trophy, Activity, Globe, BookOpen, Calendar, Edit2, LogOut, Instagram, ArrowUpRight, CheckCircle, Target, Award, User, UserPlus } from 'lucide-react';
import { SessionResult, Language, User as UserType } from '../types';

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
}

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
    onLogout
}) => {
  const t = TRANSLATIONS[language];
  const [isEditingDate, setIsEditingDate] = useState(false);
  const [tempDate, setTempDate] = useState(startDate);

  // Profile Setup State
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [setupName, setSetupName] = useState("");
  const [setupAge, setSetupAge] = useState("");
  const [setupDate, setSetupDate] = useState(startDate);

  // --- DAILY QUESTS LOGIC ---
  const today = new Date().toISOString().split('T')[0];
  const todaysSessions = history.filter(h => new Date(h.date).toISOString().split('T')[0] === today);
  const todayLanded = todaysSessions.reduce((acc, s) => acc + s.landedCount, 0);

  const quests = [
      { id: 1, title: language === 'KR' ? "출석 체크" : "Daily Check-in", current: 1, target: 1, completed: true },
      { id: 2, title: language === 'KR' ? "세션 1회 완료" : "Complete 1 Session", current: todaysSessions.length, target: 1, completed: todaysSessions.length >= 1 },
      { id: 3, title: language === 'KR' ? "트릭 10회 성공" : "Land 10 Tricks", current: todayLanded, target: 10, completed: todayLanded >= 10 }
  ];
  const allClear = quests.every(q => q.completed);

  // Generate chart data or use flat line for empty state
  const chartData = history.length > 0 
    ? history.map((h) => ({
        date: new Date(h.date).toISOString().split('T')[0],
        successRate: Math.round((h.landedCount / h.totalTricks) * 100)
      })).reverse().slice(-10) // Reverse to show oldest to newest, take last 10
    : [
        { date: 'Start', successRate: 0 },
        { date: 'Now', successRate: 0 }
      ];

  const totalTricks = history.reduce((acc, curr) => acc + curr.totalTricks, 0);
  const totalLanded = history.reduce((acc, curr) => acc + curr.landedCount, 0);
  const avgSuccess = totalTricks > 0 ? Math.round((totalLanded / totalTricks) * 100) : 0;

  const handleSaveDate = () => {
      onUpdateStartDate(tempDate);
      setIsEditingDate(false);
  };

  const handleProfileSubmit = () => {
      if (!setupName.trim()) {
          alert(language === 'KR' ? "닉네임을 입력해주세요." : "Please enter a nickname.");
          return;
      }
      onLogin({
          name: setupName,
          age: parseInt(setupAge) || 0,
          startDate: setupDate
      });
      setShowProfileSetup(false);
  };

  return (
    <div className="flex flex-col h-full p-6 space-y-6 overflow-y-auto pb-32 relative animate-fade-in">
      
      {/* Date Edit Modal */}
      {isEditingDate && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-6 animate-fade-in">
              <div className="glass-card p-6 rounded-3xl w-full max-w-sm shadow-2xl transform transition-all scale-100">
                  <h3 className="text-2xl font-display font-bold text-white mb-2">{t.SET_START_DATE}</h3>
                  <p className="text-gray-400 text-sm mb-6">When did you start your journey?</p>
                  <input 
                      type="date" 
                      value={tempDate}
                      onChange={(e) => setTempDate(e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white mb-6 focus:border-skate-neon outline-none font-mono"
                  />
                  <div className="flex gap-3">
                      <button 
                          onClick={() => setIsEditingDate(false)}
                          className="flex-1 py-4 bg-gray-800 text-gray-300 font-bold rounded-xl hover:bg-gray-700 transition-all active:scale-95"
                      >
                          {t.CANCEL}
                      </button>
                      <button 
                          onClick={handleSaveDate}
                          className="flex-1 py-4 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-all active:scale-95 shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                      >
                          {t.SAVE}
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Profile Setup Modal */}
      {showProfileSetup && (
           <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-6 animate-fade-in">
               <div className="glass-card p-8 rounded-[2rem] w-full max-w-sm shadow-2xl border border-white/10 relative overflow-hidden">
                   {/* Background Glow */}
                   <div className="absolute -top-10 -right-10 w-40 h-40 bg-skate-neon/20 rounded-full blur-3xl pointer-events-none"></div>

                   <h3 className="text-3xl font-display font-bold text-white mb-2 relative z-10">{t.PROFILE_SETUP}</h3>
                   <p className="text-gray-400 text-sm mb-8 relative z-10">
                       {language === 'KR' ? '나만의 스케이트보드 프로필을 완성하세요.' : 'Complete your skater profile to get started.'}
                   </p>

                   <div className="space-y-4 relative z-10">
                       <div>
                           <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 block pl-1">{t.NICKNAME}</label>
                           <input 
                               type="text" 
                               placeholder={t.ENTER_NICKNAME}
                               value={setupName}
                               onChange={(e) => setSetupName(e.target.value)}
                               className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white focus:border-skate-neon outline-none"
                           />
                       </div>

                       <div>
                           <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 block pl-1">{t.AGE}</label>
                           <input 
                               type="number" 
                               placeholder="0"
                               value={setupAge}
                               onChange={(e) => setSetupAge(e.target.value)}
                               className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white focus:border-skate-neon outline-none"
                           />
                       </div>

                       <div>
                           <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 block pl-1">{t.START_DATE}</label>
                           <input 
                               type="date" 
                               value={setupDate}
                               onChange={(e) => setSetupDate(e.target.value)}
                               className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white focus:border-skate-neon outline-none font-mono"
                           />
                       </div>
                   </div>

                   <div className="flex gap-3 mt-8 relative z-10">
                       <button 
                           onClick={() => setShowProfileSetup(false)}
                           className="flex-1 py-4 bg-gray-800 text-gray-300 font-bold rounded-xl hover:bg-gray-700 transition-all"
                       >
                           {t.CANCEL}
                       </button>
                       <button 
                           onClick={handleProfileSubmit}
                           className="flex-1 py-4 bg-skate-neon text-black font-bold rounded-xl hover:bg-skate-neonHover transition-all shadow-lg active:scale-95"
                       >
                           {t.SAVE}
                       </button>
                   </div>
               </div>
           </div>
      )}

      {/* Header */}
      <header className="flex justify-between items-start pt-2 shrink-0">
        <div className="flex flex-col">
            <h1 className="text-[3.5rem] font-display font-bold text-white leading-[0.85] tracking-tight">
                SKATE<br/>
                <span className="text-skate-neon text-glow">SOLO</span>
            </h1>
            
            {/* Instagram ID Sub-header */}
            <a href="https://instagram.com/osteoclasts_" target="_blank" rel="noopener noreferrer" className="flex items-center space-x-1 mt-1 opacity-60 hover:opacity-100 transition-opacity w-fit">
                <Instagram className="w-3 h-3 text-skate-neon" />
                <span className="text-xs font-bold text-gray-400 tracking-wider">@OSTEOCLASTS_</span>
            </a>

            <div className="flex items-center mt-3">
                 <button 
                    onClick={() => setIsEditingDate(true)}
                    className="group flex items-center space-x-2 bg-white/5 hover:bg-white/10 px-4 py-1.5 rounded-full border border-white/5 transition-all active:scale-95"
                 >
                    <Calendar className="w-3.5 h-3.5 text-skate-neon" />
                    <span className="text-sm font-bold text-gray-300 group-hover:text-white transition-colors">
                        DAY <span className="text-white text-lg ml-1 font-display tracking-wider">{daysSkating}</span>
                    </span>
                    <Edit2 className="w-3 h-3 text-gray-600 group-hover:text-white ml-1 opacity-0 group-hover:opacity-100 transition-all" />
                 </button>
            </div>
        </div>
        
        {/* Right Actions */}
        <div className="flex flex-col items-end gap-3">
            <button 
                onClick={onLanguageToggle}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-full border border-white/10 bg-black/20 backdrop-blur text-gray-400 hover:text-white transition-colors"
            >
                <Globe className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold tracking-wider">{language}</span>
            </button>

            {user ? (
                <div className="flex items-center gap-2 bg-white/5 p-1 pl-3 rounded-full border border-white/5 backdrop-blur-sm">
                    <span className="text-xs font-bold text-white max-w-[60px] truncate">{user.name}</span>
                    <button 
                        onClick={onLogout}
                        className="bg-white/10 hover:bg-white/20 p-1.5 rounded-full transition-colors"
                    >
                        <LogOut className="w-3.5 h-3.5 text-gray-300" />
                    </button>
                </div>
            ) : (
                <button 
                    onClick={() => setShowProfileSetup(true)}
                    className="flex items-center space-x-2 px-4 py-3 bg-white text-black rounded-full font-bold text-xs hover:bg-gray-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.4)] active:scale-95 transform"
                >
                    <UserPlus className="w-4 h-4" />
                    <span>{t.LOGIN_GUEST}</span>
                </button>
            )}
        </div>
      </header>

      {/* --- DAILY QUESTS CARD --- */}
      <div className={`glass-card p-5 rounded-3xl border border-white/5 relative overflow-hidden transition-all duration-500 shrink-0 ${allClear ? 'shadow-[0_0_30px_rgba(204,255,0,0.15)] border-skate-neon/30' : ''}`}>
          {allClear && (
               <div className="absolute top-0 right-0 p-4 animate-fade-in z-10">
                   <div className="bg-skate-neon text-black px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center shadow-lg transform rotate-2">
                       <Award className="w-3 h-3 mr-1" /> ALL CLEAR
                   </div>
               </div>
          )}
          
          <div className="flex items-center space-x-2 mb-4">
              <Target className={`w-5 h-5 ${allClear ? 'text-skate-neon' : 'text-gray-400'}`} />
              <h3 className="text-sm font-bold uppercase tracking-widest text-white">
                  {language === 'KR' ? "일일 퀘스트" : "Daily Missions"}
              </h3>
          </div>

          <div className="space-y-3">
              {quests.map(quest => (
                  <div key={quest.id} className="group">
                      <div className="flex justify-between items-center mb-1.5">
                          <span className={`text-xs font-bold ${quest.completed ? 'text-white' : 'text-gray-400'}`}>
                              {quest.title}
                          </span>
                          <div className="flex items-center space-x-2">
                              <span className="text-[10px] font-mono text-gray-500">
                                  {Math.min(quest.current, quest.target)} / {quest.target}
                              </span>
                              {quest.completed ? (
                                  <CheckCircle className="w-4 h-4 text-skate-neon fill-skate-neon/20" />
                              ) : (
                                  <div className="w-4 h-4 rounded-full border border-gray-600" />
                              )}
                          </div>
                      </div>
                      <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                          <div 
                              className={`h-full rounded-full transition-all duration-500 ${quest.completed ? 'bg-skate-neon shadow-[0_0_10px_rgba(204,255,0,0.5)]' : 'bg-gray-600'}`}
                              style={{ width: `${Math.min((quest.current / quest.target) * 100, 100)}%` }}
                          />
                      </div>
                  </div>
              ))}
          </div>
      </div>

      {/* Main Stats (Bento Grid) */}
      <div className="grid grid-cols-2 gap-3 shrink-0">
        {/* Total Landed */}
        <div className="glass-card p-5 rounded-3xl flex flex-col justify-between h-32 relative overflow-hidden group">
             <div className="absolute right-[-20px] top-[-20px] w-24 h-24 bg-skate-neon/5 rounded-full blur-2xl group-hover:bg-skate-neon/10 transition-all"></div>
             <div className="flex items-center space-x-2 text-gray-400 mb-1 z-10">
                <Trophy className="w-4 h-4 text-skate-neon" />
                <span className="text-[10px] uppercase font-bold tracking-widest">{t.TOTAL_LANDED}</span>
             </div>
             <span className="text-5xl font-display font-bold text-white z-10">{totalLanded}</span>
        </div>

        {/* Avg Success */}
        <div className="glass-card p-5 rounded-3xl flex flex-col justify-between h-32 relative overflow-hidden group">
             <div className="absolute left-[-20px] bottom-[-20px] w-24 h-24 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-all"></div>
             <div className="flex items-center space-x-2 text-gray-400 mb-1 z-10">
                <Activity className="w-4 h-4 text-purple-400" />
                <span className="text-[10px] uppercase font-bold tracking-widest">{t.AVG_SUCCESS}</span>
             </div>
             <div className="flex items-baseline z-10">
                <span className="text-5xl font-display font-bold text-white">{avgSuccess}</span>
                <span className="text-lg font-display text-gray-500 ml-1">%</span>
             </div>
        </div>

        {/* Graph Card (Full Width) */}
        <div className="col-span-2 glass-card rounded-3xl p-5 h-48 flex flex-col relative overflow-hidden">
            <div className="flex justify-between items-center mb-2 z-10">
                <span className="text-[10px] uppercase font-bold tracking-widest text-gray-400">{t.PROGRESSION}</span>
                <div className="flex items-center text-skate-neon text-xs font-bold bg-skate-neon/10 px-2 py-0.5 rounded-full">
                    <ArrowUpRight className="w-3 h-3 mr-1" />
                    <span>Recent</span>
                </div>
            </div>
            <div className="absolute inset-0 bottom-0 left-0 right-0 h-full w-full opacity-50">
                <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 50, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ccff00" stopOpacity={0.5}/>
                            <stop offset="95%" stopColor="#ccff00" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <Tooltip 
                        contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '8px', fontSize: '12px' }}
                        itemStyle={{ color: '#ccff00' }}
                        cursor={{ stroke: '#ffffff30', strokeWidth: 1, strokeDasharray: '4 4' }}
                    />
                    <Area 
                        type="monotone" 
                        dataKey="successRate" 
                        stroke="#ccff00" 
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill="url(#colorSuccess)" 
                    />
                </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
      </div>

      {/* Main Actions */}
      <div className="space-y-4 shrink-0">
          {/* New Session Action - Hero Button */}
          <button 
            onClick={onStart}
            className="w-full relative overflow-hidden bg-skate-neon text-black p-1 rounded-[2.5rem] group shadow-[0_0_30px_rgba(204,255,0,0.15)] hover:shadow-[0_0_50px_rgba(204,255,0,0.3)] transition-all duration-500 active:scale-[0.98]"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500 rounded-[2.5rem]"></div>
            <div className="relative bg-skate-neon h-full rounded-[2.2rem] p-6 flex items-center justify-between border border-black/5">
                <div className="flex flex-col items-start z-10">
                    <span className="font-display text-4xl font-bold uppercase tracking-tight">{t.NEW_SESSION}</span>
                    <span className="text-xs font-bold uppercase tracking-widest opacity-60 mt-1">{t.CUSTOMIZED_TRAINING}</span>
                </div>
                <div className="w-14 h-14 bg-black/10 rounded-full flex items-center justify-center group-hover:bg-black/20 transition-colors">
                    <PlayCircle className="w-8 h-8 text-black" />
                </div>
            </div>
          </button>

          {/* Learning Action - Secondary */}
          <button 
            onClick={onLearning}
            className="w-full glass-card p-6 rounded-[2.5rem] flex items-center justify-between group active:scale-[0.98] transition-all hover:bg-white/5 border border-white/5"
          >
            <div className="flex flex-col items-start">
                <span className="font-display text-3xl font-bold uppercase text-gray-200 group-hover:text-white transition-colors">{t.LEARNING}</span>
                <span className="text-xs font-bold uppercase tracking-widest text-gray-500">{t.PRACTICE_THIS}</span>
            </div>
            <BookOpen className="w-8 h-8 text-gray-500 group-hover:text-white transition-colors" />
          </button>
      </div>

      {/* Footer / Credits */}
      <div className="flex flex-col items-center justify-center mt-4 pb-4 space-y-2 shrink-0">
        <a 
          href="https://instagram.com/osteoclasts_" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-5 py-2 rounded-full bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/20 transition-all duration-300"
        >
          <Instagram className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-gray-500 text-[10px] font-mono tracking-wide">
            DESIGNED BY <span className="font-bold text-gray-300">@OSTEOCLASTS_</span>
          </span>
        </a>
        <span className="text-[10px] text-gray-600 font-mono tracking-widest">v1.2.2</span>
      </div>
    </div>
  );
};

export default Dashboard;
