import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, Sparkles, Crown } from 'lucide-react';

const PaymentSuccessPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handlePaymentSuccess = async () => {
      const sessionId = searchParams.get('session_id');
      
      if (!sessionId) {
        setError('No payment session found');
        setIsProcessing(false);
        return;
      }

      try {
        // Confirm payment with backend and update user status
        await apiRequest('POST', '/api/mark-paid', {
          sessionId: sessionId,
        });

        // Show success message
        toast({
          title: 'Payment Successful! 🎉',
          description: 'Welcome to CoachT! Your martial arts journey begins now.',
        });

        // Wait a moment for the user to see the success state, then redirect
        setTimeout(() => {
          window.location.href = '/app';
        }, 2000);

      } catch (error) {
        console.error('Failed to confirm payment:', error);
        setError('Failed to confirm your payment. Please contact support.');
        setIsProcessing(false);
        
        toast({
          title: 'Payment Confirmation Error',
          description: 'Your payment went through, but we couldn\'t confirm it. Please contact support.',
          variant: 'destructive',
        });
      }
    };

    handlePaymentSuccess();
  }, [searchParams, toast]);

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center relative p-4">
        <div className="absolute inset-0 bg-gradient-to-br from-red-900/20 via-black to-orange-900/20" />
        
        <div className="relative z-10 text-center max-w-md mx-auto">
          <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">⚠️</span>
          </div>
          
          <h1 className="text-2xl font-bold text-white mb-4">
            Payment Confirmation Issue
          </h1>
          
          <p className="text-gray-300 mb-6">
            {error}
          </p>
          
          <button
            onClick={() => window.location.href = '/app'}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-xl transition-all"
          >
            Continue to App
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center relative p-4">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-red-900/20 via-black to-orange-900/20" />
      
      <div className="relative z-10 text-center max-w-lg mx-auto">
        {/* Success Animation */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ 
            type: "spring", 
            stiffness: 260, 
            damping: 20,
            delay: 0.2 
          }}
          className="w-24 h-24 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/25"
        >
          <CheckCircle className="w-12 h-12 text-white" />
        </motion.div>

        {/* Success Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h1 className="text-3xl font-bold text-white mb-4">
            Payment Successful! 🎉
          </h1>
          
          <p className="text-gray-300 text-lg mb-6 leading-relaxed">
            Welcome to CoachT! Your martial arts journey begins now. We're setting up your account and redirecting you to the app.
          </p>
        </motion.div>

        {/* Features Preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="space-y-3 mb-8"
        >
          <div className="flex items-center justify-center gap-3 text-sm text-gray-300">
            <Crown className="w-4 h-4 text-yellow-500" />
            <span>Full AI Coaching Access Unlocked</span>
          </div>
          <div className="flex items-center justify-center gap-3 text-sm text-gray-300">
            <Sparkles className="w-4 h-4 text-blue-500" />
            <span>Real-time Pose Analysis Available</span>
          </div>
          <div className="flex items-center justify-center gap-3 text-sm text-gray-300">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span>Progress Tracking Enabled</span>
          </div>
        </motion.div>

        {/* Loading State */}
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="flex items-center justify-center gap-3 text-gray-400"
          >
            <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
            <span>Setting up your account...</span>
          </motion.div>
        )}

        {/* Manual Continue Button (in case auto-redirect fails) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 3 }}
          className="mt-8"
        >
          <button
            onClick={() => window.location.href = '/app'}
            className="text-gray-400 hover:text-white text-sm underline transition-colors"
          >
            Continue manually →
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default PaymentSuccessPage; 