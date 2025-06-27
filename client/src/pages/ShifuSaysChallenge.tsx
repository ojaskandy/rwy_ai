import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, Link } from "wouter";
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Camera, ArrowLeft, Crown, User, Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { initPoseDetection, detectPoses, getJointConnections } from '@/lib/poseDetection';
import { detectMartialArtsPoseAdvanced, analyzePoseFromKeypoints, updateReferencePose } from '@/lib/poseAnalysis';
import PoseAnalyzer from '@/components/PoseAnalyzer';

// Game interfaces removed - will be rebuilt

const ShifuSaysChallenge: React.FC = () => {
  const [, navigate] = useLocation();
  const [showPoseAnalyzer, setShowPoseAnalyzer] = useState(false);
  const [gameState, setGameState] = useState<'waiting' | 'countdown' | 'playing'>('waiting');
  const [countdown, setCountdown] = useState<number | null>(null);
  const [currentMove, setCurrentMove] = useState<string | null>(null);
  const [isShifuSays, setIsShifuSays] = useState<boolean>(false);
  const [showCheckMark, setShowCheckMark] = useState(false);
  const [moveMatched, setMoveMatched] = useState(false);

  // Camera and skeleton visibility controls
  const [showCamera, setShowCamera] = useState(true);
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [currentDetectedPose, setCurrentDetectedPose] = useState<string>('No Pose');

  // Camera and pose detection refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [detector, setDetector] = useState<any>(null);
  const animationFrameId = useRef<number | null>(null);
  const frameCountRef = useRef(0);
  const frameSkipRate = 3;

  // Immediate backend sync refs - these update instantly without waiting for React re-render
  const currentMoveRef = useRef<string | null>(null);
  const isShifuSaysRef = useRef<boolean>(false);
  const gameStateRef = useRef<'waiting' | 'countdown' | 'playing'>('waiting');
  const moveMatchedRef = useRef<boolean>(false);

  // Audio and timer refs removed - will be rebuilt

  // Add debug state
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  // Add frame counter for logging
  const [frameCounter, setFrameCounter] = useState(0);

  // Add debug function
  const addDebugInfo = (info: string) => {
    console.log('DEBUG:', info);
    setDebugInfo(prev => [...prev.slice(-4), `${new Date().toLocaleTimeString()}: ${info}`]);
  };

  // Debug: Track currentMove state changes
  useEffect(() => {
    console.log(`📝 🎯 CURRENTMOVE STATE CHANGED: "${currentMove}"`);
    console.log(`📝 🎯 UI should now display: "${isShifuSays ? 'Shifu says: ' : ''}${currentMove}"`);
  }, [currentMove]);

  // Debug: Track moveMatched state changes
  useEffect(() => {
    console.log(`📝 moveMatched state changed to: ${moveMatched} | Command: "${currentMove}" | Current Pose: "${currentDetectedPose}"`);
  }, [moveMatched]);

  // Debug: Track gameState changes
  useEffect(() => {
    console.log(`📝 gameState changed to: "${gameState}"`);
  }, [gameState]);

  // Debug: Track isShifuSays changes
  useEffect(() => {
    console.log(`📝 🎯 SHIFUSAYS STATE CHANGED: ${isShifuSays}`);
    console.log(`📝 🎯 Full command display should be: "${isShifuSays ? 'Shifu says: ' : ''}${currentMove}"`);
  }, [isShifuSays]);

  // Available moves for the game
  const availableMoves = [
    'Left High Block',
    'Right High Block', 
    'Left Mid Block',
    'Right Mid Block',
    'Left Punch', 
    'Right Punch',
    'Left Kick',
    'Right Kick',
    'X Block'
  ];

  // Audio file mapping
  const getAudioFile = (move: string, isShifuSays: boolean): string => {
    const baseFolder = isShifuSays ? 'shifu_says' : 'normal';
    const prefix = isShifuSays ? 'Shifu Says' : 'LMNT Shifu';
    return `/sounds/${baseFolder}/${prefix} ${move}.mp3`;
  };

  // Random move selection with audio
  const selectRandomMove = () => {
    console.log(`🚨 selectRandomMove() STARTING! | Before: currentMove="${currentMove}" | gameState="${gameState}"`);
    
    // Reset moveMatched flag for new move
    setMoveMatched(false);
    moveMatchedRef.current = false; // 🔥 IMMEDIATE backend sync
    console.log(`🚨 setMoveMatched(false) called + moveMatchedRef.current = false`);
    
    // Pick random move
    const randomIndex = Math.floor(Math.random() * availableMoves.length);
    const selectedMove = availableMoves[randomIndex];
    console.log(`🚨 Random move selected: "${selectedMove}" (index ${randomIndex})`);
    
    // 70% chance for Shifu Says, 30% for normal
    const shifuSays = Math.random() < 0.7;
    console.log(`🚨 Shifu Says flag: ${shifuSays}`);
    
    console.log(`🚨 ABOUT TO SET STATE: setCurrentMove("${selectedMove}")`);
    setCurrentMove(selectedMove);
    currentMoveRef.current = selectedMove; // 🔥 IMMEDIATE backend sync
    console.log(`🚨 setCurrentMove("${selectedMove}") called + currentMoveRef.current = "${selectedMove}"`);
    
    console.log(`🚨 ABOUT TO SET STATE: setIsShifuSays(${shifuSays})`);
    setIsShifuSays(shifuSays);
    isShifuSaysRef.current = shifuSays; // 🔥 IMMEDIATE backend sync
    console.log(`🚨 setIsShifuSays(${shifuSays}) called + isShifuSaysRef.current = ${shifuSays}`);
    
    console.log(`🔥 BACKEND IMMEDIATELY SYNCED: currentMoveRef="${currentMoveRef.current}", isShifuSaysRef=${isShifuSaysRef.current}`);
    
    // Play audio
    const audioPath = getAudioFile(selectedMove, shifuSays);
    console.log(`🚨 Audio path: ${audioPath}`);
    
    const audio = new Audio(audioPath);
    audio.play().catch(error => {
      console.error(`🚨 ERROR playing audio: ${error}`);
    });
    
    console.log(`🚨 selectRandomMove() COMPLETED!`);
  };

  // Initialize pose detection
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

  // Initialize camera
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
          
          // Start pose detection loop
          detectAndDrawPose();
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

  const detectAndDrawPose = async () => {
    frameCountRef.current = (frameCountRef.current + 1) % frameSkipRate;
    if (frameCountRef.current !== 0) {
      animationFrameId.current = requestAnimationFrame(detectAndDrawPose);
      return;
    }

    if (videoRef.current && canvasRef.current && detector && videoRef.current.readyState >= 2 && videoRef.current.videoWidth > 0) {
      try {
        const poses = await detectPoses(videoRef.current, 1, 0.3);
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          // Clear the canvas
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          
          // Draw camera feed if enabled
          if (showCamera) {
            ctx.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
          }

          if (poses.length > 0) {
            const pose = poses[0];
            
            // Use the original working pose detection that recognizes the specific moves
            const currentPose = detectCurrentPose(pose.keypoints);
            setCurrentDetectedPose(currentPose);
            
            // 🚨 BASIC DEBUG - Always log gameState, pose, and command for EVERY frame
            console.log(`🚨 EVERY FRAME: gameState="${gameState}" | Command="${currentMove}" | Pose="${currentPose}"`);
            console.log(`🔥 REFS CHECK: gameStateRef="${gameStateRef.current}" | currentMoveRef="${currentMoveRef.current}" | moveMatchedRef=${moveMatchedRef.current}`);
            
            // 🎯 BULLETPROOF POSE MATCHING - ALWAYS check when game is playing (use ref for immediate sync)
            if (gameState === 'playing' || gameStateRef.current === 'playing') {
              // FRONTEND-BACKEND SYNC VERIFICATION - Check DOM vs React state vs Refs
              const frontendCommand = document.querySelector('[data-testid="current-command"]')?.textContent || 'NOT_FOUND';
              const frontendPose = document.querySelector('[data-testid="current-pose"]')?.textContent || 'NOT_FOUND';
              
              // Debug EVERY SINGLE frame when game is active
              console.log(`🔍 MATCH CHECK:`);
              console.log(`   React State: gameState="${gameState}" | Expected="${currentMove}" | Detected="${currentPose}" | Matched=${moveMatched}`);
              console.log(`   Ref Values:  gameStateRef="${gameStateRef.current}" | currentMoveRef="${currentMoveRef.current}" | moveMatchedRef=${moveMatchedRef.current}`);
              console.log(`   Frontend DOM: Command="${frontendCommand}" | Pose="${frontendPose}"`);
              
              // Verify frontend matches backend
              if (frontendCommand !== currentMove) {
                console.log(`⚠️  SYNC WARNING: Frontend command "${frontendCommand}" != React state "${currentMove}"`);
              }
              if (frontendCommand !== currentMoveRef.current) {
                console.log(`⚠️  SYNC WARNING: Frontend command "${frontendCommand}" != Ref value "${currentMoveRef.current}"`);
              }
              if (frontendPose !== currentPose) {
                console.log(`⚠️  SYNC WARNING: Frontend pose "${frontendPose}" != React state "${currentPose}"`);
              }
              
              // Simple matching logic - USE REFS for immediate backend sync
              if (currentMoveRef.current && currentPose === currentMoveRef.current && !moveMatchedRef.current) {
                console.log(`🎉 SUCCESS! PERFECT MATCH DETECTED!`);
                console.log(`✅ "${currentPose}" === "${currentMoveRef.current}"`);
                console.log(`✅ Frontend and React state are synchronized!`);
                
                // IMMEDIATELY prevent multiple triggers
                setMoveMatched(true);
                moveMatchedRef.current = true; // 🔥 IMMEDIATE backend sync
                setShowCheckMark(true);
                
                console.log(`🚨 MATCH DETECTED - moveMatched set to TRUE + moveMatchedRef.current = true to prevent multiple triggers`);
                
                // Next move after 2 seconds - but ONLY once
                setTimeout(() => {
                  console.log(`⏰ 2 seconds passed - advancing to next move...`);
                  console.log(`🚨 BEFORE ADVANCE: moveMatched=${moveMatched}, showCheckMark=${showCheckMark}`);
                  console.log(`🚨 BEFORE ADVANCE REFS: moveMatchedRef=${moveMatchedRef.current}, currentMoveRef="${currentMoveRef.current}"`);
                  
                  setShowCheckMark(false);
                  setMoveMatched(false);
                  moveMatchedRef.current = false; // 🔥 IMMEDIATE backend sync
                  
                  // Pick a random move (same logic as emergency fix)
                  const randomIndex = Math.floor(Math.random() * availableMoves.length);
                  const randomMove = availableMoves[randomIndex];
                  const randomShifuSays = Math.random() < 0.7;
                  
                  console.log(`🎯 ADVANCING TO: "${randomMove}", Shifu Says: ${randomShifuSays}`);
                  console.log(`🚨 SETTING NEW MOVE: setCurrentMove("${randomMove}")`);
                  console.log(`🚨 SETTING NEW SHIFU: setIsShifuSays(${randomShifuSays})`);
                  
                  setCurrentMove(randomMove);
                  currentMoveRef.current = randomMove; // 🔥 IMMEDIATE backend sync
                  setIsShifuSays(randomShifuSays);
                  isShifuSaysRef.current = randomShifuSays; // 🔥 IMMEDIATE backend sync
                  
                  console.log(`🔥 BACKEND IMMEDIATELY SYNCED: currentMoveRef="${currentMoveRef.current}", isShifuSaysRef=${isShifuSaysRef.current}`);
                  console.log(`🚨 AFTER ADVANCE: States set - UI should update to show "${randomShifuSays ? 'Shifu says: ' : ''}${randomMove}"`);
                  
                  // Force a re-render check
                  setTimeout(() => {
                    console.log(`🔍 UI UPDATE CHECK: After 100ms, states should be currentMove="${randomMove}", isShifuSays=${randomShifuSays}`);
                    console.log(`🔍 REFS CHECK: currentMoveRef="${currentMoveRef.current}", isShifuSaysRef=${isShifuSaysRef.current}`);
                  }, 100);
                }, 2000);
              }
            }
            
            // Draw skeleton overlay
            drawSkeleton(ctx, pose.keypoints);
          } else {
            // No poses detected
            setCurrentDetectedPose('No Pose');
            
            // 🚨 BASIC DEBUG - Always log gameState, pose, and command (even when no poses)
            console.log(`🚨 EVERY FRAME: gameState="${gameState}" | Command="${currentMove}" | Pose="No Pose"`);
            console.log(`🔥 REFS CHECK: gameStateRef="${gameStateRef.current}" | currentMoveRef="${currentMoveRef.current}" | moveMatchedRef=${moveMatchedRef.current}`);
            
            // When game is playing but no pose detected, still log
            if (gameState === 'playing' || gameStateRef.current === 'playing') {
              console.log(`🔍 MATCH CHECK: gameState="${gameState}" | Expected="${currentMove}" | Detected="No Pose" | Matched=${moveMatched}`);
              console.log(`🔍 REF CHECK: gameStateRef="${gameStateRef.current}" | currentMoveRef="${currentMoveRef.current}" | moveMatchedRef=${moveMatchedRef.current}`);
            }
          }
        }
      } catch (error) {
        console.error('Error detecting poses:', error);
      }
    }
    
    animationFrameId.current = requestAnimationFrame(detectAndDrawPose);
  };

  const detectMartialArtsPose = (keypoints: any[]): string | null => {
    // Use the advanced pose analysis system
    const result = detectMartialArtsPoseAdvanced(keypoints);
    
    // Log detailed analysis for debugging
    if (result.pose) {
      console.log(`Detected pose: ${result.pose} with confidence: ${(result.confidence * 100).toFixed(1)}%`);
      console.log('All pose confidences:', result.allResults.map(r => `${r.pose}: ${(r.confidence * 100).toFixed(1)}%`));
    }
    
    return result.pose;
  };

  const drawSkeleton = (ctx: CanvasRenderingContext2D, keypoints: any[]) => {
    if (!showSkeleton) return;

    // Helper function to find keypoint by name
    const findKeypoint = (name: string) => {
      return keypoints.find(kp => kp.name === name && kp.score > 0.3);
    };

    // Draw connections first (lines)
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.8)'; // Cyan color for connections
    ctx.lineWidth = 3;
    
    const connections = getJointConnections();
    connections.forEach(([startName, endName]) => {
      const startPoint = findKeypoint(startName);
      const endPoint = findKeypoint(endName);
      
      if (startPoint && endPoint) {
        ctx.beginPath();
        ctx.moveTo(startPoint.x, startPoint.y);
        ctx.lineTo(endPoint.x, endPoint.y);
        ctx.stroke();
      }
    });

    // Draw keypoints on top (circles)
    keypoints.forEach(keypoint => {
      if (keypoint.score > 0.3) {
        // Different colors for different body parts
        let color = 'rgba(255, 255, 0, 0.9)'; // Default yellow
        
        if (keypoint.name.includes('shoulder') || keypoint.name.includes('hip')) {
          color = 'rgba(255, 100, 100, 0.9)'; // Red for core joints
        } else if (keypoint.name.includes('elbow') || keypoint.name.includes('wrist')) {
          color = 'rgba(100, 255, 100, 0.9)'; // Green for arms
        } else if (keypoint.name.includes('knee') || keypoint.name.includes('ankle')) {
          color = 'rgba(100, 100, 255, 0.9)'; // Blue for legs
        } else if (keypoint.name.includes('eye') || keypoint.name.includes('ear') || keypoint.name.includes('nose')) {
          color = 'rgba(255, 255, 255, 0.9)'; // White for face
        }
        
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(keypoint.x, keypoint.y, 6, 0, 2 * Math.PI);
        ctx.fill();
        
        // Add a black border for better visibility
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });
  };

  // Modular pose detection system
  const calculateAngle = (pointA: any, pointB: any, pointC: any): number => {
    if (!pointA || !pointB || !pointC) return 0;
    
    // Calculate vectors
    const vectorBA = { x: pointA.x - pointB.x, y: pointA.y - pointB.y };
    const vectorBC = { x: pointC.x - pointB.x, y: pointC.y - pointB.y };
    
    // Calculate dot product
    const dotProduct = vectorBA.x * vectorBC.x + vectorBA.y * vectorBC.y;
    
    // Calculate magnitudes
    const magnitudeBA = Math.sqrt(vectorBA.x * vectorBA.x + vectorBA.y * vectorBA.y);
    const magnitudeBC = Math.sqrt(vectorBC.x * vectorBC.x + vectorBC.y * vectorBC.y);
    
    // Calculate angle in radians, then convert to degrees
    const cosAngle = dotProduct / (magnitudeBA * magnitudeBC);
    const clampedCos = Math.max(-1, Math.min(1, cosAngle)); // Clamp to avoid NaN
    const angleRadians = Math.acos(clampedCos);
    const angleDegrees = angleRadians * (180 / Math.PI);
    
    return angleDegrees;
  };

  const findKeypoint = (keypoints: any[], name: string) => {
    return keypoints.find(kp => kp.name === name && kp.score > 0.3);
  };

  const detectPunch = (keypoints: any[]): string | null => {
    // Check left arm
    const leftShoulder = findKeypoint(keypoints, 'left_shoulder');
    const leftElbow = findKeypoint(keypoints, 'left_elbow');
    const leftWrist = findKeypoint(keypoints, 'left_wrist');
    
    // Check right arm
    const rightShoulder = findKeypoint(keypoints, 'right_shoulder');
    const rightElbow = findKeypoint(keypoints, 'right_elbow');
    const rightWrist = findKeypoint(keypoints, 'right_wrist');
    
    let leftPunch = false;
    let rightPunch = false;
    
    // Check left arm punch - MORE STRICT CRITERIA
    if (leftShoulder && leftElbow && leftWrist) {
      const leftArmAngle = calculateAngle(leftShoulder, leftElbow, leftWrist);
      const isLeftArmStraight = leftArmAngle >= 160; // More strict - very straight arm
      const isLeftArmAtShoulderLevel = leftWrist.y <= leftShoulder.y + 10; // Stricter - closer to shoulder level
      const isLeftArmExtended = leftWrist.x > leftShoulder.x + 40; // Extended forward from body
      const isLeftElbowElevated = leftElbow.y <= leftShoulder.y + 40; // Elbow at reasonable height
      
      if (isLeftArmStraight && isLeftArmAtShoulderLevel && isLeftArmExtended && isLeftElbowElevated) {
        leftPunch = true;
      }
    }
    
    // Check right arm punch - MORE STRICT CRITERIA
    if (rightShoulder && rightElbow && rightWrist) {
      const rightArmAngle = calculateAngle(rightShoulder, rightElbow, rightWrist);
      const isRightArmStraight = rightArmAngle >= 160; // More strict - very straight arm
      const isRightArmAtShoulderLevel = rightWrist.y <= rightShoulder.y + 10; // Stricter - closer to shoulder level
      const isRightArmExtended = rightWrist.x < rightShoulder.x - 40; // Extended forward from body
      const isRightElbowElevated = rightElbow.y <= rightShoulder.y + 40; // Elbow at reasonable height
      
      if (isRightArmStraight && isRightArmAtShoulderLevel && isRightArmExtended && isRightElbowElevated) {
        rightPunch = true;
      }
    }
    
    // Return specific punch type
    if (leftPunch && rightPunch) {
      return 'Double Punch';
    } else if (leftPunch) {
      return 'Left Punch';
    } else if (rightPunch) {
      return 'Right Punch';
    }
    
    return null;
  };

  const detectKick = (keypoints: any[]): string | null => {
    // Check left leg
    const leftHip = findKeypoint(keypoints, 'left_hip');
    const leftKnee = findKeypoint(keypoints, 'left_knee');
    const leftAnkle = findKeypoint(keypoints, 'left_ankle');
    
    // Check right leg
    const rightHip = findKeypoint(keypoints, 'right_hip');
    const rightKnee = findKeypoint(keypoints, 'right_knee');
    const rightAnkle = findKeypoint(keypoints, 'right_ankle');
    
    let leftKick = false;
    let rightKick = false;
    
    // Check left leg kick - MORE STRICT CRITERIA
    if (leftHip && leftKnee && leftAnkle) {
      const leftLegAngle = calculateAngle(leftHip, leftKnee, leftAnkle);
      // Kick requires significant leg elevation AND extension
      const isLeftKneeRaised = leftKnee.y < leftHip.y - 20; // Knee well above hip level
      const isLeftAnkleElevated = leftAnkle.y < leftHip.y + 20; // Ankle elevated significantly
      const isLeftLegExtended = Math.abs(leftAnkle.x - leftHip.x) > 80; // Ankle significantly displaced
      const isLeftLegBent = leftLegAngle >= 90 && leftLegAngle <= 160; // Reasonable kicking angle
      
      // Strict: need multiple criteria for kick detection
      if (isLeftKneeRaised && isLeftAnkleElevated && isLeftLegExtended && isLeftLegBent) {
        leftKick = true;
      }
    }
    
    // Check right leg kick - MORE STRICT CRITERIA
    if (rightHip && rightKnee && rightAnkle) {
      const rightLegAngle = calculateAngle(rightHip, rightKnee, rightAnkle);
      // Kick requires significant leg elevation AND extension
      const isRightKneeRaised = rightKnee.y < rightHip.y - 20; // Knee well above hip level
      const isRightAnkleElevated = rightAnkle.y < rightHip.y + 20; // Ankle elevated significantly
      const isRightLegExtended = Math.abs(rightAnkle.x - rightHip.x) > 80; // Ankle significantly displaced
      const isRightLegBent = rightLegAngle >= 90 && rightLegAngle <= 160; // Reasonable kicking angle
      
      // Strict: need multiple criteria for kick detection
      if (isRightKneeRaised && isRightAnkleElevated && isRightLegExtended && isRightLegBent) {
        rightKick = true;
      }
    }
    
    // Return specific kick type
    if (leftKick && rightKick) {
      return 'Double Kick';
    } else if (leftKick) {
      return 'Left Kick';
    } else if (rightKick) {
      return 'Right Kick';
    }
    
    return null;
  };

  const detectHighBlock = (keypoints: any[]): string | null => {
    // Check left arm for high block
    const leftShoulder = findKeypoint(keypoints, 'left_shoulder');
    const leftElbow = findKeypoint(keypoints, 'left_elbow');
    const leftWrist = findKeypoint(keypoints, 'left_wrist');
    
    // Check right arm for high block
    const rightShoulder = findKeypoint(keypoints, 'right_shoulder');
    const rightElbow = findKeypoint(keypoints, 'right_elbow');
    const rightWrist = findKeypoint(keypoints, 'right_wrist');
    
    let leftHighBlock = false;
    let rightHighBlock = false;
    
    // Check left arm high block - BENT ARM, fist over eyes/face
    if (leftShoulder && leftElbow && leftWrist) {
      const leftArmAngle = calculateAngle(leftShoulder, leftElbow, leftWrist);
      const isLeftArmBent = leftArmAngle >= 70 && leftArmAngle <= 120; // Bent arm for blocking
      const isLeftFistOverFace = leftWrist.y < leftShoulder.y - 40; // Fist well above shoulder (over face)
      const isLeftElbowRaised = leftElbow.y < leftShoulder.y; // Elbow above shoulder
      
      if (isLeftArmBent && isLeftFistOverFace && isLeftElbowRaised) {
        leftHighBlock = true;
      }
    }
    
    // Check right arm high block - BENT ARM, fist over eyes/face
    if (rightShoulder && rightElbow && rightWrist) {
      const rightArmAngle = calculateAngle(rightShoulder, rightElbow, rightWrist);
      const isRightArmBent = rightArmAngle >= 70 && rightArmAngle <= 120; // Bent arm for blocking
      const isRightFistOverFace = rightWrist.y < rightShoulder.y - 40; // Fist well above shoulder (over face)
      const isRightElbowRaised = rightElbow.y < rightShoulder.y; // Elbow above shoulder
      
      if (isRightArmBent && isRightFistOverFace && isRightElbowRaised) {
        rightHighBlock = true;
      }
    }
    
    // Return specific high block type
    if (leftHighBlock && rightHighBlock) {
      return 'Double High Block';
    } else if (leftHighBlock) {
      return 'Left High Block';
    } else if (rightHighBlock) {
      return 'Right High Block';
    }
    
    return null;
  };

  const detectXBlock = (keypoints: any[]): boolean => {
    // Check both arms for X block
    const leftShoulder = findKeypoint(keypoints, 'left_shoulder');
    const leftElbow = findKeypoint(keypoints, 'left_elbow');
    const leftWrist = findKeypoint(keypoints, 'left_wrist');
    
    const rightShoulder = findKeypoint(keypoints, 'right_shoulder');
    const rightElbow = findKeypoint(keypoints, 'right_elbow');
    const rightWrist = findKeypoint(keypoints, 'right_wrist');
    
    if (!leftShoulder || !leftElbow || !leftWrist || !rightShoulder || !rightElbow || !rightWrist) {
      return false;
    }
    
    // X Block criteria - very lenient
    // 1. Both arms should be somewhat raised (elbows above waist level)
    const leftElbowRaised = leftElbow.y < leftShoulder.y + 50; // Lenient - can be slightly below shoulder
    const rightElbowRaised = rightElbow.y < rightShoulder.y + 50;
    
    // 2. Arms should be crossed or close together in front of body
    const armsAreCrossed = Math.abs(leftWrist.x - rightWrist.x) < 100; // Wrists close together
    const armsCentered = (leftWrist.x + rightWrist.x) / 2 > Math.min(leftShoulder.x, rightShoulder.x) && 
                        (leftWrist.x + rightWrist.x) / 2 < Math.max(leftShoulder.x, rightShoulder.x); // Wrists in front of body
    
    // 3. Wrists should be at a reasonable height (between waist and head)
    const leftWristHeight = leftWrist.y > leftShoulder.y - 50 && leftWrist.y < leftShoulder.y + 100; // Lenient height range
    const rightWristHeight = rightWrist.y > rightShoulder.y - 50 && rightWrist.y < rightShoulder.y + 100;
    
    // 4. Arms should have some bend (not fully extended)
    const leftArmAngle = calculateAngle(leftShoulder, leftElbow, leftWrist);
    const rightArmAngle = calculateAngle(rightShoulder, rightElbow, rightWrist);
    const leftArmBent = leftArmAngle >= 45 && leftArmAngle <= 150; // Very lenient angle range
    const rightArmBent = rightArmAngle >= 45 && rightArmAngle <= 150;
    
    // X Block detected if most criteria are met (stricter approach)
    const criteriaMetCount = [
      leftElbowRaised,
      rightElbowRaised,
      armsAreCrossed,
      armsCentered,
      leftWristHeight,
      rightWristHeight,
      leftArmBent,
      rightArmBent
    ].filter(Boolean).length;
    
    // Need at least 7 out of 8 criteria for detection (much stricter)
    return criteriaMetCount >= 7;
  };

  const detectMidBlock = (keypoints: any[]): string | null => {
    // Check left arm for mid block
    const leftShoulder = findKeypoint(keypoints, 'left_shoulder');
    const leftElbow = findKeypoint(keypoints, 'left_elbow');
    const leftWrist = findKeypoint(keypoints, 'left_wrist');
    
    // Check right arm for mid block
    const rightShoulder = findKeypoint(keypoints, 'right_shoulder');
    const rightElbow = findKeypoint(keypoints, 'right_elbow');
    const rightWrist = findKeypoint(keypoints, 'right_wrist');
    
    let leftMidBlock = false;
    let rightMidBlock = false;
    
    // Check left arm mid block - V-SHAPED near torso
    if (leftShoulder && leftElbow && leftWrist) {
      const leftArmAngle = calculateAngle(leftShoulder, leftElbow, leftWrist);
      const isLeftArmVShaped = leftArmAngle >= 60 && leftArmAngle <= 110; // V-shaped angle
      const isLeftAtTorsoLevel = leftWrist.y >= leftShoulder.y - 20 && leftWrist.y <= leftShoulder.y + 80; // Near torso level
      const isLeftArmAcrossBody = leftWrist.x > leftShoulder.x; // Arm crosses body
      
      if (isLeftArmVShaped && isLeftAtTorsoLevel && isLeftArmAcrossBody) {
        leftMidBlock = true;
      }
    }
    
    // Check right arm mid block - V-SHAPED near torso
    if (rightShoulder && rightElbow && rightWrist) {
      const rightArmAngle = calculateAngle(rightShoulder, rightElbow, rightWrist);
      const isRightArmVShaped = rightArmAngle >= 60 && rightArmAngle <= 110; // V-shaped angle
      const isRightAtTorsoLevel = rightWrist.y >= rightShoulder.y - 20 && rightWrist.y <= rightShoulder.y + 80; // Near torso level
      const isRightArmAcrossBody = rightWrist.x < rightShoulder.x; // Arm crosses body
      
      if (isRightArmVShaped && isRightAtTorsoLevel && isRightArmAcrossBody) {
        rightMidBlock = true;
      }
    }
    
    // Return specific mid block type
    if (leftMidBlock && rightMidBlock) {
      return 'Double Mid Block';
    } else if (leftMidBlock) {
      return 'Left Mid Block';
    } else if (rightMidBlock) {
      return 'Right Mid Block';
    }
    
    return null;
  };

  const detectHorseStance = (keypoints: any[]): boolean => {
    // Check leg positions for horse stance
    const leftHip = findKeypoint(keypoints, 'left_hip');
    const leftKnee = findKeypoint(keypoints, 'left_knee');
    const leftAnkle = findKeypoint(keypoints, 'left_ankle');
    
    const rightHip = findKeypoint(keypoints, 'right_hip');
    const rightKnee = findKeypoint(keypoints, 'right_knee');
    const rightAnkle = findKeypoint(keypoints, 'right_ankle');
    
    if (!leftHip || !leftKnee || !leftAnkle || !rightHip || !rightKnee || !rightAnkle) {
      return false;
    }
    
    // Horse stance criteria
    // 1. Wide stance - feet significantly apart
    const feetDistance = Math.abs(leftAnkle.x - rightAnkle.x);
    const hipDistance = Math.abs(leftHip.x - rightHip.x);
    const isWideStance = feetDistance > hipDistance * 1.5; // Feet wider than 1.5x hip width
    
    // 2. Knees bent outward (knees lower than hips)
    const leftKneeBent = leftKnee.y > leftHip.y + 20; // Left knee below hip
    const rightKneeBent = rightKnee.y > rightHip.y + 20; // Right knee below hip
    
    // 3. Feet roughly parallel and grounded
    const leftFootGrounded = leftAnkle.y > leftKnee.y - 30; // Ankle near or below knee level
    const rightFootGrounded = rightAnkle.y > rightKnee.y - 30; // Ankle near or below knee level
    
    // 4. Symmetric stance (both sides roughly equal)
    const leftLegAngle = calculateAngle(leftHip, leftKnee, leftAnkle);
    const rightLegAngle = calculateAngle(rightHip, rightKnee, rightAnkle);
    const isSymmetric = Math.abs(leftLegAngle - rightLegAngle) < 30; // Similar angles
    
    // 5. Stable position (knees not too wide or narrow)
    const kneeDistance = Math.abs(leftKnee.x - rightKnee.x);
    const isStableKneePosition = kneeDistance > hipDistance * 0.8 && kneeDistance < feetDistance * 1.2;
    
    // Horse stance detected if most criteria are met (lenient approach)
    const criteriaMetCount = [
      isWideStance,
      leftKneeBent,
      rightKneeBent,
      leftFootGrounded,
      rightFootGrounded,
      isSymmetric,
      isStableKneePosition
    ].filter(Boolean).length;
    
    // Need at least 5 out of 7 criteria for detection
    return criteriaMetCount >= 5;
  };

  const detectCurrentPose = (keypoints: any[]): string => {
    // Check for punches FIRST (most common and easiest to detect)
    const punchType = detectPunch(keypoints);
    if (punchType) {
      return punchType; // Already returns 'Left Punch' or 'Right Punch'
    }
    
    // Check for kicks 
    const kickType = detectKick(keypoints);
    if (kickType) {
      return kickType; // Already returns 'Left Kick' or 'Right Kick'
    }
    
    // Check for high blocks (head-level defensive movement) - return specific side
    const highBlockType = detectHighBlock(keypoints);
    if (highBlockType) {
      return highBlockType; // Already returns 'Left High Block' or 'Right High Block'
    }
    
    // Check for mid blocks (chest-level defensive blocks) - return specific side
    const midBlockType = detectMidBlock(keypoints);
    if (midBlockType) {
      return midBlockType; // Already returns 'Left Mid Block' or 'Right Mid Block'
    }
    
    // Check for X Block (specific crossed-arm defensive position)
    if (detectXBlock(keypoints)) {
      return 'X Block';
    }
    
    return 'No Pose';
  };

  // New function to detect normal standing position
  const detectNormalStanding = (keypoints: any[]): boolean => {
    const leftShoulder = findKeypoint(keypoints, 'left_shoulder');
    const leftElbow = findKeypoint(keypoints, 'left_elbow');
    const leftWrist = findKeypoint(keypoints, 'left_wrist');
    const leftHip = findKeypoint(keypoints, 'left_hip');
    
    const rightShoulder = findKeypoint(keypoints, 'right_shoulder');
    const rightElbow = findKeypoint(keypoints, 'right_elbow');
    const rightWrist = findKeypoint(keypoints, 'right_wrist');
    const rightHip = findKeypoint(keypoints, 'right_hip');

    // Check if we have enough keypoints to determine standing
    if (!leftShoulder || !rightShoulder || !leftHip || !rightHip) {
      return false; // Can't determine, let other detection run
    }

    // Normal standing criteria:
    // 1. Arms hanging naturally (wrists below elbows, elbows below shoulders)
    let naturalArms = true;
    
    if (leftElbow && leftWrist) {
      const leftArmNatural = leftWrist.y > leftElbow.y && leftElbow.y > leftShoulder.y - 20;
      naturalArms = naturalArms && leftArmNatural;
    }
    
    if (rightElbow && rightWrist) {
      const rightArmNatural = rightWrist.y > rightElbow.y && rightElbow.y > rightShoulder.y - 20;
      naturalArms = naturalArms && rightArmNatural;
    }

    // 2. Arms close to body sides (not extended outward)
    let armsAtSides = true;
    
    if (leftWrist) {
      const leftArmClose = Math.abs(leftWrist.x - leftShoulder.x) < 80; // Within 80 pixels of shoulder
      armsAtSides = armsAtSides && leftArmClose;
    }
    
    if (rightWrist) {
      const rightArmClose = Math.abs(rightWrist.x - rightShoulder.x) < 80;
      armsAtSides = armsAtSides && rightArmClose;
    }

    // 3. Body in neutral upright position (shoulders level with each other)
    const shouldersLevel = Math.abs(leftShoulder.y - rightShoulder.y) < 30;

    // 4. Hips level with each other
    const hipsLevel = Math.abs(leftHip.y - rightHip.y) < 30;

    // Normal standing detected if most criteria are met
    return naturalArms && armsAtSides && shouldersLevel && hipsLevel;
  };

  // Modular pose detection functions for specific moves
  const detectRightPunch = (keypoints: any[]): boolean => {
    const rightShoulder = findKeypoint(keypoints, 'right_shoulder');
    const rightElbow = findKeypoint(keypoints, 'right_elbow');
    const rightWrist = findKeypoint(keypoints, 'right_wrist');
    
    if (!rightShoulder || !rightElbow || !rightWrist) return false;
    
    const rightArmAngle = calculateAngle(rightShoulder, rightElbow, rightWrist);
    const isRightArmStraight = rightArmAngle >= 160;
    const isRightArmAtShoulderLevel = rightWrist.y <= rightShoulder.y + 10;
    const isRightArmExtended = rightWrist.x < rightShoulder.x - 40;
    const isRightElbowElevated = rightElbow.y <= rightShoulder.y + 40;
    
    return isRightArmStraight && isRightArmAtShoulderLevel && isRightArmExtended && isRightElbowElevated;
  };

  const detectLeftPunch = (keypoints: any[]): boolean => {
    const leftShoulder = findKeypoint(keypoints, 'left_shoulder');
    const leftElbow = findKeypoint(keypoints, 'left_elbow');
    const leftWrist = findKeypoint(keypoints, 'left_wrist');
    
    if (!leftShoulder || !leftElbow || !leftWrist) return false;
    
    const leftArmAngle = calculateAngle(leftShoulder, leftElbow, leftWrist);
    const isLeftArmStraight = leftArmAngle >= 160;
    const isLeftArmAtShoulderLevel = leftWrist.y <= leftShoulder.y + 10;
    const isLeftArmExtended = leftWrist.x > leftShoulder.x + 40;
    const isLeftElbowElevated = leftElbow.y <= leftShoulder.y + 40;
    
    return isLeftArmStraight && isLeftArmAtShoulderLevel && isLeftArmExtended && isLeftElbowElevated;
  };

  const detectRightKick = (keypoints: any[]): boolean => {
    const rightHip = findKeypoint(keypoints, 'right_hip');
    const rightKnee = findKeypoint(keypoints, 'right_knee');
    const rightAnkle = findKeypoint(keypoints, 'right_ankle');
    
    if (!rightHip || !rightKnee || !rightAnkle) return false;
    
    const rightLegAngle = calculateAngle(rightHip, rightKnee, rightAnkle);
    const isRightLegExtended = rightLegAngle >= 150;
    const isRightLegRaised = rightAnkle.y < rightHip.y;
    const isRightLegForward = rightAnkle.x > rightHip.x + 20;
    
    return isRightLegExtended && isRightLegRaised && isRightLegForward;
  };

  const detectLeftKick = (keypoints: any[]): boolean => {
    const leftHip = findKeypoint(keypoints, 'left_hip');
    const leftKnee = findKeypoint(keypoints, 'left_knee');
    const leftAnkle = findKeypoint(keypoints, 'left_ankle');
    
    if (!leftHip || !leftKnee || !leftAnkle) return false;
    
    const leftLegAngle = calculateAngle(leftHip, leftKnee, leftAnkle);
    const isLeftLegExtended = leftLegAngle >= 150;
    const isLeftLegRaised = leftAnkle.y < leftHip.y;
    const isLeftLegForward = leftAnkle.x < leftHip.x - 20;
    
    return isLeftLegExtended && isLeftLegRaised && isLeftLegForward;
  };

  const detectFrontKick = (keypoints: any[]): boolean => {
    // Check both legs for front kick
    return detectRightKick(keypoints) || detectLeftKick(keypoints);
  };

  const detectSideKick = (keypoints: any[]): boolean => {
    const rightHip = findKeypoint(keypoints, 'right_hip');
    const rightKnee = findKeypoint(keypoints, 'right_knee');
    const rightAnkle = findKeypoint(keypoints, 'right_ankle');
    const leftHip = findKeypoint(keypoints, 'left_hip');
    const leftKnee = findKeypoint(keypoints, 'left_knee');
    const leftAnkle = findKeypoint(keypoints, 'left_ankle');
    
    if (!rightHip || !rightKnee || !rightAnkle || !leftHip || !leftKnee || !leftAnkle) return false;
    
    // Check for side kick - leg extended to the side
    const rightLegAngle = calculateAngle(rightHip, rightKnee, rightAnkle);
    const leftLegAngle = calculateAngle(leftHip, leftKnee, leftAnkle);
    
    const isRightSideKick = rightLegAngle >= 150 && Math.abs(rightAnkle.x - rightHip.x) > 50;
    const isLeftSideKick = leftLegAngle >= 150 && Math.abs(leftAnkle.x - leftHip.x) > 50;
    
    return isRightSideKick || isLeftSideKick;
  };

  const detectRoundKick = (keypoints: any[]): boolean => {
    // Similar to side kick but with more horizontal movement
    return detectSideKick(keypoints);
  };

  const detectLowBlock = (keypoints: any[]): boolean => {
    const leftShoulder = findKeypoint(keypoints, 'left_shoulder');
    const leftElbow = findKeypoint(keypoints, 'left_elbow');
    const leftWrist = findKeypoint(keypoints, 'left_wrist');
    const rightShoulder = findKeypoint(keypoints, 'right_shoulder');
    const rightElbow = findKeypoint(keypoints, 'right_elbow');
    const rightWrist = findKeypoint(keypoints, 'right_wrist');
    
    if (!leftShoulder || !leftElbow || !leftWrist || !rightShoulder || !rightElbow || !rightWrist) return false;
    
    // Check for low block - arms down and extended
    const leftArmAngle = calculateAngle(leftShoulder, leftElbow, leftWrist);
    const rightArmAngle = calculateAngle(rightShoulder, rightElbow, rightWrist);
    
    const isLeftLowBlock = leftArmAngle >= 120 && leftWrist.y > leftShoulder.y + 40;
    const isRightLowBlock = rightArmAngle >= 120 && rightWrist.y > rightShoulder.y + 40;
    
    return isLeftLowBlock || isRightLowBlock;
  };

  // Audio and game logic removed - will be rebuilt

  // Start Challenge function with countdown
  const startChallenge = () => {
    console.log(`🎮 START CHALLENGE CLICKED! | Command: "${currentMove}" | Current Pose: "${currentDetectedPose}"`);
    
    // Clean slate - reset everything
    setMoveMatched(false);
    moveMatchedRef.current = false; // 🔥 IMMEDIATE backend sync
    setCurrentMove(null);
    currentMoveRef.current = null; // 🔥 IMMEDIATE backend sync
    setShowCheckMark(false);
    
    console.log(`🎮 Setting gameState to: "countdown" | Command: "${currentMove}" | Current Pose: "${currentDetectedPose}"`);
    setGameState('countdown');
    gameStateRef.current = 'countdown'; // 🔥 IMMEDIATE backend sync
    setCountdown(5);

        let countdownValue = 5;
    console.log(`🎮 Starting countdown interval... | Command: "${currentMove}" | Current Pose: "${currentDetectedPose}"`);
    
    const interval = setInterval(() => {
      console.log(`🎮 Countdown interval fired! countdownValue=${countdownValue} | Command: "${currentMove}" | Current Pose: "${currentDetectedPose}"`);
      
      countdownValue -= 1;
      setCountdown(countdownValue);
      console.log(`🎮 Countdown: ${countdownValue} | Command: "${currentMove}" | Current Pose: "${currentDetectedPose}"`);
      
      if (countdownValue <= 0) {
        console.log(`🚨 COUNTDOWN REACHED 0! Starting game setup...`);
        clearInterval(interval);
        console.log(`🚨 Interval cleared`);
        
        setCountdown(null);
        console.log(`🚨 setCountdown(null) called`);
        
        console.log(`🚨 ABOUT TO SET: setGameState("playing")`);
    setGameState('playing');
        gameStateRef.current = 'playing'; // 🔥 IMMEDIATE backend sync
        console.log(`🚨 setGameState("playing") called + gameStateRef.current = "playing"`);
        
        // Start the game IMMEDIATELY by selecting a random move
        console.log(`🚨 ABOUT TO CALL: selectRandomMove()`);
        selectRandomMove();
        console.log(`🚨 selectRandomMove() call completed`);
      }
    }, 1000);
  };

  // Cleanup effects and helper functions removed - will be rebuilt

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-950 to-yellow-950/20 text-white relative overflow-hidden">
      {/* Golden Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          className="absolute top-20 left-10 w-64 h-64 bg-yellow-500/10 rounded-full blur-3xl"
          animate={{ 
            scale: [1, 1.2, 1], 
            rotate: [0, 180, 360],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{ duration: 20, repeat: Infinity }}
        />
        <motion.div 
          className="absolute bottom-20 right-10 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl"
          animate={{ 
            scale: [1.2, 1, 1.2], 
            rotate: [360, 180, 0],
            opacity: [0.4, 0.7, 0.4]
          }}
          transition={{ duration: 25, repeat: Infinity }}
        />
      </div>

      <div className="relative z-10 h-screen flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-black/50 backdrop-blur-sm border-b border-yellow-500/20">
          <div className="flex gap-2">
            <Link href="/challenges">
              <Button variant="ghost" className="text-white hover:bg-yellow-600/20">
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Challenges
              </Button>
            </Link>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-400" />
              <span className="text-yellow-300 font-bold">Shifu Says</span>
            </div>
          </div>
        </div>

        {/* Main Game Area */}
        <div className="flex-1 relative">
          {/* Camera Feed Background */}
          <div className="absolute inset-0">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover opacity-0 pointer-events-none"
            />
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full object-cover"
            />
            
            {/* Camera/Skeleton Status Indicators */}
            <div className="absolute top-4 right-4 flex gap-2">
              {showCamera && (
                <div className="bg-green-500/20 border border-green-500/50 rounded-lg px-3 py-1 text-green-400 text-sm flex items-center gap-2">
                  <Camera className="h-4 w-4" />
                  Camera Active
                </div>
              )}
              {showSkeleton && (
                <div className="bg-cyan-500/20 border border-cyan-500/50 rounded-lg px-3 py-1 text-cyan-400 text-sm flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Skeleton Active
                </div>
              )}
            </div>
          </div>

          {/* Game Overlays */}
          <div className="absolute inset-0 flex flex-col">
            {/* Top HUD */}
            <div className="flex justify-between items-start p-4">
              {/* Current Pose Indicator - Top Left */}
              <div className="bg-black/70 backdrop-blur-sm rounded-2xl px-4 py-3 border border-blue-500/30">
                <div className="flex items-center gap-3">
                  <div className="text-blue-400 font-semibold text-sm">Current Pose:</div>
                  <div 
                    data-testid="current-pose"
                    className={`font-bold text-lg transition-colors duration-200 ${
                    currentDetectedPose === 'No Pose' 
                      ? 'text-gray-400' 
                      : 'text-green-400'
                  }`}>
                    {currentDetectedPose}
                  </div>
                  <div className={`w-3 h-3 rounded-full transition-colors duration-200 ${
                    currentDetectedPose === 'No Pose' 
                      ? 'bg-gray-500' 
                      : 'bg-green-400 animate-pulse'
                  }`}></div>
                </div>
              </div>

              {/* Debug Info - Top Right */}
              <div className="bg-black/70 backdrop-blur-sm rounded-2xl px-4 py-3 border border-red-500/30 max-w-md">
                <div className="text-red-400 font-semibold text-sm mb-2">Debug Info:</div>
                <div className="text-xs text-white space-y-1">
                  {debugInfo.map((info, index) => (
                    <div key={index} className="font-mono">{info}</div>
                  ))}
                </div>
              </div>

              {/* Timer removed - will be rebuilt */}
            </div>

            {/* Game overlays removed - will be rebuilt */}

            {/* Center area with Start Challenge button and countdown */}
            <div className="flex-1 flex items-center justify-center">
                {gameState === 'waiting' && (
                <div className="text-center bg-black/80 backdrop-blur-sm rounded-3xl p-8 border border-yellow-500/30 max-w-lg">
                      <Crown className="h-16 w-16 text-yellow-400 mx-auto mb-4" />
                      <h1 className="text-4xl font-black bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 bg-clip-text text-transparent mb-4">
                        SHIFU SAYS
                      </h1>
                      <p className="text-gray-300 text-lg mb-6">
                        Listen carefully! Only perform moves when Shifu says so.
                      </p>
                    <Button 
                    onClick={startChallenge}
                      className="bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 text-black hover:from-yellow-500 hover:via-amber-600 hover:to-yellow-700 text-lg px-8 py-3 font-bold"
                    >
                      <Crown className="h-5 w-5 mr-2" />
                    Start Challenge
                    </Button>
                  
                                    {/* 🚨 EMERGENCY FIX BUTTON */}
                  <Button 
                    onClick={() => {
                      console.log(`🚨 EMERGENCY FIX CLICKED!`);
                      console.log(`🚨 availableMoves array:`, availableMoves);
                      console.log(`🚨 availableMoves.length:`, availableMoves.length);
                      
                      // Pick a random move each time
                      const randomIndex = Math.floor(Math.random() * availableMoves.length);
                      console.log(`🚨 randomIndex: ${randomIndex}`);
                      
                      const randomMove = availableMoves[randomIndex];
                      console.log(`🚨 randomMove: "${randomMove}"`);
                      
                      const randomShifuSays = Math.random() < 0.7;
                      console.log(`🚨 randomShifuSays: ${randomShifuSays}`);
                      
                      if (!randomMove) {
                        console.error(`🚨 ERROR: randomMove is undefined! availableMoves[${randomIndex}] = undefined`);
                        console.error(`🚨 availableMoves:`, availableMoves);
                        return; // Don't set state with undefined
                      }
                      
                      console.log(`🚨 Setting states + refs...`);
                      setGameState('playing');
                      gameStateRef.current = 'playing'; // 🔥 IMMEDIATE backend sync
                      setCurrentMove(randomMove);
                      currentMoveRef.current = randomMove; // 🔥 IMMEDIATE backend sync
                      setIsShifuSays(randomShifuSays);
                      isShifuSaysRef.current = randomShifuSays; // 🔥 IMMEDIATE backend sync
                      setMoveMatched(false);
                      moveMatchedRef.current = false; // 🔥 IMMEDIATE backend sync
                      
                      console.log(`🚨 State set: gameState="playing", currentMove="${randomMove}", isShifuSays=${randomShifuSays}`);
                      console.log(`🔥 REFS IMMEDIATELY SET: gameStateRef="${gameStateRef.current}", currentMoveRef="${currentMoveRef.current}", isShifuSaysRef=${isShifuSaysRef.current}, moveMatchedRef=${moveMatchedRef.current}`);
                    }}
                    className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2"
                  >
                    🚨 RANDOM MOVE FIX
                  </Button>
                    </div>
              )}

              {gameState === 'countdown' && countdown !== null && (
                <div className="text-center bg-black/80 backdrop-blur-sm rounded-3xl p-8 border border-yellow-500/30">
                  <div className="text-8xl font-bold text-yellow-400 mb-4 animate-pulse">
                    {countdown}
            </div>
                  <div className="text-2xl text-white">Get Ready!</div>
                </div>
              )}

            {gameState === 'playing' && (
                <div className="text-center bg-black/80 backdrop-blur-sm rounded-3xl p-8 border border-green-500/30 max-w-lg">
                  <h2 className="text-3xl font-bold text-green-400 mb-4">Challenge Active!</h2>
                  {currentMove && (
                    <div className="mb-4">
                      <p className="text-gray-300 text-lg mb-2">
                        {isShifuSays ? 'Shifu says:' : 'Command:'}
                      </p>
                      <p 
                        data-testid="current-command"
                        className="text-2xl font-bold text-yellow-400">
                        {currentMove}
                      </p>
                    </div>
                  )}
                  <p className="text-gray-300 text-sm">
                    Perform the move shown above when you hear it!
                  </p>
                      </div>
                    )}

              {/* Green Check Mark Overlay */}
              <AnimatePresence>
                {showCheckMark && (
                  <motion.div 
                    className="absolute inset-0 flex items-center justify-center z-50"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="w-32 h-32 rounded-full bg-green-500/90 border-4 border-green-400 flex items-center justify-center">
                      <Check className="h-16 w-16 text-white" />
                  </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Bottom status removed - will be rebuilt */}
          </div>
        </div>
      </div>

      {/* Pose Analyzer Modal */}
      {showPoseAnalyzer && (
        <PoseAnalyzer onClose={() => setShowPoseAnalyzer(false)} />
      )}
    </div>
  );
};

export default ShifuSaysChallenge; 