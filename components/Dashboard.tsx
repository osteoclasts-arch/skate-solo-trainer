import React, { useState } from 'react';
import { TRANSLATIONS } from '../constants';
import { Play, BookOpen, Eye, Edit2, LogOut, CheckCircle, Zap, UserPlus, Calendar, ArrowUpRight, TrendingUp } from 'lucide-react';
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

  const recentSessions = history.slice(0, 3); // Only show top 3 for cleaner UI

  return (
    <div className="flex flex-col h-full p-6 space-y-6 overflow-y-auto pb-32 relative animate-fade-in font-sans bg-skate-bg">
      
      {/* Date Edit Modal */}
      {isEditingDate && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in">
              <div className="bg-white p-6 rounded-[2rem] w-full max-w-sm shadow-2xl">
                  <h3 className="text-2xl font-bold text-skate-black mb-2">{t.SET_START_DATE}</h3>
                  <input 
                      type="date" 
                      value={tempDate}
                      onChange={(e) => setTempDate(e.target.value)}
                      className="w-full bg-skate-lightGray border-none rounded-2xl p-4 text-skate-black mb-6 focus:ring-2 focus:ring-skate-yellow outline-none"
                  />
                  <div className="flex gap-3">
                      <button onClick={() => setIsEditingDate(false)} className="flex-1 py-4 bg-gray-100 text-gray-500 font-bold rounded-2xl hover:bg-gray-200 transition-all">{t.CANCEL}</button>
                      <button onClick={handleSaveDate} className="flex-1 py-4 bg-skate-black text-white font-bold rounded-2xl hover:bg-gray-800 transition-all">{t.SAVE}</button>
                  </div>
              </div>
          </div>
      )}

      {/* Profile Setup Modal */}
      {showProfileSetup && (
           <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in">
               <div className="bg-white p-8 rounded-[2.5rem] w-full max-w-sm shadow-2xl relative overflow-hidden">
                   <h3 className="text-3xl font-bold text-skate-black mb-2">{t.PROFILE_SETUP}</h3>
                   <div className="space-y-4 mt-6">
                       <input 
                           type="text" 
                           placeholder={t.ENTER_NICKNAME}
                           value={setupName}
                           onChange={(e) => setSetupName(e.target.value)}
                           className="w-full bg-skate-lightGray border-none rounded-2xl p-4 text-skate-black focus:ring-2 focus:ring-skate-yellow outline-none"
                       />
                       <input 
                           type="number" 
                           placeholder={t.AGE}
                           value={setupAge}
                           onChange={(e) => setSetupAge(e.target.value)}
                           className="w-full bg-skate-lightGray border-none rounded-2xl p-4 text-skate-black focus:ring-2 focus:ring-skate-yellow outline-none"
                       />
                       <input 
                           type="date" 
                           value={setupDate}
                           onChange={(e) => setSetupDate(e.target.value)}
                           className="w-full bg-skate-lightGray border-none rounded-2xl p-4 text-skate-black focus:ring-2 focus:ring-skate-yellow outline-none"
                       />
                   </div>
                   <div className="flex gap-3 mt-8">
                       <button onClick={() => setShowProfileSetup(false)} className="flex-1 py-4 bg-gray-100 text-gray-500 font-bold rounded-2xl hover:bg-gray-200 transition-all">{t.CANCEL}</button>
                       <button onClick={handleProfileSubmit} className="flex-1 py-4 bg-skate-yellow text-skate-black font-bold rounded-2xl hover:opacity-90 transition-all">{t.SAVE}</button>
                   </div>
               </div>
           </div>
      )}

      {/* Header */}
      <header className="flex justify-between items-start shrink-0 pt-2">
        <div>
            <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 border-2 border-white shadow-sm">
                    {/* Placeholder Avatar */}
                    <div className="w-full h-full bg-gradient-to-br from-skate-yellow to-skate-orange"></div>
                </div>
                 {user ? (
                     <button onClick={onLogout} className="text-xs font-bold text-gray-400 bg-white px-2 py-1 rounded-full border border-gray-100 hover:bg-gray-50">
                        {t.LOGOUT}
                     </button>
                 ) : (
                     <button onClick={() => setShowProfileSetup(true)} className="text-xs font-bold text-skate-black bg-skate-yellow px-2 py-1 rounded-full hover:opacity-80">
                        {t.LOGIN_GUEST}
                     </button>
                 )}
            </div>
            <h1 className="text-4xl font-display font-black text-skate-black leading-[0.9] tracking-tight">
                {user ? user.name : "Skater"}'s<br />
                <span className="text-gray-400">Daily Trace</span>
                <span className="text-skate-yellow ml-1 animate-pulse">✨</span>
            </h1>
        </div>
        
        <button 
            onClick={onLanguageToggle}
            className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-xs font-bold text-skate-black shadow-sm border border-gray-100"
        >
            {language}
        </button>
      </header>

      {/* Chips */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide shrink-0">
          <button className="px-5 py-2 rounded-full bg-skate-black text-white text-sm font-bold shadow-md whitespace-nowrap">All</button>
          <button className="px-5 py-2 rounded-full bg-white text-gray-400 text-sm font-bold border border-gray-100 whitespace-nowrap">Street</button>
          <button className="px-5 py-2 rounded-full bg-white text-gray-400 text-sm font-bold border border-gray-100 whitespace-nowrap">Park</button>
          <button className="px-5 py-2 rounded-full bg-white text-gray-400 text-sm font-bold border border-gray-100 whitespace-nowrap">Freestyle</button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 gap-6">
          
          {/* Hero Card - YELLOW (Gen Z Vibe) */}
          <div className="w-full p-7 rounded-[2.5rem] bg-skate-yellow relative overflow-hidden shadow-pop pop-card min-h-[220px] flex flex-col justify-between group cursor-pointer" onClick={() => setIsEditingDate(true)}>
             <div className="absolute top-4 right-4 bg-white/30 backdrop-blur-md px-3 py-1 rounded-full">
                <span className="text-xs font-black text-skate-black uppercase tracking-wider">{new Date().getFullYear()} / {new Date().getMonth() + 1}</span>
             </div>
             
             {/* "Sticker" decorations */}
             <div className="absolute -bottom-8 -right-8 w-40 h-40 bg-white/20 rounded-full blur-xl group-hover:scale-110 transition-transform duration-500"></div>
             
             <div className="relative z-10">
                <p className="text-sm font-bold text-skate-black/60 uppercase tracking-widest mb-1">{t.DAYS_SKATING}</p>
                <h2 className="text-5xl font-black text-skate-black tracking-tight leading-none">
                   Skating with<br/>Passion
                </h2>
                <div className="flex items-center gap-2 mt-2">
                    <span className="text-lg font-medium text-skate-black/80">{daysSkating} days streak</span>
                </div>
             </div>

             <div className="flex gap-2 relative z-10 mt-4">
                 <div className="w-10 h-10 rounded-full bg-white/40 flex items-center justify-center">
                     <Calendar className="w-5 h-5 text-skate-black" />
                 </div>
                 <div className="w-10 h-10 rounded-full bg-skate-black/10 flex items-center justify-center">
                     <TrendingUp className="w-5 h-5 text-skate-black" />
                 </div>
                 <div className="w-10 h-10 rounded-full bg-skate-blue/30 flex items-center justify-center">
                     <Zap className="w-5 h-5 text-skate-black" />
                 </div>
             </div>
          </div>

          {/* Action Row - "Start" is primary */}
          <div className="flex gap-4 h-40">
              <button 
                onClick={onStart}
                className="flex-[1.5] bg-white rounded-[2.5rem] p-6 shadow-pop pop-card relative overflow-hidden flex flex-col justify-between group"
              >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-skate-black rounded-bl-[2.5rem] flex items-center justify-center group-hover:scale-105 transition-transform">
                      <ArrowUpRight className="w-8 h-8 text-skate-yellow" />
                  </div>
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                      <Play className="w-5 h-5 ml-1 text-skate-black" />
                  </div>
                  <div>
                      <h3 className="text-2xl font-black text-skate-black leading-none">Train</h3>
                      <p className="text-xs text-gray-400 font-bold mt-1">START SESSION</p>
                  </div>
              </button>

              <button 
                onClick={onLearning}
                className="flex-1 bg-skate-deep rounded-[2.5rem] p-6 shadow-pop pop-card relative overflow-hidden flex flex-col justify-between text-white group"
              >
                  <div className="absolute -right-4 -top-4 w-20 h-20 bg-white/10 rounded-full blur-xl"></div>
                  <BookOpen className="w-8 h-8 text-white/80" />
                  <div>
                      <h3 className="text-xl font-bold leading-none">Learn</h3>
                      <p className="text-[10px] text-white/60 font-bold mt-1 uppercase">Trick Guide</p>
                  </div>
              </button>
          </div>

          {/* Recent History - Brown Card style */}
          <div className="w-full bg-skate-deep rounded-[2.5rem] p-6 shadow-pop text-white relative overflow-hidden min-h-[200px]">
              {/* Abstract CD/Vinyl decoration like in reference */}
              <div className="absolute -right-12 bottom-4 w-40 h-40 rounded-full border-[12px] border-white/5 opacity-50"></div>
              <div className="absolute -right-12 bottom-4 w-40 h-40 rounded-full border-[40px] border-black/20 opacity-30"></div>

              <div className="relative z-10 mb-4 flex justify-between items-center">
                  <div>
                      <h3 className="text-2xl font-black text-white/90">Recent<br/>History</h3>
                      <p className="text-white/50 text-xs font-bold mt-1">{recentSessions.length} sessions recorded</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-white" />
                  </div>
              </div>

              <div className="relative z-10 space-y-3">
                  {recentSessions.length > 0 ? recentSessions.map((session, idx) => (
                      <div key={idx} className="flex items-center gap-3 bg-white/10 backdrop-blur-sm p-3 rounded-2xl border border-white/5">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-black ${session.landedCount/session.totalTricks >= 0.5 ? 'bg-skate-yellow text-skate-black' : 'bg-white/20 text-white'}`}>
                              {Math.round((session.landedCount / session.totalTricks) * 100)}%
                          </div>
                          <div className="flex-1">
                              <p className="text-sm font-bold text-white">{new Date(session.date).toLocaleDateString()}</p>
                              <p className="text-[10px] text-white/60 font-medium uppercase">{session.totalTricks} Tricks • {session.difficulty}</p>
                          </div>
                      </div>
                  )) : (
                      <div className="text-white/40 text-sm font-medium py-4 text-center">
                          No sessions yet. Let's skate!
                      </div>
                  )}
              </div>
          </div>

      </div>
    </div>
  );
};

export default Dashboard;