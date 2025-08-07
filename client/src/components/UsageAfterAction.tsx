import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/use-auth';

type UsagePayload = {
  usage: {
    dressTryOnsThisWeek: number;
    interviewQuestionsThisWeek: number;
    boardSavesThisMonth: number;
  } | null;
  limits: {
    DRESS_TRYONS_WEEKLY: number;
    INTERVIEW_QUESTIONS_WEEKLY: number;
    BOARD_SAVES_MONTHLY: number;
  };
};

interface UsageAfterActionProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  focus?: 'dress' | 'interview' | 'board' | 'routine';
}

export default function UsageAfterAction({ open, onOpenChange, focus }: UsageAfterActionProps) {
  const { session } = useAuth();
  const [data, setData] = useState<UsagePayload | null>(null);

  useEffect(() => {
    if (!open || !session?.access_token) return;
    (async () => {
      try {
        const res = await fetch('/api/usage', { headers: { Authorization: `Bearer ${session.access_token}` } });
        const json = await res.json();
        setData(json);
      } catch {
        // ignore
      }
    })();
  }, [open, session?.access_token]);

  const counts = data?.usage || { dressTryOnsThisWeek: 0, interviewQuestionsThisWeek: 0, boardSavesThisMonth: 0 };
  const limits = data?.limits || { DRESS_TRYONS_WEEKLY: 3, INTERVIEW_QUESTIONS_WEEKLY: 5, BOARD_SAVES_MONTHLY: 10 };

  const rows = [
    { key: 'dress', label: 'Dress Try-ons (weekly)', current: counts.dressTryOnsThisWeek, limit: limits.DRESS_TRYONS_WEEKLY },
    { key: 'interview', label: 'Interview Questions (weekly)', current: counts.interviewQuestionsThisWeek, limit: limits.INTERVIEW_QUESTIONS_WEEKLY },
    { key: 'board', label: 'Board Saves (monthly)', current: counts.boardSavesThisMonth, limit: limits.BOARD_SAVES_MONTHLY },
  ] as const;

  const visible = focus ? rows.filter(r => r.key === focus) : rows;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white text-black">
        <DialogHeader>
          <DialogTitle className="text-gray-900">Usage</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {visible.map(row => (
            <div key={row.key} className="flex items-center justify-between">
              <span>{row.label}</span>
              <span className="font-semibold">{row.current} / {row.limit}</span>
            </div>
          ))}
          <div className="pt-2 text-sm text-gray-600">See full breakdown any time at Profile → Usage</div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


