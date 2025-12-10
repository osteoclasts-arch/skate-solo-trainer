import React, { useState, useEffect } from 'react';
import { Language, User } from '../types';
import { TRANSLATIONS, BASE_TRICKS } from '../constants';
import { generateSkateLine } from '../services/geminiService';
import { dbService } from '../services/dbService';
import { ChevronLeft, Zap, Sparkles, Map, RefreshCw } from 'lucide-react';

interface Props {
  onBack: () => void;
  language: Language;
  user: User | null;
}

const OBSTACLES = [
  'OBSTACLE_FLAT', 'OBSTACLE_LEDGE', 'OBSTACLE_RAIL', 'OBSTACLE_GAP', 'OBSTACLE_MANUAL'
];

const STYLES = [
  'LINE_STYLE_FLOW', 'LINE_STYLE_TECH', 'LINE_STYLE_GNAR', 'LINE_STYLE_CHILL'
];

const LineGenerator: React.FC<Props> = ({ onBack, language, user }) => {
  const t = TRANSLATIONS[language];
  const [selectedObstacles, setSelectedObstacles] = useState<string[]>(['OBSTACLE_FLAT']);
  const [selectedStyle, setSelectedStyle] = useState<string>('LINE_STYLE_FLOW');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedLine, setGeneratedLine] = useState<{name: string, sequence: string[]} | null>(null);
  const [knownTricks, setKnownTricks] = useState<string[]>([]);

  useEffect(() => {
    // Fetch known tricks on mount
    const fetchTricks = async () => {
        if (user) {
            const tricks = await dbService.getUniqueLandedTricks(user.uid);
            setKnownTricks(tricks);
        } else {
            // For guest, maybe use basic tricks or assume beginner
            setKnownTricks(["Ollie", "Shuvit"]);
        }
    };
    fetchTricks();
  }, [user]);

  const toggleObstacle = (obs: string) => {
    setSelectedObstacles(prev => 
        prev.includes(obs) ? prev.filter(o => o !== obs) : [...prev, obs]
    );
  };

  const handleGenerate = async () => {
      if (selectedObstacles.length === 0) {
          alert("Please select at least one obstacle.");
          return;
      }
      setIsGenerating(true);
      
      // Translate keys to readable strings for AI
      // @ts-ignore
      const obsNames = selectedObstacles.map(k => t[k]);
      // @ts-ignore
      const styleName = t[selectedStyle];

      const result = await generateSkateLine(knownTricks, obsNames, styleName, language);
      setGeneratedLine(result);
      setIsGenerating(false);
  };

  return (
    <div className="flex flex-col h-full p-6 space-y-6 overflow-y-auto pb-32 animate-fade-in relative bg-gray-50 dark:bg-zinc-950 font-sans transition-colors duration-300">
       
       <div className="flex items-center gap-4 pt-2 mb-2">
        <button onClick={onBack} className="p-3 rounded-full bg-white dark:bg-zinc-900 shadow-sm border border-gray-100 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors">
            <ChevronLeft className="w-6 h-6 text-skate-black dark:text-white" />
        </button>
        <div>
            <h2 className="text-3xl font-black text-skate-black dark:text-white tracking-tighter leading-none">{t.LINE_GEN_TITLE}</h2>
            <p className="text-xs text-gray-400 font-bold mt-1">{t.LINE_GEN_DESC}</p>
        </div>
      </div>

      {/* Configuration */}
      <div className="space-y-6">
          
          {/* Obstacles */}
          <div className="space-y-3">
             <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider pl-2">
                 <Map className="w-3 h-3" />
                 <span>{t.SELECT_OBSTACLES}</span>
             </div>
             <div className="flex flex-wrap gap-2">
                 {OBSTACLES.map(obs => (
                     <button
                        key={obs}
                        onClick={() => toggleObstacle(obs)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border-2 ${
                            selectedObstacles.includes(obs)
                            ? 'bg-skate-black dark:bg-white text-white dark:text-black border-skate-black dark:border-white shadow-md'
                            : 'bg-white dark:bg-zinc-900 text-gray-400 border-transparent dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800'
                        }`}
                     >
                         {/* @ts-ignore */}
                         {t[obs]}
                     </button>
                 ))}
             </div>
          </div>

          {/* Style */}
          <div className="space-y-3">
             <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider pl-2">
                 <Sparkles className="w-3 h-3" />
                 <span>Style</span>
             </div>
             <div className="flex flex-wrap gap-2">
                 {STYLES.map(style => (
                     <button
                        key={style}
                        onClick={() => setSelectedStyle(style)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border-2 ${
                            selectedStyle === style
                            ? 'bg-skate-yellow text-skate-black border-skate-yellow shadow-md'
                            : 'bg-white dark:bg-zinc-900 text-gray-400 border-transparent dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800'
                        }`}
                     >
                         {/* @ts-ignore */}
                         {t[style]}
                     </button>
                 ))}
             </div>
          </div>

          {/* Known Tricks Info */}
          <div className="bg-gray-50 dark:bg-zinc-900 p-4 rounded-2xl flex items-center justify-between">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t.MY_TRICKS}</span>
              <span className="text-skate-black dark:text-white font-black text-sm">{knownTricks.length > 0 ? `${knownTricks.length} Tricks Available` : "Beginner Set"}</span>
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full py-5 bg-skate-black dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-black text-lg font-black uppercase rounded-[2rem] shadow-lg transform active:scale-95 transition-all flex items-center justify-center gap-3"
          >
            {isGenerating ? (
              <span className="animate-pulse">{t.GENERATING_LINE}</span>
            ) : (
              <>
                <Zap className="w-5 h-5 fill-current" />
                <span>{t.GENERATE_LINE}</span>
              </>
            )}
          </button>
      </div>

      {/* Result */}
      {generatedLine && (
          <div className="animate-slide-up mt-4">
              <div className="pop-card bg-white dark:bg-zinc-900 border-2 border-skate-black dark:border-zinc-700 p-0 overflow-hidden relative">
                  <div className="bg-skate-black dark:bg-zinc-800 p-4 flex justify-between items-center">
                      <h3 className="text-white font-black text-xl italic tracking-tight">"{generatedLine.name}"</h3>
                      <Sparkles className="w-5 h-5 text-skate-yellow" />
                  </div>
                  <div className="p-6 relative">
                      <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-gray-200 dark:bg-zinc-700"></div>
                      <div className="space-y-6">
                          {generatedLine.sequence.map((trick, idx) => (
                              <div key={idx} className="relative pl-8 flex items-center group">
                                  <div className="absolute left-0 w-3 h-3 rounded-full bg-skate-yellow border-2 border-white dark:border-zinc-900 -translate-x-[5px] z-10"></div>
                                  <span className="text-lg font-bold text-skate-black dark:text-white group-hover:text-skate-deep transition-colors">
                                      {trick}
                                  </span>
                              </div>
                          ))}
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default LineGenerator;