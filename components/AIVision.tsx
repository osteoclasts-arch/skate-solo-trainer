
import React, { useState, useRef } from 'react';
import { Language, VisionAnalysis } from '../types';
import { TRANSLATIONS } from '../constants';
import { Upload, Camera, Zap, AlertTriangle, Play, X, Eye } from 'lucide-react';
import { analyzeMedia } from '../services/geminiService';

interface Props {
  language: Language;
}

const AIVision: React.FC<Props> = ({ language }) => {
  const t = TRANSLATIONS[language];
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<VisionAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
        if (selectedFile.size > 20 * 1024 * 1024) {
            setError(t.FILE_TOO_LARGE);
            return;
        }
        setFile(selectedFile);
        setPreviewUrl(URL.createObjectURL(selectedFile));
        setResult(null);
        setError(null);
    }
  };

  const handleAnalyze = async () => {
      if (!file) return;
      setIsAnalyzing(true);
      setError(null);
      
      try {
          const analysis = await analyzeMedia(file, language);
          if (analysis) {
              setResult(analysis);
          } else {
              setError("Failed to analyze. Please try again.");
          }
      } catch (e: any) {
          console.error(e);
          setError(e.message || "Error analyzing media");
      } finally {
          setIsAnalyzing(false);
      }
  };

  const reset = () => {
      setFile(null);
      setPreviewUrl(null);
      setResult(null);
      setError(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="flex flex-col h-full p-6 pb-32 overflow-y-auto animate-fade-in relative bg-black">
        {/* Header */}
        <div className="flex items-center space-x-3 mb-6">
            <Eye className="text-skate-neon w-6 h-6" />
            <div>
                <h2 className="text-3xl font-display font-bold uppercase tracking-wide text-white leading-none">
                    AI <span className="text-skate-neon text-glow">VISION</span>
                </h2>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">
                    {t.AI_VISION_DESC}
                </p>
            </div>
        </div>

        {/* Upload Area */}
        {!previewUrl ? (
            <div 
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 min-h-[300px] border-2 border-dashed border-white/20 rounded-3xl flex flex-col items-center justify-center p-6 bg-white/5 hover:bg-white/10 transition-colors cursor-pointer group"
            >
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    accept="image/*,video/*" 
                    className="hidden" 
                />
                <div className="w-20 h-20 rounded-full bg-skate-neon/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Upload className="w-8 h-8 text-skate-neon" />
                </div>
                <p className="text-white font-bold uppercase tracking-wider mb-2">{t.UPLOAD_MEDIA}</p>
                <p className="text-gray-500 text-xs text-center max-w-[200px]">
                    Tap to select a photo or video clip (Max 20MB)
                </p>
            </div>
        ) : (
            <div className="flex flex-col space-y-6">
                {/* Preview Container */}
                <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-black">
                    <button 
                        onClick={reset}
                        className="absolute top-4 right-4 z-20 bg-black/50 p-2 rounded-full hover:bg-black/80 text-white"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    
                    {file?.type.startsWith('video') ? (
                        <video src={previewUrl} controls className="w-full max-h-[400px] object-contain" />
                    ) : (
                        <img src={previewUrl} alt="Preview" className="w-full max-h-[400px] object-contain" />
                    )}

                    {/* Analyzing Overlay */}
                    {isAnalyzing && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                            <div className="relative mb-4">
                                <div className="absolute inset-0 bg-skate-neon/50 blur-xl rounded-full animate-pulse"></div>
                                <Zap className="w-12 h-12 text-skate-neon relative z-10 animate-bounce" />
                            </div>
                            <p className="text-white font-display text-xl font-bold uppercase tracking-widest animate-pulse">
                                {t.ANALYZING_MEDIA}
                            </p>
                        </div>
                    )}
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-500/10 border border-red-500/50 p-4 rounded-xl flex items-center space-x-3 text-red-400">
                        <AlertTriangle className="w-5 h-5" />
                        <span className="text-sm font-bold">{error}</span>
                    </div>
                )}

                {/* Action Button */}
                {!result && !isAnalyzing && (
                    <button 
                        onClick={handleAnalyze}
                        className="w-full py-4 bg-skate-neon text-black rounded-2xl font-display text-2xl font-bold uppercase tracking-wider hover:bg-skate-neonHover transition-all shadow-[0_0_20px_rgba(204,255,0,0.3)] active:scale-95 flex items-center justify-center space-x-2"
                    >
                        <Zap className="w-5 h-5 fill-black" />
                        <span>{t.ANALYZE_TRICK}</span>
                    </button>
                )}

                {/* Results Card */}
                {result && (
                    <div className="space-y-4 animate-slide-up">
                        {/* Summary Header */}
                        <div className="glass-card p-6 rounded-3xl border border-skate-neon/30 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <Zap className="w-24 h-24 text-skate-neon" />
                            </div>
                            
                            <div className="relative z-10">
                                <span className="text-skate-neon text-[10px] font-bold uppercase tracking-[0.2em] mb-1 block">
                                    {t.TRICK_DETECTED}
                                </span>
                                <h3 className="text-4xl font-display font-bold text-white mb-4">{result.trickName}</h3>
                                
                                <div className="flex space-x-4">
                                    <div className="bg-white/5 px-4 py-2 rounded-xl border border-white/5">
                                        <span className="block text-[10px] text-gray-500 uppercase font-bold">{t.FORM_SCORE}</span>
                                        <span className="text-2xl font-display font-bold text-skate-neon">{result.formScore}/10</span>
                                    </div>
                                    <div className="bg-white/5 px-4 py-2 rounded-xl border border-white/5">
                                        <span className="block text-[10px] text-gray-500 uppercase font-bold">{t.HEIGHT_EST}</span>
                                        <span className="text-2xl font-display font-bold text-white">{result.heightEstimate}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Analysis Details */}
                        <div className="space-y-3">
                            <div className="glass-card p-5 rounded-2xl">
                                <h4 className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-2">{t.POSTURE_ANALYSIS}</h4>
                                <p className="text-sm text-gray-200 leading-relaxed font-medium">{result.postureAnalysis}</p>
                            </div>
                            
                            <div className="glass-card p-5 rounded-2xl">
                                <h4 className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-2">{t.LANDING_ANALYSIS}</h4>
                                <p className="text-sm text-gray-200 leading-relaxed font-medium">{result.landingAnalysis}</p>
                            </div>

                            <div className="bg-gradient-to-r from-skate-neon/20 to-transparent p-5 rounded-2xl border border-skate-neon/20">
                                <h4 className="text-skate-neon text-[10px] font-bold uppercase tracking-widest mb-2 flex items-center">
                                    <Zap className="w-3 h-3 mr-1 fill-skate-neon" />
                                    {t.IMPROVEMENT_TIP}
                                </h4>
                                <p className="text-white text-lg font-display font-bold leading-tight italic">
                                    "{result.improvementTip}"
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        )}
    </div>
  );
};

export default AIVision;
