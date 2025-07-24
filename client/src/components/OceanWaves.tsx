import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

export default function OceanWaves() {
  const [showChatbot, setShowChatbot] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const messageToSend = inputMessage;
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ocean-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageToSend,
          conversationHistory: messages.map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'assistant',
            content: msg.text
          }))
        }),
      });

      const data = await response.json();

      if (data.message) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: data.message,
          sender: 'assistant',
          timestamp: new Date()
        };

        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "I'm having trouble connecting right now. Please try again in a moment! 👑",
        sender: 'assistant',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
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

  const openChatbot = () => {
    setShowChatbot(true);
    if (messages.length === 0) {
      const welcomeMessage: Message = {
        id: 'welcome',
        text: "Hi! I'm your AI pageant coach. I can help with runway walking, interview prep, confidence tips, and pageant strategies. What would you like to work on? 👑",
        sender: 'assistant',
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
  };

  return (
    <>
      <div className="w-full h-32 relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-400 to-purple-500">
        {/* Animated Ocean Waves - Visible and Contained */}
        
        {/* First Wave Layer */}
        <motion.div
          className="absolute inset-0 opacity-60"
          style={{
            background: 'linear-gradient(45deg, #0ea5e9, #06b6d4, #8b5cf6, #ec4899, #f59e0b, #10b981)',
            backgroundSize: '400% 400%',
          }}
          animate={{
            backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        {/* Second Wave Layer with flowing shapes */}
        <motion.div
          className="absolute bottom-0 left-0 w-full h-16 opacity-70"
          style={{
            background: 'linear-gradient(90deg, transparent, #38bdf8, #8b5cf6, #ec4899, transparent)',
            clipPath: 'polygon(0 60%, 25% 40%, 50% 55%, 75% 35%, 100% 50%, 100% 100%, 0 100%)',
          }}
          animate={{
            x: ['-100%', '100%'],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        {/* Third Wave Layer from top */}
        <motion.div
          className="absolute top-0 right-0 w-full h-16 opacity-50"
          style={{
            background: 'linear-gradient(270deg, transparent, #06b6d4, #a855f7, #f472b6, transparent)',
            clipPath: 'polygon(0 50%, 25% 65%, 50% 45%, 75% 60%, 100% 40%, 100% 0%, 0 0%)',
          }}
          animate={{
            x: ['100%', '-100%'],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 3
          }}
        />

        {/* Rotating gradient overlay */}
        <motion.div
          className="absolute inset-0 opacity-40"
          style={{
            background: 'conic-gradient(from 0deg at 50% 50%, #06b6d4, #8b5cf6, #ec4899, #f59e0b, #10b981, #06b6d4)',
          }}
          animate={{
            rotate: [0, 360],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
        />

        {/* Floating Particles */}
        <motion.div
          className="absolute top-6 left-1/4 w-2 h-2 bg-white rounded-full opacity-80"
          animate={{
            y: [0, -15, 0],
            x: [0, 8, 0],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        <motion.div
          className="absolute top-12 right-1/3 w-1.5 h-1.5 bg-white rounded-full opacity-60"
          animate={{
            y: [0, -20, 0],
            x: [0, -10, 0],
            scale: [1, 0.8, 1],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
        />

        <motion.div
          className="absolute bottom-8 left-1/2 w-1 h-1 bg-white rounded-full opacity-90"
          animate={{
            y: [0, -12, 0],
            x: [0, 15, 0],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
        />

        {/* Message input area overlay - Full width */}
        <button 
          onClick={openChatbot}
          className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-6 py-3 shadow-lg hover:bg-white transition-all duration-200 hover:shadow-xl"
        >
          <span className="text-gray-600 text-sm font-medium">Message coach...</span>
        </button>
      </div>

      {/* Chatbot Popup */}
      <AnimatePresence>
        {showChatbot && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowChatbot(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-2xl shadow-2xl w-full max-w-md h-96 flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-pink-200/50 bg-gradient-to-r from-pink-100 to-purple-100">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-lg">👑</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800">AI Pageant Coach</h3>
                    <p className="text-xs text-gray-600">Your personal runway mentor</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowChatbot(false)}
                  className="h-8 w-8 p-0 hover:bg-pink-100"
                >
                  <X className="h-4 w-4 text-gray-600" />
                </Button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs px-4 py-2 rounded-2xl ${
                        message.sender === 'user'
                          ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white'
                          : 'bg-gray-800 text-white shadow-sm'
                      }`}
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-line">{message.text}</p>
                    </div>
                  </motion.div>
                ))}
                
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start"
                  >
                    <div className="bg-gray-800 rounded-2xl px-4 py-2 shadow-sm">
                      <div className="flex space-x-1">
                        <motion.div
                          className="w-2 h-2 bg-white rounded-full"
                          animate={{ scale: [1, 1.5, 1] }}
                          transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                        />
                        <motion.div
                          className="w-2 h-2 bg-white rounded-full"
                          animate={{ scale: [1, 1.5, 1] }}
                          transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                        />
                        <motion.div
                          className="w-2 h-2 bg-white rounded-full"
                          animate={{ scale: [1, 1.5, 1] }}
                          transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Input */}
              <div className="p-4 border-t border-pink-200/50 bg-gradient-to-r from-pink-50 to-purple-50">
                <div className="flex space-x-2">
                  <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask about pageant tips, runway walks, interviews..."
                    className="flex-1 border-pink-200 focus:border-pink-400 focus:ring-pink-400 text-gray-800 placeholder:text-gray-500"
                    disabled={isLoading}
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={!inputMessage.trim() || isLoading}
                    className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
} 