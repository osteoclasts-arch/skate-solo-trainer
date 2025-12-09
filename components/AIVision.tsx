import React, { useState, useRef } from 'react';
import { Language, User, VisionAnalysis, TrackingDataPoint } from '../types';
import { TRANSLATIONS } from '../constants';
import { Upload, Zap, X, Eye, Info, BrainCircuit, Activity } from 'lucide-react';
import { analyzeMedia } from '../services/geminiService';
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
  const [analysisResult, setAnalysisResult] = useState<VisionAnalysis | null>(null);
  const [status, setStatus] = useState<string>("");
  const [trickNameHint, setTrickNameHint] = useState("");
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Placeholder for future tracking data from your LSTM model
  const trackingHistory = useRef<TrackingDataPoint[]>([]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const selectedFile = event.target.files[0];
      
      if (selectedFile.size > 50 * 1024 * 1024) {
          alert(t.FILE_TOO_LARGE);
          return;
      }

      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      setAnalysisResult(null);
      trackingHistory.current = [];
    }
  };

  const processVideo = async () => {
    if (!file) return;
    setIsAnalyzing(true);
    setStatus(t.ANALYZING_WITH_GEMINI);
            
    try {
        const userContext = user ? await dbService.getUserFeedbacks(user.uid) : [];
        
        // Passing empty tracking data since YOLO is removed. 
        // Gemini will rely purely on visual analysis of the video frames.
        const result = await analyzeMedia(
            file, 
            language, 
            userContext,
            trickNameHint || undefined,
            undefined,
            undefined,
            [] 
        );

        if (result) {
            setAnalysisResult(result);
            if (user) {
                await dbService.saveAnalysisResult(user.uid, result);
            }
        } else {
            alert("Analysis failed. Please try a different video.");
        }
    } catch (error) {
        console.error("Analysis Error:", error);
        alert("An error occurred during analysis.");
    } finally {
        setIsAnalyzing(false);
        setStatus("");
    }
  };

  const handleFeedbackSubmit = async (feedbackData: any) => {
      await dbService.saveVisionFeedback(user?.uid || null, {
          ...feedbackData,
          originalTrickName: analysisResult?.trickName
      });
      setShowFeedbackModal(false);
      alert(t.FEEDBACK_THANKS);
  };

  return (
    <div className="flex flex-col h-full p-6 pb-32 overflow-y-auto animate-fade-in relative">
      
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
            <Eye className="text-skate-neon w-8 h-8" />
            <h2 className="text-4xl font-display font-bold uppercase tracking-wide text-white">{t.AI_VISION_TITLE}</h2>
        </div>
        <div className="flex items-center space-x-2 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">Gemini Vision Active</span>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="space-y-6">
        
        {/* Upload Card */}
        {!previewUrl && (
            <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-white/20 rounded-3xl p-10 flex flex-col items-center justify-center text-center space-y-4 hover:bg-white/5 transition-colors cursor-pointer min-h-[300px] group"
            >
                <div className="w-20 h-20 bg-skate-neon/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Upload className="w-10 h-10 text-skate-neon" />
                </div>
                <div>
                    <h3 className="text-2xl font-display font-bold text-white mb-2">{t.UPLOAD_MEDIA}</h3>
                    <p className="text-gray-400 text-sm max-w-xs mx-auto">{t.AI_VISION_DESC}</p>
                </div>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    accept="video/*" 
                    className="hidden" 
                />
            </div>
        )}

        {/* Video Preview & Analysis Overlay */}
        {previewUrl && (
            <div className="relative rounded-3xl overflow-hidden bg-black shadow-2xl border border-white/10 group">
                <video 
                    ref={videoRef}
                    src={previewUrl} 
                    className="w-full h-auto max-h-[60vh] object-contain"
                    controls={!isAnalyzing}
                    playsInline
                    loop
                    muted
                    crossOrigin="anonymous"
                />
                
                {/* Analysis Loading Overlay */}
                {isAnalyzing && (
                    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md transition-all duration-500">
                        <div className="flex items-center gap-6 mb-8 scale-110">
                            {/* Gemini Engine */}
                            <div className="flex flex-col items-center gap-2 group">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-skate-neon/30 blur-xl rounded-full animate-pulse delay-75"></div>
                                    <div className="w-16 h-16 bg-black border border-skate-neon/50 rounded-2xl flex items-center justify-center shadow-[0_0_15px_rgba(227,255,55,0.5)]">
                                        <BrainCircuit className="w-8 h-8 text-skate-neon animate-pulse" />
                                    </div>
                                </div>
                                <span className="text-[10px] font-bold text-skate-neon font-mono tracking-widest uppercase">Gemini 3 Pro</span>
                            </div>
                        </div>

                        {/* Status Text */}
                        <div className="text-center space-y-2">
                            <h3 className="text-2xl font-display font-bold text-white tracking-widest animate-pulse">
                                ANALYZING...
                            </h3>
                            <p className="text-gray-400 text-xs font-mono uppercase tracking-wider">
                                {status}
                            </p>
                        </div>
                    </div>
                )}

                {/* Reset Button */}
                {!isAnalyzing && (
                    <button 
                        onClick={() => {
                            setFile(null);
                            setPreviewUrl(null);
                            setAnalysisResult(null);
                            setTrickNameHint("");
                        }}
                        className="absolute top-4 right-4 p-2 bg-black/50 backdrop-blur rounded-full text-white hover:bg-white/20 transition-colors z-40"
                    >
                        <X className="w-6 h-6" />
                    </button>
                )}
            </div>
        )}

        {/* Trick Name Hint Input */}
        {previewUrl && !analysisResult && !isAnalyzing && (
            <div className="space-y-4 animate-fade-in">
                <div className="glass-card p-4 rounded-2xl flex items-center space-x-3">
                    <Info className="w-5 h-5 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder={t.ENTER_TRICK_NAME}
                        value={trickNameHint}
                        onChange={(e) => setTrickNameHint(e.target.value)}
                        className="bg-transparent border-none outline-none text-white placeholder-gray-600 flex-1 text-sm font-medium"
                    />
                </div>
                <button
                    onClick={processVideo}
                    className="w-full py-5 bg-skate-neon hover:bg-skate-neonHover text-black font-display text-3xl font-bold uppercase rounded-[2rem] shadow-[0_0_20px_rgba(204,255,0,0.3)] transform active:scale-95 transition-all flex items-center justify-center space-x-3"
                >
                    <Zap className="w-6 h-6 fill-black" />
                    <span>{t.ANALYZE_TRICK}</span>
                </button>
            </div>
        )}

        {/* RESULTS SECTION */}
        {analysisResult && (
            <div className="space-y-6 animate-slide-up pb-10">
                {/* Main Score Card */}
                <div className="glass-card p-6 rounded-3xl border border-skate-neon/20 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-skate-neon/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                    
                    <div className="flex justify-between items-start mb-4 relative z-10">
                        <div>
                            <span className="text-[10px] font-bold text-skate-neon uppercase tracking-widest mb-1 block">{t.TRICK_DETECTED}</span>
                            <h2 className="text-4xl font-display font-bold text-white leading-none">{analysisResult.trickName}</h2>
                        </div>
                        <div className={`px-4 py-2 rounded-xl border ${analysisResult.isLanded ? 'bg-skate-neon/10 border-skate-neon text-skate-neon' : 'bg-red-500/10 border-red-500 text-red-500'}`}>
                            <span className="font-bold uppercase tracking-wider text-sm">
                                {analysisResult.isLanded ? 'LANDED' : 'MISSED'}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-6 relative z-10">
                        <div className="bg-black/40 rounded-2xl p-4">
                            <span className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">{t.FORM_SCORE}</span>
                            <div className="flex items-baseline mt-1">
                                <span className="text-3xl font-display font-bold text-white">{analysisResult.score}</span>
                                <span className="text-sm text-gray-500 ml-1">/100</span>
                            </div>
                        </div>
                        <div className="bg-black/40 rounded-2xl p-4">
                            <span className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">{t.HEIGHT_EST}</span>
                            <div className="flex items-baseline mt-1">
                                <span className="text-3xl font-display font-bold text-white">{analysisResult.heightMeters}</span>
                                <span className="text-sm text-gray-500 ml-1">m</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* AI Analysis Text */}
                <div className="space-y-4">
                    <div className="glass-card p-6 rounded-3xl border border-white/5">
                        <div className="flex items-center space-x-2 mb-3">
                            <Activity className="w-5 h-5 text-blue-400" />
                            <h3 className="text-sm font-bold text-gray-300 uppercase tracking-widest">{t.POSTURE_ANALYSIS}</h3>
                        </div>
                        <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                            {analysisResult.feedbackText}
                        </p>
                    </div>

                    <div className="glass-card p-6 rounded-3xl border border-skate-neon/20 bg-skate-neon/5">
                        <div className="flex items-center space-x-2 mb-3">
                            <Zap className="w-5 h-5 text-skate-neon" />
                            <h3 className="text-sm font-bold text-skate-neon uppercase tracking-widest">{t.IMPROVEMENT_TIP}</h3>
                        </div>
                        <p className="text-white text-lg font-display font-bold leading-tight">
                            "{analysisResult.improvementTip}"
                        </p>
                    </div>
                </div>

                {/* Feedback Loop */}
                <button 
                    onClick={() => setShowFeedbackModal(true)}
                    className="w-full py-4 text-gray-500 text-xs font-bold uppercase tracking-widest hover:text-white transition-colors"
                >
                    {t.WRONG_ANALYSIS}
                </button>
            </div>
        )}
      </div>

      {/* Feedback Modal */}
      {showFeedbackModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-6 animate-fade-in">
              <div className="glass-card p-6 rounded-3xl w-full max-w-sm">
                  <h3 className="text-xl font-display font-bold text-white mb-2">{t.WRONG_ANALYSIS}</h3>
                  <p className="text-gray-400 text-xs mb-4">{t.PROVIDE_FEEDBACK}</p>
                  
                  <input 
                    type="text" 
                    placeholder={t.ACTUAL_TRICK_NAME}
                    id="actualTrick"
                    className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white text-sm mb-4"
                  />
                  
                  <div className="flex gap-3">
                      <button 
                        onClick={() => setShowFeedbackModal(false)}
                        className="flex-1 py-3 bg-gray-800 rounded-xl font-bold text-gray-400"
                      >
                          {t.CANCEL}
                      </button>
                      <button 
                        onClick={() => {
                            const input = document.getElementById('actualTrick') as HTMLInputElement;
                            handleFeedbackSubmit({ actualTrickName: input.value });
                        }}
                        className="flex-1 py-3 bg-skate-neon text-black rounded-xl font-bold"
                      >
                          {t.SEND_FEEDBACK}
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default AIVision;