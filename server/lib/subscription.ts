import { supabase } from '../db';
import { Request, Response, NextFunction } from 'express';

export interface UserSubscription {
  status: 'basic' | 'premium' | 'premium_code';
  planType?: string;
  stripeSubscriptionId?: string;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd?: boolean;
  premiumCodeId?: number;
}

export interface UserUsage {
  boardSavesThisWeek: number;
  routineMinutesThisWeek: number;
  interviewQuestionsToday: number;
  dressTryOnsThisMonth: number;
  boardSavesWeekStart: Date;
  routineWeekStart: Date;
  interviewQuestionsDate: Date;
  dressTryOnsMonthStart: Date;
}

// Usage limits for basic users
export const USAGE_LIMITS = {
  BOARD_SAVES_WEEKLY: 10,
  ROUTINE_MINUTES_WEEKLY: 7,
  INTERVIEW_QUESTIONS_DAILY: 3,
  DRESS_TRYONS_MONTHLY: 10,
} as const;

// Get user's subscription status
export async function getUserSubscription(userId: string): Promise<UserSubscription | null> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    console.error('Error fetching subscription:', error);
    return null;
  }

  return {
    status: data.status,
    planType: data.plan_type,
    stripeSubscriptionId: data.stripe_subscription_id,
    currentPeriodEnd: data.current_period_end ? new Date(data.current_period_end) : undefined,
    cancelAtPeriodEnd: data.cancel_at_period_end,
    premiumCodeId: data.premium_code_id,
  };
}

// Get user's current usage
export async function getUserUsage(userId: string): Promise<UserUsage | null> {
  const { data, error } = await supabase
    .from('user_usage')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('Error fetching usage:', error);
    return null;
  }

  if (!data) {
    // Create initial usage record
    const { data: newData, error: createError } = await supabase
      .from('user_usage')
      .insert([{ user_id: userId }])
      .select()
      .single();

    if (createError || !newData) {
      console.error('Error creating usage record:', createError);
      return null;
    }
    data = newData;
  }

  return {
    boardSavesThisWeek: data.board_saves_this_week || 0,
    routineMinutesThisWeek: data.routine_minutes_this_week || 0,
    interviewQuestionsToday: data.interview_questions_today || 0,
    dressTryOnsThisMonth: data.dress_tryons_this_month || 0,
    boardSavesWeekStart: new Date(data.board_saves_week_start),
    routineWeekStart: new Date(data.routine_week_start),
    interviewQuestionsDate: new Date(data.interview_questions_date),
    dressTryOnsMonthStart: new Date(data.dress_tryons_month_start),
  };
}

// Check if user has premium access
export function hasPremiumAccess(subscription: UserSubscription | null): boolean {
  if (!subscription) return false;
  
  if (subscription.status === 'premium' || subscription.status === 'premium_code') {
    // Check if subscription is still active
    if (subscription.currentPeriodEnd && subscription.currentPeriodEnd < new Date()) {
      return false;
    }
    return true;
  }
  
  return false;
}

