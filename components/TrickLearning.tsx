import React, { useState, useEffect } from 'react';
import { Trick, Language, Stance, Difficulty } from '../types';
import { BASE_TRICKS, TRICK_TIPS_DB, TRANSLATIONS } from '../constants';
import { Video, BookOpen, ChevronRight, X, Check, Info, Star, PlayCircle } from 'lucide-react';

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
    <div className="mt-4 bg-black rounded-3xl overflow-hidden shadow-lg aspect-video relative isolate">
      <iframe
        width="100%"
        height="100%"
        src={src}
        title={`YouTube video player for ${trickName}`}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="absolute inset-0 z-10"
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

  const getDifficultyColor = (diff: Difficulty) => {
      switch(diff) {
          case Difficulty.EASY: return 'bg-skate-matcha text-skate-black';
          case Difficulty.MEDIUM: return 'bg-skate-blue text-white';
          case Difficulty.HARD: return 'bg-skate-deep text-white';
          case Difficulty.PRO: return 'bg-skate-coral text-white';
          default: return 'bg-gray-200 text-gray-500';
      }
  };

  const getDifficultyBg = (diff: Difficulty) => {
      switch(diff) {
          case Difficulty.EASY: return 'bg-skate-matcha';
          case Difficulty.MEDIUM: return 'bg-skate-blue';
          case Difficulty.HARD: return 'bg-skate-deep';
          case Difficulty.PRO: return 'bg-skate-coral';
          default: return 'bg-gray-200';
      }
  };

  // --- DETAIL VIEW ---
  if (selectedTrick) {
      const activeContent = getStanceContent(selectedTrick, selectedStance);
      const activeTips = getTipsForStance(selectedTrick.name, selectedStance);
      const stanceTabs = Object.values(Stance);
      const isFavorite = favorites.includes(selectedTrick.id);

      return (
        <div className="flex flex-col h-full pb-32 overflow-y-auto animate-slide-up relative z-20 bg-skate-bg font-sans">
           {/* Header */}
           <div className="flex justify-between items-start mb-4 px-6 pt-6 sticky top-0 bg-skate-bg/95 backdrop-blur z-20 pb-4">
                <button 
                    onClick={() => setSelectedTrick(null)}
                    className="p-3 bg-white rounded-full hover:bg-gray-50 transition-colors shadow-sm border border-gray-100"
                >
                    <X className="w-6 h-6 text-skate-black" />
                </button>
                <div className="text-right flex flex-col items-end">
                    <div className="flex items-center gap-3">
                        <h2 className="text-3xl font-black text-skate-black leading-none tracking-tight">{selectedTrick.name}</h2>
                        <button onClick={(e) => toggleFavorite(e, selectedTrick.id)}>
                            <Star className={`w-6 h-6 ${isFavorite ? 'text-skate-yellow fill-skate-yellow' : 'text-gray-300'}`} />
                        </button>
                    </div>
                    <div className={`inline-block px-3 py-1 rounded-full mt-2 ${getDifficultyColor(selectedTrick.difficulty)}`}>
                        <p className="text-[10px] uppercase font-black tracking-widest">
                            {/* @ts-ignore */}
                            {t[selectedTrick.difficulty] || selectedTrick.difficulty}
                        </p>
                    </div>
                </div>
           </div>

           {/* Stance Selector Tabs */}
           <div className="flex flex-nowrap space-x-2 mb-6 overflow-x-auto pb-4 px-6 scrollbar-hide w-full flex-shrink-0">
               {stanceTabs.map(stance => {
                   const hasTips = getTipsForStance(selectedTrick.name, stance).length > 0;
                   const hasDoc = selectedTrick.stanceDocs?.[stance];
                   const isRegular = stance === Stance.REGULAR;
                   const isActive = selectedStance === stance;
                   
                   if (!isRegular && !hasTips && !hasDoc) return null;

                   return (
                       <button
                           key={stance}
                           onClick={() => setSelectedStance(stance)}
                           className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap border flex-shrink-0 ${
                               isActive 
                                 ? 'bg-skate-black text-white shadow-md' 
                                 : 'bg-white text-gray-400 border-gray-100'
                           }`}
                       >
                           {/* @ts-ignore */}
                           {t[stance] || stance}
                       </button>
                   );
               })}
           </div>

           {/* Content Body */}
           <div className="px-6 space-y-6">
               
               {/* Description */}
               <div className="bg-white p-6 rounded-[2rem] shadow-pop">
                    <div className="flex items-center space-x-2 mb-2">
                        <Info className="w-4 h-4 text-skate-deep" />
                        <h3 className="text-skate-deep font-bold uppercase text-[10px] tracking-widest">{t.DESCRIPTION || "DESCRIPTION"}</h3>
                    </div>
                    <p className="text-skate-black text-sm leading-relaxed font-medium">
                        {activeContent?.description 
                            ? activeContent.description[language] 
                            : (selectedTrick.description ? selectedTrick.description[language] : (language === 'KR' ? "설명이 준비되지 않았습니다." : "Description coming soon."))
                        }
                    </p>
               </div>

               {/* Tips */}
               <div className="space-y-4">
                    <div className="flex items-center space-x-2 pl-2">
                        <BookOpen className="w-4 h-4 text-skate-black" />
                        <h3 className="text-gray-400 font-bold uppercase text-xs tracking-widest">{t.PRO_TIP || "PRO TIPS"}</h3>
                    </div>

                    {activeTips.length > 0 ? (
                        <div className="space-y-3">
                            {activeTips.map((tip, idx) => (
                                <div key={idx} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-cute relative overflow-hidden">
                                    <div className="absolute left-0 top-0 bottom-0 w-2 bg-skate-yellow"></div>
                                    <h4 className="text-skate-black font-bold mb-2 flex items-center text-sm">
                                        <span className="w-5 h-5 rounded-full bg-skate-yellow text-skate-black flex items-center justify-center text-[10px] font-black mr-3">
                                            {idx + 1}
                                        </span>
                                        {tip.source}
                                    </h4>
                                    <p className="text-gray-600 text-sm leading-relaxed pl-8 font-medium">
                                        {tip.text[language]}
                                    </p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-6 bg-white rounded-3xl text-center border-2 border-dashed border-gray-200">
                            <p className="text-gray-400 text-sm italic mb-1 font-medium">
                                {language === 'KR' ? '아직 등록된 팁이 없습니다.' : 'No tips available.'}
                            </p>
                        </div>
                    )}
               </div>

               {/* Video */}
               <div className="pb-4">
                    <div className="flex items-center space-x-2 pl-2 mb-2">
                        <Video className="w-4 h-4 text-skate-black" />
                        <h3 className="text-gray-400 font-bold uppercase text-xs tracking-widest">{t.VIDEO_TUTORIAL || "VIDEO"}</h3>
                    </div>
                    <YouTubePlayer 
                        videoUrl={activeContent?.videoUrl || selectedTrick.videoUrl} 
                        trickName={`${selectedStance === Stance.REGULAR ? '' : selectedStance} ${selectedTrick.name}`} 
                    />
               </div>

               {/* Practice Logger */}
               <div className="bg-skate-black rounded-[2.5rem] p-6 shadow-pop mb-8">
                   <div className="flex items-center justify-between mb-4">
                       <h3 className="text-white font-bold uppercase text-sm flex items-center gap-2">
                            <PlayCircle className="w-5 h-5 text-skate-yellow" />
                            {t.PRACTICE_THIS || "Practice"}
                        </h3>
                       <div className="flex space-x-3 text-sm font-bold bg-white/10 px-3 py-1 rounded-full">
                           <span className="text-skate-yellow">L: {practiceStats.landed}</span>
                           <span className="text-white/30">|</span>
                           <span className="text-white">F: {practiceStats.failed}</span>
                       </div>
                   </div>
                   <div className="flex space-x-3">
                       <button 
                            onClick={() => recordAttempt(false)}
                            className="flex-1 py-4 bg-white/10 text-white rounded-2xl font-black uppercase hover:bg-white/20 active:scale-95 transition-all flex justify-center border border-white/5"
                       >
                           <X className="w-6 h-6 stroke-[3px]" />
                       </button>
                       <button 
                            onClick={() => recordAttempt(true)}
                            className="flex-1 py-4 bg-skate-yellow text-skate-black rounded-2xl font-black uppercase hover:bg-yellow-400 active:scale-95 transition-all flex justify-center shadow-lg"
                       >
                           <Check className="w-6 h-6 stroke-[4px]" />
                       </button>
                   </div>
               </div>
           </div>
        </div>
      );
  }

  // --- LIST VIEW ---
  return (
    <div className="flex flex-col h-full p-6 pb-32 overflow-y-auto animate-fade-in bg-skate-bg">
        <div className="space-y-8">
          <div className="flex items-center space-x-3 mt-2">
            <BookOpen className="text-skate-black w-8 h-8" />
            <h2 className="text-3xl font-black text-skate-black leading-none tracking-tight">
                {language === 'KR' ? "트릭 가이드" : "TRICK GUIDE"}
            </h2>
          </div>

          {/* FAVORITES */}
          {favoriteTricks.length > 0 && (
            <div className="space-y-3">
               <h3 className="text-skate-black text-xs font-bold uppercase tracking-widest pl-2 flex items-center gap-2">
                 <Star className="w-3 h-3 fill-skate-yellow text-skate-yellow" />
                 {language === 'KR' ? '즐겨찾기' : 'FAVORITES'}
               </h3>
               <div className="grid grid-cols-1 gap-3">
                 {favoriteTricks.map(trick => (
                    <button
                        key={`fav-${trick.id}`}
                        onClick={() => handleTrickSelect(trick)}
                        className="flex items-center justify-between p-5 bg-white rounded-[2rem] shadow-pop hover:shadow-lg transition-all group active:scale-[0.98] border border-gray-50"
                    >
                        <div className="flex items-center space-x-4">
                            <div className={`w-1.5 h-12 rounded-full ${getDifficultyBg(trick.difficulty)}`} />
                            <div className="text-left">
                                <span className="block font-black text-lg text-skate-black leading-none mb-1">
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
                            className="w-10 h-10 rounded-full flex items-center justify-center bg-yellow-50 hover:bg-yellow-100 transition-colors z-10"
                        >
                            <Star className="w-5 h-5 text-skate-yellow fill-skate-yellow" />
                        </div>
                    </button>
                 ))}
               </div>
            </div>
          )}

          {/* GROUPS */}
          {Object.entries(groupedTricks).map(([difficulty, tricks]) => (
            <div key={difficulty} className="space-y-3">
              <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest pl-2 sticky top-0 bg-skate-bg/95 backdrop-blur py-2 z-10">
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
                        className="flex items-center justify-between p-5 bg-white rounded-[2rem] shadow-pop hover:shadow-lg transition-all group active:scale-[0.98] border border-gray-50"
                    >
                        <div className="flex items-center space-x-4">
                            <div className={`w-1.5 h-12 rounded-full ${getDifficultyBg(trick.difficulty)}`} />
                            <div className="text-left">
                                <span className="block font-black text-lg text-skate-black group-hover:text-skate-deep transition-colors leading-none mb-1">
                                    {trick.name}
                                </span>
                                <span className="text-[10px] text-gray-400 font-bold tracking-wider bg-gray-100 px-2 py-0.5 rounded-full inline-block uppercase">
                                    {/* @ts-ignore */}
                                    {t[trick.category] || trick.category}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                             {isFav && <Star className="w-4 h-4 text-skate-yellow fill-skate-yellow" />}
                            <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-gray-100 transition-colors">
                                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-skate-black" />
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