
import React, { useState, useRef, useEffect } from 'react';
import { Language, User, VisionAnalysis } from '../types';
import { TRANSLATIONS } from '../constants';
import { Upload, Zap, X, Eye, Info, Activity, Rotate3d, Compass, Scissors, Play, Pause, HelpCircle, BrainCircuit, ChevronLeft, ChevronRight, RotateCcw, AlertCircle, Footprints, Sparkles } from 'lucide-react';
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

const THINKING_STEPS = [
    { text: { EN: "Tracking joints...", KR: "관절 위치 찾는 중..." } },
    { text: { EN: "Calculating board physics...", KR: "보드 회전각 계산 중..." } },
    { text: { EN: "Identifying trick...", KR: "트릭 기술 식별 중..." } },
    { text: { EN: "Analyzing landing...", KR: "착지 안정성 평가 중..." } },
    { text: { EN: "Generating feedback...", KR: "코칭 피드백 작성 중..." } }
];

const AIVision: React.FC<Props> = ({ language, user }) => {
  const t = TRANSLATIONS[language];
  
  // State
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState(0);
  const [isVideoError, setIsVideoError] = useState(false);
  
  // User Input State
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isDragging, setIsDragging] = useState<'start' | 'end' | 'playhead' | null>(null);
  const [trickNameHint, setTrickNameHint] = useState("");
  const [stance, setStance] = useState<"Regular" | "Goofy">("Regular");
  
  // Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<VisionAnalysis | null>(null);
  const [extractionProgress, setExtractionProgress] = useState(0);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [thinkingStep, setThinkingStep] = useState(0);

  // Timer & Info State
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showAlgoInfo, setShowAlgoInfo] = useState(false);
  const analysisTimerRef = useRef<any>(null);

  // Result Playback State
  const [trackingData, setTrackingData] = useState<PoseFrame[]>([]);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
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

  // Cycle thinking steps
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
      
      // Check for AVI explicitly as it is not supported by browsers
      if (selectedFile.type.includes('avi') || selectedFile.name.toLowerCase().endsWith('.avi')) {
          alert(language === 'KR' 
            ? "AVI 파일은 브라우저에서 재생할 수 없습니다. MP4 또는 MOV(iPhone) 파일로 변환해 주세요." 
            : "AVI files are not supported by browsers. Please convert to MP4 or MOV.");
          return;
      }

      if (selectedFile.size > 200 * 1024 * 1024) { // Increased limit for longer videos
          alert(t.FILE_TOO_LARGE);
          return;
      }

      setFile(selectedFile);
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
      setAnalysisResult(null);
      setTrackingData([]);
      setPlaybackSpeed(1.0);
      setIsVideoError(false);
      
      // Reset trim when new file loads
      const vid = document.createElement('video');
      vid.preload = 'metadata';
      vid.onloadedmetadata = () => {
          setVideoDuration(vid.duration);
          setTrimStart(0);
          setTrimEnd(vid.duration);
      };
      vid.onerror = () => {
          setIsVideoError(true);
      };
      vid.src = url;
    }
  };

  const handleMetadataLoaded = (e: React.SyntheticEvent<HTMLVideoElement>) => {
      const duration = e.currentTarget.duration;
      setVideoDuration(duration);
      if (trimEnd === 0) setTrimEnd(duration);
      setIsVideoError(false);
  };

  const handleVideoError = () => {
      setIsVideoError(true);
      alert(language === 'KR' 
        ? "영상을 불러올 수 없습니다. 파일 형식이 브라우저와 호환되지 않을 수 있습니다 (예: 일부 MKV, AVI)." 
        : "Cannot play video. The format might be unsupported (e.g. AVI, MKV).");
  };

  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
      const vid = e.currentTarget;
      setCurrentTime(vid.currentTime);

      // Loop Logic during Preview
      if (!analysisResult && !isDragging) {
          if (vid.currentTime >= trimEnd) {
              vid.currentTime = trimStart;
              vid.play();
          }
      }
  };

  // --- TIMELINE DRAG LOGIC ---
  const handleTimelineInteraction = (clientX: number) => {
      if (!timelineRef.current || videoDuration === 0) return;
      const rect = timelineRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
      const percentage = x / rect.width;
      const newTime = percentage * videoDuration;

      if (isDragging === 'start') {
          // Constrain: Can't go past End - 0.5s
          const maxStart = Math.max(0, trimEnd - 0.5);
          const val = Math.min(newTime, maxStart);
          setTrimStart(val);
          if (videoRef.current) videoRef.current.currentTime = val;
      } else if (isDragging === 'end') {
          // Constrain: Can't go before Start + 0.5s
          const minEnd = Math.min(videoDuration, trimStart + 0.5);
          const val = Math.max(newTime, minEnd);
          setTrimEnd(val);
          if (videoRef.current) videoRef.current.currentTime = val;
      } else if (isDragging === 'playhead') {
          // Playhead logic (scrubbing)
          if (videoRef.current) {
              videoRef.current.currentTime = newTime;
              setCurrentTime(newTime);
          }
      }
  };

  useEffect(() => {
      const handleMove = (e: MouseEvent | TouchEvent) => {
          if (isDragging) {
              const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
              handleTimelineInteraction(clientX);
          }
      };
      const handleUp = () => {
          setIsDragging(null);
      };

      if (isDragging) {
          window.addEventListener('mousemove', handleMove);
          window.addEventListener('mouseup', handleUp);
          window.addEventListener('touchmove', handleMove);
          window.addEventListener('touchend', handleUp);
      }
      return () => {
          window.removeEventListener('mousemove', handleMove);
          window.removeEventListener('mouseup', handleUp);
          window.removeEventListener('touchmove', handleMove);
          window.removeEventListener('touchend', handleUp);
      };
  }, [isDragging, videoDuration, trimStart, trimEnd]);


  // --- EXTRACTION & TRACKING LOGIC ---
  const extractMotionData = async (): Promise<string> => {
      if (!videoRef.current || !poseEstimator.current) return "";
      
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return "";
      
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
      try {
        while (currentTime <= trimEnd) {
            video.currentTime = currentTime;
            
            // Wait for seek to complete
            await new Promise<void>(r => {
                const onSeek = () => { video.removeEventListener('seeked', onSeek); r(); };
                video.addEventListener('seeked', onSeek);
            });

            // Draw video frame to canvas for MediaPipe
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            // Wait for Pose Estimation with TIMEOUT to prevent hanging
            // If MediaPipe hangs on a specific frame, we skip it or abort extraction
            try {
                const results: any = await Promise.race([
                    new Promise(resolve => {
                        frameResolver = resolve;
                        poseEstimator.current.send({image: canvas});
                    }),
                    new Promise((_, reject) => setTimeout(() => reject(new Error("Pose timeout")), 3000)) // 3s timeout per frame
                ]);

                // Process Results
                let landmarks = null;
                let boardCenter = null;
                let leftAnkleY = 0, rightAnkleY = 0, boardHeight = 0, boardAngle = 0, shoulderRot = 0;

                if (results && results.poseLandmarks) {
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
            
            } catch (e) {
                console.warn("Frame analysis timed out or failed, skipping frame", e);
                // Continue to next frame even if this one failed
            }
            
            currentTime += interval;
            const progress = Math.min(100, Math.round(((currentTime - trimStart) / (trimEnd - trimStart)) * 100));
            setExtractionProgress(progress);
        }

        setTrackingData(recordedFrames);
        return csvLines.join("\n");
      } catch (globalError) {
          console.error("Critical error during motion extraction:", globalError);
          // Return empty string to trigger visual-only analysis fallback
          return "";
      }
  };

  const processVideo = async () => {
    if (!file) return;
    setIsAnalyzing(true);
    setExtractionProgress(0);
    setElapsedTime(0);

    // Start Timer
    const startTime = Date.now();
    if (analysisTimerRef.current) clearInterval(analysisTimerRef.current);
    analysisTimerRef.current = setInterval(() => {
        setElapsedTime((Date.now() - startTime) / 1000);
    }, 100);
            
    try {
        if (videoRef.current && videoRef.current.readyState >= 1) {
             // Try to extract CSV, but if it fails, proceed with video only
             let csvData = "";
             try {
                csvData = await extractMotionData();
             } catch (e) {
                console.warn("Motion extraction failed completely, proceeding with video only.", e);
             }
             
             const userContext = user ? await dbService.getUserFeedbacks(user.uid) : [];
             
             const result = await analyzeMedia(
                file, 
                language, 
                userContext,
                trickNameHint || undefined,
                trimStart,
                trimEnd,
                undefined,
                csvData,
                stance // Pass stance to API
            );
    
            if (result) {
                setAnalysisResult(result);
                if (user) await dbService.saveAnalysisResult(user.uid, result);
            } else {
                alert(language === 'KR' 
                    ? "분석에 실패했습니다. AI가 응답하지 않거나 영상을 분석할 수 없습니다. 다시 시도해주세요."
                    : "Analysis failed. Please try again or use a shorter video clip.");
            }
        } else {
            alert("Video not ready. Please wait a moment.");
        }
    } catch (error) {
        console.error("Analysis Error:", error);
        alert("An error occurred during analysis.");
    } finally {
        if (analysisTimerRef.current) clearInterval(analysisTimerRef.current);
        setIsAnalyzing(false);
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

  const togglePreviewPlay = () => {
      if (!videoRef.current) return;
      if (videoRef.current.paused) {
          // If we are at the end of clip, restart from trimStart
          if (videoRef.current.currentTime >= trimEnd) {
              videoRef.current.currentTime = trimStart;
          }
          videoRef.current.play();
      } else {
          videoRef.current.pause();
      }
  };

  return (
    <div className="flex flex-col h-full p-6 pb-32 overflow-y-auto animate-fade-in relative bg-black">
      
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
            <div className="relative">
                <div className="absolute inset-0 bg-skate-neon blur-lg opacity-40 rounded-full"></div>
                <Eye className="text-skate-neon w-8 h-8 relative z-10" />
            </div>
            <h2 className="text-4xl font-display font-bold uppercase tracking-wide text-white">{t.AI_VISION_TITLE}</h2>
        </div>
        <button 
            onClick={() => setShowAlgoInfo(true)}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
        >
            <HelpCircle className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-wider">
                {language === 'KR' ? '기술 원리' : 'Algorithm'}
            </span>
        </button>
      </div>

      {/* ALGORITHM MODAL */}
      {showAlgoInfo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-6 animate-fade-in">
              <div className="glass-card p-6 rounded-3xl w-full max-w-sm relative">
                  <button onClick={() => setShowAlgoInfo(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X className="w-6 h-6"/></button>
                  <div className="flex items-center space-x-2 mb-6 text-skate-neon">
                      <BrainCircuit className="w-6 h-6" />
                      <h3 className="text-xl font-display font-bold uppercase">Hybrid AI Analysis</h3>
                  </div>
                  
                  <div className="space-y-6">
                      <div className="relative pl-6 border-l border-white/10">
                          <span className="absolute -left-1.5 top-0 w-3 h-3 rounded-full bg-blue-400"></span>
                          <h4 className="text-blue-400 font-bold uppercase text-xs tracking-widest mb-1">Step 1. Client-Side Tracking</h4>
                          <p className="text-gray-300 text-sm leading-relaxed">
                              {language === 'KR' 
                                ? "브라우저에서 MediaPipe를 이용해 신체 관절과 보드 움직임을 0.03초 단위로 추적하여 물리 데이터(속도, 각도, 높이)를 추출합니다."
                                : "Uses MediaPipe in-browser to track body joints and board physics every 0.03s, generating precise motion data."}
                          </p>
                      </div>
                      
                      <div className="relative pl-6 border-l border-white/10">
                          <span className="absolute -left-1.5 top-0 w-3 h-3 rounded-full bg-purple-400"></span>
                          <h4 className="text-purple-400 font-bold uppercase text-xs tracking-widest mb-1">Step 2. Multimodal AI</h4>
                          <p className="text-gray-300 text-sm leading-relaxed">
                              {language === 'KR'
                                ? "구글 Gemini 2.5 Flash 모델에게 영상의 시각적 스타일과 1단계에서 추출한 물리 데이터를 동시에 전달하여 정밀 분석합니다."
                                : "Feeds both the visual video context and the extracted physics data to Google's Gemini 2.5 Flash for deep analysis."}
                          </p>
                      </div>

                      <div className="relative pl-6 border-l border-white/10">
                           <span className="absolute -left-1.5 top-0 w-3 h-3 rounded-full bg-skate-neon"></span>
                           <h4 className="text-skate-neon font-bold uppercase text-xs tracking-widest mb-1">Step 3. Cross-Validation</h4>
                           <p className="text-gray-300 text-sm leading-relaxed">
                               {language === 'KR'
                                 ? "시각 정보와 수치 데이터를 교차 검증하여 트릭의 성공 여부와 정확한 기술명을 판정합니다."
                                 : "Cross-validates visual evidence with numerical data to determine the exact trick name and success status."}
                           </p>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* TIP BANNER */}
      {!analysisResult && !isAnalyzing && (
          <div className="bg-blue-900/10 border border-blue-500/20 rounded-2xl p-4 mb-6 flex items-start space-x-3">
              <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-200 leading-relaxed font-medium">
                  {language === 'KR' 
                    ? "팁: 슬로우 모션(고프레임) 영상일수록 분석이 정확합니다. 보드가 잘 보이도록 45도 각도나 측면에서 촬영해주세요." 
                    : "Tip: Best accuracy with Slow Motion (High FPS). Film from a 45° angle or side view where the board is clearly visible."}
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
                    className="border-2 border-dashed border-white/10 rounded-[2rem] p-10 flex flex-col items-center justify-center text-center space-y-4 hover:bg-white/5 transition-all cursor-pointer min-h-[300px] group bg-white/[0.02]"
                >
                    <div className="w-24 h-24 bg-skate-neon/5 rounded-full flex items-center justify-center group-hover:scale-110 group-hover:bg-skate-neon/10 transition-all duration-500">
                        <Upload className="w-10 h-10 text-skate-neon opacity-80 group-hover:opacity-100" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-display font-bold text-white mb-2 tracking-wide">{t.UPLOAD_MEDIA}</h3>
                        <p className="text-gray-500 text-sm max-w-xs mx-auto leading-relaxed">{t.AI_VISION_DESC}</p>
                    </div>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        accept="video/*,video/mp4,video/quicktime" 
                        className="hidden" 
                    />
                </div>
            </div>
        )}

        {/* Video Preview & Trim Controls */}
        {previewUrl && !analysisResult && (
            <div className="space-y-6 animate-fade-in">
                
                {/* Error Banner */}
                {isVideoError && (
                     <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-4 flex items-center space-x-3">
                        <AlertCircle className="w-6 h-6 text-red-500" />
                        <p className="text-sm text-red-200">
                            {language === 'KR' 
                            ? "이 영상 형식은 지원되지 않습니다. 아이폰 설정 > 카메라 > 포맷 > '높은 호환성'으로 설정하거나 MP4로 변환해주세요." 
                            : "Video format not supported. Use MP4 or set iPhone Camera Format to 'Most Compatible'."}
                        </p>
                     </div>
                )}

                <div className="relative rounded-[2rem] overflow-hidden bg-black shadow-2xl border border-white/10 group aspect-[9/16] md:aspect-video max-h-[60vh] mx-auto">
                    <video 
                        ref={videoRef}
                        src={previewUrl} 
                        className="w-full h-full object-contain"
                        playsInline
                        muted={false}
                        onLoadedMetadata={handleMetadataLoaded}
                        onTimeUpdate={handleTimeUpdate}
                        onError={handleVideoError}
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
                    {/* Centered Play Button for Preview */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                         <div className="bg-black/40 rounded-full p-6 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
                            {videoRef.current?.paused ? <Play className="fill-white text-white w-8 h-8" /> : <Pause className="fill-white text-white w-8 h-8" />}
                         </div>
                    </div>
                    <button 
                        onClick={togglePreviewPlay}
                        className="absolute inset-0 w-full h-full cursor-pointer z-10 opacity-0"
                    ></button>
                </div>

                {/* iPhone Style Trim Controls */}
                <div className="glass-card p-4 rounded-3xl border border-white/10 space-y-3">
                    <div className="flex items-center justify-between text-gray-400 mb-1 px-1">
                        <div className="flex items-center space-x-2">
                            <Scissors className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-widest">{t.TRIM_RANGE || "Trim Video"}</span>
                        </div>
                        <span className="text-xs font-mono font-bold text-skate-neon">
                            {(trimEnd - trimStart).toFixed(1)}s Selected
                        </span>
                    </div>

                    {/* Timeline Container */}
                    <div 
                        ref={timelineRef}
                        className="relative h-14 bg-gray-900 rounded-xl w-full select-none touch-none overflow-hidden cursor-pointer group border border-white/5"
                        onMouseDown={(e) => {
                             // If clicking on track (not handle), move playhead
                             const rect = e.currentTarget.getBoundingClientRect();
                             const x = e.clientX - rect.left;
                             const pct = x / rect.width;
                             const time = pct * videoDuration;
                             if (videoRef.current) {
                                 videoRef.current.currentTime = time;
                                 setCurrentTime(time);
                             }
                             setIsDragging('playhead');
                        }}
                        onTouchStart={(e) => {
                             const rect = e.currentTarget.getBoundingClientRect();
                             const x = e.touches[0].clientX - rect.left;
                             const pct = x / rect.width;
                             const time = pct * videoDuration;
                             setIsDragging('playhead');
                             if(time < trimStart || time > trimEnd) {
                                  if(videoRef.current) videoRef.current.currentTime = time;
                             }
                        }}
                    >
                        {/* Dimmed Overlay Left */}
                        <div 
                            className="absolute left-0 top-0 bottom-0 bg-black/70 pointer-events-none z-10 transition-all duration-75"
                            style={{ width: `${(trimStart / videoDuration) * 100}%` }}
                        />
                        
                        {/* Dimmed Overlay Right */}
                        <div 
                            className="absolute right-0 top-0 bottom-0 bg-black/70 pointer-events-none z-10 transition-all duration-75"
                            style={{ width: `${100 - (trimEnd / videoDuration) * 100}%` }}
                        />

                        {/* Active Selection Frame (Yellow Box) */}
                        <div 
                            className="absolute top-0 bottom-0 border-y-2 border-skate-neon z-20 pointer-events-none"
                            style={{ 
                                left: `${(trimStart / videoDuration) * 100}%`,
                                right: `${100 - (trimEnd / videoDuration) * 100}%`
                            }}
                        >
                            {/* Left Handle (Ear) */}
                            <div 
                                className="absolute left-0 top-0 bottom-0 w-6 bg-skate-neon flex items-center justify-center cursor-ew-resize pointer-events-auto shadow-lg -translate-x-1/2 rounded-l-md active:scale-110 transition-transform"
                                onMouseDown={(e) => { e.stopPropagation(); setIsDragging('start'); }}
                                onTouchStart={(e) => { e.stopPropagation(); setIsDragging('start'); }}
                            >
                                <ChevronLeft className="w-4 h-4 text-black" />
                            </div>

                            {/* Right Handle (Ear) */}
                            <div 
                                className="absolute right-0 top-0 bottom-0 w-6 bg-skate-neon flex items-center justify-center cursor-ew-resize pointer-events-auto shadow-lg translate-x-1/2 rounded-r-md active:scale-110 transition-transform"
                                onMouseDown={(e) => { e.stopPropagation(); setIsDragging('end'); }}
                                onTouchStart={(e) => { e.stopPropagation(); setIsDragging('end'); }}
                            >
                                <ChevronRight className="w-4 h-4 text-black" />
                            </div>
                        </div>

                        {/* Playhead */}
                        <div 
                            className="absolute top-0 bottom-0 w-0.5 bg-white z-30 pointer-events-none shadow-[0_0_5px_rgba(0,0,0,0.5)]"
                            style={{ left: `${(currentTime / videoDuration) * 100}%` }}
                        >
                            <div className="absolute -top-1 -translate-x-1/2 w-3 h-3 bg-white rounded-full shadow-md"></div>
                        </div>
                    </div>

                    <div className="flex justify-between items-center mt-2 px-1">
                        <span className="text-[10px] font-mono text-gray-500">{trimStart.toFixed(1)}s</span>
                        <div className="flex space-x-3">
                             <button 
                                onClick={() => { setTrimStart(0); setTrimEnd(videoDuration); }}
                                className="text-[10px] font-bold text-gray-500 hover:text-white flex items-center bg-white/5 px-3 py-1.5 rounded-full transition-colors"
                             >
                                 <RotateCcw className="w-3 h-3 mr-1" />
                                 RESET
                             </button>
                        </div>
                        <span className="text-[10px] font-mono text-gray-500">{trimEnd.toFixed(1)}s</span>
                    </div>
                </div>

                {/* --- NEW LOADING UI --- */}
                {isAnalyzing && (
                    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-xl transition-all animate-fade-in">
                        
                        {/* Gemini Orb Animation */}
                        <div className="relative mb-12">
                            {/* Outer Glow */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl animate-pulse-slow"></div>
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-purple-500/30 rounded-full blur-2xl animate-pulse"></div>
                            
                            {/* Core Orb */}
                            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 via-purple-400 to-skate-neon animate-blob shadow-[0_0_50px_rgba(255,255,255,0.2)] flex items-center justify-center relative overflow-hidden">
                                <div className="absolute inset-0 bg-white/30 blur-sm animate-pulse-slow"></div>
                                <Sparkles className="w-8 h-8 text-white animate-spin duration-[3000ms]" />
                            </div>
                        </div>

                        {/* Thinking Text */}
                        <div className="text-center space-y-4">
                            <h3 className="text-3xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-200 via-white to-purple-200 tracking-widest animate-pulse">
                                GEMINI AI
                            </h3>
                            
                            <div className="h-8 overflow-hidden">
                                <p key={thinkingStep} className="text-skate-neon font-mono text-sm font-bold uppercase tracking-widest animate-slide-up">
                                    {/* @ts-ignore */}
                                    {THINKING_STEPS[thinkingStep].text[language]}
                                </p>
                            </div>

                            <div className="bg-white/5 px-4 py-1 rounded-full border border-white/10 inline-block">
                                <p className="text-gray-400 font-mono text-xs">
                                     {elapsedTime.toFixed(1)}s elapsed
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                {!isAnalyzing && (
                    <div className="space-y-4">
                        {/* Stance Selector */}
                        <div className="glass-card p-4 rounded-2xl flex items-center justify-between border border-white/5">
                             <div className="flex items-center space-x-2 text-gray-400">
                                <Footprints className="w-5 h-5" />
                                <span className="text-xs font-bold uppercase tracking-widest">{t.SELECT_YOUR_STANCE || "STANCE"}</span>
                             </div>
                             <div className="flex space-x-2 bg-black/40 rounded-xl p-1">
                                <button 
                                    onClick={() => setStance('Regular')}
                                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${stance === 'Regular' ? 'bg-skate-neon text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}
                                >
                                    REGULAR
                                </button>
                                <button 
                                    onClick={() => setStance('Goofy')}
                                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${stance === 'Goofy' ? 'bg-skate-neon text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}
                                >
                                    GOOFY
                                </button>
                             </div>
                        </div>

                        {/* Trick Name Input */}
                        <div className="glass-card p-4 rounded-2xl flex items-center space-x-3 border border-white/5">
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
                            disabled={isVideoError}
                            className={`w-full py-5 bg-skate-neon hover:bg-skate-neonHover text-black font-display text-3xl font-bold uppercase rounded-[2rem] shadow-[0_0_20px_rgba(204,255,0,0.3)] transform active:scale-[0.98] transition-all flex items-center justify-center space-x-3 ${isVideoError ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
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
                <div className="relative rounded-[2rem] overflow-hidden bg-black border border-white/10 shadow-2xl mx-auto">
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
                    <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between bg-black/60 backdrop-blur-md rounded-2xl p-3 border border-white/5">
                        <button onClick={togglePlay} className="p-3 bg-white text-black rounded-full hover:bg-gray-200 transition-colors">
                            {isPlaying ? <Pause className="w-4 h-4 fill-black" /> : <Play className="w-4 h-4 fill-black ml-0.5" />}
                        </button>
                        
                        <div className="flex items-center space-x-2">
                             <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mr-2">SPEED</span>
                             {[0.25, 0.5, 1.0].map(speed => (
                                 <button
                                    key={speed}
                                    onClick={() => changeSpeed(speed)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${playbackSpeed === speed ? 'bg-skate-neon text-black' : 'bg-white/10 text-white hover:bg-white/20'}`}
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
                        <div className="bg-black/40 rounded-2xl p-4 border border-white/5">
                            <span className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">{t.FORM_SCORE}</span>
                            <div className="flex items-baseline mt-1">
                                <span className="text-3xl font-display font-bold text-white">{analysisResult.score}</span>
                                <span className="text-sm text-gray-500 ml-1">/100</span>
                            </div>
                        </div>
                        <div className="bg-black/40 rounded-2xl p-4 border border-white/5">
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
                        <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap italic pl-2 border-l-2 border-purple-500/30">
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
                    className="w-full py-5 bg-white text-black rounded-[2rem] font-bold text-lg uppercase tracking-wide hover:bg-gray-200 transition-colors shadow-xl"
                >
                    ANALYZE NEW VIDEO
                </button>
            </div>
        )}
      </div>

      {/* Feedback Modal */}
      {showFeedbackModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-6 animate-fade-in">
              <div className="glass-card p-6 rounded-3xl w-full max-w-sm border border-white/10">
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
                        className="flex-1 py-3 bg-gray-800 rounded-xl font-bold text-gray-400 hover:bg-gray-700 transition-colors"
                      >
                          {t.CANCEL}
                      </button>
                      <button 
                        onClick={() => {
                            const input = document.getElementById('actualTrick') as HTMLInputElement;
                            handleFeedbackSubmit({ actualTrickName: input.value });
                        }}
                        className="flex-1 py-3 bg-skate-neon text-black rounded-xl font-bold hover:bg-skate-neonHover transition-colors"
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
