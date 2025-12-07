import React, { useState, useEffect, useRef } from 'react';
import { SessionResult, Language, AnalyticsInsight } from '../types';
import { TRANSLATIONS } from '../constants';
import { ResponsiveContainer, AreaChart, Area, XAxis, Tooltip } from 'recharts';
import { Trophy, TrendingUp, AlertTriangle, Target, BrainCircuit, Sparkles, RefreshCw, Star, Instagram } from 'lucide-react';
import { getAnalyticsInsight } from '../services/geminiService';
import html2canvas from 'html2canvas';

interface Props {
  history: SessionResult[];
  language: Language;
  daysSkating?: number;
}

const Analytics: React.FC<Props> = ({ history, language, daysSkating = 1 }) => {
  const t = TRANSLATIONS[language];
  const [insight, setInsight] = useState<AnalyticsInsight | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const totalSessions = history.length;
  const totalTricks = history.reduce((acc, curr) => acc + curr.totalTricks, 0);
  const totalLanded = history.reduce((acc, curr) => acc + curr.landedCount, 0);
  const globalSuccessRate = totalTricks > 0 ? Math.round((totalLanded / totalTricks) * 100) : 0;

  let currentStreak = 0;
  let bestStreak = 0;
  const sortedHistory = [...history].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  sortedHistory.forEach(s => {
      if ((s.landedCount / s.totalTricks) > 0.5) {
          currentStreak++;
          if (currentStreak > bestStreak) bestStreak = currentStreak;
      } else {
          currentStreak = 0;
      }
  });

  const trickStats: Record<string, { attempts: number, landed: number }> = {};
  history.forEach(session => {
      session.trickHistory.forEach(attempt => {
          const name = attempt.trick.name;
          if (!trickStats[name]) trickStats[name] = { attempts: 0, landed: 0 };
          trickStats[name].attempts++;
          if (attempt.landed) trickStats[name].landed++;
      });
  });

  const weaknesses = Object.entries(trickStats)
      .map(([name, stats]) => ({
          name,
          rate: Math.round((stats.landed / stats.attempts) * 100),
          attempts: stats.attempts
      }))
      .filter(w => w.attempts >= 3)
      .sort((a, b) => a.rate - b.rate)
      .slice(0, 5);

  const progressData = sortedHistory.slice(-10).map(h => ({
      date: new Date(h.date).toLocaleDateString(),
      rate: Math.round((h.landedCount / h.totalTricks) * 100)
  }));

  const handleGenerateInsight = async () => {
      if (history.length === 0) return;
      setIsGenerating(true);
      const recentHistory = sortedHistory.slice(-5).map(h => ({
          date: new Date(h.date).toISOString().split('T')[0],
          rate: Math.round((h.landedCount / h.totalTricks) * 100)
      }));

      const data = await getAnalyticsInsight({
          totalSessions,
          successRate: globalSuccessRate,
          weaknesses,
          recentHistory
      }, language, daysSkating);
      
      setInsight(data);
      setIsGenerating(false);
  };

  const handleShare = async () => {
    if (!containerRef.current) return;
    setIsSharing(true);
    try {
        const canvas = await html2canvas(containerRef.current, {
            backgroundColor: '#050505',
            scale: 2,
            logging: false,
            useCORS: true
        });

        canvas.toBlob(async (blob) => {
            if (!blob) {
                setIsSharing(false);
                return;
            }
            const file = new File([blob], 'skate-solo-analytics.png', { type: 'image/png' });
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                try {
                    await navigator.share({
                        files: [file],
                        title: 'Skate Solo Trainer Stats',
                        text: 'Check out my skate progression! 🛹🔥'
                    });
                } catch (shareError) {
                    console.log('Share cancelled', shareError);
                }
            } else {
                const link = document.createElement('a');
                link.href = canvas.toDataURL('image/png');
                link.download = 'skate-solo-analytics.png';
                link.click();
            }
            setIsSharing(false);
        }, 'image/png');
    } catch (error) {
        console.error("Failed screenshot:", error);
        setIsSharing(false);
    }
  };

  useEffect(() => {
      if (history.length > 0 && !insight && !isGenerating) {
          handleGenerateInsight();
      }
  }, [history.length]);

  const getExperienceLevel = (days: number) => {
      if (days <= 30) return t.LEVEL_BEGINNER;
      if (days <= 180) return t.LEVEL_INTERMEDIATE;
      return t.LEVEL_ADVANCED;
  };

  return (
    <div className="flex flex-col h-full p-6 space-y-6 overflow-y-auto pb-32 animate-fade-in" ref={containerRef}>
        
        <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
                <Target className="text-skate-neon w-6 h-6" />
                <h2 className="text-3xl font-display font-bold uppercase tracking-wide">{t.ANALYTICS}</h2>
            </div>
            <button
                onClick={handleShare}
                disabled={isSharing}
                className="flex items-center space-x-1 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full text-white font-bold text-xs transition-all active:scale-95 disabled:opacity-50 border border-white/10 backdrop-blur"
            >
                {isSharing ? (
                    <RefreshCw className="w-3 h-3 animate-spin" />
                ) : (
                    <Instagram className="w-3.5 h-3.5" />
                )}
                <span>{isSharing ? t.SHARING : t.SHARE_STORY}</span>
            </button>
        </div>
        
        <div className="flex justify-end mb-2">
            <div className="flex items-center space-x-2 bg-gradient-to-r from-skate-neon/20 to-transparent px-3 py-1 rounded-full border border-skate-neon/30">
                <Star className="w-3.5 h-3.5 text-skate-neon fill-skate-neon" />
                <span className="text-[10px] font-bold text-gray-300 uppercase tracking-wider">{t.EXPERIENCE_LEVEL}: <span className="text-white ml-1">{getExperienceLevel(daysSkating)}</span></span>
            </div>
        </div>

        {/* AI Diagnostic Summary Section - Holographic Card */}
        <div className="w-full relative rounded-3xl p-[1px] bg-gradient-to-br from-skate-neon/50 via-purple-500/30 to-transparent shadow-2xl overflow-hidden group">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-xl rounded-3xl h-full w-full z-0"></div>
            <div className="absolute top-0 right-0 w-48 h-48 bg-skate-neon/10 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/2"></div>
            
            <div className="relative z-10 p-6 min-h-[300px] flex flex-col justify-center">
            {!insight ? (
                <div className="flex flex-col items-center justify-center py-8 text-center space-y-6">
                    <div className="relative">
                        <div className="absolute inset-0 bg-skate-neon/30 blur-xl rounded-full"></div>
                        <BrainCircuit className={`w-12 h-12 text-white relative z-10 ${isGenerating ? 'animate-pulse' : ''}`} />
                    </div>
                    
                    {isGenerating ? (
                         <p className="text-skate-neon text-sm uppercase tracking-widest font-bold animate-pulse">{t.GENERATING_INSIGHT}</p>
                    ) : (
                        <div className="flex flex-col items-center space-y-4">
                            <p className="text-gray-400 text-sm max-w-xs font-medium">
                                {history.length > 0 ? t.COMPREHENSIVE_DIAGNOSIS : "Complete a session to unlock AI analysis."}
                            </p>
                            {history.length > 0 && (
                                <button onClick={handleGenerateInsight} className="bg-skate-neon text-black px-6 py-3 rounded-xl font-bold uppercase hover:bg-skate-neonHover transition-all flex items-center space-x-2 shadow-lg active:scale-95">
                                    <Sparkles className="w-4 h-4" />
                                    <span>{t.GENERATE_INSIGHT}</span>
                                </button>
                            )}
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-6 animate-fade-in w-full">
                    <div>
                        <span className="text-skate-neon text-[10px] font-bold uppercase tracking-[0.2em] mb-2 block flex items-center">
                            <BrainCircuit className="w-3 h-3 mr-2" />
                            AI COACH INSIGHT
                        </span>
                        <h3 className="text-3xl font-display font-bold text-white leading-tight drop-shadow-lg">"{insight.diagnosis}"</h3>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                        <div className="space-y-2">
                            <p className="text-gray-200 text-sm leading-relaxed font-medium">
                                {insight.summary}
                            </p>
                        </div>
                    </div>

                    <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                        <h4 className="text-gray-400 text-[10px] font-bold uppercase mb-3 flex items-center tracking-wider">
                            <TrendingUp className="w-3 h-3 mr-1" />
                            {t.IMPROVEMENT_DIRECTIONS}
                        </h4>
                        <ul className="space-y-2">
                            {insight.improvementSuggestions.map((suggestion, idx) => (
                                <li key={idx} className="flex items-start text-sm text-gray-300">
                                    <span className="text-skate-neon font-display font-bold mr-3 text-lg leading-none mt-0.5">{idx + 1}</span>
                                    {suggestion}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="pt-4 border-t border-white/10">
                        <p className="text-white text-sm italic font-medium opacity-80">
                            "{insight.aiFeedback}"
                        </p>
                    </div>
                </div>
            )}
            </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
             <div className="glass-card p-4 rounded-2xl">
                <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">{t.TOTAL_SESSIONS}</p>
                <p className="text-3xl font-display font-bold text-white mt-1">{totalSessions}</p>
            </div>
             <div className="glass-card p-4 rounded-2xl">
                <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">{t.AVG_SUCCESS}</p>
                <p className="text-3xl font-display font-bold text-skate-neon mt-1">{globalSuccessRate}%</p>
            </div>
             <div className="glass-card p-4 rounded-2xl">
                <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">{t.TOTAL_LANDED}</p>
                <p className="text-3xl font-display font-bold text-white mt-1">{totalLanded}</p>
            </div>
             <div className="glass-card p-4 rounded-2xl">
                <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">{t.BEST_STREAK}</p>
                <p className="text-3xl font-display font-bold text-white mt-1">{bestStreak}</p>
            </div>
        </div>

        {/* Progress Graph */}
        <div className="glass-card rounded-3xl p-5 h-64 flex flex-col">
            <div className="flex items-center space-x-2 mb-4">
                <TrendingUp className="w-4 h-4 text-gray-400" />
                <h3 className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">{t.PROGRESSION}</h3>
            </div>
            <div className="w-full h-full min-h-0"> 
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={progressData}>
                        <defs>
                            <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#ccff00" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#ccff00" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <XAxis dataKey="date" hide />
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#1e1e1e', border: 'none', borderRadius: '8px', color: '#fff' }}
                            itemStyle={{ color: '#ccff00' }}
                            cursor={{ stroke: '#444', strokeWidth: 1 }}
                        />
                        <Area type="monotone" dataKey="rate" stroke="#ccff00" fill="url(#colorRate)" strokeWidth={3} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Weakness Analysis */}
        <div className="glass-card rounded-3xl p-5">
            <div className="flex items-center space-x-2 mb-4">
                <AlertTriangle className="w-4 h-4 text-skate-alert" />
                <h3 className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">{t.WEAKNESS_ANALYSIS}</h3>
            </div>
            <div className="space-y-3">
                {weaknesses.length > 0 ? weaknesses.map((w, idx) => (
                    <div key={idx} className="flex justify-between items-center group">
                        <span className="text-white font-bold text-sm">{w.name}</span>
                        <div className="flex items-center space-x-3">
                             <div className="w-24 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                <div className="h-full bg-skate-alert rounded-full" style={{ width: `${w.rate}%` }}></div>
                             </div>
                             <span className="text-xs text-skate-alert font-bold w-8 text-right">{w.rate}%</span>
                        </div>
                    </div>
                )) : (
                    <p className="text-gray-500 text-sm italic">Not enough data yet.</p>
                )}
            </div>
        </div>
    </div>
  );
};

export default Analytics;