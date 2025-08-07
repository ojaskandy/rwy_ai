import { useLocation } from 'wouter';
import { useSubscription } from '../hooks/use-subscription';
import { Button } from './ui/button';
import { Tooltip } from './ui/tooltip';
import { useEffect, useMemo, useState } from 'react';

interface UsageLimit {
  current: number;
  limit: number;
  label: string;
}

export function UsageTracker() {
  const [, setLocation] = useLocation();
  const { subscription, usage, limits: defaultLimits } = useSubscription();
  const [limits, setLimits] = useState<UsageLimit[]>([]);

  useEffect(() => {
    if (!subscription || subscription.status === 'premium') return;
    const computed: UsageLimit[] = [
      { current: usage?.dressTryOnsThisWeek || 0, limit: defaultLimits.dressTryOnsWeekly, label: 'Dress Try-ons' },
      { current: usage?.interviewQuestionsThisWeek || 0, limit: defaultLimits.interviewQuestionsWeekly, label: 'Interview Questions' },
      { current: usage?.boardSavesThisMonth || 0, limit: defaultLimits.boardSavesMonthly, label: 'Board Saves' },
    ];
    setLimits(computed);
  }, [subscription, usage, defaultLimits]);

  if (!subscription || subscription.status === 'premium') {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 max-sm:top-2 max-sm:right-2 bg-white/90 dark:bg-gray-800/90 p-3 sm:p-4 rounded-lg shadow-lg backdrop-blur-sm border border-gray-200 dark:border-gray-700 z-50">
      <div className="space-y-2">
        {limits.map((limit, index) => (
          <div key={index} className="flex items-center justify-between gap-3 sm:gap-4 text-xs sm:text-sm">
            <span className="text-gray-700 dark:text-gray-300">{limit.label}:</span>
            <span className={`font-semibold ${limit.current >= limit.limit ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
              {limit.current} / {limit.limit}
            </span>
          </div>
        ))}
        <Tooltip content="Upgrade to Premium for unlimited access">
          <Button onClick={() => setLocation('/pricing')} size="sm" className="w-full mt-1 sm:mt-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
            <img src="/rwyai_favicon.png" alt="Upgrade" className="w-4 h-4 mr-2" />
            Upgrade
          </Button>
        </Tooltip>
      </div>
    </div>
  );
}