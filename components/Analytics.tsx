

import React, { useState, useEffect, useRef } from 'react';
import { SessionResult, Language, AnalyticsInsight } from '../types';
import { TRANSLATIONS } from '../constants';
import { ResponsiveContainer, AreaChart, Area, XAxis, Tooltip } from 'recharts';
import { Trophy, TrendingUp, AlertTriangle, Target, BrainCircuit, Sparkles, RefreshCw, Calendar, Star, Share2, Instagram } from 'lucide-react';
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

  // Stats Logic
  const totalSessions = history.length;
  const totalTricks = history.reduce((acc, curr) => acc + curr.totalTricks, 0);
  const totalLanded = history.reduce((acc, curr) => acc + curr.landedCount, 0);
  const globalSuccessRate = totalTricks > 0 ? Math.round((totalLanded / totalTricks) * 100) : 0;

  // Streak logic (basic implementation)
  let currentStreak = 0;
  let bestStreak = 0;
  // Sort by date ascending for streak
  const sortedHistory = [...history].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  sortedHistory.forEach(s => {
      const landed = s.landedCount;
      // Assume a "good" session is > 50%
      if ((landed / s.totalTricks) > 0.5) {
          currentStreak++;
          if (currentStreak > bestStreak) bestStreak = currentStreak;
      } else {
          currentStreak = 0;
      }
  });

  // Weakness Analysis
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
      .filter(w => w.attempts >= 3) // Only count tricks attempted at least 3 times
      .sort((a, b) => a.rate - b.rate)
      .slice(0, 5); // Bottom 5

  // Chart Data
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
        // Use html2canvas to capture the element
        const canvas = await html2canvas(containerRef.current, {
            backgroundColor: '#000000', // Ensure black background
            scale: 2, // Higher resolution
            logging: false,
            useCORS: true
        });

        canvas.toBlob(async (blob) => {
            if (!blob) {
                setIsSharing(false);
                return;
            }

            const file = new File([blob], 'skate-solo-analytics.png', { type: 'image/png' });

            // Try using Web Share API Level 2 (files support)
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                try {
                    await navigator.share({
                        files: [file],
                        title: 'Skate Solo Trainer Stats',
                        text: 'Check out my skate progression! 🛹🔥'
                    });
                } catch (shareError) {
                    console.log('Share cancelled or failed', shareError);
                }
            } else {
                // Fallback for desktop: download the image
                const link = document.createElement('a');
                link.href = canvas.toDataURL('image/png');
                link.download = 'skate-solo-analytics.png';
                link.click();
            }
            setIsSharing(false);
        }, 'image/png');
    } catch (error) {
        console.error("Failed to capture screenshot:", error);
        setIsSharing(false);
    }
  };

  // Auto-generate insight on mount if we have history and no insight yet
  useEffect(() => {
      if (history.length > 0 && !insight && !isGenerating) {
          handleGenerateInsight();
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [history.length]); // Retry if history length changes (e.g., loaded from storage)

  const getExperienceLevel = (days: number) => {
      if (days <= 30) return t.LEVEL_BEGINNER;
      if (days <= 180) return t.LEVEL_INTERMEDIATE;
      return t.LEVEL_ADVANCED;
  };

  return (
    <div className="flex flex-col h-full bg-black text-white p-6 space-y-6 overflow-y-auto pb-24" ref={containerRef}>
        
        <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
                <Target className="text-skate-neon w-6 h-6" />
                <h2 className="text-3xl font-display font-bold uppercase tracking-wide">{t.ANALYTICS}</h2>
            </div>
            <div className="flex items-center space-x-2">
                <button
                    onClick={handleShare}
                    disabled={isSharing}
                    className="flex items-center space-x-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 px-3 py-1.5 rounded-full text-white font-bold text-xs transition-all shadow-lg active:scale-95 disabled:opacity-50"
                >
                    {isSharing ? (
                        <RefreshCw className="w-3 h-3 animate-spin" />
                    ) : (
                        <Instagram className="w-3 h-3" />
                    )}
                    <span>{isSharing ? t.SHARING : t.SHARE_STORY}</span>
                </button>
            </div>
        </div>
        
        <div className="flex justify-end mb-2">
            <div className="flex items-center space-x-2 bg-gray-900 px-3 py-1 rounded-full border border-gray-800">
                <Star className="w-4 h-4 text-skate-neon" />
                <span className="text-xs font-bold text-gray-400 uppercase">{t.EXPERIENCE_LEVEL}: <span className="text-white">{getExperienceLevel(daysSkating)}</span></span>
            </div>
        </div>

        {/* AI Diagnostic Summary Section */}
        <div className="w-full bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-6 shadow-xl relative overflow-hidden group min-h-[300px] flex flex-col justify-center transition-all">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-skate-neon/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

            {!insight ? (
                <div className="flex flex-col items-center justify-center py-8 text-center space-y-6 z-10">
                    <BrainCircuit className={`w-12 h-12 text-gray-700 ${isGenerating ? 'animate-pulse text-skate-neon' : ''}`} />
                    
                    {isGenerating ? (
                         <p className="text-skate-neon text-sm max-w-xs uppercase tracking-wider font-bold animate-pulse">{t.GENERATING_INSIGHT}</p>
                    ) : (
                        <div className="flex flex-col items-center space-y-4">
                            <p className="text-gray-400 text-sm max-w-xs font-medium">
                                {history.length > 0 
                                    ? t.COMPREHENSIVE_DIAGNOSIS 
                                    : "Complete a session to unlock AI analysis."}
                            </p>
                            
                            {history.length > 0 && (
                                <button 
                                    onClick={handleGenerateInsight}
                                    className="bg-skate-neon text-black px-6 py-3 rounded-xl font-bold uppercase hover:bg-skate-neonHover transition-all shadow-[0_0_15px_rgba(204,255,0,0.3)] hover:shadow-[0_0_25px_rgba(204,255,0,0.5)] active:scale-95 flex items-center space-x-2"
                                >
                                    <Sparkles className="w-4 h-4" />
                                    <span>{t.GENERATE_INSIGHT}</span>
                                </button>
                            )}
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-6 animate-fade-in relative z-10 w-full">
                    {/* 1. Diagnosis Title */}
                    <div>
                        <span className="text-skate-neon text-xs font-bold uppercase tracking-widest mb-1 block flex items-center">
                            <BrainCircuit className="w-3 h-3 mr-1" />
                            {t.COMPREHENSIVE_DIAGNOSIS}
                        </span>
                        <h3 className="text-3xl font-display font-bold text-white leading-tight">
                            "{insight.diagnosis}"
                        </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* 2. Summary */}
                        <div className="space-y-2">
                            <h4 className="text-gray-500 text-xs font-bold uppercase">{t.SESSION_SUMMARY}</h4>
                            <p className="text-gray-300 text-sm leading-relaxed border-l-2 border-gray-700 pl-3">
                                {insight.summary}
                            </p>
                        </div>

                        {/* 3. Weakness Analysis */}
                        <div className="space-y-2">
                            <h4 className="text-gray-500 text-xs font-bold uppercase">{t.KEY_WEAKNESSES}</h4>
                            <p className="text-skate-alert text-sm font-medium leading-relaxed flex items-start">
                                <AlertTriangle className="w-4 h-4 mr-2 shrink-0 mt-0.5" />
                                {insight.weaknessAnalysis}
                            </p>
                        </div>
                    </div>

                    {/* 4. Improvements */}
                    <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
                        <h4 className="text-gray-400 text-xs font-bold uppercase mb-3 flex items-center">
                            <TrendingUp className="w-3 h-3 mr-1" />
                            {t.IMPROVEMENT_DIRECTIONS}
                        </h4>
                        <ul className="space-y-2">
                            {insight.improvementSuggestions.map((suggestion, idx) => (
                                <li key={idx} className="flex items-start text-sm text-gray-200">
                                    <span className="text-skate-neon font-bold mr-2">{idx + 1}.</span>
                                    {suggestion}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* 5. AI Feedback */}
                    <div className="pt-4 border-t border-gray-800">
                        <h4 className="text-skate-neon text-xs font-bold uppercase mb-2">{t.AI_COACH_FEEDBACK_TITLE}</h4>
                        <p className="text-white text-sm italic font-medium">
                            "{insight.aiFeedback}"
                        </p>
                    </div>

                    <button 
                        onClick={handleGenerateInsight} 
                        className="absolute top-0 right-0 p-2 text-gray-600 hover:text-white transition-colors"
                        title="Regenerate"
                        data-html2canvas-ignore="true"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                </div>
            )}
        </div>

        {/* Top Stats */}
        <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-900 p-4 rounded-xl border border-gray-800">
                <p className="text-gray-500 text-xs font-bold uppercase">{t.TOTAL_SESSIONS}</p>
                <p className="text-3xl font-display font-bold text-white mt-1">{totalSessions}</p>
            </div>
             <div className="bg-gray-900 p-4 rounded-xl border border-gray-800">
                <p className="text-gray-500 text-xs font-bold uppercase">{t.AVG_SUCCESS}</p>
                <p className="text-3xl font-display font-bold text-skate-neon mt-1">{globalSuccessRate}%</p>
            </div>
             <div className="bg-gray-900 p-4 rounded-xl border border-gray-800">
                <p className="text-gray-500 text-xs font-bold uppercase">{t.TOTAL_LANDED}</p>
                <p className="text-3xl font-display font-bold text-white mt-1">{totalLanded}</p>
            </div>
             <div className="bg-gray-900 p-4 rounded-xl border border-gray-800">
                <p className="text-gray-500 text-xs font-bold uppercase">{t.BEST_STREAK}</p>
                <p className="text-3xl font-display font-bold text-white mt-1">{bestStreak}</p>
            </div>
        </div>

        {/* Progress Graph */}
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 h-64 flex flex-col">
            <div className="flex items-center space-x-2 mb-4">
                <TrendingUp className="w-4 h-4 text-gray-400" />
                <h3 className="text-gray-400 text-xs font-bold uppercase">{t.PROGRESSION}</h3>
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
                        <Area type="monotone" dataKey="rate" stroke="#ccff00" fill="url(#colorRate)" strokeWidth={2} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Weakness Analysis */}
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <div className="flex items-center space-x-2 mb-4">
                <AlertTriangle className="w-4 h-4 text-skate-alert" />
                <h3 className="text-gray-400 text-xs font-bold uppercase">{t.WEAKNESS_ANALYSIS}</h3>
            </div>
            <div className="space-y-3">
                {weaknesses.length > 0 ? weaknesses.map((w, idx) => (
                    <div key={idx} className="flex justify-between items-center">
                        <span className="text-white font-medium text-sm">{w.name}</span>
                        <div className="flex items-center space-x-2">
                             <div className="w-24 h-2 bg-gray-800 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-skate-alert" 
                                    style={{ width: `${w.rate}%` }}
                                ></div>
                             </div>
                             <span className="text-xs text-skate-alert font-bold w-8 text-right">{w.rate}%</span>
                        </div>
                    </div>
                )) : (
                    <p className="text-gray-500 text-sm italic">Not enough data yet.</p>
                )}
            </div>
        </div>

        {/* Recommended Practice */}
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
             <div className="flex items-center space-x-2 mb-4">
                <Target className="w-4 h-4 text-skate-neon" />
                <h3 className="text-gray-400 text-xs font-bold uppercase">{t.RECOMMENDED_PRACTICE}</h3>
            </div>
             {weaknesses.length > 0 ? (
                 <div className="space-y-2">
                     <p className="text-sm text-gray-300 mb-2">{t.PRACTICE_MORE}</p>
                     <ul className="space-y-2">
                         {weaknesses.slice(0, 3).map((w, i) => (
                             <li key={i} className="bg-black/40 p-3 rounded border border-gray-800 flex justify-between">
                                 <span className="text-white font-bold">{w.name}</span>
                                 <span className="text-gray-500 text-xs uppercase">{t.FAILED} {w.attempts - Math.round(w.attempts * (w.rate/100))}x</span>
                             </li>
                         ))}
                     </ul>
                 </div>
             ) : (
                <p className="text-gray-500 text-sm italic">Play more sessions to get recommendations.</p>
             )}
        </div>
    </div>
  );
};

export default Analytics;