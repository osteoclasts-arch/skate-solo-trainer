import React, { useState, useRef, useEffect } from 'react';
import { Language, User, VisionAnalysis } from '../types';
import { TRANSLATIONS } from '../constants';
import { Upload, Zap, X, Eye, Info, Activity, Rotate3d, Compass, Scissors, Play, Pause, HelpCircle, BrainCircuit, ChevronLeft, ChevronRight, RotateCcw, AlertCircle, Footprints, Sparkles, CheckCircle } from 'lucide-react';
import { analyzeMedia } from '../services/geminiService';
import { dbService } from '../services/dbService';
// @ts-ignore
import * as mpPose from '@mediapipe/pose';
// @ts-ignore
import * as mpDrawing from '@mediapipe/drawing_utils';

interface PoseFrame {
    time: number;
    landmarks: any[];
    boardCenter: { x: number, y: number } | null;
}

interface Props {
  language: Language;
  user: User | null;
}

const THINKING_STEPS = [
    { text: { EN: "Tracking joints...", KR: "관절 위치 찾는 중..." } },
    { text: { EN: "Calculating board physics...", KR: "보드 회전각 계산 중..." } },
    { text: { EN: "Identifying trick...", KR: "트릭 기술 식별 중..." } },
    { text: { EN: "Analyzing landing...", KR: "착지 안정성 평가 중..." } },
    { text: { EN: "Generating feedback...", KR: "코칭 피드백 작성 중..." } }
];

