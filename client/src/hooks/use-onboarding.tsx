import { useState, useEffect } from 'react';
import { useAuth } from './use-auth';

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
      const response = await fetch('/api/onboarding/status', {
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
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
      const response = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
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