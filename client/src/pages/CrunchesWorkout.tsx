import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Heart } from 'lucide-react';
import { useLocation } from 'wouter';
import { initPoseDetection, detectPoses, getJointConnections } from '@/lib/poseDetection';

const COUNTDOWN_SECONDS = 3;
const SKELETON_COLOR = 'green';
const DRAWING_CONFIDENCE_THRESHOLD = 0.3;

// Crunch detection thresholds
const CRUNCH_DOWN_THRESHOLD = 120; // degrees - when torso is down
const CRUNCH_UP_THRESHOLD = 80; // degrees - when torso is crunched up

const CrunchesWorkout: React.FC = () => {
  const [, navigate] = useLocation();
  const [showInstructions, setShowInstructions] = useState(true);
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [showCountdown, setShowCountdown] = useState(false);
  const [detector, setDetector] = useState<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const animationFrameId = useRef<number | null>(null);
  
  // Crunch counting state
  const [crunchCount, setCrunchCount] = useState(0);
  const [currentPhase, setCurrentPhase] = useState<'up' | 'down' | 'transition'>('down');
  const [torsoAngle, setTorsoAngle] = useState<number | null>(null);
  const [isPerfectPosition, setIsPerfectPosition] = useState(false);
  const [workoutComplete, setWorkoutComplete] = useState(false);
  const [workoutDuration, setWorkoutDuration] = useState(0);
  const [workoutStartTime, setWorkoutStartTime] = useState<number | null>(null);
  
  // Stats tracking
  const [previousStats, setPreviousStats] = useState<{
    lastWorkout?: { count: number; duration: number; date: string };
    bestWorkout?: { count: number; duration: number; date: string };
    totalWorkouts: number;
    totalCrunches: number;
  }>({
    totalWorkouts: 0,
    totalCrunches: 0,
  });

  // Coaching feedback state
  const [coachingFeedback, setCoachingFeedback] = useState<string>('');
  const [feedbackCount, setFeedbackCount] = useState(0);

  // Load previous stats from localStorage
  useEffect(() => {
    const savedStats = localStorage.getItem('crunchesWorkoutStats');
    if (savedStats) {
      setPreviousStats(JSON.parse(savedStats));
    }
  }, []);

  // Save workout stats to localStorage
  const saveWorkoutStats = (count: number, duration: number) => {
    const currentDate = new Date().toLocaleDateString();
    const newWorkout = { count, duration, date: currentDate };
    
    const updatedStats = {
      lastWorkout: newWorkout,
      bestWorkout: !previousStats.bestWorkout || count > previousStats.bestWorkout.count 
        ? newWorkout 
        : previousStats.bestWorkout,
      totalWorkouts: previousStats.totalWorkouts + 1,
      totalCrunches: previousStats.totalCrunches + count,
    };
    
    setPreviousStats(updatedStats);
    localStorage.setItem('crunchesWorkoutStats', JSON.stringify(updatedStats));
  };

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

  useEffect(() => {
    const getCameraFeed = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.onloadedmetadata = () => {
            if (videoRef.current) {
              videoRef.current.play();
              if (canvasRef.current) {
                canvasRef.current.width = videoRef.current.videoWidth;
                canvasRef.current.height = videoRef.current.videoHeight;
              }
            }
          };
        }
        setStream(mediaStream);
      } catch (error) {
        console.error('Error accessing camera:', error);
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
  }, []);

  const startWorkout = () => {
    setShowInstructions(false);
    setIsWorkoutActive(true);
    setCountdown(COUNTDOWN_SECONDS);
    setShowCountdown(true);
    setCrunchCount(0);
    setCurrentPhase('down');
    setWorkoutComplete(false);
    setWorkoutStartTime(Date.now());
    setCoachingFeedback('');
    setFeedbackCount(0);
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

  // Timer for workout duration
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isWorkoutActive && !showCountdown && workoutStartTime) {
      interval = setInterval(() => {
        setWorkoutDuration(Math.floor((Date.now() - workoutStartTime) / 1000));
      }, 1000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isWorkoutActive, showCountdown, workoutStartTime]);

  // Calculate angles between three points
  const calculateAngle = (pointA: any, pointB: any, pointC: any) => {
    if (!pointA || !pointB || !pointC) return null;
    
    const radians = Math.atan2(pointC.y - pointB.y, pointC.x - pointB.x) - 
                   Math.atan2(pointA.y - pointB.y, pointA.x - pointB.x);
    let angle = Math.abs(radians * 180.0 / Math.PI);
    if (angle > 180.0) angle = 360.0 - angle;
    return Math.round(angle);
  };

  // Enhanced pose drawing and crunch detection loop
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

        let torso: number | null = null;
        let perfectPos = false;

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

            // Calculate angles for crunch detection
            const leftShoulder = keypoints.find((kp: any) => kp.name === 'left_shoulder');
            const rightShoulder = keypoints.find((kp: any) => kp.name === 'right_shoulder');
            const leftHip = keypoints.find((kp: any) => kp.name === 'left_hip');
            const rightHip = keypoints.find((kp: any) => kp.name === 'right_hip');
            const leftKnee = keypoints.find((kp: any) => kp.name === 'left_knee');
            const rightKnee = keypoints.find((kp: any) => kp.name === 'right_knee');

            // Calculate torso angle (shoulder to hip)
            if (leftShoulder && rightShoulder && leftHip && rightHip) {
              const shoulderMidpoint = {
                x: (leftShoulder.x + rightShoulder.x) / 2,
                y: (leftShoulder.y + rightShoulder.y) / 2
              };
              const hipMidpoint = {
                x: (leftHip.x + rightHip.x) / 2,
                y: (leftHip.y + rightHip.y) / 2
              };
              const kneeMidpoint = leftKnee && rightKnee ? {
                x: (leftKnee.x + rightKnee.x) / 2,
                y: (leftKnee.y + rightKnee.y) / 2
              } : null;

              if (kneeMidpoint) {
                torso = calculateAngle(shoulderMidpoint, hipMidpoint, kneeMidpoint);
                if (torso !== null) {
                  ctx.save();
                  ctx.font = 'bold 20px Arial';
                  ctx.fillStyle = 'yellow';
                  ctx.strokeStyle = 'black';
                  ctx.lineWidth = 3;
                  ctx.strokeText(`${torso}°`, hipMidpoint.x - 20, hipMidpoint.y - 30);
                  ctx.fillText(`${torso}°`, hipMidpoint.x - 20, hipMidpoint.y - 30);
                  ctx.restore();
                }
              }
            }

            // Check if in perfect crunch position (person is lying down and facing camera)
            perfectPos = torso !== null && leftShoulder && rightShoulder && leftHip && rightHip;
          }
        });

        setTorsoAngle(torso);
        setIsPerfectPosition(perfectPos);

        // Crunch counting logic
        if (isWorkoutActive && !showCountdown && torso !== null && perfectPos) {
          if (currentPhase === 'down' && torso <= CRUNCH_UP_THRESHOLD) {
            setCurrentPhase('up');
          } else if (currentPhase === 'up' && torso >= CRUNCH_DOWN_THRESHOLD) {
            setCurrentPhase('down');
            setCrunchCount(prev => prev + 1);
            setFeedbackCount(prev => prev + 1);
          }
        }

        // Coaching feedback logic - provide feedback after 5-10 crunches
        if (isWorkoutActive && !showCountdown && feedbackCount >= 5) {
          if (torso !== null) {
            if (!perfectPos) {
              setCoachingFeedback("Lie down flat and face the camera!");
            } else if (currentPhase === 'down' && torso > CRUNCH_DOWN_THRESHOLD - 20) {
              setCoachingFeedback("Crunch higher! Lift those shoulders!");
            } else if (currentPhase === 'up' && torso < CRUNCH_UP_THRESHOLD + 20) {
              setCoachingFeedback("Lower back down slowly and controlled!");
            } else if (perfectPos && currentPhase === 'up') {
              setCoachingFeedback("Great crunch! Feel those abs working!");
            } else if (perfectPos && currentPhase === 'down') {
              setCoachingFeedback("Perfect! Keep that steady rhythm!");
            } else {
              setCoachingFeedback("Keep going! Focus on controlled movements!");
            }
          } else {
            setCoachingFeedback("Lie down and position yourself for crunches!");
          }
        } else if (isWorkoutActive && !showCountdown && feedbackCount < 5) {
          setCoachingFeedback("Keep going! I'll give you tips soon!");
        }
      }

      animationFrameId.current = requestAnimationFrame(detectAndDrawPose);
    } catch (error) {
      animationFrameId.current = requestAnimationFrame(detectAndDrawPose);
    }
  };

  useEffect(() => {
    if (isWorkoutActive && detector && stream) {
      animationFrameId.current = requestAnimationFrame(detectAndDrawPose);
    } else {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      }
      if (canvasRef.current && !isWorkoutActive) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [isWorkoutActive, detector, stream]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const finishWorkout = () => {
    setIsWorkoutActive(false);
    setWorkoutComplete(true);
    // Save workout stats
    saveWorkoutStats(crunchCount, workoutDuration);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-900 to-teal-900 text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Uniform Top Banner */}
      <div className="w-full fixed top-0 left-0 z-50">
        <div className="flex items-center justify-between bg-gradient-to-r from-[#6b1b1b] to-black h-10 px-4 shadow-md">
          <button onClick={() => navigate('/workouts')} className="flex items-center text-white hover:text-red-400 font-semibold text-sm">
            <ArrowLeft className="w-5 h-5 mr-1" /> Back
          </button>
          <div className="flex-1 flex justify-center">
            <span className="text-red-400 font-bold text-lg">Crunches Workout</span>
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
                className="bg-gradient-to-br from-gray-800 to-black p-8 rounded-2xl shadow-2xl border border-green-700 max-w-lg text-center"
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.3 }}
              >
                <Heart className="text-green-400 w-16 h-16 mx-auto mb-4" />
                <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-teal-500 mb-4">
                  Crunches Workout
                </h2>
                <div className="text-green-200 text-lg mb-6 space-y-3">
                  <p><strong>Instructions:</strong></p>
                  <p>• Lie on your back facing the camera</p>
                  <p>• Bend your knees and keep feet flat</p>
                  <p>• Lift your shoulders off the ground</p>
                  <p>• Crunch your abs and lower back down</p>
                  <p>• I'll count each perfect crunch for you!</p>
                </div>
                <div className="flex justify-center gap-4">
                  <Button
                    onClick={() => navigate('/workouts')}
                    variant="outline"
                    className="text-green-300 border-green-600 hover:bg-green-700 hover:text-white"
                  >
                    Back to Workouts
                  </Button>
                  <Button
                    onClick={startWorkout}
                    className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white font-semibold"
                  >
                    Start Workout!
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
          
          {/* Countdown overlay */}
          {isWorkoutActive && showCountdown && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-20 pointer-events-none">
              <div className="text-green-400 text-3xl sm:text-5xl font-bold mb-2 bg-black/40 px-4 py-2 rounded-xl">Lie down and get ready!</div>
              <div className="text-green-400 text-7xl sm:text-9xl font-bold bg-black/40 px-8 py-4 rounded-2xl">{countdown}</div>
            </div>
          )}
        </div>

        {/* Stats Panel - Always visible when not in instructions */}
        {!showInstructions && (
          <div className="fixed top-16 right-4 z-40 w-64">
            <div className="bg-black/90 rounded-xl p-4 shadow-lg border border-green-600">
              <h3 className="text-green-400 font-bold text-lg mb-3 text-center">📊 Your Stats</h3>
              <div className="space-y-2 text-sm">
                {previousStats.lastWorkout ? (
                  <div className="bg-green-900/30 rounded-lg p-2">
                    <div className="text-green-300 font-semibold">Last Workout:</div>
                    <div className="text-white">{previousStats.lastWorkout.count} crunches</div>
                    <div className="text-gray-400">{previousStats.lastWorkout.date}</div>
                  </div>
                ) : (
                  <div className="bg-green-900/30 rounded-lg p-2">
                    <div className="text-green-300 font-semibold">First workout!</div>
                    <div className="text-gray-400">No previous data</div>
                  </div>
                )}
                
                {previousStats.bestWorkout && (
                  <div className="bg-yellow-900/30 rounded-lg p-2">
                    <div className="text-yellow-300 font-semibold">🏆 Personal Best:</div>
                    <div className="text-white">{previousStats.bestWorkout.count} crunches</div>
                    <div className="text-gray-400">{previousStats.bestWorkout.date}</div>
                  </div>
                )}
                
                <div className="bg-gray-800/50 rounded-lg p-2">
                  <div className="text-gray-300 font-semibold">Total:</div>
                  <div className="text-white">{previousStats.totalWorkouts} workouts</div>
                  <div className="text-white">{previousStats.totalCrunches} crunches</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Workout stats overlay */}
        {isWorkoutActive && !showCountdown && !workoutComplete && (
          <div className="fixed top-16 left-1/2 transform -translate-x-1/2 z-40 w-full max-w-md flex flex-col items-center">
            <div className="bg-black/80 rounded-xl p-4 shadow-lg border border-green-600">
              <div className="text-center mb-2">
                <div className="text-3xl font-bold text-green-400">{crunchCount}</div>
                <div className="text-sm text-white">Crunches</div>
              </div>
              <div className="flex justify-between text-sm text-gray-300">
                <span>Time: {formatTime(workoutDuration)}</span>
                <span>Phase: {currentPhase.toUpperCase()}</span>
              </div>
            </div>
          </div>
        )}

        {/* Form feedback */}
        {isWorkoutActive && !showCountdown && !workoutComplete && (
          <div className="fixed top-32 left-1/2 transform -translate-x-1/2 z-40 max-w-md">
            <div className={`text-center px-4 py-2 rounded-lg ${
              isPerfectPosition ? 'bg-green-600/80 text-white' : 'bg-red-600/80 text-white'
            }`}>
              {isPerfectPosition ? 
                'Perfect form! Keep crunching!' : 
                'Lie down and face the camera'
              }
            </div>
          </div>
        )}

        {/* Coaching feedback */}
        {isWorkoutActive && !showCountdown && !workoutComplete && coachingFeedback && (
          <div className="fixed top-48 left-1/2 transform -translate-x-1/2 z-40 max-w-lg">
            <div className="bg-green-600/90 text-white text-center px-6 py-3 rounded-lg shadow-lg border-2 border-green-400">
              <div className="text-lg font-bold">💪 Coach Says:</div>
              <div className="text-base mt-1">{coachingFeedback}</div>
            </div>
          </div>
        )}

        {/* Finish workout button */}
        {isWorkoutActive && !showCountdown && !workoutComplete && (
          <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-40">
            <Button
              onClick={finishWorkout}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-lg"
            >
              Finish Workout
            </Button>
          </div>
        )}

        {/* Workout complete overlay */}
        {workoutComplete && (
          <div className="fixed inset-0 flex flex-col items-center justify-center z-50 bg-black/80">
            <div className="bg-gradient-to-br from-gray-800 to-black p-8 rounded-2xl shadow-2xl border border-green-700 max-w-lg text-center">
              <h2 className="text-3xl font-bold text-green-400 mb-4">Workout Complete!</h2>
              <div className="text-xl text-white mb-6 space-y-2">
                <p className="text-green-400 font-bold text-3xl">{crunchCount}</p>
                <p>Crunches completed</p>
                <p>Duration: {formatTime(workoutDuration)}</p>
                <p className="text-sm text-gray-300 mt-4">
                  Excellent core work! Your abs are getting stronger!
                </p>
              </div>
              <div className="flex justify-center gap-4">
                <Button
                  onClick={() => navigate('/workouts')}
                  variant="outline"
                  className="text-green-300 border-green-600 hover:bg-green-700 hover:text-white"
                >
                  Back to Workouts
                </Button>
                <Button
                  onClick={startWorkout}
                  className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white font-semibold"
                >
                  Do Another Set
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CrunchesWorkout; 