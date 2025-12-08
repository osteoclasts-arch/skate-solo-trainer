
import React, { useState, useRef, useEffect } from 'react';
import { Language, VisionAnalysis, User } from '../types';
import { TRANSLATIONS } from '../constants';
import { Upload, Zap, AlertTriangle, Play, X, Eye, Video, Edit2, CheckCircle, HelpCircle, Ruler, Footprints, Scan } from 'lucide-react';
import { analyzeMedia } from '../services/geminiService';
import { dbService } from '../services/dbService';
import mpPose from '@mediapipe/pose';
import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';

// Manually define POSE_CONNECTIONS to avoid import issues with CDN builds
const POSE_CONNECTIONS: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 7], [0, 4], [4, 5], [5, 6], [6, 8], [9, 10],
  [11, 12], [11, 13], [13, 15], [15, 17], [15, 19], [15, 21], [17, 19],
  [12, 14], [14, 16], [16, 18], [16, 20], [16, 22], [18, 20],
  [11, 23], [12, 24], [23, 24], [23, 25], [24, 26], [25, 27], [26, 28],
  [27, 29], [27, 31], [29, 31], [28, 30], [28, 32], [30, 32]
];

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
  
  // Input & Feedback State
  const [trickHint, setTrickHint] = useState('');
  const [userStance, setUserStance] = useState<'Regular' | 'Goofy'>('Regular'); // Default Regular
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackName, setFeedbackName] = useState('');
  const [feedbackHeight, setFeedbackHeight] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);

  // Video & Motion Tracking Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [playbackRate, setPlaybackRate] = useState(0.5); // Default to Slow Motion
  const [pose, setPose] = useState<any>(null);
  const [isTrackerReady, setIsTrackerReady] = useState(false);
  const [objectModel, setObjectModel] = useState<cocoSsd.ObjectDetection | null>(null);
  const [isModelLoading, setIsModelLoading] = useState(true);
  
  const requestRef = useRef<number>(0);
  const detectedBoardRef = useRef<{bbox: number[], score: number} | null>(null);
  const lastDetectTimeRef = useRef<number>(0);
  
  // Path Tracking Ref
  const pathRef = useRef<{x: number, y: number}[]>([]);

  useEffect(() => {
    // 1. Initialize MediaPipe Pose
    // @ts-ignore
    const PoseClass = mpPose.Pose || mpPose;
    const poseInstance = new PoseClass({
        locateFile: (file: string) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
        }
    });

    poseInstance.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
    });

    poseInstance.onResults(onResults);
    setPose(poseInstance);

    // 2. Initialize COCO-SSD for Skateboard Detection
    const loadModel = async () => {
        try {
            await tf.ready();
            const model = await cocoSsd.load();
            setObjectModel(model);
            setIsModelLoading(false);
        } catch (err) {
            console.error("Failed to load object detection model:", err);
            setIsModelLoading(false);
        }
    };
    loadModel();

    return () => {
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
        poseInstance.close();
    };
  }, []);

  const drawSkeleton = (ctx: CanvasRenderingContext2D, landmarks: any[]) => {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;

    // Draw Connections
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#E3FF37'; // Skate Neon
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    POSE_CONNECTIONS.forEach(([i, j]) => {
      const p1 = landmarks[i];
      const p2 = landmarks[j];
      
      if (p1 && p2 && (p1.visibility === undefined || p1.visibility > 0.5) && (p2.visibility === undefined || p2.visibility > 0.5)) {
        ctx.beginPath();
        ctx.moveTo(p1.x * width, p1.y * height);
        ctx.lineTo(p2.x * width, p2.y * height);
        ctx.stroke();
      }
    });

    // Draw Landmarks (Joints)
    ctx.fillStyle = '#FFFFFF';
    landmarks.forEach((p) => {
      if (p.visibility === undefined || p.visibility > 0.5) {
        ctx.beginPath();
        ctx.arc(p.x * width, p.y * height, 4, 0, 2 * Math.PI);
        ctx.fill();
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'rgba(0,0,0,0.5)';
        ctx.stroke();
      }
    });
  };

  const drawPath = (ctx: CanvasRenderingContext2D) => {
      const width = ctx.canvas.width;
      const height = ctx.canvas.height;
      const path = pathRef.current;

      if (path.length < 2) return;

      ctx.beginPath();
      ctx.moveTo(path[0].x * width, path[0].y * height);
      
      for (let i = 1; i < path.length; i++) {
          ctx.lineTo(path[i].x * width, path[i].y * height);
      }

      ctx.strokeStyle = '#FF4500'; // OrangeRed
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.shadowColor = '#FF4500';
      ctx.shadowBlur = 10;
      ctx.globalAlpha = 0.8;
      ctx.stroke();
      ctx.globalAlpha = 1.0;
      ctx.shadowBlur = 0;
  };

  const drawSkateboard = (ctx: CanvasRenderingContext2D, landmarks: any[]) => {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    const board = detectedBoardRef.current;

    // If no visual detection of board, we skip drawing it to avoid "floating feet board" error
    if (!board) return;

    // Bounding Box from Object Detection
    const [bx, by, bw, bh] = board.bbox;
    const centerX = bx + bw / 2;
    const centerY = by + bh / 2;

    // --- HYBRID TRACKING ---
    // Use Object Detection for POSITION (especially Y/Height)
    // Use Pose Landmarks (Feet) for ANGLE/ORIENTATION if they are close enough
    
    const leftFootIndices = [29, 31];
    const rightFootIndices = [30, 32];
    const getAvgPoint = (indices: number[]) => {
        let x = 0, y = 0, count = 0;
        indices.forEach(idx => {
            const p = landmarks[idx];
            if (p && (p.visibility === undefined || p.visibility > 0.5)) {
                x += p.x * width;
                y += p.y * height;
                count++;
            }
        });
        return count > 0 ? { x: x / count, y: y / count } : null;
    };

    const leftPos = getAvgPoint(leftFootIndices);
    const rightPos = getAvgPoint(rightFootIndices);

    // Default: Horizontal board based on bbox
    let deckX1 = bx;
    let deckX2 = bx + bw;
    let deckY1 = centerY;
    let deckY2 = centerY;
    
    // Refine with Feet if available and physically reasonable (feet roughly near the board)
    // This allows the board to tilt (ollie angle)
    if (leftPos && rightPos) {
        // Check if feet are somewhat within the X-range of the board (expanded slightly)
        const margin = bw * 0.5;
        if (leftPos.x > bx - margin && leftPos.x < bx + bw + margin && 
            rightPos.x > bx - margin && rightPos.x < bx + bw + margin) {
            
            // Use feet X for span, but anchor Y to the Board Box to prevent "sticky feet"
            // We blend the foot Y with the board center Y to allow tilt but keep it grounded to the board detection
            deckX1 = leftPos.x;
            deckX2 = rightPos.x;
            
            // Calculate tilt from feet, but center it on the detected board
            const feetCenterY = (leftPos.y + rightPos.y) / 2;
            const yOffset = centerY - feetCenterY;
            
            deckY1 = leftPos.y + yOffset;
            deckY2 = rightPos.y + yOffset;
        }
    }

    // --- DRAWING ---
    
    // 1. Draw Bounding Box (Visual Debug / Confidence)
    ctx.strokeStyle = 'rgba(227, 255, 55, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(bx, by, bw, bh);

    // 2. Draw Trucks & Wheels (Simulated based on deck line)
    const dx = deckX2 - deckX1;
    const dy = deckY2 - deckY1;
    const len = Math.sqrt(dx*dx + dy*dy);
    const ux = dx / len;
    const uy = dy / len;
    const px = -uy; // Perpendicular X
    const py = ux;  // Perpendicular Y
    
    const truckWidth = Math.max(bw * 0.6, 30); // Width of axle
    
    const drawTruck = (tx: number, ty: number) => {
        const ax1 = tx - px * (truckWidth / 2);
        const ay1 = ty - py * (truckWidth / 2);
        const ax2 = tx + px * (truckWidth / 2);
        const ay2 = ty + py * (truckWidth / 2);

        // Axle
        ctx.beginPath();
        ctx.moveTo(ax1, ay1);
        ctx.lineTo(ax2, ay2);
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#C0C0C0';
        ctx.stroke();

        // Wheels
        const r = 5;
        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = '#666';
        ctx.beginPath(); ctx.arc(ax1, ay1, r, 0, Math.PI*2); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.arc(ax2, ay2, r, 0, Math.PI*2); ctx.fill(); ctx.stroke();
    };

    // Place trucks at 20% and 80% of the calculated deck line
    drawTruck(deckX1 + dx*0.2, deckY1 + dy*0.2);
    drawTruck(deckX1 + dx*0.8, deckY1 + dy*0.8);

    // 3. Draw Deck (Grip Tape)
    ctx.beginPath();
    ctx.moveTo(deckX1 - ux * (len*0.1), deckY1 - uy * (len*0.1)); // Extend slightly
    ctx.lineTo(deckX2 + ux * (len*0.1), deckY2 + uy * (len*0.1));
    ctx.lineWidth = 8;
    ctx.strokeStyle = '#111'; // Black grip
    ctx.lineCap = 'round';
    ctx.stroke();
    
    // Deck Outline
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#FF3B30'; // Red Outline as requested
    ctx.stroke();

    // 4. Center Marker
    ctx.beginPath();
    ctx.arc(centerX, centerY, 3, 0, Math.PI*2);
    ctx.fillStyle = '#E3FF37';
    ctx.fill();
  };

  const onResults = (results: any) => {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      if (!canvas || !video) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Ensure canvas matches the video source dimensions exactly for correct overlay
      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
      }

      ctx.save();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      if (results.poseLandmarks) {
          // Update Path History
          const leftAnkle = results.poseLandmarks[27];
          const rightAnkle = results.poseLandmarks[28];
          
          if (leftAnkle && rightAnkle && leftAnkle.visibility > 0.5 && rightAnkle.visibility > 0.5) {
              const midX = (leftAnkle.x + rightAnkle.x) / 2;
              const midY = (leftAnkle.y + rightAnkle.y) / 2;
              pathRef.current.push({ x: midX, y: midY });
          }

          // 1. Draw Ground Path
          drawPath(ctx);
          
          // 2. Draw Skateboard (Object Detected)
          drawSkateboard(ctx, results.poseLandmarks);

          // 3. Draw Human Skeleton
          drawSkeleton(ctx, results.poseLandmarks);
      }
      ctx.restore();
  };

  const processVideoFrame = async () => {
      if (videoRef.current && pose && !videoRef.current.paused && !videoRef.current.ended) {
          // 1. Send to MediaPipe Pose
          await pose.send({ image: videoRef.current });

          // 2. Send to COCO-SSD (Throttle to every ~100ms or so if needed, but modern browsers handle this okay)
          const now = Date.now();
          if (objectModel && now - lastDetectTimeRef.current > 100) { // 10 FPS for object detection
              try {
                  const predictions = await objectModel.detect(videoRef.current);
                  // Filter for skateboard class
                  const skateboard = predictions.find(p => p.class === 'skateboard');
                  if (skateboard) {
                      detectedBoardRef.current = { bbox: skateboard.bbox, score: skateboard.score };
                  } else {
                      // Decay or clear? If not found, keep last known pos for a few frames or clear
                      // Clearing immediately reduces ghosting
                      detectedBoardRef.current = null;
                  }
                  lastDetectTimeRef.current = now;
              } catch (err) {
                  // Ignore detection errors to prevent crash
              }
          }

          requestRef.current = requestAnimationFrame(processVideoFrame);
      }
  };

  const handleVideoPlay = () => {
      processVideoFrame();
  };

  const handleVideoPause = () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
  };

  const changePlaybackRate = (rate: number) => {
      if (videoRef.current) {
          videoRef.current.playbackRate = rate;
          setPlaybackRate(rate);
      }
  };

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
        setFeedbackSent(false);
        setShowFeedback(false);
        pathRef.current = []; // Reset path history
        detectedBoardRef.current = null;
        
        // Default to Slow Motion for analysis
        setPlaybackRate(0.5);
    }
  };

  const handleAnalyze = async () => {
      if (!file) return;
      setIsAnalyzing(true);
      setError(null);
      setFeedbackSent(false);
      setShowFeedback(false);
      
      try {
          // Pass trickHint and userStance to the service
          const analysis = await analyzeMedia(file, language, trickHint, userStance);
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

  const handleSendFeedback = async () => {
      if (!result) return;
      
      await dbService.saveVisionFeedback(user ? user.uid : null, {
          predictedName: result.trickName,
          predictedHeight: result.heightEstimate,
          actualName: feedbackName || result.trickName,
          actualHeight: feedbackHeight || result.heightEstimate
      });
      setFeedbackSent(true);
      setShowFeedback(false);
  };

  const reset = () => {
      setFile(null);
      setPreviewUrl(null);
      setResult(null);
      setError(null);
      setTrickHint('');
      setShowFeedback(false);
      setFeedbackSent(false);
      setFeedbackName('');
      setFeedbackHeight('');
      pathRef.current = []; // Clear path
      detectedBoardRef.current = null;
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
  };

  // Helper to wait for tracker ready
  useEffect(() => {
     if (previewUrl && isTrackerReady && objectModel) {
         // Auto play video implicitly handled by user clicking play or video controls
     }
  }, [previewUrl, isTrackerReady, objectModel]);

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
                        className="absolute top-4 right-4 z-30 bg-black/50 p-2 rounded-full hover:bg-black/80 text-white"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    
                    {/* Media Container - Matches Aspect Ratio */}
                    <div className="relative w-full aspect-video bg-black flex items-center justify-center overflow-hidden">
                        {file?.type.startsWith('video') ? (
                            <>
                                {/* Video Element */}
                                <video 
                                    ref={videoRef}
                                    src={previewUrl} 
                                    controls={false} 
                                    className="absolute inset-0 w-full h-full object-contain z-10" 
                                    onPlay={handleVideoPlay}
                                    onPause={handleVideoPause}
                                    onLoadedMetadata={() => {
                                        if(videoRef.current) videoRef.current.playbackRate = playbackRate;
                                    }}
                                    loop
                                    playsInline
                                    crossOrigin="anonymous"
                                />
                                {/* Skeleton Overlay Canvas - Matches Video Dimensions via object-contain logic */}
                                <canvas 
                                    ref={canvasRef}
                                    className="absolute inset-0 w-full h-full object-contain z-20 pointer-events-none"
                                />
                                
                                {/* Status Indicator */}
                                <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
                                    {isTrackerReady ? (
                                        <div className="px-3 py-1 bg-black/60 backdrop-blur rounded-full flex items-center space-x-2 border border-skate-neon/30">
                                            <div className="w-2 h-2 bg-skate-neon rounded-full animate-pulse"></div>
                                            <span className="text-[10px] text-white font-bold uppercase tracking-widest">
                                                POSE TRACKING
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="px-3 py-1 bg-black/60 backdrop-blur rounded-full flex items-center space-x-2 border border-white/10">
                                             <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                                             <span className="text-[10px] text-white font-bold uppercase tracking-widest">LOADING POSE...</span>
                                        </div>
                                    )}

                                    {objectModel ? (
                                        <div className="px-3 py-1 bg-black/60 backdrop-blur rounded-full flex items-center space-x-2 border border-blue-400/30">
                                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                                            <span className="text-[10px] text-white font-bold uppercase tracking-widest">
                                                BOARD VISION
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="px-3 py-1 bg-black/60 backdrop-blur rounded-full flex items-center space-x-2 border border-white/10">
                                             <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                                             <span className="text-[10px] text-white font-bold uppercase tracking-widest">LOADING VISION...</span>
                                        </div>
                                    )}
                                </div>

                                {/* Play Button Overlay */}
                                <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-4 z-30 pointer-events-auto">
                                    <button onClick={() => { if(videoRef.current) videoRef.current.paused ? videoRef.current.play() : videoRef.current.pause() }} className="p-3 bg-black/60 rounded-full text-white hover:bg-skate-neon hover:text-black transition-colors backdrop-blur-md">
                                        <Play className="w-6 h-6 fill-current" />
                                    </button>
                                </div>
                            </>
                        ) : (
                            <img src={previewUrl} alt="Preview" className="w-full max-h-[400px] object-contain" />
                        )}
                    </div>

                    {/* Analyzing Overlay */}
                    {isAnalyzing && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-40">
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

                {/* Video Controls (Speed) */}
                {file?.type.startsWith('video') && (
                    <div className="flex justify-center items-center space-x-2 bg-white/5 p-2 rounded-2xl w-fit mx-auto border border-white/5">
                        <Video className="w-4 h-4 text-gray-500 mr-2" />
                        {[0.25, 0.5, 1.0].map(rate => (
                            <button
                                key={rate}
                                onClick={() => changePlaybackRate(rate)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all ${
                                    playbackRate === rate 
                                    ? 'bg-skate-neon text-black border-skate-neon shadow-[0_0_10px_rgba(204,255,0,0.3)]' 
                                    : 'bg-black/20 text-gray-400 border-transparent hover:bg-white/10'
                                }`}
                            >
                                {rate}x
                            </button>
                        ))}
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="bg-red-500/10 border border-red-500/50 p-4 rounded-xl flex items-center space-x-3 text-red-400">
                        <AlertTriangle className="w-5 h-5" />
                        <span className="text-sm font-bold">{error}</span>
                    </div>
                )}

                {/* ACTION AREA: Input & Button */}
                {!result && !isAnalyzing && (
                    <div className="space-y-4">
                        {/* Stance Selector */}
                        <div className="glass-card p-4 rounded-2xl border border-white/10">
                            <div className="flex items-center space-x-2 mb-3 text-gray-400">
                                <Footprints className="w-4 h-4" />
                                <span className="text-xs font-bold uppercase tracking-widest">{t.SELECT_YOUR_STANCE}</span>
                            </div>
                            <div className="flex gap-2 mb-2">
                                <button
                                    onClick={() => setUserStance('Regular')}
                                    className={`flex-1 py-3 rounded-xl font-bold uppercase text-sm border transition-all ${
                                        userStance === 'Regular'
                                        ? 'bg-skate-neon text-black border-skate-neon shadow-[0_0_10px_rgba(204,255,0,0.3)]'
                                        : 'bg-black/40 text-gray-500 border-white/10 hover:bg-white/5'
                                    }`}
                                >
                                    Regular (Left)
                                </button>
                                <button
                                    onClick={() => setUserStance('Goofy')}
                                    className={`flex-1 py-3 rounded-xl font-bold uppercase text-sm border transition-all ${
                                        userStance === 'Goofy'
                                        ? 'bg-skate-neon text-black border-skate-neon shadow-[0_0_10px_rgba(204,255,0,0.3)]'
                                        : 'bg-black/40 text-gray-500 border-white/10 hover:bg-white/5'
                                    }`}
                                >
                                    Goofy (Right)
                                </button>
                            </div>
                            <p className="text-[10px] text-gray-500 leading-tight">
                                {t.SELECT_STANCE_DESC}
                            </p>
                        </div>

                        {/* Trick Name Input & Disclaimer */}
                        <div className="glass-card p-4 rounded-2xl border border-white/10">
                            <div className="flex items-center space-x-2 mb-2 text-gray-400">
                                <Edit2 className="w-4 h-4" />
                                <span className="text-xs font-bold uppercase tracking-widest">{t.ENTER_TRICK_NAME}</span>
                            </div>
                            <input 
                                type="text" 
                                value={trickHint}
                                onChange={(e) => setTrickHint(e.target.value)}
                                placeholder="e.g. Kickflip, Hardflip..."
                                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white text-sm focus:border-skate-neon outline-none placeholder-gray-600 mb-2"
                            />
                            <div className="flex items-start space-x-2">
                                <AlertTriangle className="w-3 h-3 text-yellow-500 mt-0.5 flex-shrink-0" />
                                <p className="text-[10px] text-gray-500 leading-tight">
                                    {t.TRICK_NAME_DESC}
                                </p>
                            </div>
                        </div>

                        <button 
                            onClick={handleAnalyze}
                            className="w-full py-4 bg-skate-neon text-black rounded-2xl font-display text-2xl font-bold uppercase tracking-wider hover:bg-skate-neonHover transition-all shadow-[0_0_20px_rgba(204,255,0,0.3)] active:scale-95 flex items-center justify-center space-x-2"
                        >
                            <Zap className="w-5 h-5 fill-black" />
                            <span>{t.ANALYZE_TRICK}</span>
                        </button>
                    </div>
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

                        {/* Feedback Section */}
                        <div className="mt-4 pt-4 border-t border-white/5">
                            {!feedbackSent ? (
                                !showFeedback ? (
                                    <button 
                                        onClick={() => setShowFeedback(true)}
                                        className="text-xs text-gray-500 hover:text-white transition-colors flex items-center space-x-1 mx-auto"
                                    >
                                        <HelpCircle className="w-3 h-3" />
                                        <span>{t.WRONG_ANALYSIS}</span>
                                    </button>
                                ) : (
                                    <div className="bg-white/5 p-4 rounded-xl animate-fade-in space-y-3">
                                        <p className="text-xs font-bold text-gray-400">{t.PROVIDE_FEEDBACK}</p>
                                        
                                        <div className="space-y-2">
                                            {/* Correct Trick Name */}
                                            <div>
                                                <label className="text-[10px] text-gray-500 uppercase font-bold mb-1 block">{t.ACTUAL_TRICK_NAME}</label>
                                                <input 
                                                    type="text" 
                                                    value={feedbackName}
                                                    onChange={(e) => setFeedbackName(e.target.value)}
                                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-skate-neon outline-none"
                                                    placeholder={result.trickName}
                                                />
                                            </div>
                                            
                                            {/* Correct Height */}
                                            <div>
                                                 <label className="text-[10px] text-gray-500 uppercase font-bold mb-1 block flex items-center">
                                                     <Ruler className="w-3 h-3 mr-1" />
                                                     {t.ACTUAL_HEIGHT}
                                                 </label>
                                                 <input 
                                                    type="text" 
                                                    value={feedbackHeight}
                                                    onChange={(e) => setFeedbackHeight(e.target.value)}
                                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-skate-neon outline-none"
                                                    placeholder={result.heightEstimate}
                                                />
                                            </div>
                                        </div>

                                        <button 
                                            onClick={handleSendFeedback}
                                            className="w-full py-3 bg-skate-neon text-black text-xs font-bold rounded-lg hover:bg-skate-neonHover shadow-lg mt-2"
                                        >
                                            {t.SEND_FEEDBACK}
                                        </button>
                                    </div>
                                )
                            ) : (
                                <div className="flex items-center justify-center space-x-2 text-green-400 py-2">
                                    <CheckCircle className="w-4 h-4" />
                                    <span className="text-xs font-bold">{t.FEEDBACK_THANKS}</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        )}
    </div>
  );
};

export default AIVision;
