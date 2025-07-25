import { useState, useEffect, useRef } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Play, Square, Camera, Send, MessageCircle } from 'lucide-react';
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
  feedback: any;
  isLoading: boolean;
}

interface ChatMessage {
  id: string;
  message: string;
  reply: string;
  timestamp: Date;
}

function SummaryModal({ isOpen, onClose, feedback, isLoading }: SummaryModalProps) {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  const sendChatMessage = async () => {
    if (!chatInput.trim() || chatLoading) return;

    const messageText = chatInput.trim();
    setChatInput('');
    setChatLoading(true);

    try {
      const response = await fetch('/api/routine-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: messageText,
          previousFeedback: feedback 
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      
      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        message: messageText,
        reply: data.reply,
        timestamp: new Date()
      };

      setChatMessages(prev => [...prev, newMessage]);
    } catch (error) {
      console.error('Chat error:', error);
    } finally {
      setChatLoading(false);
    }
  };

  const renderStructuredFeedback = (feedbackData: any) => {
    if (typeof feedbackData === 'string') {
      return (
        <div className="prose prose-lg max-w-none">
          <p className="text-black leading-relaxed font-medium">{feedbackData}</p>
        </div>
      );
    }

    return (
      <div className="space-y-8">
        {/* Overview Section */}
        {feedbackData.overview && (
          <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
            <h3 className="text-lg font-semibold text-black mb-3">📋 Overview</h3>
            <p className="text-black leading-relaxed font-medium">{feedbackData.overview}</p>
          </div>
        )}

        {/* Scene by Scene Analysis */}
        {feedbackData.sceneAnalysis && (
          <div className="bg-purple-50 rounded-lg p-6 border border-purple-200">
            <h3 className="text-lg font-semibold text-black mb-4">🎭 Scene-by-Scene Analysis</h3>
            <div className="space-y-6">
              {feedbackData.sceneAnalysis.map((scene: any, index: number) => (
                <div key={index} className="bg-white rounded-lg p-5 border border-purple-100">
                  <h4 className="font-medium text-black mb-3">{scene.scene}</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="text-sm font-medium text-black mb-2">✅ Strengths</h5>
                      <ul className="space-y-1">
                        {scene.strengths?.map((strength: string, i: number) => (
                          <li key={i} className="text-sm text-black font-medium flex items-start">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                            {strength}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h5 className="text-sm font-medium text-black mb-2">💡 Areas to Improve</h5>
                      <ul className="space-y-1">
                        {scene.improvements?.map((improvement: string, i: number) => (
                          <li key={i} className="text-sm text-black font-medium flex items-start">
                            <span className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                            {improvement}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Next Steps */}
        {feedbackData.nextSteps && (
          <div className="bg-green-50 rounded-lg p-6 border border-green-200">
            <h3 className="text-lg font-semibold text-black mb-4">🎯 Next Steps</h3>
            <div className="space-y-3">
              {feedbackData.nextSteps.map((step: string, index: number) => (
                <div key={index} className="flex items-start">
                  <span className="bg-green-500 text-white text-sm font-medium rounded-full w-6 h-6 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                    {index + 1}
                  </span>
                  <p className="text-black leading-relaxed font-medium">{step}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[95vh] flex flex-col bg-white md:bg-pink-50/80 backdrop-blur-sm">
        <DialogHeader className="flex-shrink-0 pb-4 border-b border-gray-200">
          <DialogTitle className="text-xl md:text-2xl font-semibold text-gray-900">
            Practice Session Summary
          </DialogTitle>
          <DialogDescription className="text-gray-600 mt-2 text-sm md:text-base">
            Comprehensive performance analysis and improvement guidance
          </DialogDescription>
        </DialogHeader>
        
        {/* Mobile Feedback Layout */}
        <div className="flex-1 overflow-hidden mt-6 md:hidden">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="flex space-x-2 mb-4">
                <div className="w-4 h-4 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-4 h-4 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-4 h-4 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
              <span className="text-gray-600 text-lg">Analyzing your complete routine...</span>
              <span className="text-gray-500 text-sm mt-2">This may take a few moments</span>
            </div>
          ) : (
            <div className="h-full force-scrollbar bg-white rounded-xl p-4" style={{ overflow: 'auto', minHeight: '400px', maxHeight: 'calc(80vh - 200px)' }}>
              <style>{`
                .force-scrollbar {
                  overflow-y: scroll !important;
                  scrollbar-width: auto !important;
                  scrollbar-color: #94a3b8 #e2e8f0 !important;
                }
                .force-scrollbar::-webkit-scrollbar {
                  width: 16px !important;
                  display: block !important;
                }
                .force-scrollbar::-webkit-scrollbar-track {
                  background: #e2e8f0 !important;
                  border-radius: 8px !important;
                  border: 1px solid #cbd5e1 !important;
                }
                .force-scrollbar::-webkit-scrollbar-thumb {
                  background: #94a3b8 !important;
                  border-radius: 8px !important;
                  border: 2px solid #e2e8f0 !important;
                  min-height: 20px !important;
                }
                .force-scrollbar::-webkit-scrollbar-thumb:hover {
                  background: #64748b !important;
                }
                .force-scrollbar::-webkit-scrollbar-corner {
                  background: #e2e8f0 !important;
                }
              `}</style>
                              {renderStructuredFeedback(feedback || {
                  overview: "Great session! Keep practicing to build your confidence and perfect your technique.",
                  nextSteps: ["Focus on maintaining consistent posture", "Work on smooth transitions between movements"]
                })}
                
                {/* Force scrollable content */}
                <div className="h-32"></div>
                </div>
          )}
        </div>

        {/* Desktop Layout */}
        <div className="hidden md:flex flex-1 flex-col overflow-hidden mt-6">
          {/* Feedback Section */}
          <div className="flex-1 overflow-hidden">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="flex space-x-2 mb-4">
                  <div className="w-4 h-4 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-4 h-4 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-4 h-4 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
                <span className="text-gray-600 text-lg">Analyzing your complete routine...</span>
                <span className="text-gray-500 text-sm mt-2">This may take a few moments</span>
              </div>
            ) : (
              <div className="h-full force-scrollbar bg-white rounded-xl p-6" style={{ overflow: 'auto', minHeight: '500px', maxHeight: 'calc(80vh - 200px)' }}>
                <style>{`
                  .force-scrollbar {
                    overflow-y: scroll !important;
                    scrollbar-width: auto !important;
                    scrollbar-color: #94a3b8 #e2e8f0 !important;
                  }
                  .force-scrollbar::-webkit-scrollbar {
                    width: 16px !important;
                    display: block !important;
                  }
                  .force-scrollbar::-webkit-scrollbar-track {
                    background: #e2e8f0 !important;
                    border-radius: 8px !important;
                    border: 1px solid #cbd5e1 !important;
                  }
                  .force-scrollbar::-webkit-scrollbar-thumb {
                    background: #94a3b8 !important;
                    border-radius: 8px !important;
                    border: 2px solid #e2e8f0 !important;
                    min-height: 20px !important;
                  }
                  .force-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #64748b !important;
                  }
                  .force-scrollbar::-webkit-scrollbar-corner {
                    background: #e2e8f0 !important;
                  }
                `}</style>
                {renderStructuredFeedback(feedback || {
                  overview: "Great session! Keep practicing to build your confidence and perfect your technique.",
                  nextSteps: ["Focus on maintaining consistent posture", "Work on smooth transitions between movements"]
                })}
                
                {/* Force scrollable content */}
                <div className="h-32"></div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Query Section */}
        <div className="pt-4 mt-4 border-t border-gray-200 flex-shrink-0">
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">💬 Ask a Question</h4>
            <div className="relative">
              <Input
                placeholder="Ask a quick question about your routine..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                disabled={chatLoading}
                className="w-full pr-12 py-3 rounded-full border-2 border-gray-300 bg-white focus:bg-white focus:ring-2 focus:ring-pink-500 focus:border-pink-300 placeholder-gray-600 text-black font-medium text-base"
              />
              <Button
                onClick={sendChatMessage}
                disabled={!chatInput.trim() || chatLoading}
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white rounded-full w-8 h-8 p-0"
              >
                {chatLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Display Last Chat Response */}
          {chatMessages.length > 0 && (
            <div className="mb-4 p-5 bg-white rounded-lg border-2 border-pink-200 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-pink-400 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-black mb-2">Coach AI</p>
                  <p className="text-black leading-relaxed font-medium text-base">
                    {chatMessages[chatMessages.length - 1].reply}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <Button 
              onClick={onClose}
              className="bg-gradient-to-r from-pink-500 to-pink-400 text-white hover:from-pink-600 hover:to-pink-500 px-6 md:px-8 py-2 md:py-3 text-base md:text-lg font-medium"
            >
              Done
            </Button>
          </div>
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