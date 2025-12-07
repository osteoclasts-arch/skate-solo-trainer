
import React, { useState, useEffect } from 'react';
import { Trick, SessionResult, TrickAttempt, Language, TrickTip } from '../types';
import { Check, X, Lightbulb, Video, User, AlertTriangle } from 'lucide-react';
import { SKATE_LETTERS, TRANSLATIONS } from '../constants';
import { getTrickTip } from '../services/geminiService';

interface Props {
  tricks: Trick[];
  onComplete: (result: SessionResult) => void;
  onAbort: () => void;
  language: Language;
}

const ActiveSession: React.FC<Props> = ({ tricks, onComplete, onAbort, language }) => {
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
        setTip(null); // Reset tip for new trick
        setShowRebateWarning(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, failedCount]);

  const finishSession = () => {
    // Generate result
    const landedCount = history.filter(h => h.landed).length;
    const letters = SKATE_LETTERS.slice(0, failedCount).join('');
    
    const result: SessionResult = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      totalTricks: tricks.length,
      landedCount,
      failedCount,
      letters,
      trickHistory: history
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
        // Check if we are on the verge of the last letter 'E' (4 fails)
        if (failedCount === 4 && !usedRebate) {
            // Activate Rebate: Do NOT record fail yet, give one more try on this same trick
            setUsedRebate(true);
            setShowRebateWarning(true);
            return;
        }

        // If we failed and it was a rebate, OR regular fail
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

  // Calculate letters to show
  const currentLetters = SKATE_LETTERS.map((char, index) => ({
    char,
    active: index < failedCount
  }));

  if (isFinished) return <div className="flex items-center justify-center h-full"><div className="animate-spin h-8 w-8 border-4 border-skate-neon rounded-full border-t-transparent"></div></div>;

  return (
    <div className={`flex flex-col h-full bg-black relative transition-colors duration-500 ${showRebateWarning ? 'bg-red-900/20' : ''}`}>
        {/* Header - Progress & Abort */}
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10">
            <span className="text-gray-500 font-mono text-sm">
                {t.TRICK_COUNTER} {currentIndex + 1} / {tricks.length}
            </span>
            <button onClick={onAbort} className="text-gray-500 text-sm hover:text-white px-2 py-1">
                {t.ABORT}
            </button>
        </div>

        {/* Letters Display */}
        <div className="mt-16 flex justify-center space-x-3 mb-8">
            {currentLetters.map((l, idx) => (
                <div 
                    key={idx} 
                    className={`text-5xl font-display font-bold transition-all duration-300 ${l.active ? 'text-skate-alert drop-shadow-[0_0_10px_rgba(255,59,48,0.5)]' : 'text-gray-800'}`}
                >
                    {l.char}
                </div>
            ))}
        </div>

        {/* Rebate Warning Overlay */}
        {showRebateWarning && (
             <div className="absolute top-32 left-0 right-0 flex justify-center z-20 animate-pulse">
                <div className="bg-skate-alert/90 px-6 py-2 rounded-full flex items-center space-x-2 shadow-[0_0_20px_rgba(255,59,48,0.5)]">
                    <AlertTriangle className="w-5 h-5 text-white" />
                    <span className="text-white font-bold uppercase tracking-widest text-sm">{t.LAST_CHANCE}</span>
                </div>
             </div>
        )}

        {/* Main Card */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-4">
            
            {/* Stance Badge */}
            {currentTrick.stance && (
                 <span className="px-3 py-1 bg-gray-800 rounded text-skate-neon font-bold tracking-widest uppercase text-sm border border-skate-neon/30">
                    {/* @ts-ignore */}
                    {t[currentTrick.stance] || currentTrick.stance}
                </span>
            )}

            {/* Trick Name */}
            <h1 className="text-6xl md:text-7xl font-display font-bold text-center leading-none tracking-tight text-white break-words w-full">
                {currentTrick.name}
            </h1>
            
            {/* Metadata */}
            <div className="flex space-x-4 text-gray-400 text-sm font-semibold uppercase tracking-wider">
                {/* @ts-ignore */}
                <span>{t[currentTrick.category] || currentTrick.category}</span>
                <span className="text-gray-600">•</span>
                {/* @ts-ignore */}
                <span>{t[currentTrick.difficulty] || currentTrick.difficulty}</span>
            </div>

            {/* AI Tip Section */}
            <div className="w-full flex items-center justify-center px-4 mt-6 min-h-[120px]">
                {tip ? (
                     <div className="w-full bg-gray-900 border border-gray-800 rounded-xl p-4 animate-fade-in shadow-lg">
                        <div className="flex items-start mb-2">
                             <div className="bg-skate-neon p-1 rounded-full mr-2 mt-0.5">
                                <Lightbulb className="w-3 h-3 text-black" />
                             </div>
                             <p className="text-white text-lg italic leading-tight font-medium">"{tip.text[language]}"</p>
                        </div>
                        <div className="flex flex-col space-y-1 mt-3 pl-8">
                            <div className="flex items-center text-xs text-gray-400">
                                <User className="w-3 h-3 mr-1" />
                                <span className="font-bold uppercase tracking-wide mr-1">{t.SOURCE}:</span>
                                <span>{tip.source}</span>
                            </div>
                            {tip.video && (
                                <div className="flex items-center text-xs text-skate-neon/80">
                                    <Video className="w-3 h-3 mr-1" />
                                    <span className="font-bold uppercase tracking-wide mr-1">{t.VIDEO}:</span>
                                    <span>{tip.video}</span>
                                </div>
                            )}
                        </div>
                     </div>
                ) : (
                    <button 
                        onClick={fetchTip}
                        disabled={isLoadingTip}
                        className="flex items-center space-x-2 text-gray-500 hover:text-white transition-colors py-4"
                    >
                        <Lightbulb className="w-5 h-5" />
                        <span className="text-sm uppercase font-bold tracking-widest">{isLoadingTip ? t.ASKING_COACH : t.GET_TIP}</span>
                    </button>
                )}
            </div>

        </div>

        {/* Controls */}
        <div className="h-1/3 min-h-[200px] flex w-full">
            <button 
                onClick={() => handleAttempt(false)}
                className="flex-1 bg-gray-900 border-t border-r border-gray-800 hover:bg-skate-alert/10 active:bg-skate-alert/20 text-skate-alert transition-all flex flex-col items-center justify-center group"
            >
                <X className="w-16 h-16 mb-2 group-active:scale-90 transition-transform" />
                <span className="font-display text-3xl font-bold uppercase tracking-widest">{t.FAILED}</span>
            </button>
            <button 
                onClick={() => handleAttempt(true)}
                className="flex-1 bg-gray-900 border-t border-gray-800 hover:bg-skate-neon/10 active:bg-skate-neon/20 text-skate-neon transition-all flex flex-col items-center justify-center group"
            >
                <Check className="w-16 h-16 mb-2 group-active:scale-90 transition-transform" />
                <span className="font-display text-3xl font-bold uppercase tracking-widest">{t.LANDED}</span>
            </button>
        </div>
    </div>
  );
};

export default ActiveSession;
