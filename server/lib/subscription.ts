import { supabase } from '../db';
import { Request, Response, NextFunction } from 'express';
import { getAuthenticatedUser } from './auth';

// --- Interfaces and Constants ---

export interface UserSubscription {
  status: 'basic' | 'premium' | 'premium_code';
}

export interface UserUsage {
  dressTryOnsThisWeek: number;
  dressTryOnsWeekStart: Date;
  interviewQuestionsThisWeek: number;
  interviewQuestionsWeekStart: Date;
  boardSavesThisMonth: number;
  boardSavesMonthStart: Date;
  routineMinutesThisMonth?: number;
  routineMinutesMonthStart?: Date;
}

// Your new, specific usage limits
export const USAGE_LIMITS = {
  DRESS_TRYONS_WEEKLY: 3,
  INTERVIEW_QUESTIONS_WEEKLY: 5,
  BOARD_SAVES_MONTHLY: 10,
  WALK_ROUTINES_MONTHLY: 5,
  WALK_QUARTERS_MONTHLY: 12, // 12 x 15s = 3 minutes
  CALENDAR_EVENTS_TOTAL: 10,
} as const;

// --- Core Subscription and Usage Functions ---

export async function getUserSubscription(userId: string): Promise<UserSubscription | null> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('status')
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    if (error && error.code !== 'PGRST116') console.error('Error fetching subscription:', error);
    return null;
  }
  return { status: data.status as UserSubscription['status'] };
}

export function hasPremiumAccess(subscription: UserSubscription | null): boolean {
  return subscription?.status === 'premium' || subscription?.status === 'premium_code';
}

export async function getUserUsage(userId: string): Promise<UserUsage | null> {
    const { data, error } = await supabase
        .from('user_usage')
        .select('*')
        .eq('user_id', userId)
        .single();
    
    if (error && error.code !== 'PGRST116') {
        console.error('Error fetching usage:', error);
        return null;
    }

    // If no usage record exists, create one
    if (!data) {
        const { data: newData, error: createError } = await supabase
            .from('user_usage')
            .insert({ user_id: userId })
            .select()
            .single();
        
        if (createError) {
            console.error('Error creating usage record:', createError);
            return null;
        }
        return {
            dressTryOnsThisWeek: 0,
            dressTryOnsWeekStart: new Date(),
            interviewQuestionsThisWeek: 0,
            interviewQuestionsWeekStart: new Date(),
            boardSavesThisMonth: 0,
            boardSavesMonthStart: new Date(),
            routineMinutesThisMonth: 0,
            routineMinutesMonthStart: new Date(),
        };
    }

    const usage: UserUsage = {
        dressTryOnsThisWeek: data.dress_tryons_this_week ?? 0,
        dressTryOnsWeekStart: data.dress_tryons_week_start ? new Date(data.dress_tryons_week_start) : new Date(),
        interviewQuestionsThisWeek: data.interview_questions_this_week ?? 0,
        interviewQuestionsWeekStart: data.interview_questions_week_start ? new Date(data.interview_questions_week_start) : new Date(),
        boardSavesThisMonth: data.board_saves_this_month ?? 0,
        boardSavesMonthStart: data.board_saves_month_start ? new Date(data.board_saves_month_start) : new Date(),
        routineMinutesThisMonth: (data.routine_minutes_this_month ?? 0),
        routineMinutesMonthStart: data.routine_minutes_month_start ? new Date(data.routine_minutes_month_start) : new Date(),
    } as UserUsage;

    // Fallbacks for legacy columns if weekly columns are missing
    if ((data.interview_questions_this_week == null) && (data.interview_questions_today != null)) {
        (usage as any).interviewQuestionsThisWeek = data.interview_questions_today || 0;
        (usage as any).interviewQuestionsWeekStart = data.interview_questions_date ? new Date(data.interview_questions_date) : new Date();
    }
    if ((data.dress_tryons_this_week == null) && (data.dress_tryons_this_month != null)) {
        (usage as any).dressTryOnsThisWeek = data.dress_tryons_this_month || 0;
        (usage as any).dressTryOnsWeekStart = data.dress_tryons_month_start ? new Date(data.dress_tryons_month_start) : new Date();
    }

    return usage;
}

