import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar as CalendarIcon, Plus, Edit, Trash2, Bell, Clock,
  ChevronLeft, ChevronRight, MapPin, User, Crown, Award,
  X, Check, AlertCircle, Star, Palette, Loader2, Sparkles
} from 'lucide-react';
import { useLocation } from 'wouter';
import { useCalendarEvents } from '@/hooks/use-calendar';

// Event types with colors
const EVENT_TYPES = [
  { id: 'pageant', name: 'Pageant', color: 'bg-pink-500', textColor: 'text-pink-100' },
  { id: 'interview', name: 'Interview', color: 'bg-blue-500', textColor: 'text-blue-100' },
  { id: 'fitting', name: 'Dress Fitting', color: 'bg-purple-500', textColor: 'text-purple-100' },
  { id: 'routine', name: 'Routine Practice', color: 'bg-green-500', textColor: 'text-green-100' },
  { id: 'photo', name: 'Photo Shoot', color: 'bg-orange-500', textColor: 'text-orange-100' },
  { id: 'meeting', name: 'Meeting', color: 'bg-gray-500', textColor: 'text-gray-100' },
  { id: 'deadline', name: 'Deadline', color: 'bg-red-500', textColor: 'text-red-100' },
  { id: 'personal', name: 'Personal', color: 'bg-indigo-500', textColor: 'text-indigo-100' }
];

const REMINDER_OPTIONS = [
  { value: 15, label: '15 minutes before' },
  { value: 60, label: '1 hour before' },
  { value: 1440, label: '1 day before' },
  { value: 10080, label: '1 week before' }
];

