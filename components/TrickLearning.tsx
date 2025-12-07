import React, { useState } from 'react';
import { Trick, Language } from '../types';
import { BASE_TRICKS, TRICK_TIPS_DB, TRANSLATIONS } from '../constants';
import { Video, BookOpen, ChevronRight, X, Check, Info } from 'lucide-react';

interface Props {
  language: Language;
}

const YouTubePlayer = ({ videoUrl, trickName }: { videoUrl?: string, trickName: string }) => {
  const getVideoId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  let src = "";
  if (videoUrl) {
    const videoId = getVideoId(videoUrl);
    if (videoId) {
      src = `https://www.youtube.com/embed/${videoId}`;
    }
  }

  if (!src) {
    src = `https://www.youtube.com/embed?listType=search&list=How+to+${encodeURIComponent(trickName)}+skateboard`;
  }

  return (
    <div className="mt-4 bg-black rounded-2xl overflow-hidden border border-white/10 aspect-video relative shadow-2xl">
      <iframe
        width="100%"
        height="100%"
        src={src}
        title={`YouTube video player for ${trickName}`}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="absolute inset-0"
      ></iframe>
    </div>
  );
};

const TrickLearning: React.FC<Props> = ({ language }) => {
  const t = TRANSLATIONS[language];
  const [selectedTrick, setSelectedTrick] = useState<Trick | null>(null);
  const [practiceStats, setPracticeStats] = useState({ landed: 0, failed: 0 });

  const handleTrickSelect = (trick: Trick) => {
      setSelectedTrick(trick);
      setPracticeStats({ landed: 0, failed: 0 });
  };

  const recordAttempt = (landed: boolean) => {
      setPracticeStats(prev => ({
          ...prev,
          [landed ? 'landed' : 'failed']: prev[landed ? 'landed' : 'failed'] + 1
      }));
  };

  const groupedTricks = BASE_TRICKS.reduce((acc, trick) => {
    const diff = trick.difficulty;
    if (!acc[diff]) acc[diff] = [];
    acc[diff].push(trick);
    return acc;
  }, {} as Record<string, Trick[]>);

  const getTips = (trickName: string) => TRICK_TIPS_DB[trickName] || [];

  if (selectedTrick) {
      return (
        <div className="flex flex-col h-full p-6 pb-32 overflow-y-auto animate-fade-in relative z-20 bg-black">
           <div className="flex justify-between items-start mb-6">
                <button 
                    onClick={() => setSelectedTrick(null)}
                    className="p-3 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
                >
                    <X className="w-6 h-6 text-white" />
                </button>
                <div className="text-right">
                    <h2 className="text-4xl font-display font-bold text-white leading-none">{selectedTrick.name}</h2>
                     {/* @ts-ignore */}
                    <div className="inline-block px-3 py-1 bg-skate-neon/20 rounded-full mt-2">
                        <p className="text-skate-neon text-xs uppercase font-bold tracking-widest">
                            {/* @ts-ignore */}
                            {t[selectedTrick.difficulty] || selectedTrick.difficulty}
                        </p>
                    </div>
                </div>
           </div>

           <div className="glass-card p-5 rounded-3xl mb-6">
                <div className="flex items-center space-x-2 mb-2">
                    <Info className="w-4 h-4 text-skate-neon" />
                    <h3 className="text-gray-300 font-bold uppercase text-[10px] tracking-widest">{t.DESCRIPTION || "DESCRIPTION"}</h3>
                </div>
                <p className="text-gray-200 text-sm leading-relaxed font-medium">
                    {selectedTrick.description 
                        ? selectedTrick.description[language] 
                        : (language === 'KR' ? "설명이 준비되지 않았습니다." : "Description coming soon.")
                    }
                </p>
           </div>

           <div className="space-y-6 mb-8">
                <div className="flex items-center space-x-2">
                    <BookOpen className="w-4 h-4 text-skate-neon" />
                    <h3 className="text-gray-400 font-bold uppercase text-xs tracking-widest">{t.PRO_TIP || "PRO TIPS"}</h3>
                </div>

                {getTips(selectedTrick.name).length > 0 ? (
                    <div className="space-y-3">
                        {getTips(selectedTrick.name).map((tip, idx) => (
                            <div key={idx} className="bg-white/5 p-5 rounded-2xl border border-white/5">
                                <h4 className="text-white font-bold mb-2 flex items-center">
                                    <span className="w-5 h-5 rounded-full bg-skate-neon text-black flex items-center justify-center text-[10px] font-bold mr-3">
                                        {idx + 1}
                                    </span>
                                    {tip.source}
                                </h4>
                                <p className="text-gray-300 text-sm leading-relaxed pl-8">
                                    {tip.text[language]}
                                </p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-4 bg-white/5 rounded-xl text-center text-gray-500 italic text-sm">
                        No specific pro tips available for this trick yet.
                    </div>
                )}
           </div>

           <div className="mb-8">
                <div className="flex items-center space-x-2 mb-3">
                    <Video className="w-4 h-4 text-skate-neon" />
                    <h3 className="text-gray-400 font-bold uppercase text-xs tracking-widest">{t.VIDEO_TUTORIAL || "VIDEO TUTORIAL"}</h3>
                </div>
                <YouTubePlayer videoUrl={selectedTrick.videoUrl} trickName={selectedTrick.name} />
           </div>

           <div className="mt-auto glass-card rounded-3xl p-6 border border-white/10">
               <div className="flex items-center justify-between mb-4">
                   <h3 className="text-white font-bold uppercase text-sm">{t.PRACTICE_THIS || "Practice Session"}</h3>
                   <div className="flex space-x-4 text-sm font-mono font-bold">
                       <span className="text-skate-neon">L: {practiceStats.landed}</span>
                       <span className="text-skate-alert">F: {practiceStats.failed}</span>
                   </div>
               </div>
               <div className="flex space-x-3">
                   <button 
                        onClick={() => recordAttempt(false)}
                        className="flex-1 py-4 bg-white/5 text-skate-alert rounded-2xl font-bold uppercase hover:bg-white/10 active:scale-95 transition-all flex justify-center border border-white/5"
                   >
                       <X className="w-6 h-6" />
                   </button>
                   <button 
                        onClick={() => recordAttempt(true)}
                        className="flex-1 py-4 bg-skate-neon text-black rounded-2xl font-bold uppercase hover:bg-skate-neonHover active:scale-95 transition-all flex justify-center shadow-lg"
                   >
                       <Check className="w-6 h-6" />
                   </button>
               </div>
           </div>
        </div>
      );
  }

  return (
    <div className="flex flex-col h-full p-6 pb-32 overflow-y-auto animate-fade-in">
        <div className="space-y-8">
          <div className="flex items-center space-x-3">
            <BookOpen className="text-skate-neon w-6 h-6" />
            <h2 className="text-3xl font-display font-bold uppercase tracking-wide text-white">
                TRICK<br/><span className="text-gray-500">LIBRARY</span>
            </h2>
          </div>

          {Object.entries(groupedTricks).map(([difficulty, tricks]) => (
            <div key={difficulty} className="space-y-3">
              <h3 className="text-skate-neon text-[10px] font-bold uppercase tracking-[0.2em] sticky top-0 bg-black/80 backdrop-blur py-2 z-10 pl-1">
                {/* @ts-ignore */}
                {t[difficulty] || difficulty}
              </h3>
              <div className="grid grid-cols-1 gap-3">
                {tricks.map(trick => (
                  <button
                    key={trick.id}
                    onClick={() => handleTrickSelect(trick)}
                    className="flex items-center justify-between p-5 bg-white/5 rounded-2xl border border-white/5 hover:border-white/20 hover:bg-white/10 transition-all group active:scale-[0.98]"
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`w-1.5 h-12 rounded-full ${
                        getTips(trick.name).length > 0 ? 'bg-skate-neon shadow-[0_0_10px_rgba(204,255,0,0.5)]' : 'bg-gray-700'
                      }`} />
                      <div className="text-left">
                        <span className="block font-display text-2xl font-bold text-white group-hover:text-skate-neon transition-colors leading-none mb-1">
                          {trick.name}
                        </span>
                        <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider bg-black/30 px-2 py-0.5 rounded">
                           {/* @ts-ignore */}
                          {t[trick.category] || trick.category}
                        </span>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                        <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-white" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
    </div>
  );
};

export default TrickLearning;