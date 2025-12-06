
import React, { useEffect, useState } from 'react';
import { SessionResult, Language } from '../types';
import { getSessionAnalysis } from '../services/geminiService';
import { Home, Share2, RefreshCw } from 'lucide-react';
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
      { name: t.LANDED, value: result.landedCount, color: '#ccff00' },
      { name: t.FAILED, value: result.failedCount, color: '#ff3b30' }
  ];

  return (
    <div className="flex flex-col h-full bg-black text-white p-6 overflow-y-auto">
      <div className="flex-1 flex flex-col items-center space-y-8 py-8">
        
        {/* Title */}
        <div className="text-center">
            <h2 className="text-gray-400 font-bold uppercase tracking-widest text-sm mb-2">{t.SESSION_COMPLETE}</h2>
            <h1 className="text-6xl font-display font-bold leading-none">
                {isLoss ? <span className="text-skate-alert">SKATE</span> : <span className="text-skate-neon">{t.COMPLETED}</span>}
            </h1>
            {!isLoss && <p className="text-xl text-gray-300 font-bold mt-2">{result.letters || t.CLEAN_SHEET}</p>}
        </div>

        {/* Chart */}
        <div className="h-48 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Pie>
                </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                 <span className="text-4xl font-display font-bold text-white">{successRate}%</span>
                 <span className="text-xs text-gray-500 uppercase">{t.SUCCESS}</span>
            </div>
        </div>

        {/* AI Analysis */}
        <div className="w-full bg-gray-900 rounded-xl p-5 border border-gray-800">
            <h3 className="text-skate-neon font-bold uppercase text-xs mb-2 flex items-center">
                <span className="w-2 h-2 bg-skate-neon rounded-full mr-2 animate-pulse"></span>
                {t.AI_FEEDBACK}
            </h3>
            <p className="text-gray-300 text-sm leading-relaxed italic">
                "{analysis}"
            </p>
        </div>

        {/* Detailed List */}
        <div className="w-full space-y-2">
            <h3 className="text-gray-500 font-bold uppercase text-xs mb-2">{t.DETAILS}</h3>
            {result.trickHistory.map((attempt, idx) => (
                <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-800">
                     <span className="text-sm font-medium">
                        {attempt.trick.stance && <span className="text-gray-500 mr-1">
                            {/* @ts-ignore */}
                            {t[attempt.trick.stance] || attempt.trick.stance}
                        </span>}
                        {attempt.trick.name}
                     </span>
                     <span className={attempt.landed ? "text-skate-neon" : "text-skate-alert"}>
                        {attempt.landed ? "✓" : "✗"}
                     </span>
                </div>
            ))}
        </div>
      </div>

      <div className="mt-6 flex space-x-4">
        <button onClick={onHome} className="flex-1 bg-white text-black py-4 rounded-xl font-display text-2xl font-bold uppercase hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2">
            <Home className="w-5 h-5" />
            <span>{t.DASHBOARD}</span>
        </button>
      </div>
    </div>
  );
};

export default SessionSummary;
