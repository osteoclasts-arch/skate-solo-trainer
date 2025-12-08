
import React, { useState, useRef, useEffect } from 'react';
import { Language, User, VisionAnalysis } from '../types';
import { TRANSLATIONS } from '../constants';
import { Upload, Zap, Play, Pause, X, Eye, Video, FileVideo, Activity, Info, Camera, Box, AlertTriangle, Clock, FastForward, Rewind } from 'lucide-react';
import { analyzeMedia } from '../services/geminiService';
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

// --- OBSTACLE TRACKER (Cones/Ledges) ---
class ObstacleTracker {
    detectedObstacles: { type: string, x: number, y: number, w: number, h: number }[] = [];
    frameCount = 0;

    scan(ctx: CanvasRenderingContext2D, width: number, height: number) {
        // Run scan only every 15 frames to save performance
        if (this.frameCount % 15 !== 0) {
            this.frameCount++;
            return this.detectedObstacles;
        }

        const roiH = height * 0.4; // Only scan bottom 40%
        const startY = height - roiH;
        
        try {
            const frame = ctx.getImageData(0, startY, width, roiH);
            const data = frame.data;
            const obstacles = [];

            // Simple Color-based Detection for Orange Traffic Cones
            let orangePixelsX = 0;
            let orangePixelsY = 0;
            let orangeCount = 0;
            let minX = width, maxX = 0, minY = height, maxY = 0;

            for (let i = 0; i < data.length; i += 16) { // Skip pixels for speed
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];

                // Orange-ish / Red-ish check
                if (r > 150 && g > 50 && g < 180 && b < 100 && r > g + 40) {
                    const idx = i / 4;
                    const x = idx % width;
                    const y = startY + Math.floor(idx / width);

                    orangePixelsX += x;
                    orangePixelsY += y;
                    orangeCount++;

                    if (x < minX) minX = x;
                    if (x > maxX) maxX = x;
                    if (y < minY) minY = y;
                    if (y > maxY) maxY = y;
                }
            }

            if (orangeCount > 100) { // Threshold size
                obstacles.push({
                    type: 'Cone',
                    x: minX,
                    y: minY,
                    w: maxX - minX,
                    h: maxY - minY
                });
            }
            
            this.detectedObstacles = obstacles;

        } catch (e) {
            console.error("Obstacle scan failed", e);
        }
        
        this.frameCount++;
        return this.detectedObstacles;
    }
}

// --- ADVANCED BOARD TRACKER (OBB + PHYSICS) ---
class BoardTracker {
    colorMean: [number, number, number] = [0, 0, 0];
    isCalibrated = false;
    
    // Physics State
    pos: { x: number, y: number } = { x: 0, y: 0 };
    velocity: { x: number, y: number } = { x: 0, y: 0 };
    angle: number = 0;
    
    // OBB (Oriented Bounding Box) Dimensions
    dimensions = { length: 100, width: 30 }; // default pixels
    
    // History for smoothing path
    history: { x: number, y: number }[] = [];

    // --- PHYSICS METRICS FOR AI ---
    metrics = {
        minWidth: Infinity,
        maxWidth: 0,
        minLength: Infinity,
        maxLength: 0,
        maxAngleChange: 0,
        airTimeFrames: 0
    };

    constructor() {
        this.reset();
    }

    reset() {
        this.colorMean = [0, 0, 0];
        this.isCalibrated = false;
        this.pos = { x: 0, y: 0 };
        this.velocity = { x: 0, y: 0 };
        this.angle = 0;
        this.dimensions = { length: 100, width: 30 };
        this.history = [];
        this.metrics = {
            minWidth: Infinity, maxWidth: 0,
            minLength: Infinity, maxLength: 0,
            maxAngleChange: 0, airTimeFrames: 0
        };
    }

    // 1. Calibration: Learn the board color from between the feet
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
            // Check bounds
            if (centerX < 0 || centerX > width || centerY < 0 || centerY > height) return;

            const frame = ctx.getImageData(
                Math.max(0, centerX - sampleSize/2), 
                Math.max(0, centerY - sampleSize/2), 
                sampleSize, 
                sampleSize
            );
            const data = frame.data;
            let r = 0, g = 0, b = 0, count = 0;

            for (let i = 0; i < data.length; i += 4) {
                r += data[i];
                g += data[i + 1];
                b += data[i + 2];
                count++;
            }
            
