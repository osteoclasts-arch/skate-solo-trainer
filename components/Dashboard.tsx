

import React, { useState } from 'react';
import { MOCK_HISTORY, TRANSLATIONS } from '../constants';
import { ResponsiveContainer, AreaChart, Area, XAxis, Tooltip } from 'recharts';
import { PlayCircle, Trophy, Activity, Globe, BookOpen, Calendar, Edit2 } from 'lucide-react';
import { SessionResult, Language } from '../types';

interface Props {
  onStart: () => void;
  onLearning: () => void;
  history: SessionResult[];
  language: Language;
  onLanguageToggle: () => void;
  daysSkating: number;
  startDate: string;
  onUpdateStartDate: (date: string) => void;
}

const Dashboard: React.FC<Props> = ({ 
    onStart, 
    onLearning, 
    history, 
    language, 
    onLanguageToggle,
    daysSkating,
    startDate,
    onUpdateStartDate
}) => {
  const t = TRANSLATIONS[language];
  const [isEditingDate, setIsEditingDate] = useState(false);
  const [tempDate, setTempDate] = useState(startDate);

  // Combine mock data with real history for visualization
  const chartData = [...MOCK_HISTORY, ...history.map((h, i) => ({
      date: new Date(h.date).toISOString().split('T')[0],
      successRate: Math.round((h.landedCount / h.totalTricks) * 100)
  }))].slice(-10); // Last 10 sessions

  const totalTricks = history.reduce((acc, curr) => acc + curr.totalTricks, 0);
  const totalLanded = history.reduce((acc, curr) => acc + curr.landedCount, 0);
  const avgSuccess = totalTricks > 0 ? Math.round((totalLanded / totalTricks) * 100) : 0;

  const handleSaveDate = () => {
      onUpdateStartDate(tempDate);
      setIsEditingDate(false);
  };

  return (
    <div className="flex flex-col h-full p-6 space-y-6 bg-black overflow-y-auto pb-24 relative">
      
      {/* Date Edit Modal */}
      {isEditingDate && (
          <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
              <div className="bg-gray-900 border border-gray-700 p-6 rounded-2xl w-full max-w-sm shadow-2xl">
                  <h3 className="text-xl font-display font-bold text-white mb-4">{t.SET_START_DATE}</h3>
                  <input 
                      type="date" 
                      value={tempDate}
                      onChange={(e) => setTempDate(e.target.value)}
                      className="w-full bg-black border border-gray-700 rounded-lg p-3 text-white mb-6 focus:border-skate-neon outline-none"
                  />
                  <div className="flex gap-3">
                      <button 
                          onClick={() => setIsEditingDate(false)}
                          className="flex-1 py-3 bg-gray-800 text-gray-300 font-bold rounded-lg hover:bg-gray-700"
                      >
                          {t.CANCEL}
                      </button>
                      <button 
                          onClick={handleSaveDate}
                          className="flex-1 py-3 bg-skate-neon text-black font-bold rounded-lg hover:bg-skate-neonHover"
                      >
                          {t.SAVE}
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Header */}
      <header className="flex justify-between items-start">
        <div>
            <h1 className="text-6xl font-display font-bold text-white leading-none">
                SKATE<br/>
                <span className="text-skate-neon">SOLO</span>
            </h1>
            <div className="flex items-center space-x-2 mt-2">
                 <button 
                    onClick={() => setIsEditingDate(true)}
                    className="flex items-center space-x-2 bg-gray-900/50 hover:bg-gray-800 px-3 py-1 rounded-full border border-gray-800 transition-colors group"
                 >
                    <Calendar className="w-3 h-3 text-skate-neon" />
                    <span className="text-sm font-bold text-gray-300">
                        {t.DAY} <span className="text-white text-lg">{daysSkating}</span>
                    </span>
                    <Edit2 className="w-3 h-3 text-gray-600 group-hover:text-white" />
                 </button>
            </div>
        </div>
        <button 
          onClick={onLanguageToggle}
          className="flex items-center space-x-1 px-3 py-1.5 rounded-full border border-gray-700 bg-gray-900 text-gray-400 hover:text-white hover:border-gray-500 transition-colors"
        >
          <Globe className="w-4 h-4" />
          <span className="text-xs font-bold">{language}</span>
        </button>
      </header>

      <div className="space-y-4">
          {/* New Session Action */}
          <button 
            onClick={onStart}
            className="w-full bg-skate-neon hover:bg-skate-neonHover active:scale-95 transition-all text-black p-6 rounded-2xl flex items-center justify-between group shadow-[0_0_20px_rgba(204,255,0,0.15)]"
          >
            <div className="flex flex-col items-start">
                <span className="font-display text-4xl font-bold uppercase">{t.NEW_SESSION}</span>
                <span className="text-sm font-semibold opacity-70">{t.CUSTOMIZED_TRAINING}</span>
            </div>
            <PlayCircle className="w-12 h-12 stroke-1 group-hover:rotate-90 transition-transform duration-500" />
          </button>

          {/* Skill Learning Action */}
          <button 
            onClick={onLearning}
            className="w-full bg-gray-900 hover:bg-gray-800 border border-gray-800 active:scale-95 transition-all text-white p-6 rounded-2xl flex items-center justify-between group"
          >
            <div className="flex flex-col items-start">
                <span className="font-display text-4xl font-bold uppercase">{t.LEARNING}</span>
                <span className="text-sm font-semibold opacity-70 text-gray-400">{t.PRACTICE_THIS}</span>
            </div>
            <BookOpen className="w-12 h-12 stroke-1 text-skate-neon group-hover:scale-110 transition-transform duration-500" />
          </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-900 p-4 rounded-2xl border border-gray-800">
             <div className="flex items-center space-x-2 text-gray-400 mb-1">
                <Trophy className="w-4 h-4" />
                <span className="text-xs uppercase font-bold">{t.TOTAL_LANDED}</span>
             </div>
             <span className="text-4xl font-display font-bold text-white">{totalLanded}</span>
        </div>
        <div className="bg-gray-900 p-4 rounded-2xl border border-gray-800">
             <div className="flex items-center space-x-2 text-gray-400 mb-1">
                <Activity className="w-4 h-4" />
                <span className="text-xs uppercase font-bold">{t.AVG_SUCCESS}</span>
             </div>
             <span className="text-4xl font-display font-bold text-white">{avgSuccess}%</span>
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-[200px] bg-gray-900 rounded-2xl p-4 border border-gray-800 flex flex-col">
        <h3 className="text-gray-400 text-xs font-bold uppercase mb-4">{t.PROGRESSION}</h3>
        <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
                <defs>
                    <linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ccff00" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#ccff00" stopOpacity={0}/>
                    </linearGradient>
                </defs>
                <XAxis dataKey="date" hide />
                <Tooltip 
                    contentStyle={{ backgroundColor: '#1e1e1e', border: 'none', borderRadius: '8px' }}
                    itemStyle={{ color: '#ccff00' }}
                    cursor={{ stroke: '#444', strokeWidth: 1 }}
                />
                <Area 
                    type="monotone" 
                    dataKey="successRate" 
                    stroke="#ccff00" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorSuccess)" 
                />
            </AreaChart>
            </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;