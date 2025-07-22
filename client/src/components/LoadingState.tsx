import { motion } from "framer-motion";
import { useState, useEffect } from "react";

interface LoadingStateProps {
  progress?: number;
  message?: string;
}

export default function LoadingState({ progress = 50, message }: LoadingStateProps) {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="text-center">
        {/* Simple Pink Loading Spinner */}
        <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg mb-4 mx-auto animate-pulse">
          <span className="text-2xl">✨</span>
        </div>
        
        {/* Loading Message */}
        <p className="text-gray-800 font-medium">
          {message || "Loading..."}
        </p>
      </div>
    </div>
  );
}
