import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Calendar, Star, User, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday } from 'date-fns';
import UserMenu from '@/components/UserMenu';

// Mock upcoming events data
const upcomingEvents = [
  {
    id: 1,
    title: "Evening Gown Fitting",
    date: "Wednesday, Jul 23",
    type: "Prep",
    color: "bg-purple-500"
  },
  {
    id: 2,
    title: "Interview Practice Session", 
    date: "Saturday, Jul 19",
    type: "Practice",
    color: "bg-blue-500"
  },
  {
    id: 3,
    title: "Runway Routine Rehearsal",
    date: "Sunday, Jul 20", 
    type: "Routine",
    color: "bg-orange-500"
  }
];

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
                  aspect-square text-sm rounded-full transition-all duration-200 font-medium
                  ${isSelected 
                    ? 'bg-pink-500 text-white font-bold shadow-lg scale-110' 
                    : isCurrentMonth 
                      ? 'text-gray-700 hover:bg-pink-100 hover:scale-105' 
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
  const displayName = user?.email?.split('@')[0] || 'guest_user';

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FFC5D3' }}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 pt-12 bg-pink-700 shadow-lg">
        <div>
          <h1 className="text-white text-lg font-medium">
            Welcome back,
          </h1>
          <div className="flex items-center gap-2">
            <span className="text-white text-lg font-medium">{displayName}</span>
            <Star className="h-5 w-5 text-yellow-300 fill-current" />
          </div>
        </div>
        {user ? (
          <UserMenu />
        ) : (
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <User className="h-6 w-6 text-white" />
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="px-6 space-y-8">
        {/* Ready to Own the Runway - Centered and Bigger */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-8"
        >
          <h2 className="text-4xl font-bold text-gray-800 mb-2 leading-tight">
            Ready to Own the
          </h2>
          <h2 className="text-4xl font-bold text-gray-800">
            Runway, {displayName}?
          </h2>
        </motion.div>

        {/* Upcoming Events */}
        <div className="space-y-4">
          <h3 className="text-gray-800 font-bold text-xl">Coming Up</h3>
          {upcomingEvents.map((event, index) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="bg-white/95 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300 rounded-3xl border-0 hover:scale-[1.02]">
                <CardContent className="flex items-center justify-between p-6">
                  <div className="flex items-center gap-4">
                    <div className={`w-4 h-4 rounded-full ${event.color} shadow-lg`} />
                    <div>
                      <p className="font-bold text-gray-800 text-lg">{event.title}</p>
                      <p className="text-gray-600 font-medium">{event.date}</p>
                    </div>
                  </div>
                  <Badge 
                    variant="secondary" 
                    className={`${event.color} text-white border-0 px-4 py-2 rounded-full font-semibold shadow-md`}
                  >
                    {event.type}
                  </Badge>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Mini Calendar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <MiniCalendar />
        </motion.div>

        {/* Achievement Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="flex items-center justify-center pb-8"
        >
          <Card className="bg-gradient-to-r from-purple-500 to-pink-500 shadow-xl rounded-3xl border-0">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-3xl">🔥</span>
              </div>
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