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
  X, Check, AlertCircle, Star, Palette
} from 'lucide-react';
import { useLocation } from 'wouter';

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

interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  date: Date;
  time: string;
  type: string;
  location?: string;
  reminder?: number;
  completed?: boolean;
}

// Mock events - in production this would be stored in a database
const MOCK_EVENTS: CalendarEvent[] = [
  {
    id: '1',
    title: 'Miss Universe Audition',
    description: 'Initial audition for Miss Universe competition',
    date: new Date(2025, 0, 15),
    time: '14:00',
    type: 'pageant',
    location: 'Convention Center',
    reminder: 1440
  },
  {
    id: '2',
    title: 'Evening Gown Fitting',
    description: 'Final fitting for pageant evening gown',
    date: new Date(2025, 0, 10),
    time: '10:30',
    type: 'fitting',
    location: 'Bella Boutique',
    reminder: 60
  },
  {
    id: '3',
    title: 'Portfolio Photo Shoot',
    description: 'Professional headshots and full-body photos',
    date: new Date(2025, 0, 20),
    time: '09:00',
    type: 'photo',
    location: 'Studio Downtown',
    reminder: 1440
  },
  {
    id: '4',
    title: 'Interview Practice Session',
    description: 'Mock interview with pageant coach',
    date: new Date(2025, 0, 8),
    time: '16:00',
    type: 'interview',
    reminder: 60
  }
];

