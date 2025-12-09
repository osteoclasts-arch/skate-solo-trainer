import React, { useState } from 'react';
import { Difficulty, SessionSettings, TrickCategory, Language, Stance } from '../types';
import { Play, BrainCircuit, Shuffle, ChevronLeft, Minus, Plus } from 'lucide-react';
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

  const handleStart = () => {
    if (categories.length === 0) return alert("Select at least one category.");
    if (selectedStances.length === 0) return alert("Select at least one stance.");
    onStart({ trickCount, difficulty, categories, selectedStances, isProgressive: false, useAI, customFocus });
  };

  return (
    <div className="flex flex-col h-full p-6 space-y-8 overflow-y-auto pb-32 animate-fade-in relative font-sans bg-skate-bg">
      <div className="flex items-center gap-4 pt-2">
        <button onClick={onBack} className="p-3 rounded-full bg-white shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors">
            <ChevronLeft className="w-6 h-6 text-skate-black" />
        </button>
        <h2 className="text-3xl font-black text-skate-black tracking-tighter">{t.SETUP_SESSION}</h2>
      </div>

      {/* Count Card */}
      <div className="pop-card bg-white p-6 flex flex-col items-center">
        <label className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-4">{t.SESSION_LENGTH}</label>
        <div className="flex items-center justify-between w-full max-w-xs">
            <button onClick={() => setTrickCount(c => Math.max(1, c-1))} className="w-14 h-14 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
                <Minus className="w-6 h-6 text-skate-black" />
            </button>
            <div className="flex flex-col items-center">
                <span className="text-6xl font-black text-skate-black tracking-tighter">{trickCount}</span>
                <span className="text-[10px] text-skate-yellow font-black uppercase mt-1 bg-skate-black px-2 py-0.5 rounded-full">TRICKS</span>
            </div>
            <button onClick={() => setTrickCount(c => Math.min(50, c+1))} className="w-14 h-14 rounded-full bg-skate-yellow hover:bg-yellow-400 flex items-center justify-center transition-colors shadow-sm">
                <Plus className="w-6 h-6 text-skate-black" />
            </button>
        </div>
      </div>

      {/* Difficulty */}
      <div className="space-y-3">
        <label className="text-xs text-gray-400 font-bold uppercase tracking-wider pl-2">{t.DIFFICULTY}</label>
        <div className="grid grid-cols-2 gap-3">
          {Object.values(Difficulty).map(d => (
            <button
              key={d}
              onClick={() => setDifficulty(d)}
              className={`py-4 rounded-2xl font-black transition-all text-sm uppercase tracking-wide border-2 ${
                difficulty === d
                  ? 'bg-skate-black text-skate-yellow border-skate-black shadow-lg transform scale-105' 
                  : 'bg-white border-transparent text-gray-300 hover:bg-gray-50'
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
        <label className="text-xs text-gray-400 font-bold uppercase tracking-wider pl-2">{t.CATEGORIES}</label>
        <div className="flex flex-wrap gap-2">
          {Object.values(TrickCategory).map(c => (
            <button
              key={c}
              onClick={() => toggleCategory(c)}
              className={`px-6 py-3 rounded-full text-xs font-bold transition-all border-2 ${
                categories.includes(c)
                  ? 'bg-skate-deep text-white border-skate-deep shadow-sm'
                  : 'bg-white text-gray-400 border-transparent hover:bg-gray-50'
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
         <div className="flex items-center gap-2 text-xs text-gray-400 font-bold uppercase tracking-wider pl-2">
            <Shuffle className="w-3 h-3" />
            <span>{t.STANCE_MIX}</span>
         </div>
         <div className="flex flex-wrap gap-2">
            {Object.values(Stance).map(s => (
                <button 
                    key={s} 
                    onClick={() => toggleStance(s)}
                    className={`px-6 py-3 rounded-full text-xs font-bold transition-all border-2 ${
                        selectedStances.includes(s)
                          ? 'bg-white text-skate-black border-skate-black shadow-sm'
                          : 'bg-white text-gray-400 border-transparent hover:bg-gray-50'
                      }`}
                >
                     {/* @ts-ignore */}
                    {t[s] || s}
                </button>
            ))}
         </div>
      </div>

      {/* AI Mode */}
      <div className="pop-card bg-white p-6">
        <div className="flex items-center justify-between mb-4">
           <div className="flex items-center gap-3">
             <div className={`p-2 rounded-xl ${useAI ? 'bg-skate-yellow text-skate-black' : 'bg-gray-100 text-gray-400'}`}>
                <BrainCircuit className="w-5 h-5" />
             </div>
             <span className={`font-bold ${useAI ? "text-skate-black" : "text-gray-400"}`}>{t.AI_COACH_MODE}</span>
           </div>
           <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={useAI} onChange={() => setUseAI(!useAI)} className="sr-only peer" />
              <div className="w-14 h-8 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-skate-yellow"></div>
            </label>
        </div>
        {useAI && (
            <input 
                type="text" 
                placeholder={t.AI_PLACEHOLDER}
                value={customFocus}
                onChange={(e) => setCustomFocus(e.target.value)}
                className="w-full bg-gray-50 border-none rounded-xl p-4 text-skate-black text-sm placeholder-gray-400 focus:ring-2 focus:ring-skate-yellow outline-none transition-colors font-medium"
            />
        )}
      </div>

      <button
        onClick={handleStart}
        disabled={isGenerating}
        className="w-full py-6 bg-skate-black hover:bg-gray-800 text-skate-yellow text-xl font-black uppercase rounded-[2.5rem] shadow-lg transform active:scale-95 transition-all flex items-center justify-center gap-3 mt-4"
      >
        {isGenerating ? (
          <span className="animate-pulse">{t.GENERATING}</span>
        ) : (
          <>
            <Play className="w-6 h-6 fill-skate-yellow" />
            <span>{t.START_SKATING}</span>
          </>
        )}
      </button>
    </div>
  );
};

export default SessionSetup;