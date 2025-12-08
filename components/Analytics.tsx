
import React, { useState, useEffect, useRef } from 'react';
import { SessionResult, Language, AnalyticsInsight, Difficulty, User } from '../types';
import { TRANSLATIONS } from '../constants';
import { ResponsiveContainer, AreaChart, Area, XAxis, Tooltip } from 'recharts';
import { Trophy, TrendingUp, AlertTriangle, Target, BrainCircuit, Sparkles, RefreshCw, Star, Instagram, Crown, Info, X, Lock, CheckCircle, Clock } from 'lucide-react';
import { getAnalyticsInsight } from '../services/geminiService';
import html2canvas from 'html2canvas';

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
  const [isSharing, setIsSharing] = useState(false);
  const [showLevelGuide, setShowLevelGuide] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Stats Logic (Calculated even for lock screen to show dummy data if needed, 
  // but we will use empty data for locked state to keep it clean)
  const totalSessions = history.length;
  const totalTricks = history.reduce((acc, curr) => acc + curr.totalTricks, 0);
  const totalLanded = history.reduce((acc, curr) => acc + curr.landedCount, 0);
  const globalSuccessRate = totalTricks > 0 ? Math.round((totalLanded / totalTricks) * 100) : 0;

  // Streak Calculation
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

  // Ranking System Logic
  const calculateTier = () => {
      let score = 0;
      history.forEach(session => {
          session.trickHistory.forEach(attempt => {
              if (attempt.landed) {
                  if (attempt.trick.difficulty === Difficulty.HARD) score += 2;
                  if (attempt.trick.difficulty === Difficulty.PRO) score += 5;
              }
          });
      });

      // Mock percentiles for gamification
      let tierName = t.TIER_1;
      let percentile = 90;
      let iconColor = "text-gray-500";

      if (score > 100) {
          tierName = t.TIER_4;
          percentile = 1;
          iconColor = "text-skate-neon";
      } else if (score > 50) {
          tierName = t.TIER_3;
          percentile = 10;
          iconColor = "text-purple-400";
      } else if (score > 10) {
          tierName = t.TIER_2;
          percentile = 40;
          iconColor = "text-blue-400";
      }

      return { score, tierName, percentile, iconColor };
  };
  const { score, tierName, percentile, iconColor } = calculateTier();

  // Weakness Logic
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
                        text: `Check out my skate stats! I'm ranked as ${tierName} (Top ${percentile}%) 🛹🔥`
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
      if (user?.isPro) return t.LEVEL_ADVANCED;
      if (days <= 60) return t.LEVEL_BEGINNER;
      return t.LEVEL_INTERMEDIATE;
  };
  
  const currentLevel = getExperienceLevel(daysSkating);

  const GoogleIcon = () => (
      <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
      </svg>
  );

  return (
    <div className="flex flex-col h-full p-6 space-y-6 overflow-y-auto pb-32 animate-fade-in relative" ref={containerRef}>
        
        {/* LOCK SCREEN OVERLAY */}
        {!user && (
            <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
                 <div className="glass-card p-8 rounded-3xl w-full max-w-sm flex flex-col items-center shadow-2xl border border-white/10">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-6">
                        <Lock className="w-8 h-8 text-skate-neon" />
                    </div>
                    <h2 className="text-2xl font-display font-bold text-white mb-2 uppercase tracking-wide">
                        {language === 'KR' ? '분석실 잠김' : 'Analytics Locked'}
                    </h2>
                    <p className="text-gray-400 text-sm mb-8 leading-relaxed">
                        {language === 'KR' 
                            ? '상세한 성장 분석과 AI 진단을 보려면 로그인이 필요합니다.' 
                            : 'Sign in to access detailed progression tracking and AI coaching insights.'}
                    </p>
                    <button 
                        onClick={onLogin}
                        className="flex items-center justify-center px-8 py-4 bg-white text-black rounded-full font-bold text-sm hover:bg-gray-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.4)] active:scale-95 transform w-full"
                    >
                        <GoogleIcon />
                        {t.LOGIN_GOOGLE}
                    </button>
                 </div>
            </div>
        )}

        {/* Level Guide Modal */}
        {showLevelGuide && (
             <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-6 animate-fade-in">
                 <div className="glass-card p-6 rounded-3xl w-full max-w-sm shadow-2xl relative">
                     <button onClick={() => setShowLevelGuide(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X className="w-5 h-5"/></button>
                     <h3 className="text-2xl font-display font-bold text-white mb-4 flex items-center gap-2">
                        <Star className="w-6 h-6 text-skate-neon" />
                        {t.EXPERIENCE_LEVEL}
                     </h3>
                     <div className="space-y-4">
                         {/* Beginner */}
                         <div className={`p-4 rounded-xl border ${currentLevel === t.LEVEL_BEGINNER ? 'bg-skate-neon/10 border-skate-neon' : 'bg-white/5 border-white/5'}`}>
                             <div className="flex justify-between items-center mb-1">
                                 <h4 className={`font-bold uppercase ${currentLevel === t.LEVEL_BEGINNER ? 'text-skate-neon' : 'text-gray-400'}`}>{t.LEVEL_BEGINNER}</h4>
                                 <span className="text-xs font-mono text-gray-500">0 - 60 Days</span>
                             </div>
                             <p className="text-xs text-gray-300">스케이트보드에 입문한 비기너 단계입니다. 기본기와 흥미 위주의 훈련을 추천합니다.</p>
                         </div>
                         
                         {/* Amateur */}
                         <div className={`p-4 rounded-xl border ${currentLevel === t.LEVEL_INTERMEDIATE ? 'bg-purple-500/10 border-purple-500' : 'bg-white/5 border-white/5'}`}>
                             <div className="flex justify-between items-center mb-1">
                                 <h4 className={`font-bold uppercase ${currentLevel === t.LEVEL_INTERMEDIATE ? 'text-purple-400' : 'text-gray-400'}`}>{t.LEVEL_INTERMEDIATE}</h4>
                                 <span className="text-xs font-mono text-gray-500">61+ Days</span>
                             </div>
                             <p className="text-xs text-gray-300">기술의 일관성을 높이고 새로운 트릭에 도전하는 아마추어 단계입니다.</p>
                         </div>

                         {/* Pro */}
                         <div className={`p-4 rounded-xl border ${currentLevel === t.LEVEL_ADVANCED ? 'bg-blue-500/10 border-blue-500' : 'bg-white/5 border-white/5'}`}>
                             <div className="flex justify-between items-center mb-1">
                                 <h4 className={`font-bold uppercase ${currentLevel === t.LEVEL_ADVANCED ? 'text-blue-400' : 'text-gray-400'}`}>{t.LEVEL_ADVANCED}</h4>
                                 <span className="text-xs font-mono text-gray-500">{t.LEVEL_REQ_PRO}</span>
                             </div>
                             <p className="text-xs text-gray-300 mb-3">자신만의 스타일을 완성하고 고난도 기술을 연마하는 프로 단계입니다. 이 단계로 승급하려면 별도의 승인이 필요합니다.</p>
                             
                             {/* Request Pro Button */}
                             {currentLevel === t.LEVEL_INTERMEDIATE && !user?.isPro && (
                                <div className="mt-2 pt-2 border-t border-white/5">
                                    {user?.proRequestStatus === 'pending' ? (
                                        <button disabled className="w-full py-2 bg-yellow-500/20 text-yellow-500 rounded-lg text-xs font-bold uppercase cursor-not-allowed flex items-center justify-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {t.REQUEST_PENDING}
                                        </button>
                                    ) : (
                                        <button 
                                            onClick={onRequestPro}
                                            className="w-full py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold uppercase transition-colors flex items-center justify-center gap-1"
                                        >
                                            <CheckCircle className="w-3 h-3" />
                                            {t.REQUEST_PRO}
                                        </button>
                                    )}
                                </div>
                             )}
                         </div>
                     </div>
                 </div>
             </div>
        )}

        {/* Header */}
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
        
        {/* Level & Rank Badge */}
        <div className="flex justify-between items-center mb-2">
             <button 
                onClick={() => setShowLevelGuide(true)}
                className="flex items-center space-x-2 bg-white/5 px-3 py-1 rounded-full border border-white/5 hover:bg-white/10 transition-colors active:scale-95"
             >
                <Star className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t.EXPERIENCE_LEVEL}: <span className="text-white ml-1">{currentLevel}</span></span>
                <Info className="w-3 h-3 text-gray-500 ml-1" />
            </button>
        </div>

        {/* Simplified Compact Tier Card */}
        <div className="glass-card rounded-2xl p-4 flex items-center justify-between group bg-gradient-to-r from-white/5 to-transparent">
             <div className="flex items-center gap-3">
                 <div className={`p-3 rounded-full bg-black/40 border border-white/10 ${iconColor}`}>
                    <Crown className="w-5 h-5" />
                 </div>
                 <div>
                    <h3 className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-0.5">{t.YOUR_TIER}</h3>
                    <span className={`text-xl font-display font-bold tracking-wide ${iconColor === 'text-skate-neon' ? 'text-skate-neon text-glow' : 'text-white'}`}>{tierName}</span>
                 </div>
             </div>
             <div className="text-right">
                 <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">{t.TOP_PERCENT}</span>
                 <span className="text-2xl font-display font-bold text-white">{percentile}%</span>
             </div>
        </div>

        {/* AI Diagnostic Summary Section - Holographic Card */}
        <div className="w-full relative rounded-3xl p-[1px] bg-gradient-to-br from-skate-neon/50 via-purple-500/30 to-transparent shadow-2xl overflow-hidden group">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-xl rounded-3xl h-full w-full z-0"></div>
            
            <div className="relative z-10 p-6 min-h-[250px] flex flex-col justify-center">
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
