import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, MessageCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export type ShifuExpression = 'neutral' | 'happy' | 'sad' | 'pointing';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'shifu';
  timestamp: Date;
  expression?: ShifuExpression;
}

interface ShifuChatProps {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  autoShow?: boolean;
  showDelay?: number;
  onDismiss?: () => void;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export default function ShifuChat({
  position = 'bottom-right',
  autoShow = false,
  showDelay = 1000,
  onDismiss,
  size = 'medium',
  className = ''
}: ShifuChatProps) {
  const [isVisible, setIsVisible] = useState(!autoShow);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentExpression, setCurrentExpression] = useState<ShifuExpression>('neutral');
  const [dailyWisdom, setDailyWisdom] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoShow) {
      const timer = setTimeout(() => {
        setIsVisible(true);
        loadDailyWisdom();
      }, showDelay);
      return () => clearTimeout(timer);
    } else {
      loadDailyWisdom();
    }
  }, [autoShow, showDelay]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadDailyWisdom = async () => {
    try {
      const response = await fetch('/api/shifu/daily-wisdom');
      const data = await response.json();
      if (data.wisdom) {
        setDailyWisdom(data.wisdom);
        setCurrentExpression(data.expression || 'neutral');
      }
    } catch (error) {
      console.error('Failed to load daily wisdom:', error);
      setDailyWisdom("Welcome, young warrior. I am here to guide you on your martial arts journey.");
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const conversationHistory = messages.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text
      }));

      const response = await fetch('/api/shifu/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputMessage,
          conversationHistory
        }),
      });

      const data = await response.json();

      if (data.message) {
        const shifuMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: data.message,
          sender: 'shifu',
          timestamp: new Date(),
          expression: data.expression || 'neutral'
        };

        setMessages(prev => [...prev, shifuMessage]);
        setCurrentExpression(data.expression || 'neutral');
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Hmm... even a master sometimes needs a moment to gather his thoughts. Please try again, young grasshopper.",
        sender: 'shifu',
        timestamp: new Date(),
        expression: 'sad'
      };
      setMessages(prev => [...prev, errorMessage]);
      setCurrentExpression('sad');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getShifuImage = () => {
    const images = {
      neutral: '/images/shifu_coacht.png',
      happy: '/images/shifuhappy_ct.png',
      sad: '/images/shifusad_ct.png',
      pointing: '/images/shifupointleft_ct.png'
    };
    return images[currentExpression];
  };

  const getPositionClasses = () => {
    const positions = {
      'top-left': 'top-4 left-4',
      'top-right': 'top-4 right-4',
      'bottom-left': 'bottom-4 left-4',
      'bottom-right': 'bottom-4 right-4'
    };
    return positions[position];
  };

  const getSizeClasses = () => {
    const sizes = {
      small: 'w-16 h-16',
      medium: 'w-20 h-20',
      large: 'w-24 h-24'
    };
    return sizes[size];
  };

  const getChatPosition = () => {
    if (position.includes('right')) {
      return 'right-0 bottom-24';
    } else if (position.includes('left')) {
      return 'left-0 bottom-24';
    }
    return 'right-0 bottom-24';
  };

  if (!isVisible) return null;

  return (
    <div className={`fixed ${getPositionClasses()} z-50 ${className}`}>
      {/* Chat Window */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className={`absolute ${getChatPosition()} w-80 h-96 bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col mb-2`}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-amber-50 to-yellow-50">
              <div className="flex items-center space-x-2">
                <img 
                  src={getShifuImage()} 
                  alt="Master Shifu"
                  className="w-8 h-8 rounded-full"
                  style={{ imageRendering: 'pixelated' }}
                />
                <div>
                  <h3 className="font-semibold text-gray-900">Master Shifu</h3>
                  <p className="text-xs text-gray-500">Your AI Martial Arts Coach</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsChatOpen(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {/* Daily Wisdom */}
              {dailyWisdom && messages.length === 0 && (
                <div className="flex items-start space-x-2">
                  <img 
                    src={getShifuImage()} 
                    alt="Shifu"
                    className="w-6 h-6 rounded-full mt-1"
                    style={{ imageRendering: 'pixelated' }}
                  />
                  <div className="bg-gradient-to-r from-amber-100 to-yellow-100 rounded-lg p-3 max-w-64 border border-amber-200">
                    <p className="text-sm text-gray-800">{dailyWisdom}</p>
                    <div className="flex items-center mt-1 space-x-1">
                      <Sparkles className="h-3 w-3 text-amber-500" />
                      <span className="text-xs text-amber-600">Daily Wisdom</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Chat Messages */}
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'items-start space-x-2'}`}
                >
                  {message.sender === 'shifu' && (
                    <img 
                      src={getShifuImage()} 
                      alt="Shifu"
                      className="w-6 h-6 rounded-full mt-1"
                      style={{ imageRendering: 'pixelated' }}
                    />
                  )}
                  <div
                    className={`rounded-lg p-3 max-w-64 ${
                      message.sender === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gradient-to-r from-amber-100 to-yellow-100 text-gray-800 border border-amber-200'
                    }`}
                  >
                    <p className="text-sm">{message.text}</p>
                  </div>
                </div>
              ))}

              {/* Loading indicator */}
              {isLoading && (
                <div className="flex items-start space-x-2">
                  <img 
                    src={getShifuImage()} 
                    alt="Shifu"
                    className="w-6 h-6 rounded-full mt-1"
                    style={{ imageRendering: 'pixelated' }}
                  />
                  <div className="bg-gradient-to-r from-amber-100 to-yellow-100 rounded-lg p-3 border border-amber-200">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex space-x-2">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask Master Shifu for guidance..."
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button
                  onClick={sendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                  size="sm"
                  className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Shifu Avatar */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative"
      >
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsChatOpen(!isChatOpen)}
          className={`${getSizeClasses()} rounded-full shadow-lg border-2 border-amber-300 bg-gradient-to-r from-amber-100 to-yellow-100 p-1 relative overflow-hidden`}
        >
          <img 
            src={getShifuImage()} 
            alt={`Master Shifu ${currentExpression}`}
            className="w-full h-full object-contain rounded-full"
            style={{ imageRendering: 'pixelated' }}
          />
          
          {/* Notification badge */}
          {!isChatOpen && (
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center"
            >
              <MessageCircle className="h-2 w-2 text-white" />
            </motion.div>
          )}
        </motion.button>

        {/* Floating wisdom bubble (when chat is closed) */}
        {!isChatOpen && dailyWisdom && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-full mb-2 right-0 w-64 bg-white rounded-lg shadow-lg border border-gray-200 p-3"
          >
            <div className="text-xs text-gray-600 mb-1 flex items-center space-x-1">
              <Sparkles className="h-3 w-3 text-amber-500" />
              <span>Daily Wisdom</span>
            </div>
            <p className="text-sm text-gray-800">{dailyWisdom}</p>
            <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-white"></div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
} 