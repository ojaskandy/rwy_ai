import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Calendar, ChevronLeft, ChevronRight, Plus, Camera, Mic, Shirt, User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { format, startOfWeek, addDays, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth } from 'date-fns';
import { useLocation } from 'wouter';
import { useCalendarEvents } from '@/hooks/use-calendar';
import UserMenu from '@/components/UserMenu';

// Event type to color mapping - subtle dots for calendar
const EVENT_TYPE_COLORS: Record<string, string> = {
  pageant: "bg-pink-400",
  interview: "bg-blue-400", 
  fitting: "bg-purple-400",
  routine: "bg-orange-400",
  photo: "bg-green-400",
  meeting: "bg-gray-400",
  deadline: "bg-red-400",
  personal: "bg-indigo-400"
};

// Get engagement data for the week (mock data)
const getWeeklyEngagement = () => {
  const today = new Date();
  const startOfCurrentWeek = startOfWeek(today, { weekStartsOn: 1 }); // Monday start
  
  return Array.from({ length: 7 }, (_, i) => {
    const date = addDays(startOfCurrentWeek, i);
    const dayInitial = format(date, 'E').charAt(0); // M, T, W, T, F, S, S
    const isToday = isSameDay(date, today);
    const hasEngagement = Math.random() > 0.3; // Mock engagement data
    
    return {
      day: dayInitial,
      date,
      isToday,
      hasEngagement
    };
  });
};

function WeeklyCalendar() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { events } = useCalendarEvents();
  
  const today = new Date();
  const startOfCurrentWeek = startOfWeek(selectedDate, { weekStartsOn: 0 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(startOfCurrentWeek, i));

  return (
    <div className="bg-white rounded-xl shadow-md p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-gray-800 font-medium">
          {format(selectedDate, 'MMMM yyyy')}
        </h3>
        <div className="flex gap-2">
          <button 
            onClick={() => setSelectedDate(addDays(selectedDate, -7))}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <ChevronLeft className="h-4 w-4 text-gray-600" />
          </button>
          <button 
            onClick={() => setSelectedDate(addDays(selectedDate, 7))}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <ChevronRight className="h-4 w-4 text-gray-600" />
          </button>
        </div>
      </div>
      
      <div className="flex gap-3 overflow-x-auto pb-2">
        {weekDays.map((day, index) => {
          const hasEvent = events.some(event => isSameDay(event.date, day));
          const isToday = isSameDay(day, today);
          const isSelected = isSameDay(day, selectedDate);
          
          return (
            <button
              key={index}
              onClick={() => setSelectedDate(day)}
              className={`
                flex-shrink-0 flex flex-col items-center gap-2 p-3 rounded-lg transition-all duration-200
                ${isSelected 
                  ? 'ring-2 ring-pink-400 bg-pink-50' 
                  : 'hover:bg-gray-50'
                }
              `}
            >
              <span className="text-xs text-gray-500 font-medium uppercase">
                {format(day, 'EEE')}
              </span>
              <div className="relative">
                <span className={`text-sm font-medium ${isToday ? 'text-pink-600' : 'text-gray-700'}`}>
                  {format(day, 'd')}
                </span>
                {hasEvent && (
                  <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
                    <div className="w-1.5 h-1.5 bg-pink-400 rounded-full"></div>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function Home() {
  const { user } = useAuth();
  const { events, isLoading } = useCalendarEvents();
  const displayName = user?.email?.split('@')[0] || 'okandy';
  const weeklyEngagement = getWeeklyEngagement();

  // Get upcoming events (next 3 events from today)
  const today = new Date();
  const upcomingEvents = events
    .filter(event => event.date >= today)
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 3)
    .map(event => ({
      id: event.id,
      title: event.title,
      date: event.date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
      type: event.type,
      icon: event.title.toLowerCase().includes('photo') ? '📸' :
            event.title.toLowerCase().includes('interview') ? '🎤' :
            event.title.toLowerCase().includes('fitting') || event.title.toLowerCase().includes('dress') ? '👗' : '📅'
    }));

  // Mock photo data
  const userPhotos = [
    { id: 1, url: 'https://via.placeholder.com/80x80/FFB6C1/FFFFFF?text=1', rotation: '-rotate-2' },
    { id: 2, url: 'https://via.placeholder.com/80x80/FFB6C1/FFFFFF?text=2', rotation: 'rotate-1' },
    { id: 3, url: 'https://via.placeholder.com/80x80/FFB6C1/FFFFFF?text=3', rotation: '-rotate-1' },
    { id: 4, url: 'https://via.placeholder.com/80x80/FFB6C1/FFFFFF?text=4', rotation: 'rotate-2' },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FFC5D3' }}>
      {/* Top Welcome Banner */}
      <div className="bg-white/10 backdrop-blur-sm border-b border-white/20">
        <div className="flex items-center justify-between px-6 py-6">
          <h1 className="text-gray-800 text-lg font-light">
            Welcome back, {displayName}
          </h1>
          <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
            <User className="h-5 w-5 text-gray-600" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 space-y-6 pt-6">
        
        {/* 7-Day Engagement Tracker */}
        <div className="flex justify-center">
          <div className="flex gap-4">
            {weeklyEngagement.map((day, index) => (
              <motion.div
                key={index}
                className="flex flex-col items-center gap-2"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <motion.div
                  className={`w-3 h-3 rounded-full transition-all duration-200 ${
                    day.hasEngagement 
                      ? 'bg-pink-400 shadow-sm' 
                      : 'border border-pink-300 bg-transparent'
                  }`}
                  animate={day.isToday ? {
                    scale: [1, 1.2, 1],
                    opacity: [1, 0.7, 1]
                  } : {}}
                  transition={day.isToday ? {
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 3
                  } : {}}
                />
                <span className="text-xs text-gray-500 font-light">
                  {day.day}
                </span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Coming Up Section */}
        {upcomingEvents.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-gray-800 font-medium text-lg">Coming Up</h2>
            {upcomingEvents.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-white rounded-xl shadow-md border-0">
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="text-2xl">
                      {event.icon}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{event.title}</p>
                      <p className="text-sm text-gray-600">{event.date}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Calendar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <WeeklyCalendar />
        </motion.div>

        {/* Photo Upload Cluster */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="pb-24"
        >
          <div className="flex items-center gap-3 justify-center">
            {/* Add Photo Button */}
            <button className="w-20 h-20 bg-white rounded-lg shadow-md border-2 border-dashed border-gray-300 flex items-center justify-center hover:border-pink-300 hover:bg-pink-50 transition-all duration-200">
              <Plus className="h-6 w-6 text-gray-400" />
            </button>
            
            {/* Photo Grid */}
            {userPhotos.map((photo, index) => (
              <motion.div
                key={photo.id}
                className={`w-20 h-20 bg-gray-200 rounded-lg shadow-md ${photo.rotation} ${index > 0 ? '-ml-2' : ''}`}
                style={{
                  backgroundImage: `url(${photo.url})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  zIndex: userPhotos.length - index
                }}
                whileHover={{ scale: 1.05, zIndex: 10 }}
                transition={{ type: "spring", stiffness: 300 }}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}