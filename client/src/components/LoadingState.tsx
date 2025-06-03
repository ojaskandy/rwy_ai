import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";

interface LoadingStateProps {
  progress: number;
  message?: string;
}

export default function LoadingState({ progress, message }: LoadingStateProps) {
  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="flex flex-col items-center text-center px-6 sm:px-8 max-w-md w-full">
        
        {/* Animated Logo */}
        <motion.div
          className="relative mb-8"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* Outer Ring */}
          <motion.div
            className="w-24 h-24 sm:w-32 sm:h-32 border-4 border-red-600/30 rounded-full absolute inset-0"
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          />
          
          {/* Inner Ring */}
          <motion.div
            className="w-20 h-20 sm:w-28 sm:h-28 border-2 border-red-500/60 rounded-full absolute inset-2"
            animate={{ rotate: -360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />
          
          {/* Center Logo */}
          <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-red-600 to-red-500 rounded-full flex items-center justify-center shadow-2xl shadow-red-500/50">
            <motion.div
              className="text-white font-bold text-xl sm:text-2xl"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              T
            </motion.div>
          </div>
          
          {/* Pulsing Glow */}
          <motion.div
            className="absolute inset-0 w-24 h-24 sm:w-32 sm:h-32 bg-red-500/20 rounded-full blur-xl"
            animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </motion.div>
        
        {/* Brand Name */}
        <motion.h1
          className="text-3xl sm:text-4xl font-bold mb-2 bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          CoachT
        </motion.h1>
        
        {/* Status Message */}
        <motion.p
          className="text-gray-300 text-base sm:text-lg mb-8 font-medium"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {message || 
            (progress < 30 ? "Initializing AI modules..." :
             progress < 60 ? "Loading pose detection..." :
             progress < 90 ? "Calibrating algorithms..." :
             "Almost ready...")
          }
        </motion.p>
        
        {/* Progress Section */}
        <motion.div
          className="w-full space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          {/* Progress Bar */}
          <div className="relative">
            <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-red-500 to-orange-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
            
            {/* Progress Indicator */}
            <motion.div
              className="absolute top-0 h-2 w-2 bg-white rounded-full shadow-lg"
              style={{ left: `calc(${progress}% - 4px)` }}
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          </div>
          
          {/* Progress Text */}
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-400">Loading...</span>
            <motion.span
              className="text-red-400 font-semibold"
              key={progress}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              {progress}%
            </motion.span>
          </div>
        </motion.div>
        
        {/* Loading Dots */}
        <motion.div
          className="flex space-x-2 mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 bg-red-500 rounded-full"
              animate={{ 
                scale: [1, 1.5, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2
              }}
            />
          ))}
        </motion.div>
        
        {/* Tip */}
        <motion.p
          className="text-xs text-gray-500 mt-6 max-w-xs leading-relaxed"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
        >
          AI-powered pose tracking for perfect Taekwondo form
        </motion.p>
      </div>
    </div>
  );
}