            if (count > 0) {
                this.colorMean = [r / count, g / count, b / count];
                this.isCalibrated = true;
                this.pos = { x: centerX, y: centerY };
                // Reset metrics on calibration
                this.metrics = {
                    minWidth: Infinity, maxWidth: 0,
                    minLength: Infinity, maxLength: 0,
                    maxAngleChange: 0, airTimeFrames: 0
                };
            }
        } catch (e) {
            console.error("Calibration failed", e);
        }
    }

    // 2. Tracking: Find the board in the frame
    track(ctx: CanvasRenderingContext2D, width: number, height: number, leftAnkle: any, rightAnkle: any) {
        if (!this.isCalibrated) return null;

        // Calculate Feet Center (Gravity Anchor)
        let feetCenter = null;
        if (leftAnkle && rightAnkle && leftAnkle.visibility > 0.5 && rightAnkle.visibility > 0.5) {
             const fx = ((leftAnkle.x + rightAnkle.x) / 2) * width;
             const fy = ((leftAnkle.y + rightAnkle.y) / 2) * height;
             feetCenter = { x: fx, y: fy + (height * 0.04) };
        }

        // Define Region of Interest (ROI)
        let roiX = this.pos.x + this.velocity.x;
        let roiY = this.pos.y + this.velocity.y;
        
        if (feetCenter) {
             const distToFeet = Math.hypot(roiX - feetCenter.x, roiY - feetCenter.y);
             // Tighter constraint: Board rarely flies > 30% of screen width away from feet
             if (distToFeet < width * 0.3) {
                 roiX = roiX * 0.7 + feetCenter.x * 0.3;
                 roiY = roiY * 0.7 + feetCenter.y * 0.3;
             }
        }

        const roiW = 200; // Search window size
        const roiH = 150;
        const startX = Math.max(0, Math.min(width - roiW, roiX - roiW / 2));
        const startY = Math.max(0, Math.min(height - roiH, roiY - roiH / 2));
        const frame = ctx.getImageData(startX, startY, roiW, roiH);
        const data = frame.data;
        
        let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
        let pixelCount = 0;
        const pixels: {x: number, y: number}[] = [];
        const threshold = 45;
        const [Tr, Tg, Tb] = this.colorMean;
        const step = 2;

        for (let y = 0; y < roiH; y += step) { 
            for (let x = 0; x < roiW; x += step) {
                const idx = (y * roiW + x) * 4;
                const r = data[idx];
                const g = data[idx + 1];
                const b = data[idx + 2];
                const dist = Math.abs(r - Tr) + Math.abs(g - Tg) + Math.abs(b - Tb);

                if (dist < threshold * 3) {
                    const absX = startX + x;
                    const absY = startY + y;
                    sumX += absX; sumY += absY;
                    sumX2 += absX * absX; sumY2 += absY * absY;
                    sumXY += absX * absY;
                    pixels.push({x: absX, y: absY});
                    pixelCount++;
                }
            }
        }

        if (pixelCount > 20) {
            const meanX = sumX / pixelCount;
            const meanY = sumY / pixelCount;

            this.velocity = {
                x: (meanX - this.pos.x) * 0.7 + this.velocity.x * 0.3,
                y: (meanY - this.pos.y) * 0.7 + this.velocity.y * 0.3
            };
            this.pos = { x: meanX, y: meanY };

            // PCA for Angle
            const varX = (sumX2 / pixelCount) - (meanX * meanX);
            const varY = (sumY2 / pixelCount) - (meanY * meanY);
            const covXY = (sumXY / pixelCount) - (meanX * meanY);
            const rawAngle = 0.5 * Math.atan2(2 * covXY, varX - varY);
            
            let deltaAngle = rawAngle - this.angle;
            while (deltaAngle <= -Math.PI/2) deltaAngle += Math.PI;
            while (deltaAngle > Math.PI/2) deltaAngle -= Math.PI;
            this.angle += deltaAngle * 0.5;

            // OBB Calculation
            let minU = Infinity, maxU = -Infinity; // Length
            let minV = Infinity, maxV = -Infinity; // Width (Thickness)
            const cos = Math.cos(-this.angle);
            const sin = Math.sin(-this.angle);

            for (let p of pixels) {
                const dx = p.x - meanX;
                const dy = p.y - meanY;
                const u = dx * cos - dy * sin;
                const v = dx * sin + dy * cos;
                if (u < minU) minU = u; if (u > maxU) maxU = u;
                if (v < minV) minV = v; if (v > maxV) maxV = v;
            }

            const measuredLength = (maxU - minU) || 100;
            const measuredWidth = (maxV - minV) || 30;
            
            this.dimensions.length = this.dimensions.length * 0.8 + measuredLength * 0.2;
            this.dimensions.width = this.dimensions.width * 0.8 + measuredWidth * 0.2;

            // --- COLLECT PHYSICS METRICS ---
            // Only collect if the board is significantly off the ground (Airtime)
            if (feetCenter && this.pos.y < (height * 0.9)) { 
                this.metrics.airTimeFrames++;
                if (measuredWidth > this.metrics.maxWidth) this.metrics.maxWidth = measuredWidth;
                if (measuredWidth < this.metrics.minWidth) this.metrics.minWidth = measuredWidth;
                if (measuredLength > this.metrics.maxLength) this.metrics.maxLength = measuredLength;
                if (measuredLength < this.metrics.minLength) this.metrics.minLength = measuredLength;
            }

        } else {
            // LOST state handling
            if (feetCenter) {
                // If lost, pull towards feet strongly
                const drift = 0.2;
                this.pos.x = this.pos.x * (1 - drift) + feetCenter.x * drift;
                this.pos.y = this.pos.y * (1 - drift) + feetCenter.y * drift;
                this.velocity.x *= 0.5;
                this.velocity.y *= 0.5;
            } else {
                this.velocity.x *= 0.9; 
                this.velocity.y += 0.5; // Gravity
                this.pos.x += this.velocity.x;
                this.pos.y += this.velocity.y;
            }
        }

        // Clamp to screen
        this.pos.x = Math.max(0, Math.min(width, this.pos.x));
        this.pos.y = Math.max(0, Math.min(height, this.pos.y));

        this.history.push({ ...this.pos });
        if (this.history.length > 30) this.history.shift();

        return { 
            x: this.pos.x, 
            y: this.pos.y, 
            angle: this.angle,
            length: this.dimensions.length,
            width: this.dimensions.width,
            confidence: Math.min(1, pixelCount / 20) 
        };
    }
}

