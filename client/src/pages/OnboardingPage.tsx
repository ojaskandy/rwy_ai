import React from 'react';
import { useLocation } from 'wouter';
import { OnboardingProvider } from '@/contexts/OnboardingContext';
import OnboardingFlow from '@/components/OnboardingFlow';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

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

  return (
    <OnboardingProvider>
      <OnboardingFlow onComplete={handleOnboardingComplete} />
    </OnboardingProvider>
  );
};

export default OnboardingPage;