// --- Limit Enforcement Logic ---

type ActionType = 'dress_tryon' | 'interview_question' | 'board_save' | 'walk_routine' | 'calendar_event';

export async function canUserPerformAction(userId: string, action: ActionType, amount: number = 0): Promise<{ allowed: boolean; message?: string }> {
  const subscription = await getUserSubscription(userId);
  if (hasPremiumAccess(subscription)) {
    return { allowed: true };
  }

  const usage = await getUserUsage(userId);
  const now = new Date();

  switch (action) {
    case 'dress_tryon': {
      const weekStart = usage?.dressTryOnsWeekStart || now;
      if (now.getTime() - weekStart.getTime() > 7 * 24 * 60 * 60 * 1000) {
        await supabase.from('user_usage').update({ dress_tryons_this_week: 0, dress_tryons_week_start: now }).eq('user_id', userId);
        return { allowed: true };
      }
      return { allowed: (usage?.dressTryOnsThisWeek || 0) < USAGE_LIMITS.DRESS_TRYONS_WEEKLY };
    }

    case 'interview_question': {
        // Prefer weekly fields; fall back to daily legacy columns
        const hasWeekly = (usage as any).interviewQuestionsWeekStart != null;
        if (hasWeekly) {
          const weekStart = usage?.interviewQuestionsWeekStart || now;
          if (now.getTime() - weekStart.getTime() > 7 * 24 * 60 * 60 * 1000) {
              await supabase.from('user_usage').update({ interview_questions_this_week: 0, interview_questions_week_start: now }).eq('user_id', userId);
              return { allowed: true };
          }
          return { allowed: (usage?.interviewQuestionsThisWeek || 0) < USAGE_LIMITS.INTERVIEW_QUESTIONS_WEEKLY };
        } else {
          const { data } = await supabase
            .from('user_usage')
            .select('interview_questions_today, interview_questions_date')
            .eq('user_id', userId)
            .single();
          const date = data?.interview_questions_date ? new Date(data.interview_questions_date) : now;
          const sameDay = date.toDateString() === now.toDateString();
          const todayCount = sameDay ? (data?.interview_questions_today || 0) : 0;
          return { allowed: todayCount < USAGE_LIMITS.INTERVIEW_QUESTIONS_WEEKLY };
        }
    }

    case 'board_save': {
        const monthStart = usage?.boardSavesMonthStart || now;
        if (now.getMonth() !== monthStart.getMonth() || now.getFullYear() !== monthStart.getFullYear()) {
            await supabase.from('user_usage').update({ board_saves_this_month: 0, board_saves_month_start: now }).eq('user_id', userId);
            return { allowed: true };
        }
        return { allowed: (usage?.boardSavesThisMonth || 0) < USAGE_LIMITS.BOARD_SAVES_MONTHLY };
    }
      
    case 'walk_routine': {
      // Convert minutes to 15s quarters for limit check
      const minutes = Math.max(0, Math.floor(amount || 0));
      const quartersToAdd = Math.ceil(minutes * 4);

      // Prefer monthly counters; fall back to weekly legacy fields
      const hasMonthly = (usage as any).routineMinutesMonthStart != null;
      if (hasMonthly) {
        const monthStart = usage?.routineMinutesMonthStart || now;
        if (now.getMonth() !== monthStart.getMonth() || now.getFullYear() !== monthStart.getFullYear()) {
          await supabase.from('user_usage').update({ routine_minutes_this_month: 0, routine_minutes_month_start: now }).eq('user_id', userId);
          return { allowed: quartersToAdd <= USAGE_LIMITS.WALK_QUARTERS_MONTHLY };
        }
        const usedMinutes = usage?.routineMinutesThisMonth || 0;
        const usedQuarters = Math.ceil(usedMinutes * 4);
        return { allowed: usedQuarters + quartersToAdd <= USAGE_LIMITS.WALK_QUARTERS_MONTHLY };
      } else {
        const { data } = await supabase
          .from('user_usage')
          .select('routine_minutes_this_week, routine_week_start')
          .eq('user_id', userId)
          .single();
        const weekStart = data?.routine_week_start ? new Date(data.routine_week_start) : now;
        const weekElapsedMs = now.getTime() - weekStart.getTime();
        const reset = weekElapsedMs > 7 * 24 * 60 * 60 * 1000;
        const usedMinutes = reset ? 0 : (data?.routine_minutes_this_week || 0);
        const usedQuarters = Math.ceil(usedMinutes * 4);
        return { allowed: usedQuarters + quartersToAdd <= USAGE_LIMITS.WALK_QUARTERS_MONTHLY };
      }
    }

    case 'calendar_event': {
      // This is a simple total count of active events
      const { count, error } = await supabase
        .from('calendar_events')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .eq('completed', false); // Only count non-completed events

      if (error) {
        console.error('Error counting calendar events:', error);
        return { allowed: false, message: 'Could not verify usage.' };
      }
      return { allowed: (count || 0) < USAGE_LIMITS.CALENDAR_EVENTS_TOTAL };
    }

    default:
      return { allowed: false, message: 'Invalid action type.' };
  }
}

