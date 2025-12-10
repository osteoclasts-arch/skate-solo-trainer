import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Zap, BatteryCharging, AlertCircle } from 'lucide-react';
import { Language } from '../types';

interface Props {
  onClose: () => void;
  skateDates: string[]; // YYYY-MM-DD
  onToggleDate: (date: string) => void;
  language: Language;
}

const CalendarModal: React.FC<Props> = ({ onClose, skateDates, onToggleDate, language }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const today = new Date();
  
  // Generate Days for Grid
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];
    
    // Padding for start
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }
    
    // Days
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  const days = getDaysInMonth(currentDate);
  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  // Feedback Logic
  const getFeedback = () => {
      // Calculate skate days in last 7 days from TODAY (not calendar view)
      let count = 0;
      for (let i = 0; i < 7; i++) {
          const d = new Date();
          d.setDate(today.getDate() - i);
          const dateStr = d.toISOString().split('T')[0];
          if (skateDates.includes(dateStr)) count++;
      }

      if (count >= 5) return { 
          icon: BatteryCharging, 
          color: 'text-red-500', 
          title: language === 'KR' ? '휴식 필요!' : 'Over-training?', 
          desc: language === 'KR' ? '최근 너무 많이 탔어요. 부상을 조심하고 하루 정도 푹 쉬세요.' : 'You skated a lot recently. Rest is part of training.' 
      };
      if (count >= 3) return { 
          icon: Zap, 
          color: 'text-skate-yellow', 
          title: language === 'KR' ? '최고의 리듬!' : 'On Fire!', 
          desc: language === 'KR' ? '꾸준히 잘 타고 계시네요. 이 감각을 유지하세요.' : 'Great consistency. Keep this momentum going!' 
      };
      return { 
          icon: AlertCircle, 
          color: 'text-gray-400', 
          title: language === 'KR' ? '분발하세요!' : 'Go Skate!', 
          desc: language === 'KR' ? '최근 연습이 부족해요. 오늘 당장 보드를 챙겨 나가세요!' : 'You haven\'t skated much lately. Go shred today!' 
      };
  };

  const feedback = getFeedback();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-6 animate-fade-in">
        <div className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-[2.5rem] p-6 shadow-2xl border border-gray-100 dark:border-zinc-800 relative">
            
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-black text-skate-black dark:text-white tracking-tighter">SKATE LOG</h3>
                <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-zinc-800 rounded-full hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors">
                    <X className="w-5 h-5 text-skate-black dark:text-white" />
                </button>
            </div>

            {/* Calendar Controls */}
            <div className="flex justify-between items-center mb-4 px-2">
                <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))} className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full"><ChevronLeft className="w-5 h-5 text-gray-500" /></button>
                <span className="font-bold text-lg text-skate-black dark:text-white">
                    {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </span>
                <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))} className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full"><ChevronRight className="w-5 h-5 text-gray-500" /></button>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-7 gap-2 mb-6">
                {weekDays.map(d => <div key={d} className="text-center text-xs font-bold text-gray-300 dark:text-zinc-600 mb-2">{d}</div>)}
                {days.map((day, idx) => {
                    if (!day) return <div key={`empty-${idx}`} />;
                    
                    const dateStr = day.toISOString().split('T')[0];
                    const isSelected = skateDates.includes(dateStr);
                    const isToday = dateStr === today.toISOString().split('T')[0];

                    return (
                        <button 
                            key={dateStr}
                            onClick={() => onToggleDate(dateStr)}
                            className={`aspect-square rounded-xl flex items-center justify-center text-sm font-bold transition-all relative ${
                                isSelected 
                                ? 'bg-skate-black dark:bg-white text-skate-yellow dark:text-black shadow-md scale-105' 
                                : 'bg-gray-50 dark:bg-zinc-800/50 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800'
                            } ${isToday ? 'border-2 border-skate-yellow' : ''}`}
                        >
                            {day.getDate()}
                            {isSelected && (
                                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-skate-yellow rounded-full"></div>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* AI Feedback */}
            <div className="bg-gray-50 dark:bg-zinc-800 rounded-2xl p-5 flex gap-4 items-start border border-gray-100 dark:border-zinc-700">
                <div className={`p-3 rounded-full bg-white dark:bg-zinc-900 shadow-sm ${feedback.color}`}>
                    <feedback.icon className="w-6 h-6" />
                </div>
                <div>
                    <h4 className={`font-black text-sm uppercase tracking-wide mb-1 ${feedback.color}`}>
                        {feedback.title}
                    </h4>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 leading-relaxed">
                        {feedback.desc}
                    </p>
                </div>
            </div>

        </div>
    </div>
  );
};

export default CalendarModal;