export default function PageantCalendar() {
  const [, navigate] = useLocation();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>(MOCK_EVENTS);
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  
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
    
    for (let i = 0; i < 42; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  };

  const formatMonth = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const isSameDay = (date1: Date, date2: Date) => {
    return date1.toDateString() === date2.toDateString();
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

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
    setShowEventModal(true);
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
      reminder: event.reminder || 60
    });
    setShowEventModal(true);
  };

  const handleSaveEvent = () => {
    const eventData: CalendarEvent = {
      id: editingEvent?.id || Date.now().toString(),
      title: formData.title,
      description: formData.description,
      date: new Date(formData.date),
      time: formData.time,
      type: formData.type,
      location: formData.location,
      reminder: formData.reminder
    };

    if (editingEvent) {
      setEvents(prev => prev.map(e => e.id === editingEvent.id ? eventData : e));
    } else {
      setEvents(prev => [...prev, eventData]);
    }

    setShowEventModal(false);
    setSelectedDate(eventData.date);
  };

  const handleDeleteEvent = (eventId: string) => {
    setEvents(prev => prev.filter(e => e.id !== eventId));
  };

  const getEventType = (typeId: string) => {
    return EVENT_TYPES.find(t => t.id === typeId) || EVENT_TYPES[0];
  };

  const today = new Date();
  const calendarDays = generateCalendarDays();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 text-white">
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
            <Card className="bg-black/30 border-indigo-600/30">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-indigo-300 flex items-center">
                    <CalendarIcon className="w-5 h-5 mr-2" />
                    {formatMonth(currentDate)}
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={previousMonth}
                      variant="outline"
                      size="sm"
                      className="border-indigo-600 text-indigo-300 hover:bg-indigo-600/20"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={nextMonth}
                      variant="outline"
                      size="sm"
                      className="border-indigo-600 text-indigo-300 hover:bg-indigo-600/20"
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
                    <div key={day} className="text-center text-sm font-semibold text-indigo-300 p-2">
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
                            ? 'bg-indigo-600/50 border-indigo-400' 
                            : isToday 
                              ? 'bg-purple-600/30 border-purple-400' 
                              : 'border-gray-700 hover:border-indigo-500 hover:bg-indigo-900/20'
                          }
                          ${!isCurrentMonthDay && 'opacity-40'}
                        `}
                      >
                        <div className={`text-sm font-medium ${
                          isToday ? 'text-purple-200' : 
                          isSelected ? 'text-indigo-200' : 
                          isCurrentMonthDay ? 'text-gray-200' : 'text-gray-500'
                        }`}>
                          {date.getDate()}
                        </div>
                        
                        {/* Event indicators */}
                        <div className="absolute bottom-1 left-1 right-1 space-y-0.5">
                          {dayEvents.slice(0, 2).map((event, eventIndex) => {
                            const eventType = getEventType(event.type);
                            return (
                              <div
                                key={eventIndex}
                                className={`h-1 rounded-full ${eventType.color} opacity-80`}
                              />
                            );
                          })}
                          {dayEvents.length > 2 && (
                            <div className="text-xs text-gray-400 text-center">
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
          </div>

          {/* Events Sidebar */}
          <div className="space-y-6">
            {/* Selected Date Events */}
            {selectedDate && (
              <Card className="bg-black/30 border-indigo-600/30">
                <CardHeader>
                  <CardTitle className="text-indigo-300 text-sm">
                    {selectedDate.toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {getEventsForDate(selectedDate).length > 0 ? (
                      getEventsForDate(selectedDate).map((event) => {
                        const eventType = getEventType(event.type);
                        return (
                          <motion.div
                            key={event.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-gray-900/50 rounded-lg p-3"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <Badge className={`${eventType.color} ${eventType.textColor} text-xs`}>
                                    {eventType.name}
                                  </Badge>
                                  <span className="text-xs text-gray-400">{event.time}</span>
                                </div>
                                <h4 className="font-semibold text-sm text-gray-200">{event.title}</h4>
                                {event.description && (
                                  <p className="text-xs text-gray-400 mt-1">{event.description}</p>
                                )}
                                {event.location && (
                                  <div className="flex items-center mt-1">
                                    <MapPin className="w-3 h-3 mr-1 text-gray-500" />
                                    <span className="text-xs text-gray-500">{event.location}</span>
                                  </div>
                                )}
                              </div>
                              <div className="flex space-x-1">
                                <Button
                                  onClick={() => handleEditEvent(event)}
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 text-gray-400 hover:text-indigo-300"
                                >
                                  <Edit className="w-3 h-3" />
                                </Button>
                                <Button
                                  onClick={() => handleDeleteEvent(event.id)}
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 text-gray-400 hover:text-red-300"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })
                    ) : (
                      <div className="text-center py-6">
                        <CalendarIcon className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                        <p className="text-gray-400 text-sm">No events scheduled</p>
                        <Button
                          onClick={handleAddEvent}
                          variant="outline"
                          size="sm"
                          className="mt-2 border-indigo-600 text-indigo-300 hover:bg-indigo-600/20"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Add Event
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Upcoming Events */}
            <Card className="bg-black/30 border-indigo-600/30">
              <CardHeader>
                <CardTitle className="text-indigo-300 text-sm flex items-center">
                  <Clock className="w-4 h-4 mr-2" />
                  Upcoming Events
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {events
                    .filter(event => event.date >= today)
                    .sort((a, b) => a.date.getTime() - b.date.getTime())
                    .slice(0, 5)
                    .map((event) => {
                      const eventType = getEventType(event.type);
                      const daysUntil = Math.ceil((event.date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                      
                      return (
                        <div key={event.id} className="bg-gray-900/50 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-1">
                            <Badge className={`${eventType.color} ${eventType.textColor} text-xs`}>
                              {eventType.name}
                            </Badge>
                            <span className="text-xs text-gray-400">
                              {daysUntil === 0 ? 'Today' : `${daysUntil} days`}
                            </span>
                          </div>
                          <h4 className="font-semibold text-sm text-gray-200">{event.title}</h4>
                          <p className="text-xs text-gray-400">
                            {event.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at {event.time}
                          </p>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>

            {/* Event Type Legend */}
            <Card className="bg-black/30 border-indigo-600/30">
              <CardHeader>
                <CardTitle className="text-indigo-300 text-sm">Event Types</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {EVENT_TYPES.map((type) => (
                    <div key={type.id} className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${type.color}`} />
                      <span className="text-xs text-gray-300">{type.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
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
              className="bg-gradient-to-b from-indigo-900 to-purple-900 rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">
                  {editingEvent ? 'Edit Event' : 'Add New Event'}
                </h3>
                <button 
                  onClick={() => setShowEventModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title" className="text-sm font-medium text-gray-300">
                    Event Title
                  </Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="bg-black/30 border-indigo-600/30 text-white"
                    placeholder="Enter event title"
                  />
                </div>

                <div>
                  <Label htmlFor="description" className="text-sm font-medium text-gray-300">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="bg-black/30 border-indigo-600/30 text-white"
                    placeholder="Event description"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="date" className="text-sm font-medium text-gray-300">
                      Date
                    </Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                      className="bg-black/30 border-indigo-600/30 text-white"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="time" className="text-sm font-medium text-gray-300">
                      Time
                    </Label>
                    <Input
                      id="time"
                      type="time"
                      value={formData.time}
                      onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                      className="bg-black/30 border-indigo-600/30 text-white"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="type" className="text-sm font-medium text-gray-300">
                    Event Type
                  </Label>
                  <select
                    id="type"
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full bg-black/30 border border-indigo-600/30 rounded-md px-3 py-2 text-white"
                  >
                    {EVENT_TYPES.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="location" className="text-sm font-medium text-gray-300">
                    Location (Optional)
                  </Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    className="bg-black/30 border-indigo-600/30 text-white"
                    placeholder="Event location"
                  />
                </div>

                <div>
                  <Label htmlFor="reminder" className="text-sm font-medium text-gray-300">
                    Reminder
                  </Label>
                  <select
                    id="reminder"
                    value={formData.reminder}
                    onChange={(e) => setFormData(prev => ({ ...prev, reminder: parseInt(e.target.value) }))}
                    className="w-full bg-black/30 border border-indigo-600/30 rounded-md px-3 py-2 text-white"
                  >
                    {REMINDER_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex space-x-3 pt-4">
                  <Button
                    onClick={handleSaveEvent}
                    disabled={!formData.title || !formData.date || !formData.time}
                    className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    {editingEvent ? 'Update Event' : 'Add Event'}
                  </Button>
                  <Button
                    onClick={() => setShowEventModal(false)}
                    variant="outline"
                    className="border-gray-600 text-gray-300 hover:bg-gray-600/20"
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