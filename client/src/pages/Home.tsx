import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import UserMenu from '@/components/UserMenu';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  Clock, 
  Plus, 
  Sparkles, 
  Star,
  User,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useCalendarEvents } from '@/hooks/use-calendar';
import runwayLogo from '/images/shifu_coacht.png';
import OceanWaves from '@/components/OceanWaves';
import { format, startOfWeek, addDays, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth } from 'date-fns';
import { supabase } from '@/lib/supabase';

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
  const [, navigate] = useLocation();
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

  // Get user photos from profile
  const [userPhotos, setUserPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loadingPhotos, setLoadingPhotos] = useState(false);

  // Load user photos when user is authenticated
  useEffect(() => {
    const loadUserPhotos = async () => {
      if (!user) return; // Don't load if user is not authenticated
      
      setLoadingPhotos(true);
      try {
        // Get auth token for the request
        const { data: { session } } = await supabase.auth.getSession();
        const authToken = session?.access_token;

        if (!authToken) {
          console.error('No auth token available for loading photos');
          return;
        }

        const response = await fetch('/api/user-profile', {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });

        if (response.ok) {
          const profile = await response.json();
          setUserPhotos(profile.galleryImages || []);
        } else {
          console.error('Failed to load user photos:', response.status, response.statusText);
        }
      } catch (error) {
        console.error('Failed to load user photos:', error);
      } finally {
        setLoadingPhotos(false);
      }
    };

    loadUserPhotos();
  }, [user]); // Depend on user authentication state

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || uploading) return;

    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      console.error('File too large. Maximum size is 10MB.');
      alert('File too large. Please select an image smaller than 10MB.');
      return;
    }

    // Check if user is authenticated
    if (!user) {
      console.error('User not authenticated');
      alert('Please log in to upload photos.');
      return;
    }

    setUploading(true);
    try {
      // Get the auth token from Supabase session
      const { data: { session } } = await supabase.auth.getSession();
      const authToken = session?.access_token;

      if (!authToken) {
        console.error('No auth token available');
        alert('Authentication error. Please try logging in again.');
        return;
      }

      const formData = new FormData();
      formData.append('photo', file);

      const response = await fetch('/api/upload-photo', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        // Add the new photo URL to the state and save to database
        const newPhotos = [...userPhotos, result.url];
        setUserPhotos(newPhotos);
        
        // Save updated photos to backend (also needs auth)
        const saveResponse = await fetch('/api/save-user-photos', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({ photos: newPhotos })
        });

        if (!saveResponse.ok) {
          console.error('Failed to save photos to profile');
          // Revert the local state if saving failed
          setUserPhotos(userPhotos);
          alert('Photo uploaded but failed to save to your profile. Please try again.');
        }
      } else {
        const errorData = await response.json();
        console.error('Failed to upload photo:', errorData.error || 'Unknown error');
        alert(`Failed to upload photo: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('An error occurred while uploading the photo. Please try again.');
    } finally {
      setUploading(false);
      // Clear the input so the same file can be uploaded again
      event.target.value = '';
    }
  };

  const handlePhotoDelete = async (photoUrl: string) => {
    if (!user) {
      alert('Please log in to delete photos.');
      return;
    }

    // Confirm deletion
    if (!confirm('Are you sure you want to delete this photo?')) {
      return;
    }

    try {
      // Get the auth token from Supabase session
      const { data: { session } } = await supabase.auth.getSession();
      const authToken = session?.access_token;

      if (!authToken) {
        alert('Authentication error. Please try logging in again.');
        return;
      }

      const response = await fetch('/api/delete-photo', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ photoUrl }),
      });

      if (response.ok) {
        // Remove the photo from local state
        setUserPhotos(userPhotos.filter(url => url !== photoUrl));
      } else {
        const errorData = await response.json();
        console.error('Failed to delete photo:', errorData.error || 'Unknown error');
        alert(`Failed to delete photo: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('An error occurred while deleting the photo. Please try again.');
    }
  };

  return (
    <div className="h-screen overflow-hidden" style={{ backgroundColor: '#FFC5D3' }}>
      {/* Top Welcome Banner */}
      <div className="bg-white/10 backdrop-blur-sm border-b border-white/20">
        <div className="flex items-center justify-between px-6 py-6">
          <h1 className="text-gray-800 text-lg font-light">
            Welcome back, {displayName}
          </h1>
          <UserMenu />
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 space-y-4 pt-6 h-full overflow-hidden flex flex-col">
        
        {/* 7-Day Engagement Tracker - Cal AI Style */}
        <div className="px-4 flex-shrink-0">
          <div className="flex justify-between items-center">
            {weeklyEngagement.map((day, index) => (
              <div key={index} className="flex flex-col items-center gap-1.5">
                <div 
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-200 ${
                    day.hasEngagement 
                      ? 'bg-green-500 text-white' 
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {format(day.date, 'd')}
                </div>
                <span className="text-xs text-gray-500 font-medium">
                  {day.day}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Coming Up Section */}
        <div className="space-y-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-gray-800 font-medium text-lg">Coming Up</h2>
            <button 
              onClick={() => navigate('/calendar')}
              className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors duration-200"
            >
              <Plus className="h-4 w-4 text-gray-600" />
            </button>
          </div>
          
          {upcomingEvents.length > 0 ? (
            upcomingEvents.map((event, index) => (
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
            ))
          ) : (
            <Card className="bg-white rounded-xl shadow-md border-0">
              <CardContent className="flex items-center justify-center p-8">
                <div className="text-center text-gray-500">
                  <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">No upcoming events</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Calendar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex-shrink-0"
        >
          <WeeklyCalendar />
        </motion.div>

        {/* Photo Upload Cluster */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex-shrink-0"
        >
          <div className="flex items-center justify-center">
            <div className="flex items-center">
              {/* Add Photo Button */}
              <label className="relative cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  disabled={uploading}
                />
                <div className="w-20 h-20 bg-white rounded-lg shadow-md border-2 border-dashed border-gray-300 flex items-center justify-center hover:border-pink-300 hover:bg-pink-50 transition-all duration-200 z-10 relative">
                  {uploading ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-400"></div>
                  ) : (
                    <Plus className="h-6 w-6 text-gray-400" />
                  )}
                </div>
              </label>
              
              {/* Photo Grid */}
              {loadingPhotos ? (
                <div className="w-20 h-20 bg-gray-100 rounded-lg shadow-md -ml-3 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                </div>
              ) : (
                userPhotos.map((photoUrl, index) => {
                  const rotations = ['-rotate-3', 'rotate-2', '-rotate-1', 'rotate-1', '-rotate-2'];
                  const rotation = rotations[index % rotations.length];
                  
                  return (
                    <motion.div
                      key={index}
                      className={`w-20 h-20 bg-gray-200 rounded-lg shadow-md ${rotation} -ml-3 relative group cursor-pointer`}
                      style={{
                        backgroundImage: `url(${photoUrl})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        zIndex: 20 + index
                      }}
                      whileHover={{ scale: 1.05, zIndex: 50 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      {/* Delete button overlay */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePhotoDelete(photoUrl);
                        }}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
                        title="Delete photo"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>
        </motion.div>

        {/* Ocean Waves Component - Visible and Contained */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-auto"
        >
          <OceanWaves />
        </motion.div>

      </div>
    </div>
  );
}