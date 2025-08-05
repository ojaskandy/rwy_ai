import React from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Crown } from 'lucide-react';

interface LimitReachedModalProps {
  isOpen: boolean;
  onClose: () => void;
  limitType: string; // e.g., "Interview Questions"
  limit: number;
  timePeriod: string; // e.g., "day"
}

export const LimitReachedModal: React.FC<LimitReachedModalProps> = ({
  isOpen,
  onClose,
  limitType,
  limit,
  timePeriod,
}) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Crown className="text-yellow-500" />
            Upgrade to Premium
          </AlertDialogTitle>
          <AlertDialogDescription>
            You've reached your limit of {limit} {limitType.toLowerCase()} per {timePeriod} for the Basic plan.
            <br /><br />
            Upgrade to Premium to get unlimited access and unlock all features.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Maybe Later</AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              onClick={() => window.location.href = '/pricing'}
              className="bg-gradient-to-r from-pink-500 to-purple-600 text-white"
            >
              Upgrade Now
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
