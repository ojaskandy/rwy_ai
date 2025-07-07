import React, { useState } from 'react';
import { ArrowLeft, MessageSquare, Home, Sparkles, X, ChevronUp } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import ShifuChat from './ShifuChat';

export default function GlobalDock() {
  const { user } = useAuth();
  const [showShifuChat, setShowShifuChat] = useState(false);
  const [isDockVisible, setIsDockVisible] = useState(true);

  // Handle feedback submission by opening email client
  const handleFeedbackSubmit = () => {
    const username = user?.username || 'User';
    const subject = encodeURIComponent(`Feedback on CoachT by ${username}`);
    const body = encodeURIComponent("Please type your feedback here:\n\n"); // Default body
    window.location.href = `mailto:ojaskandy@gmail.com?subject=${subject}&body=${body}`;
  };

  // If dock is hidden, show small floating restore button
  if (!isDockVisible) {
    return (
      <>
        {/* Small floating restore button */}
        <div className="fixed bottom-4 right-4 z-[9999]">
          <button
            onClick={() => setIsDockVisible(true)}
            className="w-10 h-10 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-black/80 transition-all duration-200"
            title="Show Dock"
          >
            <ChevronUp className="h-4 w-4" />
          </button>
        </div>

        {/* Shifu Chat - Centered with backdrop */}
        {showShifuChat && (
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[10000] flex items-center justify-center p-4"
            onClick={() => setShowShifuChat(false)}
          >
            <div onClick={(e) => e.stopPropagation()}>
              <ShifuChat 
                position="bottom-right"
                autoShow={true}
                showDelay={0}
                size="medium"
                onDismiss={() => setShowShifuChat(false)}
              />
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <div className="fixed bottom-2 left-4 right-4 z-[9999] pointer-events-none">
        <div className="mx-auto max-w-sm dock-animate pointer-events-auto">
          <div className="glass-dock rounded-2xl p-2">
            <div className="flex items-center justify-between space-x-3">
              {/* Back Button */}
              <button
                onClick={() => window.history.back()}
                className="glass-dock-button flex items-center justify-center w-10 h-10 rounded-xl"
                title="Go Back"
              >
                <ArrowLeft className="h-4 w-4 text-white" />
              </button>

              {/* Home Button */}
              <button
                onClick={() => window.location.href = '/app'}
                className="glass-dock-button flex items-center justify-center w-10 h-10 rounded-xl"
                title="Home"
              >
                <Home className="h-4 w-4 text-white" />
              </button>

              {/* Chat with Shifu */}
              <button
                onClick={() => setShowShifuChat(true)}
                className="glass-dock-button flex items-center justify-center w-10 h-10 rounded-xl"
                title="Chat with Master Shifu"
              >
                <Sparkles className="h-4 w-4 text-white" />
              </button>

              {/* Feedback */}
              <button
                onClick={handleFeedbackSubmit}
                className="glass-dock-button flex items-center justify-center w-10 h-10 rounded-xl"
                title="Send Feedback"
              >
                <MessageSquare className="h-4 w-4 text-white" />
              </button>

              {/* Hide Dock Button */}
              <button
                onClick={() => setIsDockVisible(false)}
                className="glass-dock-button flex items-center justify-center w-8 h-8 rounded-lg opacity-60 hover:opacity-100"
                title="Hide Dock"
              >
                <X className="h-3 w-3 text-white" />
              </button>
            </div>
          </div>
          
          {/* Dock indicator dots - smaller */}
          <div className="flex justify-center mt-1 space-x-1">
            <div className="dock-indicator w-0.5 h-0.5 rounded-full"></div>
            <div className="dock-indicator active w-0.5 h-0.5 rounded-full"></div>
            <div className="dock-indicator w-0.5 h-0.5 rounded-full"></div>
            <div className="dock-indicator w-0.5 h-0.5 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Shifu Chat - Centered with backdrop */}
      {showShifuChat && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[10000] flex items-center justify-center p-4"
          onClick={() => setShowShifuChat(false)}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <ShifuChat 
              position="bottom-right"
              autoShow={true}
              showDelay={0}
              size="medium"
              onDismiss={() => setShowShifuChat(false)}
            />
          </div>
        </div>
      )}
    </>
  );
} 