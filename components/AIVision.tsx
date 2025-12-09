import React, { useState, useRef, useEffect } from 'react';
import { Language, User, VisionAnalysis } from '../types';
import { TRANSLATIONS } from '../constants';
import { Upload, Zap, X, Eye, Info, BrainCircuit, Activity, Rotate3d, Compass, Scan, CheckCircle2, Scissors, Play, Pause, FastForward, Rewind } from 'lucide-react';
import { analyzeMedia } from '../services/geminiService';
import { dbService } from '../services/dbService';
// @ts-ignore
import * as mpPose from '@mediapipe/pose';
// @ts-ignore
import * as mpDrawing from '@mediapipe/drawing_utils';

// Types for Visualization
interface PoseFrame {
    time: number;
    landmarks: any[]; // MediaPipe landmarks
    boardCenter: { x: number, y: number } | null;
}

interface Props {
  language: Language;
  user: User | null;
}

const AIVision: React.FC<Props> = ({ language, user }) => {
  const t = TRANSLATIONS[language];
  
  // State
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState(0);
  
  // Trimming State
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  
  // Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<VisionAnalysis | null>(null);
  const [status, setStatus] = useState<string>("");
  const [trickNameHint, setTrickNameHint] = useState("");
  const [extractionProgress, setExtractionProgress] = useState(0);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  // Result Playback State
  const [trackingData, setTrackingData] = useState<PoseFrame[]>([]);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const resultVideoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null); 
  const poseEstimator = useRef<any>(null);
  const requestRef = useRef<number>(0);

  // Initialize MediaPipe Pose
  useEffect(() => {
      // @ts-ignore
      const Pose = mpPose.Pose || (mpPose.default?.Pose) || (window as any).Pose;

      if (!Pose) {
        console.error("MediaPipe Pose class could not be found.");
        return;
      }

      const pose = new Pose({
          locateFile: (file: string) => {
              return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
          }
      });
      pose.setOptions({
          modelComplexity: 1,
          smoothLandmarks: true,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
      });
      
      poseEstimator.current = pose;
      
      return () => {
          pose.close();
          if (requestRef.current) {
            cancelAnimationFrame(requestRef.current);
          }
      };
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const selectedFile = event.target.files[0];
      
      if (selectedFile.size > 100 * 1024 * 1024) { // Increased limit slightly
          alert(t.FILE_TOO_LARGE);
          return;
      }

      setFile(selectedFile);
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
      setAnalysisResult(null);
      setTrackingData([]);
      setPlaybackSpeed(1.0);
      
      // Reset trim when new file loads
      const vid = document.createElement('video');
      vid.preload = 'metadata';
      vid.onloadedmetadata = () => {
          setVideoDuration(vid.duration);
          setTrimStart(0);
          setTrimEnd(vid.duration);
      };
      vid.src = url;
    }
  };

  const handleMetadataLoaded = (e: React.SyntheticEvent<HTMLVideoElement>) => {
      const duration = e.currentTarget.duration;
      setVideoDuration(duration);
      if (trimEnd === 0) setTrimEnd(duration);
  };

  // --- EXTRACTION & TRACKING LOGIC ---
  const extractMotionData = async (): Promise<string> => {
      if (!videoRef.current || !poseEstimator.current) return "";
      
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return "";

      setStatus("Tracking Skater & Board...");
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const fps = 30; 
      const interval = 1 / fps;
      let currentTime = trimStart;
      const recordedFrames: PoseFrame[] = [];
      const csvLines = ["Timestamp,LeftAnkleY,RightAnkleY,BoardAngle,BoardHeight,ShoulderRotation"];

      // Setup Pose Callback for this extraction session
      let frameResolver: ((value: any) => void) | null = null;
      poseEstimator.current.onResults((results: any) => {
          if (frameResolver) frameResolver(results);
      });

      // Processing Loop
      while (currentTime <= trimEnd) {
          video.currentTime = currentTime;
          
          // Wait for seek to complete
          await new Promise<void>(r => {
              const onSeek = () => { video.removeEventListener('seeked', onSeek); r(); };
              video.addEventListener('seeked', onSeek);
          });

          // Draw video frame to canvas for MediaPipe
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          // Wait for Pose Estimation
          const results: any = await new Promise(resolve => {
              frameResolver = resolve;
              poseEstimator.current.send({image: canvas});
          });

          // Process Results
          let landmarks = null;
          let boardCenter = null;
          let leftAnkleY = 0, rightAnkleY = 0, boardHeight = 0, boardAngle = 0, shoulderRot = 0;

          if (results.poseLandmarks) {
              landmarks = results.poseLandmarks;
              
              // 28: Left Ankle, 27: Right Ankle (MediaPipe Pose)
              const la = landmarks[28];
              const ra = landmarks[27];
              
              if (la && ra) {
                  leftAnkleY = la.y;
                  rightAnkleY = ra.y;
                  
                  // Calculate Board Center (Midpoint of ankles, shifted slightly down)
                  boardCenter = {
                      x: (la.x + ra.x) / 2,
                      y: (la.y + ra.y) / 2 + 0.02 // Offset slightly down to deck level
                  };

                  // Simple Physics Data for CSV
                  boardHeight = 1 - boardCenter.y; // Inverted Y
                  const dx = ra.x - la.x;
                  const dy = ra.y - la.y;
                  boardAngle = Math.atan2(dy, dx) * (180 / Math.PI);
                  
                  // Shoulders: 11 (Left), 12 (Right)
                  const ls = landmarks[11];
                  const rs = landmarks[12];
                  if (ls && rs) {
                      const sdx = rs.x - ls.x;
                      const sdy = rs.y - ls.y;
                      shoulderRot = Math.atan2(sdy, sdx) * (180 / Math.PI);
                  }
              }
          }

          recordedFrames.push({
              time: currentTime,
              landmarks: landmarks,
              boardCenter: boardCenter
          });

          csvLines.push(`${currentTime.toFixed(2)},${leftAnkleY.toFixed(3)},${rightAnkleY.toFixed(3)},${boardAngle.toFixed(1)},${boardHeight.toFixed(3)},${shoulderRot.toFixed(1)}`);
          
          currentTime += interval;
          const progress = Math.min(100, Math.round(((currentTime - trimStart) / (trimEnd - trimStart)) * 100));
          setExtractionProgress(progress);
      }

      setTrackingData(recordedFrames);
      return csvLines.join("\n");
  };

  const processVideo = async () => {
    if (!file) return;
    setIsAnalyzing(true);
    setStatus("Analyzing...");
    setExtractionProgress(0);
            
    try {
        if (videoRef.current && videoRef.current.readyState >= 1) {
             const csvData = await extractMotionData();
             setStatus(t.ANALYZING_WITH_GEMINI);
             
             const userContext = user ? await dbService.getUserFeedbacks(user.uid) : [];
             
             const result = await analyzeMedia(
                file, 
                language, 
                userContext,
                trickNameHint || undefined,
                trimStart,
                trimEnd,
                undefined,
                csvData 
            );
    
            if (result) {
                setAnalysisResult(result);
                if (user) await dbService.saveAnalysisResult(user.uid, result);
            } else {
                alert("Analysis failed. Please try again.");
            }
        } else {
            alert("Video not ready. Please wait a moment.");
        }
    } catch (error) {
        console.error("Analysis Error:", error);
        alert("An error occurred during analysis.");
    } finally {
        setIsAnalyzing(false);
        setStatus("");
        setExtractionProgress(0);
    }
  };

  // --- RESULT PLAYBACK & VISUALIZATION ---
  
  const drawResultFrame = () => {
      const video = resultVideoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || trackingData.length === 0) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Handle looping within trim range manually for precision
      if (video.currentTime >= trimEnd) {
          video.currentTime = trimStart;
      }
      if (video.currentTime < trimStart) {
          video.currentTime = trimStart;
      }

      // Find closest frame data
      const currentFrameData = trackingData.reduce((prev, curr) => 
        Math.abs(curr.time - video.currentTime) < Math.abs(prev.time - video.currentTime) ? curr : prev
      );

      // Clear & Draw
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw Skeleton
      if (currentFrameData.landmarks) {
           // @ts-ignore
           if (mpDrawing && mpDrawing.drawConnectors && mpDrawing.drawLandmarks) {
               // @ts-ignore
               mpDrawing.drawConnectors(ctx, currentFrameData.landmarks, mpPose.POSE_CONNECTIONS, {color: 'rgba(255, 255, 255, 0.6)', lineWidth: 2});
               // @ts-ignore
               mpDrawing.drawLandmarks(ctx, currentFrameData.landmarks, {color: '#E3FF37', lineWidth: 1, radius: 2});
           }
      }

      // Draw Board Center Tracking
      if (currentFrameData.boardCenter) {
          const x = currentFrameData.boardCenter.x * canvas.width;
          const y = currentFrameData.boardCenter.y * canvas.height;
          
          // Draw Target
          ctx.beginPath();
          ctx.arc(x, y, 8, 0, 2 * Math.PI);
          ctx.strokeStyle = '#E3FF37'; // Neon
          ctx.lineWidth = 3;
          ctx.stroke();
          
          ctx.beginPath();
          ctx.arc(x, y, 3, 0, 2 * Math.PI);
          ctx.fillStyle = '#E3FF37';
          ctx.fill();

          // Label
          ctx.fillStyle = '#E3FF37';
          ctx.font = 'bold 12px sans-serif';
          ctx.fillText("BOARD", x + 12, y + 4);
      }

      requestRef.current = requestAnimationFrame(drawResultFrame);
  };

  useEffect(() => {
      if (analysisResult && isPlaying) {
          requestRef.current = requestAnimationFrame(drawResultFrame);
      } else {
          if (requestRef.current) {
              cancelAnimationFrame(requestRef.current);
          }
      }
      return () => {
          if (requestRef.current) {
              cancelAnimationFrame(requestRef.current);
          }
      };
  }, [analysisResult, isPlaying, trackingData]);

  const togglePlay = () => {
      if (resultVideoRef.current) {
          if (isPlaying) {
              resultVideoRef.current.pause();
          } else {
              resultVideoRef.current.play();
          }
          setIsPlaying(!isPlaying);
      }
  };

  const changeSpeed = (speed: number) => {
      setPlaybackSpeed(speed);
      if (resultVideoRef.current) {
          resultVideoRef.current.playbackRate = speed;
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

  const getAxisLabel = (axis: string) => {
      switch(axis) {
          case 'ROLL': return t.AXIS_ROLL;
          case 'YAW': return t.AXIS_YAW;
          case 'MIXED': return t.AXIS_MIXED;
          default: return t.AXIS_NONE;
      }
  };

  return (
    <div className="flex flex-col h-full p-6 pb-32 overflow-y-auto animate-fade-in relative bg-black">
      
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
            <Eye className="text-skate-neon w-8 h-8" />
            <h2 className="text-4xl font-display font-bold uppercase tracking-wide text-white">{t.AI_VISION_TITLE}</h2>
        </div>
      </div>

      {/* TIP BANNER */}
      {!analysisResult && (
          <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-4 mb-6 flex items-start space-x-3">
              <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
              <p className="text-sm text-blue-200">
                  {language === 'KR' 
                    ? "슬로우 모션(고프레임) 영상일수록 AI 분석과 트래킹 정확도가 훨씬 높아집니다." 
                    : "Using Slow Motion (High FPS) video significantly improves AI analysis and tracking accuracy."}
              </p>
          </div>
      )}

      {/* MAIN CONTENT */}
      <div className="space-y-6">
        
        {/* Upload Area */}
        {!previewUrl && (
            <div className="space-y-6">
                <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-white/20 rounded-3xl p-10 flex flex-col items-center justify-center text-center space-y-4 hover:bg-white/5 transition-colors cursor-pointer min-h-[250px] group"
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
            </div>
        )}

        {/* Video Preview & Trim Controls */}
        {previewUrl && !analysisResult && (
            <div className="space-y-6 animate-fade-in">
                <div className="relative rounded-3xl overflow-hidden bg-black shadow-2xl border border-white/10 group">
                    <video 
                        ref={videoRef}
                        src={previewUrl} 
                        className="w-full h-auto max-h-[50vh] object-contain"
                        controls={false}
                        playsInline
                        muted
                        onLoadedMetadata={handleMetadataLoaded}
                    />
                     <button 
                        onClick={() => {
                            setFile(null);
                            setPreviewUrl(null);
                        }}
                        className="absolute top-4 right-4 p-2 bg-black/50 backdrop-blur rounded-full text-white hover:bg-white/20 transition-colors z-40"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Trim Controls */}
                <div className="glass-card p-5 rounded-2xl border border-white/10 space-y-4">
                    <div className="flex items-center space-x-2 text-gray-400 mb-2">
                        <Scissors className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-widest">{t.TRIM_RANGE || "Trim Video"}</span>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                         <div className="flex-1 space-y-1">
                             <label className="text-[10px] uppercase font-bold text-gray-500">{t.SET_START}</label>
                             <div className="flex items-center space-x-2">
                                <input 
                                    type="number" 
                                    step="0.1" 
                                    min="0" 
                                    max={trimEnd}
                                    value={trimStart}
                                    onChange={(e) => setTrimStart(Number(e.target.value))}
                                    className="bg-black/50 border border-white/10 rounded-lg p-2 text-white w-full text-sm"
                                />
                                <span className="text-xs text-gray-500">s</span>
                             </div>
                         </div>
                         <div className="flex-1 space-y-1">
                             <label className="text-[10px] uppercase font-bold text-gray-500">{t.SET_END}</label>
                             <div className="flex items-center space-x-2">
                                <input 
                                    type="number" 
                                    step="0.1" 
                                    min={trimStart}
                                    max={videoDuration}
                                    value={trimEnd}
                                    onChange={(e) => setTrimEnd(Number(e.target.value))}
                                    className="bg-black/50 border border-white/10 rounded-lg p-2 text-white w-full text-sm"
                                />
                                <span className="text-xs text-gray-500">s</span>
                             </div>
                         </div>
                         <button 
                            onClick={() => { setTrimStart(0); setTrimEnd(videoDuration); }}
                            className="bg-white/5 p-3 rounded-xl hover:bg-white/10 mt-5"
                         >
                             <span className="text-xs font-bold text-gray-400">{t.RESET_TRIM}</span>
                         </button>
                    </div>
                    <div className="w-full bg-gray-800 h-1.5 rounded-full relative mt-2">
                        <div 
                            className="absolute h-full bg-skate-neon opacity-50" 
                            style={{ 
                                left: `${(trimStart / videoDuration) * 100}%`, 
                                width: `${((trimEnd - trimStart) / videoDuration) * 100}%` 
                            }}
                        />
                    </div>
                    <div className="text-center text-xs text-skate-neon font-bold uppercase tracking-widest">
                        {t.CLIP_DURATION}: {(trimEnd - trimStart).toFixed(1)}s
                    </div>
                </div>

                {/* Loading Overlay */}
                {isAnalyzing && (
                    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md transition-all">
                        <div className="w-20 h-20 border-4 border-skate-neon/30 border-t-skate-neon rounded-full animate-spin mb-6"></div>
                        <h3 className="text-2xl font-display font-bold text-white tracking-widest animate-pulse">
                            ANALYZING {extractionProgress > 0 && `${extractionProgress}%`}
                        </h3>
                        <p className="text-gray-400 text-xs font-mono uppercase tracking-wider mt-2">
                            {status}
                        </p>
                    </div>
                )}

                {/* Action Buttons */}
                {!isAnalyzing && (
                    <div className="space-y-4">
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
            </div>
        )}

        {/* RESULTS SECTION */}
        {analysisResult && (
            <div className="space-y-6 animate-slide-up pb-10">
                
                {/* Result Video Player with Overlay */}
                <div className="relative rounded-3xl overflow-hidden bg-black border border-white/10 shadow-2xl">
                    <video 
                        ref={resultVideoRef}
                        src={previewUrl!} 
                        className="w-full h-auto max-h-[60vh] object-contain opacity-80"
                        playsInline
                        muted
                        loop
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                    />
                    <canvas 
                        ref={canvasRef}
                        className="absolute inset-0 w-full h-full pointer-events-none"
                        width={resultVideoRef.current?.videoWidth}
                        height={resultVideoRef.current?.videoHeight}
                    />
                    
                    {/* Player Controls */}
                    <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between bg-black/60 backdrop-blur rounded-2xl p-3">
                        <button onClick={togglePlay} className="p-2 bg-white text-black rounded-full hover:bg-gray-200">
                            {isPlaying ? <Pause className="w-4 h-4 fill-black" /> : <Play className="w-4 h-4 fill-black ml-0.5" />}
                        </button>
                        
                        <div className="flex items-center space-x-2">
                             <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mr-1">SPEED</span>
                             {[0.25, 0.5, 1.0].map(speed => (
                                 <button
                                    key={speed}
                                    onClick={() => changeSpeed(speed)}
                                    className={`px-2 py-1 rounded-lg text-xs font-bold ${playbackSpeed === speed ? 'bg-skate-neon text-black' : 'bg-white/10 text-white hover:bg-white/20'}`}
                                 >
                                     {speed}x
                                 </button>
                             ))}
                        </div>
                    </div>
                </div>

                {/* Score Card */}
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

                {/* Physics & AI Feedback */}
                {analysisResult.boardPhysics && (
                     <div className="glass-card p-6 rounded-3xl border border-purple-500/20 bg-purple-900/10">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-2">
                                <Rotate3d className="w-5 h-5 text-purple-400" />
                                <h3 className="text-sm font-bold text-purple-200 uppercase tracking-widest">{t.PHYSICS_ANALYSIS}</h3>
                            </div>
                            <div className="flex items-center space-x-1 bg-black/40 px-3 py-1 rounded-lg border border-purple-500/30">
                                <Compass className="w-3 h-3 text-purple-400" />
                                <span className="text-[10px] font-bold text-purple-300 uppercase">{getAxisLabel(analysisResult.boardPhysics.axis)}</span>
                            </div>
                        </div>
                        <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap italic">
                            "{analysisResult.boardPhysics.description}"
                        </p>
                    </div>
                )}

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
                
                <button 
                    onClick={() => {
                        setAnalysisResult(null);
                        setTrackingData([]);
                    }}
                    className="w-full py-4 bg-white/5 rounded-2xl text-white font-bold uppercase tracking-widest hover:bg-white/10"
                >
                    ANALYZE NEW VIDEO
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