// Check if user can perform an action
export async function canUserPerformAction(
  userId: string,
  action: 'board_save' | 'routine_minute' | 'interview_question' | 'dress_tryon',
  amount: number = 1
): Promise<{ allowed: boolean; currentUsage: number; limit: number; resetDate?: Date }> {
  const subscription = await getUserSubscription(userId);
  const usage = await getUserUsage(userId);

  // Premium users have unlimited access
  if (hasPremiumAccess(subscription)) {
    return { allowed: true, currentUsage: 0, limit: Infinity };
  }

  if (!usage) {
    return { allowed: false, currentUsage: 0, limit: 0 };
  }

  // Check specific limits for basic users
  switch (action) {
    case 'board_save':
      const weeksSinceStart = Math.floor((Date.now() - usage.boardSavesWeekStart.getTime()) / (7 * 24 * 60 * 60 * 1000));
      if (weeksSinceStart >= 1) {
        // Reset weekly counter
        await resetWeeklyUsage(userId, 'board_saves');
        return { 
          allowed: amount <= USAGE_LIMITS.BOARD_SAVES_WEEKLY, 
          currentUsage: 0, 
          limit: USAGE_LIMITS.BOARD_SAVES_WEEKLY,
          resetDate: new Date(Date.now() + (7 * 24 * 60 * 60 * 1000))
        };
      }
      return { 
        allowed: usage.boardSavesThisWeek + amount <= USAGE_LIMITS.BOARD_SAVES_WEEKLY, 
        currentUsage: usage.boardSavesThisWeek, 
        limit: USAGE_LIMITS.BOARD_SAVES_WEEKLY,
        resetDate: new Date(usage.boardSavesWeekStart.getTime() + (7 * 24 * 60 * 60 * 1000))
      };

    case 'routine_minute':
      const routineWeeksSinceStart = Math.floor((Date.now() - usage.routineWeekStart.getTime()) / (7 * 24 * 60 * 60 * 1000));
      if (routineWeeksSinceStart >= 1) {
        await resetWeeklyUsage(userId, 'routine_minutes');
        return { 
          allowed: amount <= USAGE_LIMITS.ROUTINE_MINUTES_WEEKLY, 
          currentUsage: 0, 
          limit: USAGE_LIMITS.ROUTINE_MINUTES_WEEKLY,
          resetDate: new Date(Date.now() + (7 * 24 * 60 * 60 * 1000))
        };
      }
      return { 
        allowed: usage.routineMinutesThisWeek + amount <= USAGE_LIMITS.ROUTINE_MINUTES_WEEKLY, 
        currentUsage: usage.routineMinutesThisWeek, 
        limit: USAGE_LIMITS.ROUTINE_MINUTES_WEEKLY,
        resetDate: new Date(usage.routineWeekStart.getTime() + (7 * 24 * 60 * 60 * 1000))
      };

    case 'interview_question':
      const today = new Date();
      const usageDate = new Date(usage.interviewQuestionsDate);
      if (today.toDateString() !== usageDate.toDateString()) {
        // Reset daily counter
        await resetDailyUsage(userId, 'interview_questions');
        return { 
          allowed: amount <= USAGE_LIMITS.INTERVIEW_QUESTIONS_DAILY, 
          currentUsage: 0, 
          limit: USAGE_LIMITS.INTERVIEW_QUESTIONS_DAILY,
          resetDate: new Date(today.getTime() + (24 * 60 * 60 * 1000))
        };
      }
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      return { 
        allowed: usage.interviewQuestionsToday + amount <= USAGE_LIMITS.INTERVIEW_QUESTIONS_DAILY, 
        currentUsage: usage.interviewQuestionsToday, 
        limit: USAGE_LIMITS.INTERVIEW_QUESTIONS_DAILY,
        resetDate: tomorrow
      };

    case 'dress_tryon':
      const monthsSinceStart = Math.floor((Date.now() - usage.dressTryOnsMonthStart.getTime()) / (30 * 24 * 60 * 60 * 1000));
      if (monthsSinceStart >= 1) {
        await resetMonthlyUsage(userId, 'dress_tryons');
        return { 
          allowed: amount <= USAGE_LIMITS.DRESS_TRYONS_MONTHLY, 
          currentUsage: 0, 
          limit: USAGE_LIMITS.DRESS_TRYONS_MONTHLY,
          resetDate: new Date(Date.now() + (30 * 24 * 60 * 60 * 1000))
        };
      }
      return { 
        allowed: usage.dressTryOnsThisMonth + amount <= USAGE_LIMITS.DRESS_TRYONS_MONTHLY, 
        currentUsage: usage.dressTryOnsThisMonth, 
        limit: USAGE_LIMITS.DRESS_TRYONS_MONTHLY,
        resetDate: new Date(usage.dressTryOnsMonthStart.getTime() + (30 * 24 * 60 * 60 * 1000))
      };

    default:
      return { allowed: false, currentUsage: 0, limit: 0 };
  }
}

// Track usage
export async function trackUsage(
  userId: string,
  action: 'board_save' | 'routine_minute' | 'interview_question' | 'dress_tryon',
  amount: number = 1
): Promise<boolean> {
  const canPerform = await canUserPerformAction(userId, action, amount);
  
  if (!canPerform.allowed) {
    return false;
  }

  let updateField: string;
  switch (action) {
    case 'board_save':
      updateField = 'board_saves_this_week';
      break;
    case 'routine_minute':
      updateField = 'routine_minutes_this_week';
      break;
    case 'interview_question':
      updateField = 'interview_questions_today';
      break;
    case 'dress_tryon':
      updateField = 'dress_tryons_this_month';
      break;
    default:
      return false;
  }

  const { error } = await supabase
    .from('user_usage')
    .update({
      [updateField]: supabase.raw(`${updateField} + ${amount}`),
      last_updated: new Date().toISOString(),
    })
    .eq('user_id', userId);

  if (error) {
    console.error('Error tracking usage:', error);
    return false;
  }

  return true;
}

