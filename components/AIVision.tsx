import React, { useState, useRef, useEffect } from 'react';
import { Language, User, VisionAnalysis } from '../types';
import { TRANSLATIONS } from '../constants';
import { Upload, Zap, Play, X, Eye, Video, FileVideo, Activity } from 'lucide-react';
import { generateCoachingFeedback } from '../services/geminiService';
import { dbService } from '../services/dbService';
// @ts-ignore
import mpPose from '@mediapipe/pose';

const POSE_CONNECTIONS = [
  [11, 12], [11, 13], [13, 15], [12, 14], [14, 16], [11, 23], [12, 24], 
  [23, 24], [23, 25], [24, 26], [25, 27], [26, 28], [27, 29], [28, 30], 
  [29, 31], [30, 32], [27, 31], [28, 32]
];

interface Props {
  language: Language;
  user: User | null;
}

// --- ADVANCED BOARD TRACKER (ROI + PCA + PHYSICS) ---
class BoardTracker {
    colorMean: [number, number, number] = [0, 0, 0];
    isCalibrated = false;
    
    // Physics State
    pos: { x: number, y: number } = { x: 0, y: 0 };
    velocity: { x: number, y: number } = { x: 0, y: 0 };
    angle: number = 0;
    
    // History for smoothing
    history: { x: number, y: number }[] = [];

    constructor() {
        this.reset();
    }

    reset() {
        this.colorMean = [0, 0, 0];
        this.isCalibrated = false;
        this.pos = { x: 0, y: 0 };
        this.velocity = { x: 0, y: 0 };
        this.angle = 0;
        this.history = [];
    }

    calibrate(ctx: CanvasRenderingContext2D, width: number, height: number, leftFoot: any, rightFoot: any) {
        if (!leftFoot || !rightFoot) return;
        
        // Sample area strictly between feet + slight offset down
        const lx = leftFoot.x * width;
        const ly = leftFoot.y * height;
        const rx = rightFoot.x * width;
        const ry = rightFoot.y * height;
        
        const centerX = (lx + rx) / 2;
        const centerY = Math.max(ly, ry) + (height * 0.02); // Slightly below ankles
        const sampleSize = 40; // 40x40 pixel box

        try {
            const frame = ctx.getImageData(centerX - sampleSize/2, centerY - sampleSize/2, sampleSize, sampleSize);
            const data = frame.data;
            let r = 0, g = 0, b = 0, count = 0;

            for (let i = 0; i < data.length; i += 4) {
                r += data[i];
                g += data[i + 1];
                b += data[i + 2];
                count++;
            }
            
            this.colorMean = [r / count, g / count, b / count];
            this.isCalibrated = true;
            this.pos = { x: centerX, y: centerY };
        } catch (e) {
            console.error("Calibration failed", e);
        }
    }

