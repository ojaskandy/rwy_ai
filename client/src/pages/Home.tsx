import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Calendar, Star, User, ChevronLeft, ChevronRight, Plus, Camera, Mic, Shirt, Crown, Sparkles, Play } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday } from 'date-fns';
import { useLocation } from 'wouter';
import { useCalendarEvents } from '@/hooks/use-calendar';
import UserMenu from '@/components/UserMenu';
import runwayLogo from "@assets/runwayailogo_1753229923969.png";

// Event type to color mapping
const EVENT_TYPE_COLORS: Record<string, string> = {
  pageant: "bg-pink-500",
  interview: "bg-blue-500", 
  fitting: "bg-purple-500",
  routine: "bg-orange-500",
  photo: "bg-green-500",
  meeting: "bg-gray-500",
  deadline: "bg-red-500",
  personal: "bg-indigo-500"
};

function MiniCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(22); // July 22 is highlighted in mockup

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  return (
    <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-3xl border-0">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <button onClick={previousMonth} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ChevronLeft className="h-5 w-5 text-gray-600" />
          </button>
          <h3 className="font-bold text-gray-800 text-lg">
            {format(currentDate, 'MMMM yyyy')}
          </h3>
          <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ChevronRight className="h-5 w-5 text-gray-600" />
          </button>
        </div>
        
        <div className="grid grid-cols-7 gap-2 mb-3">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-xs font-semibold text-gray-500 py-2">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-2">
          {days.map((day: Date, index: number) => {
            const dayNumber = format(day, 'd');
            const isSelected = parseInt(dayNumber) === selectedDate;
            const isCurrentMonth = isSameMonth(day, currentDate);
            
            return (
              <button
                key={index}
                onClick={() => setSelectedDate(parseInt(dayNumber))}
                className={`
                  aspect-square text-sm rounded-full transition-all duration-200 font-medium relative
                  ${isSelected 
                    ? 'bg-pink-500 text-white font-bold shadow-lg scale-110 shadow-pink-500/30' 
                    : isCurrentMonth 
                      ? 'text-gray-700 hover:bg-pink-100 hover:scale-105 hover:ring-2 hover:ring-pink-300/50' 
                      : 'text-gray-300'
                  }
                `}
              >
                {dayNumber}
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Home() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { events, isLoading } = useCalendarEvents();
  const displayName = user?.email?.split('@')[0] || 'guest_user';

  // Get upcoming events (next 3 events from today)
  const today = new Date();
  const upcomingEvents = events
    .filter(event => event.date >= today)
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 3)
    .map(event => ({
      id: event.id,
      title: event.title,
      date: event.date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }),
      type: event.type.charAt(0).toUpperCase() + event.type.slice(1),
      color: EVENT_TYPE_COLORS[event.type] || EVENT_TYPE_COLORS.personal
    }));

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FFC5D3' }}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 pt-12 bg-white/10 backdrop-blur-sm border-b border-white/20 shadow-lg relative">
        <div className="flex items-center gap-3">
          <img src={runwayLogo} alt="Runway AI" className="h-8 w-8" />
          <div>
            <h1 className="text-gray-800 text-lg font-medium">
              Welcome back, {displayName} ✨
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center gap-1 bg-gradient-to-r from-yellow-400 to-amber-500 text-white px-3 py-1 rounded-full text-sm font-semibold shadow-lg">
                <Crown className="h-4 w-4" />
                Queen Mode: ON
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <motion.div
            animate={{ 
              rotate: [0, 15, -15, 0],
              scale: [1, 1.1, 1, 1]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              repeatDelay: 3
            }}
          >
            <Sparkles className="h-6 w-6 text-pink-600" />
          </motion.div>
          {user ? (
            <UserMenu />
          ) : (
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <User className="h-6 w-6 text-gray-600" />
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 space-y-8">
        {/* Hero Headline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-8"
        >
          <p className="text-lg text-gray-600 uppercase tracking-wider font-light mb-2">
            Ready to
          </p>
          <h2 className="text-5xl font-bold text-gray-900 mb-2 leading-tight font-serif">
            OWN THE RUNWAY
          </h2>
          <p className="text-2xl text-pink-600 italic font-light">
            {displayName}?
          </p>
        </motion.div>

        {/* Upcoming Events */}
        <div className="space-y-4">
          <h3 className="text-gray-800 font-bold text-xl">Coming Up</h3>
          {upcomingEvents.length > 0 ? (
            upcomingEvents.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-white/80 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300 rounded-3xl border-0 hover:scale-[1.02] ring-1 ring-pink-300/20">
                  <CardContent className="flex items-center justify-between p-6">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-12 h-12 bg-pink-100 rounded-full">
                        {event.title.toLowerCase().includes('photo') ? (
                          <Camera className="h-6 w-6 text-pink-600" />
                        ) : event.title.toLowerCase().includes('interview') ? (
                          <Mic className="h-6 w-6 text-pink-600" />
                        ) : event.title.toLowerCase().includes('fitting') || event.title.toLowerCase().includes('dress') ? (
                          <Shirt className="h-6 w-6 text-pink-600" />
                        ) : (
                          <Calendar className="h-6 w-6 text-pink-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-gray-800 text-lg">{event.title}</p>
                        <p className="text-gray-600 font-medium">{event.date}</p>
                      </div>
                    </div>
                    <Button className="bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 hover:shadow-pink-500/25">
                      Practice Now →
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-8"
            >
              <Card className="bg-white/95 backdrop-blur-sm shadow-xl rounded-3xl border-0">
                <CardContent className="p-8">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">No upcoming events scheduled</p>
                  <Button 
                    onClick={() => navigate('/calendar')}
                    className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold px-6 py-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First Event
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>

        {/* Mini Calendar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <MiniCalendar />
        </motion.div>

        {/* Daily Practice Pick */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="bg-white/80 backdrop-blur-sm shadow-xl rounded-3xl border-0 ring-1 ring-pink-300/20 hover:scale-[1.02] transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <Play className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-gray-800 font-bold text-lg">Today's Practice Pick</h3>
                    <p className="text-gray-600 font-medium">Turn & Pose – Precision Drill (Level 2)</p>
                  </div>
                </div>
                <motion.div
                  whileHover={{ y: -2 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Button className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 hover:shadow-purple-500/25">
                    Start Practice →
                  </Button>
                </motion.div>
              </div>
              {/* Shimmer effect */}
              <div className="mt-4 h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 rounded-full opacity-60 animate-pulse"></div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Achievement Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
          className="flex items-center justify-center pb-8"
        >
          <Card className="bg-gradient-to-r from-purple-500 to-pink-500 shadow-xl rounded-3xl border-0 hover:scale-105 transition-all duration-300">
            <CardContent className="flex items-center gap-4 p-6">
              <motion.div 
                className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center"
                animate={{ 
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 3
                }}
              >
                <span className="text-3xl">🔥</span>
              </motion.div>
              <div>
                <p className="text-white font-bold text-lg">Day 3 in a row</p>
                <p className="text-white/90 font-medium">Keep owning that catwalk! ⚡</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}