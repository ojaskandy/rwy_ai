import React, { useEffect } from 'react';
import { useLocation } from 'wouter';
import { OnboardingProvider } from '@/contexts/OnboardingContext';
import OnboardingFlow from '@/components/OnboardingFlow';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';

/**
 * OnboardingPage - Displays the questionnaire flow for new users
 * 
 * This page appears after successful login/signup but before the main dashboard.
 * It collects user preferences and goals to personalize their experience.
 * 
 * Flow:
 * 1. User completes login (Magic Link, Google, or Guest)
 * 2. If user is new and hasn't completed onboarding, they're redirected here
 * 3. User answers 6 questionnaire steps
 * 4. User completes payment or validates discount code
 * 5. User is redirected to main dashboard (/app)
 */
const OnboardingPage: React.FC = () => {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Check if user has already completed onboarding
  const { data: userStatus } = useQuery({
    queryKey: ['/api/user-status'],
    queryFn: async () => {
      const response = await fetch('/api/user-status');
      return response.json();
    },
  });

  // Redirect immediately if user has already completed onboarding
  useEffect(() => {
    if (userStatus && (userStatus.hasCompletedOnboarding || userStatus.hasPaid || userStatus.hasCodeBypass)) {
      console.log('User has already completed onboarding, redirecting to /app');
      navigate('/app', { replace: true });
    }
  }, [userStatus, navigate]);

  // Handle onboarding completion (after payment or discount code)
  const handleOnboardingComplete = async () => {
    try {
      // Update onboarding status on the backend
      await apiRequest("POST", "/api/update-onboarding", {
        hasCompletedOnboarding: true
      });
      
      // Navigate to main dashboard
      navigate('/app', { replace: true });
      
      toast({
        title: "Welcome to CoachT!",
        description: "Your martial arts journey begins now.",
      });
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
      toast({
        title: "Welcome to CoachT!",
        description: "Your martial arts journey begins now.",
      });
      // Still navigate even if the API call fails
      navigate('/app', { replace: true });
    }
  };

  // Show loading while checking status
  if (!userStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't show onboarding if user has already completed it
  if (userStatus.hasCompletedOnboarding || userStatus.hasPaid || userStatus.hasCodeBypass) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">Redirecting to your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <OnboardingProvider>
      <OnboardingFlow onComplete={handleOnboardingComplete} />
    </OnboardingProvider>
  );
};

export default OnboardingPage;