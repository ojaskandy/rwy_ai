import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useSubscription } from '@/hooks/use-subscription';
import { Card } from '@/components/ui/card';

type UsageResponse = {
  usage: {
    dressTryOnsThisWeek: number;
    interviewQuestionsThisWeek: number;
    boardSavesThisMonth: number;
  } | null;
  limits: {
    DRESS_TRYONS_WEEKLY: number;
    INTERVIEW_QUESTIONS_WEEKLY: number;
    BOARD_SAVES_MONTHLY: number;
    WALK_MINUTES_MONTHLY?: number;
  };
};

export default function UsagePage() {
  const { session } = useAuth();
  const { subscription } = useSubscription();
  const [data, setData] = useState<UsageResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      if (!session?.access_token) return;
      try {
        const res = await fetch('/api/usage', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const json = await res.json();
        setData(json);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [session?.access_token]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FFC5D3' }}>
      <div className="max-w-3xl mx-auto p-4 sm:p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Usage</h1>
        <Card className="bg-white p-4 sm:p-6">
          {loading ? (
            <div className="text-gray-600">Loading...</div>
          ) : (
            <div className="space-y-4 text-gray-900">
              <div className="flex items-center justify-between">
                <span>Dress Try-ons (weekly)</span>
                <span className="font-semibold">
                  {data?.usage?.dressTryOnsThisWeek ?? 0} / {data?.limits.DRESS_TRYONS_WEEKLY}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Interview Questions (weekly)</span>
                <span className="font-semibold">
                  {data?.usage?.interviewQuestionsThisWeek ?? 0} / {data?.limits.INTERVIEW_QUESTIONS_WEEKLY}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Board Saves (monthly)</span>
                <span className="font-semibold">
                  {data?.usage?.boardSavesThisMonth ?? 0} / {data?.limits.BOARD_SAVES_MONTHLY}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Routine Minutes (monthly)</span>
                <span className="font-semibold">
                  {/* We don't have minutes yet server-side; show 0/x for now */}
                  0 / {data?.limits.WALK_MINUTES_MONTHLY ?? 3}
                </span>
              </div>
              <div className="pt-4">
                <a href="/pricing" className="inline-block bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white font-semibold px-4 py-2 rounded-lg shadow">
                  Get rid of limits
                </a>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}