// Interface for the component (matches the hook's CalendarEvent interface)
interface CalendarEvent {
  id: number;
  userId: string; // Updated to string for UUID
  title: string;
  description: string;
  date: Date;
  time: string;
  type: string;
  location?: string;
  reminder: number;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export default function PageantCalendar() {
  const [, navigate] = useLocation();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [aiDescription, setAiDescription] = useState('');
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  
  // Use the calendar events hook
  const { 
    events, 
    isLoading, 
    createEvent, 
    updateEvent, 
    deleteEvent,
    isCreating,
    isUpdating,
    isDeleting
  } = useCalendarEvents();
  
  // Form states
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    type: 'pageant',
    location: '',
    reminder: 60
  });

  // Get events for a specific date
  const getEventsForDate = (date: Date) => {
    return events.filter(event => 
      event.date.toDateString() === date.toDateString()
    ).sort((a, b) => a.time.localeCompare(b.time));
  };

  // Generate calendar days
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const current = new Date(startDate);
    
    while (current <= lastDay || current.getDay() !== 0) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  };

  const calendarDays = generateCalendarDays();
  const today = new Date();

  // Navigation
  const previousMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  // Date utilities
  const formatMonth = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const isSameDay = (date1: Date, date2: Date) => {
    return date1.toDateString() === date2.toDateString();
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth() && date.getFullYear() === currentDate.getFullYear();
  };

  // Event handlers
  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
  };

  const handleAddEvent = () => {
    setEditingEvent(null);
    setFormData({
      title: '',
      description: '',
      date: selectedDate ? selectedDate.toISOString().split('T')[0] : '',
      time: '',
      type: 'pageant',
      location: '',
      reminder: 60
    });
    setAiDescription('');
    setShowEventModal(true);
  };

  const processAIDescription = async () => {
    if (!aiDescription.trim()) return;
    
    setIsProcessingAI(true);
    try {
      const response = await fetch('/api/ai/parse-event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          description: aiDescription
        })
      });

      if (!response.ok) {
        throw new Error('Failed to process event description');
      }

      const result = await response.json();
      
      // Pre-fill the form with AI-parsed data
      setFormData({
        title: result.title || '',
        description: result.description || aiDescription,
        date: result.date || formData.date,
        time: result.time || '',
        type: result.type || 'pageant',
        location: result.location || '',
        reminder: result.reminder || 60
      });

    } catch (error) {
      console.error('Error processing AI description:', error);
      // Fallback: still update the description field
      setFormData(prev => ({
        ...prev,
        description: aiDescription
      }));
    } finally {
      setIsProcessingAI(false);
    }
  };

  const handleEditEvent = (event: CalendarEvent) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description,
      date: event.date.toISOString().split('T')[0],
      time: event.time,
      type: event.type,
      location: event.location || '',
      reminder: event.reminder
    });
    setAiDescription('');
    setShowEventModal(true);
  };

  const handleDeleteEvent = async (eventId: number) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      await deleteEvent(eventId);
    }
  };

  const handleSaveEvent = async () => {
    try {
      const eventData = {
        title: formData.title,
        description: formData.description,
        date: formData.date, // Keep as string for the API
        time: formData.time,
        type: formData.type,
        location: formData.location,
        reminder: formData.reminder
      };

      if (editingEvent) {
        await updateEvent({ id: editingEvent.id, ...eventData });
      } else {
        await createEvent(eventData);
      }
      
      setShowEventModal(false);
      setEditingEvent(null);
    } catch (error) {
      console.error('Error saving event:', error);
    }
  };

  const getEventTypeInfo = (type: string) => {
    return EVENT_TYPES.find(t => t.id === type) || EVENT_TYPES[0];
  };

  if (isLoading) {
    return (
      <div className="min-h-screen p-3 flex items-center justify-center" style={{ backgroundColor: '#FFC5D3' }}>
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-600" />
          <p className="text-gray-700">Loading calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FFC5D3' }}>
      {/* Header */}
      <div className="w-full bg-gradient-to-r from-indigo-800 to-purple-800 h-16 px-4 shadow-lg flex items-center">
        <button 
          onClick={() => navigate('/')} 
          className="flex items-center text-white hover:text-indigo-200 font-semibold transition-colors"
        >
          <ChevronLeft className="w-5 h-5 mr-2" /> Back to Home
        </button>
        <div className="flex-1 flex justify-center">
          <span className="text-indigo-200 font-bold text-xl">Pageant Calendar</span>
        </div>
        <Button
          onClick={handleAddEvent}
          size="sm"
          className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700"
        >
          <Plus className="w-4 h-4 mr-1" />
          <span className="hidden sm:inline">Add Event</span>
        </Button>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Calendar Section */}
          <div className="lg:col-span-3">
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-gray-800 flex items-center">
                    <CalendarIcon className="w-5 h-5 mr-2 text-pink-600" />
                    {formatMonth(currentDate)}
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={previousMonth}
                      variant="outline"
                      size="sm"
                      className="border-pink-200 text-pink-600 hover:bg-pink-50"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={nextMonth}
                      variant="outline"
                      size="sm"
                      className="border-pink-200 text-pink-600 hover:bg-pink-50"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1 mb-4">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-center text-sm font-semibold text-gray-700 p-2">
                      {day}
                    </div>
                  ))}
                </div>
                
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((date, index) => {
                    const dayEvents = getEventsForDate(date);
                    const isToday = isSameDay(date, today);
                    const isSelected = selectedDate && isSameDay(date, selectedDate);
                    const isCurrentMonthDay = isCurrentMonth(date);
                    
                    return (
                      <motion.div
                        key={index}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleDateClick(date)}
                        className={`
                          relative p-2 h-20 cursor-pointer rounded-lg border transition-all duration-200
                          ${isSelected 
                            ? 'bg-pink-100 border-pink-400' 
                            : isToday 
                              ? 'bg-purple-100 border-purple-400' 
                              : 'border-gray-200 hover:border-pink-300 hover:bg-pink-50'
                          }
                          ${!isCurrentMonthDay && 'opacity-40'}
                        `}
                      >
                        <div className={`text-sm font-medium ${
                          isToday ? 'text-purple-700' : 
                          isSelected ? 'text-pink-700' : 
                          isCurrentMonthDay ? 'text-gray-700' : 'text-gray-400'
                        }`}>
                          {date.getDate()}
                        </div>
                        
                        {/* Event indicators */}
                        <div className="absolute bottom-1 left-1 right-1 space-y-0.5">
                          {dayEvents.slice(0, 2).map((event, eventIndex) => {
                            const typeInfo = getEventTypeInfo(event.type);
                            return (
                              <div
                                key={eventIndex}
                                className={`h-1 rounded-full ${typeInfo.color} opacity-80`}
                                title={event.title}
                              />
                            );
                          })}
                          {dayEvents.length > 2 && (
                            <div className="text-xs text-gray-500 text-center">
                              +{dayEvents.length - 2} more
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Event Type Legend */}
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
              <CardHeader>
                <CardTitle className="text-gray-800 text-sm">Event Types</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {EVENT_TYPES.map((type) => (
                    <div key={type.id} className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${type.color}`} />
                      <span className="text-xs text-gray-600">{type.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar for selected date events */}
          {selectedDate && (
            <div className="lg:col-span-1">
              <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-gray-800 text-sm">
                    Events for {selectedDate.toLocaleDateString()}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {getEventsForDate(selectedDate).length === 0 ? (
                    <p className="text-gray-500 text-sm">No events scheduled</p>
                  ) : (
                    <div className="space-y-3">
                      {getEventsForDate(selectedDate).map((event) => {
                        const typeInfo = getEventTypeInfo(event.type);
                        return (
                          <div key={event.id} className="border border-gray-200 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <Badge className={`${typeInfo.color} ${typeInfo.textColor} text-xs`}>
                                {typeInfo.name}
                              </Badge>
                              <div className="flex gap-1">
                                <button
                                  onClick={() => handleEditEvent(event)}
                                  className="text-gray-400 hover:text-pink-600"
                                >
                                  <Edit className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => handleDeleteEvent(event.id)}
                                  className="text-gray-400 hover:text-red-600"
                                  disabled={isDeleting}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                            <h4 className="font-medium text-gray-800 text-sm">{event.title}</h4>
                            <p className="text-xs text-gray-600 flex items-center mt-1">
                              <Clock className="w-3 h-3 mr-1" />
                              {event.time}
                            </p>
                            {event.location && (
                              <p className="text-xs text-gray-600 flex items-center mt-1">
                                <MapPin className="w-3 h-3 mr-1" />
                                {event.location}
                              </p>
                            )}
                            {event.description && (
                              <p className="text-xs text-gray-500 mt-2">{event.description}</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Event Modal */}
      <AnimatePresence>
        {showEventModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
              style={{ backgroundColor: '#FFC5D3' }}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-800">
                  {editingEvent ? 'Edit Event' : 'Add New Event'}
                </h3>
                <button 
                  onClick={() => setShowEventModal(false)}
                  className="text-gray-600 hover:text-gray-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title" className="text-sm font-medium text-gray-700">
                    Event Title
                  </Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="bg-white/80 border-pink-200 text-gray-800 mt-1"
                    placeholder="Enter event title"
                  />
                </div>

                <div>
                  <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="bg-white/80 border-pink-200 text-gray-800 mt-1"
                    placeholder="Event description"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="date" className="text-sm font-medium text-gray-700">
                      Date
                    </Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                      className="bg-white/80 border-pink-200 text-gray-800 mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="time" className="text-sm font-medium text-gray-700">
                      Time
                    </Label>
                    <Input
                      id="time"
                      type="time"
                      value={formData.time}
                      onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                      className="bg-white/80 border-pink-200 text-gray-800 mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="type" className="text-sm font-medium text-gray-700">
                    Event Type
                  </Label>
                  <select
                    id="type"
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full bg-white/80 border border-pink-200 rounded-md px-3 py-2 text-gray-800 mt-1"
                  >
                    {EVENT_TYPES.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="location" className="text-sm font-medium text-gray-700">
                    Location (Optional)
                  </Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    className="bg-white/80 border-pink-200 text-gray-800 mt-1"
                    placeholder="Event location"
                  />
                </div>

                <div>
                  <Label htmlFor="reminder" className="text-sm font-medium text-gray-700">
                    Reminder
                  </Label>
                  <select
                    id="reminder"
                    value={formData.reminder}
                    onChange={(e) => setFormData(prev => ({ ...prev, reminder: parseInt(e.target.value) }))}
                    className="w-full bg-white/80 border border-pink-200 rounded-md px-3 py-2 text-gray-800 mt-1"
                  >
                    {REMINDER_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* AI Section */}
                <div className="border-t border-gray-300 pt-4">
                  <div className="text-center mb-3">
                    <span className="text-sm font-medium text-gray-600">OR schedule with AI</span>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-700">
                      Describe your event
                    </Label>
                    <Textarea
                      value={aiDescription}
                      onChange={(e) => setAiDescription(e.target.value)}
                      className="bg-white/80 border-pink-200 text-gray-800 mt-1"
                      placeholder="e.g., 'Miss Universe interview practice tomorrow at 3pm at the studio'"
                      rows={2}
                    />
                  </div>

                  <Button
                    onClick={processAIDescription}
                    disabled={!aiDescription.trim() || isProcessingAI}
                    className="w-full mt-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                    size="sm"
                  >
                    {isProcessingAI ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4 mr-2" />
                    )}
                    Fill Form with AI
                  </Button>
                </div>

                <div className="flex space-x-3 pt-4">
                  <Button
                    onClick={handleSaveEvent}
                    disabled={!formData.title || !formData.date || !formData.time || isCreating || isUpdating}
                    className="flex-1 bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white"
                  >
                    {(isCreating || isUpdating) ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4 mr-2" />
                    )}
                    {editingEvent ? 'Update Event' : 'Add Event'}
                  </Button>
                  <Button
                    onClick={() => setShowEventModal(false)}
                    variant="outline"
                    className="border-gray-400 text-gray-600 hover:bg-gray-100"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 