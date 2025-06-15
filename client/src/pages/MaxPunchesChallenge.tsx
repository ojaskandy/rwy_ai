import React, { useRef, useEffect, useState } from 'react';
import { initPoseDetection, detectPoses, getJointConnections } from '@/lib/poseDetection';
import DraggableControls from '@/components/DraggableControls';
import { ArrowLeft } from 'lucide-react';
import { useLocation } from 'wouter';

// Define an interface for Keypoint
interface Keypoint {
  x: number;
  y: number;
  score?: number;
  name?: string;
}

// Helper function to get RGB values from color names (mirroring CameraView.tsx)
const getRgbForColor = (color: string) => {
  // Default to red if color is not recognized, to match the page theme
  return color === 'blue' ? { r: 59, g: 130, b: 246 } :
         color === 'green' ? { r: 16, g: 185, b: 129 } :
         color === 'purple' ? { r: 139, g: 92, b: 246 } :
         color === 'orange' ? { r: 249, g: 115, b: 22 } :
         { r: 239, g: 68, b: 68 }; // Default red (EF4444)
};

interface MaxPunchesChallengeProps {
  // To make it truly identical, allow skeletonColor to be passed if needed,
  // otherwise, it defaults to red for the challenge page theme.
  skeletonColor?: string; 
}