    track(ctx: CanvasRenderingContext2D, width: number, height: number, leftAnkle: any, rightAnkle: any): { x: number, y: number, angle: number, confidence: number } | null {
        if (!this.isCalibrated) return null;

        let feetCenter = null;
        if (leftAnkle && rightAnkle && leftAnkle.visibility > 0.5 && rightAnkle.visibility > 0.5) {
             const fx = ((leftAnkle.x + rightAnkle.x) / 2) * width;
             const fy = ((leftAnkle.y + rightAnkle.y) / 2) * height;
             // Board is usually just below the midpoint of feet
             feetCenter = { x: fx, y: fy + (height * 0.04) };
        }

        // 1. Prediction & ROI
        let roiX = this.pos.x + this.velocity.x;
        let roiY = this.pos.y + this.velocity.y;
        
        // HEURISTIC: If feet are clear, bias the search heavily towards feet
        // This ensures "track near person" behavior
        if (feetCenter) {
             // 70% physics, 30% feet pull (keeps it tethered)
             roiX = roiX * 0.7 + feetCenter.x * 0.3;
             roiY = roiY * 0.7 + feetCenter.y * 0.3;
        }

        const roiW = 160; // Tighter search window
        const roiH = 120;
        
        const startX = Math.max(0, Math.min(width - roiW, roiX - roiW / 2));
        const startY = Math.max(0, Math.min(height - roiH, roiY - roiH / 2));

        const frame = ctx.getImageData(startX, startY, roiW, roiH);
        const data = frame.data;
        
        // PCA Variables
        let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
        let pixelCount = 0;
        const threshold = 50; // slightly wider color tolerance

        const [Tr, Tg, Tb] = this.colorMean;

        // Efficient Scan
        for (let y = 0; y < roiH; y += 4) { 
            for (let x = 0; x < roiW; x += 4) {
                const idx = (y * roiW + x) * 4;
                const r = data[idx];
                const g = data[idx + 1];
                const b = data[idx + 2];

                const dist = Math.sqrt((r - Tr) ** 2 + (g - Tg) ** 2 + (b - Tb) ** 2);

                if (dist < threshold) {
                    const absX = startX + x;
                    const absY = startY + y;
                    
                    sumX += absX;
                    sumY += absY;
                    sumX2 += absX * absX;
                    sumY2 += absY * absY;
                    sumXY += absX * absY;
                    pixelCount++;
                }
            }
        }

        // 2. Update Logic
        if (pixelCount > 8) {
            // Found candidate position
            const meanX = sumX / pixelCount;
            const meanY = sumY / pixelCount;

            // SAFETY CHECK: Maximum Velocity Constraint
            // If the board "teleports" more than 10% of screen width in 1 frame, ignore it.
            const jumpDist = Math.sqrt(Math.pow(meanX - this.pos.x, 2) + Math.pow(meanY - this.pos.y, 2));
            const maxJump = width * 0.15;

            if (jumpDist < maxJump) {
                // Update Velocity (Current - Last)
                this.velocity = {
                    x: (meanX - this.pos.x) * 0.8, // Smoothing velocity
                    y: (meanY - this.pos.y) * 0.8
                };

                this.pos = { x: meanX, y: meanY };

                // PCA for Rotation
                const varX = (sumX2 / pixelCount) - (meanX * meanX);
                const varY = (sumY2 / pixelCount) - (meanY * meanY);
                const covXY = (sumXY / pixelCount) - (meanX * meanY);
                
                // Calculate angle
                const newAngle = 0.5 * Math.atan2(2 * covXY, varX - varY);
                // Stronger smoothing on angle
                this.angle = this.angle * 0.6 + newAngle * 0.4;
            } else {
                 // Detected jump was too huge, ignore this frame, use momentum
                 this.pos.x += this.velocity.x;
                 this.pos.y += this.velocity.y;
            }

        } else {
            // Lost Tracking -> FALLBACK LOGIC
            
            if (feetCenter) {
                // If we know where feet are, drift towards them!
                // This forces the board to "re-attach" to the skater if tracking is lost mid-flip
                const driftSpeed = 0.1;
                this.pos.x = this.pos.x * (1 - driftSpeed) + feetCenter.x * driftSpeed;
                this.pos.y = this.pos.y * (1 - driftSpeed) + feetCenter.y * driftSpeed;
                
                // Dampen velocity to prevent shooting off
                this.velocity.x *= 0.8;
                this.velocity.y *= 0.8;
            } else {
                // Completely lost and no feet? Just friction stop.
                this.velocity.x *= 0.9;
                this.velocity.y *= 0.9;
                this.pos.x += this.velocity.x;
                this.pos.y += this.velocity.y;
            }
        }

        // Bounds Check
        this.pos.x = Math.max(0, Math.min(width, this.pos.x));
        this.pos.y = Math.max(0, Math.min(height, this.pos.y));

        this.history.push({ ...this.pos });
        if (this.history.length > 40) this.history.shift();

        return { x: this.pos.x, y: this.pos.y, angle: this.angle, confidence: Math.min(1, pixelCount / 50) };
    }
}

