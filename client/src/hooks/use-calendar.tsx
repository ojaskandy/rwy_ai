import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

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

interface CreateEventData {
  title: string;
  description?: string;
  date: string;
  time: string;
  type: string;
  location?: string;
  reminder?: number;
  completed?: boolean;
}

interface UpdateEventData extends Partial<CreateEventData> {}

// Helper function to get auth headers
const getAuthHeaders = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session?.access_token}`
  };
};

export const useCalendarEvents = () => {
  const queryClient = useQueryClient();

  const { data: events = [], isLoading, error } = useQuery({
    queryKey: ['calendar-events'],
    queryFn: async (): Promise<CalendarEvent[]> => {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/calendar/events', { headers });
      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }
      const data = await response.json();
      // Convert date strings to Date objects
      return data.map((event: any) => ({
        ...event,
        date: new Date(event.date),
        createdAt: new Date(event.createdAt),
        updatedAt: new Date(event.updatedAt),
      }));
    },
  });

  const createEventMutation = useMutation({
    mutationFn: async (eventData: CreateEventData): Promise<CalendarEvent> => {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/calendar/events', {
        method: 'POST',
        headers,
        body: JSON.stringify(eventData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create event');
      }
      
      const data = await response.json();
      return {
        ...data,
        date: new Date(data.date),
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
    },
  });

  const updateEventMutation = useMutation({
    mutationFn: async ({ id, ...eventData }: UpdateEventData & { id: number }): Promise<CalendarEvent> => {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/calendar/events/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(eventData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update event');
      }
      
      const data = await response.json();
      return {
        ...data,
        date: new Date(data.date),
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
    },
  });

  const deleteEventMutation = useMutation({
    mutationFn: async (id: number): Promise<void> => {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/calendar/events/${id}`, {
        method: 'DELETE',
        headers,
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete event');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
    },
  });

  return {
    events,
    isLoading,
    error,
    createEvent: createEventMutation.mutate,
    updateEvent: updateEventMutation.mutate,
    deleteEvent: deleteEventMutation.mutate,
    isCreating: createEventMutation.isPending,
    isUpdating: updateEventMutation.isPending,
    isDeleting: deleteEventMutation.isPending,
  };
}; 