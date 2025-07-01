import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sword, Target, Flame, Zap, CheckCircle2, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useLocation } from 'wouter';

interface ShifuRecommendation {
  dailyGoal: string;
  category: string;
  targetAccuracy: number;
  difficulty: string;
  reasoning: string;
}

interface ShifuGoalResponse {
  goal: ShifuRecommendation;
  date: string;
  userId: number;
}

// Visual Shifu Character Component
const ShifuCharacter = ({ expression, size = 'large' }: { expression: 'neutral' | 'happy' | 'encouraging', size?: 'small' | 'medium' | 'large' }) => {
  const getShifuImage = () => {
    const images = {
      neutral: '/images/shifu_coacht.png',
      happy: '/images/shifuhappy_ct.png',
      encouraging: '/images/shifuhappy_ct.png' // Use happy for encouraging
    };
    return images[expression];
  };

  const sizes = {
    small: 'w-12 h-12',
    medium: 'w-16 h-16', 
    large: 'w-20 h-20'
  };

  const animations = {
    neutral: {},
    happy: { y: [0, -5, 0] },
    encouraging: { rotate: [0, 5, -5, 0] }
  };

  return (
    <motion.div
      animate={animations[expression]}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      className={`${sizes[size]} relative`}
    >
      <img 
        src={getShifuImage()} 
        alt={`Shifu ${expression}`}
        className={`${sizes[size]} object-contain rounded-lg shadow-lg`}
        style={{ imageRendering: 'pixelated' }}
      />
    </motion.div>
  );
};