const MaxPunchesChallenge: React.FC<MaxPunchesChallengeProps> = ({ skeletonColor = 'red' }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [timer, setTimer] = useState(30);
  const [isActive, setIsActive] = useState(false);
  const [showStartButton, setShowStartButton] = useState(true);
  const [detector, setDetector] = useState<any>(null);
  const animationFrameId = useRef<number | null>(null);

  // Paddle and Hit Counter State
  const [paddlePosition, setPaddlePosition] = useState<{ x: number; y: number } | null>(null);
  const [hitCount, setHitCount] = useState(0);
  const [isPaddleHit, setIsPaddleHit] = useState(false);
  const lastHitTimeRef = useRef<{ left: number; right: number }>({ left: 0, right: 0 });
  const paddleWidth = 80; // Diameter of the ball
  const paddleHeight = 80; // Diameter of the ball (kept for hitbox consistency)
  const HIT_COOLDOWN_MS = 50;
  const [targetImage, setTargetImage] = useState<HTMLImageElement | null>(null);

  // New state for preparation phase
  const [prepTimer, setPrepTimer] = useState(0);
  const [isPreparing, setIsPreparing] = useState(false);

  // New state for instructions modal
  const [showInstructionsModal, setShowInstructionsModal] = useState(true);

  // Sound effects
  const [hitSound, setHitSound] = useState<HTMLAudioElement | null>(null);
  const [countdownSound, setCountdownSound] = useState<HTMLAudioElement | null>(null);
  const HIT_SOUND_PATH = '/assets/sounds/hit.mp3'; // Placeholder - ENSURE THIS FILE EXISTS
  const COUNTDOWN_SOUND_PATH = '/assets/sounds/countdown.mp3'; // Placeholder - ENSURE THIS FILE EXISTS

  const modelName = 'lightning';
  const maxPoses = 1;
  const detectionConfidenceThreshold = 0.3;
  const drawingConfidenceThreshold = 0.3;

  const frameSkipRate = 3;
  const frameCountRef = useRef(0);
  const [, navigate] = useLocation();

  // For draggable timer reset
  const [timerPosition, setTimerPosition] = useState({ x: window.innerWidth - 120, y: 80 });
  const lastTapRef = useRef(0);

  const MIN_VELOCITY_THRESHOLD = 0.3; // More lenient detection

  // Add refs to track wrist positions, times, and cooldowns for both hands
  const prevWristRef = useRef<{
    left: { x: number; y: number; time: number } | null;
    right: { x: number; y: number; time: number } | null;
  }>({ left: null, right: null });

  useEffect(() => {
    const setupPoseDetection = async () => {
      try {
        const newDetector = await initPoseDetection(modelName);
        setDetector(newDetector);
      } catch (error) {
        console.error('Error initializing pose detection:', error);
      }
    };
    setupPoseDetection();
  }, [modelName]);

  useEffect(() => {
    const getCameraFeed = async () => {
      if (detector) {
        try {
          const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
            videoRef.current.onloadedmetadata = () => {
              if (canvasRef.current && videoRef.current) {
                canvasRef.current.width = videoRef.current.videoWidth;
                canvasRef.current.height = videoRef.current.videoHeight;
              }
            };
          }
          setStream(mediaStream);
        } catch (error) {
          console.error('Error accessing camera:', error);
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
  }, [detector]);

  // Preload sounds
  useEffect(() => {
    try {
      const hit = new Audio(HIT_SOUND_PATH);
      hit.preload = 'auto';
      setHitSound(hit);
      console.log('Hit sound preloaded from:', HIT_SOUND_PATH);
    } catch (e) {
      console.error('Failed to load hit sound:', e);
    }
    try {
      const countdown = new Audio(COUNTDOWN_SOUND_PATH);
      countdown.preload = 'auto';
      setCountdownSound(countdown);
      console.log('Countdown sound preloaded from:', COUNTDOWN_SOUND_PATH);
    } catch (e) {
      console.error('Failed to load countdown sound:', e);
    }
  }, []);

  // Preload target image
  useEffect(() => {
    const img = new Image();
    // IMPORTANT: Make sure you have a target.png image in your public/assets/images/ directory
    img.src = '/assets/images/target.png';
    img.onload = () => setTargetImage(img);
    img.onerror = () => console.error("Failed to load target image from /assets/images/target.png");
  }, []);

  const detectAndDrawPose = async () => {
    frameCountRef.current = (frameCountRef.current + 1) % frameSkipRate;
    if (frameCountRef.current !== 0 && (isPreparing || isActive)) {
      animationFrameId.current = requestAnimationFrame(detectAndDrawPose);
      return;
    }

    if (videoRef.current && canvasRef.current && detector && videoRef.current.readyState >= 2 && videoRef.current.videoWidth > 0) {
      try {
        const poses = await detectPoses(videoRef.current, maxPoses, detectionConfidenceThreshold);
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          ctx.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);

          poses.forEach((pose: any) => {
            if (pose.keypoints && pose.keypoints.length > 0) {
              const keypoints: Keypoint[] = pose.keypoints;
              const currentSkeletonColorName = skeletonColor;
              const currentConfidenceThreshold = drawingConfidenceThreshold;
              const lineWidth = 3;
              const radius = 6;

              const rgb = getRgbForColor(currentSkeletonColorName);
              const actualSkeletonColor = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
              const actualKeypointColor = actualSkeletonColor;
              const actualGlowColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.7)`;

              ctx.strokeStyle = actualSkeletonColor;
              ctx.lineWidth = lineWidth;
              const connections = getJointConnections();
              connections.forEach((connection: [string, string]) => {
                const [startName, endName] = connection;
                const startPoint = keypoints.find(kp => kp.name === startName);
                const endPoint = keypoints.find(kp => kp.name === endName);

                if (
                  startPoint && endPoint &&
                  (startPoint.score ?? 0) > currentConfidenceThreshold &&
                  (endPoint.score ?? 0) > currentConfidenceThreshold
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

              keypoints.forEach(keypoint => {
                if ((keypoint.score ?? 0) > currentConfidenceThreshold) {
                  ctx.save();
                  ctx.shadowColor = actualGlowColor;
                  ctx.shadowBlur = 15;
                  ctx.fillStyle = actualKeypointColor;
                  ctx.beginPath();
                  ctx.arc(keypoint.x, keypoint.y, radius, 0, 2 * Math.PI);
                  ctx.fill();
                  ctx.restore();
                }
              });
            }
          });

          // Draw Paddle (Image or Red Glowing Ball) and Detect Hits
          if (isActive && paddlePosition) {
            ctx.save();
            const paddleRadius = paddleWidth / 2;

            if (targetImage) {
              // Draw the image
              ctx.shadowColor = isPaddleHit ? 'rgba(255, 255, 100, 0.9)' : 'rgba(255, 87, 34, 0.7)';
              ctx.shadowBlur = isPaddleHit ? 35 : 25;
              ctx.drawImage(targetImage, paddlePosition.x, paddlePosition.y, paddleWidth, paddleHeight);
            } else {
              // Fallback to drawing the red ball if image hasn't loaded
              const ballColor = getRgbForColor('red');
              ctx.shadowColor = isPaddleHit ? 'rgba(255, 255, 100, 0.9)' : `rgba(${ballColor.r}, ${ballColor.g}, ${ballColor.b}, 0.7)`;
              ctx.shadowBlur = isPaddleHit ? 30 : 20;
              ctx.fillStyle = `rgb(${ballColor.r}, ${ballColor.g}, ${ballColor.b})`;
              ctx.beginPath();
              ctx.arc(paddlePosition.x + paddleRadius, paddlePosition.y + paddleRadius, paddleRadius, 0, 2 * Math.PI);
              ctx.fill();
            }
            ctx.restore();

            // Hit detection (hitbox remains a square around the ball's center for now)
            const paddleHitbox = {
              x: paddlePosition.x,
              y: paddlePosition.y,
              width: paddleWidth,
              height: paddleHeight,
            };

            poses.forEach((pose: any) => {
              if (pose.keypoints && pose.keypoints.length > 0) {
                const keypoints: Keypoint[] = pose.keypoints;
                const wrists = [
                  { name: 'left', kp: keypoints.find(kp => kp.name === 'left_wrist') },
                  { name: 'right', kp: keypoints.find(kp => kp.name === 'right_wrist') },
                ];

                wrists.forEach(({ name, kp }) => {
                  if (kp && (kp.score ?? 0) > drawingConfidenceThreshold) {
                    const now = Date.now();
                    const prev = prevWristRef.current[name as 'left' | 'right'];
                    let velocity = 0;
                    if (prev) {
                      const dx = kp.x - prev.x;
                      const dy = kp.y - prev.y;
                      const dt = now - prev.time;
                      const distance = Math.sqrt(dx * dx + dy * dy);
                      velocity = dt > 0 ? distance / dt : 0;
                    }
                    // Update previous position
                    prevWristRef.current[name as 'left' | 'right'] = { x: kp.x, y: kp.y, time: now };

                    // Only register hit if velocity is above threshold and wrist is inside hitbox
                    if (
                      kp.x > paddleHitbox.x &&
                      kp.x < paddleHitbox.x + paddleHitbox.width &&
                      kp.y > paddleHitbox.y &&
                      kp.y < paddleHitbox.y + paddleHitbox.height &&
                      velocity > MIN_VELOCITY_THRESHOLD
                    ) {
                      if (now - lastHitTimeRef.current[name as 'left' | 'right'] > HIT_COOLDOWN_MS) {
                        setHitCount(prevCount => prevCount + 1);
                        lastHitTimeRef.current[name as 'left' | 'right'] = now;
                        setIsPaddleHit(true);
                        if (hitSound) {
                          hitSound.currentTime = 0;
                          hitSound.play().catch(e => console.error("Error playing hit sound:", e));
                        }
                        setTimeout(() => setIsPaddleHit(false), 150);
                      }
                    }
                  } else {
                    // If wrist not detected, clear previous
                    prevWristRef.current[name as 'left' | 'right'] = null;
                  }
                });
              }
            });
          }
        }
      } catch (error) {
        console.error("Error in detectAndDrawPose:", error);
      }
    }
    if (isPreparing || isActive) {
      animationFrameId.current = requestAnimationFrame(detectAndDrawPose);
    }
  };

  useEffect(() => {
    if ((isPreparing || isActive) && detector && stream) {
      frameCountRef.current = 0;
      animationFrameId.current = requestAnimationFrame(detectAndDrawPose);
    } else {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      }
      if (canvasRef.current && !isPreparing && !isActive) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
      }
    }
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [isPreparing, isActive, detector, stream, skeletonColor]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isActive && timer > 0) {
      interval = setInterval(() => {
        setTimer((prevTimer) => {
          const newTime = prevTimer - 1;
          if (newTime <= 5 && newTime > 0 && countdownSound) { // Play sound for last 5 seconds (5,4,3,2,1)
            countdownSound.currentTime = 0;
            countdownSound.play().catch(e => console.error("Error playing main countdown sound:", e));
          }
          if (newTime === 0) { // Also play for 0 if desired, or adjust condition above
             // Optionally play a different sound for game end
          }
          return newTime;
        });
      }, 1000);
    } else if (timer === 0 && isActive) {
      setIsActive(false);
      setShowStartButton(true);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timer]);

  const handleStartClick = async () => {
    setHitCount(0);
    lastHitTimeRef.current = { left: 0, right: 0 };
    setTimer(30);                 // Preset main timer to 30s
    setPaddlePosition(null);      // Clear any previous paddle
    setShowStartButton(false);    // Hide start button
    setIsActive(false);           // Ensure main game is not active yet
    setPrepTimer(3);              // Start prep countdown from 3
    setIsPreparing(true);         // Enter preparation mode
    
    console.log('Start button clicked, entering preparation phase...');
    // Pose detection for initial paddle placement will occur when prepTimer ends.
  };

  // useEffect for preparation countdown and setting fixed paddle position
  useEffect(() => {
    let prepInterval: NodeJS.Timeout | null = null;
    if (isPreparing && prepTimer > 0) {
      if (countdownSound) {
        countdownSound.currentTime = 0;
        countdownSound.play().catch(e => console.error("Error playing prep countdown sound:", e));
      }
      prepInterval = setInterval(() => {
        setPrepTimer(prev => {
          const newTime = prev - 1;
          if (newTime > 0 && countdownSound) {
            countdownSound.currentTime = 0;
            countdownSound.play().catch(e => console.error("Error playing prep countdown sound:", e));
          }
          return newTime;
        });
      }, 1000);
    } else if (isPreparing && prepTimer === 0) {
      setIsPreparing(false);
      setIsActive(true); // Start the main challenge

      // Set fixed paddle position based on current right_wrist
      const setFixedPaddlePosition = async () => {
        if (videoRef.current && detector && canvasRef.current) {
          try {
            console.log("Attempting to detect pose for paddle placement...");
            const poses = await detectPoses(videoRef.current, maxPoses, detectionConfidenceThreshold);
            if (poses && poses.length > 0 && poses[0].keypoints) {
              const keypoints: Keypoint[] = poses[0].keypoints;
              const rightWrist = keypoints.find(kp => kp.name === 'right_wrist');
              const paddleRadius = paddleWidth / 2;

              if (rightWrist && (rightWrist.score ?? 0) > drawingConfidenceThreshold) {
                const fixedX = rightWrist.x - paddleRadius;
                const fixedY = rightWrist.y - paddleRadius;
                setPaddlePosition({ x: fixedX, y: fixedY });
                console.log('Paddle position fixed at right wrist:', { x: fixedX, y: fixedY });
              } else {
                console.warn('Right wrist not detected reliably at end of prep. Using default paddle position.');
                setPaddlePosition({ x: canvasRef.current!.width * 0.75 - paddleRadius, y: canvasRef.current!.height * 0.3 - paddleRadius });
              }
            } else {
              console.warn('No poses detected at end of prep. Using default paddle position.');
              const paddleRadius = paddleWidth / 2;
              setPaddlePosition({ x: canvasRef.current!.width * 0.75 - paddleRadius, y: canvasRef.current!.height * 0.3 - paddleRadius });
            }
          } catch (e) {
            console.error("Error estimating poses for fixed paddle placement:", e);
            const paddleRadius = paddleWidth / 2;
            setPaddlePosition({ x: canvasRef.current!.width * 0.75 - paddleRadius, y: canvasRef.current!.height * 0.3 - paddleRadius });
          }
        } else {
          console.error('Video, detector, or canvas not ready for fixed paddle placement. Using default.');
          const paddleRadius = paddleWidth / 2;
          setPaddlePosition({ x: 300 - paddleRadius, y: 150 - paddleRadius }); // Absolute fallback
        }
      };
      setFixedPaddlePosition();
    }
    return () => {
      if (prepInterval) clearInterval(prepInterval);
    };
  }, [isPreparing, prepTimer, detector, videoRef, canvasRef, paddleWidth, maxPoses, detectionConfidenceThreshold, drawingConfidenceThreshold]);

  // Double-tap to reset timer position (mobile-friendly)
  const handleTimerTap = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 400) {
      setTimerPosition({ x: window.innerWidth - 120, y: 80 });
    }
    lastTapRef.current = now;
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-start justify-start relative overflow-hidden max-w-full max-h-full">
      {/* Fixed Header */}
      <div className="w-full bg-gradient-to-r from-red-900/80 to-black/80 py-3 px-2 sm:px-4 flex items-center justify-between z-10 shadow-lg">
        <button 
          onClick={() => navigate('/challenges')}
          className="flex items-center text-white/80 hover:text-white transition-colors text-base sm:text-sm"
        >
          <ArrowLeft className="h-5 w-5 mr-1" />
          <span>Back</span>
        </button>
        <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-red-500 text-center flex-1">Maximum Punches in 30 Seconds</h1>
        <div className="w-10 sm:w-16"></div> {/* Spacer to center the title */}
      </div>

      {/* Instructions Modal */}
      {showInstructionsModal && (
        <div className="absolute inset-0 bg-black bg-opacity-90 flex flex-col items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-gray-900 border border-red-800 rounded-xl p-4 sm:p-6 max-w-md w-full">
            <h2 className="text-2xl sm:text-3xl text-yellow-400 font-bold mb-4 sm:mb-6">Max Punches Challenge!</h2>
            <div className="text-sm sm:text-base text-center space-y-3 sm:space-y-4 mb-6 sm:mb-8">
              <p>Get ready to punch as fast as you can for 30 seconds!</p>
              <p>When you click "Let's Go!", you'll have <strong className="text-yellow-400">3 seconds</strong> to get in position.</p>
              <p>Raise your <strong className="text-yellow-400">right arm</strong> out. A <strong className="text-red-500">red target</strong> will appear at your fist.</p>
              <p>Punch the target as many times as you can before the timer runs out!</p>
            </div>
            <button
              onClick={() => setShowInstructionsModal(false)}
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-3 px-8 rounded-lg text-lg sm:text-xl shadow-lg hover:shadow-yellow-500/50 transition-all duration-300 ease-in-out"
            >
              Let's Go!
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area - Full Screen Camera */}
      <div className="w-full flex-1 relative max-w-full max-h-full">
        {/* Full screen video and canvas */}
        <div className="absolute inset-0 bg-black max-w-full max-h-full">
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            className="absolute inset-0 w-full h-full object-cover max-w-full max-h-full" 
            muted 
          />
          <canvas 
            ref={canvasRef} 
            className="absolute inset-0 w-full h-full max-w-full max-h-full" 
          />
        </div>

        {/* Hit Counter - Fixed Position */}
        {isActive && paddlePosition && (
          <div className="absolute top-16 left-2 sm:left-4 bg-black/70 text-white px-2 sm:px-3 py-1 sm:py-2 rounded-lg z-10 text-base sm:text-lg">
            <div className="text-xs sm:text-sm font-medium text-gray-400">HITS</div>
            <div className="text-lg sm:text-2xl font-bold text-white">{hitCount}</div>
          </div>
        )}

        {/* Draggable Timer - with double-tap to reset */}
        {isActive && (
          <DraggableControls
            initialPosition={timerPosition}
            className="touch-none"
          >
            <div
              className="bg-black/80 border-2 border-red-600 rounded-xl px-3 sm:px-4 py-2 sm:py-3 shadow-lg shadow-red-600/30 min-w-[70px] sm:min-w-[100px] text-center select-none"
              onTouchEnd={handleTimerTap}
              onDoubleClick={handleTimerTap}
            >
              <div className="text-xs sm:text-sm font-medium text-gray-400">TIME</div>
              <div className="text-2xl sm:text-3xl md:text-4xl font-mono font-bold text-red-500">
                {String(timer).padStart(2, '0')}
              </div>
            </div>
          </DraggableControls>
        )}

        {/* Preparation Countdown Overlay */}
        {isPreparing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-30">
            <div className="text-yellow-400 text-2xl sm:text-3xl md:text-5xl font-bold mb-2 sm:mb-4">Get Ready!</div>
            <div className="text-yellow-400 text-5xl sm:text-7xl md:text-9xl font-bold">{prepTimer}</div>
          </div>
        )}

        {/* Game End Results */}
        {!isActive && timer === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-30 p-2 sm:p-4">
            <div className="bg-gray-900 border border-yellow-600 rounded-xl p-4 sm:p-6 max-w-md w-full text-center">
              <h2 className="text-2xl sm:text-3xl font-bold text-yellow-400 mb-2">Challenge Complete!</h2>
              <div className="text-4xl sm:text-5xl md:text-6xl font-bold text-white my-4 sm:my-6">
                {hitCount} <span className="text-lg sm:text-2xl text-gray-400">hits</span>
              </div>
              <button
                onClick={handleStartClick}
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-3 px-8 rounded-lg text-lg sm:text-xl shadow-lg hover:shadow-yellow-500/50 transition-all duration-300 ease-in-out"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Start Button - Centered in the Middle with Glow */}
        {showStartButton && !showInstructionsModal && (
          <div className="absolute inset-0 flex items-center justify-center z-20">
            <button
              onClick={handleStartClick}
              disabled={isPreparing || isActive}
              className={`animate-pulse w-11/12 max-w-xs font-bold py-4 px-10 rounded-2xl text-2xl sm:text-3xl shadow-2xl transition-all duration-300 ease-in-out border-4 border-yellow-400 bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-500 text-black drop-shadow-lg focus:outline-none focus:ring-4 focus:ring-yellow-400/60 hover:scale-105 hover:shadow-yellow-400/70 ${
                isPreparing || isActive
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed border-gray-400 animate-none'
                  : 'hover:bg-yellow-400/90'
              }`}
              style={{ boxShadow: '0 0 32px 8px #fde047, 0 0 8px 2px #facc15' }}
            >
              Start Challenge
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MaxPunchesChallenge; 