const AIVision: React.FC<Props> = ({ language, user }) => {
  const t = TRANSLATIONS[language];
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<VisionAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [userStance, setUserStance] = useState<'Regular' | 'Goofy'>('Regular');
  const [trickNameInput, setTrickNameInput] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const poseRef = useRef<any>(null);
  const boardTrackerRef = useRef<BoardTracker>(new BoardTracker());
  const requestRef = useRef<number>();
  const statsRef = useRef({ maxHeight: 0, rotationAccumulator: 0, frameCount: 0 });

  useEffect(() => {
    const initPose = async () => {
        try {
            const pose = new mpPose.Pose({
                locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
            });
            pose.setOptions({
                modelComplexity: 1,
                smoothLandmarks: true,
                minDetectionConfidence: 0.5,
                minTrackingConfidence: 0.5,
            });
            pose.onResults(onPoseResults);
            poseRef.current = pose;
        } catch (e) {
            console.error("Failed to load Pose", e);
            setError("Failed to load AI models. Please refresh.");
        }
    };
    initPose();
    return () => {
        if (poseRef.current) poseRef.current.close();
        cancelAnimationFrame(requestRef.current!);
    };
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
        if (selectedFile.size > 50 * 1024 * 1024) {
            setError(t.FILE_TOO_LARGE);
            return;
        }
        setFile(selectedFile);
        const url = URL.createObjectURL(selectedFile);
        setPreviewUrl(url);
        setResult(null);
        setError(null);
        boardTrackerRef.current.reset();
        statsRef.current = { maxHeight: 0, rotationAccumulator: 0, frameCount: 0 };
    }
  };

  const startAnalysis = () => {
      if (!videoRef.current || !poseRef.current) return;
      setIsAnalyzing(true);
      setError(null);
      
      const video = videoRef.current;
      video.currentTime = 0;
      video.playbackRate = 0.5;
      video.play();
      
      processFrame();
  };

  const processFrame = async () => {
      if (!videoRef.current || !canvasRef.current || !poseRef.current) return;
      const video = videoRef.current;
      
      if (video.paused || video.ended) {
          if (video.ended) completeAnalysis();
          return;
      }

      await poseRef.current.send({ image: video });
      requestRef.current = requestAnimationFrame(processFrame);
  };

  const onPoseResults = (results: any) => {
      if (!canvasRef.current || !videoRef.current) return;
      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) return;
      
      const width = canvasRef.current.width;
      const height = canvasRef.current.height;

      ctx.save();
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(results.image, 0, 0, width, height);

      let leftAnkle = null;
      let rightAnkle = null;

      if (results.poseLandmarks) {
          drawSkeleton(ctx, results.poseLandmarks, width, height);
          
          leftAnkle = results.poseLandmarks[27];
          rightAnkle = results.poseLandmarks[28];

          if (!boardTrackerRef.current.isCalibrated && statsRef.current.frameCount < 15) {
             boardTrackerRef.current.calibrate(ctx, width, height, leftAnkle, rightAnkle);
          }

          const hipY = (results.poseLandmarks[23].y + results.poseLandmarks[24].y) / 2;
          const currentHeight = (1 - hipY); 
          if (currentHeight > statsRef.current.maxHeight) {
              statsRef.current.maxHeight = currentHeight;
          }
      }

      // Track Board using ROI logic
      const board = boardTrackerRef.current.track(ctx, width, height, leftAnkle, rightAnkle);
      if (board) {
          drawBoardVisuals(ctx, board);
      }

      ctx.restore();
      statsRef.current.frameCount++;
  };

  const drawSkeleton = (ctx: CanvasRenderingContext2D, landmarks: any[], w: number, h: number) => {
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#E3FF37'; 
      ctx.fillStyle = '#FFFFFF';

      POSE_CONNECTIONS.forEach(([i, j]) => {
          const p1 = landmarks[i];
          const p2 = landmarks[j];
          if (p1 && p2 && p1.visibility > 0.5 && p2.visibility > 0.5) {
              ctx.beginPath();
              ctx.moveTo(p1.x * w, p1.y * h);
              ctx.lineTo(p2.x * w, p2.y * h);
              ctx.stroke();
          }
      });

      landmarks.forEach((lm) => {
          if (lm.visibility > 0.5) {
              ctx.beginPath();
              ctx.arc(lm.x * w, lm.y * h, 4, 0, 2 * Math.PI);
              ctx.fill();
          }
      });
  };

  const drawBoardVisuals = (ctx: CanvasRenderingContext2D, board: {x: number, y: number, angle: number}) => {
      ctx.save();
      ctx.translate(board.x, board.y);
      ctx.rotate(board.angle);

      // --- IMPROVED VISUALS: DECK + WHEELS ---
      
      const deckLen = 120; // Length pixels
      const deckWid = 32;  // Width pixels
      
      // 1. Deck (Rect)
      ctx.fillStyle = 'rgba(0, 255, 255, 0.2)'; // Cyan transparent fill
      ctx.strokeStyle = '#00FFFF'; // Cyan border
      ctx.lineWidth = 3;
      
      ctx.beginPath();
      ctx.roundRect(-deckLen/2, -deckWid/2, deckLen, deckWid, 10);
      ctx.fill();
      ctx.stroke();

      // 2. Trucks & Wheels
      const truckX = deckLen * 0.3; // Distance from center
      const wheelOut = deckWid * 0.7; // Width out from center

      ctx.fillStyle = '#FFFFFF'; // White Wheels
      const wheelR = 6;

      // Draw 4 Wheels
      // Front Left
      ctx.beginPath(); ctx.arc(truckX, -wheelOut, wheelR, 0, Math.PI*2); ctx.fill();
      // Front Right
      ctx.beginPath(); ctx.arc(truckX, wheelOut, wheelR, 0, Math.PI*2); ctx.fill();
      // Back Left
      ctx.beginPath(); ctx.arc(-truckX, -wheelOut, wheelR, 0, Math.PI*2); ctx.fill();
      // Back Right
      ctx.beginPath(); ctx.arc(-truckX, wheelOut, wheelR, 0, Math.PI*2); ctx.fill();

      // 3. Nose/Tail Indicators
      ctx.fillStyle = '#FF00FF'; // Magenta dot for nose/tail
      ctx.beginPath(); ctx.arc(deckLen/2, 0, 4, 0, Math.PI*2); ctx.fill(); // Front
      ctx.beginPath(); ctx.arc(-deckLen/2, 0, 4, 0, Math.PI*2); ctx.fill(); // Back

      ctx.restore();

      // 4. Trajectory Path
      ctx.strokeStyle = 'rgba(255, 100, 0, 0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      boardTrackerRef.current.history.forEach((pt, i) => {
          if (i === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
      });
      ctx.stroke();
  };

  const completeAnalysis = async () => {
      setIsAnalyzing(false);
      
      const estimatedHeightM = Math.max(0, (statsRef.current.maxHeight - 0.4) * 2).toFixed(2);
      
      const analysisData: VisionAnalysis = {
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          trickName: trickNameInput || "Ollie (Detected)",
          isLanded: true, 
          confidence: 0.85,
          score: Math.min(100, Math.floor(statsRef.current.maxHeight * 150)), 
          heightMeters: parseFloat(estimatedHeightM),
          rotationDegrees: 0,
          feedbackText: "",
          improvementTip: ""
      };

      const feedback = await generateCoachingFeedback(analysisData, language);
      analysisData.feedbackText = feedback.feedback;
      analysisData.improvementTip = feedback.tips;

      setResult(analysisData);

      if (user) {
          await dbService.saveAnalysisResult(user.uid, analysisData);
      }
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      alert(t.FEEDBACK_THANKS);
  };

  return (
    <div className="flex flex-col h-full p-6 pb-32 overflow-y-auto animate-fade-in relative bg-black">
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
                    Select a video clip (Max 50MB). Side view is best.
                </p>
            </div>
        ) : (
            <div className="flex flex-col space-y-6">
                <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-black aspect-video">
                    <button 
                        onClick={() => { setPreviewUrl(null); setResult(null); }}
                        className="absolute top-4 right-4 z-30 bg-black/50 p-2 rounded-full hover:bg-black/80 text-white"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    
                    <video 
                        ref={videoRef}
                        src={previewUrl} 
                        className="absolute inset-0 w-full h-full object-contain opacity-0" 
                        muted
                        playsInline
                        crossOrigin="anonymous"
                        onLoadedMetadata={() => {
                            if(canvasRef.current && videoRef.current) {
                                canvasRef.current.width = videoRef.current.videoWidth;
                                canvasRef.current.height = videoRef.current.videoHeight;
                            }
                        }}
                    />
                    <canvas 
                        ref={canvasRef}
                        className="absolute inset-0 w-full h-full object-contain bg-black"
                    />

                    {!isAnalyzing && !result && (
                         <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <Play className="w-16 h-16 text-white/50" />
                         </div>
                    )}
                </div>

                {!result && !isAnalyzing && (
                    <div className="glass-card p-5 rounded-2xl space-y-4">
                        <div>
                             <label className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-2 block">{t.SELECT_YOUR_STANCE}</label>
                             <div className="flex gap-2">
                                 {['Regular', 'Goofy'].map(s => (
                                     <button 
                                        key={s}
                                        onClick={() => setUserStance(s as 'Regular' | 'Goofy')}
                                        className={`flex-1 py-3 rounded-xl font-bold uppercase text-xs transition-all ${userStance === s ? 'bg-skate-neon text-black' : 'bg-white/5 text-gray-400'}`}
                                     >
                                         {/* @ts-ignore */}
                                         {t[s] || s}
                                     </button>
                                 ))}
                             </div>
                        </div>

                        <div>
                             <label className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-2 block">{t.ENTER_TRICK_NAME}</label>
                             <input 
                                type="text"
                                value={trickNameInput}
                                onChange={(e) => setTrickNameInput(e.target.value)}
                                placeholder="e.g. Kickflip"
                                className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white text-sm focus:border-skate-neon outline-none"
                             />
                             <p className="text-[10px] text-gray-500 mt-1">{t.TRICK_NAME_DESC}</p>
                        </div>

                        <button 
                            onClick={startAnalysis}
                            className="w-full py-4 bg-white text-black rounded-2xl font-display text-2xl font-bold uppercase tracking-wider hover:bg-gray-200 transition-all flex items-center justify-center space-x-2"
                        >
                            <Zap className="w-5 h-5 fill-black" />
                            <span>{t.ANALYZE_TRICK}</span>
                        </button>
                    </div>
                )}
                
                {isAnalyzing && (
                    <div className="text-center p-4">
                        <Activity className="w-8 h-8 text-skate-neon mx-auto mb-2 animate-spin" />
                        <p className="text-skate-neon font-bold uppercase animate-pulse">{t.ANALYZING_MEDIA}</p>
                        <p className="text-xs text-gray-500 mt-1">{t.TRACKING_BOARD}</p>
                    </div>
                )}

                {result && (
                    <div className="space-y-4 animate-slide-up">
                        <div className="glass-card p-6 rounded-3xl border border-skate-neon/30 relative overflow-hidden">
                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-skate-neon text-[10px] font-bold uppercase tracking-[0.2em] block">AI ANALYSIS</span>
                                    <span className="bg-green-500/20 text-green-400 text-xs font-bold px-2 py-1 rounded-lg border border-green-500/30">SUCCESS</span>
                                </div>
                                <h3 className="text-4xl font-display font-bold text-white mb-4">{result.trickName}</h3>
                                
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-white/5 px-4 py-3 rounded-xl border border-white/5">
                                        <span className="block text-[10px] text-gray-500 uppercase font-bold mb-1">{t.FORM_SCORE}</span>
                                        <div className="flex items-baseline">
                                            <span className="text-3xl font-display font-bold text-skate-neon">{result.score}</span>
                                            <span className="text-gray-500 text-sm">/100</span>
                                        </div>
                                    </div>
                                    <div className="bg-white/5 px-4 py-3 rounded-xl border border-white/5">
                                        <span className="block text-[10px] text-gray-500 uppercase font-bold mb-1">{t.HEIGHT_EST}</span>
                                        <div className="flex items-baseline">
                                            <span className="text-3xl font-display font-bold text-white">{Math.round(result.heightMeters * 100)}</span>
                                            <span className="text-gray-500 text-sm">cm</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-skate-neon/10 to-transparent p-5 rounded-2xl border border-skate-neon/20">
                            <h4 className="text-skate-neon text-[10px] font-bold uppercase tracking-widest mb-3 flex items-center">
                                <Zap className="w-3 h-3 mr-1 fill-skate-neon" />
                                {t.IMPROVEMENT_TIP}
                            </h4>
                            <p className="text-white text-sm font-medium leading-relaxed mb-4">
                                {result.feedbackText}
                            </p>
                            {result.improvementTip && (
                                <div className="bg-black/40 p-3 rounded-xl border border-white/5">
                                    <p className="text-xs text-gray-300">
                                        <strong className="text-skate-neon block mb-1">TIP:</strong>
                                        {result.improvementTip}
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="p-4 rounded-2xl bg-white/5">
                            <h4 className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-3">{t.WRONG_ANALYSIS}</h4>
                            <form onSubmit={handleFeedbackSubmit} className="space-y-3">
                                <input type="text" placeholder={t.ACTUAL_TRICK_NAME} className="w-full bg-black border border-white/10 rounded-lg p-2 text-xs text-white" />
                                <button type="submit" className="w-full py-2 bg-white/10 text-white rounded-lg text-xs font-bold hover:bg-white/20 transition-colors">
                                    {t.SEND_FEEDBACK}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        )}
    </div>
  );
};

export default AIVision;