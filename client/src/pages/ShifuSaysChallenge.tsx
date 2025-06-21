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

  // Camera and pose detection refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [detector, setDetector] = useState<any>(null);
  const animationFrameId = useRef<number | null>(null);
  const frameCountRef = useRef(0);
  const frameSkipRate = 3;

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const commandTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Martial arts commands with variations
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
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          ctx.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);

          if (poses.length > 0) {
            const pose = poses[0];
            
            // Detect specific martial arts poses
            const detectedPose = detectMartialArtsPose(pose.keypoints);
            if (detectedPose && detectedPose !== lastDetectedPose) {
              setLastDetectedPose(detectedPose);
              onPoseDetected(detectedPose, 0.8);
            }
            
            // Draw skeleton (optional, can be hidden)
            drawSkeleton(ctx, pose.keypoints);
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
    // Simple skeleton drawing
    ctx.fillStyle = 'rgba(255, 255, 0, 0.8)';
    keypoints.forEach(keypoint => {
      if (keypoint.score > 0.3) {
        ctx.beginPath();
        ctx.arc(keypoint.x, keypoint.y, 3, 0, 2 * Math.PI);
        ctx.fill();
      }
    });
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

  const startGame = () => {
    setGameState('playing');
    setScore(0);
    setRound(0);
    setCommandHistory([]);
    setShifuExpression('pointing');
    setMessage('Get ready! Listen carefully to Shifu...');
    setMessageType('instruction');
    
    setTimeout(() => {
      nextRound();
    }, 2000);
  };

  const nextRound = useCallback(() => {
    if (gameState !== 'playing') return;

    const newRound = round + 1;
    setRound(newRound);
    
    const command = generateCommand();
    setCurrentCommand(command);
    setTimeLeft(command.timeLimit);
    setIsPerformingMove(false);
    
    // Set Shifu expression based on command type
    setShifuExpression(command.isShifuCommand ? 'pointing' : 'neutral');
    
    setMessage(command.text);
    setMessageType('instruction');

    // Start countdown timer
    const startTime = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, command.timeLimit - elapsed);
      setTimeLeft(remaining);
      
      if (remaining <= 0) {
        handleTimeout();
      }
    }, 100);

    // Auto-advance if it's a trick command and user doesn't move
    commandTimeoutRef.current = setTimeout(() => {
      if (!command.isShifuCommand && !isPerformingMove) {
        handleCorrectResponse(true); // Correctly ignored trick command
      }
    }, command.timeLimit);
  }, [gameState, round, generateCommand, isPerformingMove]);

  const handleTimeout = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (commandTimeoutRef.current) clearTimeout(commandTimeoutRef.current);
    
    if (currentCommand) {
      if (currentCommand.isShifuCommand) {
        // Failed to perform required move
        handleIncorrectResponse('Time\'s up! You should have performed the move.');
      } else {
        // Correctly ignored trick command
        handleCorrectResponse(true);
      }
    }
  };

  const handleCorrectResponse = (ignored: boolean = false) => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (commandTimeoutRef.current) clearTimeout(commandTimeoutRef.current);
    
    const newScore = score + 10;
    setScore(newScore);
    setShifuExpression('happy');
    
    const successMessage = ignored 
      ? 'Excellent! You correctly ignored the trick command!'
      : 'Perfect! Well executed!';
    
    setMessage(successMessage);
    setMessageType('success');
    
    if (currentCommand) {
      setCommandHistory(prev => [...prev, { command: currentCommand.text, correct: true }]);
    }

    // Continue to next round
    setTimeout(() => {
      nextRound();
    }, 2000);
  };

  const handleIncorrectResponse = (reason: string) => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (commandTimeoutRef.current) clearTimeout(commandTimeoutRef.current);
    
    setShifuExpression('sad');
    setMessage(reason);
    setMessageType('error');
    
    if (currentCommand) {
      setCommandHistory(prev => [...prev, { command: currentCommand.text, correct: false }]);
    }

    // End game
    setTimeout(() => {
      setGameState('gameOver');
    }, 3000);
  };

  const onPoseDetected = (pose: string, confidence: number) => {
    setLastDetectedPose(pose);
    
    if (gameState !== 'playing' || !currentCommand || confidence < 0.7) return;
    
    setIsPerformingMove(true);
    
    if (currentCommand.isShifuCommand) {
      // Should perform the move
      if (pose === currentCommand.technique) {
        handleCorrectResponse();
      }
      // Continue waiting for correct pose
    } else {
      // Trick command - shouldn't perform any move
      handleIncorrectResponse('Oops! That command didn\'t start with "Shifu says"!');
    }
  };

  const resetGame = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (commandTimeoutRef.current) clearTimeout(commandTimeoutRef.current);
    setGameState('waiting');
    setCurrentCommand(null);
    setScore(0);
    setRound(0);
    setTimeLeft(0);
    setCommandHistory([]);
    setShifuExpression('neutral');
    setMessage('');
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (commandTimeoutRef.current) clearTimeout(commandTimeoutRef.current);
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
              
              {process.env.NODE_ENV === 'development' && (
                <Button 
                  variant="ghost" 
                  onClick={() => setShowPoseAnalyzer(true)}
                  className="text-yellow-400 hover:bg-yellow-600/20"
                >
                  <Settings className="h-5 w-5 mr-2" />
                  Calibrate Poses
                </Button>
              )}
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
              className="absolute inset-0 w-full h-full object-cover hidden"
            />
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>

          {/* Game Overlays */}
          <div className="absolute inset-0 flex flex-col">
            {/* Top HUD */}
            {gameState === 'playing' && (
              <div className="flex justify-center p-4">
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
                        style={{ width: `${(timeLeft / (currentCommand?.timeLimit || 1)) * 100}%` }}
                      />
                    </div>
                  </div>
                </motion.div>
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
                  <div className="text-sm text-gray-400">
                    Last detected: <span className="text-white">{lastDetectedPose || 'None'}</span>
                  </div>
                  <div className="text-sm text-gray-400">
                    Score: <span className="text-yellow-400 font-bold">{score}</span>
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