// --- Middleware ---

// This middleware should be placed before any route that performs a limited action.
export function requireUsageLimit(action: ActionType) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Try to use attached user if a previous middleware already set it
    let user = (req as any).user;
    if (!user || !user.id) {
      // Fall back to extracting the user from the Authorization header
      try {
        user = await getAuthenticatedUser(req);
        (req as any).user = user;
      } catch (err) {
        return res.status(401).json({ error: 'Authentication required.' });
      }
    }

    const check = await canUserPerformAction(user.id, action);
    if (check.allowed) {
      // Attach action to request so we can track it after the request succeeds
      (req as any).usageInfo = { action };
      return next();
    } else {
      return res.status(403).json({ 
        error: 'Usage limit exceeded.', 
        message: check.message || 'You have reached the limit for this feature on the Basic plan.'
      });
    }
  };
}

// This middleware should be placed AFTER the main logic of a limited route.
// It increments the usage counter only if the request was successful.
export function trackUsageAfterAction() {
  // Ensure usage increments only after the main handler completes successfully (2xx/3xx)
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    const usageInfo = (req as any).usageInfo;

    if (!user || !user.id || !usageInfo) return next();

    const action = usageInfo.action as ActionType;
    const minutes = usageInfo.minutes as number;

    const incrementCounters = async () => {
      try {
        if (action === 'dress_tryon' || action === 'interview_question' || action === 'board_save') {
          // Map logical action to DB column
          const columnMap: Record<string, string> = {
            'dress_tryon': 'dress_tryons_this_week',
            'interview_question': 'interview_questions_this_week',
            'board_save': 'board_saves_this_month',
          };
          const column = columnMap[action];

          // Fetch current counters
          const { data, error } = await supabase
            .from('user_usage')
            .select('*')
            .eq('user_id', user.id)
            .single();

          if (error && error.code !== 'PGRST116') {
            console.error(`Failed to select user_usage for ${action}:`, error);
            return;
          }

          const now = new Date();
          const fields: any = {};

          if (!data) {
            // Initialize with the first increment
            if (action === 'dress_tryon') {
              fields.dress_tryons_this_week = 1;
              fields.dress_tryons_week_start = now;
            } else if (action === 'interview_question') {
              fields.interview_questions_this_week = 1;
              fields.interview_questions_week_start = now;
            } else if (action === 'board_save') {
              fields.board_saves_this_month = 1;
              fields.board_saves_month_start = now;
            }
          } else {
            // Increment appropriate field; do boundary resets lazily in canUserPerformAction
            if (action === 'dress_tryon') {
              fields.dress_tryons_this_week = (data.dress_tryons_this_week || 0) + 1;
              fields.dress_tryons_week_start = data.dress_tryons_week_start || now;
            } else if (action === 'interview_question') {
              fields.interview_questions_this_week = (data.interview_questions_this_week || 0) + 1;
              fields.interview_questions_week_start = data.interview_questions_week_start || now;
            } else if (action === 'board_save') {
              fields.board_saves_this_month = (data.board_saves_this_month || 0) + 1;
              fields.board_saves_month_start = data.board_saves_month_start || now;
            }
          }

          const { error: upsertError } = await supabase.from('user_usage').upsert({ user_id: user.id, ...fields }, { onConflict: 'user_id' });
          if (upsertError) {
            console.error(`user_usage upsert error for ${action}:`, upsertError);
            // Fallback for legacy daily interview columns
            if (action === 'interview_question') {
              const { data: daily, error: selErr } = await supabase
                .from('user_usage')
                .select('interview_questions_today, interview_questions_date')
                .eq('user_id', user.id)
                .single();
              if (!selErr) {
                const now = new Date();
                const sameDay = daily?.interview_questions_date && new Date(daily.interview_questions_date).toDateString() === now.toDateString();
                const updated = sameDay ? (daily?.interview_questions_today || 0) + 1 : 1;
                const { error: fallbackErr } = await supabase.from('user_usage').upsert({
                  user_id: user.id,
                  interview_questions_today: updated,
                  interview_questions_date: sameDay ? daily?.interview_questions_date : now,
                }, { onConflict: 'user_id' });
                if (fallbackErr) console.error('Fallback daily interview increment error:', fallbackErr);
              }
            }
          }
        } else if (action === 'walk_routine') {
          const minutes = (usageInfo.minutes as number) || 1;
          const { data, error } = await supabase
            .from('user_usage')
            .select('routine_minutes_this_month, routine_minutes_month_start')
            .eq('user_id', user.id)
            .single();

          if (!error) {
            const now = new Date();
            let fields: any = {};
            if (!data || !data.routine_minutes_month_start || new Date(data.routine_minutes_month_start).getMonth() !== now.getMonth() || new Date(data.routine_minutes_month_start).getFullYear() !== now.getFullYear()) {
              fields = { routine_minutes_this_month: minutes, routine_minutes_month_start: now };
            } else {
              fields = { routine_minutes_this_month: (data.routine_minutes_this_month || 0) + minutes };
            }
            await supabase.from('user_usage').upsert({ user_id: user.id, ...fields }, { onConflict: 'user_id' });
          }
        }
      } catch (err) {
        console.error('trackUsageAfterAction increment error:', err);
      }
    };

    // Only increment after we know the outcome
    res.on('finish', () => {
      // For dress try-on, count all attempts except auth failures
      const shouldIncrement = action === 'dress_tryon' ? 
        // Only exclude auth failures (401/403) and rate limit (429)
        ![401, 403, 429].includes(res.statusCode) : 
        // For other actions, only count successes
        res.statusCode >= 200 && res.statusCode < 300;
      if (shouldIncrement) {
        console.log(`[Usage Tracking] Incrementing ${action} usage (status: ${res.statusCode})`);
        // fire and forget
        incrementCounters();
      }
    });

    return next();
  };
}

// --- Premium Code Functions ---

export async function validatePremiumCode(code: string): Promise<{ valid: boolean; message?: string }> {
  const { data, error } = await supabase
    .from('premium_codes')
    .select('id, usage_limit, used_count, expires_at')
    .eq('code', code.toUpperCase())
    .eq('is_active', true)
    .single();

  if (error || !data) {
    return { valid: false, message: 'Invalid or inactive code.' };
  }
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return { valid: false, message: 'This code has expired.' };
  }
  if (data.usage_limit && data.used_count >= data.usage_limit) {
    return { valid: false, message: 'This code has reached its usage limit.' };
  }

  return { valid: true };
}
