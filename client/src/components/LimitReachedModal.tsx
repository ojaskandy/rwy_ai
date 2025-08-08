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
      <AlertDialogContent className="bg-white dark:bg-gray-900 max-w-[90vw] sm:max-w-lg mx-4 sm:mx-auto p-4 sm:p-6">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 justify-center sm:justify-start">
            <Crown className="text-yellow-500 w-5 h-5 sm:w-6 sm:h-6" />
            <span className="text-lg sm:text-xl">Upgrade to Premium</span>
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center sm:text-left mt-4">
            <div className="text-base text-gray-700 dark:text-gray-300">
              You've reached your limit of {limit} {limitType.toLowerCase()} per {timePeriod} for the Basic plan.
            </div>
            <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
              Upgrade to Premium to get unlimited access and unlock all features.
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-3 mt-6">
          <AlertDialogCancel 
            onClick={onClose}
            className="w-full sm:w-auto order-2 sm:order-1"
          >
            Maybe Later
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              onClick={() => window.location.href = '/pricing'}
              className="w-full sm:w-auto order-1 sm:order-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:from-pink-600 hover:to-purple-700"
            >
              Upgrade Now
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
