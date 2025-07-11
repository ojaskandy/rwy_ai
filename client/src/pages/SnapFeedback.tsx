import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Camera, RotateCcw, Send, Loader2, Zap, Image as ImageIcon, X, Volume2 } from 'lucide-react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';

const SnapFeedback: React.FC = () => {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Camera and photo states
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('user');
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [showFlash, setShowFlash] = useState(false);
  const [showRedBorder, setShowRedBorder] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);

  // Initialize camera on mount
  useEffect(() => {
    initializeCamera();
    
    // Prevent body scroll when component mounts
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    
    return () => {
      // Cleanup camera stream
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      // Cleanup audio
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.src = '';
      }
      // Restore original scroll behavior
      document.body.style.overflow = originalStyle;
    };
  }, [cameraFacing]);

  const initializeCamera = async () => {
    try {
      // Stop existing stream
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      const constraints = {
        video: {
          facingMode: cameraFacing,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(newStream);
      setHasPermission(true);
      setError('');

      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setHasPermission(false);
      setError('Unable to access camera. Please ensure camera permissions are granted.');
    }
  };

  const flipCamera = () => {
    setCameraFacing(prev => prev === 'user' ? 'environment' : 'user');
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    // Trigger flash and red border effects
    setShowFlash(true);
    setShowRedBorder(true);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw the video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get image data as base64
    const photoData = canvas.toDataURL('image/jpeg', 0.8);
    setCapturedPhoto(photoData);

    // Hide flash after 150ms
    setTimeout(() => {
      setShowFlash(false);
    }, 150);

    // Hide red border after 1 second
    setTimeout(() => {
      setShowRedBorder(false);
    }, 1000);
  };

  const uploadPhoto = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      if (typeof e.target?.result === 'string') {
        setCapturedPhoto(e.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const playFeedbackAudio = async (text: string) => {
    try {
      setIsPlayingAudio(true);

      // Stop any currently playing audio
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.src = '';
      }

      const response = await fetch('/api/shifu/speak', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate speech');
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      setCurrentAudio(audio);

      audio.onended = () => {
        setIsPlayingAudio(false);
        URL.revokeObjectURL(audioUrl);
      };

      audio.onerror = () => {
        setIsPlayingAudio(false);
        URL.revokeObjectURL(audioUrl);
      };

      await audio.play();
    } catch (error) {
      console.error('Error playing audio:', error);
      setIsPlayingAudio(false);
    }
  };

  const stopAudio = () => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      setIsPlayingAudio(false);
    }
  };

  const getFeedback = async () => {
    if (!capturedPhoto) return;

    setIsLoading(true);
    setError('');
    setFeedback('');

    try {
      // Remove the data URL prefix to get just the base64 data
      const base64Data = capturedPhoto.replace(/^data:image\/[a-z]+;base64,/, '');

      const response = await fetch('/api/snap-feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          image: base64Data,
          userId: user?.id
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get feedback from AI');
      }

      const data = await response.json();
      setFeedback(data.feedback);
    } catch (error) {
      console.error('Error getting AI feedback:', error);
      setError('Failed to get AI feedback. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const retakePhoto = () => {
    setCapturedPhoto(null);
    setFeedback('');
    setError('');
    // Stop any playing audio
    stopAudio();
  };

  return (
    <div className={`snap-feedback-page bg-gradient-to-br from-black via-gray-900 to-red-900/20 text-white flex flex-col transition-all duration-1000 ${showRedBorder ? 'border-4 border-red-500' : ''}`}>
      {/* Flash Effect */}
      <AnimatePresence>
        {showFlash && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-white z-50 pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* Hidden canvas for photo capture */}
      <canvas ref={canvasRef} className="hidden" />
      
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Top Navigation Strip */}
      <div className="w-full bg-gradient-to-r from-red-600 to-red-700 px-4 py-3 shadow-lg z-50 border-b border-red-500/20">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => navigate('/app')} 
            className="flex items-center text-white hover:text-red-200 font-semibold transition-all hover:scale-105"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            <span>Home</span>
          </button>
          
          <div className="text-center">
            <h1 className="text-white font-bold text-xl">📸 Snap Feedback</h1>
            <p className="text-red-200 text-xs">Get AI feedback on your technique</p>
          </div>
          
          <div className="w-16" /> {/* Spacer for balance */}
        </div>
      </div>

      {/* Mobile-First Camera Interface */}
      <div className="relative flex-1 flex flex-col min-h-0">
        {/* Camera Feed */}
        <div className="flex-1 relative bg-black overflow-hidden">
          {!capturedPhoto ? (
            // Live Camera View
            <>
              {hasPermission ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <Camera className="h-20 w-20 mx-auto mb-4 text-gray-600" />
                    <p className="text-gray-400 mb-4">Camera access required</p>
                    <Button
                      onClick={initializeCamera}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Enable Camera
                    </Button>
                  </div>
                </div>
              )}
              
              {/* Camera Flip Button */}
              {hasPermission && (
                <button
                  onClick={flipCamera}
                  className="absolute top-4 right-4 p-3 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
                >
                  <RotateCcw className="h-6 w-6" />
                </button>
              )}
            </>
          ) : (
            // Captured Photo View
            <>
              <img
                src={capturedPhoto}
                alt="Captured technique"
                className="w-full h-full object-cover"
              />
              
              {/* Retake Button */}
              <button
                onClick={retakePhoto}
                className="absolute top-4 right-4 p-3 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
              >
                <RotateCcw className="h-6 w-6" />
              </button>
            </>
          )}
        </div>

        {/* Bottom Controls - Fixed at bottom */}
        <div className="bg-black/90 p-4 sm:p-6 flex-shrink-0">
          {!capturedPhoto ? (
            // Capture Controls
            <div className="flex justify-center items-center gap-6">
              <button
                onClick={uploadPhoto}
                className="p-4 bg-gray-700 rounded-full text-white hover:bg-gray-600 transition-colors"
              >
                <ImageIcon className="h-6 w-6" />
              </button>
              
              {/* Main Shutter Button */}
              <button
                onClick={capturePhoto}
                disabled={!hasPermission}
                className="w-20 h-20 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 rounded-full flex items-center justify-center text-white transition-colors shadow-lg"
              >
                <Camera className="h-8 w-8" />
              </button>
              
              <div className="w-16" /> {/* Spacer for symmetry */}
            </div>
          ) : (
            // AI Feedback Button
            <div className="text-center">
              <Button
                onClick={getFeedback}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold py-4 text-lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Zap className="h-5 w-5 mr-2" />
                    Get AI Feedback
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mt-4 p-3 bg-red-900/30 border border-red-600/50 rounded-lg">
              <p className="text-red-300 text-sm text-center">{error}</p>
            </div>
          )}
        </div>
      </div>

      {/* Feedback Overlay */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gradient-to-br from-gray-900 to-black border border-red-600/30 rounded-xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-red-400 flex items-center">
                  <Zap className="h-5 w-5 mr-2" />
                  AI Analysis
                </h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => isPlayingAudio ? stopAudio() : playFeedbackAudio(feedback)}
                    className="p-2 bg-red-600 hover:bg-red-700 rounded-full transition-colors"
                    disabled={!feedback}
                  >
                    {isPlayingAudio ? (
                      <Loader2 className="h-4 w-4 text-white animate-spin" />
                    ) : (
                      <Volume2 className="h-4 w-4 text-white" />
                    )}
                  </button>
                  <button
                    onClick={() => setFeedback('')}
                    className="p-2 hover:bg-red-600/20 rounded-full transition-colors"
                  >
                    <X className="h-5 w-5 text-gray-400 hover:text-white" />
                  </button>
                </div>
              </div>
              
              <div className="text-gray-200 whitespace-pre-wrap leading-relaxed">
                {feedback}
              </div>
              
              <div className="mt-6 flex gap-3">
                <Button
                  onClick={() => setFeedback('')}
                  variant="outline"
                  className="flex-1 border-red-600/50 text-red-400 hover:bg-red-600/10"
                >
                  Close
                </Button>
                <Button
                  onClick={retakePhoto}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  Take Another
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SnapFeedback; 