const AIVision: React.FC<Props> = ({ language, user }) => {
  const t = TRANSLATIONS[language];
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<VisionAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Video Controls State
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(0.5); // Default slow motion for analysis

  const [userStance, setUserStance] = useState<'Regular' | 'Goofy'>('Regular');
  const [userContext, setUserContext] = useState<string[]>([]);
  const [trickNameInput, setTrickNameInput] = useState("");
  const [manualCorrection, setManualCorrection] = useState("");
  const [detectedObstacleName, setDetectedObstacleName] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const poseRef = useRef<any>(null);
  const boardTrackerRef = useRef<BoardTracker>(new BoardTracker());
  const obstacleTrackerRef = useRef<ObstacleTracker>(new ObstacleTracker());
  const requestRef = useRef<number | null>(null);
  const statsRef = useRef({ maxHeight: 0, frameCount: 0 });

  useEffect(() => {
      if (user) {
          dbService.getUserFeedbacks(user.uid).then(ctx => {
              setUserContext(ctx);
          });
      }
  }, [user]);

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
        if (requestRef.current !== null) {
            cancelAnimationFrame(requestRef.current);
        }
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
        setDetectedObstacleName(null);
        setTrickNameInput("");
        setIsPlaying(false);
        setProgress(0);
        boardTrackerRef.current.reset();
        statsRef.current = { maxHeight: 0, frameCount: 0 };
    }
  };

  const startAnalysis = () => {
      if (!videoRef.current || !poseRef.current) return;
      setIsAnalyzing(true);
      setError(null);
      boardTrackerRef.current.reset(); // Reset physics metrics
      
      const video = videoRef.current;
      video.currentTime = 0;
      video.playbackRate = playbackSpeed;
      video.play();
      setIsPlaying(true);
      
      processFrame();
  };

  // Main Tracking Loop
  const processFrame = async () => {
      if (!videoRef.current || !canvasRef.current || !poseRef.current) return;
      const video = videoRef.current;
      
      if (video.paused || video.ended) {
          setIsPlaying(false);
          if (video.ended && isAnalyzing) completeAnalysis();
          return;
      }

      await poseRef.current.send({ image: video });
      requestRef.current = requestAnimationFrame(processFrame);
  };

  // Called manually when scrubbing
  const processSingleFrame = async () => {
    if (!videoRef.current || !poseRef.current) return;
    await poseRef.current.send({ image: videoRef.current });
  }

  const togglePlay = () => {
      if (!videoRef.current) return;
      if (isPlaying) {
          videoRef.current.pause();
          setIsPlaying(false);
      } else {
          videoRef.current.play();
          setIsPlaying(true);
          processFrame();
      }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!videoRef.current) return;
      const time = parseFloat(e.target.value);
      videoRef.current.currentTime = time;
      setProgress(time);
      processSingleFrame(); // Update canvas instantly
  };

  const handleSpeedChange = (speed: number) => {
      setPlaybackSpeed(speed);
      if (videoRef.current) {
          videoRef.current.playbackRate = speed;
      }
  };

  const onTimeUpdate = () => {
      if (videoRef.current) {
          setProgress(videoRef.current.currentTime);
      }
  };

  const onLoadedMetadata = () => {
      if (videoRef.current) {
          setDuration(videoRef.current.duration);
          if (canvasRef.current) {
              canvasRef.current.width = videoRef.current.videoWidth;
              canvasRef.current.height = videoRef.current.videoHeight;
          }
      }
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

          // Calibrate on first few frames if feet are found
          if (!boardTrackerRef.current.isCalibrated && statsRef.current.frameCount < 30) {
             boardTrackerRef.current.calibrate(ctx, width, height, leftAnkle, rightAnkle);
          }

          const hipY = (results.poseLandmarks[23].y + results.poseLandmarks[24].y) / 2;
          const currentHeight = (1 - hipY); 
          if (currentHeight > statsRef.current.maxHeight) {
              statsRef.current.maxHeight = currentHeight;
          }
      }

      const obstacles = obstacleTrackerRef.current.scan(ctx, width, height);
      if (obstacles.length > 0) {
          drawObstacles(ctx, obstacles);
          if (!detectedObstacleName) {
              setDetectedObstacleName(obstacles[0].type);
          }
      }

      const board = boardTrackerRef.current.track(ctx, width, height, leftAnkle, rightAnkle);
      if (board) {
          drawBoardVisuals(ctx, board);
      }

      ctx.restore();
      if(isAnalyzing) statsRef.current.frameCount++;
  };

  const drawSkeleton = (ctx: CanvasRenderingContext2D, landmarks: any[], w: number, h: number) => {
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)'; 
      ctx.fillStyle = '#E3FF37';

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
              ctx.arc(lm.x * w, lm.y * h, 3, 0, 2 * Math.PI);
              ctx.fill();
          }
      });
  };

  const drawObstacles = (ctx: CanvasRenderingContext2D, obstacles: any[]) => {
      obstacles.forEach(obs => {
          ctx.strokeStyle = '#FF6B00';
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 5]);
          ctx.strokeRect(obs.x, obs.y, obs.w, obs.h);
          ctx.setLineDash([]);
          
          ctx.fillStyle = '#FF6B00';
          ctx.font = 'bold 12px sans-serif';
          ctx.fillText(obs.type, obs.x, obs.y - 5);
      });
  };

  const drawBoardVisuals = (ctx: CanvasRenderingContext2D, board: {x: number, y: number, angle: number, length: number, width: number}) => {
      ctx.save();
      ctx.translate(board.x, board.y);
      ctx.rotate(board.angle);

      const deckLen = Math.max(80, board.length); 
      const deckWid = Math.max(25, board.width);
      
      ctx.fillStyle = 'rgba(227, 255, 55, 0.15)';
      ctx.strokeStyle = '#E3FF37';
      ctx.lineWidth = 2;
      
      ctx.beginPath();
      ctx.roundRect(-deckLen/2, -deckWid/2, deckLen, deckWid, 8);
      ctx.fill();
      ctx.stroke();

      const truckOffset = deckLen * 0.35;
      const wheelOffset = deckWid * 0.6;
      const wheelR = Math.max(3, deckWid * 0.15);

      ctx.fillStyle = '#FFFFFF';
      const wheelPositions = [
          { x: truckOffset, y: -wheelOffset },
          { x: truckOffset, y: wheelOffset },
          { x: -truckOffset, y: -wheelOffset },
          { x: -truckOffset, y: wheelOffset }
      ];

      wheelPositions.forEach(p => {
          ctx.beginPath();
          ctx.arc(p.x, p.y, wheelR, 0, Math.PI*2);
          ctx.fill();
      });

      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.lineWidth = 1;
      
      ctx.beginPath(); ctx.moveTo(truckOffset, -wheelOffset); ctx.lineTo(truckOffset, wheelOffset); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-truckOffset, -wheelOffset); ctx.lineTo(-truckOffset, wheelOffset); ctx.stroke();

      ctx.fillStyle = '#FF00FF';
      ctx.beginPath(); ctx.arc(deckLen/2, 0, 3, 0, Math.PI*2); ctx.fill(); 
      ctx.beginPath(); ctx.arc(-deckLen/2, 0, 3, 0, Math.PI*2); ctx.fill();

      ctx.restore();

      ctx.strokeStyle = 'rgba(227, 255, 55, 0.4)';
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
      
      if (!file) return;

      const localEstHeight = Math.max(0, (statsRef.current.maxHeight - 0.4) * 1.8).toFixed(2);
      
      // GENERATE PHYSICS CONTEXT FOR AI
      const m = boardTrackerRef.current.metrics;
      // Flip Ratio: How much thicker did the board get? (> 1.5 might mean flip)
      const flipRatio = m.maxWidth > 0 && m.minWidth > 0 ? (m.maxWidth / m.minWidth).toFixed(1) : "Unknown";
      // Shuvit Ratio: How much shorter did the board get? (< 0.7 usually means shuvit/90deg turn)
      const shuvitRatio = m.maxLength > 0 && m.minLength > 0 ? (m.minLength / m.maxLength).toFixed(1) : "Unknown";
      
      const physicsContext = `
        Estimated CV Physics Data (May be noisy):
        - Flip Indicator (Thickness Change): ${flipRatio} (Ratio > 1.5 often implies Kickflip/Heelflip).
        - Spin Indicator (Length Change): ${shuvitRatio} (Ratio < 0.7 often implies Shuvit).
        - Obstacle Present: ${detectedObstacleName || "None"}.
      `;

      const finalContext = [physicsContext, ...userContext];

      // Pass the manual trick name hint to the AI
      const aiResult = await analyzeMedia(file, language, finalContext, trickNameInput);
      
      let finalResult: VisionAnalysis;

      if (aiResult) {
          finalResult = {
              ...aiResult,
              heightMeters: aiResult.heightMeters || parseFloat(localEstHeight),
              score: aiResult.score || Math.min(100, Math.floor(statsRef.current.maxHeight * 150))
          };
      } else {
          finalResult = {
              id: Date.now().toString(),
              timestamp: new Date().toISOString(),
              trickName: "UNKNOWN",
              isLanded: false,
              confidence: 0,
              score: Math.min(100, Math.floor(statsRef.current.maxHeight * 150)), 
              heightMeters: parseFloat(localEstHeight),
              rotationDegrees: 0,
              feedbackText: "AI could not identify the trick. Please verify the video format.",
              improvementTip: ""
          };
      }

      setResult(finalResult);

      if (user) {
          await dbService.saveAnalysisResult(user.uid, finalResult);
      }
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (user && manualCorrection) {
         await dbService.saveVisionFeedback(user.uid, {
             analysisId: result?.id,
             correction: "User reported inaccuracy",
             actualTrickName: manualCorrection
         });
         setUserContext(prev => [...prev, manualCorrection]);
      }
      alert(t.FEEDBACK_THANKS);
      setManualCorrection("");
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
            <div className="space-y-4">
                <div className="glass-card p-5 rounded-2xl border border-white/5 bg-gradient-to-br from-white/5 to-transparent">
                     <div className="flex items-center space-x-2 mb-3">
                         <Info className="w-4 h-4 text-skate-neon" />
                         <span className="text-[10px] font-bold uppercase tracking-widest text-gray-300">{t.UPLOAD_GUIDE}</span>
                     </div>
                     <div className="grid grid-cols-3 gap-2">
                         <div className="bg-black/40 p-3 rounded-xl flex flex-col items-center text-center">
                             <Camera className="w-5 h-5 text-gray-400 mb-2" />
                             <span className="text-[10px] font-bold text-gray-300 leading-tight">{t.GUIDE_1}</span>
                         </div>
                         <div className="bg-black/40 p-3 rounded-xl flex flex-col items-center text-center">
                             <Video className="w-5 h-5 text-gray-400 mb-2" />
                             <span className="text-[10px] font-bold text-gray-300 leading-tight">{t.GUIDE_2}</span>
                         </div>
                         <div className="bg-black/40 p-3 rounded-xl flex flex-col items-center text-center">
                             <Box className="w-5 h-5 text-gray-400 mb-2" />
                             <span className="text-[10px] font-bold text-gray-300 leading-tight">{t.GUIDE_3}</span>
                         </div>
                     </div>
                </div>

                <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 min-h-[250px] border-2 border-dashed border-white/20 rounded-3xl flex flex-col items-center justify-center p-6 bg-white/5 hover:bg-white/10 transition-colors cursor-pointer group"
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
                        Select a video clip (Max 50MB).
                    </p>
                </div>
            </div>
        ) : (
            <div className="flex flex-col space-y-6">
                <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-black aspect-video group">
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
                        onTimeUpdate={onTimeUpdate}
                        onLoadedMetadata={onLoadedMetadata}
                    />
                    <canvas 
                        ref={canvasRef}
                        className="absolute inset-0 w-full h-full object-contain bg-black"
                    />
                    
                    {detectedObstacleName && isAnalyzing && (
                        <div className="absolute top-4 left-4 z-20 bg-skate-neon/90 text-black px-3 py-1 rounded-full flex items-center space-x-2 shadow-lg animate-pulse">
                            <AlertTriangle className="w-3 h-3" />
                            <span className="text-[10px] font-bold uppercase tracking-wide">{t.TRACKING_OBSTACLE} {detectedObstacleName}</span>
                        </div>
                    )}
                    
                    {!isAnalyzing && !result && !isPlaying && (
                         <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                            <Play className="w-16 h-16 text-white/80 fill-white/20" />
                         </div>
                    )}

                    {/* VIDEO CONTROLS OVERLAY */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-4 transition-opacity opacity-0 group-hover:opacity-100 flex flex-col space-y-2 z-30">
                        {/* Progress Bar */}
                        <input 
                            type="range" 
                            min="0" 
                            max={duration} 
                            step="0.01" 
                            value={progress} 
                            onChange={handleSeek}
                            className="w-full h-1 bg-white/20 rounded-full appearance-none cursor-pointer accent-skate-neon hover:h-2 transition-all"
                        />
                        
                        <div className="flex justify-between items-center">
                            <div className="flex items-center space-x-4">
                                <button onClick={togglePlay} className="text-white hover:text-skate-neon">
                                    {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current" />}
                                </button>
                                <span className="text-xs font-mono text-gray-300">
                                    {progress.toFixed(1)}s / {duration.toFixed(1)}s
                                </span>
                            </div>

                            {/* Speed Control */}
                            <div className="flex items-center space-x-1 bg-black/40 rounded-full p-1 border border-white/10">
                                <Clock className="w-3 h-3 text-gray-400 ml-1" />
                                {[0.1, 0.5, 1.0].map(s => (
                                    <button 
                                        key={s}
                                        onClick={() => handleSpeedChange(s)}
                                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${playbackSpeed === s ? 'bg-skate-neon text-black' : 'text-gray-400 hover:text-white'}`}
                                    >
                                        {s}x
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
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
                                 className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-skate-neon outline-none mb-1"
                                 placeholder="e.g. Kickflip"
                             />
                             <p className="text-[10px] text-gray-500">{t.TRICK_NAME_DESC}</p>
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
                                <h3 className="text-4xl font-display font-bold text-white mb-4">
                                    {result.trickName === "UNKNOWN" ? <span className="text-gray-500">Unknown Trick</span> : result.trickName}
                                </h3>
                                
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
                                <input 
                                    type="text" 
                                    placeholder={t.ACTUAL_TRICK_NAME} 
                                    value={manualCorrection}
                                    onChange={(e) => setManualCorrection(e.target.value)}
                                    className="w-full bg-black border border-white/10 rounded-lg p-2 text-xs text-white focus:border-skate-neon outline-none" 
                                />
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
