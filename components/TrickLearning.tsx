
import React, { useState, useRef } from 'react';
import { Trick, Language, TrickTip } from '../types';
import { BASE_TRICKS, TRICK_TIPS_DB, TRANSLATIONS } from '../constants';
import { Video, BookOpen, ChevronRight, X, Check } from 'lucide-react';

interface Props {
  language: Language;
}

const VideoPlayer = ({ tip }: { tip: TrickTip }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [speed, setSpeed] = useState(1);

  const handleSpeed = (s: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = s;
      setSpeed(s);
    }
  };

  return (
    <div className="mt-4 bg-black rounded-lg overflow-hidden ml-9 border border-gray-800">
      <video 
        ref={videoRef}
        className="w-full aspect-video bg-black"
        controls
        controlsList="nodownload"
        poster="/placeholder-thumbnail.jpg"
      >
        <source src={tip.videoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'} type="video/mp4" />
        {tip.subtitleUrl && <track kind="subtitles" src={tip.subtitleUrl} srcLang="ko" label="한국어" />}
      </video>
      <div className="flex gap-2 p-2 bg-gray-900 border-t border-gray-800">
        {[0.25, 0.5, 1].map(s => (
            <button 
                key={s}
                onClick={() => handleSpeed(s)}
                className={`px-3 py-1 rounded text-xs font-bold transition-colors ${speed === s ? 'bg-skate-neon text-black' : 'bg-gray-700 text-white hover:bg-gray-600'}`}
            >
                {s}x
            </button>
        ))}
      </div>
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

           {/* Tips Content */}
           <div className="space-y-6 mb-8">
                <div className="flex items-center space-x-2">
                    <Video className="w-5 h-5 text-skate-neon" />
                    <h3 className="text-gray-300 font-bold uppercase text-sm tracking-wider">{t.HOW_TO || "HOW TO"}</h3>
                </div>

                {getTips(selectedTrick.name).length > 0 ? (
                    <div className="space-y-4">
                        {getTips(selectedTrick.name).map((tip, idx) => (
                            <div key={idx} className="bg-gray-900 p-5 rounded-xl border border-gray-800">
                                <h4 className="text-white font-bold mb-2 flex items-center">
                                    <span className="w-6 h-6 rounded-full bg-skate-neon text-black flex items-center justify-center text-xs font-bold mr-3">
                                        {idx + 1}
                                    </span>
                                    {tip.source}
                                </h4>
                                <p className="text-gray-300 text-sm leading-relaxed pl-9">
                                    {tip.text[language]}
                                </p>
                                <VideoPlayer tip={{
                                    ...tip,
                                    videoUrl: tip.videoUrl || selectedTrick.videoUrl
                                }} />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-8 bg-gray-900 rounded-xl border border-gray-800 text-center text-gray-500 italic">
                        No specific tutorial data available for this trick yet.
                    </div>
                )}
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