import React, { useState, useEffect } from 'react';
import { Trick, Language, Stance } from '../types';
import { BASE_TRICKS, TRICK_TIPS_DB, TRANSLATIONS } from '../constants';
import { Video, BookOpen, ChevronRight, X, Check, Info, Star } from 'lucide-react';

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
  const [selectedStance, setSelectedStance] = useState<Stance>(Stance.REGULAR);
  const [practiceStats, setPracticeStats] = useState({ landed: 0, failed: 0 });
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
        const saved = localStorage.getItem('skate_trick_favorites');
        return saved ? JSON.parse(saved) : [];
    } catch {
        return [];
    }
  });

  useEffect(() => {
    if (selectedTrick) {
        setSelectedStance(Stance.REGULAR);
    }
  }, [selectedTrick]);

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

  const toggleFavorite = (e: React.MouseEvent, trickId: string) => {
      e.stopPropagation();
      setFavorites(prev => {
          const newFavs = prev.includes(trickId) 
            ? prev.filter(id => id !== trickId) 
            : [...prev, trickId];
          localStorage.setItem('skate_trick_favorites', JSON.stringify(newFavs));
          return newFavs;
      });
  };

  const groupedTricks = BASE_TRICKS.reduce((acc, trick) => {
    const diff = trick.difficulty;
    if (!acc[diff]) acc[diff] = [];
    acc[diff].push(trick);
    return acc;
  }, {} as Record<string, Trick[]>);

  // Extract Favorite Tricks
  const favoriteTricks = BASE_TRICKS.filter(t => favorites.includes(t.id));

  const getStanceContent = (trick: Trick, stance: Stance) => {
      if (trick.stanceDocs && trick.stanceDocs[stance]) {
          return trick.stanceDocs[stance];
      }
      if (stance === Stance.REGULAR) {
          return {
              videoUrl: trick.videoUrl,
              description: trick.description
          };
      }
      return {
          videoUrl: trick.videoUrl,
          description: null
      };
  };

  const getTipsForStance = (trickName: string, stance: Stance) => {
      let key = trickName;
      if (stance !== Stance.REGULAR) {
          key = `${stance} ${trickName}`;
      }
      return TRICK_TIPS_DB[key] || [];
  };

  if (selectedTrick) {
      const activeContent = getStanceContent(selectedTrick, selectedStance);
      const activeTips = getTipsForStance(selectedTrick.name, selectedStance);
      const stanceTabs = Object.values(Stance);
      const isFavorite = favorites.includes(selectedTrick.id);

      // Detail View: No parent padding, apply padding to children for full-bleed scroll
      return (
        <div className="flex flex-col h-full pb-32 overflow-y-auto animate-fade-in relative z-20 bg-black">
           {/* Header */}
           <div className="flex justify-between items-start mb-4 px-6 pt-6">
                <button 
                    onClick={() => setSelectedTrick(null)}
                    className="p-3 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
                >
                    <X className="w-6 h-6 text-white" />
                </button>
                <div className="text-right flex flex-col items-end">
                    <div className="flex items-center gap-2">
                        <h2 className="text-4xl font-display font-bold text-white leading-none">{selectedTrick.name}</h2>
                        <button onClick={(e) => toggleFavorite(e, selectedTrick.id)}>
                            <Star className={`w-6 h-6 ${isFavorite ? 'text-skate-neon fill-skate-neon' : 'text-gray-600'}`} />
                        </button>
                    </div>
                     {/* @ts-ignore */}
                    <div className="inline-block px-3 py-1 bg-skate-neon/20 rounded-full mt-2">
                        <p className="text-skate-neon text-xs uppercase font-bold tracking-widest">
                            {/* @ts-ignore */}
                            {t[selectedTrick.difficulty] || selectedTrick.difficulty}
                        </p>
                    </div>
                </div>
           </div>

           {/* Stance Selector Tabs - Full Bleed */}
           <div className="flex flex-nowrap space-x-2 mb-6 overflow-x-auto pb-4 px-6 scrollbar-hide w-full flex-shrink-0">
               {stanceTabs.map(stance => {
                   const hasTips = getTipsForStance(selectedTrick.name, stance).length > 0;
                   const hasDoc = selectedTrick.stanceDocs?.[stance];
                   const isRegular = stance === Stance.REGULAR;
                   const isActive = selectedStance === stance;
                   
                   // Filter out stances that have no content (unless it's Regular)
                   if (!isRegular && !hasTips && !hasDoc) return null;

                   return (
                       <button
                           key={stance}
                           onClick={() => setSelectedStance(stance)}
                           className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap border flex-shrink-0 ${
                               isActive 
                                 ? 'bg-skate-neon text-black border-skate-neon shadow-[0_0_10px_rgba(204,255,0,0.4)]' 
                                 : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10'
                           }`}
                       >
                           {/* @ts-ignore */}
                           {t[stance] || stance}
                       </button>
                   );
               })}
           </div>

           {/* Description Card */}
           <div className="px-6 mb-6">
                <div className="glass-card p-5 rounded-3xl">
                    <div className="flex items-center space-x-2 mb-2">
                        <Info className="w-4 h-4 text-skate-neon" />
                        <h3 className="text-gray-300 font-bold uppercase text-[10px] tracking-widest">{t.DESCRIPTION || "DESCRIPTION"}</h3>
                    </div>
                    <p className="text-gray-200 text-sm leading-relaxed font-medium">
                        {activeContent?.description 
                            ? activeContent.description[language] 
                            : (selectedTrick.description ? selectedTrick.description[language] : (language === 'KR' ? "설명이 준비되지 않았습니다." : "Description coming soon."))
                        }
                    </p>
                </div>
           </div>

           {/* Tips Section */}
           <div className="px-6 space-y-6 mb-8">
                <div className="flex items-center space-x-2">
                    <BookOpen className="w-4 h-4 text-skate-neon" />
                    <h3 className="text-gray-400 font-bold uppercase text-xs tracking-widest">{t.PRO_TIP || "PRO TIPS"}</h3>
                </div>

                {activeTips.length > 0 ? (
                    <div className="space-y-3">
                        {activeTips.map((tip, idx) => (
                            <div key={idx} className="bg-white/5 p-5 rounded-2xl border border-white/5 animate-fade-in">
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
                    <div className="p-6 bg-white/5 rounded-2xl text-center border border-white/5 border-dashed">
                        <p className="text-gray-500 text-sm italic mb-2">
                            {language === 'KR' ? '아직 등록된 팁이 없습니다.' : 'No tips available for this stance yet.'}
                        </p>
                        {selectedStance !== Stance.REGULAR && (
                            <p className="text-xs text-gray-600">
                                {language === 'KR' ? '기본 스탠스 팁을 참고해보세요!' : 'Try checking the Regular stance tips!'}
                            </p>
                        )}
                    </div>
                )}
           </div>

           {/* Video Section */}
           <div className="px-6 mb-8">
                <div className="flex items-center space-x-2 mb-3">
                    <Video className="w-4 h-4 text-skate-neon" />
                    <h3 className="text-gray-400 font-bold uppercase text-xs tracking-widest">{t.VIDEO_TUTORIAL || "VIDEO TUTORIAL"}</h3>
                </div>
                <YouTubePlayer 
                    videoUrl={activeContent?.videoUrl || selectedTrick.videoUrl} 
                    trickName={`${selectedStance === Stance.REGULAR ? '' : selectedStance} ${selectedTrick.name}`} 
                />
           </div>

           {/* Quick Practice Logger */}
           <div className="px-6 mt-auto">
               <div className="glass-card rounded-3xl p-6 border border-white/10">
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
        </div>
      );
  }

  // List View: Use padding container
  return (
    <div className="flex flex-col h-full p-6 pb-32 overflow-y-auto animate-fade-in">
        <div className="space-y-8">
          <div className="flex items-center space-x-3">
            <BookOpen className="text-skate-neon w-6 h-6" />
            <h2 className="text-3xl font-display font-bold uppercase tracking-wide text-white leading-tight">
                {language === 'KR' ? (
                    <>
                        트릭<br/>
                        <span className="text-gray-500">가이드</span>
                    </>
                ) : (
                    <>
                        TRICK<br/>
                        <span className="text-gray-500">GUIDE</span>
                    </>
                )}
            </h2>
          </div>

          {/* FAVORITES SECTION */}
          {favoriteTricks.length > 0 && (
            <div className="space-y-3">
               <h3 className="text-skate-neon text-[10px] font-bold uppercase tracking-[0.2em] sticky top-0 bg-black/80 backdrop-blur py-2 z-10 pl-1 flex items-center gap-2">
                 <Star className="w-3 h-3 fill-skate-neon" />
                 {language === 'KR' ? '즐겨찾기 (FAVORITES)' : 'FAVORITES'}
               </h3>
               <div className="grid grid-cols-1 gap-3">
                 {favoriteTricks.map(trick => (
                    <button
                        key={`fav-${trick.id}`}
                        onClick={() => handleTrickSelect(trick)}
                        className="flex items-center justify-between p-5 bg-skate-neon/10 rounded-2xl border border-skate-neon/30 hover:bg-skate-neon/20 transition-all group active:scale-[0.98]"
                    >
                        <div className="flex items-center space-x-4">
                            <div className="w-1.5 h-12 rounded-full bg-skate-neon shadow-[0_0_10px_rgba(204,255,0,0.5)]" />
                            <div className="text-left">
                                <span className="block font-display text-2xl font-bold text-white leading-none mb-1">
                                    {trick.name}
                                </span>
                                <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                                     {/* @ts-ignore */}
                                    {t[trick.difficulty] || trick.difficulty}
                                </span>
                            </div>
                        </div>
                        <div 
                            onClick={(e) => toggleFavorite(e, trick.id)}
                            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors z-10"
                        >
                            <Star className="w-5 h-5 text-skate-neon fill-skate-neon" />
                        </div>
                    </button>
                 ))}
               </div>
            </div>
          )}

          {Object.entries(groupedTricks).map(([difficulty, tricks]) => (
            <div key={difficulty} className="space-y-3">
              <h3 className="text-skate-neon text-[10px] font-bold uppercase tracking-[0.2em] sticky top-0 bg-black/80 backdrop-blur py-2 z-10 pl-1">
                {/* @ts-ignore */}
                {t[difficulty] || difficulty}
              </h3>
              <div className="grid grid-cols-1 gap-3">
                {tricks.map(trick => {
                  const isFav = favorites.includes(trick.id);
                  return (
                    <button
                        key={trick.id}
                        onClick={() => handleTrickSelect(trick)}
                        className="flex items-center justify-between p-5 bg-white/5 rounded-2xl border border-white/5 hover:border-white/20 hover:bg-white/10 transition-all group active:scale-[0.98]"
                    >
                        <div className="flex items-center space-x-4">
                        <div className={`w-1.5 h-12 rounded-full ${
                            getTipsForStance(trick.name, Stance.REGULAR).length > 0 ? 'bg-skate-neon shadow-[0_0_10px_rgba(204,255,0,0.5)]' : 'bg-gray-700'
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
                        <div className="flex items-center gap-3">
                             <div 
                                onClick={(e) => toggleFavorite(e, trick.id)}
                                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors z-10"
                             >
                                <Star className={`w-4 h-4 ${isFav ? 'text-skate-neon fill-skate-neon' : 'text-gray-600'}`} />
                            </div>
                            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-white" />
                            </div>
                        </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
    </div>
  );
};

export default TrickLearning;