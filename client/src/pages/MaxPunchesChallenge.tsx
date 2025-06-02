import React, { useRef, useEffect, useState } from 'react';
import { initPoseDetection, detectPoses, getJointConnections } from '@/lib/poseDetection';

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
  const lastHitTimeRef = useRef<number>(0);
  const paddleWidth = 80; // Diameter of the ball
  const paddleHeight = 80; // Diameter of the ball (kept for hitbox consistency)
  const HIT_COOLDOWN_MS = 50;
  // REMOVED: const ARM_LENGTH_OFFSET = 75;

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

  const detectAndDrawPose = async () => {
    frameCountRef.current = (frameCountRef.current + 1) % frameSkipRate;
    if (frameCountRef.current !== 0 && (isPreparing || isActive)) { // Ensure loop continues if preparing or active
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

          // Draw Paddle (Red Glowing Ball) and Detect Hits (if active and position is set)
          if (isActive && paddlePosition) {
            ctx.save();
            const paddleRadius = paddleWidth / 2;
            const ballColor = getRgbForColor('red'); // Use the helper for red

            // Glow effect for the ball
            ctx.shadowColor = isPaddleHit ? 'rgba(255, 255, 100, 0.9)' : `rgba(${ballColor.r}, ${ballColor.g}, ${ballColor.b}, 0.7)`;
            ctx.shadowBlur = isPaddleHit ? 30 : 20;

            // Draw the ball
            ctx.fillStyle = `rgb(${ballColor.r}, ${ballColor.g}, ${ballColor.b})`;
            ctx.beginPath();
            ctx.arc(paddlePosition.x + paddleRadius, paddlePosition.y + paddleRadius, paddleRadius, 0, 2 * Math.PI);
            ctx.fill();
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
                const leftWrist = keypoints.find(kp => kp.name === 'left_wrist');
                const rightWrist = keypoints.find(kp => kp.name === 'right_wrist');

                const wrists = [leftWrist, rightWrist].filter(Boolean) as Keypoint[];

                for (const wrist of wrists) {
                  if (wrist && (wrist.score ?? 0) > drawingConfidenceThreshold) {
                    if (
                      wrist.x > paddleHitbox.x &&
                      wrist.x < paddleHitbox.x + paddleHitbox.width &&
                      wrist.y > paddleHitbox.y &&
                      wrist.y < paddleHitbox.y + paddleHitbox.height
                    ) {
                      const currentTime = Date.now();
                      if (currentTime - lastHitTimeRef.current > HIT_COOLDOWN_MS) {
                        setHitCount(prevCount => prevCount + 1);
                        lastHitTimeRef.current = currentTime;
                        setIsPaddleHit(true);
                        if (hitSound) {
                          hitSound.currentTime = 0; // Rewind to start if already playing
                          hitSound.play().catch(e => console.error("Error playing hit sound:", e));
                        }
                        setTimeout(() => setIsPaddleHit(false), 150); // Hit visual feedback duration
                        break; // Count one hit per frame
                      }
                    }
                  }
                }
              }
            });
          }
        }
      } catch (error) {
        console.error("Error in detectAndDrawPose:", error);
      }
    }
    if (isPreparing || isActive) { // Continue animation if preparing or active
        animationFrameId.current = requestAnimationFrame(detectAndDrawPose);
    }
  };

  useEffect(() => {
    if ((isPreparing || isActive) && detector && stream) { // MODIFIED: isPreparing || isActive
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
  }, [isPreparing, isActive, detector, stream, skeletonColor]); // ADDED isPreparing

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
    lastHitTimeRef.current = 0;
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

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 md:p-8 relative">
      {/* Instructions Modal */}
      {showInstructionsModal && (
        <div className="absolute inset-0 bg-black bg-opacity-80 flex flex-col items-center justify-center z-50 p-8 rounded-lg">
          <h2 className="text-4xl text-yellow-400 font-bold mb-6">Max Punches Challenge!</h2>
          <div className="text-lg text-center space-y-4 mb-8 max-w-md">
            <p>Get ready to punch as fast as you can for 30 seconds!</p>
            <p>When you click "Let's Go!", you'll have <strong className="text-yellow-400">3 seconds</strong> to get in position.</p>
            <p>Raise your <strong className="text-yellow-400">right arm</strong> out. A <strong className="text-red-500">red target</strong> will appear at your fist.</p>
            <p>Punch the target as many times as you can before the timer runs out!</p>
          </div>
          <button
            onClick={() => setShowInstructionsModal(false)}
            className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-3 px-8 rounded-lg text-xl shadow-lg hover:shadow-yellow-500/50 transition-all duration-300 ease-in-out transform hover:-translate-y-0.5"
          >
            Let's Go!
          </button>
        </div>
      )}

      <h1 className="text-3xl md:text-4xl font-bold mb-6 md:mb-10 text-center text-red-500">Maximum Punches in 30 Seconds</h1>
      <div className="flex flex-col md:flex-row w-full max-w-6xl">
        <div className="w-full md:w-2/3 bg-gray-800 rounded-xl shadow-2xl p-1 md:p-2 mb-4 md:mb-0 md:mr-4 relative">
          <video ref={videoRef} autoPlay playsInline className="w-full h-auto rounded-lg aspect-video" muted />
          <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full rounded-lg" />
          {/* Display Hit Count on the canvas or as an overlay */}
          {isActive && paddlePosition && (
            <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white p-2 rounded">
              Hits: {hitCount}
            </div>
          )}

          {/* Preparation Countdown Overlay */}
          {isPreparing && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-75 z-50 rounded-lg">
              <div className="text-yellow-400 text-5xl font-bold mb-4">Get Ready!</div>
              <div className="text-yellow-400 text-9xl font-bold">{prepTimer}</div>
            </div>
          )}
        </div>
        <div className="w-full md:w-1/3 bg-gray-800 rounded-xl shadow-2xl p-4 md:p-6 flex flex-col items-center justify-center">
          <div className="text-6xl md:text-8xl font-mono text-red-500 mb-8">{String(timer).padStart(2, '0')}s</div>
          {/* Show final hit count when timer is done */}
          {!isActive && timer === 0 && (
            <div className="text-4xl md:text-5xl font-bold text-yellow-400 mb-4">
              Total Hits: {hitCount}
            </div>
          )}
          {showStartButton && (
            <button
              onClick={handleStartClick}
              disabled={showInstructionsModal || isPreparing || isActive} // Disable if instructions are up or game active/preparing
              className={`font-bold py-3 px-8 rounded-lg text-xl shadow-lg transition-all duration-300 ease-in-out transform hover:-translate-y-0.5 ${
                showInstructionsModal || isPreparing || isActive
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-red-600 hover:bg-red-700 text-white hover:shadow-red-500/50'
              }`}
            >
              Start Challenge
            </button>
          )}
          {!showStartButton && !isActive && timer === 0 && (
            <button
              onClick={handleStartClick}
              className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-3 px-8 rounded-lg text-xl shadow-lg hover:shadow-yellow-500/50 transition-all duration-300 ease-in-out transform hover:-translate-y-0.5 mt-4"
            >
              Try Again?
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MaxPunchesChallenge; 