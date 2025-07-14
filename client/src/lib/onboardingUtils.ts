/**
 * Onboarding Utilities
 * 
 * These functions help determine when to show onboarding and manage the flow.
 */

import { apiRequest } from '@/lib/queryClient';

// Check if user has completed onboarding (checks backend status)
export const checkOnboardingStatus = async () => {
  try {
    const response = await apiRequest("GET", "/api/user-status");
    const data = await response.json();
    return {
      hasCompletedOnboarding: data.hasCompletedOnboarding || false,
      hasPaid: data.hasPaid || false,
      hasCodeBypass: data.hasCodeBypass || false,
      profileCompleted: data.profileCompleted || false,
      authProvider: data.authProvider
    };
  } catch (error) {
    console.error('Failed to check onboarding status:', error);
    return {
      hasCompletedOnboarding: false,
      hasPaid: false,
      hasCodeBypass: false,
      profileCompleted: false,
      authProvider: null
    };
  }
};

// Check if user should see onboarding (new users who haven't completed it)
export const shouldShowOnboarding = async (user: any): Promise<boolean> => {
  console.log('shouldShowOnboarding called with user:', user);
  
  // Skip onboarding for guest users
  if (user?.authProvider === 'guest') {
    console.log('Skipping onboarding for guest user');
    return false;
  }
  
  // Check backend status for authenticated users
  if (user && user.authProvider !== 'guest') {
    const status = await checkOnboardingStatus();
    console.log('Backend onboarding status:', status);
    
    // Show onboarding if user hasn't completed it and hasn't paid/bypassed
    const shouldShow = !status.hasCompletedOnboarding && !status.hasPaid && !status.hasCodeBypass;
    console.log('shouldShow onboarding:', shouldShow);
    return shouldShow;
  }
  
  return false;
};

// Legacy localStorage functions for backward compatibility
export const hasCompletedOnboarding = (): boolean => {
  return localStorage.getItem('coacht_onboarding_completed') === 'true';
};

export const markOnboardingComplete = (): void => {
  localStorage.setItem('coacht_onboarding_completed', 'true');
};