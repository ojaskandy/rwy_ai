import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sword, TrendingUp, Calendar, Target, CheckCircle2, XCircle, Flame, BarChart3, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface ShifuLogEntry {
  id: number;
  userId: number;
  date: string;
  dailyGoal: string;
  goalCategory: string;
  targetAccuracy: number;
  completed: boolean;
  actualAccuracy: number | null;
  sessionStarted: boolean;
  currentStreak: number;
}

interface ShifuLogStats {
  completionRate: number;
  averageAccuracy: number;
  currentStreak: number;
  sessionsStarted: number;
}

// Visual Shifu Character Component for Log
const ShifuLogCharacter = ({ 
  expression, 
  size = 'medium',
  message = '',
  showMessage = false 
}: { 
  expression: 'happy' | 'neutral' | 'encouraging' | 'celebrating' | 'thinking',
  size?: 'small' | 'medium' | 'large',
  message?: string,
  showMessage?: boolean
}) => {
  const getShifuImage = () => {
    const images = {
      happy: '/images/shifuhappy_ct.png',
      neutral: '/images/shifu_coacht.png',
      encouraging: '/images/shifuhappy_ct.png',
      celebrating: '/images/shifuhappy_ct.png',
      thinking: '/images/shifu_coacht.png'
    };
    return images[expression];
  };

  const sizes = {
    small: 'w-8 h-8',
    medium: 'w-12 h-12', 
    large: 'w-16 h-16'
  };

  const animations = {
    happy: { y: [0, -3, 0] },
    neutral: {},
    encouraging: { rotate: [0, 5, -5, 0] },
    celebrating: { scale: [1, 1.1, 1], rotate: [0, 10, -10, 0] },
    thinking: { y: [0, -2, 0] }
  };

  return (
    <div className="relative">
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
      
      {showMessage && message && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-white rounded-lg shadow-lg p-2 text-xs text-gray-800 whitespace-nowrap"
        >
          {message}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-4 border-t-white border-l-transparent border-r-transparent border-b-transparent"></div>
        </motion.div>
      )}
    </div>
  );
};

