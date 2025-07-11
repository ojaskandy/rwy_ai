import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, Link } from "wouter";
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Camera, ArrowLeft, Crown, User, Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { initPoseDetection, detectPoses, getJointConnections } from '@/lib/poseDetection';
import { detectMartialArtsPoseAdvanced, analyzePoseFromKeypoints, updateReferencePose } from '@/lib/poseAnalysis';
import { getCameraStream, initializeMobileVideo, setupMobileCanvas, isMobileDevice, requestCameraPermission, initializeMobileCamera, initializeCameraWithUserGesture } from '@/lib/cameraUtils';
import PoseAnalyzer from '@/components/PoseAnalyzer';

// Game interfaces removed - will be rebuilt

const ShifuSaysChallenge: React.FC = () => {
  const [, navigate] = useLocation();
  const [showPoseAnalyzer, setShowPoseAnalyzer] = useState(false);
  const [gameState, setGameState] = useState<'waiting' | 'countdown' | 'playing' | 'gameover'>('waiting');
  const [countdown, setCountdown] = useState<number | null>(null);
  const [currentMove, setCurrentMove] = useState<string | null>(null);
  const [isShifuSays, setIsShifuSays] = useState<boolean>(false);
  const [showCheckMark, setShowCheckMark] = useState(false);
  const [moveMatched, setMoveMatched] = useState(false);
  const [score, setScore] = useState<number>(0);
  const [level, setLevel] = useState<number>(1);
  const [moveTimer, setMoveTimer] = useState<number>(3.5);
  const [showGameOver, setShowGameOver] = useState(false);
  const [gameOverReason, setGameOverReason] = useState<string>('');
  const [audioPlaying, setAudioPlaying] = useState<boolean>(false);
  const [lastDetectedPose, setLastDetectedPose] = useState<string>('No Pose');

  // Camera and skeleton visibility controls
  const [showCamera, setShowCamera] = useState(true);
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [showPoseImages, setShowPoseImages] = useState(false); // Toggle for pose reference images
  const [showPosePopup, setShowPosePopup] = useState(false); // Temporary pose pop-up
  const [popupPoseImage, setPopupPoseImage] = useState<string>(''); // Current pop-up pose image
  const [currentDetectedPose, setCurrentDetectedPose] = useState<string>('No Pose');

  // Consecutive non-Shifu command tracking
  const [consecutiveNonShifuCommands, setConsecutiveNonShifuCommands] = useState<number>(0);

  // Previous move tracking to prevent repetition
  const [previousMove, setPreviousMove] = useState<string>('');
  
  // Movement detection tracking with leniency
  const [movementDetectionFrames, setMovementDetectionFrames] = useState<number>(0);
  const [isInRestPosition, setIsInRestPosition] = useState<boolean>(true);
  const movementThreshold = 3; // Number of consecutive frames to confirm movement
  const movementDetectionFramesRef = useRef<number>(0);
  const isInRestPositionRef = useRef<boolean>(true);

  // Camera and pose detection refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [detector, setDetector] = useState<any>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const frameCountRef = useRef(0);
  const frameSkipRate = 3;

  // Immediate backend sync refs - these update instantly without waiting for React re-render
  const currentMoveRef = useRef<string | null>(null);
  const isShifuSaysRef = useRef<boolean>(false);
  const gameStateRef = useRef<'waiting' | 'countdown' | 'playing' | 'gameover'>('waiting');
  const moveMatchedRef = useRef<boolean>(false);
  const moveTimerRef = useRef<NodeJS.Timeout | null>(null);

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

  // Camera permission handler with mobile optimization
  const handleCameraPermission = async () => {
    try {
      setCameraError(null);
      console.log('Requesting camera permission...');
      addDebugInfo('Requesting camera permission...');
      
      // Use mobile-optimized camera initialization
      const isMobile = isMobileDevice();
      let granted = false;
      
      if (isMobile) {
        console.log('Mobile device detected - using mobile camera initialization');
        addDebugInfo('Mobile device detected');
        
        // Try mobile camera initialization
        const stream = await initializeMobileCamera();
        if (stream) {
          granted = true;
          // Stop the stream immediately after permission check
          stream.getTracks().forEach(track => track.stop());
        }
      } else {
        // Desktop camera permission
        granted = await requestCameraPermission();
      }
      
      if (granted) {
        setHasCameraPermission(true);
        console.log('Camera permission granted');
        addDebugInfo('Camera permission granted');
      } else {
        setCameraError(isMobile 
          ? 'Camera permission denied. Please allow camera access and ensure no other apps are using the camera.'
          : 'Camera permission denied. Please allow camera access in your browser settings.');
        console.error('Camera permission denied');
        addDebugInfo('Camera permission denied');
      }
    } catch (error: any) {
      setCameraError(error.message || 'Failed to access camera');
      console.error('Camera permission error:', error);
      addDebugInfo(`Camera error: ${error.message}`);
    }
  };

  // Calculate response time based on level and command type - AGGRESSIVE scaling after level 1
  const getResponseTime = (isShifuSays: boolean, currentLevel: number): number => {
    // Level 1 is easy to get players started
    if (currentLevel === 1) {
      return isShifuSays ? 4.0 : 3.5;
    }
    
    // Levels 2-10: Aggressive difficulty scaling
    const timings: { [key: number]: [number, number] } = {
      // [normal, shifuSays] for each level
      2: [2.0, 2.5],
      3: [1.5, 2.0], 
      4: [1.2, 1.5],
      5: [1.0, 1.2],
      6: [0.9, 1.0],
      7: [0.8, 0.9],
      8: [0.7, 0.8],
      9: [0.6, 0.7],
      10: [0.5, 0.5]  // Level 10: Lightning fast!
    };
    
    // Cap at level 10 for levels beyond
    const level = Math.min(currentLevel, 10);
    const [normalTime, shifuTime] = timings[level] || [0.5, 0.5];
    const finalTime = isShifuSays ? shifuTime : normalTime;
    
    console.log(`🕐 NEW DIFFICULTY: Level ${currentLevel}, ${isShifuSays ? 'Shifu Says' : 'Normal'} = ${finalTime}s`);
    
    return finalTime;
  };

  // Game over function
  const handleGameOver = (reason: string) => {
    console.log(`💀 GAME OVER: ${reason} | Final Score: ${score}`);
    
    // Play failure sound
    const incorrectSound = new Audio('/sounds/incorrect.m4a');
    incorrectSound.volume = 0.8;
    incorrectSound.play().then(() => {
      console.log(`❌ Failure sound played`);
    }).catch(error => {
      console.error(`🚨 Error playing failure sound: ${error}`);
    });
    
    // Clear any existing timer
    if (moveTimerRef.current) {
      clearTimeout(moveTimerRef.current);
      moveTimerRef.current = null;
    }
    
    setGameState('gameover');
    gameStateRef.current = 'gameover';
    setGameOverReason(reason);
    setShowGameOver(true);
    setMoveMatched(true); // Stop pose detection
    moveMatchedRef.current = true;
    setAudioPlaying(false); // Stop audio indicator
    setLastDetectedPose('No Pose'); // Reset pose tracking
  };

  // Start move timer with dynamic timing based on level
  const startMoveTimer = () => {
    const responseTime = getResponseTime(isShifuSaysRef.current, level);
    console.log(`⏰ TIMER SETUP: Level ${level}, ${isShifuSaysRef.current ? 'Shifu Says' : 'Normal'} command`);
    console.log(`⏰ EXACT TIMING: Starting ${responseTime}s timer for move: "${currentMoveRef.current}"`);
    
    // Clear any existing timer
    if (moveTimerRef.current) {
      clearTimeout(moveTimerRef.current);
    }
    
    setMoveTimer(responseTime);
    
    // Countdown timer every 100ms for smooth updates
    let timeLeft = responseTime;
    const timerInterval = setInterval(() => {
      timeLeft -= 0.1;
      setMoveTimer(Math.max(0, timeLeft));
      
      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        handleMoveTimeout();
      }
    }, 100);
    
    moveTimerRef.current = timerInterval as any;
    
    console.log(`⏰ TIMER ACTIVE: ${responseTime}s countdown started!`);
  };

  // Handle what happens when timer expires
  const handleMoveTimeout = () => {
    // GAME OVER PROTECTION - Don't handle timeout if game is over
    if (gameState === 'gameover' || gameStateRef.current === 'gameover') {
      console.log(`🛑 BLOCKED: handleMoveTimeout called but game is over!`);
      return;
    }
    
    console.log(`⏰ TIMER EXPIRED! | Move: "${currentMoveRef.current}" | isShifuSays: ${isShifuSaysRef.current} | User moved: ${moveMatchedRef.current}`);
    
    if (isShifuSaysRef.current) {
      // Shifu said move, but user didn't do it in time
      handleGameOver(`You didn't do "${currentMoveRef.current}" when Shifu said to!`);
    } else {
      // Normal move was said, user correctly didn't move
      console.log(`✅ CORRECT! User correctly ignored "${currentMoveRef.current}" (no Shifu says)`);
      advanceToNextMove();
    }
  };

  // Advance to next move and increment score
  const advanceToNextMove = () => {
    // GAME OVER PROTECTION - Don't advance if game is over
    if (gameState === 'gameover' || gameStateRef.current === 'gameover') {
      console.log(`🛑 BLOCKED: advanceToNextMove called but game is over!`);
      return;
    }
    
    console.log(`🎯 ADVANCING TO NEXT MOVE | Current Score: ${score}`);
    
    // Play success sound
    const correctSound = new Audio('/sounds/correct.m4a');
    correctSound.volume = 0.8;
    correctSound.play().then(() => {
      console.log(`✅ Success sound played`);
    }).catch(error => {
      console.error(`🚨 Error playing success sound: ${error}`);
    });
    
    // Increment score and check for level up
    setScore(prevScore => {
      const newScore = prevScore + 1;
      console.log(`📊 Score increased from ${prevScore} to: ${newScore}`);
      
      // Level up every 5 successful moves
      const newLevel = Math.floor(newScore / 5) + 1;
      if (newLevel > level && newLevel <= 10) { // Cap at level 10
        setLevel(newLevel);
        console.log(`🎉 LEVEL UP! From ${level} to ${newLevel} (Score: ${newScore})`);
        console.log(`🎯 NEW TIMINGS: Normal=${getResponseTime(false, newLevel)}s, Shifu Says=${getResponseTime(true, newLevel)}s`);
        
        // Show level up notification briefly
        setTimeout(() => {
          addDebugInfo(`Level Up! Now Level ${newLevel} - Timing: ${getResponseTime(true, newLevel)}s`);
        }, 100);
      }
      
      return newScore;
    });
    
    // Show success briefly
    setShowCheckMark(true);
    setTimeout(() => setShowCheckMark(false), 1000);
    
    // Generate next move after 1 second, then wait for audio to finish
    setTimeout(() => {
      selectRandomMove();
      // Timer will start automatically after audio duration + buffer time in selectRandomMove
    }, 1000);
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

  // Pose image file mapping - matches actual filenames in /poses/ directory
  const getPoseImageFile = (move: string): string => {
    const imageMap: { [key: string]: string } = {
      'Left High Block': 'ctlefthighblock.png',
      'Right High Block': 'ctrighthighblock.png',
      'Left Mid Block': 'ctleftmidblock.png',
      'Right Mid Block': 'ctrightmidblock.png',
      'Left Punch': 'ctleftpunch.png',
      'Right Punch': 'ctrightpunch.png',
      'Left Kick': 'ctleftkick.png',
      'Right Kick': 'ctrightkick.png',
      'X Block': 'ctxblock.png'
    };
    
    const filename = imageMap[move];
    const fullPath = `/poses/${filename}`;
    console.log(`🖼️ Pose image mapping: "${move}" -> ${fullPath}`);
    return fullPath;
  };

  // Random move selection with audio
  const selectRandomMove = () => {
    console.log(`🚨 selectRandomMove() STARTING! | Before: currentMove="${currentMove}" | gameState="${gameState}"`);
    
    // Reset moveMatched flag for new move
    setMoveMatched(false);
    moveMatchedRef.current = false; // 🔥 IMMEDIATE backend sync
    console.log(`🚨 setMoveMatched(false) called + moveMatchedRef.current = false`);
    
    // Pick random move, avoiding the previous move
    let selectedMove: string;
    let attempts = 0;
    const maxAttempts = 10; // Prevent infinite loop
    
    do {
      const randomIndex = Math.floor(Math.random() * availableMoves.length);
      selectedMove = availableMoves[randomIndex];
      attempts++;
      
      // If we've tried many times or only one move available, accept any move
      if (attempts >= maxAttempts || availableMoves.length === 1) {
        break;
      }
    } while (selectedMove === previousMove);
    
    console.log(`🚨 Random move selected: "${selectedMove}" (avoided previous: "${previousMove}") after ${attempts} attempts`);
    
    // Update previous move
    setPreviousMove(selectedMove);
    
    // Anti-consecutive logic: Force Shifu Says if too many non-Shifu commands in a row
    let shifuSays;
    if (consecutiveNonShifuCommands >= 2) {
      // Force Shifu Says to break the streak
      shifuSays = true;
      console.log(`🚨 FORCED Shifu Says: Too many non-Shifu commands (${consecutiveNonShifuCommands}) - resetting streak`);
      setConsecutiveNonShifuCommands(0); // Reset counter
    } else {
      // 60% chance for Shifu Says, 40% for normal
      shifuSays = Math.random() < 0.6;
      console.log(`🚨 Shifu Says flag: ${shifuSays} (60% chance)`);
      
      // Update consecutive counter
      if (!shifuSays) {
        setConsecutiveNonShifuCommands(prev => prev + 1);
        console.log(`🚨 Non-Shifu command #${consecutiveNonShifuCommands + 1} in a row`);
      } else {
        setConsecutiveNonShifuCommands(0); // Reset when Shifu Says
      }
    }
    
    console.log(`🚨 ABOUT TO SET STATE: setCurrentMove("${selectedMove}")`);
    setCurrentMove(selectedMove);
    currentMoveRef.current = selectedMove; // 🔥 IMMEDIATE backend sync
    console.log(`🚨 setCurrentMove("${selectedMove}") called + currentMoveRef.current = "${selectedMove}"`);
    
    console.log(`🚨 ABOUT TO SET STATE: setIsShifuSays(${shifuSays})`);
    setIsShifuSays(shifuSays);
    isShifuSaysRef.current = shifuSays; // 🔥 IMMEDIATE backend sync
    console.log(`🚨 setIsShifuSays(${shifuSays}) called + isShifuSaysRef.current = ${shifuSays}`);
    
    console.log(`🔥 BACKEND IMMEDIATELY SYNCED: currentMoveRef="${currentMoveRef.current}", isShifuSaysRef=${isShifuSaysRef.current}`);
    
    // Show pose image pop-up if enabled
    if (showPoseImages) {
      const poseImagePath = getPoseImageFile(selectedMove);
      console.log(`🖼️ POSE POPUP: Showing popup for "${selectedMove}" with image: ${poseImagePath}`);
      setPopupPoseImage(poseImagePath);
      setShowPosePopup(true);
      console.log(`🖼️ POSE POPUP: showPosePopup set to true`);
      
      // Hide pop-up after 1 second
      setTimeout(() => {
        console.log(`🖼️ POSE POPUP: Hiding popup after 1 second`);
        setShowPosePopup(false);
      }, 1000);
    } else {
      console.log(`🖼️ POSE POPUP: Pose images are disabled (showPoseImages = ${showPoseImages})`);
    }
    
    // Play audio
    const audioPath = getAudioFile(selectedMove, shifuSays);
    console.log(`🚨 Audio path: ${audioPath}`);
    
    const audio = new Audio(audioPath);
    audio.volume = 0.8; // Set volume to 80%
    setAudioPlaying(true); // Show audio playing indicator
    
    // Wait for audio metadata to load to get duration
    audio.addEventListener('loadedmetadata', () => {
      const audioDuration = audio.duration;
      const responseTime = getResponseTime(shifuSays, level);
      const totalDelay = audioDuration * 1000; // ONLY audio duration - no double counting!
      
      console.log(`🎵 FIXED TIMING: Audio=${audioDuration.toFixed(2)}s, Response=${responseTime}s, Total=${(audioDuration + responseTime).toFixed(2)}s`);
      
      // Start the response timer AFTER audio finishes
      setTimeout(() => {
        console.log(`🎵 Audio finished (${audioDuration.toFixed(2)}s), starting ${responseTime}s response timer now...`);
        setAudioPlaying(false); // Clear audio playing indicator
        startMoveTimer(); // This will start the correct responseTime duration
      }, totalDelay);
    });
    
    // Fallback in case metadata doesn't load
    audio.addEventListener('error', () => {
      const responseTime = getResponseTime(shifuSays, level);
      const fallbackDelay = 3000; // ONLY 3s audio estimate - no double counting!
      console.warn(`⚠️ Could not get audio duration, using fallback: 3s audio + ${responseTime}s response = ${(3 + responseTime).toFixed(2)}s total`);
      setTimeout(() => {
        console.log(`🎵 Fallback timer starting ${responseTime}s response timer...`);
        setAudioPlaying(false);
        startMoveTimer();
      }, fallbackDelay);
    });
    
    // Add better error handling and user feedback
    audio.play().then(() => {
      console.log(`✅ Audio started playing successfully: ${audioPath}`);
    }).catch(error => {
      console.error(`🚨 ERROR playing audio: ${error}`);
      setAudioPlaying(false); // Clear the playing indicator
      
      if (error.name === 'NotAllowedError') {
        alert(`Browser blocked audio autoplay! Please:\n1. Click the "Test Audio" button first\n2. Make sure your volume is up\n3. Try starting the game again`);
      } else {
        alert(`Audio playback failed: ${error.message}. Please check your audio settings and try again.`);
      }
      
      // Start timer anyway as fallback
      const responseTime = getResponseTime(shifuSays, level);
      setTimeout(() => {
        startMoveTimer();
      }, 2000); // ONLY 2s audio estimate - no double counting!
    });
    
    console.log(`🚨 selectRandomMove() COMPLETED! Audio playing... Timer will start after audio finishes + 2s`);
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

  // Initialize camera (only when game needs it and permissions are granted)
  useEffect(() => {
    const getCameraFeed = async () => {
      // Only start camera when countdown reaches 1 or game is playing, and permissions are granted
      if (detector && hasCameraPermission && (countdown === 1 || gameState === 'playing')) {
        try {
          console.log('Initializing camera stream...');
          // Use mobile-optimized camera stream
          const mediaStream = await getCameraStream('user');
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
            
            // Apply mobile optimizations
            initializeMobileVideo(videoRef.current);
            
            videoRef.current.onloadedmetadata = () => {
              if (canvasRef.current && videoRef.current) {
                // Use mobile-optimized canvas setup
                setupMobileCanvas(canvasRef.current, videoRef.current);
              }
            };
          }
          setStream(mediaStream);
          setCameraError(null);
          
          // Start pose detection loop
          detectAndDrawPose();
          addDebugInfo('Camera initialized successfully');
        } catch (error: any) {
          console.error('Error accessing camera:', error);
          setCameraError(error.message || 'Failed to access camera');
          addDebugInfo(`Camera error: ${error.message}`);
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
  }, [detector, countdown, gameState, hasCameraPermission]); // Added hasCameraPermission as dependency

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
            
            // Update last detected pose for next frame comparison (ALWAYS, regardless of game state)
            setLastDetectedPose(currentPose);
            
            // 🚨 BASIC DEBUG - Log pose detection (reduced frequency)
            if (frameCountRef.current === 0) { // Only log every few frames to reduce noise
              console.log(`🎯 POSE: "${currentPose}" | Game: "${gameState}" | Command: "${currentMove}"`);
            }
            
            // 🎯 BULLETPROOF POSE MATCHING - ONLY check when game is playing (use ref for immediate sync)
            if (gameStateRef.current === 'playing') {
              
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
              
              // 🚨 MOVEMENT DETECTION - Enhanced with leniency but strict on non-Shifu commands
              const currentlyInRestPosition = currentPose === 'No Pose';
              const hasDetectedSpecificPose = currentPose !== 'No Pose' && availableMoves.includes(currentPose);
              
              // Track movement detection frames for leniency
              if (!currentlyInRestPosition && hasDetectedSpecificPose) {
                movementDetectionFramesRef.current += 1;
              } else {
                movementDetectionFramesRef.current = 0;
              }
              
              // Update rest position tracking
              if (currentlyInRestPosition) {
                isInRestPositionRef.current = true;
              }
              
              // Detect confirmed movement (requires multiple frames for leniency)
              const hasConfirmedMovement = movementDetectionFramesRef.current >= movementThreshold;
              const hasMovedFromRest = isInRestPositionRef.current && hasConfirmedMovement;
              const hasMovedToCorrectPose = hasConfirmedMovement && currentPose === currentMoveRef.current;
              
              // Debug the enhanced detection conditions
              console.log(`🔍 ENHANCED MOVEMENT CHECK: 
                moveMatched=${moveMatchedRef.current} | 
                audioPlaying=${audioPlaying} | 
                currentPose="${currentPose}" | 
                inRestPosition=${isInRestPositionRef.current} | 
                detectionFrames=${movementDetectionFramesRef.current}/${movementThreshold} |
                hasConfirmedMovement=${hasConfirmedMovement} |
                hasMovedFromRest=${hasMovedFromRest} |
                hasMovedToCorrectPose=${hasMovedToCorrectPose}`);
              
              if (!moveMatchedRef.current && hasConfirmedMovement) {
                // Only trigger on confirmed movement (multiple consecutive frames)
                console.log(`🎉 CONFIRMED MOVEMENT! From rest: ${isInRestPositionRef.current} | To: "${currentPose}" | Expected: "${currentMoveRef.current}" | isShifuSays: ${isShifuSaysRef.current}`);
                
                // FINAL GAME OVER CHECK before any action
                if (gameStateRef.current === 'gameover') {
                  console.log(`🛑 BLOCKED: Movement detected but game is over! Ignoring.`);
                  return;
                }
                
                // Update rest position - user is no longer in rest
                isInRestPositionRef.current = false;
                
                if (!isShifuSaysRef.current) {
                  // Non-Shifu command: ANY confirmed movement = Game Over
                  console.log(`❌ GAME OVER! User moved during non-Shifu command! Detected: "${currentPose}"`);
                  
                  // IMMEDIATELY prevent multiple triggers
                  setMoveMatched(true);
                  moveMatchedRef.current = true;
                  
                  // Clear the timer since user moved
                  if (moveTimerRef.current) {
                    clearTimeout(moveTimerRef.current);
                    moveTimerRef.current = null;
                  }
                  
                  handleGameOver(`You moved when Shifu didn't say to! You did "${currentPose}" but should have stayed still.`);
                } else if (currentPose === currentMoveRef.current) {
                  // Shifu Says command: Correct movement = Success
                  console.log(`✅ CORRECT! User did "${currentPose}" when Shifu said to!`);
                  
                  // IMMEDIATELY prevent multiple triggers
                  setMoveMatched(true);
                  moveMatchedRef.current = true;
                  
                  // Clear the timer since user moved correctly
                  if (moveTimerRef.current) {
                    clearTimeout(moveTimerRef.current);
                    moveTimerRef.current = null;
                  }
                  
                  advanceToNextMove();
                } else {
                  // Shifu Says command: Wrong movement = Continue waiting (but movement is confirmed)
                  console.log(`⚠️ WRONG MOVE: User did "${currentPose}" but Shifu said "${currentMoveRef.current}" - continuing to wait`);
                  // Don't set moveMatched - keep waiting for correct move or timeout
                  // Don't clear timer - let it continue
                  // Reset movement detection to give another chance
                  movementDetectionFramesRef.current = 0;
                  isInRestPositionRef.current = true;
                }
              }
            }
            
            // Draw skeleton overlay
            drawSkeleton(ctx, pose.keypoints);
          } else {
            // No poses detected
            setCurrentDetectedPose('No Pose');
            
            // 🚨 BASIC DEBUG - Log no pose detection (reduced frequency)
            if (frameCountRef.current === 0) { // Only log every few frames to reduce noise
              console.log(`🎯 POSE: "No Pose" | Game: "${gameState}" | Command: "${currentMove}"`);
            }
            
            // Update last detected pose for next frame comparison (ALWAYS, regardless of game state)
            setLastDetectedPose('No Pose');
            
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
    
    // Need all keypoints to calculate angles
    if (!leftHip || !leftKnee || !leftAnkle || !rightHip || !rightKnee || !rightAnkle) {
      return null;
    }
    
    // Calculate leg angles (hip-knee-ankle for each leg)
    const leftLegAngle = calculateAngle(leftHip, leftKnee, leftAnkle);
      const rightLegAngle = calculateAngle(rightHip, rightKnee, rightAnkle);
    
    // Calculate the absolute difference between leg angles
    const angleDifference = Math.abs(leftLegAngle - rightLegAngle);
    
    console.log(`🦵 Leg angles: Left=${leftLegAngle.toFixed(1)}°, Right=${rightLegAngle.toFixed(1)}°, Difference=${angleDifference.toFixed(1)}°`);
    
    // Check if angle difference is in the kick range (60-90 degrees)
    if (angleDifference >= 60 && angleDifference <= 90) {
      // Determine which leg is doing the kick (the one with the smaller angle = more bent = kicking)
      if (leftLegAngle < rightLegAngle) {
        // Left leg is more bent, so it's a left kick
        console.log(`✅ LEFT KICK detected: Left leg angle ${leftLegAngle.toFixed(1)}° < Right leg angle ${rightLegAngle.toFixed(1)}°`);
      return 'Left Kick';
      } else {
        // Right leg is more bent, so it's a right kick  
        console.log(`✅ RIGHT KICK detected: Right leg angle ${rightLegAngle.toFixed(1)}° < Left leg angle ${leftLegAngle.toFixed(1)}°`);
      return 'Right Kick';
      }
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
    // Check both arms for X block - should be like two high blocks crossed above head
    const leftShoulder = findKeypoint(keypoints, 'left_shoulder');
    const leftElbow = findKeypoint(keypoints, 'left_elbow');
    const leftWrist = findKeypoint(keypoints, 'left_wrist');
    
    const rightShoulder = findKeypoint(keypoints, 'right_shoulder');
    const rightElbow = findKeypoint(keypoints, 'right_elbow');
    const rightWrist = findKeypoint(keypoints, 'right_wrist');
    
    if (!leftShoulder || !leftElbow || !leftWrist || !rightShoulder || !rightElbow || !rightWrist) {
      return false;
    }
    
    // X Block criteria - both hands crossed ABOVE HEAD like two high blocks
    // 1. Both wrists should be ABOVE shoulder level (high blocks)
    const leftWristHigh = leftWrist.y < leftShoulder.y - 30; // Wrist well above shoulder
    const rightWristHigh = rightWrist.y < rightShoulder.y - 30; // Wrist well above shoulder
    
    // 2. Both elbows should be raised (high block position)
    const leftElbowRaised = leftElbow.y < leftShoulder.y + 20; // Elbow at or above shoulder level
    const rightElbowRaised = rightElbow.y < rightShoulder.y + 20; // Elbow at or above shoulder level
    
    // 3. Wrists should be crossed/close together (X formation)
    const wristsClose = Math.abs(leftWrist.x - rightWrist.x) < 80; // Wrists reasonably close for crossing
    
    // 4. Both wrists should be centered above body (not off to sides)
    const shoulderCenter = (leftShoulder.x + rightShoulder.x) / 2;
    const wristCenter = (leftWrist.x + rightWrist.x) / 2;
    const wristsCentered = Math.abs(wristCenter - shoulderCenter) < 60; // Wrists centered above body
    
    // 5. Arms should be bent (like high blocks, not straight up)
    const leftArmAngle = calculateAngle(leftShoulder, leftElbow, leftWrist);
    const rightArmAngle = calculateAngle(rightShoulder, rightElbow, rightWrist);
    const leftArmBent = leftArmAngle >= 60 && leftArmAngle <= 140; // Reasonable high block bend
    const rightArmBent = rightArmAngle >= 60 && rightArmAngle <= 140; // Reasonable high block bend
    
    // X Block detected - need most criteria for crossed high blocks
    const criteriaMetCount = [
      leftWristHigh,
      rightWristHigh,
      leftElbowRaised,
      rightElbowRaised,
      wristsClose,
      wristsCentered,
      leftArmBent,
      rightArmBent
    ].filter(Boolean).length;
    
    // Need at least 6 out of 8 criteria for X block detection
    return criteriaMetCount >= 6;
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
    setLastDetectedPose('No Pose'); // Reset pose tracking
    setConsecutiveNonShifuCommands(0); // Reset consecutive counter
    
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
      
      // Activate camera when countdown reaches 1
      if (countdownValue === 1) {
        console.log(`📹 Activating camera at countdown = 1`);
        // Camera will be activated by the useEffect that monitors countdown state
        setShowCamera(true);
      }
      
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
        
        // Note: selectRandomMove() now handles its own timing based on actual audio duration
      }
    }, 1000);
  };

  // Restart game function
  const restartGame = () => {
    console.log(`🔄 RESTARTING GAME`);
    
    // Clear any existing timer
    if (moveTimerRef.current) {
      clearTimeout(moveTimerRef.current);
      moveTimerRef.current = null;
    }
    
    // Reset all states
    setGameState('waiting');
    gameStateRef.current = 'waiting';
    setCurrentMove(null);
    currentMoveRef.current = null;
    setIsShifuSays(false);
    isShifuSaysRef.current = false;
    setMoveMatched(false);
    moveMatchedRef.current = false;
    setScore(0);
    setLevel(1); // Reset level to 1
    setMoveTimer(3.5); // Reset to initial timer value
    setShowGameOver(false);
    setGameOverReason('');
    setShowCheckMark(false);
    setCountdown(null);
    setAudioPlaying(false);
    setLastDetectedPose('No Pose');
    setShowPosePopup(false); // Reset pose popup
    setPopupPoseImage(''); // Clear popup image
    setConsecutiveNonShifuCommands(0); // Reset consecutive counter
    
    console.log(`🔄 Game reset to waiting state`);
  };

  // Cleanup effects and helper functions removed - will be rebuilt

  // Debug: Track showPosePopup state changes
  useEffect(() => {
    console.log(`🖼️ POPUP STATE: showPosePopup changed to: ${showPosePopup} | Image: ${popupPoseImage}`);
  }, [showPosePopup, popupPoseImage]);

  // Debug: Track showPoseImages state changes
  useEffect(() => {
    console.log(`🖼️ TOGGLE STATE: showPoseImages changed to: ${showPoseImages}`);
  }, [showPoseImages]);

  // Debug: Track currentMove state changes
  useEffect(() => {
    console.log(`📝 🎯 CURRENTMOVE STATE CHANGED: "${currentMove}"`);
    console.log(`📝 🎯 UI should now display: "${isShifuSays ? 'Shifu says: ' : ''}${currentMove}"`);
  }, [currentMove]);

  // Debug: Log all level timings on game start
  useEffect(() => {
    if (gameState === 'playing') {
      console.log(`🎯 DIFFICULTY VERIFICATION - Current Level: ${level}`);
      console.log(`📊 ALL LEVEL TIMINGS:`);
      for (let i = 1; i <= 10; i++) {
        const normalTime = getResponseTime(false, i);
        const shifuTime = getResponseTime(true, i);
        console.log(`   Level ${i}: Normal=${normalTime}s, Shifu Says=${shifuTime}s`);
      }
    }
  }, [gameState, level]);

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

              {/* Score, Level and Timer - Top Center */}
              {gameState === 'playing' && (
                <div className="flex gap-4">
                  {/* Score */}
                  <div className="bg-black/70 backdrop-blur-sm rounded-2xl px-4 py-3 border border-yellow-500/30">
                    <div className="flex items-center gap-2">
                      <Crown className="h-5 w-5 text-yellow-400" />
                      <span className="text-yellow-400 font-bold text-xl">{score}</span>
                    </div>
                  </div>
                  
                  {/* Level */}
                  <div className="bg-black/70 backdrop-blur-sm rounded-2xl px-4 py-3 border border-purple-500/30">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-purple-400 flex items-center justify-center text-black text-xs font-bold">L</div>
                      <span className="text-purple-400 font-bold text-xl">{level}</span>
                    </div>
                  </div>
                  
                  {/* Timer / Audio Status */}
                  <div className={`bg-black/70 backdrop-blur-sm rounded-2xl px-4 py-3 border ${audioPlaying ? 'border-blue-500/30' : 'border-orange-500/30'}`}>
                    <div className="flex items-center gap-2">
                      {audioPlaying ? (
                        <>
                          <div className="w-3 h-3 rounded-full bg-blue-400 animate-pulse"></div>
                          <span className="font-bold text-xl text-blue-400">🎵 Listening...</span>
                        </>
                      ) : (
                        <>
                          <div className={`w-3 h-3 rounded-full ${moveTimer > 1 ? 'bg-green-400' : moveTimer > 0.5 ? 'bg-yellow-400 animate-pulse' : 'bg-red-400 animate-pulse'}`}></div>
                          <span className={`font-bold text-xl ${moveTimer > 1 ? 'text-green-400' : moveTimer > 0.5 ? 'text-yellow-400' : 'text-red-400'}`}>
                            {moveTimer.toFixed(1)}s
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Debug Info - Top Right */}
              <div className="bg-black/70 backdrop-blur-sm rounded-2xl px-4 py-3 border border-red-500/30 max-w-md">
                <div className="text-red-400 font-semibold text-sm mb-2">Debug Info:</div>
                <div className="text-xs text-white space-y-1">
                  {debugInfo.map((info, index) => (
                    <div key={index} className="font-mono">{info}</div>
                  ))}
                </div>
                </div>
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
                      
                      {/* Camera Permission Section */}
                      {!hasCameraPermission && (
                        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6">
                          <div className="flex items-center gap-2 mb-2">
                            <Camera className="h-6 w-6 text-red-400" />
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
                            <Camera className="h-4 w-4 mr-2" />
                            Enable Camera
                          </Button>
                        </div>
                      )}
                      
                      {/* Audio Warning */}
                      <div className="bg-orange-500/20 border border-orange-500/50 rounded-lg p-4 mb-6">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-orange-400 text-2xl">🔊</span>
                          <span className="text-orange-300 font-bold">AUDIO REQUIRED</span>
                        </div>
                        <p className="text-orange-200 text-sm mb-2">
                          Turn up your volume! This game requires audio to distinguish between "Shifu says" and regular commands.
                        </p>
                        <p className="text-orange-300 text-xs">
                          💡 If audio doesn't work: Click "Test Audio" first to enable browser permissions.
                        </p>
                      </div>
                      
                      <p className="text-gray-300 text-lg mb-6">
                        Listen carefully! Only perform moves when Shifu says so.
                      </p>
                      
                      {/* Test Audio Button */}
                      <Button 
                        onClick={() => {
                          console.log(`🎵 Testing audio...`);
                          const testAudio = new Audio('/sounds/shifu_says/Shifu Says Left Punch.mp3');
                          testAudio.volume = 0.8;
                          testAudio.play().then(() => {
                            console.log(`✅ Audio test successful!`);
                            alert('Audio test successful! 🎵 You should have heard "Shifu Says Left Punch"');
                          }).catch(error => {
                            console.error(`🚨 Audio test failed: ${error}`);
                            if (error.name === 'NotAllowedError') {
                              alert('Browser blocked audio! Please click somewhere on the page first, then try again.');
                            } else {
                              alert(`Audio test failed: ${error.message}. Please check your speakers/headphones.`);
                            }
                          });
                        }}
                        className="bg-blue-500 hover:bg-blue-600 text-white text-sm px-4 py-2 mb-4 mr-4"
                      >
                        🎵 Test Audio
                      </Button>
                      
                      {/* Pose Images Toggle */}
                      <div className="mb-6">
                        <button
                          onClick={() => {
                            const newValue = !showPoseImages;
                            console.log(`🖼️ TOGGLE: Pose images toggled from ${showPoseImages} to ${newValue}`);
                            setShowPoseImages(newValue);
                          }}
                          className={`rounded-lg px-4 py-3 text-sm flex items-center gap-3 transition-colors mx-auto ${
                            showPoseImages 
                              ? 'bg-purple-500/20 border border-purple-500/50 text-purple-400'
                              : 'bg-gray-500/20 border border-gray-500/50 text-gray-400 hover:bg-purple-500/10'
                          }`}
                        >
                          <span className="text-xl">🖼️</span>
                          <div className="text-left">
                            <div className="font-semibold">
                              {showPoseImages ? 'Pose Images: ON' : 'Pose Images: OFF'}
                    </div>
                            <div className="text-xs opacity-75">
                              {showPoseImages ? 'Pop-up will show pose reference' : 'Click to enable pose references'}
                    </div>
                  </div>
                        </button>
                      </div>
                      
                    <Button 
                    onClick={() => {
                      // Start the proper challenge with countdown
                      startChallenge();
                    }}
                    disabled={!hasCameraPermission}
                    className={`text-lg px-8 py-3 font-bold ${
                      hasCameraPermission 
                        ? 'bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 text-black hover:from-yellow-500 hover:via-amber-600 hover:to-yellow-700'
                        : 'bg-gray-600 text-gray-300 cursor-not-allowed'
                    }`}
                  >
                    <Crown className="h-5 w-5 mr-2" />
                    {hasCameraPermission ? 'Start Challenge' : 'Enable Camera First'}
                      </Button>
                    </div>
              )}

              {gameState === 'countdown' && countdown !== null && (
                <div className="text-center bg-black/80 backdrop-blur-sm rounded-3xl p-8 border border-yellow-500/30 max-w-2xl">
                  <div className="text-8xl font-bold text-yellow-400 mb-4 animate-pulse">
                    {countdown}
            </div>
                  <div className="text-3xl text-white mb-4 font-bold">Get Ready!</div>
                  <div className="text-lg text-gray-300 mb-2">
                    📍 Step back and ensure your entire body is visible
                  </div>
                  <div className="text-lg text-gray-300 mb-2">
                    🎯 Get in position for martial arts moves
                  </div>
                  <div className="text-lg text-yellow-400">
                    The challenge begins when the countdown reaches 1!
                  </div>
                </div>
              )}

            {gameState === 'playing' && (
                <div className="text-center bg-black/80 backdrop-blur-sm rounded-3xl p-8 border border-green-500/30 max-w-lg">
                  {currentMove && (
                    <div className="mb-4">
                      <p 
                        data-testid="current-command"
                        className="text-4xl font-bold text-yellow-400 mb-6">
                        {currentMove}
                      </p>
                      

                  </div>
              )}
                  <div className="text-gray-400 text-sm">
                    Score: {score} • {audioPlaying ? '🎵 Listen...' : `${moveTimer.toFixed(1)}s`}
            </div>
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

            {/* Pose Image Pop-up */}
            <AnimatePresence>
        {showPosePopup && (
                <motion.div 
            className="fixed inset-0 flex items-center justify-center z-40 pointer-events-none"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.2 }}
          >
            <div className="bg-black/90 backdrop-blur-sm rounded-3xl p-6 border-2 border-purple-500/50 shadow-2xl max-w-sm">
              <img
                src={popupPoseImage}
                alt="Pose reference"
                className="mx-auto max-w-48 max-h-48 rounded-lg border border-purple-400/30"
                onLoad={() => {
                  console.log(`✅ POSE POPUP: Image loaded successfully: ${popupPoseImage}`);
                }}
                onError={(e) => {
                  console.error(`❌ POSE POPUP: Image failed to load: ${popupPoseImage}`);
                  e.currentTarget.style.display = 'none';
                }}
              />
              <p className="text-purple-300 text-center text-sm mt-3 font-semibold">📸 Pose Reference</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

      {/* Game Over Modal */}
            <AnimatePresence>
        {showGameOver && (
                  <motion.div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
                    <motion.div
              className="bg-gradient-to-br from-gray-900 to-black border border-red-500/50 rounded-3xl p-8 max-w-md w-full mx-4 text-center"
              initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ type: "spring", duration: 0.5 }}
            >
              <div className="text-6xl mb-4">💀</div>
              <h2 className="text-3xl font-bold text-red-400 mb-4">Game Over!</h2>
              <p className="text-gray-300 text-lg mb-6">{gameOverReason}</p>
              
              <div className="bg-black/50 rounded-2xl p-4 mb-6">
                <div className="text-yellow-400 text-sm mb-2">Final Results</div>
                <div className="flex items-center justify-center gap-6">
                  <div className="flex items-center gap-2">
                    <Crown className="h-6 w-6 text-yellow-400" />
                    <span className="text-3xl font-bold text-yellow-400">{score}</span>
                      </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-purple-400 flex items-center justify-center text-black text-sm font-bold">L</div>
                    <span className="text-3xl font-bold text-purple-400">{level}</span>
                      </div>
                      </div>
                    </div>

              <div className="flex gap-3">
                    <Button 
                  onClick={restartGame}
                  className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-3"
                    >
                  Play Again
                    </Button>
                <Link href="/challenges">
                      <Button 
                        variant="outline"
                    className="flex-1 border-gray-500 text-gray-300 hover:bg-gray-700"
                  >
                    Back to Menu
                        </Button>
                      </Link>
                    </div>
            </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

      {/* Pose Analyzer Modal */}
      {showPoseAnalyzer && (
        <PoseAnalyzer onClose={() => setShowPoseAnalyzer(false)} />
      )}
    </div>
  );
};

export default ShifuSaysChallenge; 