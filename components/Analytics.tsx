import React, { useState, useEffect, useRef } from 'react';
import { SessionResult, Language, AnalyticsInsight, User } from '../types';
import { TRANSLATIONS } from '../constants';
import { ResponsiveContainer, AreaChart, Area, XAxis, Tooltip, CartesianGrid } from 'recharts';
import { Trophy, Target, BrainCircuit, Sparkles, Instagram, Lock, BarChart } from 'lucide-react';
import { getAnalyticsInsight } from '../services/geminiService';

interface Props {
  history: SessionResult[];
  language: Language;
  daysSkating?: number;
  user: User | null;
  onLogin: () => void;
  onRequestPro?: () => void;
}

const Analytics: React.FC<Props> = ({ history, language, daysSkating = 1, user, onLogin, onRequestPro }) => {
  const t = TRANSLATIONS[language];
  const [insight, setInsight] = useState<AnalyticsInsight | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const sortedHistory = [...history].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const progressData = sortedHistory.slice(-10).map(h => ({
      date: new Date(h.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      rate: Math.round((h.landedCount / h.totalTricks) * 100)
  }));

  // Only show mock data if user is NOT logged in (preview mode behind lock screen)
  const chartData = progressData.length > 0 
    ? progressData 
    : (user ? [] : [
      { date: 'Mon', rate: 20 }, { date: 'Tue', rate: 45 }, { date: 'Wed', rate: 30 }, 
      { date: 'Thu', rate: 70 }, { date: 'Fri', rate: 55 }, { date: 'Sat', rate: 85 }
  ]);

  const totalSessions = history.length;
  const totalLanded = history.reduce((acc, curr) => acc + curr.landedCount, 0);
  const avgSuccess = totalSessions > 0 
    ? Math.round(history.reduce((acc, curr) => acc + (curr.landedCount/curr.totalTricks), 0) / totalSessions * 100) 
    : 0;

  const handleGenerateInsight = async () => {
      if (history.length === 0) return;
      setIsGenerating(true);
      const recentHistory = sortedHistory.slice(-5).map(h => ({
          date: new Date(h.date).toISOString().split('T')[0],
          rate: Math.round((h.landedCount / h.totalTricks) * 100)
      }));

      // Mock calculation for weaknesses
      const weaknesses = [{ name: 'Kickflip', rate: 30, attempts: 10 }];

      const data = await getAnalyticsInsight({
          totalSessions,
          successRate: avgSuccess,
          weaknesses,
          recentHistory
      }, language, daysSkating);
      
      setInsight(data);
      setIsGenerating(false);
  };

  useEffect(() => {
      if (history.length > 0 && !insight && !isGenerating) {
          handleGenerateInsight();
      }
  }, [history.length]);

  return (
    <div className="flex flex-col h-full p-6 space-y-6 overflow-y-auto pb-32 animate-fade-in font-sans bg-gray-50 dark:bg-zinc-950 transition-colors duration-300" ref={containerRef}>
        
        {/* LOCK SCREEN */}
        {!user && (
            <div className="absolute inset-0 z-50 bg-white/60 dark:bg-black/60 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center rounded-[3rem]">
                 <div className="w-16 h-16 bg-skate-black dark:bg-white text-skate-yellow dark:text-black rounded-full flex items-center justify-center shadow-lg mb-4">
                    <Lock className="w-6 h-6" />
                 </div>
                 <h2 className="text-2xl font-black text-skate-black dark:text-white mb-2">Analytics Locked</h2>
                 <p className="text-gray-500 mb-8 max-w-xs font-medium">Create a profile to unlock detailed progression stats and AI coaching.</p>
                 <button onClick={onLogin} className="px-8 py-4 bg-skate-yellow text-skate-black rounded-full font-bold hover:bg-yellow-400 transition-all w-full max-w-xs shadow-lg">
                     {t.LOGIN_GUEST}
                 </button>
            </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between shrink-0 pt-2">
            <h2 className="text-3xl font-black text-skate-black dark:text-white tracking-tighter">{t.ANALYTICS}</h2>
            <button className="p-3 bg-white dark:bg-zinc-900 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors shadow-sm border border-gray-200 dark:border-zinc-800">
                <Instagram className="w-5 h-5 text-skate-black dark:text-white" />
            </button>
        </div>

        {/* AI Insight Card */}
        <div className="pop-card p-6 bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-gray-200 dark:border-zinc-700 shadow-pop flex-shrink-0 relative">
            <div className="flex items-center gap-3 mb-4">
                <BrainCircuit className="w-6 h-6 text-skate-black dark:text-white" />
                <h3 className="text-lg font-bold text-skate-black dark:text-white">AI Diagnosis</h3>
            </div>

            {!insight ? (
                <div className="text-center py-6">
                    {history.length > 0 ? (
                         <button onClick={handleGenerateInsight} className="w-full py-3 bg-gray-50 dark:bg-zinc-800 text-skate-black dark:text-white shadow-sm rounded-xl font-bold hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors flex items-center justify-center gap-2 border border-gray-200 dark:border-zinc-700">
                             <Sparkles className="w-4 h-4 text-skate-yellow fill-skate-yellow" />
                             {isGenerating ? "Analyzing..." : "Generate Report"}
                         </button>
                    ) : (
                        <p className="text-gray-400 text-sm font-medium">Complete a session to get insights.</p>
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    <h4 className="text-2xl font-black text-skate-black dark:text-white leading-tight break-keep whitespace-pre-wrap">"{insight.diagnosis}"</h4>
                    <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed font-medium whitespace-pre-wrap break-words">{insight.summary}</p>
                    <div className="bg-gray-50 dark:bg-zinc-800/50 rounded-xl p-4">
                        <p className="text-skate-deep dark:text-skate-yellow text-xs font-black uppercase mb-2">Focus on</p>
                        <ul className="space-y-2">
                            {insight.improvementSuggestions.slice(0, 2).map((s, i) => (
                                <li key={i} className="flex gap-2 text-sm text-gray-600 dark:text-gray-300 font-medium">
                                    <span className="text-skate-yellow font-black">•</span>
                                    {s}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </div>

        {/* Chart Card */}
        <div className="w-full bg-white dark:bg-zinc-900 rounded-[2.5rem] p-6 shadow-pop relative overflow-hidden flex-shrink-0 border border-gray-200 dark:border-zinc-800">
             <div className="flex justify-between items-center mb-8 relative z-10">
                 <div>
                    <p className="text-gray-400 text-sm font-bold uppercase tracking-widest mb-1">{t.AVG_SUCCESS}</p>
                    <h3 className="text-5xl font-black text-skate-black dark:text-white">{avgSuccess}%</h3>
                 </div>
                 <div className="bg-skate-deep dark:bg-skate-yellow dark:text-skate-black text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                     Last 10
                 </div>
             </div>

             <div className="h-48 w-full -mx-2 flex items-center justify-center">
                {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#FFE500" stopOpacity={0.4}/>
                                    <stop offset="95%" stopColor="#FFE500" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" strokeOpacity={0.2} />
                            <XAxis 
                                dataKey="date" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{fill: '#A8A29E', fontSize: 10, fontWeight: 700}} 
                                dy={10}
                            />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#1C1917', border: 'none', borderRadius: '12px', color: '#fff', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                                itemStyle={{ color: '#FFE500', fontWeight: 'bold' }}
                                cursor={{ stroke: '#FFE500', strokeWidth: 2 }}
                            />
                            <Area 
                                type="monotone" 
                                dataKey="rate" 
                                stroke="#EAB308" 
                                strokeWidth={4} 
                                fill="url(#colorRate)" 
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex flex-col items-center justify-center opacity-40">
                        <BarChart className="w-12 h-12 text-gray-400 dark:text-gray-600 mb-2" />
                        <p className="text-gray-400 dark:text-gray-600 font-bold text-sm">No session data yet</p>
                    </div>
                )}
             </div>
        </div>

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-2 gap-4 flex-shrink-0">
             {/* Total Sessions */}
             <div className="pop-card bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-[2.5rem] p-6 flex flex-col justify-between h-40 shadow-sm">
                 <div className="w-10 h-10 rounded-full bg-skate-deep dark:bg-skate-yellow dark:text-skate-black text-white flex items-center justify-center mb-2">
                     <Target className="w-5 h-5" />
                 </div>
                 <div>
                     <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">{t.TOTAL_SESSIONS}</p>
                     <p className="text-2xl font-black text-skate-black dark:text-white mt-1">{totalSessions}</p>
                 </div>
             </div>

             {/* Total Landed */}
             <div className="pop-card bg-skate-yellow rounded-[2.5rem] p-6 flex flex-col justify-between h-40 shadow-pop">
                 <div className="w-10 h-10 rounded-full bg-white/40 text-skate-black flex items-center justify-center mb-2">
                     <Trophy className="w-5 h-5" />
                 </div>
                 <div>
                     <p className="text-skate-black/60 text-xs font-bold uppercase tracking-widest">{t.TOTAL_LANDED}</p>
                     <p className="text-2xl font-black text-skate-black mt-1">{totalLanded}</p>
                 </div>
             </div>
        </div>
    </div>
  );
};

export default Analytics;