

import React, { useState } from 'react';
import { Trick, Language } from '../types';
import { BASE_TRICKS, TRICK_TIPS_DB, TRANSLATIONS } from '../constants';
import { Video, BookOpen, ChevronRight, X, Check, Info } from 'lucide-react';

interface Props {
  language: Language;
}

const YouTubePlayer = ({ videoUrl, trickName }: { videoUrl?: string, trickName: string }) => {
  // Extract Video ID if it's a standard URL
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

  // Fallback to search query if no specific URL is provided
  if (!src) {
    src = `https://www.youtube.com/embed?listType=search&list=How+to+${encodeURIComponent(trickName)}+skateboard`;
  }

  return (
    <div className="mt-4 bg-black rounded-lg overflow-hidden border border-gray-800 aspect-video relative">
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
  
  // Practice Mode State
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

  // Group tricks by difficulty
  const groupedTricks = BASE_TRICKS.reduce((acc, trick) => {
    const diff = trick.difficulty;
    if (!acc[diff]) acc[diff] = [];
    acc[diff].push(trick);
    return acc;
  }, {} as Record<string, Trick[]>);

  const getTips = (trickName: string) => {
    return TRICK_TIPS_DB[trickName] || [];
  };

  if (selectedTrick) {
      // Detail View
      return (
        <div className="flex flex-col h-full bg-black text-white p-6 pb-24 overflow-y-auto animate-fade-in">
           <div className="flex justify-between items-start mb-6">
                <button 
                    onClick={() => setSelectedTrick(null)}
                    className="p-2 bg-gray-900 rounded-full hover:bg-gray-800 transition-colors"
                >
                    <X className="w-6 h-6 text-gray-400" />
                </button>
                <div className="text-right">
                    <h2 className="text-4xl font-display font-bold text-white leading-none">{selectedTrick.name}</h2>
                     {/* @ts-ignore */}
                    <p className="text-skate-neon text-sm uppercase font-bold">{t[selectedTrick.difficulty] || selectedTrick.difficulty}</p>
                </div>
           </div>

           {/* 1. Description Section */}
           <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-800 mb-6">
                <div className="flex items-center space-x-2 mb-2">
                    <Info className="w-4 h-4 text-skate-neon" />
                    <h3 className="text-gray-300 font-bold uppercase text-xs tracking-wider">{t.DESCRIPTION || "DESCRIPTION"}</h3>
                </div>
                <p className="text-gray-200 text-sm leading-relaxed">
                    {selectedTrick.description 
                        ? selectedTrick.description[language] 
                        : (language === 'KR' ? "설명이 준비되지 않았습니다." : "Description coming soon.")
                    }
                </p>
           </div>

           {/* 2. Pro Tips Section */}
           <div className="space-y-6 mb-8">
                <div className="flex items-center space-x-2">
                    <BookOpen className="w-5 h-5 text-skate-neon" />
                    <h3 className="text-gray-300 font-bold uppercase text-sm tracking-wider">{t.PRO_TIP || "PRO TIPS"}</h3>
                </div>

                {getTips(selectedTrick.name).length > 0 ? (
                    <div className="space-y-3">
                        {getTips(selectedTrick.name).map((tip, idx) => (
                            <div key={idx} className="bg-gray-900 p-4 rounded-xl border border-gray-800">
                                <h4 className="text-white font-bold mb-2 flex items-center">
                                    <span className="w-6 h-6 rounded-full bg-skate-neon text-black flex items-center justify-center text-xs font-bold mr-3">
                                        {idx + 1}
                                    </span>
                                    {tip.source}
                                </h4>
                                <p className="text-gray-300 text-sm leading-relaxed pl-9">
                                    {tip.text[language]}
                                </p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-4 bg-gray-900 rounded-xl border border-gray-800 text-center text-gray-500 italic text-sm">
                        No specific pro tips available for this trick yet.
                    </div>
                )}
           </div>

           {/* 3. Video Tutorial Section */}
           <div className="mb-8">
                <div className="flex items-center space-x-2 mb-3">
                    <Video className="w-5 h-5 text-skate-neon" />
                    <h3 className="text-gray-300 font-bold uppercase text-sm tracking-wider">{t.VIDEO_TUTORIAL || "VIDEO TUTORIAL"}</h3>
                </div>
                <YouTubePlayer 
                    videoUrl={selectedTrick.videoUrl} 
                    trickName={selectedTrick.name} 
                />
           </div>

           {/* Quick Practice Logger */}
           <div className="mt-auto bg-gray-900 rounded-2xl p-6 border border-gray-800">
               <div className="flex items-center justify-between mb-4">
                   <h3 className="text-white font-bold uppercase text-sm">{t.PRACTICE_THIS || "Practice Session"}</h3>
                   <div className="flex space-x-4 text-sm font-mono">
                       <span className="text-skate-neon">L: {practiceStats.landed}</span>
                       <span className="text-skate-alert">F: {practiceStats.failed}</span>
                   </div>
               </div>
               <div className="flex space-x-3">
                   <button 
                        onClick={() => recordAttempt(false)}
                        className="flex-1 py-4 bg-gray-800 text-skate-alert rounded-xl font-bold uppercase hover:bg-gray-700 active:scale-95 transition-all flex justify-center"
                   >
                       <X className="w-6 h-6" />
                   </button>
                   <button 
                        onClick={() => recordAttempt(true)}
                        className="flex-1 py-4 bg-skate-neon text-black rounded-xl font-bold uppercase hover:bg-skate-neonHover active:scale-95 transition-all flex justify-center"
                   >
                       <Check className="w-6 h-6" />
                   </button>
               </div>
           </div>
        </div>
      );
  }

  // List View
  return (
    <div className="flex flex-col h-full bg-black text-white p-6 pb-24 overflow-y-auto">
        <div className="space-y-6">
          <div className="flex items-center space-x-2 mb-2">
            <BookOpen className="text-skate-neon w-6 h-6" />
            <h2 className="text-3xl font-display font-bold uppercase tracking-wide">{t.LEARNING || "Learning"}</h2>
          </div>

          {Object.entries(groupedTricks).map(([difficulty, tricks]) => (
            <div key={difficulty} className="space-y-3">
              <h3 className="text-gray-500 text-sm font-bold uppercase tracking-wider sticky top-0 bg-black py-2 z-10">
                {/* @ts-ignore */}
                {t[difficulty] || difficulty}
              </h3>
              <div className="grid grid-cols-1 gap-3">
                {tricks.map(trick => (
                  <button
                    key={trick.id}
                    onClick={() => handleTrickSelect(trick)}
                    className="flex items-center justify-between p-4 bg-gray-900 rounded-xl border border-gray-800 hover:border-gray-600 transition-all group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-2 h-10 rounded-full ${
                        getTips(trick.name).length > 0 ? 'bg-skate-neon' : 'bg-gray-700'
                      }`} />
                      <div className="text-left">
                        <span className="block font-display text-2xl font-bold text-white group-hover:text-skate-neon transition-colors">
                          {trick.name}
                        </span>
                        <span className="text-xs text-gray-500 uppercase font-semibold">
                           {/* @ts-ignore */}
                          {t[trick.category] || trick.category}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="text-gray-600 group-hover:text-white" />
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