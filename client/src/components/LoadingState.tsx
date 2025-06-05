import { motion } from "framer-motion";

interface LoadingStateProps {
  progress: number;
  message?: string;
}

export default function LoadingState({ progress, message }: LoadingStateProps) {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-black via-gray-950 to-black flex items-center justify-center z-50 overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floating Orbs */}
        <motion.div 
          className="absolute top-1/4 left-1/4 w-32 h-32 bg-red-500/10 rounded-full blur-2xl"
          animate={{ 
            x: [0, 50, -30, 0],
            y: [0, -40, 30, 0],
            scale: [1, 1.2, 0.8, 1]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-orange-500/8 rounded-full blur-2xl"
          animate={{ 
            x: [0, -60, 40, 0],
            y: [0, 50, -20, 0],
            scale: [0.8, 1.3, 1, 0.8]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        
        {/* Martial Arts Energy Lines */}
        <motion.div
          className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-red-500/30 to-transparent"
          animate={{ 
            scaleX: [0, 1, 0],
            opacity: [0, 0.6, 0]
          }}
          transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 w-px h-full bg-gradient-to-b from-transparent via-orange-500/20 to-transparent transform -translate-x-1/2"
          animate={{ 
            scaleY: [0, 1, 0],
            opacity: [0, 0.4, 0]
          }}
          transition={{ duration: 4, repeat: Infinity, delay: 1 }}
        />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center px-6 sm:px-8 max-w-sm w-full">
        
        {/* Taekwondo Kick Animation */}
        <motion.div
          className="relative mb-8"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          {/* Energy Ring */}
          <motion.div
            className="absolute inset-0 w-20 h-20 sm:w-24 sm:h-24 border-2 border-red-500/40 rounded-full"
            animate={{ 
              rotate: [0, 360],
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              rotate: { duration: 4, repeat: Infinity, ease: "linear" },
              scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
            }}
          />
          
          {/* Inner Energy */}
          <motion.div
            className="absolute inset-1 w-18 h-18 sm:w-22 sm:h-22 border border-orange-500/30 rounded-full"
            animate={{ 
              rotate: [360, 0],
              opacity: [0.3, 0.8, 0.3]
            }}
            transition={{ 
              rotate: { duration: 3, repeat: Infinity, ease: "linear" },
              opacity: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
            }}
          />
          
          {/* Center Logo with Kick Effect */}
          <motion.div 
            className="relative w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-red-600 via-red-500 to-orange-600 rounded-full flex items-center justify-center shadow-2xl shadow-red-500/50"
            animate={{ 
              boxShadow: [
                "0 0 20px rgba(239, 68, 68, 0.3)",
                "0 0 40px rgba(239, 68, 68, 0.6)",
                "0 0 20px rgba(239, 68, 68, 0.3)"
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {/* Taekwondo Kick Icon */}
            <motion.svg
              className="w-8 h-8 sm:w-10 sm:h-10 text-white"
              viewBox="0 0 24 24"
              fill="currentColor"
              animate={{ 
                rotate: [0, 15, -15, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2M21 9V7L15 7V9C15 11.8 12.8 14 10 14H8L8.5 16H10.5C12.2 16 13.7 17 14.4 18.4L17 22H19L16.4 18.4C17.4 17.1 18 15.6 18 14V12C19.7 12 21 10.7 21 9M7 22H9L12 16L11 14H7C5.3 14 4 12.7 4 11V9C4 7.3 5.3 6 7 6V4C4.2 4 2 6.2 2 9V11C2 13.8 4.2 16 7 16L7 22Z"/>
            </motion.svg>
          </motion.div>
          
          {/* Impact Waves */}
          <motion.div
            className="absolute inset-0 w-20 h-20 sm:w-24 sm:h-24 border border-red-400/20 rounded-full"
            animate={{ 
              scale: [1, 2.5],
              opacity: [0.6, 0]
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
          />
          <motion.div
            className="absolute inset-0 w-20 h-20 sm:w-24 sm:h-24 border border-orange-400/20 rounded-full"
            animate={{ 
              scale: [1, 2],
              opacity: [0.4, 0]
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 0.3 }}
          />
        </motion.div>
        
        {/* Brand Name */}
        <motion.h1
          className="text-3xl sm:text-4xl font-bold mb-2 bg-gradient-to-r from-red-400 via-orange-500 to-red-400 bg-clip-text text-transparent"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          CoachT
        </motion.h1>
        
        {/* Status Message with Typing Effect */}
        <motion.div
          className="text-gray-300 text-sm sm:text-base mb-8 font-medium h-6 flex items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <span>
            {message || 
              (progress < 30 ? "Initializing AI modules" :
               progress < 60 ? "Loading pose detection" :
               progress < 90 ? "Calibrating algorithms" :
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
        
        {/* Enhanced Progress Section */}
        <motion.div
          className="w-full space-y-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          {/* Progress Bar */}
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
        
        {/* Martial Arts Energy Dots */}
        <motion.div
          className="flex space-x-1 mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          {[0, 1, 2, 3, 4].map((i) => (
            <motion.div
              key={i}
              className="w-1 h-1 bg-red-500 rounded-full"
              animate={{ 
                scale: [0.5, 1.2, 0.5],
                opacity: [0.3, 1, 0.3],
                backgroundColor: ["#ef4444", "#f97316", "#ef4444"]
              }}
              transition={{
                duration: 1.8,
                repeat: Infinity,
                delay: i * 0.15,
                ease: "easeInOut"
              }}
            />
          ))}
        </motion.div>
        
        {/* Inspiration Text */}
        <motion.p
          className="text-xs text-gray-600 mt-4 max-w-xs leading-relaxed"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
        >
          Preparing your personal AI sensei
        </motion.p>
      </div>
    </div>
  );
}
