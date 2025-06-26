import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, Link } from "wouter";
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Camera, ArrowLeft, Crown, Timer, Star, Zap, 
  Trophy, AlertTriangle, Check, X, Volume2, Settings, User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { initPoseDetection, detectPoses, getJointConnections } from '@/lib/poseDetection';
import { detectMartialArtsPoseAdvanced, analyzePoseFromKeypoints, updateReferencePose } from '@/lib/poseAnalysis';
import PoseAnalyzer from '@/components/PoseAnalyzer';

interface AudioCommand {
  move: string;
  shifuSays: boolean;
  audioPath: string;
  timeLimit: number;
}

interface Command {
  text: string;
  isShifuCommand: boolean;
  technique: string;
  timeLimit: number;
}

const ShifuSaysChallenge: React.FC = () => {
  const [, navigate] = useLocation();
  const [gameState, setGameState] = useState<'waiting' | 'playing' | 'gameOver' | 'completed'>('waiting');
  const [currentCommand, setCurrentCommand] = useState<Command | null>(null);
  const [currentAudioCommand, setCurrentAudioCommand] = useState<AudioCommand | null>(null);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'instruction' | 'success' | 'error' | 'warning'>('instruction');
  const [showShifu, setShowShifu] = useState(true);
  const [shifuExpression, setShifuExpression] = useState<'neutral' | 'happy' | 'sad' | 'pointing'>('neutral');
  const [lastDetectedPose, setLastDetectedPose] = useState<string>('');
  const [isPerformingMove, setIsPerformingMove] = useState(false);
  const [commandHistory, setCommandHistory] = useState<Array<{command: string, correct: boolean}>>([]);
  const [showPoseAnalyzer, setShowPoseAnalyzer] = useState(false);
  const [showResult, setShowResult] = useState<'success' | 'error' | null>(null);

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

  // Audio refs
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const commandTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const resultTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Available moves for audio commands
  const availableMoves = [
    'Right Punch',
    'Left Punch', 
    'Right Kick',
    'Left Kick',
    'Horse Stance',
    'High Block',
    'Low Block',
    'Front Kick',
    'Side Kick',
    'Round Kick'
  ];

  // Move to pose mapping
  const moveToPoseMap: Record<string, string> = {
    'Right Punch': 'right_punch',
    'Left Punch': 'left_punch',
    'Right Kick': 'right_kick', 
    'Left Kick': 'left_kick',
    'Horse Stance': 'horse_stance',
    'High Block': 'high_block',
    'Low Block': 'low_block',
    'Front Kick': 'front_kick',
    'Side Kick': 'side_kick',
    'Round Kick': 'round_kick'
  };

  // Martial arts commands with variations (legacy)
  const martialArtsCommands = [
    { name: 'Front Kick', pose: 'front_kick' },
    { name: 'Side Kick', pose: 'side_kick' },
    { name: 'Round Kick', pose: 'round_kick' },
    { name: 'Back Kick', pose: 'back_kick' },
    { name: 'Axe Kick', pose: 'axe_kick' },
    { name: 'Fighting Stance', pose: 'fighting_stance' },
    { name: 'Horse Stance', pose: 'horse_stance' },
    { name: 'High Block', pose: 'high_block' },
    { name: 'Low Block', pose: 'low_block' },
    { name: 'Punch', pose: 'punch' }
  ];

  // Helper to normalize move names for matching
  const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '');

  // List of available audio files for each folder (hardcoded for now, could be fetched dynamically)
  const normalAudioFiles = [
    'LMNT Shifu Horse Stance.mp3',
    'LMNT Shifu Left High Block.mp3',
    'LMNT Shifu Left Kick.mp3',
    'LMNT Shifu Left Mid Block.mp3',
    'LMNT Shifu Left Punch.mp3',
    'LMNT Shifu Right High Block.mp3',
    'LMNT Shifu Right Kick.mp3',
    'LMNT Shifu Right Mid Block.mp3',
    'LMNT Shifu Right Punch.mp3',
    'LMNT Shifu X Block.mp3',
  ];
  const shifuSaysAudioFiles = [
    'Shifu Says Horse Stance.mp3',
    'Shifu Says Left High Block.mp3',
    'Shifu Says Left Kick.mp3',
    'Shifu Says Left Mid Block.mp3',
    'Shifu Says Left Punch.mp3',
    'Shifu Says Right High Block.mp3',
    'Shifu Says Right Kick.mp3',
    'Shifu Says Right Mid Block.mp3',
    'Shifu Says Right Punch.mp3',
    'Shifu Says X Block.mp3',
  ];

  function findAudioFile(move: string, shifuSays: boolean): string | null {
    const files = shifuSays ? shifuSaysAudioFiles : normalAudioFiles;
    const moveNorm = normalize(move);
    // For shifu says, require "shifu says" in the filename
    for (const file of files) {
      const fileNorm = normalize(file);
      if (fileNorm.includes(moveNorm)) {
        if (!shifuSays || fileNorm.includes('shifusays')) {
          return `/sounds/${shifuSays ? 'shifu_says' : 'normal'}/${file}`;
        }
      }
    }
    return null;
  }

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
          } else {
            // Fill with dark background if camera is hidden
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          }

          if (poses.length > 0) {
            const pose = poses[0];
            
            // Detect current pose using modular system
            const currentPose = detectCurrentPose(pose.keypoints);
            setCurrentDetectedPose(currentPose);
            
            // Detect specific martial arts poses for game logic
            const detectedPose = detectMartialArtsPose(pose.keypoints);
            if (detectedPose && detectedPose !== lastDetectedPose) {
              setLastDetectedPose(detectedPose);
              onPoseDetected(pose.keypoints, 0.8);
            }
            
            // Draw skeleton overlay
            drawSkeleton(ctx, pose.keypoints);
          } else {
            // No poses detected
            setCurrentDetectedPose('No Pose');
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
    // First check if user is in a normal standing position
    if (detectNormalStanding(keypoints)) {
      return 'No Pose';
    }
    
    // Check for horse stance first (fundamental martial arts stance)
    if (detectHorseStance(keypoints)) {
      return 'Horse Stance';
    }
    
    // Check for X Block (specific crossed-arm defensive position)
    if (detectXBlock(keypoints)) {
      return 'X Block';
    }
    
    // Check for mid blocks (chest-level defensive blocks)
    const midBlockType = detectMidBlock(keypoints);
    if (midBlockType) {
      return midBlockType;
    }
    
    // Check for high blocks (head-level defensive movement)
    const highBlockType = detectHighBlock(keypoints);
    if (highBlockType) {
      return highBlockType;
    }
    
    // Check for kicks (more specific movement)
    const kickType = detectKick(keypoints);
    if (kickType) {
      return kickType;
    }
    
    // Then check for punches
    const punchType = detectPunch(keypoints);
    if (punchType) {
      return punchType;
    }
    
    // Add more pose detections here later
    // if (detectLowBlock(keypoints)) return 'Low Block';
    
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

  // Audio command generation
  const generateAudioCommand = useCallback((): AudioCommand => {
    const move = availableMoves[Math.floor(Math.random() * availableMoves.length)];
    const shifuSays = Math.random() > 0.5; // 50% chance
    const timeLimit = 4000; // 4 seconds
    
    const audioPath = shifuSays 
      ? `/sounds/shifu_says/${move.toLowerCase().replace(' ', '_')}.mp3`
      : `/sounds/normal/${move.toLowerCase().replace(' ', '_')}.mp3`;
    
    return {
      move,
      shifuSays,
      audioPath,
      timeLimit
    };
  }, []);

  // Play audio command
  const playAudioCommand = useCallback((command: AudioCommand) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    
    if (!command.audioPath) {
      setMessage(command.shifuSays ? `Shifu says ${command.move}!` : command.move);
      return;
    }

    const audio = new Audio(command.audioPath);
    audioRef.current = audio;
    
    audio.play().catch(error => {
      setMessage(command.shifuSays ? `Shifu says ${command.move}!` : command.move);
    });
  }, []);

  // Detect specific pose for audio commands
  const detectSpecificPose = (keypoints: any[], targetPose: string): boolean => {
    switch (targetPose) {
      case 'right_punch':
        return detectRightPunch(keypoints);
      case 'left_punch':
        return detectLeftPunch(keypoints);
      case 'right_kick':
        return detectRightKick(keypoints);
      case 'left_kick':
        return detectLeftKick(keypoints);
      case 'horse_stance':
        return detectHorseStance(keypoints);
      case 'high_block':
        return detectHighBlock(keypoints) !== null;
      case 'low_block':
        return detectLowBlock(keypoints);
      case 'front_kick':
        return detectFrontKick(keypoints);
      case 'side_kick':
        return detectSideKick(keypoints);
      case 'round_kick':
        return detectRoundKick(keypoints);
      default:
        return false;
    }
  };

  const generateCommand = useCallback((): Command => {
    const technique = martialArtsCommands[Math.floor(Math.random() * martialArtsCommands.length)];
    const isShifuCommand = Math.random() > 0.3; // 70% chance it's a valid "Shifu says" command
    const timeLimit = 4000 + Math.random() * 2000; // 4-6 seconds

    const commandText = isShifuCommand 
      ? `Shifu says ${technique.name}!`
      : technique.name; // Trick command without "Shifu says"

    return {
      text: commandText,
      isShifuCommand,
      technique: technique.pose,
      timeLimit
    };
  }, []);

  // Add state for pre-game countdown
  const [preGameCountdown, setPreGameCountdown] = useState<number | null>(null);

  // Update startGame to trigger pre-game countdown
  const startGame = () => {
    setGameState('playing');
    setScore(0);
    setRound(0);
    setCommandHistory([]);
    setShifuExpression('pointing');
    setMessage('Get ready! Listen carefully to Shifu...');
    setMessageType('instruction');
    setShowResult(null);
    setPreGameCountdown(5);

    let countdown = 5;
    const interval = setInterval(() => {
      countdown -= 1;
      setPreGameCountdown(countdown);
      if (countdown <= 0) {
        clearInterval(interval);
        setPreGameCountdown(null);
        // Play test audio for debugging
        const testAudio = new Audio('/sounds/shifu_says/Shifu Says Right Punch.mp3');
        testAudio.play().then(() => {
          setTimeout(() => {
            nextAudioRound();
          }, 2000); // Wait 2 seconds after audio starts, then start the game
        }).catch(() => {
          setTimeout(() => {
            nextAudioRound();
          }, 2000);
        });
      }
    }, 1000);
  };

  // Update nextAudioRound to use 2-3 seconds per command
  const nextAudioRound = useCallback(() => {
    if (gameState !== 'playing') return;

    const newRound = round + 1;
    setRound(newRound);

    const audioCommand = generateAudioCommand();
    // Randomize time limit between 2 and 3 seconds
    audioCommand.timeLimit = 2000 + Math.floor(Math.random() * 1000);
    setCurrentAudioCommand(audioCommand);
    setTimeLeft(audioCommand.timeLimit);
    setIsPerformingMove(false);
    setShowResult(null);

    setShifuExpression(audioCommand.shifuSays ? 'pointing' : 'neutral');

    // Play audio command
    playAudioCommand(audioCommand);

    // Display command text as fallback
    const commandText = audioCommand.shifuSays ? `Shifu says ${audioCommand.move}!` : audioCommand.move;
    setMessage(commandText);
    setMessageType('instruction');

    // Start countdown timer
    const startTime = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, audioCommand.timeLimit - elapsed);
      setTimeLeft(remaining);
      if (remaining <= 0) {
        handleAudioTimeout();
      }
    }, 100);

    commandTimeoutRef.current = setTimeout(() => {
      if (!audioCommand.shifuSays && !isPerformingMove) {
        handleAudioCorrectResponse(true);
      }
    }, audioCommand.timeLimit);
  }, [gameState, round, generateAudioCommand, playAudioCommand, isPerformingMove]);

  const handleAudioTimeout = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (commandTimeoutRef.current) clearTimeout(commandTimeoutRef.current);
    
    if (currentAudioCommand) {
      if (currentAudioCommand.shifuSays) {
        // Failed to perform required move
        handleAudioIncorrectResponse('Time\'s up! You should have performed the move.');
      } else {
        // Correctly ignored trick command
        handleAudioCorrectResponse(true);
      }
    }
  };

  const handleAudioCorrectResponse = (ignored: boolean = false) => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (commandTimeoutRef.current) clearTimeout(commandTimeoutRef.current);
    
    const newScore = score + 10;
    setScore(newScore);
    setShifuExpression('happy');
    setShowResult('success');
    
    const successMessage = ignored 
      ? 'Excellent! You correctly ignored the trick command!'
      : 'Perfect! Well executed!';
    
    setMessage(successMessage);
    setMessageType('success');
    
    if (currentAudioCommand) {
      const commandText = currentAudioCommand.shifuSays ? `Shifu says ${currentAudioCommand.move}!` : currentAudioCommand.move;
      setCommandHistory(prev => [...prev, { command: commandText, correct: true }]);
    }

    // Show result for 1.5 seconds then continue to next round
    resultTimeoutRef.current = setTimeout(() => {
      setShowResult(null);
      nextAudioRound();
    }, 1500);
  };

  const handleAudioIncorrectResponse = (reason: string) => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (commandTimeoutRef.current) clearTimeout(commandTimeoutRef.current);
    
    setShifuExpression('sad');
    setMessage(reason);
    setMessageType('error');
    setShowResult('error');
    
    if (currentAudioCommand) {
      const commandText = currentAudioCommand.shifuSays ? `Shifu says ${currentAudioCommand.move}!` : currentAudioCommand.move;
      setCommandHistory(prev => [...prev, { command: commandText, correct: false }]);
    }

    // Show result for 1.5 seconds then end game
    resultTimeoutRef.current = setTimeout(() => {
      setGameState('gameOver');
    }, 1500);
  };

  const onPoseDetected = (keypoints: any[], confidence: number) => {
    if (gameState !== 'playing' || !currentAudioCommand || confidence < 0.7) return;
    
    setIsPerformingMove(true);
    
    const targetPose = moveToPoseMap[currentAudioCommand.move];
    const isCorrectPose = detectSpecificPose(keypoints, targetPose);
    
    if (currentAudioCommand.shifuSays) {
      // Should perform the move
      if (isCorrectPose) {
        handleAudioCorrectResponse();
      }
      // Continue waiting for correct pose
    } else {
      // Trick command - shouldn't perform any move
      handleAudioIncorrectResponse('Oops! That command didn\'t start with "Shifu says"!');
    }
  };

  const resetGame = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (commandTimeoutRef.current) clearTimeout(commandTimeoutRef.current);
    if (resultTimeoutRef.current) clearTimeout(resultTimeoutRef.current);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setGameState('waiting');
    setCurrentCommand(null);
    setCurrentAudioCommand(null);
    setScore(0);
    setRound(0);
    setTimeLeft(0);
    setCommandHistory([]);
    setShifuExpression('neutral');
    setMessage('');
    setShowResult(null);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (commandTimeoutRef.current) clearTimeout(commandTimeoutRef.current);
      if (resultTimeoutRef.current) clearTimeout(resultTimeoutRef.current);
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const getShifuImage = () => {
    switch (shifuExpression) {
      case 'happy': return '/images/shifuhappy_ct.png';
      case 'sad': return '/images/shifusad_ct.png';
      case 'pointing': return '/images/shifupointleft_ct.png';
      default: return '/images/shifu_coacht.png';
    }
  };

  const getMessageColor = () => {
    switch (messageType) {
      case 'success': return 'text-green-400 bg-green-500/20 border-green-500/50';
      case 'error': return 'text-red-400 bg-red-500/20 border-red-500/50';
      case 'warning': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/50';
      default: return 'text-blue-400 bg-blue-500/20 border-blue-500/50';
    }
  };

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
            
            {gameState === 'playing' && (
              <>
                <div className="flex items-center gap-2">
                  <Timer className="h-4 w-4 text-blue-400" />
                  <span className="text-white">Round {round}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-400" />
                  <span className="text-white">{score} pts</span>
                </div>
              </>
            )}
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
                  <div className={`font-bold text-lg transition-colors duration-200 ${
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

              {/* Timer - Top Center */}
              {gameState === 'playing' && (
                <motion.div 
                  className="bg-black/70 backdrop-blur-sm rounded-2xl px-6 py-3 border border-yellow-500/30"
                  animate={{ scale: timeLeft < 1000 ? [1, 1.05, 1] : 1 }}
                  transition={{ duration: 0.5, repeat: timeLeft < 1000 ? Infinity : 0 }}
                >
                  <div className="flex items-center gap-4">
                    <div className="text-yellow-400 font-bold">
                      Time: {Math.ceil(timeLeft / 1000)}s
                    </div>
                    <div className="w-32 bg-gray-700 rounded-full h-2">
                      <motion.div 
                        className="bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full h-full"
                        style={{ width: `${(timeLeft / (currentAudioCommand?.timeLimit || 1)) * 100}%` }}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Result Overlay */}
            <AnimatePresence>
              {showResult && (
                <motion.div 
                  className="absolute inset-0 flex items-center justify-center z-50"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className={`w-32 h-32 rounded-full flex items-center justify-center ${
                    showResult === 'success' 
                      ? 'bg-green-500/90 border-4 border-green-400' 
                      : 'bg-red-500/90 border-4 border-red-400'
                  }`}>
                    {showResult === 'success' ? (
                      <Check className="h-16 w-16 text-white" />
                    ) : (
                      <X className="h-16 w-16 text-white" />
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Pre-game countdown overlay */}
            {preGameCountdown !== null && (
              <div className="absolute inset-0 flex items-center justify-center z-50 bg-black/80">
                <div className="flex flex-col items-center">
                  <div className="text-6xl font-bold text-yellow-400 mb-4">{preGameCountdown}</div>
                  <div className="text-2xl text-white">Get Ready!</div>
                </div>
              </div>
            )}

            {/* Shifu Overlay */}
            <AnimatePresence>
              {showShifu && (
                <motion.div 
                  className="absolute bottom-20 left-6 z-20"
                  initial={{ x: -100, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -100, opacity: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="relative">
                    {/* Shifu Image */}
                    <motion.div
                      className="w-32 h-32 relative"
                      animate={{ scale: shifuExpression === 'pointing' ? [1, 1.05, 1] : 1 }}
                      transition={{ duration: 1, repeat: shifuExpression === 'pointing' ? Infinity : 0 }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 via-amber-500/30 to-yellow-600/20 rounded-full blur-lg" />
                      <img 
                        src={getShifuImage()} 
                        alt="Shifu" 
                        className="w-full h-full object-contain relative z-10"
                      />
                    </motion.div>

                    {/* Speech Bubble */}
                    {message && (
                      <motion.div 
                        className="absolute bottom-16 left-20 max-w-xs"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        key={message}
                      >
                        <div className={`p-4 rounded-2xl border-2 backdrop-blur-sm ${getMessageColor()}`}>
                          <div className="flex items-center gap-2 mb-2">
                            <Volume2 className="h-4 w-4" />
                            <span className="font-bold text-sm">Shifu</span>
                          </div>
                          <p className="text-sm font-medium">{message}</p>
                        </div>
                        {/* Speech bubble pointer */}
                        <div className={`absolute -bottom-2 left-4 w-4 h-4 rotate-45 border-r-2 border-b-2 ${getMessageColor().split(' ')[2]} ${getMessageColor().split(' ')[1]}`} />
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Center Game States */}
            <div className="flex-1 flex items-center justify-center">
              <AnimatePresence mode="wait">
                {gameState === 'waiting' && (
                  <motion.div 
                    className="text-center bg-black/80 backdrop-blur-sm rounded-3xl p-8 border border-yellow-500/30 max-w-lg"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                  >
                    <div className="mb-6">
                      <Crown className="h-16 w-16 text-yellow-400 mx-auto mb-4" />
                      <h1 className="text-4xl font-black bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 bg-clip-text text-transparent mb-4">
                        SHIFU SAYS
                      </h1>
                      <p className="text-gray-300 text-lg mb-6">
                        Listen carefully! Only perform moves when Shifu says so.
                      </p>
                    </div>

                    <div className="space-y-4 mb-8">
                      <div className="flex items-center gap-3 text-sm">
                        <Check className="h-4 w-4 text-green-400" />
                        <span>"Shifu says Front Kick!" → Perform the move</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <X className="h-4 w-4 text-red-400" />
                        <span>"Round Kick!" → Don't move!</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <AlertTriangle className="h-4 w-4 text-yellow-400" />
                        <span>One mistake and you're out!</span>
                      </div>
                    </div>

                    <Button 
                      onClick={startGame}
                      className="bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 text-black hover:from-yellow-500 hover:via-amber-600 hover:to-yellow-700 text-lg px-8 py-3 font-bold"
                    >
                      <Crown className="h-5 w-5 mr-2" />
                      Accept Challenge
                    </Button>
                  </motion.div>
                )}

                {gameState === 'gameOver' && (
                  <motion.div 
                    className="text-center bg-black/80 backdrop-blur-sm rounded-3xl p-8 border border-red-500/30 max-w-lg"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                  >
                    <div className="mb-6">
                      <X className="h-16 w-16 text-red-400 mx-auto mb-4" />
                      <h2 className="text-3xl font-bold text-red-400 mb-4">Challenge Failed!</h2>
                      <p className="text-gray-300 mb-2">You reached round {round}</p>
                      <p className="text-2xl font-bold text-yellow-400">{score} points</p>
                    </div>

                    {commandHistory.length > 0 && (
                      <div className="mb-6 max-h-32 overflow-y-auto">
                        <h3 className="text-sm font-semibold text-gray-400 mb-2">Your Performance:</h3>
                        {commandHistory.slice(-5).map((cmd, idx) => (
                          <div key={idx} className={`text-xs p-2 rounded mb-1 ${cmd.correct ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                            {cmd.command} {cmd.correct ? '✓' : '✗'}
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-4">
                      <Button 
                        onClick={resetGame}
                        variant="outline"
                        className="border-gray-600 text-gray-300 hover:bg-gray-700"
                      >
                        Try Again
                      </Button>
                      <Link href="/challenges">
                        <Button 
                          className="bg-gradient-to-r from-yellow-400 to-amber-500 text-black hover:from-yellow-500 hover:to-amber-600"
                        >
                          <Trophy className="h-4 w-4 mr-2" />
                          View Challenges
                        </Button>
                      </Link>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Bottom Status */}
            {gameState === 'playing' && (
              <div className="p-4 bg-black/50 backdrop-blur-sm border-t border-yellow-500/20">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-gray-400">
                      Game Pose: 
                      <span className={`ml-2 font-semibold ${lastDetectedPose ? 'text-green-400' : 'text-gray-500'}`}>
                        {lastDetectedPose || 'None'}
                      </span>
                    </div>
                    {lastDetectedPose && (
                      <div className="flex items-center gap-2 bg-green-500/20 border border-green-500/50 rounded-lg px-2 py-1">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        <span className="text-green-400 text-xs font-medium">Match Found</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-gray-400">
                      Target: 
                      <span className="ml-2 text-yellow-400 font-semibold">
                        {currentAudioCommand?.move || 'None'}
                      </span>
                    </div>
                    <div className="text-sm text-gray-400">
                      Score: <span className="text-yellow-400 font-bold">{score}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
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