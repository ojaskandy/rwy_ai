import React, { useState } from 'react';
import { ArrowLeft, MessageSquare, Home, Sparkles, X, ChevronUp, Sun, Moon } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useLocation } from 'wouter';
import { useTheme } from '@/hooks/use-theme';
import ShifuChat from './ShifuChat';

export default function GlobalDock() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [location] = useLocation();
  const [showShifuChat, setShowShifuChat] = useState(false);
  const [isDockVisible, setIsDockVisible] = useState(true);

  // Hide dock on authentication and landing pages
  const hiddenRoutes = ['/', '/auth', '/welcome', '/partnership'];
  const shouldHideDock = hiddenRoutes.includes(location);

  // Don't render dock at all on hidden routes
  if (shouldHideDock) {
    return null;
  }

  // Handle opening Shifu chat
  const handleShifuChatToggle = () => {
    setShowShifuChat(!showShifuChat);
  };

  // Handle feedback submission by opening email client
  const handleFeedbackSubmit = () => {
    const username = user?.username || 'User';
    const subject = encodeURIComponent(`Feedback on CoachT by ${username}`);
    const body = encodeURIComponent("Please type your feedback here:\n\n"); // Default body
    window.location.href = `mailto:ojaskandy@gmail.com?subject=${subject}&body=${body}`;
  };

  return (
    <>
      {/* Dock */}
      <div className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 z-40 transition-all duration-300 ${isDockVisible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}`}>
        <div className="bg-gray-900/80 backdrop-blur-md rounded-2xl border border-gray-800 px-4 py-3 shadow-2xl">
          <div className="flex items-center space-x-1">
            {/* Navigation buttons */}
            <div className="flex items-center space-x-1">
              <button
                onClick={() => window.history.back()}
                className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                title="Go Back"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              
              <button
                onClick={() => window.location.href = '/app'}
                className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                title="Home"
              >
                <Home className="h-5 w-5" />
              </button>
            </div>

            {/* Divider */}
            <div className="h-6 w-px bg-gray-700 mx-2" />

            {/* Actions */}
            <div className="flex items-center space-x-1">
              <button
                onClick={handleShifuChatToggle}
                className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                title="Chat with Shifu"
              >
                <Sparkles className="h-5 w-5" />
              </button>

              <button
                onClick={handleFeedbackSubmit}
                className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                title="Send Feedback"
              >
                <MessageSquare className="h-5 w-5" />
              </button>
            </div>

            {/* Visibility toggle */}
            <div className="ml-2 pl-2 border-l border-gray-700">
              <button
                onClick={() => setIsDockVisible(!isDockVisible)}
                className="p-1 rounded-full text-gray-500 hover:text-white hover:bg-gray-800 transition-colors"
                title="Hide Dock"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Shifu Chat */}
      {showShifuChat && <ShifuChat onDismiss={() => setShowShifuChat(false)} centered={true} />}
    </>
  );
} 