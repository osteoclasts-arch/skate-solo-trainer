import React, { useState } from 'react';
import { TRANSLATIONS } from '../constants';
import { ResponsiveContainer, AreaChart, Area, Tooltip } from 'recharts';
import { PlayCircle, Trophy, Activity, Globe, BookOpen, Calendar, Edit2, LogOut, Instagram, ArrowUpRight } from 'lucide-react';
import { SessionResult, Language, User } from '../types';

interface Props {
  onStart: () => void;
  onLearning: () => void;
  history: SessionResult[];
  language: Language;
  onLanguageToggle: () => void;
  daysSkating: number;
  startDate: string;
  onUpdateStartDate: (date: string) => void;
  user: User | null;
  onLogin: () => void;
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

  const GoogleIcon = () => (
      <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
      </svg>
  );

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

      {/* Header */}
      <header className="flex justify-between items-start pt-2">
        <div className="flex flex-col">
            <h1 className="text-[3.5rem] font-display font-bold text-white leading-[0.85] tracking-tight">
                SKATE<br/>
                <span className="text-skate-neon text-glow">SOLO</span>
            </h1>
            
            {/* Instagram ID Sub-header */}
            <a href="https://instagram.com/osteoclasts_" target="_blank" rel="noopener noreferrer" className="flex items-center space-x-1 mt-1 opacity-60 hover:opacity-100 transition-opacity">
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
                    onClick={onLogin}
                    className="flex items-center px-6 py-3 bg-white text-black rounded-full font-bold text-sm hover:bg-gray-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.4)] active:scale-95 transform"
                >
                    <GoogleIcon />
                    {t.LOGIN_GOOGLE}
                </button>
            )}
        </div>
      </header>

      {/* Main Stats (Bento Grid) */}
      <div className="grid grid-cols-2 gap-3">
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
      <div className="space-y-4">
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
      <div className="flex flex-col items-center justify-center mt-4 pb-4 space-y-2">
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
        <span className="text-[10px] text-gray-600 font-mono tracking-widest">v1.2.0</span>
      </div>
    </div>
  );
};

export default Dashboard;