// Reset usage counters
async function resetWeeklyUsage(userId: string, type: 'board_saves' | 'routine_minutes') {
  const updates: any = { last_updated: new Date().toISOString() };
  
  if (type === 'board_saves') {
    updates.board_saves_this_week = 0;
    updates.board_saves_week_start = new Date().toISOString();
  } else {
    updates.routine_minutes_this_week = 0;
    updates.routine_week_start = new Date().toISOString();
  }

  await supabase
    .from('user_usage')
    .update(updates)
    .eq('user_id', userId);
}

async function resetDailyUsage(userId: string, type: 'interview_questions') {
  await supabase
    .from('user_usage')
    .update({
      interview_questions_today: 0,
      interview_questions_date: new Date().toISOString(),
      last_updated: new Date().toISOString(),
    })
    .eq('user_id', userId);
}

async function resetMonthlyUsage(userId: string, type: 'dress_tryons') {
  await supabase
    .from('user_usage')
    .update({
      dress_tryons_this_month: 0,
      dress_tryons_month_start: new Date().toISOString(),
      last_updated: new Date().toISOString(),
    })
    .eq('user_id', userId);
}

// Middleware to check if user can perform action
export function requireUsageLimit(action: 'board_save' | 'routine_minute' | 'interview_question' | 'dress_tryon', amount: number = 1) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const canPerform = await canUserPerformAction(userId, action, amount);
    
    if (!canPerform.allowed) {
      return res.status(403).json({
        error: 'Usage limit exceeded',
        message: `You've reached your ${action.replace('_', ' ')} limit`,
        currentUsage: canPerform.currentUsage,
        limit: canPerform.limit,
        resetDate: canPerform.resetDate,
        upgradeRequired: true
      });
    }

    // Add usage info to request for tracking
    req.usageInfo = { action, amount };
    next();
  };
}

// Middleware to track usage after successful action
export function trackUsageAfterAction() {
  return async (req: Request, res: Response, next: NextFunction) => {
    const originalSend = res.send;
    
    res.send = function(data) {
      // Only track if the response was successful
      if (res.statusCode >= 200 && res.statusCode < 300 && req.usageInfo && req.user?.id) {
        trackUsage(req.user.id, req.usageInfo.action, req.usageInfo.amount)
          .catch(console.error);
      }
      
      return originalSend.call(this, data);
    };
    
    next();
  };
}

// Validate premium code
export async function validatePremiumCode(code: string): Promise<{ valid: boolean; codeId?: number; message?: string }> {
  const { data, error } = await supabase
    .from('premium_codes')
    .select('*')
    .eq('code', code)
    .eq('is_active', true)
    .single();

  if (error || !data) {
    return { valid: false, message: 'Invalid code' };
  }

  // Check if code has expired
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return { valid: false, message: 'Code has expired' };
  }

  // Check usage limit
  if (data.usage_limit && data.used_count >= data.usage_limit) {
    return { valid: false, message: 'Code usage limit reached' };
  }

  return { valid: true, codeId: data.id };
}

// Apply premium code to user
export async function applyPremiumCode(userId: string, codeId: number): Promise<boolean> {
  try {
    // Start transaction
    const { error: usageError } = await supabase
      .from('premium_code_usage')
      .insert([{ user_id: userId, code_id: codeId }]);

    if (usageError) {
      console.error('Error recording code usage:', usageError);
      return false;
    }

    // Update user subscription
    const { error: subscriptionError } = await supabase
      .from('subscriptions')
      .upsert([{
        user_id: userId,
        status: 'premium_code',
        plan_type: 'code',
        premium_code_id: codeId,
        updated_at: new Date().toISOString(),
      }]);

    if (subscriptionError) {
      console.error('Error updating subscription:', subscriptionError);
      return false;
    }

    // Increment code usage count
    const { error: incrementError } = await supabase
      .from('premium_codes')
      .update({ used_count: supabase.raw('used_count + 1') })
      .eq('id', codeId);

    if (incrementError) {
      console.error('Error incrementing code usage:', incrementError);
      // Don't return false here as the main operations succeeded
    }

    return true;
  } catch (error) {
    console.error('Error applying premium code:', error);
    return false;
  }
}

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      usageInfo?: {
        action: 'board_save' | 'routine_minute' | 'interview_question' | 'dress_tryon';
        amount: number;
      };
    }
  }
}