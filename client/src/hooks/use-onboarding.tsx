import { useState, useEffect } from 'react';
import { useAuth } from './use-auth';
import { supabase } from '@/lib/supabase';

export interface OnboardingData {
  end_goal?: string;
  experience_level?: string;
  focus_area?: string;
  timeline?: string;
  motivation?: string;
  coach_status?: string;
}

export interface OnboardingStatus {
  completed: boolean;
  data: OnboardingData | null;
}

export function useOnboarding() {
  const { user } = useAuth();
  const [status, setStatus] = useState<OnboardingStatus>({ completed: false, data: null });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch onboarding status
  const fetchStatus = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      // Get the session token from Supabase
      const { data: { session } } = await supabase.auth.getSession();
      const authToken = session?.access_token;

      if (!authToken) {
        console.error('No auth token available for onboarding check');
        setIsLoading(false);
        return;
      }

      const response = await fetch('/api/onboarding/status', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch onboarding status');
      }

      const data = await response.json();
      setStatus({
        completed: data.completed,
        data: data.data
      });
      setError(null);
    } catch (err) {
      console.error('Error fetching onboarding status:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  // Complete onboarding
  const completeOnboarding = async (answers: OnboardingData) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      // Get the session token from Supabase
      const { data: { session } } = await supabase.auth.getSession();
      const authToken = session?.access_token;

      if (!authToken) {
        throw new Error('No auth token available');
      }

      const response = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ answers }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to complete onboarding');
      }

      const result = await response.json();
      
      // Update local status
      setStatus({
        completed: true,
        data: answers
      });

      return result;
    } catch (err) {
      console.error('Error completing onboarding:', err);
      throw err;
    }
  };

  // Check if user needs onboarding
  // User doesn't need onboarding if:
  // 1. They completed the onboarding flow, OR
  // 2. They have paid (subscribed), OR  
  // 3. They have a code bypass
  const needsOnboarding = user && !status.completed;

  useEffect(() => {
    if (user) {
      fetchStatus();
    }
  }, [user]);

  return {
    status,
    isLoading,
    error,
    needsOnboarding,
    fetchStatus,
    completeOnboarding,
  };
}