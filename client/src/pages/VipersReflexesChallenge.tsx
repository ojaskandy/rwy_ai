import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Target as TargetIcon } from 'lucide-react';
import { useLocation } from 'wouter';
import { initPoseDetection, detectPoses, getJointConnections } from '@/lib/poseDetection';
import { getCameraStream, initializeMobileVideo, setupMobileCanvas, requestCameraPermission, isMobileDevice } from '@/lib/cameraUtils';

const COUNTDOWN_SECONDS = 5;
const DOT_RADIUS = 40; // px
const ARM_LENGTH_FACTOR = 1.1; // Multiplier for arm's length offset
const MIN_VELOCITY_THRESHOLD = 0.2; // Very lenient for reaction

const VipersReflexesChallenge: React.FC = () => {
  const [, navigate] = useLocation();
  const [showInstructions, setShowInstructions] = useState(true);
  const [isChallengeActive, setIsChallengeActive] = useState(false);
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [showCountdown, setShowCountdown] = useState(false);
  const [dotPosition, setDotPosition] = useState<{ x: number; y: number } | null>(null);
  const [reactionTime, setReactionTime] = useState<number | null>(null);
  const [waitingForHit, setWaitingForHit] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [detector, setDetector] = useState<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const prevWristRef = useRef<{ left: { x: number; y: number; time: number } | null; right: { x: number; y: number; time: number } | null }>({ left: null, right: null });

  // Track if the target is visible (after countdown)
  const [targetVisible, setTargetVisible] = useState(false);
  const [timerRunning, setTimerRunning] = useState(false);
  const [currentTimer, setCurrentTimer] = useState(0);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Camera and pose detection setup
  useEffect(() => {
    const setupPoseDetection = async () => {
      try {
        const newDetector = await initPoseDetection('lightning');
        setDetector(newDetector);
      } catch (error) {
        console.error('Error initializing pose detection:', error);
      }
    };
    setupPoseDetection();
  }, []);

  // Camera permission handler
  const handleCameraPermission = async () => {
    try {
      setCameraError(null);
      const granted = await requestCameraPermission();
      
      if (granted) {
        setHasCameraPermission(true);
      } else {
        setCameraError('Camera permission denied. Please allow camera access in your browser settings.');
      }
    } catch (error: any) {
      setCameraError(error.message || 'Failed to access camera');
    }
  };

  useEffect(() => {
    const getCameraFeed = async () => {
      if (hasCameraPermission) {
        try {
          const mediaStream = await getCameraStream('user');
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
            
            // Apply mobile optimizations
            initializeMobileVideo(videoRef.current);
            
            videoRef.current.onloadedmetadata = () => {
              if (videoRef.current) {
                videoRef.current.play();
                if (canvasRef.current) {
                  setupMobileCanvas(canvasRef.current, videoRef.current);
                }
              }
            };
          }
          setStream(mediaStream);
          setCameraError(null);
        } catch (error: any) {
          console.error('Error accessing camera:', error);
          setCameraError(error.message || 'Failed to access camera');
        }
      }
    };
    getCameraFeed();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [hasCameraPermission]);

  // Step 2: Handle countdown
  const startChallenge = () => {
    setShowInstructions(false);
    setIsChallengeActive(true);
    setCountdown(COUNTDOWN_SECONDS);
    setShowCountdown(true);
    setDotPosition(null);
    setReactionTime(null);
    setWaitingForHit(false);
    setStartTime(null);
  };

  useEffect(() => {
    if (showCountdown && countdown > 0) {
      const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    } else if (showCountdown && countdown === 0) {
      setShowCountdown(false);
      setTargetVisible(true);
      setCurrentTimer(0);
      setTimerRunning(true);
      setReactionTime(null);
      placeDot();
    }
  }, [showCountdown, countdown]);

  // Timer for reaction time (starts when target appears)
  useEffect(() => {
    if (timerRunning) {
      timerIntervalRef.current = setInterval(() => {
        setCurrentTimer(t => t + 10);
      }, 10);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [timerRunning]);

  // Step 3: Place dot at halfway point between shoulder and nearest edge
  const placeDot = async () => {
    if (!detector || !videoRef.current) return;
    const poses = await detectPoses(videoRef.current, 1, 0.3);
    if (poses && poses[0] && poses[0].keypoints) {
      const kps = poses[0].keypoints;
      const leftShoulder = kps.find(kp => kp.name === 'left_shoulder');
      const rightShoulder = kps.find(kp => kp.name === 'right_shoulder');
      let baseShoulder = (rightShoulder && typeof rightShoulder.score === 'number' && rightShoulder.score > 0.3) ? rightShoulder : leftShoulder;
      if (baseShoulder) {
        const canvasWidth = canvasRef.current!.width;
        const canvasHeight = canvasRef.current!.height;
        // Decide randomly left or right side
        const side = Math.random() > 0.5 ? 'right' : 'left';
        let edgeX = side === 'right' ? canvasWidth - DOT_RADIUS : DOT_RADIUS;
        // Place dot halfway between shoulder and edge
        const x = baseShoulder.x + (edgeX - baseShoulder.x) * 0.5;
        // Keep y at shoulder height, but clamp to canvas
        const y = Math.max(DOT_RADIUS, Math.min(baseShoulder.y, canvasHeight - DOT_RADIUS));
        setDotPosition({ x, y });
        setWaitingForHit(true);
        setStartTime(performance.now());
        animationFrameId.current = requestAnimationFrame(detectHitLoop);
        return;
      }
    }
    // Fallback: center dot
    setDotPosition({ x: canvasRef.current!.width / 2, y: canvasRef.current!.height / 2 });
    setWaitingForHit(true);
    setStartTime(performance.now());
    animationFrameId.current = requestAnimationFrame(detectHitLoop);
  };

  // Step 4: Detect hit
  const detectHitLoop = async () => {
    if (!waitingForHit || !detector || !videoRef.current || !dotPosition) return;
    const poses = await detectPoses(videoRef.current, 1, 0.3);
    if (poses && poses[0] && poses[0].keypoints) {
      const kps = poses[0].keypoints;
      const wrists = [
        { name: 'left', kp: kps.find(kp => kp.name === 'left_wrist') },
        { name: 'right', kp: kps.find(kp => kp.name === 'right_wrist') },
      ];
      for (const { name, kp } of wrists) {
        if (kp && typeof kp.score === 'number' && kp.score > 0.3) {
          const now = performance.now();
          const prev = prevWristRef.current[name as 'left' | 'right'];
          let velocity = 0;
          if (prev) {
            const dx = kp.x - prev.x;
            const dy = kp.y - prev.y;
            const dt = now - prev.time;
            const distance = Math.sqrt(dx * dx + dy * dy);
            velocity = dt > 0 ? distance / dt : 0;
          }
          prevWristRef.current[name as 'left' | 'right'] = { x: kp.x, y: kp.y, time: now };
          const distToDot = Math.sqrt(Math.pow(kp.x - dotPosition.x, 2) + Math.pow(kp.y - dotPosition.y, 2));
          if (distToDot < DOT_RADIUS && velocity > MIN_VELOCITY_THRESHOLD) {
            setWaitingForHit(false);
            setTargetVisible(false);
            setTimerRunning(false);
            setReactionTime(currentTimer);
            // Show pop-up when the challenge ends
            alert(`Challenge ended! Reaction time: ${currentTimer.toFixed(2)} ms`);
            setTimeout(() => setIsChallengeActive(false), 1200);
            return;
          }
        } else {
          prevWristRef.current[name as 'left' | 'right'] = null;
        }
      }
    }
    animationFrameId.current = requestAnimationFrame(detectHitLoop);
  };

  // Step 5: Draw video/canvas/dot
  useEffect(() => {
    if (canvasRef.current && videoRef.current) {
      const draw = () => {
        const ctx = canvasRef.current!.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
        
        // Draw video feed without mirroring
        ctx.drawImage(videoRef.current!, 0, 0, canvasRef.current!.width, canvasRef.current!.height);

        if (dotPosition && (waitingForHit || reactionTime !== null)) {
          ctx.save();
          ctx.shadowColor = 'rgba(255,0,0,0.7)';
          ctx.shadowBlur = 30;
          ctx.beginPath();
          ctx.arc(dotPosition.x, dotPosition.y, DOT_RADIUS, 0, 2 * Math.PI);
          ctx.fillStyle = reactionTime !== null ? 'rgba(255,0,0,0.5)' : 'red';
          ctx.fill();
          ctx.restore();
        }
        requestAnimationFrame(draw);
      };
      draw();
    }
  }, [dotPosition, waitingForHit, reactionTime]);

  // Helper function to get RGB values from color names (copied from MaxPunchesChallenge)
  const getRgbForColor = (color: string) => {
    return color === 'blue' ? { r: 59, g: 130, b: 246 } :
      color === 'green' ? { r: 16, g: 185, b: 129 } :
      color === 'purple' ? { r: 139, g: 92, b: 246 } :
      color === 'orange' ? { r: 249, g: 115, b: 22 } :
      { r: 239, g: 68, b: 68 }; // Default red
  };

  const SKELETON_COLOR = 'purple';
  const DRAWING_CONFIDENCE_THRESHOLD = 0.3;

  // Pose drawing and hit detection loop
  const detectAndDrawPose = async () => {
    if (!videoRef.current || !canvasRef.current || !detector || videoRef.current.readyState < 2) {
      animationFrameId.current = requestAnimationFrame(detectAndDrawPose);
      return;
    }
    try {
      const poses = await detectPoses(videoRef.current, 1, 0.3);
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        
        // Draw video feed without mirroring
        ctx.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);

        // Draw skeleton
        poses.forEach((pose: any) => {
          if (pose.keypoints && pose.keypoints.length > 0) {
            const keypoints = pose.keypoints;
            const rgb = getRgbForColor(SKELETON_COLOR);
            const actualSkeletonColor = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
            const actualKeypointColor = actualSkeletonColor;
            const actualGlowColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.7)`;
            ctx.strokeStyle = actualSkeletonColor;
            ctx.lineWidth = 3;
            const connections = getJointConnections();
            connections.forEach(([startName, endName]: [string, string]) => {
              const startPoint = keypoints.find((kp: any) => kp.name === startName);
              const endPoint = keypoints.find((kp: any) => kp.name === endName);
              if (
                startPoint && endPoint &&
                (startPoint.score ?? 0) > DRAWING_CONFIDENCE_THRESHOLD &&
                (endPoint.score ?? 0) > DRAWING_CONFIDENCE_THRESHOLD
              ) {
                ctx.save();
                ctx.shadowColor = actualGlowColor;
                ctx.shadowBlur = 10;
                ctx.beginPath();
                ctx.moveTo(startPoint.x, startPoint.y);
                ctx.lineTo(endPoint.x, endPoint.y);
                ctx.stroke();
                ctx.restore();
              }
            });
            keypoints.forEach((keypoint: any) => {
              if ((keypoint.score ?? 0) > DRAWING_CONFIDENCE_THRESHOLD) {
                ctx.save();
                ctx.shadowColor = actualGlowColor;
                ctx.shadowBlur = 15;
                ctx.fillStyle = actualKeypointColor;
                ctx.beginPath();
                ctx.arc(keypoint.x, keypoint.y, 6, 0, 2 * Math.PI);
                ctx.fill();
                ctx.restore();
              }
            });
          }
        });
        // Draw target dot if visible
        if (targetVisible && dotPosition) {
          ctx.save();
          ctx.shadowColor = 'rgba(255,0,0,0.7)';
          ctx.shadowBlur = 30;
          ctx.beginPath();
          ctx.arc(dotPosition.x, dotPosition.y, DOT_RADIUS, 0, 2 * Math.PI);
          ctx.fillStyle = 'red';
          ctx.fill();
          ctx.restore();
        }
      }
      // Hit detection (only when target is visible)
      if (targetVisible && dotPosition && poses[0] && poses[0].keypoints) {
        const kps = poses[0].keypoints;
        const wrists = [
          { name: 'left', kp: kps.find(kp => kp.name === 'left_wrist') },
          { name: 'right', kp: kps.find(kp => kp.name === 'right_wrist') },
        ];
        for (const { name, kp } of wrists) {
          if (kp && typeof kp.score === 'number' && kp.score > 0.3) {
            const now = performance.now();
            const prev = prevWristRef.current[name as 'left' | 'right'];
            let velocity = 0;
            if (prev) {
              const dx = kp.x - prev.x;
              const dy = kp.y - prev.y;
              const dt = now - prev.time;
              const distance = Math.sqrt(dx * dx + dy * dy);
              velocity = dt > 0 ? distance / dt : 0;
            }
            prevWristRef.current[name as 'left' | 'right'] = { x: kp.x, y: kp.y, time: now };
            const distToDot = Math.sqrt(Math.pow(kp.x - dotPosition.x, 2) + Math.pow(kp.y - dotPosition.y, 2));
            if (distToDot < DOT_RADIUS && velocity > MIN_VELOCITY_THRESHOLD) {
              setTargetVisible(false);
              setTimerRunning(false);
              setReactionTime(currentTimer);
              // Show pop-up when the challenge ends
              alert(`Challenge ended! Reaction time: ${currentTimer.toFixed(2)} ms`);
              setTimeout(() => setIsChallengeActive(false), 1200);
              return;
            }
          } else {
            prevWristRef.current[name as 'left' | 'right'] = null;
          }
        }
      }
      animationFrameId.current = requestAnimationFrame(detectAndDrawPose);
    } catch (error) {
      animationFrameId.current = requestAnimationFrame(detectAndDrawPose);
    }
  };

  // Start/stop pose detection loop
  useEffect(() => {
    if (isChallengeActive && detector && stream) {
      animationFrameId.current = requestAnimationFrame(detectAndDrawPose);
    } else {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      }
      if (canvasRef.current && !isChallengeActive) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [isChallengeActive, detector, stream, targetVisible, dotPosition, currentTimer]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Uniform Top Banner */}
      <div className="w-full fixed top-0 left-0 z-50">
        <div className="flex items-center justify-between bg-gradient-to-r from-[#6b1b1b] to-black h-10 px-4 shadow-md">
          <button onClick={() => navigate('/challenges')} className="flex items-center text-white hover:text-red-400 font-semibold text-sm">
            <ArrowLeft className="w-5 h-5 mr-1" /> Back
          </button>
          <div className="flex-1 flex justify-center">
            <span className="text-red-400 font-bold text-lg">Viper's Reflexes</span>
          </div>
          <div className="w-16" /> {/* Spacer for symmetry */}
        </div>
      </div>
      <div className="pt-10 w-full h-full flex-1 flex flex-col items-center justify-center">
        <AnimatePresence>
          {showInstructions && (
            <motion.div
              className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-50 p-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="bg-gradient-to-br from-gray-800 to-black p-8 rounded-2xl shadow-2xl border border-purple-700 max-w-lg text-center"
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.3 }}
              >
                <TargetIcon className="text-purple-400 w-16 h-16 mx-auto mb-4" />
                <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 mb-4">
                  Viper's Reflexes
                </h2>
                <p className="text-purple-200 text-lg mb-6">
                  <strong>Goal:</strong> Face the camera and look at the screen. When the red dot appears, hit it as fast as you can with your fist!
                </p>
                
                {/* Camera Permission Section */}
                {!hasCameraPermission && (
                  <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6">
                    <div className="flex items-center gap-2 mb-2">
                      <TargetIcon className="h-6 w-6 text-red-400" />
                      <span className="text-red-300 font-bold">CAMERA ACCESS REQUIRED</span>
                    </div>
                    <p className="text-red-200 text-sm mb-3">
                      {isMobileDevice() 
                        ? 'Tap "Enable Camera" and allow access when prompted by your browser.'
                        : 'Click "Enable Camera" and allow access when prompted by your browser.'
                      }
                    </p>
                    {cameraError && (
                      <p className="text-red-300 text-xs mb-3 bg-red-900/30 p-2 rounded">
                        {cameraError}
                      </p>
                    )}
                    <Button 
                      onClick={handleCameraPermission}
                      className="bg-red-600 hover:bg-red-700 text-white mb-4"
                    >
                      <TargetIcon className="h-4 w-4 mr-2" />
                      Enable Camera
                    </Button>
                  </div>
                )}
                
                <div className="flex justify-center gap-4">
                  <Button
                    onClick={() => navigate('/challenges')}
                    variant="outline"
                    className="text-purple-300 border-purple-600 hover:bg-purple-700 hover:text-white"
                  >
                    Back to Challenges
                  </Button>
                  <Button
                    onClick={startChallenge}
                    disabled={!hasCameraPermission}
                    className={`font-semibold ${
                      hasCameraPermission 
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white'
                        : 'bg-gray-600 text-gray-300 cursor-not-allowed'
                    }`}
                  >
                    {hasCameraPermission ? 'Let\'s Go!' : 'Enable Camera First'}
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Camera feed and overlays always visible */}
        <div className="absolute inset-0 w-full h-full z-0">
          <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" playsInline autoPlay muted />
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
          {/* Countdown overlay (transparent, not blackout) */}
          {isChallengeActive && showCountdown && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-20 pointer-events-none">
              <div className="text-yellow-400 text-3xl sm:text-5xl font-bold mb-2 bg-black/40 px-4 py-2 rounded-xl">Face the camera and look at the screen</div>
              <div className="text-yellow-400 text-7xl sm:text-9xl font-bold bg-black/40 px-8 py-4 rounded-2xl">{countdown}</div>
            </div>
          )}
          {/* Target and timer overlays */}
          {isChallengeActive && targetVisible && (
            <div className="absolute top-6 right-6 z-30 bg-black/60 px-4 py-2 rounded-xl text-2xl font-bold text-yellow-300">
              { (currentTimer / 1000).toFixed(3) }s
            </div>
          )}
          {/* Reaction time overlay */}
          {reactionTime !== null && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-30">
              <div className="text-4xl sm:text-6xl font-bold text-yellow-400 mb-4 bg-black/70 px-8 py-4 rounded-2xl">{(reactionTime / 1000).toFixed(3)}s</div>
              <div className="text-xl text-white mb-6 bg-black/60 px-6 py-2 rounded-xl">Your Reaction Time</div>
              <Button onClick={startChallenge} className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-3 px-8 rounded-lg text-lg shadow-lg hover:shadow-yellow-500/50 transition-all duration-300 ease-in-out">Try Again</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VipersReflexesChallenge; 