export default function ShifuDailyGoal() {
  const [hasStartedSession, setHasStartedSession] = useState(false);
  const [showEncouragement, setShowEncouragement] = useState(false);
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  // Fetch today's daily goal
  const { data: goalData, isLoading, error } = useQuery<ShifuGoalResponse, Error>({
    queryKey: ['/api/shifu/daily-goal'],
    queryFn: () => apiRequest("GET", "/api/shifu/daily-goal").then(res => res.json()),
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Start session mutation
  const startSessionMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/shifu/start-session", {}),
    onSuccess: () => {
      setHasStartedSession(true);
      setShowEncouragement(true);
      queryClient.invalidateQueries({ queryKey: ['/api/shifu/logs'] });
      
      // Hide encouragement after 3 seconds
      setTimeout(() => setShowEncouragement(false), 3000);
    }
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'taekwondo': return <Sword className="h-5 w-5" />;
      case 'karate': return <Target className="h-5 w-5" />;
      case 'general': return <Zap className="h-5 w-5" />;
      default: return <Target className="h-5 w-5" />;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-400 bg-green-500/20';
      case 'intermediate': return 'text-yellow-400 bg-yellow-500/20';
      case 'advanced': return 'text-red-400 bg-red-500/20';
      default: return 'text-blue-400 bg-blue-500/20';
    }
  };

  const getNavigationPath = (goalText: string): string => {
    const goal = goalText.replace(/['"]/g, '').trim(); // Remove quotes and trim
    
    // Challenge routes
    if (goal === "Max Punches Challenge") return "/challenges/max-punches";
    if (goal === "Viper's Reflexes Challenge") return "/challenges/vipers-reflexes";
    if (goal === "Balance Beam Breaker Challenge") return "/challenges/balance-beam-breaker";
    if (goal === "Shifu Says Challenge") return "/challenges/shifu-says";
    
    // Practice moves - go to practice library and filter
    if (["Front Kick", "Side Kick", "Round Kick", "Back Kick", "Axe Kick", "Fighting Stance"].includes(goal)) {
      return `/practice?move=${encodeURIComponent(goal)}`;
    }
    
    // Forms - go to start live routine
    if (["Taegeuk Il Jang", "Taegeuk Ee Jang", "Heian Shodan", "Heian Nidan"].includes(goal)) {
      return `/start-live-routine?form=${encodeURIComponent(goal)}`;
    }
    
    // Default fallback
    return "/practice";
  };

  const handleStartSession = () => {
    if (goalData?.goal?.dailyGoal) {
      const path = getNavigationPath(goalData.goal.dailyGoal);
      startSessionMutation.mutate();
      
      // Navigate after a short delay to show the encouragement animation
      setTimeout(() => {
        setLocation(path);
      }, 1500);
    } else {
      startSessionMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.15 }}
        className="w-full max-w-lg mx-auto"
      >
        <Card className="bg-gradient-to-br from-red-900/30 to-red-950/20 border-red-600/30 backdrop-blur">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-20 h-20 bg-red-400/20 rounded-full animate-pulse"></div>
              <div className="flex-1">
                <div className="h-4 bg-red-400/20 rounded w-3/4 mb-2 animate-pulse"></div>
                <div className="h-6 bg-red-400/20 rounded animate-pulse"></div>
              </div>
            </div>
            <div className="animate-pulse space-y-3">
              <div className="h-8 bg-red-400/20 rounded"></div>
              <div className="h-4 bg-red-400/20 rounded w-1/2"></div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  if (error || !goalData) {
    return null; // Silently fail if Shifu service is unavailable
  }

  const { goal } = goalData;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ delay: 0.15 }}
      className="w-full max-w-lg mx-auto"
    >
      <Card className="bg-gradient-to-br from-red-900/30 to-red-950/20 border-red-600/30 backdrop-blur hover:border-red-500/50 transition-all duration-300 relative overflow-hidden">
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Header with Shifu Character */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <ShifuCharacter 
                  expression={hasStartedSession ? 'happy' : 'neutral'} 
                  size="large"
                />
                <div>
                  <h3 className="text-white font-bold text-lg">Shifu's Daily Goal</h3>
                  <p className="text-red-200 text-sm opacity-80">Master {goal.category} today</p>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(goal.difficulty)}`}>
                {goal.difficulty}
              </div>
            </div>

            {/* Goal Display */}
            <div className="bg-black/40 rounded-lg p-4 border border-red-600/20">
              <div className="flex items-center space-x-3 mb-3">
                {getCategoryIcon(goal.category)}
                <div className="flex-1">
                  <h4 className="text-white font-semibold text-lg">{goal.dailyGoal}</h4>
                  <p className="text-red-200 text-sm">Aim for {goal.targetAccuracy}% accuracy</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-red-400">{goal.targetAccuracy}%</div>
                  <div className="text-xs text-gray-400">target</div>
                </div>
              </div>
              
              {/* Reasoning with Shifu quote */}
              <div className="pt-3 border-t border-red-600/20">
                <p className="text-gray-300 text-sm italic">"{goal.reasoning}"</p>
              </div>
            </div>

            {/* Action Button */}
            <div className="flex space-x-3">
              {!hasStartedSession ? (
                <Button
                  onClick={handleStartSession}
                  disabled={startSessionMutation.isPending}
                  className="flex-1 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300 flex items-center justify-center space-x-2"
                >
                  {startSessionMutation.isPending ? (
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  ) : (
                    <>
                      <Play className="h-4 w-4" />
                      <span>Start Session</span>
                    </>
                  )}
                </Button>
              ) : (
                <div className="flex-1 bg-green-600/20 border border-green-500/30 text-green-400 font-semibold py-2 px-4 rounded-lg flex items-center justify-center space-x-2">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Session Started!</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>

        {/* Encouragement Animation */}
        {showEncouragement && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -20 }}
            className="absolute inset-0 bg-green-600/20 backdrop-blur-sm flex items-center justify-center rounded-lg"
          >
            <div className="text-center">
              <ShifuCharacter expression="happy" size="large" />
              <motion.p 
                className="text-green-300 font-semibold mt-2"
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 0.6, repeat: 3 }}
              >
                Great! Let's train! 🥋
              </motion.p>
            </div>
          </motion.div>
        )}
      </Card>
    </motion.div>
  );
} 