import React, { useState } from 'react';
import { Difficulty, SessionSettings, TrickCategory, Language, Stance } from '../types';
import { Settings, Play, BrainCircuit, Shuffle } from 'lucide-react';
import { TRANSLATIONS } from '../constants';

interface Props {
  onStart: (settings: SessionSettings) => void;
  isGenerating: boolean;
  language: Language;
}

const SessionSetup: React.FC<Props> = ({ onStart, isGenerating, language }) => {
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
        // Prevent unchecking the last stance
        if (prev.includes(s) && prev.length === 1) return prev;
        return prev.includes(s) ? prev.filter(i => i !== s) : [...prev, s];
    });
  };

  const handleStart = () => {
    if (categories.length === 0) {
      alert("Select at least one category.");
      return;
    }
    if (selectedStances.length === 0) {
        alert("Select at least one stance.");
        return;
    }
    onStart({
      trickCount,
      difficulty,
      categories,
      selectedStances,
      isProgressive: false,
      useAI,
      customFocus
    });
  };

  return (
    <div className="flex flex-col h-full p-6 space-y-6 overflow-y-auto pb-24">
      <div className="flex items-center space-x-2 mb-2">
        <Settings className="text-skate-neon w-6 h-6" />
        <h2 className="text-3xl font-display font-bold uppercase tracking-wide">{t.SETUP_SESSION}</h2>
      </div>

      {/* Length */}
      <div className="space-y-2">
        <label className="text-sm text-gray-400 uppercase font-semibold tracking-wider">{t.SESSION_LENGTH}</label>
        <div className="grid grid-cols-4 gap-2">
          {[5, 10, 20, 50].map(count => (
            <button
              key={count}
              onClick={() => setTrickCount(count)}
              className={`py-3 font-bold rounded-lg border-2 transition-all ${
                trickCount === count 
                  ? 'border-skate-neon bg-skate-neon text-black' 
                  : 'border-gray-700 bg-gray-800 text-gray-400'
              }`}
            >
              {count}
            </button>
          ))}
        </div>
      </div>

      {/* Difficulty */}
      <div className="space-y-2">
        <label className="text-sm text-gray-400 uppercase font-semibold tracking-wider">{t.DIFFICULTY}</label>
        <div className="grid grid-cols-2 gap-2">
          {Object.values(Difficulty).map(d => (
            <button
              key={d}
              onClick={() => setDifficulty(d)}
              className={`py-3 font-bold rounded-lg border-2 transition-all ${
                difficulty === d
                  ? 'border-skate-neon text-skate-neon bg-gray-900' 
                  : 'border-gray-700 bg-gray-800 text-gray-400'
              }`}
            >
              {/* @ts-ignore */}
              {t[d] || d}
            </button>
          ))}
        </div>
      </div>

      {/* Categories */}
      <div className="space-y-2">
        <label className="text-sm text-gray-400 uppercase font-semibold tracking-wider">{t.CATEGORIES}</label>
        <div className="flex flex-wrap gap-2">
          {Object.values(TrickCategory).map(c => (
            <button
              key={c}
              onClick={() => toggleCategory(c)}
              className={`px-4 py-2 rounded-full text-sm font-bold border transition-all ${
                categories.includes(c)
                  ? 'bg-white text-black border-white'
                  : 'bg-transparent text-gray-500 border-gray-700'
              }`}
            >
              {/* @ts-ignore */}
              {t[c] || c}
            </button>
          ))}
        </div>
      </div>

      {/* Stance Mix Settings (Updated to match Categories style) */}
      <div className="space-y-2">
         <div className="flex items-center space-x-2 text-gray-400 uppercase font-semibold tracking-wider text-sm mb-1">
            <Shuffle className="w-4 h-4" />
            <span>{t.STANCE_MIX}</span>
         </div>
         <div className="flex flex-wrap gap-2">
            {Object.values(Stance).map(s => (
                <button 
                    key={s} 
                    onClick={() => toggleStance(s)}
                    className={`px-4 py-2 rounded-full text-sm font-bold border transition-all ${
                        selectedStances.includes(s)
                          ? 'bg-skate-neon text-black border-skate-neon'
                          : 'bg-transparent text-gray-500 border-gray-700'
                      }`}
                >
                     {/* @ts-ignore */}
                    {t[s] || s}
                </button>
            ))}
         </div>
      </div>

      {/* AI Mode Toggle */}
      <div className="p-4 bg-gray-900 border border-gray-700 rounded-xl space-y-4">
        <div className="flex items-center justify-between">
           <div className="flex items-center space-x-2">
             <BrainCircuit className={useAI ? "text-skate-neon" : "text-gray-500"} />
             <span className={`font-bold ${useAI ? "text-white" : "text-gray-400"}`}>{t.AI_COACH_MODE}</span>
           </div>
           <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={useAI} onChange={() => setUseAI(!useAI)} className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-skate-neon"></div>
            </label>
        </div>
        {useAI && (
            <input 
                type="text" 
                placeholder={t.AI_PLACEHOLDER}
                value={customFocus}
                onChange={(e) => setCustomFocus(e.target.value)}
                className="w-full bg-black border border-gray-600 rounded p-3 text-white placeholder-gray-600 focus:border-skate-neon focus:outline-none"
            />
        )}
      </div>

      <button
        onClick={handleStart}
        disabled={isGenerating}
        className="w-full py-5 bg-skate-neon hover:bg-skate-neonHover text-black font-display text-3xl font-bold uppercase rounded-xl shadow-lg transform active:scale-95 transition-all flex items-center justify-center space-x-2 mt-auto"
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