export default function ShifuLog() {
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'all'>('week');
  const [showShifuFeedback, setShowShifuFeedback] = useState<boolean>(false);

  // Fetch Shifu logs
  const { data: logs = [], isLoading: isLoadingLogs } = useQuery<ShifuLogEntry[], Error>({
    queryKey: ['/api/shifu/logs', selectedPeriod],
    queryFn: () => apiRequest("GET", `/api/shifu/logs?period=${selectedPeriod}`).then(res => res.json()),
    refetchOnWindowFocus: false,
  });

  // Calculate stats
  const stats: ShifuLogStats = React.useMemo(() => {
    if (!logs.length) return { completionRate: 0, averageAccuracy: 0, currentStreak: 0, sessionsStarted: 0 };
    
    const completed = logs.filter(log => log.completed).length;
    const sessionsStarted = logs.filter(log => log.sessionStarted).length;
    const accuracyValues = logs.filter(log => log.actualAccuracy !== null).map(log => log.actualAccuracy!);
    
    // Calculate current streak
    let currentStreak = 0;
    for (let i = logs.length - 1; i >= 0; i--) {
      if (logs[i].completed) {
        currentStreak++;
      } else {
        break;
      }
    }
    
    return {
      completionRate: logs.length ? Math.round((completed / logs.length) * 100) : 0,
      averageAccuracy: accuracyValues.length ? Math.round(accuracyValues.reduce((a, b) => a + b, 0) / accuracyValues.length) : 0,
      currentStreak,
      sessionsStarted
    };
  }, [logs]);

  // Show Shifu feedback based on performance
  useEffect(() => {
    if (stats.completionRate > 0) {
      const timer = setTimeout(() => setShowShifuFeedback(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [stats]);

  const getShifuFeedbackMessage = () => {
    if (stats.completionRate >= 80) {
      return "Outstanding dedication! You're becoming a true martial artist! 🥋";
    } else if (stats.completionRate >= 60) {
      return "Good progress! Keep up the consistent training! 💪";
    } else if (stats.completionRate >= 40) {
      return "You're improving! Remember, consistency is key in martial arts! 🎯";
    } else {
      return "Every master was once a beginner. Keep practicing! 🌱";
    }
  };

  const getShifuExpression = () => {
    if (stats.completionRate >= 80) return 'celebrating';
    if (stats.completionRate >= 60) return 'happy';
    if (stats.completionRate >= 40) return 'encouraging';
    return 'thinking';
  };

  // Generate weekly accuracy data for chart
  const weeklyData = React.useMemo(() => {
    const today = new Date();
    const weekData = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayLogs = logs.filter(log => log.date.startsWith(dateStr) && log.actualAccuracy !== null);
      const avgAccuracy = dayLogs.length 
        ? dayLogs.reduce((sum, log) => sum + (log.actualAccuracy || 0), 0) / dayLogs.length 
        : 0;
      
      weekData.push({
        day: date.toLocaleDateString('en', { weekday: 'short' }),
        accuracy: Math.round(avgAccuracy),
        date: dateStr
      });
    }
    
    return weekData;
  }, [logs]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'taekwondo': return <Sword className="h-4 w-4 text-red-400" />;
      case 'karate': return <Target className="h-4 w-4 text-blue-400" />;
      case 'general': return <TrendingUp className="h-4 w-4 text-green-400" />;
      default: return <Target className="h-4 w-4 text-gray-400" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      weekday: 'short'
    });
  };



  const generateWeeklyChart = () => {
    const weekLogs = logs.slice(0, 7);
    const maxAccuracy = 100;
    
    return weekLogs.reverse().map((log, index) => {
      const accuracy = log.actualAccuracy || 0;
      const height = (accuracy / maxAccuracy) * 100;
      
      return (
        <div key={log.id} className="flex flex-col items-center space-y-2">
          <div className="h-32 flex items-end">
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${height}%` }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className={`w-8 rounded-t ${
                accuracy >= 90 ? 'bg-green-500' :
                accuracy >= 75 ? 'bg-yellow-500' :
                accuracy >= 60 ? 'bg-orange-500' :
                'bg-red-500'
              } min-h-[4px]`}
              title={`${accuracy}% accuracy`}
            />
          </div>
          <div className="text-xs text-gray-400">{formatDate(log.date).split(' ')[1]}</div>
        </div>
      );
    });
  };

  if (isLoadingLogs) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 bg-red-400/20 rounded-full animate-pulse"></div>
          <div>
            <div className="h-6 bg-red-400/20 rounded w-32 mb-2 animate-pulse"></div>
            <div className="h-4 bg-red-400/20 rounded w-48 animate-pulse"></div>
          </div>
        </div>
        {[1, 2, 3].map(i => (
          <Card key={i} className="bg-gradient-to-br from-red-900/20 to-red-950/10 border-red-600/20 animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-red-400/20 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-red-400/20 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header with Shifu */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <ShifuLogCharacter 
            expression={getShifuExpression()} 
            size="large"
            message={showShifuFeedback ? getShifuFeedbackMessage() : ''}
            showMessage={showShifuFeedback}
          />
          <div>
            <h2 className="text-2xl font-bold text-white">Shifu's Training Log</h2>
            <p className="text-red-200 opacity-80">Track your martial arts journey</p>
          </div>
        </div>
        
        {/* Period Selector */}
        <div className="flex space-x-2">
          {(['week', 'month', 'all'] as const).map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${
                selectedPeriod === period
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="bg-gradient-to-br from-green-900/30 to-green-950/20 border-green-600/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-200 text-sm">Completion Rate</p>
                <div className="flex items-center space-x-2">
                                     <p className="text-2xl font-bold text-green-400">{stats.completionRate}%</p>
                  <ShifuLogCharacter expression="happy" size="small" />
                </div>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-900/30 to-blue-950/20 border-blue-600/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-200 text-sm">Average Accuracy</p>
                <div className="flex items-center space-x-2">
                  <p className="text-2xl font-bold text-blue-400">{stats.averageAccuracy}%</p>
                  <ShifuLogCharacter expression="encouraging" size="small" />
                </div>
              </div>
              <Target className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-900/30 to-orange-950/20 border-orange-600/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-200 text-sm">Current Streak</p>
                <div className="flex items-center space-x-2">
                  <p className="text-2xl font-bold text-orange-400">{stats.currentStreak}</p>
                  <ShifuLogCharacter expression="celebrating" size="small" />
                </div>
              </div>
              <Flame className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-900/30 to-purple-950/20 border-purple-600/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-200 text-sm">Sessions Started</p>
                <div className="flex items-center space-x-2">
                  <p className="text-2xl font-bold text-purple-400">{stats.sessionsStarted}</p>
                  <ShifuLogCharacter expression="neutral" size="small" />
                </div>
              </div>
              <Clock className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Accuracy Chart */}
      <Card className="bg-gradient-to-br from-red-900/20 to-red-950/10 border-red-600/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-red-400" />
            <span>Weekly Accuracy Trends</span>
            <ShifuLogCharacter expression="thinking" size="small" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-end justify-between space-x-2">
            {weeklyData.map((day, index) => (
              <motion.div
                key={day.date}
                initial={{ height: 0 }}
                animate={{ height: `${(day.accuracy / 100) * 200}px` }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="flex-1 bg-gradient-to-t from-red-600 to-red-400 rounded-t-lg min-h-[20px] relative group"
                style={{ height: `${Math.max((day.accuracy / 100) * 200, 20)}px` }}
              >
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                  {day.accuracy}%
                </div>
                <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-gray-400 text-xs">
                  {day.day}
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Goals */}
      <Card className="bg-gradient-to-br from-red-900/20 to-red-950/10 border-red-600/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-red-400" />
            <span>Recent Training Goals</span>
            <ShifuLogCharacter expression="neutral" size="small" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length > 0 ? (
            <div className="space-y-3">
              {logs.slice(0, 10).map((log, index) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    log.completed 
                      ? 'bg-green-900/20 border-green-600/30' 
                      : log.sessionStarted
                      ? 'bg-yellow-900/20 border-yellow-600/30'
                      : 'bg-gray-900/20 border-gray-600/30'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <ShifuLogCharacter 
                      expression={log.completed ? 'happy' : log.sessionStarted ? 'encouraging' : 'neutral'} 
                      size="small"
                    />
                    <div>
                      <p className="text-white font-medium">{log.dailyGoal}</p>
                      <p className="text-gray-400 text-sm">{new Date(log.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {log.actualAccuracy !== null && (
                      <span className={`text-sm px-2 py-1 rounded ${
                        log.actualAccuracy >= 80 ? 'bg-green-600/20 text-green-400' :
                        log.actualAccuracy >= 60 ? 'bg-yellow-600/20 text-yellow-400' :
                        'bg-red-600/20 text-red-400'
                      }`}>
                        {log.actualAccuracy}%
                      </span>
                    )}
                    <div className={`w-3 h-3 rounded-full ${
                      log.completed ? 'bg-green-500' :
                      log.sessionStarted ? 'bg-yellow-500' :
                      'bg-gray-500'
                    }`}></div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <ShifuLogCharacter expression="thinking" size="large" />
              <p className="text-gray-400 mt-4">No training history yet</p>
              <p className="text-gray-500 text-sm">Complete your first daily goal to see it here!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
} 