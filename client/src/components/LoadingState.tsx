import { motion } from "framer-motion";
import { useState, useEffect } from "react";

interface LoadingStateProps {
  progress: number;
  message?: string;
}

export default function LoadingState({ progress, message }: LoadingStateProps) {
  const [typedText, setTypedText] = useState("");
  const fullText = "CoachT";

  useEffect(() => {
    if (progress > 30) {
      const timeout = setTimeout(() => {
        if (typedText.length < fullText.length) {
          setTypedText(fullText.slice(0, typedText.length + 1));
        }
      }, 150);
      return () => clearTimeout(timeout);
    }
  }, [typedText, progress]);

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center z-50 overflow-hidden">
      {/* Sweeping Red Gradient */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-b from-red-600/80 via-red-500/60 to-transparent"
        initial={{ y: "-100%" }}
        animate={{ y: "100%" }}
        transition={{ duration: 2, ease: "easeInOut" }}
      />
      
      {/* Secondary Sweep */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-b from-transparent via-red-400/40 to-transparent"
        initial={{ y: "-100%" }}
        animate={{ y: "100%" }}
        transition={{ duration: 2.5, ease: "easeInOut", delay: 0.3 }}
      />

      {/* Content Container */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 sm:px-8 max-w-sm w-full">
        
        {/* CoachT Typing Animation */}
        <motion.div
          className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 text-white flex items-center justify-center min-h-[4rem]"
          initial={{ opacity: 0 }}
          animate={{ opacity: progress > 30 ? 1 : 0 }}
          transition={{ delay: 1.5, duration: 0.5 }}
        >
          <span className="bg-gradient-to-r from-red-400 via-orange-500 to-red-400 bg-clip-text text-transparent">
            {typedText}
          </span>
          {progress > 30 && (
            <motion.span
              className="ml-1 text-red-400 text-3xl sm:text-4xl md:text-5xl"
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              |
            </motion.span>
          )}
        </motion.div>
        
        {/* Loading Status */}
        {progress > 60 && (
          <motion.div
            className="text-gray-300 text-sm sm:text-base mb-8 font-medium flex items-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.5 }}
          >
            <span>
              {message || 
                (progress < 70 ? "Initializing AI modules" :
                 progress < 85 ? "Loading pose detection" :
                 progress < 95 ? "Calibrating algorithms" :
                 "Almost ready")
              }
            </span>
            <motion.span
              className="ml-1 text-red-400"
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              ...
            </motion.span>
          </motion.div>
        )}
        
        {/* Progress Bar */}
        {progress > 80 && (
          <motion.div
            className="w-full space-y-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 3 }}
          >
            <div className="relative">
              <div className="w-full h-1 bg-gray-800/60 rounded-full overflow-hidden backdrop-blur-sm">
                <motion.div
                  className="h-full bg-gradient-to-r from-red-500 via-orange-500 to-red-600 rounded-full relative"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                >
                  {/* Shimmer Effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent w-full"
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  />
                </motion.div>
              </div>
            </div>
            
            {/* Progress Text */}
            <div className="flex justify-between items-center text-xs sm:text-sm">
              <span className="text-gray-500">Training AI</span>
              <motion.span
                className="text-red-400 font-bold tabular-nums"
                key={progress}
                initial={{ scale: 1.1, color: "#f97316" }}
                animate={{ scale: 1, color: "#ef4444" }}
                transition={{ duration: 0.3 }}
              >
                {progress}%
              </motion.span>
            </div>
          </motion.div>
        )}
        
        {/* Final Message */}
        {progress > 95 && (
          <motion.p
            className="text-xs text-gray-500 mt-6 max-w-xs leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 3.5 }}
          >
            Preparing your personal AI sensei
          </motion.p>
        )}
      </div>
    </div>
  );
}
