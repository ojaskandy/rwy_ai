import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'wouter';
import { useSubscription } from '@/hooks/use-subscription';
import { LimitReachedModal } from '@/components/LimitReachedModal';
import UsageAfterAction from '@/components/UsageAfterAction';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Play, Square, Camera, Send, MessageCircle, Sparkles, Mail, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
  isUser: boolean;
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
        timestamp: new Date(),
        isUser: true
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
            <h3 className="text-lg text-black mb-4">🎯 Next Steps</h3>
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

function PremiumOnlyOverlay() {
  const [, navigate] = useLocation();
  return (
    <div className="absolute inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
      <div className="max-w-md text-center">
        <h2 className="text-2xl font-bold text-white mb-4">Premium Feature</h2>
        <p className="text-gray-300 mb-6">
          The Walk feature is exclusively available to premium users. Upgrade now to access advanced walk & posture analysis.
        </p>
        <Button
          onClick={() => navigate('/pricing')}
          className="bg-white text-black hover:bg-gray-100 font-semibold px-8 py-4 rounded-xl"
        >
          Upgrade to Premium
        </Button>
      </div>
    </div>
  );
}

export default function Routine() {
  const { checkUsage, limits, isPremium } = useSubscription();
  const [isLimitModalOpen, setIsLimitModalOpen] = useState(false);
  // Core state
  const [isActive, setIsActive] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  
  // Mode selection state
  const [mode, setMode] = useState<'catwalk' | 'talent' | 'plan'>('catwalk');
  
  // Plan chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([{
    id: 'welcome',
    message: '',
    reply: 'Welcome to the Planning Assistant! I\'m here to help you plan your talent or catwalk performance. What would you like to discuss today?',
    timestamp: new Date(),
    isUser: false
  }]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailAddress, setEmailAddress] = useState('');
  
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
  const sessionStartRef = useRef<number | null>(null);

  // Request camera permission
  const requestCameraPermission = async () => {
    try {
      // Stop any existing stream first
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      console.log('Requesting camera access...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          width: { min: 640, ideal: 1280, max: 1920 },
          height: { min: 480, ideal: 720, max: 1080 }
        },
        audio: false 
      });
      
      console.log('Camera access granted, setting up video element');
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Force play after setting source
        videoRef.current.onloadedmetadata = () => {
          if (videoRef.current) {
            videoRef.current.play().catch(err => console.error('Error playing video:', err));
          }
        };
        streamRef.current = stream;
        setHasPermission(true);
      }
    } catch (error) {
      console.error('Camera permission denied:', error);
      setHasPermission(false);
    }
  };

  // Initialize camera on component mount and when mode changes (except for 'plan')
  useEffect(() => {
    if (mode !== 'plan') {
      requestCameraPermission();
    } else if (streamRef.current) {
      // Stop camera when switching to plan mode
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
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
  }, [mode]);

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
      const { data: { session } } = await supabase.auth.getSession();

      const endpoint = mode === 'talent' ? '/api/talent-coaching' : '/api/pageant-coaching';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {})
        },
        body: JSON.stringify({ 
          frames, 
          isSequenceSummary,
          mode: mode // Send the current mode to the backend
        })
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

  // Plan chat functions
  const handleSendPlanMessage = async () => {
    if (!chatInput.trim() || isChatLoading) return;

    const messageText = chatInput.trim();
    setChatInput('');
    setIsChatLoading(true);

    // Add user message to chat
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      message: messageText,
      reply: '',
      timestamp: new Date(),
      isUser: true
    };
    
    setChatMessages(prev => [...prev, userMessage]);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch('/api/plan-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {})
        },
        body: JSON.stringify({ 
          message: messageText,
          planType: mode,
          history: chatMessages.map(msg => ({
            role: msg.isUser ? 'user' : 'assistant',
            content: msg.isUser ? msg.message : msg.reply
          })).slice(-10) // Send last 10 messages for context
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      const botMessage: ChatMessage = {
        id: `response-${Date.now()}`,
        message: '',
        reply: data.reply || 'I\'m sorry, I couldn\'t process your request right now.',
        timestamp: new Date(),
        isUser: false
      };
      
      setChatMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      // Show error message
      alert('Failed to send message. Please try again.');
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleSendEmail = async () => {
    if (!emailAddress || !emailAddress.includes('@')) {
      alert('Please enter a valid email address');
      return;
    }
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch('/api/email-plan-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {})
        },
        body: JSON.stringify({
          email: emailAddress,
          conversation: chatMessages.map(msg => ({
            role: msg.isUser ? 'user' : 'assistant',
            content: msg.isUser ? msg.message : msg.reply
          }))
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      setShowEmailModal(false);
      alert('Summary has been sent to your email!');
    } catch (error) {
      console.error('Email error:', error);
      alert('Failed to send email. Please try again.');
    }
  };

  // Start practice session
  const startPractice = async () => {
    const usageType = mode === 'talent' ? 'talent_routine' : 'walk_routine';
    const usage = await checkUsage(usageType);
    if (!usage.allowed) {
      setIsLimitModalOpen(true);
      return;
    }
    if (hasPermission === false) return;
    
    setIsActive(true);
    sessionStartRef.current = Date.now();
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

    // Send incremental usage every 15s; round up strictly
    sendIntervalRef.current = setInterval(async () => {
      if (!sessionStartRef.current) return;
      const elapsedSec = Math.floor((Date.now() - sessionStartRef.current) / 1000);
      if (elapsedSec > 0) {
        const quarters = Math.ceil(elapsedSec / 15);
        // Report one quarter per tick
        try {
          const { data: { session } } = await supabase.auth.getSession();
          await fetch('/api/usage/routine-minutes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
            body: JSON.stringify({ minutes: 1 })
          });
        } catch {}
        // Advance start baseline by 15s slice so next tick posts next slice
        sessionStartRef.current += 15000;
      }
    }, 15000);
  };

  // Stop practice session
  const stopPractice = async () => {
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

    // Track partial time in 15s quarters: round up each 15s slice
    if (sessionStartRef.current) {
      const elapsedSec = Math.floor((Date.now() - sessionStartRef.current) / 1000);
      if (elapsedSec >= 5) {
        const quarters = Math.max(1, Math.ceil(elapsedSec / 15));
        try {
          const { data: { session } } = await supabase.auth.getSession();
          await fetch('/api/usage/routine-minutes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
            body: JSON.stringify({ minutes: quarters })
          });
        } catch {}
      }
      sessionStartRef.current = null;
    }
  };

  return (
    <>
      {!isPremium && <PremiumOnlyOverlay />}
      <LimitReachedModal
        isOpen={isLimitModalOpen}
        onClose={() => setIsLimitModalOpen(false)}
        limitType={mode === 'talent' ? "Talent Routines" : "Walk Routines"}
        limit={mode === 'talent' ? limits.walkRoutinesMonthly : limits.walkRoutinesMonthly}
        timePeriod="month"
      />
      <div className="h-[100dvh] w-screen overflow-hidden relative bg-black">
      {/* Main Camera Screen - Always shown */}
      <div className="absolute inset-0 z-5 bg-black overflow-hidden">
        {/* Camera frame corner brackets - Show only when not in plan mode */}
        {mode !== 'plan' && (
          <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
            <div className="relative w-full h-full">
              {/* Top Left */}
              <div className="absolute top-16 left-6 w-20 h-20 border-t-2 border-l-2 border-white"></div>
              {/* Top Right */}
              <div className="absolute top-16 right-6 w-20 h-20 border-t-2 border-r-2 border-white"></div>
              {/* Bottom Left */}
              <div className="absolute bottom-40 left-6 w-20 h-20 border-b-2 border-l-2 border-white"></div>
              {/* Bottom Right */}
              <div className="absolute bottom-40 right-6 w-20 h-20 border-b-2 border-r-2 border-white"></div>
            </div>
          </div>
        )}

        {/* Top navigation buttons (X and ?) */}
        <div className="absolute top-12 left-6 z-20">
          <Link href="/">
            <div className="w-14 h-14 bg-gray-800/80 rounded-full flex items-center justify-center">
              <X className="w-7 h-7 text-white" />
            </div>
          </Link>
        </div>
        <div className="absolute top-12 right-6 z-20">
          <div className="w-14 h-14 bg-gray-800/80 rounded-full flex items-center justify-center">
            <div className="w-7 h-7 text-white font-bold text-2xl flex items-center justify-center">?</div>
          </div>
        </div>
      </div>

      {/* Video Element - Full Screen */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover absolute inset-0 z-10"
        style={{ display: mode !== 'plan' ? 'block' : 'none' }}
      />
      
      {/* Hidden canvas for frame capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Camera Permission Overlay */}
      {hasPermission === false && (
        <CameraPermissionOverlay onRequestPermission={requestCameraPermission} />
      )}

      {/* Bottom Mode Selection Buttons */}
      <div className="absolute bottom-[140px] left-0 right-0 flex items-center justify-center space-x-3 z-30 px-4">
        <button 
          onClick={() => setMode('catwalk')}
          className={`px-4 py-2 rounded-full flex items-center justify-center ${mode === 'catwalk' ? 'bg-white' : 'bg-gray-300/70'}`}
        >
          <Camera className="w-3 h-3 mr-1 text-black" />
          <span className="text-black text-sm">Catwalk</span>
        </button>
        
        <button 
          onClick={() => setMode('talent')}
          className={`px-4 py-2 rounded-full flex items-center justify-center ${mode === 'talent' ? 'bg-white' : 'bg-gray-300/70'}`}
        >
          <Sparkles className="w-3 h-3 mr-1 text-black" />
          <span className="text-black text-sm">Talent</span>
        </button>
        
        <button 
          onClick={() => setMode('plan')}
          className={`px-4 py-2 rounded-full flex items-center justify-center ${mode === 'plan' ? 'bg-white' : 'bg-gray-300/70'}`}
        >
          <MessageCircle className="w-3 h-3 mr-1 text-black" />
          <span className="text-black text-sm">Plan</span>
        </button>
      </div>
      
      {/* Capture Button */}
      <div className="absolute bottom-[90px] left-0 right-0 flex justify-center z-30">
        <button 
          onClick={mode !== 'plan' ? (isActive ? stopPractice : startPractice) : undefined}
          disabled={hasPermission === false}
          className="w-16 h-16 bg-white rounded-full border-4 border-gray-300 focus:outline-none focus:ring-4 focus:ring-white/50 transform transition-transform active:scale-95"
        >
          {isActive && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-10 h-10 bg-red-600 rounded-full"></div>
            </div>
          )}
        </button>
      </div>

      {/* Recording Indicator is now shown as a red circle in the capture button */}

      {/* We've replaced this with the new bottom UI */}
      
      {/* Plan Mode Content */}
      {mode === 'plan' && (
        <div className="absolute inset-0 z-20 bg-black flex flex-col overflow-hidden">
          {/* Chat messages area */}
          <div className="flex-1 overflow-hidden flex flex-col p-4 pb-40"> {/* Extra padding at bottom to make room for buttons */}
            <div className="bg-black/90 flex-1 overflow-y-auto">
              <div className="flex flex-col space-y-4 p-4" id="chat-container">
                {chatMessages.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={`${msg.isUser ? 'self-end bg-blue-500' : 'self-start bg-gray-700'} rounded-2xl p-4 max-w-[85%]`}
                  >
                    <p className="text-white">
                      {msg.isUser ? msg.message : msg.reply}
                    </p>
                  </div>
                ))}
                
                {isChatLoading && (
                  <div className="self-start bg-gray-700 rounded-2xl p-4 max-w-[85%]">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Input area with email button - fixed at bottom */}
          <div className="absolute bottom-[120px] left-0 right-0 px-4"> {/* Positioned above the mode buttons */}
            <div className="relative">
              <input 
                type="text" 
                placeholder="Type your message..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendPlanMessage()}
                disabled={isChatLoading}
                className="w-full bg-gray-800 text-white rounded-full pl-4 pr-24 py-3 border border-gray-600 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-2">
                <button 
                  className="bg-blue-500 hover:bg-blue-600 text-white rounded-full p-2" 
                  title="Email summary"
                  onClick={() => setShowEmailModal(true)}
                  disabled={chatMessages.length <= 1}
                >
                  <Mail className="w-5 h-5" />
                </button>
                <button 
                  className="bg-blue-500 hover:bg-blue-600 text-white rounded-full p-2"
                  onClick={handleSendPlanMessage}
                  disabled={isChatLoading || !chatInput.trim()}
                >
                  {isChatLoading ? (
                    <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Email Summary Modal */}
      <Dialog open={showEmailModal} onOpenChange={setShowEmailModal}>
        <DialogContent className="bg-white rounded-xl p-6 max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900">Email Your Plan</DialogTitle>
            <DialogDescription className="text-gray-600 mt-2">
              We'll send a summary of this planning session to your email.  
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <Input
              id="email"
              type="email"
              value={emailAddress}
              onChange={(e) => setEmailAddress(e.target.value)}
              placeholder="you@example.com"
              className="w-full"
            />
          </div>
          
          <div className="mt-6 flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setShowEmailModal(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSendEmail} 
              className="bg-pink-600 hover:bg-pink-700 text-white"
              disabled={!emailAddress.includes('@')}
            >
              Send Email
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Summary Modal */}
      <UsageAfterAction open={!isActive && showSummary} onOpenChange={(open) => { if (!open) setShowSummary(false); }} focus="routine" />
      <SummaryModal
        isOpen={showSummary}
        onClose={() => setShowSummary(false)}
        feedback={summaryFeedback}
        isLoading={summaryLoading}
      />
    </div>
    </>
  );
} 