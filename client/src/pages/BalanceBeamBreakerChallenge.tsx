import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Target as TargetIcon } from 'lucide-react';
import { useLocation } from 'wouter';
import { initPoseDetection, detectPoses, getJointConnections } from '@/lib/poseDetection';
import { getCameraStream, initializeMobileVideo, setupMobileCanvas, requestCameraPermission, isMobileDevice } from '@/lib/cameraUtils';

const COUNTDOWN_SECONDS = 5;
const SKELETON_COLOR = 'purple';
const DRAWING_CONFIDENCE_THRESHOLD = 0.3;

const BalanceBeamBreakerChallenge: React.FC = () => {
  const [, navigate] = useLocation();
  const [showInstructions, setShowInstructions] = useState(true);
  const [isChallengeActive, setIsChallengeActive] = useState(false);
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [showCountdown, setShowCountdown] = useState(false);
  const [detector, setDetector] = useState<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const [kneeAngle, setKneeAngle] = useState<number | null>(null);
  const [inGreen, setInGreen] = useState(false);
  const [greenTime, setGreenTime] = useState(0);
  const [footDropped, setFootDropped] = useState(false);
  const [showKickInstruction, setShowKickInstruction] = useState(false);
  const GREEN_THRESHOLD = 160;
  const YELLOW_THRESHOLD = 145;
  const MIN_KICK_HEIGHT = 0.6; // relative to hip
  const [currentLeg, setCurrentLeg] = useState<'right' | 'left'>('right');
  const [showSwitchLeg, setShowSwitchLeg] = useState(false);
  const [rightLegTime, setRightLegTime] = useState(0);
  const [leftLegTime, setLeftLegTime] = useState(0);
  const [challengeComplete, setChallengeComplete] = useState(false);
  const [displayedAngle, setDisplayedAngle] = useState<number | null>(null);
  const LERP_SPEED = 0.2;

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

  const startChallenge = () => {
    setShowInstructions(false);
    setIsChallengeActive(true);
    setCountdown(COUNTDOWN_SECONDS);
    setShowCountdown(true);
    setCurrentLeg('right');
    setGreenTime(0);
    setRightLegTime(0);
    setLeftLegTime(0);
    setChallengeComplete(false);
    setShowSwitchLeg(false);
    setWasInZone(false);
  };

  useEffect(() => {
    if (showCountdown && countdown > 0) {
      const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    } else if (showCountdown && countdown === 0) {
      setShowCountdown(false);
    }
  }, [showCountdown, countdown]);

  // Helper function to get RGB values from color names
  const getRgbForColor = (color: string) => {
    return color === 'blue' ? { r: 59, g: 130, b: 246 } :
      color === 'green' ? { r: 16, g: 185, b: 129 } :
      color === 'purple' ? { r: 139, g: 92, b: 246 } :
      color === 'orange' ? { r: 249, g: 115, b: 22 } :
      { r: 239, g: 68, b: 68 }; // Default red
  };

  // Timer for green zone
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isChallengeActive && inGreen) {
      interval = setInterval(() => setGreenTime(t => t + 0.1), 100);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isChallengeActive, inGreen]);

  // Show kick instruction after countdown
  useEffect(() => {
    if (!showCountdown && isChallengeActive) {
      setShowKickInstruction(true);
      const t = setTimeout(() => setShowKickInstruction(false), 3000);
      return () => clearTimeout(t);
    }
  }, [showCountdown, isChallengeActive]);

  // Enhanced pose drawing loop
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
        ctx.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
        let angleNow: number | null = null;
        let footIsDropped = false;
        poses.forEach((pose: any) => {
          if (pose.keypoints && pose.keypoints.length > 0) {
            const keypoints = pose.keypoints;
            // Draw skeleton
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
            // Calculate knee angle and kick height
            const hip = keypoints.find((kp: any) => kp.name === 'right_hip');
            const knee = keypoints.find((kp: any) => kp.name === 'right_knee');
            const ankle = keypoints.find((kp: any) => kp.name === 'right_ankle');
            if (hip && knee && ankle && (hip.score ?? 0) > 0.3 && (knee.score ?? 0) > 0.3 && (ankle.score ?? 0) > 0.3) {
              // Angle
              const radians = Math.atan2(ankle.y - knee.y, ankle.x - knee.x) - Math.atan2(hip.y - knee.y, hip.x - knee.x);
              let angle = Math.abs(radians * 180.0 / Math.PI);
              if (angle > 180.0) angle = 360.0 - angle;
              angle = Math.round(angle);
              angleNow = angle;
              // Draw angle at knee
              ctx.save();
              ctx.font = 'bold 24px Arial';
              ctx.fillStyle = 'yellow';
              ctx.strokeStyle = 'black';
              ctx.lineWidth = 4;
              ctx.strokeText(`${angle}°`, knee.x + 20, knee.y - 20);
              ctx.fillText(`${angle}°`, knee.x + 20, knee.y - 20);
              ctx.restore();
              // Kick height
              const kickHeight = (hip.y - ankle.y) / hip.y;
              footIsDropped = kickHeight < MIN_KICK_HEIGHT;
            }
          }
        });
        setKneeAngle(angleNow);
        setFootDropped(footIsDropped);
        // Meter logic
        if (angleNow !== null) {
          if (angleNow >= GREEN_THRESHOLD) setInGreen(true);
          else setInGreen(false);
        } else {
          setInGreen(false);
        }
      }
      animationFrameId.current = requestAnimationFrame(detectAndDrawPose);
    } catch (error) {
      animationFrameId.current = requestAnimationFrame(detectAndDrawPose);
    }
  };

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
  }, [isChallengeActive, detector, stream]);

  // Smooth meter pointer
  useEffect(() => {
    if (kneeAngle !== null) {
      setDisplayedAngle(prev => prev === null ? kneeAngle : prev + (kneeAngle - prev) * LERP_SPEED);
    }
  }, [kneeAngle]);

  // Leg switching logic
  const [wasInZone, setWasInZone] = useState(false);
  useEffect(() => {
    if (!isChallengeActive || showCountdown) return;
    if (kneeAngle !== null && (kneeAngle >= YELLOW_THRESHOLD)) {
      setWasInZone(true);
    }
    if (wasInZone && kneeAngle !== null && kneeAngle < YELLOW_THRESHOLD) {
      // User dropped out of zone
      setShowSwitchLeg(true);
      setWasInZone(false);
      if (currentLeg === 'right') {
        setRightLegTime(greenTime);
        setTimeout(() => {
          setCurrentLeg('left');
          setGreenTime(0);
          setShowSwitchLeg(false);
          setWasInZone(false);
          setShowKickInstruction(true);
          setTimeout(() => setShowKickInstruction(false), 3000);
        }, 2500);
      } else {
        setLeftLegTime(greenTime);
        setTimeout(() => {
          setChallengeComplete(true);
          setIsChallengeActive(false);
          setShowSwitchLeg(false);
        }, 2500);
      }
    }
  }, [kneeAngle, wasInZone, isChallengeActive, showCountdown, currentLeg, greenTime]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Uniform Top Banner */}
      <div className="w-full fixed top-0 left-0 z-50">
        <div className="flex items-center justify-between bg-gradient-to-r from-[#6b1b1b] to-black h-10 px-4 shadow-md">
          <button onClick={() => navigate('/challenges')} className="flex items-center text-white hover:text-red-400 font-semibold text-sm">
            <ArrowLeft className="w-5 h-5 mr-1" /> Back
          </button>
          <div className="flex-1 flex justify-center">
            <span className="text-red-400 font-bold text-lg">Balance Beam Breaker</span>
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
                  Balance Beam Breaker
                </h2>
                <p className="text-purple-200 text-lg mb-6">
                  <strong>Goal:</strong> Hold a perfect side-kick for as long as possible. Keep your leg straight and high, and maintain your balance!
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
              <div className="text-yellow-400 text-3xl sm:text-5xl font-bold mb-2 bg-black/40 px-4 py-2 rounded-xl">Get ready to side kick and hold!</div>
              <div className="text-yellow-400 text-7xl sm:text-9xl font-bold bg-black/40 px-8 py-4 rounded-2xl">{countdown}</div>
            </div>
          )}
        </div>

        {/* Meter overlay */}
        {isChallengeActive && !showCountdown && !challengeComplete && (
          <div className="fixed top-16 left-1/2 transform -translate-x-1/2 z-40 w-full max-w-xl flex flex-col items-center">
            <div className="w-full px-8">
              <div className="relative w-full h-6 rounded-full bg-gradient-to-r from-red-500 via-yellow-400 to-green-500 shadow-lg">
                {/* Meter pointer */}
                {displayedAngle !== null && (
                  <div
                    className="absolute top-0 h-6 w-1.5 rounded bg-white shadow transition-all duration-200"
                    style={{ left: `calc(${((Math.max(120, Math.min(180, displayedAngle)) - 120) / 60) * 100}% - 3px)`, minWidth: 6, maxWidth: 12 }}
                  />
                )}
              </div>
              <div className="flex justify-between text-xs text-white mt-1 px-1">
                <span>Not Straight</span>
                <span>Almost</span>
                <span>Perfect</span>
              </div>
            </div>
            <div className="mt-2 text-lg font-bold text-green-300 drop-shadow">
              {inGreen ? `In perfect form! Time: ${greenTime.toFixed(1)}s` : 'Hold your leg straighter!'}
            </div>
            <div className="mt-1 text-base text-white font-semibold">
              {currentLeg === 'right' ? 'Right Leg' : 'Left Leg'}
            </div>
          </div>
        )}

        {/* Kick instruction overlay */}
        {showKickInstruction && (
          <div className="fixed top-32 left-1/2 transform -translate-x-1/2 z-50 bg-black/80 text-white text-2xl font-bold px-8 py-4 rounded-2xl shadow-lg border-2 border-purple-600">
            Side kick with your {currentLeg === 'right' ? 'right' : 'left'} foot and hold!
          </div>
        )}

        {/* Foot drop warning */}
        {isChallengeActive && !showCountdown && !challengeComplete && footDropped && (
          <div className="fixed top-48 left-1/2 transform -translate-x-1/2 z-50 bg-red-700/90 text-white text-xl font-semibold px-6 py-3 rounded-xl shadow-lg border border-red-300">
            Keep your foot up and hold it a bit longer!
          </div>
        )}

        {/* Switch leg overlay */}
        {showSwitchLeg && (
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 bg-black/90 text-yellow-300 text-2xl font-bold px-10 py-6 rounded-2xl shadow-lg border-2 border-yellow-400">
            {currentLeg === 'right' ? 'Switch to your left leg!' : 'Challenge complete!'}
          </div>
        )}

        {/* Challenge complete overlay */}
        {challengeComplete && (
          <div className="fixed inset-0 flex flex-col items-center justify-center z-50 bg-black/80">
            <div className="bg-gradient-to-br from-gray-800 to-black p-8 rounded-2xl shadow-2xl border border-purple-700 max-w-lg text-center">
              <h2 className="text-3xl font-bold text-yellow-400 mb-4">Challenge Complete!</h2>
              <div className="text-xl text-white mb-6 space-y-2">
                <p>Right Leg: {rightLegTime.toFixed(1)}s in green</p>
                <p>Left Leg: {leftLegTime.toFixed(1)}s in green</p>
                <p className="text-yellow-400 font-bold mt-4">Total: {(rightLegTime + leftLegTime).toFixed(1)}s</p>
              </div>
              <Button onClick={startChallenge} className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-3 px-8 rounded-lg text-lg shadow-lg hover:shadow-yellow-500/50 transition-all duration-300 ease-in-out">
                Try Again
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BalanceBeamBreakerChallenge; 