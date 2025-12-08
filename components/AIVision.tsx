
import React, { useState, useRef } from 'react';
import { Language, User, VisionAnalysis } from '../types';
import { TRANSLATIONS } from '../constants';
import { Upload, Zap, AlertTriangle, Play, X, Eye, Video, CheckCircle, HelpCircle, Ruler, FileVideo, Activity } from 'lucide-react';
import { analyzeVideoMock } from '../services/visionService';
import { generateCoachingFeedback } from '../services/geminiService';
import { dbService } from '../services/dbService';

interface Props {
  language: Language;
  user: User | null;
}

const AIVision: React.FC<Props> = ({ language, user }) => {
  const t = TRANSLATIONS[language];
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<VisionAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Video Ref
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
        // Max 50MB for video
        if (selectedFile.size > 50 * 1024 * 1024) {
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
          // 1. Mock Vision Analysis (Simulate Backend)
          const visionResult = await analyzeVideoMock(file);
          
          // 2. Generate Text Feedback via Gemini
          const coaching = await generateCoachingFeedback(visionResult, language);
          
          // 3. Merge Results
          const finalResult: VisionAnalysis = {
              ...visionResult,
              feedbackText: coaching.feedback,
              improvementTip: coaching.tips
          };

          setResult(finalResult);

          // 4. Save to DB (if user logged in)
          if (user) {
              await dbService.saveAnalysisResult(user.uid, finalResult);
          }

      } catch (e: any) {
          console.error(e);
          setError("Analysis failed. Please try again.");
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

        {/* Instructions / Constraints */}
        {!previewUrl && (
            <div className="mb-6 bg-white/5 border border-white/5 rounded-2xl p-4">
                <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2 flex items-center">
                    <Video className="w-3 h-3 mr-1" />
                    Recording Guidelines
                </h3>
                <ul className="text-xs text-gray-400 space-y-1 list-disc list-inside">
                    <li>Use a tripod (fixed camera).</li>
                    <li>Record from the <strong>side view</strong>.</li>
                    <li>Keep your whole body and board in frame.</li>
                    <li>Ensure good lighting.</li>
                </ul>
            </div>
        )}

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
                    accept="video/*" 
                    className="hidden" 
                />
                <div className="w-20 h-20 rounded-full bg-skate-neon/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <FileVideo className="w-8 h-8 text-skate-neon" />
                </div>
                <p className="text-white font-bold uppercase tracking-wider mb-2">{t.UPLOAD_MEDIA}</p>
                <p className="text-gray-500 text-xs text-center max-w-[200px]">
                    Select a video clip (Max 50MB)
                </p>
            </div>
        ) : (
            <div className="flex flex-col space-y-6">
                {/* Preview Container */}
                <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-black">
                    <button 
                        onClick={reset}
                        className="absolute top-4 right-4 z-30 bg-black/50 p-2 rounded-full hover:bg-black/80 text-white"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    
                    {/* Media Container */}
                    <div className="relative w-full aspect-video bg-black flex items-center justify-center overflow-hidden">
                        <video 
                            ref={videoRef}
                            src={previewUrl} 
                            controls={true} 
                            className="w-full h-full object-contain" 
                            playsInline
                            crossOrigin="anonymous"
                        />
                    </div>

                    {/* Analyzing Overlay */}
                    {isAnalyzing && (
                        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center z-40">
                            <div className="relative mb-4">
                                <div className="absolute inset-0 bg-skate-neon/50 blur-xl rounded-full animate-pulse"></div>
                                <Activity className="w-12 h-12 text-skate-neon relative z-10 animate-spin" />
                            </div>
                            <p className="text-white font-display text-xl font-bold uppercase tracking-widest animate-pulse">
                                Analyzing Trick...
                            </p>
                            <p className="text-gray-400 text-xs mt-2">Classifying & Scoring</p>
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

                {/* ACTION AREA */}
                {!result && !isAnalyzing && (
                    <button 
                        onClick={handleAnalyze}
                        className="w-full py-4 bg-skate-neon text-black rounded-2xl font-display text-2xl font-bold uppercase tracking-wider hover:bg-skate-neonHover transition-all shadow-[0_0_20px_rgba(204,255,0,0.3)] active:scale-95 flex items-center justify-center space-x-2"
                    >
                        <Zap className="w-5 h-5 fill-black" />
                        <span>Start Analysis</span>
                    </button>
                )}

                {/* Results Card */}
                {result && (
                    <div className="space-y-4 animate-slide-up">
                        {/* Main Score Card */}
                        <div className="glass-card p-6 rounded-3xl border border-skate-neon/30 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <Zap className="w-24 h-24 text-skate-neon" />
                            </div>
                            
                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-skate-neon text-[10px] font-bold uppercase tracking-[0.2em] block">
                                        AI RESULT
                                    </span>
                                    {result.isLanded ? (
                                        <span className="bg-green-500/20 text-green-400 text-xs font-bold px-2 py-1 rounded-lg border border-green-500/30">LANDED</span>
                                    ) : (
                                        <span className="bg-red-500/20 text-red-400 text-xs font-bold px-2 py-1 rounded-lg border border-red-500/30">MISSED</span>
                                    )}
                                </div>
                                <h3 className="text-4xl font-display font-bold text-white mb-4">{result.trickName}</h3>
                                
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-white/5 px-4 py-3 rounded-xl border border-white/5">
                                        <span className="block text-[10px] text-gray-500 uppercase font-bold mb-1">SCORE</span>
                                        <div className="flex items-baseline">
                                            <span className={`text-3xl font-display font-bold ${result.score > 70 ? 'text-skate-neon' : 'text-white'}`}>
                                                {result.score}
                                            </span>
                                            <span className="text-gray-500 text-sm">/100</span>
                                        </div>
                                    </div>
                                    <div className="bg-white/5 px-4 py-3 rounded-xl border border-white/5">
                                        <span className="block text-[10px] text-gray-500 uppercase font-bold mb-1">HEIGHT</span>
                                        <div className="flex items-baseline">
                                            <span className="text-3xl font-display font-bold text-white">
                                                {Math.round(result.heightMeters * 100)}
                                            </span>
                                            <span className="text-gray-500 text-sm">cm</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* AI Feedback Section */}
                        <div className="bg-gradient-to-br from-skate-neon/10 to-transparent p-5 rounded-2xl border border-skate-neon/20">
                            <h4 className="text-skate-neon text-[10px] font-bold uppercase tracking-widest mb-3 flex items-center">
                                <Zap className="w-3 h-3 mr-1 fill-skate-neon" />
                                COACH FEEDBACK
                            </h4>
                            <p className="text-white text-sm font-medium leading-relaxed mb-4">
                                {result.feedbackText || "No feedback generated."}
                            </p>
                            
                            {result.improvementTip && (
                                <div className="bg-black/40 p-3 rounded-xl border border-white/5">
                                    <p className="text-xs text-gray-300">
                                        <strong className="text-skate-neon block mb-1">NEXT STEPS:</strong>
                                        {result.improvementTip}
                                    </p>
                                </div>
                            )}
                        </div>

                        {!user && (
                            <div className="text-center p-4">
                                <p className="text-xs text-gray-500">Sign in to save this analysis to your history.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        )}
    </div>
  );
};

export default AIVision;
