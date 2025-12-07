import React, { useState } from 'react';
import { Difficulty, SessionSettings, TrickCategory, Language, Stance } from '../types';
import { Settings, Play, BrainCircuit, Shuffle, ChevronLeft, Minus, Plus } from 'lucide-react';
import { TRANSLATIONS } from '../constants';

interface Props {
  onStart: (settings: SessionSettings) => void;
  onBack: () => void;
  isGenerating: boolean;
  language: Language;
}

const SessionSetup: React.FC<Props> = ({ onStart, onBack, isGenerating, language }) => {
  const t = TRANSLATIONS[language];
  const [trickCount, setTrickCount] = useState(10);
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.MEDIUM);
  const [categories, setCategories] = useState<TrickCategory[]>([TrickCategory.FLATGROUND]);
  const [selectedStances, setSelectedStances] = useState<Stance[]>([Stance.REGULAR, Stance.FAKIE, Stance.SWITCH, Stance.NOLLIE]);
  const [useAI, setUseAI] = useState(false);
  const [customFocus, setCustomFocus] = useState('');

  const toggleCategory = (c: TrickCategory) => {
    setCategories(prev => prev.includes(c) ? prev.filter(i => i !== c) : [...prev, c]);
  };

  const toggleStance = (s: Stance) => {
    setSelectedStances(prev => {
        if (prev.includes(s) && prev.length === 1) return prev;
        return prev.includes(s) ? prev.filter(i => i !== s) : [...prev, s];
    });
  };

  const adjustCount = (amount: number) => {
    setTrickCount(prev => Math.max(1, Math.min(50, prev + amount)));
  };

  const handleStart = () => {
    if (categories.length === 0) return alert("Select at least one category.");
    if (selectedStances.length === 0) return alert("Select at least one stance.");
    onStart({ trickCount, difficulty, categories, selectedStances, isProgressive: false, useAI, customFocus });
  };

  return (
    <div className="flex flex-col h-full p-6 space-y-8 overflow-y-auto pb-32 animate-fade-in relative">
      <div className="flex items-center space-x-2">
        <button onClick={onBack} className="p-3 -ml-2 rounded-full hover:bg-white/10 transition-colors">
            <ChevronLeft className="w-6 h-6 text-white" />
        </button>
        <h2 className="text-3xl font-display font-bold uppercase tracking-wide">{t.SETUP_SESSION}</h2>
      </div>

      {/* Count Slider */}
      <div className="glass-card p-6 rounded-3xl space-y-4">
        <label className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">{t.SESSION_LENGTH}</label>
        <div className="flex items-center justify-between">
            <button onClick={() => adjustCount(-1)} className="w-12 h-12 rounded-2xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors active:scale-90"><Minus className="w-5 h-5" /></button>
            <div className="flex flex-col items-center">
                <span className="text-5xl font-display font-bold text-white">{trickCount}</span>
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">TRICKS</span>
            </div>
            <button onClick={() => adjustCount(1)} className="w-12 h-12 rounded-2xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors active:scale-90"><Plus className="w-5 h-5" /></button>
        </div>
        <input 
            type="range" min="1" max="50" value={trickCount} onChange={(e) => setTrickCount(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-skate-neon"
        />
      </div>

      {/* Difficulty */}
      <div className="space-y-3">
        <label className="text-[10px] text-gray-400 uppercase font-bold tracking-widest pl-2">{t.DIFFICULTY}</label>
        <div className="grid grid-cols-2 gap-3">
          {Object.values(Difficulty).map(d => (
            <button
              key={d}
              onClick={() => setDifficulty(d)}
              className={`py-4 rounded-2xl font-bold transition-all text-sm uppercase tracking-wide border ${
                difficulty === d
                  ? 'bg-skate-neon text-black border-skate-neon shadow-[0_0_15px_rgba(204,255,0,0.3)]' 
                  : 'bg-white/5 border-white/5 text-gray-500 hover:bg-white/10'
              }`}
            >
              {/* @ts-ignore */}
              {t[d] || d}
            </button>
          ))}
        </div>
      </div>

      {/* Categories */}
      <div className="space-y-3">
        <label className="text-[10px] text-gray-400 uppercase font-bold tracking-widest pl-2">{t.CATEGORIES}</label>
        <div className="flex flex-wrap gap-2">
          {Object.values(TrickCategory).map(c => (
            <button
              key={c}
              onClick={() => toggleCategory(c)}
              className={`px-5 py-2.5 rounded-full text-xs font-bold border transition-all ${
                categories.includes(c)
                  ? 'bg-white text-black border-white shadow-lg'
                  : 'bg-transparent text-gray-500 border-white/10 hover:border-white/30'
              }`}
            >
              {/* @ts-ignore */}
              {t[c] || c}
            </button>
          ))}
        </div>
      </div>

      {/* Stance Mix */}
      <div className="space-y-3">
         <div className="flex items-center space-x-2 text-[10px] text-gray-400 uppercase font-bold tracking-widest pl-2">
            <Shuffle className="w-3 h-3" />
            <span>{t.STANCE_MIX}</span>
         </div>
         <div className="flex flex-wrap gap-2">
            {Object.values(Stance).map(s => (
                <button 
                    key={s} 
                    onClick={() => toggleStance(s)}
                    className={`px-5 py-2.5 rounded-full text-xs font-bold border transition-all ${
                        selectedStances.includes(s)
                          ? 'bg-gray-800 text-skate-neon border-skate-neon/50'
                          : 'bg-transparent text-gray-600 border-white/10'
                      }`}
                >
                     {/* @ts-ignore */}
                    {t[s] || s}
                </button>
            ))}
         </div>
      </div>

      {/* AI Mode */}
      <div className="glass-card p-5 rounded-3xl border border-white/10">
        <div className="flex items-center justify-between mb-4">
           <div className="flex items-center space-x-3">
             <div className={`p-2 rounded-xl ${useAI ? 'bg-skate-neon/20' : 'bg-gray-800'}`}>
                <BrainCircuit className={useAI ? "text-skate-neon" : "text-gray-500"} />
             </div>
             <span className={`font-bold ${useAI ? "text-white" : "text-gray-400"}`}>{t.AI_COACH_MODE}</span>
           </div>
           <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={useAI} onChange={() => setUseAI(!useAI)} className="sr-only peer" />
              <div className="w-12 h-7 bg-gray-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-skate-neon"></div>
            </label>
        </div>
        {useAI && (
            <input 
                type="text" 
                placeholder={t.AI_PLACEHOLDER}
                value={customFocus}
                onChange={(e) => setCustomFocus(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white text-sm placeholder-gray-600 focus:border-skate-neon focus:outline-none transition-colors"
            />
        )}
      </div>

      <button
        onClick={handleStart}
        disabled={isGenerating}
        className="w-full py-5 bg-skate-neon hover:bg-skate-neonHover text-black font-display text-3xl font-bold uppercase rounded-[2rem] shadow-[0_0_20px_rgba(204,255,0,0.3)] transform active:scale-95 transition-all flex items-center justify-center space-x-3"
      >
        {isGenerating ? (
          <span className="animate-pulse">{t.GENERATING}</span>
        ) : (
          <>
            <Play className="w-6 h-6 fill-black" />
            <span>{t.START_SKATING}</span>
          </>
        )}
      </button>
    </div>
  );
};

export default SessionSetup;