const AIVision: React.FC<Props> = ({ language, user }) => {
  const t = TRANSLATIONS[language];
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState(0);
  const [isVideoError, setIsVideoError] = useState(false);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isDragging, setIsDragging] = useState<'start' | 'end' | 'playhead' | null>(null);
  const [trickNameHint, setTrickNameHint] = useState("");
  const [stance, setStance] = useState<"Regular" | "Goofy">("Regular");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<VisionAnalysis | null>(null);
  const [extractionProgress, setExtractionProgress] = useState(0);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [thinkingStep, setThinkingStep] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showAlgoInfo, setShowAlgoInfo] = useState(false);
  const analysisTimerRef = useRef<any>(null);
  const [trackingData, setTrackingData] = useState<PoseFrame[]>([]);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [isPlaying, setIsPlaying] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const resultVideoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null); 
  const poseEstimator = useRef<any>(null);
  const requestRef = useRef<number>(0);

  useEffect(() => {
      // @ts-ignore
      const Pose = mpPose.Pose || (mpPose.default?.Pose) || (window as any).Pose;
      if (!Pose) { return; }

      const pose = new Pose({
          locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
      });
      pose.setOptions({
          modelComplexity: 1,
          smoothLandmarks: true,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
      });
      poseEstimator.current = pose;
      return () => { pose.close(); if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, []);

  useEffect(() => {
      if (isAnalyzing) {
          const interval = setInterval(() => {
              setThinkingStep(prev => (prev + 1) % THINKING_STEPS.length);
          }, 2000);
          return () => clearInterval(interval);
      } else {
          setThinkingStep(0);
      }
  }, [isAnalyzing]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const selectedFile = event.target.files[0];
      if (selectedFile.type.includes('avi') || selectedFile.name.toLowerCase().endsWith('.avi')) {
          alert("AVI not supported. Please use MP4/MOV."); return;
      }
      if (selectedFile.size > 200 * 1024 * 1024) { alert(t.FILE_TOO_LARGE); return; }

      setFile(selectedFile);
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
      setAnalysisResult(null);
      setTrackingData([]);
      setPlaybackSpeed(1.0);
      setIsVideoError(false);
      
      const vid = document.createElement('video');
      vid.preload = 'metadata';
      vid.onloadedmetadata = () => {
          setVideoDuration(vid.duration);
          setTrimStart(0);
          setTrimEnd(vid.duration);
      };
      vid.onerror = () => setIsVideoError(true);
      vid.src = url;
    }
  };

  const handleMetadataLoaded = (e: React.SyntheticEvent<HTMLVideoElement>) => {
      const duration = e.currentTarget.duration;
      setVideoDuration(duration);
      if (trimEnd === 0) setTrimEnd(duration);
      setIsVideoError(false);
  };

  const handleVideoError = () => { setIsVideoError(true); alert("Video format error."); };
  
  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
      const vid = e.currentTarget;
      setCurrentTime(vid.currentTime);
      if (!analysisResult && !isDragging) {
          if (vid.currentTime >= trimEnd) { vid.currentTime = trimStart; vid.play(); }
      }
  };

  const handleTimelineInteraction = (clientX: number) => {
      if (!timelineRef.current || videoDuration === 0) return;
      const rect = timelineRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
      const percentage = x / rect.width;
      const newTime = percentage * videoDuration;

      if (isDragging === 'start') {
          const maxStart = Math.max(0, trimEnd - 0.5);
          const val = Math.min(newTime, maxStart);
          setTrimStart(val);
          if (videoRef.current) videoRef.current.currentTime = val;
      } else if (isDragging === 'end') {
          const minEnd = Math.min(videoDuration, trimStart + 0.5);
          const val = Math.max(newTime, minEnd);
          setTrimEnd(val);
          if (videoRef.current) videoRef.current.currentTime = val;
      } else if (isDragging === 'playhead') {
          if (videoRef.current) { videoRef.current.currentTime = newTime; setCurrentTime(newTime); }
      }
  };

  useEffect(() => {
      const handleMove = (e: MouseEvent | TouchEvent) => {
          if (isDragging) {
              const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
              handleTimelineInteraction(clientX);
          }
      };
      const handleUp = () => setIsDragging(null);
      if (isDragging) {
          window.addEventListener('mousemove', handleMove); window.addEventListener('mouseup', handleUp);
          window.addEventListener('touchmove', handleMove); window.addEventListener('touchend', handleUp);
      }
      return () => {
          window.removeEventListener('mousemove', handleMove); window.removeEventListener('mouseup', handleUp);
          window.removeEventListener('touchmove', handleMove); window.removeEventListener('touchend', handleUp);
      };
  }, [isDragging, videoDuration, trimStart, trimEnd]);

  const extractMotionData = async (): Promise<string> => {
      if (!videoRef.current || !poseEstimator.current) return "";
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return "";
      canvas.width = video.videoWidth; canvas.height = video.videoHeight;

      const fps = 30; const interval = 1 / fps;
      let currentTime = trimStart;
      const recordedFrames: PoseFrame[] = [];
      const csvLines = ["Timestamp,LeftAnkleY,RightAnkleY,BoardAngle,BoardHeight,ShoulderRotation"];

      let frameResolver: ((value: any) => void) | null = null;
      poseEstimator.current.onResults((results: any) => { if (frameResolver) frameResolver(results); });

      try {
        while (currentTime <= trimEnd) {
            video.currentTime = currentTime;
            await new Promise<void>(r => { const onSeek = () => { video.removeEventListener('seeked', onSeek); r(); }; video.addEventListener('seeked', onSeek); });
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            try {
                const results: any = await Promise.race([
                    new Promise(resolve => { frameResolver = resolve; poseEstimator.current.send({image: canvas}); }),
                    new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 3000))
                ]);
                let landmarks = null, boardCenter = null;
                let laY = 0, raY = 0, bH = 0, bA = 0, sR = 0;
                if (results && results.poseLandmarks) {
                    landmarks = results.poseLandmarks;
                    const la = landmarks[28], ra = landmarks[27];
                    if (la && ra) {
                        laY = la.y; raY = ra.y;
                        boardCenter = { x: (la.x + ra.x) / 2, y: (la.y + ra.y) / 2 + 0.02 };
                        bH = 1 - boardCenter.y;
                        bA = Math.atan2(ra.y - la.y, ra.x - la.x) * (180 / Math.PI);
                        const ls = landmarks[11], rs = landmarks[12];
                        if (ls && rs) sR = Math.atan2(rs.y - ls.y, rs.x - ls.x) * (180 / Math.PI);
                    }
                }
                recordedFrames.push({ time: currentTime, landmarks: landmarks, boardCenter: boardCenter });
                csvLines.push(`${currentTime.toFixed(2)},${laY.toFixed(3)},${raY.toFixed(3)},${bA.toFixed(1)},${bH.toFixed(3)},${sR.toFixed(1)}`);
            } catch (e) { console.warn("Frame skip", e); }
            currentTime += interval;
            setExtractionProgress(Math.min(100, Math.round(((currentTime - trimStart) / (trimEnd - trimStart)) * 100)));
        }
        setTrackingData(recordedFrames);
        return csvLines.join("\n");
      } catch (e) { return ""; }
  };

  const processVideo = async () => {
    if (!file) return;
    setIsAnalyzing(true);
    setExtractionProgress(0); setElapsedTime(0);
    const startTime = Date.now();
    if (analysisTimerRef.current) clearInterval(analysisTimerRef.current);
    analysisTimerRef.current = setInterval(() => { setElapsedTime((Date.now() - startTime) / 1000); }, 100);
            
    try {
        if (videoRef.current && videoRef.current.readyState >= 1) {
             let csvData = "";
             try { csvData = await extractMotionData(); } catch (e) { console.warn("CSV Fail", e); }
             const userContext = user ? await dbService.getUserFeedbacks(user.uid) : [];
             const result = await analyzeMedia(file, language, userContext, trickNameHint || undefined, trimStart, trimEnd, undefined, csvData, stance);
             if (result) { setAnalysisResult(result); if (user) await dbService.saveAnalysisResult(user.uid, result); } 
             else { alert("Analysis failed."); }
        } else { alert("Video not ready."); }
    } catch (error) { alert("Error occurred."); } 
    finally { if (analysisTimerRef.current) clearInterval(analysisTimerRef.current); setIsAnalyzing(false); setExtractionProgress(0); }
  };

  const drawResultFrame = () => {
      const video = resultVideoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || trackingData.length === 0) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      if (video.currentTime >= trimEnd) video.currentTime = trimStart;
      if (video.currentTime < trimStart) video.currentTime = trimStart;
      const currentFrameData = trackingData.reduce((prev, curr) => Math.abs(curr.time - video.currentTime) < Math.abs(prev.time - video.currentTime) ? curr : prev);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (currentFrameData.landmarks) {
           // @ts-ignore
           if (mpDrawing && mpDrawing.drawConnectors && mpDrawing.drawLandmarks) {
               // @ts-ignore
               mpDrawing.drawConnectors(ctx, currentFrameData.landmarks, mpPose.POSE_CONNECTIONS, {color: 'rgba(255, 229, 0, 0.8)', lineWidth: 3});
               // @ts-ignore
               mpDrawing.drawLandmarks(ctx, currentFrameData.landmarks, {color: '#ffffff', lineWidth: 1, radius: 4});
           }
      }
      requestRef.current = requestAnimationFrame(drawResultFrame);
  };

  useEffect(() => {
      if (analysisResult && isPlaying) { requestRef.current = requestAnimationFrame(drawResultFrame); } 
      else { if (requestRef.current) cancelAnimationFrame(requestRef.current); }
      return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, [analysisResult, isPlaying, trackingData]);

  const togglePlay = () => { if (resultVideoRef.current) { if (isPlaying) resultVideoRef.current.pause(); else resultVideoRef.current.play(); setIsPlaying(!isPlaying); } };
  const changeSpeed = (speed: number) => { setPlaybackSpeed(speed); if (resultVideoRef.current) resultVideoRef.current.playbackRate = speed; };
  const togglePreviewPlay = () => { if (!videoRef.current) return; if (videoRef.current.paused) { if (videoRef.current.currentTime >= trimEnd) videoRef.current.currentTime = trimStart; videoRef.current.play(); } else videoRef.current.pause(); };

  return (
    <div className="flex flex-col h-full p-6 pb-32 overflow-y-auto animate-fade-in relative bg-skate-bg dark:bg-zinc-950 font-sans transition-colors duration-300">
      
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6 mt-2">
        <div className="flex items-center space-x-3">
            <Eye className="text-skate-black dark:text-white w-8 h-8" />
            <h2 className="text-3xl font-black text-skate-black dark:text-white leading-none tracking-tighter">{t.AI_VISION_TITLE}</h2>
        </div>
        <button 
            onClick={() => setShowAlgoInfo(true)}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-full bg-white dark:bg-zinc-900 shadow-sm border border-gray-100 dark:border-zinc-800 text-gray-500 hover:text-skate-black dark:hover:text-white transition-colors"
        >
            <HelpCircle className="w-4 h-4" />
        </button>
      </div>

      {/* INFO BANNER */}
      {!analysisResult && !isAnalyzing && (
          <div className="bg-white dark:bg-zinc-900 p-4 rounded-3xl mb-6 flex items-start space-x-3 border border-gray-100 dark:border-zinc-800 shadow-sm">
              <Info className="w-5 h-5 text-skate-deep dark:text-skate-yellow shrink-0 mt-0.5" />
              <p className="text-xs text-skate-deep dark:text-white leading-relaxed font-bold">
                  {language === 'KR' 
                    ? "팁: 슬로우 모션으로 45도 각도에서 촬영하면 분석이 훨씬 정확해집니다." 
                    : "Tip: Use Slow Motion and film from a 45° angle for best results."}
              </p>
          </div>
      )}

      {/* UPLOAD & CONTROLS */}
      <div className="space-y-6">
        {!previewUrl && (
            <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-200 dark:border-zinc-800 rounded-[2.5rem] p-10 flex flex-col items-center justify-center text-center space-y-4 hover:bg-white dark:hover:bg-zinc-900 hover:border-skate-yellow hover:shadow-lg transition-all cursor-pointer min-h-[350px] group bg-white/50 dark:bg-zinc-900/50"
            >
                <div className="w-24 h-24 bg-skate-yellow rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-500 shadow-pop">
                    <Upload className="w-10 h-10 text-skate-black" />
                </div>
                <div>
                    <h3 className="text-2xl font-black text-skate-black dark:text-white mb-2 tracking-tight">{t.UPLOAD_MEDIA}</h3>
                    <p className="text-gray-400 text-sm max-w-xs mx-auto font-medium">{t.AI_VISION_DESC}</p>
                </div>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="video/*,video/mp4,video/quicktime" className="hidden" />
            </div>
        )}

        {previewUrl && !analysisResult && (
            <div className="space-y-6 animate-fade-in">
                <div className="relative rounded-[2rem] overflow-hidden bg-black shadow-pop border border-gray-100 dark:border-zinc-800 group aspect-[9/16] md:aspect-video max-h-[60vh] mx-auto">
                    <video 
                        ref={videoRef} src={previewUrl} className="w-full h-full object-contain" playsInline onLoadedMetadata={handleMetadataLoaded} onTimeUpdate={handleTimeUpdate} onError={handleVideoError}
                    />
                     <button 
                        onClick={() => { setFile(null); setPreviewUrl(null); }}
                        className="absolute top-4 right-4 p-2 bg-white/80 backdrop-blur rounded-full text-skate-black hover:bg-white transition-colors z-40 shadow-sm"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                         <div className="bg-white/30 rounded-full p-6 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
                            {videoRef.current?.paused ? <Play className="fill-white text-white w-8 h-8" /> : <Pause className="fill-white text-white w-8 h-8" />}
                         </div>
                    </div>
                    <button onClick={togglePreviewPlay} className="absolute inset-0 w-full h-full cursor-pointer z-10 opacity-0"></button>
                </div>

                {/* Timeline */}
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] shadow-pop border border-gray-50 dark:border-zinc-800 space-y-4">
                    <div className="flex items-center justify-between text-gray-400 px-1">
                        <span className="text-xs font-bold uppercase tracking-widest">{t.TRIM_RANGE}</span>
                        <span className="text-xs font-mono font-black text-skate-black bg-skate-yellow px-2 py-1 rounded-md">
                            {(trimEnd - trimStart).toFixed(1)}s
                        </span>
                    </div>

                    <div 
                        ref={timelineRef}
                        className="relative h-12 bg-gray-100 dark:bg-zinc-800 rounded-xl w-full select-none touch-none overflow-hidden cursor-pointer group"
                        onMouseDown={(e) => {
                             const rect = e.currentTarget.getBoundingClientRect();
                             const x = e.clientX - rect.left;
                             const time = (x / rect.width) * videoDuration;
                             if (videoRef.current) { videoRef.current.currentTime = time; setCurrentTime(time); }
                             setIsDragging('playhead');
                        }}
                        onTouchStart={(e) => {
                             const rect = e.currentTarget.getBoundingClientRect();
                             const x = e.touches[0].clientX - rect.left;
                             const time = (x / rect.width) * videoDuration;
                             setIsDragging('playhead');
                             if(time < trimStart || time > trimEnd) if(videoRef.current) videoRef.current.currentTime = time;
                        }}
                    >
                        <div className="absolute left-0 top-0 bottom-0 bg-gray-300/50 dark:bg-black/50 pointer-events-none z-10" style={{ width: `${(trimStart / videoDuration) * 100}%` }} />
                        <div className="absolute right-0 top-0 bottom-0 bg-gray-300/50 dark:bg-black/50 pointer-events-none z-10" style={{ width: `${100 - (trimEnd / videoDuration) * 100}%` }} />
                        <div className="absolute top-0 bottom-0 border-y-4 border-skate-yellow z-20 pointer-events-none" style={{ left: `${(trimStart / videoDuration) * 100}%`, right: `${100 - (trimEnd / videoDuration) * 100}%` }}>
                            <div className="absolute left-0 top-0 bottom-0 w-6 bg-skate-yellow flex items-center justify-center cursor-ew-resize pointer-events-auto -translate-x-1/2 rounded-l-md shadow-sm" onMouseDown={(e) => { e.stopPropagation(); setIsDragging('start'); }} onTouchStart={(e) => { e.stopPropagation(); setIsDragging('start'); }}>
                                <ChevronLeft className="w-4 h-4 text-skate-black" />
                            </div>
                            <div className="absolute right-0 top-0 bottom-0 w-6 bg-skate-yellow flex items-center justify-center cursor-ew-resize pointer-events-auto translate-x-1/2 rounded-r-md shadow-sm" onMouseDown={(e) => { e.stopPropagation(); setIsDragging('end'); }} onTouchStart={(e) => { e.stopPropagation(); setIsDragging('end'); }}>
                                <ChevronRight className="w-4 h-4 text-skate-black" />
                            </div>
                        </div>
                        <div className="absolute top-0 bottom-0 w-0.5 bg-skate-black dark:bg-white z-30 pointer-events-none" style={{ left: `${(currentTime / videoDuration) * 100}%` }}>
                            <div className="absolute -top-1 -translate-x-1/2 w-3 h-3 bg-skate-black dark:bg-white rounded-full shadow-md"></div>
                        </div>
                    </div>
                    
                    <div className="flex justify-center">
                        <button onClick={() => { setTrimStart(0); setTrimEnd(videoDuration); }} className="text-[10px] font-bold text-gray-400 hover:text-skate-black dark:hover:text-white flex items-center bg-gray-50 dark:bg-zinc-800 px-3 py-1.5 rounded-full transition-colors">
                             <RotateCcw className="w-3 h-3 mr-1" /> RESET
                        </button>
                    </div>
                </div>

                {/* Loading UI */}
                {isAnalyzing && (
                    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl transition-all animate-fade-in">
                        <div className="relative mb-8">
                            <div className="w-32 h-32 rounded-full bg-skate-yellow blur-xl animate-pulse absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
                            <div className="w-24 h-24 rounded-full bg-black flex items-center justify-center relative z-10 animate-bounce">
                                <Sparkles className="w-10 h-10 text-skate-yellow animate-spin-slow" />
                            </div>
                        </div>
                        <h3 className="text-3xl font-black text-skate-black dark:text-white mb-2 tracking-tight">AI ANALYSIS</h3>
                        <p key={thinkingStep} className="text-skate-black font-bold text-sm uppercase tracking-widest animate-slide-up bg-skate-yellow px-4 py-2 rounded-full">
                            {/* @ts-ignore */}
                            {THINKING_STEPS[thinkingStep].text[language]}
                        </p>
                    </div>
                )}

                {/* Analysis Config */}
                {!isAnalyzing && (
                    <div className="space-y-4">
                        <div className="bg-white dark:bg-zinc-900 p-5 rounded-[2rem] shadow-pop flex items-center justify-between border border-gray-50 dark:border-zinc-800">
                             <div className="flex items-center space-x-2 text-gray-400">
                                <Footprints className="w-5 h-5" />
                                <span className="text-xs font-bold uppercase tracking-widest">{t.SELECT_YOUR_STANCE || "STANCE"}</span>
                             </div>
                             <div className="flex space-x-2 bg-gray-100 dark:bg-zinc-800 rounded-xl p-1">
                                <button onClick={() => setStance('Regular')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${stance === 'Regular' ? 'bg-skate-black text-white shadow-sm' : 'text-gray-400 dark:text-gray-500'}`}>REGULAR</button>
                                <button onClick={() => setStance('Goofy')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${stance === 'Goofy' ? 'bg-skate-black text-white shadow-sm' : 'text-gray-400 dark:text-gray-500'}`}>GOOFY</button>
                             </div>
                        </div>

                        <div className="bg-white dark:bg-zinc-900 p-5 rounded-[2rem] flex items-center space-x-3 shadow-pop border border-gray-50 dark:border-zinc-800">
                            <Info className="w-5 h-5 text-gray-300" />
                            <input type="text" placeholder={t.ENTER_TRICK_NAME} value={trickNameHint} onChange={(e) => setTrickNameHint(e.target.value)} className="bg-transparent border-none outline-none text-skate-black dark:text-white placeholder-gray-400 flex-1 text-sm font-bold" />
                        </div>
                        
                        <button
                            onClick={processVideo}
                            disabled={isVideoError}
                            className={`w-full py-5 bg-skate-black dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-skate-yellow dark:text-black text-xl font-black uppercase rounded-[2rem] shadow-lg transform active:scale-[0.98] transition-all flex items-center justify-center space-x-3 ${isVideoError ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <Zap className="w-6 h-6 fill-skate-yellow dark:fill-black" />
                            <span>{t.ANALYZE_TRICK}</span>
                        </button>
                    </div>
                )}
            </div>
        )}

        {/* RESULTS */}
        {analysisResult && (
            <div className="space-y-6 animate-slide-up pb-10">
                <div className="relative rounded-[2rem] overflow-hidden bg-black border border-gray-100 dark:border-zinc-800 shadow-pop mx-auto">
                    <video ref={resultVideoRef} src={previewUrl!} className="w-full h-auto max-h-[60vh] object-contain opacity-90" playsInline muted loop onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} />
                    <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" width={resultVideoRef.current?.videoWidth} height={resultVideoRef.current?.videoHeight} />
                    <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between bg-white/90 backdrop-blur-md rounded-2xl p-3 shadow-lg">
                        <button onClick={togglePlay} className="p-3 bg-skate-black text-white rounded-full hover:bg-gray-800 transition-colors">
                            {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
                        </button>
                        <div className="flex items-center space-x-2">
                             {[0.25, 0.5, 1.0].map(speed => (
                                 <button key={speed} onClick={() => changeSpeed(speed)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${playbackSpeed === speed ? 'bg-skate-yellow text-skate-black' : 'bg-gray-100 text-gray-500'}`}>{speed}x</button>
                             ))}
                        </div>
                    </div>
                </div>

                {/* Score Card */}
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2.5rem] shadow-pop border border-gray-50 dark:border-zinc-800 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-skate-yellow rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-50"></div>
                    <div className="flex justify-between items-start mb-6 relative z-10">
                        <div>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">{t.TRICK_DETECTED}</span>
                            <h2 className="text-3xl font-black text-skate-black dark:text-white leading-none">{analysisResult.trickName}</h2>
                        </div>
                        <div className={`px-4 py-2 rounded-full ${analysisResult.isLanded ? 'bg-skate-black text-skate-yellow' : 'bg-gray-100 dark:bg-zinc-800 text-gray-500'}`}>
                            <span className="font-black uppercase tracking-wider text-sm flex items-center gap-1">
                                {analysisResult.isLanded ? <CheckCircle className="w-4 h-4" /> : <X className="w-4 h-4" />}
                                {analysisResult.isLanded ? 'LANDED' : 'MISSED'}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 relative z-10">
                        <div className="bg-gray-50 dark:bg-zinc-800 rounded-[1.5rem] p-5">
                            <span className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">{t.FORM_SCORE}</span>
                            <div className="flex items-baseline mt-2">
                                <span className="text-4xl font-black text-skate-black dark:text-white">{analysisResult.score}</span>
                                <span className="text-sm text-gray-400 font-bold ml-1">/100</span>
                            </div>
                        </div>
                        <div className="bg-gray-50 dark:bg-zinc-800 rounded-[1.5rem] p-5">
                            <span className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">{t.HEIGHT_EST}</span>
                            <div className="flex items-baseline mt-2">
                                <span className="text-4xl font-black text-skate-black dark:text-white">{analysisResult.heightMeters}</span>
                                <span className="text-sm text-gray-400 font-bold ml-1">m</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Feedback */}
                <div className="space-y-4">
                    {analysisResult.boardPhysics && (
                         <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2.5rem] border border-gray-50 dark:border-zinc-800 shadow-pop">
                             <div className="flex items-center space-x-2 mb-3">
                                 <Rotate3d className="w-5 h-5 text-skate-deep dark:text-skate-yellow" />
                                 <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">{t.PHYSICS_ANALYSIS}</h3>
                             </div>
                             <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed italic border-l-4 border-skate-deep dark:border-skate-yellow pl-3 font-medium">"{analysisResult.boardPhysics.description}"</p>
                        </div>
                    )}
                    
                    <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2.5rem] shadow-pop border-2 border-skate-black dark:border-zinc-700">
                        <div className="flex items-center space-x-2 mb-3">
                            <Activity className="w-5 h-5 text-skate-black dark:text-white" />
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">{t.POSTURE_ANALYSIS}</h3>
                        </div>
                        <p className="text-skate-black dark:text-white text-sm leading-relaxed whitespace-pre-wrap font-medium">{analysisResult.feedbackText}</p>
                    </div>

                    <div className="bg-skate-yellow p-6 rounded-[2.5rem] shadow-lg">
                        <div className="flex items-center space-x-2 mb-3">
                            <Zap className="w-5 h-5 text-skate-black fill-skate-black" />
                            <h3 className="text-sm font-bold text-skate-black/50 uppercase tracking-widest">{t.IMPROVEMENT_TIP}</h3>
                        </div>
                        <p className="text-skate-black text-lg font-black leading-tight">"{analysisResult.improvementTip}"</p>
                    </div>
                </div>

                <button onClick={() => { setAnalysisResult(null); setTrackingData([]); }} className="w-full py-5 bg-white dark:bg-zinc-900 text-skate-black dark:text-white rounded-[2rem] font-bold text-lg uppercase tracking-wide hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors shadow-lg border border-gray-100 dark:border-zinc-800">
                    ANALYZE NEW VIDEO
                </button>
            </div>
        )}
      </div>

      {/* ALGO MODAL */}
      {showAlgoInfo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-6 animate-fade-in">
              <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] w-full max-w-sm relative shadow-2xl dark:border dark:border-zinc-800">
                  <button onClick={() => setShowAlgoInfo(false)} className="absolute top-6 right-6 p-2 bg-gray-100 dark:bg-zinc-800 rounded-full hover:bg-gray-200 dark:hover:bg-zinc-700"><X className="w-4 h-4 text-skate-black dark:text-white"/></button>
                  <h3 className="text-2xl font-black text-skate-black dark:text-white mb-6">AI Algorithm</h3>
                  <div className="space-y-6">
                      <div className="pl-4 border-l-2 border-skate-yellow"><h4 className="text-skate-black dark:text-white font-black text-xs uppercase mb-1">Step 1. Tracking</h4><p className="text-gray-500 text-sm font-medium">MediaPipe tracks joints & board physics (0.03s).</p></div>
                      <div className="pl-4 border-l-2 border-skate-deep dark:border-white"><h4 className="text-skate-deep dark:text-white font-black text-xs uppercase mb-1">Step 2. Analysis</h4><p className="text-gray-500 text-sm font-medium">Gemini 2.5 Flash analyzes visual style & data.</p></div>
                      <div className="pl-4 border-l-2 border-gray-300 dark:border-zinc-700"><h4 className="text-gray-400 font-black text-xs uppercase mb-1">Step 3. Result</h4><p className="text-gray-500 text-sm font-medium">Cross-validates for accurate scoring.</p></div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default AIVision;