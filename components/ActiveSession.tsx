

import React, { useState, useEffect } from 'react';
import { Trick, SessionResult, TrickAttempt, Language, TrickTip, Difficulty } from '../types';
import { Check, X, Lightbulb, Video, AlertTriangle } from 'lucide-react';
import { SKATE_LETTERS, TRANSLATIONS } from '../constants';
import { getTrickTip } from '../services/geminiService';

interface Props {
  tricks: Trick[];
  difficulty: Difficulty;
  onComplete: (result: SessionResult) => void;
  onAbort: () => void;
  language: Language;
}

const ActiveSession: React.FC<Props> = ({ tricks, difficulty, onComplete, onAbort, language }) => {
  const t = TRANSLATIONS[language];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [history, setHistory] = useState<TrickAttempt[]>([]);
  const [failedCount, setFailedCount] = useState(0);
  const [tip, setTip] = useState<TrickTip | null>(null);
  const [isLoadingTip, setIsLoadingTip] = useState(false);
  const [usedRebate, setUsedRebate] = useState(false);
  const [showRebateWarning, setShowRebateWarning] = useState(false);

  const currentTrick = tricks[currentIndex];
  const isFinished = currentIndex >= tricks.length || failedCount >= SKATE_LETTERS.length;

  useEffect(() => {
    if (isFinished) {
      finishSession();
    } else {
        setTip(null);
        setShowRebateWarning(false);
    }
  }, [currentIndex, failedCount]);

  const finishSession = () => {
    const landedCount = history.filter(h => h.landed).length;
    const letters = SKATE_LETTERS.slice(0, failedCount).join('');
    
    const result: SessionResult = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      totalTricks: tricks.length,
      landedCount,
      failedCount,
      letters,
      trickHistory: history,
      difficulty: difficulty
    };
    onComplete(result);
  };

  const handleAttempt = (landed: boolean) => {
    const attempt: TrickAttempt = {
      trick: currentTrick,
      landed,
      timestamp: Date.now()
    };

    if (landed) {
        setHistory([...history, attempt]);
        setCurrentIndex(prev => prev + 1);
    } else {
        if (failedCount === 4 && !usedRebate) {
            setUsedRebate(true);
            setShowRebateWarning(true);
            return;
        }
        setHistory([...history, attempt]);
        setFailedCount(prev => prev + 1);
        setCurrentIndex(prev => prev + 1);
    }
  };

  const fetchTip = async () => {
      if (isLoadingTip || !currentTrick) return;
      setIsLoadingTip(true);
      const tipData = await getTrickTip(currentTrick.name, language);
      setTip(tipData);
      setIsLoadingTip(false);
  }

  const currentLetters = SKATE_LETTERS.map((char, index) => ({
    char,
    active: index < failedCount
  }));

  if (isFinished) return (
      <div className="flex items-center justify-center h-full bg-skate-bg">
          <div className="relative">
             <div className="absolute inset-0 bg-skate-yellow blur-xl opacity-40 animate-pulse"></div>
             <div className="animate-spin h-12 w-12 border-4 border-skate-black rounded-full border-t-transparent relative z-10"></div>
          </div>
      </div>
  );

  return (
    <div className="flex flex-col h-full bg-skate-bg relative font-sans overflow-hidden">
        
        {/* Header */}
        <div className="relative z-10 p-6 flex justify-between items-center">
             <div className="bg-white px-4 py-2 rounded-full flex items-center gap-2 border border-gray-100 shadow-sm">
                <span className="text-skate-black font-black text-xl leading-none pt-0.5">
                    {currentIndex + 1}
                </span>
                <span className="text-gray-300 text-xs">/</span>
                <span className="text-gray-400 font-bold text-lg leading-none pt-0.5">
                    {tricks.length}
                </span>
             </div>
             
             <button 
                onClick={onAbort} 
                className="px-4 py-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 text-xs font-bold uppercase tracking-widest transition-colors"
            >
                {t.ABORT}
            </button>
        </div>

        {/* S.K.A.T.E Status */}
        <div className="relative z-10 px-6 mb-8">
            <div className="flex justify-between max-w-sm mx-auto gap-2">
                {currentLetters.map((l, idx) => (
                    <div 
                        key={idx} 
                        className={`flex-1 aspect-[3/4] rounded-xl flex items-center justify-center border-2 transition-all duration-500 ${
                            l.active 
                                ? 'bg-skate-black text-skate-yellow border-skate-black shadow-lg scale-105' 
                                : 'bg-white border-gray-100 text-gray-200'
                        }`}
                    >
                        <span className="font-display font-black text-3xl">{l.char}</span>
                    </div>
                ))}
            </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-8 relative z-10">
            
            {/* Rebate Warning */}
            {showRebateWarning && (
                 <div className="absolute top-0 animate-bounce z-20">
                    <div className="bg-skate-yellow text-skate-black px-6 py-2 rounded-full flex items-center gap-2 shadow-xl border border-skate-black">
                        <AlertTriangle className="w-5 h-5 fill-skate-black text-skate-yellow" />
                        <span className="font-black uppercase tracking-wide text-sm">{t.LAST_CHANCE}</span>
                    </div>
                 </div>
            )}

            {/* Trick Card */}
            <div className="w-full text-center space-y-4">
                {currentTrick.stance && (
                     <span className="inline-block px-4 py-1.5 bg-white border border-gray-100 rounded-full text-skate-black font-bold tracking-widest uppercase text-xs mb-2">
                        {/* @ts-ignore */}
                        {t[currentTrick.stance] || currentTrick.stance}
                    </span>
                )}

                <h1 className="text-5xl md:text-7xl font-display font-black text-skate-black leading-[1] tracking-tight">
                    {currentTrick.name}
                </h1>
                
                <div className="flex items-center justify-center gap-3">
                    <div className="px-3 py-1 rounded-full bg-white border border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                         {/* @ts-ignore */}
                        {t[currentTrick.category] || currentTrick.category}
                    </div>
                    <div className="px-3 py-1 rounded-full bg-skate-yellow text-[10px] font-bold text-skate-black uppercase tracking-wider">
                         {/* @ts-ignore */}
                        {t[currentTrick.difficulty] || currentTrick.difficulty}
                    </div>
                </div>
            </div>

            {/* Tip Card */}
            <div className="w-full max-w-md min-h-[100px] flex items-center justify-center">
                {tip ? (
                     <div className="w-full bg-white rounded-3xl p-5 animate-slide-up border border-gray-100 relative overflow-hidden shadow-pop">
                        <div className="flex gap-4">
                             <div className="mt-1">
                                <Lightbulb className="w-5 h-5 text-skate-yellow fill-skate-yellow" />
                             </div>
                             <div className="flex-1">
                                <p className="text-skate-black text-base font-bold leading-snug mb-2">"{tip.text[language]}"</p>
                                <div className="flex justify-between items-center">
                                     <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{tip.source}</span>
                                     {tip.video && <div className="flex items-center gap-1 text-gray-400 text-[10px] font-bold uppercase"><Video className="w-3 h-3" /> <span>Video</span></div>}
                                </div>
                             </div>
                        </div>
                     </div>
                ) : (
                    <button 
                        onClick={fetchTip}
                        disabled={isLoadingTip}
                        className="group flex items-center gap-3 px-6 py-3 rounded-full bg-white hover:bg-gray-50 transition-all shadow-sm border border-gray-100"
                    >
                        <Lightbulb className={`w-4 h-4 text-gray-400 group-hover:text-skate-yellow transition-colors ${isLoadingTip ? 'animate-pulse' : ''}`} />
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest group-hover:text-skate-black transition-colors">
                            {isLoadingTip ? t.ASKING_COACH : t.GET_TIP}
                        </span>
                    </button>
                )}
            </div>
        </div>

        {/* Controls - Floating Bottom Bar */}
        <div className="relative z-20 p-6 pb-8">
            <div className="flex items-center gap-4 h-24">
                <button 
                    onClick={() => handleAttempt(false)}
                    className="flex-1 h-full rounded-[2.5rem] bg-gray-200 text-gray-400 hover:bg-gray-300 hover:text-white active:scale-95 transition-all flex flex-col items-center justify-center gap-1 group relative overflow-hidden"
                >
                    <X className="w-8 h-8 relative z-10 stroke-[3px]" />
                    <span className="text-[10px] font-black uppercase tracking-widest relative z-10">{t.FAILED}</span>
                </button>
                
                <button 
                    onClick={() => handleAttempt(true)}
                    className="flex-[1.5] h-full rounded-[2.5rem] bg-skate-yellow text-skate-black hover:bg-yellow-400 shadow-pop active:scale-95 transition-all flex flex-col items-center justify-center gap-1"
                >
                    <Check className="w-10 h-10 stroke-[4px]" />
                    <span className="text-xs font-black uppercase tracking-widest">LANDED</span>
                </button>
            </div>
        </div>
    </div>
  );
};

export default ActiveSession;