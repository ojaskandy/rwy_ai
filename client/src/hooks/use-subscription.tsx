import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './use-auth';

export interface UserSubscription {
  status: 'basic' | 'premium' | 'premium_code';
  planType?: string;
  stripeSubscriptionId?: string;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd?: boolean;
  premiumCodeId?: number;
}

export interface UserUsage {
  dressTryOnsThisWeek: number;
  dressTryOnsWeekStart?: Date;
  interviewQuestionsThisWeek: number;
  interviewQuestionsWeekStart?: Date;
  boardSavesThisMonth: number;
  boardSavesMonthStart?: Date;
}

export interface UsageLimits {
  dressTryOnsWeekly: number;
  interviewQuestionsWeekly: number;
  boardSavesMonthly: number;
  walkRoutinesMonthly: number;
  calendarEventsTotal: number;
}

export interface SubscriptionContextType {
  subscription: UserSubscription | null;
  usage: UserUsage | null;
  limits: UsageLimits;
  isPremium: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  refreshSubscription: () => Promise<void>;
  checkUsage: (action: string, amount?: number) => Promise<{ allowed: boolean; currentUsage: number; limit: number; resetDate?: Date }>;
  validateCode: (code: string) => Promise<{ valid: boolean; message?: string }>;
  applyCode: (code: string) => Promise<{ success: boolean; message: string }>;
  createCheckoutSession: (planType: 'monthly' | 'yearly') => Promise<{ sessionId: string; url: string }>;
  createBillingPortal: () => Promise<{ url: string }>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { user, session } = useAuth();
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [usage, setUsage] = useState<UserUsage | null>(null);
  const [limits] = useState<UsageLimits>({
    dressTryOnsWeekly: 3,
    interviewQuestionsWeekly: 5,
    boardSavesMonthly: 10,
    walkRoutinesMonthly: 5,
    calendarEventsTotal: 10,
  });
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshSubscription = async () => {
    if (!session?.access_token) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/subscription/status', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch subscription status');
      }
      
      const data = await response.json();
      // Server returns { status, planType, isPremium } (no nested subscription/usage)
      const normalized: UserSubscription = {
        status: data.status,
        planType: data.planType,
      };
      setSubscription(normalized);
      // Usage is not returned by this endpoint; keep last known or null
      setIsPremium(Boolean(data.isPremium));
    } catch (err) {
      console.error('Error fetching subscription:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch subscription status');
    } finally {
      setIsLoading(false);
    }
  };

  const checkUsage = async (action: string, amount: number = 1) => {
    if (!session?.access_token) {
      throw new Error('Authentication required');
    }
    
    const response = await fetch('/api/subscription/check-usage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ action, amount }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to check usage');
    }
    
    return response.json();
  };

  const validateCode = async (code: string) => {
    const response = await fetch('/api/subscription/validate-code', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
    });
    
    return response.json();
  };

  const applyCode = async (code: string) => {
    if (!session?.access_token) {
      throw new Error('Authentication required');
    }
    
    const response = await fetch('/api/subscription/apply-code', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ code }),
    });
    
    const result = await response.json();
    
    if (response.ok && result.success) {
      // Refresh subscription status after applying code
      await refreshSubscription();
    }
    
    return result;
  };

  const createCheckoutSession = async (planType: 'monthly' | 'yearly') => {
    if (!session?.access_token) {
      throw new Error('Authentication required');
    }
    
    const response = await fetch('/api/subscription/create-checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ planType }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to create checkout session');
    }
    
    return response.json();
  };

  const createBillingPortal = async () => {
    if (!session?.access_token) {
      throw new Error('Authentication required');
    }
    
    const response = await fetch('/api/subscription/billing-portal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to create billing portal session');
    }
    
    return response.json();
  };

  // Fetch subscription status on mount and when user changes
  useEffect(() => {
    if (user && session) {
      refreshSubscription();
    }
  }, [user, session]);

  const value: SubscriptionContextType = {
    subscription,
    usage,
    limits,
    isPremium,
    isLoading,
    error,
    refreshSubscription,
    checkUsage,
    validateCode,
    applyCode,
    createCheckoutSession,
    createBillingPortal,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}

// Utility hook for checking if user can perform specific actions
export function useUsageCheck() {
  const { checkUsage, isPremium } = useSubscription();
  
  const canSaveToBoard = async () => {
    if (isPremium) return { allowed: true, currentUsage: 0, limit: Infinity };
    return checkUsage('board_save');
  };
  
  const canUseRoutine = async (minutes: number = 1) => {
    if (isPremium) return { allowed: true, currentUsage: 0, limit: Infinity };
    return checkUsage('routine_minute', minutes);
  };
  
  const canAskInterview = async () => {
    if (isPremium) return { allowed: true, currentUsage: 0, limit: Infinity };
    return checkUsage('interview_question');
  };
  
  const canTryOnDress = async () => {
    if (isPremium) return { allowed: true, currentUsage: 0, limit: Infinity };
    return checkUsage('dress_tryon');
  };
  
  return {
    canSaveToBoard,
    canUseRoutine,
    canAskInterview,
    canTryOnDress,
  };
}