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
      <AlertDialogContent className="bg-gradient-to-br from-pink-50 to-white border-0 rounded-3xl max-w-[90vw] w-[380px] sm:max-w-md mx-auto p-8 shadow-xl relative overflow-hidden backdrop-blur-sm fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-pink-100/30 to-white/40 pointer-events-none" style={{ borderRadius: 'inherit' }}></div>
        <div className="absolute -inset-1 bg-gradient-to-t from-transparent to-white/20 pointer-events-none" style={{ borderRadius: 'inherit' }}></div>
        <AlertDialogHeader className="text-center">
          <AlertDialogTitle className="text-3xl font-bold mb-3 text-gray-900 relative z-10">
            Join the Winners' Circle <span className="inline-block ml-1">👑</span>
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center mt-6 relative z-10">
            <div className="text-lg font-medium text-gray-800 mb-3">
              See yourself crowned on stage. 
              <div className="text-xl font-bold text-pink-600 py-2">93% of users upgrade to Premium</div>
            </div>
            <div className="mt-5 text-base text-gray-700">
              You've reached your limit of {limit} {limitType.toLowerCase()} per {timePeriod}.
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col gap-4 mt-8">
          <AlertDialogAction asChild>
            <Button
              onClick={() => window.location.href = '/pricing'}
              className="w-full py-6 text-lg font-semibold rounded-xl bg-gradient-to-r from-pink-400 to-pink-500 text-white hover:from-pink-500 hover:to-pink-600 shadow-md transition-all duration-200 hover:shadow-lg relative z-10 overflow-hidden group"
            >
              <span className="absolute inset-0 w-full h-full bg-gradient-to-b from-white/20 to-transparent opacity-70"></span>
              <span className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/10 to-transparent"></span>
              <span className="absolute top-0 left-1/4 w-2/4 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent"></span>
              <span className="relative z-10">Upgrade Now</span>
            </Button>
          </AlertDialogAction>
          <AlertDialogCancel 
            onClick={onClose}
            className="w-full border-0 bg-transparent text-pink-400 hover:text-pink-600 hover:bg-transparent font-medium text-base relative z-10"
          >
            Maybe Later
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
