import React, { useEffect, useState } from 'react';
import { SessionResult, Language } from '../types';
import { getSessionAnalysis } from '../services/geminiService';
import { Home, Zap, AlertCircle } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TRANSLATIONS } from '../constants';

interface Props {
  result: SessionResult;
  onHome: () => void;
  language: Language;
}

const SessionSummary: React.FC<Props> = ({ result, onHome, language }) => {
  const t = TRANSLATIONS[language];
  const [analysis, setAnalysis] = useState<string>(t.ANALYZING || "Analyzing session data...");

  useEffect(() => {
    getSessionAnalysis(result, language).then(setAnalysis);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const successRate = Math.round((result.landedCount / result.totalTricks) * 100);
  const isLoss = result.letters === 'SKATE';

  const data = [
      { name: t.LANDED, value: result.landedCount, color: '#FFE500' }, // Yellow
      { name: t.FAILED, value: result.failedCount, color: '#F5F5F4' }  // Light Gray
  ];

  return (
    <div className="flex flex-col h-full bg-skate-bg text-skate-black p-6 overflow-y-auto font-sans relative">
      
      <div className="relative z-10 flex-1 flex flex-col items-center space-y-8 pb-10">
        
        {/* Header Section */}
        <div className="text-center mt-6">
            <span className="inline-block px-4 py-1 bg-white border border-gray-100 rounded-full text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">
                {t.SESSION_COMPLETE}
            </span>
            <h1 className="text-6xl font-display font-black leading-none tracking-tight mb-2">
                {isLoss ? (
                    <span className="text-skate-black">SKATE</span>
                ) : (
                    <span className="text-skate-black">{t.COMPLETED}</span>
                )}
            </h1>
            {!isLoss && (
                <div className="flex items-center justify-center gap-2">
                    <p className="text-lg font-bold text-skate-deep tracking-wide">{result.letters ? `LETTERS: ${result.letters}` : t.CLEAN_SHEET}</p>
                </div>
            )}
        </div>

        {/* Chart Card (Ticket Style) */}
        <div className="w-full pop-card bg-white p-0 relative overflow-hidden">
            <div className="p-6 flex items-center justify-between relative z-10">
                <div className="h-32 w-32 relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={45}
                                outerRadius={60}
                                paddingAngle={5}
                                dataKey="value"
                                stroke="none"
                                cornerRadius={10}
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                         <Zap className="w-6 h-6 text-skate-black fill-skate-black" />
                    </div>
                </div>
                
                <div className="flex-1 pl-6 text-right">
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">{t.SUCCESS}</p>
                    <span className="text-6xl font-display font-black text-skate-black leading-none">{successRate}%</span>
                    <div className="flex justify-end gap-3 mt-2 text-xs font-bold">
                        <span className="text-skate-deep">{result.landedCount} Landed</span>
                        <span className="text-gray-400">{result.failedCount} Failed</span>
                    </div>
                </div>
            </div>
            
            {/* Ticket Perforation */}
            <div className="relative h-4 bg-gray-50 flex items-center justify-between px-2">
                <div className="w-6 h-6 rounded-full bg-skate-bg -ml-4"></div>
                <div className="border-t-2 border-dashed border-gray-300 w-full mx-2"></div>
                <div className="w-6 h-6 rounded-full bg-skate-bg -mr-4"></div>
            </div>

            {/* AI Feedback Section */}
            <div className="p-6 bg-gray-50">
                <h3 className="text-skate-deep font-bold uppercase text-xs mb-3 flex items-center tracking-widest">
                    <span className="w-2 h-2 bg-skate-deep rounded-full mr-2 animate-pulse"></span>
                    {t.AI_FEEDBACK}
                </h3>
                <p className="text-skate-black text-sm leading-relaxed font-medium">
                    "{analysis}"
                </p>
            </div>
        </div>

        {/* Trick History List */}
        <div className="w-full space-y-3">
            <h3 className="text-gray-400 font-bold uppercase text-xs pl-2 tracking-widest">{t.DETAILS}</h3>
            <div className="space-y-2">
                {result.trickHistory.map((attempt, idx) => (
                    <div key={idx} className="bg-white p-4 rounded-2xl flex justify-between items-center shadow-sm border border-gray-50">
                         <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${attempt.landed ? 'bg-skate-yellow text-skate-black' : 'bg-gray-100 text-gray-400'}`}>
                                {attempt.landed ? <Zap className="w-4 h-4 fill-black" /> : <AlertCircle className="w-4 h-4" />}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-skate-black">
                                    {attempt.trick.name}
                                </span>
                                {attempt.trick.stance && (
                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                        {/* @ts-ignore */}
                                        {t[attempt.trick.stance] || attempt.trick.stance}
                                    </span>
                                )}
                            </div>
                         </div>
                         <span className={`text-xs font-black uppercase tracking-wider ${attempt.landed ? "text-skate-deep" : "text-gray-300"}`}>
                            {attempt.landed ? t.LANDED : t.FAILED}
                         </span>
                    </div>
                ))}
            </div>
        </div>
      </div>

      <div className="relative z-20 pt-4 bg-gradient-to-t from-skate-bg via-skate-bg to-transparent">
        <button 
            onClick={onHome} 
            className="w-full py-5 bg-skate-black text-white rounded-[2.5rem] font-bold text-lg uppercase tracking-widest hover:bg-gray-800 transition-colors shadow-pop flex items-center justify-center gap-2"
        >
            <Home className="w-5 h-5" />
            <span>{t.DASHBOARD}</span>
        </button>
      </div>
    </div>
  );
};

export default SessionSummary;