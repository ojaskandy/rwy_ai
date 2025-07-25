import { useState, useEffect, useRef } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Play, Square, Camera } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface CameraPermissionOverlayProps {
  onRequestPermission: () => void;
}

function CameraPermissionOverlay({ onRequestPermission }: CameraPermissionOverlayProps) {
  return (
    <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-30">
      <div className="bg-white rounded-2xl p-8 max-w-md mx-4 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-pink-100 rounded-full flex items-center justify-center">
          <Camera className="w-8 h-8 text-pink-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Camera Access Required</h3>
        <p className="text-gray-600 mb-6">
          We need access to your camera to provide real-time pageant coaching feedback.
        </p>
        <Button 
          onClick={onRequestPermission}
          className="w-full bg-gradient-to-r from-pink-500 to-pink-400 text-white hover:from-pink-600 hover:to-pink-500"
        >
          Allow Camera Access
        </Button>
      </div>
    </div>
  );
}

interface SummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  feedback: string;
  isLoading: boolean;
}

function SummaryModal({ isOpen, onClose, feedback, isLoading }: SummaryModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-xl font-semibold text-gray-900">
            Practice Session Summary
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            Here's your comprehensive performance feedback
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-4 flex-1 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex space-x-2">
                <div className="w-3 h-3 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-3 h-3 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-3 h-3 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
              <span className="text-gray-600 ml-3">Analyzing your complete routine...</span>
            </div>
          ) : (
            <div className="bg-pink-50 rounded-lg p-6 h-full overflow-y-auto">
              <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                {feedback || "Great session! Keep practicing to build your confidence and perfect your technique."}
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end mt-6">
          <Button 
            onClick={onClose}
            className="bg-gradient-to-r from-pink-500 to-pink-400 text-white hover:from-pink-600 hover:to-pink-500"
          >
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Routine() {
  // Core state
  const [isActive, setIsActive] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  
  // Summary modal state
  const [showSummary, setShowSummary] = useState(false);
  const [summaryFeedback, setSummaryFeedback] = useState('');
  const [summaryLoading, setSummaryLoading] = useState(false);
  
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameBufferRef = useRef<string[]>([]);
  const captureIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const sendIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const allFramesRef = useRef<string[]>([]);

  // Request camera permission
  const requestCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          width: { min: 640, ideal: 1280, max: 1920 },
          height: { min: 480, ideal: 720, max: 1080 }
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setHasPermission(true);
      }
    } catch (error) {
      console.error('Camera permission denied:', error);
      setHasPermission(false);
    }
  };

  // Initialize camera on component mount
  useEffect(() => {
    requestCameraPermission();
    
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (captureIntervalRef.current) {
        clearInterval(captureIntervalRef.current);
      }
      if (sendIntervalRef.current) {
        clearInterval(sendIntervalRef.current);
      }
    };
  }, []);

  // Capture frame from video
  const captureFrame = (): string | null => {
    if (!videoRef.current || !canvasRef.current) return null;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return null;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    
    return canvas.toDataURL('image/jpeg', 0.8);
  };

  // Send frames to API for analysis
  const sendFramesForAnalysis = async (frames: string[], isSequenceSummary = false) => {
    try {
      const response = await fetch('/api/pageant-coaching', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ frames, isSequenceSummary })
      });

      if (!response.ok) {
        console.error('API error:', response.status);
        return;
      }

      const data = await response.json();
      
      if (isSequenceSummary) {
        setSummaryFeedback(data.feedback);
        setSummaryLoading(false);
      }
    } catch (error) {
      console.error('Analysis failed:', error);
      if (isSequenceSummary) {
        setSummaryLoading(false);
      }
    }
  };

  // Start practice session
  const startPractice = () => {
    if (hasPermission === false) return;
    
    setIsActive(true);
    frameBufferRef.current = [];
    allFramesRef.current = [];
    
    // Capture frame every 1 second
    captureIntervalRef.current = setInterval(() => {
      const frame = captureFrame();
      if (frame) {
        frameBufferRef.current.push(frame);
        allFramesRef.current.push(frame);
        
        // Keep only last 4 frames in buffer
        if (frameBufferRef.current.length > 4) {
          frameBufferRef.current.shift();
        }
      }
    }, 1000);
  };

  // Stop practice session
  const stopPractice = () => {
    setIsActive(false);
    
    // Clear intervals
    if (captureIntervalRef.current) {
      clearInterval(captureIntervalRef.current);
      captureIntervalRef.current = null;
    }
    if (sendIntervalRef.current) {
      clearInterval(sendIntervalRef.current);
      sendIntervalRef.current = null;
    }
    
    // Generate final summary
    if (allFramesRef.current.length > 0) {
      setSummaryLoading(true);
      setShowSummary(true);
      sendFramesForAnalysis(allFramesRef.current, true);
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden relative bg-black">
      {/* Video Element - Full Screen */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-contain"
      />
      
      {/* Hidden canvas for frame capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Camera Permission Overlay */}
      {hasPermission === false && (
        <CameraPermissionOverlay onRequestPermission={requestCameraPermission} />
      )}

      {/* Back Button - Top Left */}
      <div className="absolute top-6 left-6 z-20">
        <Link href="/">
          <Button 
            variant="ghost" 
            className="text-white hover:text-pink-300 hover:bg-white/10 backdrop-blur-sm border border-white/20"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </Button>
        </Link>
      </div>

      {/* Start/Stop Button - Center Top */}
      <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-20">
        <Button
          onClick={isActive ? stopPractice : startPractice}
          disabled={hasPermission === false}
          className={`
            px-8 py-4 rounded-2xl font-semibold shadow-lg text-white backdrop-blur-sm
            ${isActive 
              ? 'bg-gradient-to-r from-red-500/90 to-red-400/90 hover:from-red-600/90 hover:to-red-500/90' 
              : 'bg-gradient-to-r from-pink-500/90 to-pink-400/90 hover:from-pink-600/90 hover:to-pink-500/90'
            }
          `}
        >
          {isActive ? (
            <>
              <Square className="w-5 h-5 mr-2" />
              Stop Practice
            </>
          ) : (
            <>
              <Play className="w-5 h-5 mr-2" />
              Start Practice
            </>
          )}
        </Button>
      </div>

      {/* Recording Indicator */}
      {isActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute top-6 right-6 z-20"
        >
          <div className="flex items-center space-x-2 bg-red-500/90 text-white px-3 py-2 rounded-full backdrop-blur-sm">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">LIVE</span>
          </div>
        </motion.div>
      )}

      {/* Summary Modal */}
      <SummaryModal
        isOpen={showSummary}
        onClose={() => setShowSummary(false)}
        feedback={summaryFeedback}
        isLoading={summaryLoading}
      />
    </div>
  );
} 