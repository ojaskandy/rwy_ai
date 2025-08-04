import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Crown, Clock, Sparkles, Gift, X } from 'lucide-react';
import { useSubscription } from '@/hooks/use-subscription';
import { Link } from 'wouter';

interface UpgradePromptProps {
  isOpen: boolean;
  onClose: () => void;
  feature: string;
  currentUsage: number;
  limit: number;
  resetDate?: Date;
  onUpgrade?: () => void;
}

export default function UpgradePrompt({ 
  isOpen, 
  onClose, 
  feature, 
  currentUsage, 
  limit, 
  resetDate,
  onUpgrade 
}: UpgradePromptProps) {
  const { applyCode, createCheckoutSession } = useSubscription();
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [code, setCode] = useState('');
  const [codeLoading, setCodeLoading] = useState(false);
  const [codeMessage, setCodeMessage] = useState('');
  const [upgradeLoading, setUpgradeLoading] = useState(false);

  const getFeatureIcon = () => {
    switch (feature.toLowerCase()) {
      case 'board save':
      case 'board_save':
        return '📌';
      case 'routine minute':
      case 'routine_minute':
        return '⏱️';
      case 'interview question':
      case 'interview_question':
        return '🎤';
      case 'dress tryon':
      case 'dress_tryon':
        return '👗';
      default:
        return '✨';
    }
  };

  const formatResetTime = (date?: Date) => {
    if (!date) return '';
    
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    
    if (diff <= 0) return 'Soon';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h`;
    
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${minutes}m`;
  };

  const handleApplyCode = async () => {
    if (!code.trim()) return;
    
    setCodeLoading(true);
    setCodeMessage('');
    
    try {
      const result = await applyCode(code.trim());
      
      if (result.success) {
        setCodeMessage('🎉 Premium access activated!');
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setCodeMessage(result.error || 'Invalid code');
      }
    } catch (error) {
      setCodeMessage('Failed to apply code');
    } finally {
      setCodeLoading(false);
    }
  };

  const handleUpgrade = async (planType: 'monthly' | 'yearly') => {
    setUpgradeLoading(true);
    
    try {
      const { url } = await createCheckoutSession(planType);
      window.location.href = url;
    } catch (error) {
      console.error('Failed to create checkout session:', error);
      setUpgradeLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <span className="text-2xl">{getFeatureIcon()}</span>
              Limit Reached
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Usage Status */}
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-800 mb-2">
              {currentUsage}/{limit}
            </div>
            <p className="text-gray-600">
              You've used all your {feature.toLowerCase()} quota
            </p>
            {resetDate && (
              <div className="flex items-center justify-center gap-2 mt-2 text-sm text-gray-500">
                <Clock className="w-4 h-4" />
                Resets in {formatResetTime(resetDate)}
              </div>
            )}
          </div>

          {/* Upgrade Options */}
          <div className="space-y-3">
            <div className="text-center text-sm text-gray-600 mb-4">
              Upgrade to Premium for unlimited access
            </div>

            {/* Premium Plans */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => handleUpgrade('yearly')}
                disabled={upgradeLoading}
                className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white relative overflow-hidden"
              >
                <div className="flex flex-col items-center text-xs">
                  <Crown className="w-4 h-4 mb-1" />
                  <span className="font-semibold">Yearly</span>
                  <span>$96/year</span>
                  <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 mt-1">
                    Save 20%
                  </Badge>
                </div>
              </Button>

              <Button
                onClick={() => handleUpgrade('monthly')}
                disabled={upgradeLoading}
                variant="outline"
                className="border-pink-200 hover:bg-pink-50"
              >
                <div className="flex flex-col items-center text-xs">
                  <Sparkles className="w-4 h-4 mb-1" />
                  <span className="font-semibold">Monthly</span>
                  <span>$12/month</span>
                </div>
              </Button>
            </div>

            {/* Code Input Toggle */}
            <div className="text-center">
              {!showCodeInput ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCodeInput(true)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <Gift className="w-4 h-4 mr-2" />
                  Have a code?
                </Button>
              ) : (
                <AnimatePresence>
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-3"
                  >
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter premium code"
                        value={code}
                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                        onKeyPress={(e) => e.key === 'Enter' && handleApplyCode()}
                        disabled={codeLoading}
                        className="flex-1"
                      />
                      <Button
                        onClick={handleApplyCode}
                        disabled={codeLoading || !code.trim()}
                        size="sm"
                      >
                        {codeLoading ? 'Applying...' : 'Apply'}
                      </Button>
                    </div>
                    {codeMessage && (
                      <p className={`text-sm ${
                        codeMessage.includes('🎉') ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {codeMessage}
                      </p>
                    )}
                  </motion.div>
                </AnimatePresence>
              )}
            </div>

            {/* Alternative Actions */}
            <div className="text-center space-y-2 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                Or continue with limited access
              </p>
              <div className="flex gap-2 justify-center">
                <Link href="/pricing">
                  <Button variant="ghost" size="sm" className="text-xs">
                    View All Plans
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="text-xs"
                >
                  Continue
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}