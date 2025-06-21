import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export type ShifuExpression = 'neutral' | 'happy' | 'sad' | 'pointing';
export type ShifuPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
export type PointingDirection = 'left' | 'right' | 'up' | 'down';

interface ShifuGuideProps {
  expression: ShifuExpression;
  message: string;
  position?: ShifuPosition;
  pointingDirection?: PointingDirection;
  autoShow?: boolean;
  showDelay?: number;
  onDismiss?: () => void;
  dismissible?: boolean;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export default function ShifuGuide({
  expression,
  message,
  position = 'top-right',
  pointingDirection = 'left',
  autoShow = true,
  showDelay = 1000,
  onDismiss,
  dismissible = true,
  size = 'medium',
  className = ''
}: ShifuGuideProps) {
  const [isVisible, setIsVisible] = useState(!autoShow);
  const [showSpeechBubble, setShowSpeechBubble] = useState(false);

  useEffect(() => {
    if (autoShow) {
      const timer = setTimeout(() => {
        setIsVisible(true);
        setTimeout(() => setShowSpeechBubble(true), 500);
      }, showDelay);
      return () => clearTimeout(timer);
    }
  }, [autoShow, showDelay]);

  const handleDismiss = () => {
    setShowSpeechBubble(false);
    setTimeout(() => {
      setIsVisible(false);
      onDismiss?.();
    }, 200);
  };

  const getShifuImage = () => {
    const images = {
      neutral: '/images/shifu_coacht.png',
      happy: '/images/shifuhappy_ct.png',
      sad: '/images/shifusad_ct.png',
      pointing: '/images/shifupointleft_ct.png'
    };
    return images[expression];
  };

  const getPositionClasses = () => {
    const positions = {
      'top-left': 'top-4 left-4',
      'top-right': 'top-4 right-4',
      'bottom-left': 'bottom-4 left-4',
      'bottom-right': 'bottom-4 right-4',
      'center': 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2'
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

  const getPointingAnimation = () => {
    if (expression !== 'pointing') return {};
    
    const animations = {
      left: { x: [0, -10, 0] },
      right: { x: [0, 10, 0] },
      up: { y: [0, -10, 0] },
      down: { y: [0, 10, 0] }
    };
    
    return {
      animate: animations[pointingDirection],
      transition: { duration: 1, repeat: Infinity, ease: "easeInOut" }
    };
  };

  const getSpeechBubblePosition = () => {
    if (position.includes('right')) {
      return 'right-20 top-2';
    } else if (position.includes('left')) {
      return 'left-20 top-2';
    } else {
      return 'left-1/2 transform -translate-x-1/2 -top-16';
    }
  };

  // Actual Shifu image component
  const ShifuImage = () => {
    return (
      <img 
        src={getShifuImage()} 
        alt={`Shifu ${expression}`}
        className={`${getSizeClasses()} object-contain rounded-lg shadow-lg`}
        style={{ imageRendering: 'pixelated' }}
      />
    );
  };

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      className={`fixed ${getPositionClasses()} z-50 ${className}`}
    >
      <div className="relative">
        {/* Shifu Character */}
        <motion.div
          {...getPointingAnimation()}
          className="relative cursor-pointer"
          whileHover={{ scale: 1.1 }}
          onClick={() => setShowSpeechBubble(!showSpeechBubble)}
        >
          <ShifuImage />
          
          {/* Attention pulse for pointing */}
          {expression === 'pointing' && (
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-red-400"
              animate={{ scale: [1, 1.3, 1], opacity: [0.7, 0, 0.7] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}
        </motion.div>

        {/* Speech Bubble */}
        <AnimatePresence>
          {showSpeechBubble && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className={`absolute ${getSpeechBubblePosition()} w-64`}
            >
              <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 relative">
                {/* Speech bubble arrow */}
                <div className={`absolute ${position.includes('right') ? '-left-2' : position.includes('left') ? '-right-2' : 'bottom-full left-1/2 transform -translate-x-1/2'} w-0 h-0 border-8 ${position.includes('right') ? 'border-r-white border-l-transparent border-t-transparent border-b-transparent' : position.includes('left') ? 'border-l-white border-r-transparent border-t-transparent border-b-transparent' : 'border-b-white border-l-transparent border-r-transparent border-t-transparent'}`}></div>
                
                <div className="text-sm text-gray-800 font-medium mb-2">
                  {message}
                </div>
                
                {dismissible && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-1 right-1 h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                    onClick={handleDismiss}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// Preset configurations for common use cases
export const ShifuPresets = {
  welcomeGuide: {
    expression: 'happy' as ShifuExpression,
    message: "Welcome to CoachT! I'm your AI coach. Click on me anytime for guidance!",
    position: 'top-right' as ShifuPosition,
    showDelay: 2000
  },
  
  pointToPractice: {
    expression: 'pointing' as ShifuExpression,
    message: "Practice your round kicks in the Practice Library!",
    position: 'top-right' as ShifuPosition,
    pointingDirection: 'left' as PointingDirection,
    showDelay: 3000
  },
  
  encouragement: {
    expression: 'happy' as ShifuExpression,
    message: "Great job! Keep up the excellent training!",
    position: 'center' as ShifuPosition,
    showDelay: 500
  },
  
  needsImprovement: {
    expression: 'sad' as ShifuExpression,
    message: "Don't worry, practice makes perfect. Try again!",
    position: 'center' as ShifuPosition,
    showDelay: 500
  },
  
  dailyGoal: {
    expression: 'neutral' as ShifuExpression,
    message: "Here's your daily goal. Ready to train?",
    position: 'top-left' as ShifuPosition,
    showDelay: 1500
  }
}; 