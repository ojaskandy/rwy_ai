import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Crown, Clock, Settings, Sparkles } from 'lucide-react';
import { useSubscription } from '@/hooks/use-subscription';
import { Link } from 'wouter';

interface SubscriptionWidgetProps {
  compact?: boolean;
  showUpgradeButton?: boolean;
}

export default function SubscriptionWidget({ compact = false, showUpgradeButton = true }: SubscriptionWidgetProps) {
  const { subscription, usage, limits, isPremium, isLoading, createBillingPortal } = useSubscription();

  const handleManageBilling = async () => {
    try {
      const { url } = await createBillingPortal();
      window.location.href = url;
    } catch (error) {
      console.error('Failed to open billing portal:', error);
    }
  };

  const getUsageColor = (current: number, limit: number) => {
    const percentage = (current / limit) * 100;
    if (percentage >= 90) return 'text-red-600 bg-red-100';
    if (percentage >= 70) return 'text-orange-600 bg-orange-100';
    return 'text-green-600 bg-green-100';
  };

  const getProgressColor = (current: number, limit: number) => {
    const percentage = (current / limit) * 100;
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-orange-500';
    return 'bg-green-500';
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="p-4">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-2 bg-gray-200 rounded"></div>
            <div className="h-2 bg-gray-200 rounded w-3/4"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <Badge 
          variant={isPremium ? "default" : "secondary"}
          className={isPremium ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white" : ""}
        >
          {isPremium ? (
            <><Crown className="w-3 h-3 mr-1" /> Premium</>
          ) : (
            'Basic'
          )}
        </Badge>
        
        {!isPremium && usage && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              📌 {usage.boardSavesThisWeek}/{limits.boardSavesWeekly}
            </div>
            <div className="flex items-center gap-1">
              ⏱️ {usage.routineMinutesThisWeek}/{limits.routineMinutesWeekly}m
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isPremium ? (
                <Crown className="w-5 h-5 text-yellow-600" />
              ) : (
                <Sparkles className="w-5 h-5 text-gray-500" />
              )}
              <h3 className="font-semibold text-gray-800">
                {isPremium ? 'Premium Account' : 'Basic Account'}
              </h3>
            </div>
            
            <div className="flex items-center gap-2">
              {isPremium && subscription?.stripeSubscriptionId && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleManageBilling}
                  className="text-xs"
                >
                  <Settings className="w-3 h-3 mr-1" />
                  Manage
                </Button>
              )}
              
              {showUpgradeButton && !isPremium && (
                <Link href="/pricing">
                  <Button size="sm" className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white">
                    <Crown className="w-3 h-3 mr-1" />
                    Upgrade
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* Premium Status */}
          {isPremium ? (
            <div className="p-3 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg border border-pink-100">
              <div className="flex items-center gap-2 text-sm">
                <Sparkles className="w-4 h-4 text-pink-600" />
                <span className="text-pink-700 font-medium">
                  Unlimited access to all features
                </span>
              </div>
              {subscription?.currentPeriodEnd && (
                <p className="text-xs text-pink-600 mt-1">
                  {subscription.cancelAtPeriodEnd ? 'Expires' : 'Renews'} on{' '}
                  {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                </p>
              )}
            </div>
          ) : (
            /* Usage Indicators for Basic Users */
            <div className="space-y-3">
              {usage && (
                <>
                  {/* Board Saves */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        📌 Board Saves
                      </span>
                      <Badge 
                        variant="secondary" 
                        className={getUsageColor(usage.boardSavesThisWeek, limits.boardSavesWeekly)}
                      >
                        {usage.boardSavesThisWeek}/{limits.boardSavesWeekly}
                      </Badge>
                    </div>
                    <div className="relative">
                      <Progress 
                        value={(usage.boardSavesThisWeek / limits.boardSavesWeekly) * 100} 
                        className="h-2"
                      />
                      <div 
                        className={`absolute top-0 left-0 h-2 rounded-full transition-all ${
                          getProgressColor(usage.boardSavesThisWeek, limits.boardSavesWeekly)
                        }`}
                        style={{ width: `${Math.min((usage.boardSavesThisWeek / limits.boardSavesWeekly) * 100, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Routine Minutes */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        ⏱️ Routine Minutes
                      </span>
                      <Badge 
                        variant="secondary" 
                        className={getUsageColor(usage.routineMinutesThisWeek, limits.routineMinutesWeekly)}
                      >
                        {usage.routineMinutesThisWeek}/{limits.routineMinutesWeekly}
                      </Badge>
                    </div>
                    <div className="relative">
                      <Progress 
                        value={(usage.routineMinutesThisWeek / limits.routineMinutesWeekly) * 100} 
                        className="h-2"
                      />
                      <div 
                        className={`absolute top-0 left-0 h-2 rounded-full transition-all ${
                          getProgressColor(usage.routineMinutesThisWeek, limits.routineMinutesWeekly)
                        }`}
                        style={{ width: `${Math.min((usage.routineMinutesThisWeek / limits.routineMinutesWeekly) * 100, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Interview Questions */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        🎤 Interview Questions
                      </span>
                      <Badge 
                        variant="secondary" 
                        className={getUsageColor(usage.interviewQuestionsToday, limits.interviewQuestionsDaily)}
                      >
                        {usage.interviewQuestionsToday}/{limits.interviewQuestionsDaily}
                      </Badge>
                    </div>
                    <div className="relative">
                      <Progress 
                        value={(usage.interviewQuestionsToday / limits.interviewQuestionsDaily) * 100} 
                        className="h-2"
                      />
                      <div 
                        className={`absolute top-0 left-0 h-2 rounded-full transition-all ${
                          getProgressColor(usage.interviewQuestionsToday, limits.interviewQuestionsDaily)
                        }`}
                        style={{ width: `${Math.min((usage.interviewQuestionsToday / limits.interviewQuestionsDaily) * 100, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Dress Try-ons */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        👗 Dress Try-ons
                      </span>
                      <Badge 
                        variant="secondary" 
                        className={getUsageColor(usage.dressTryOnsThisMonth, limits.dressTryOnsMonthly)}
                      >
                        {usage.dressTryOnsThisMonth}/{limits.dressTryOnsMonthly}
                      </Badge>
                    </div>
                    <div className="relative">
                      <Progress 
                        value={(usage.dressTryOnsThisMonth / limits.dressTryOnsMonthly) * 100} 
                        className="h-2"
                      />
                      <div 
                        className={`absolute top-0 left-0 h-2 rounded-full transition-all ${
                          getProgressColor(usage.dressTryOnsThisMonth, limits.dressTryOnsMonthly)
                        }`}
                        style={{ width: `${Math.min((usage.dressTryOnsThisMonth / limits.dressTryOnsMonthly) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Upgrade Prompt */}
              <div className="pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-2">
                  Upgrade for unlimited access to all features
                </p>
                <Link href="/pricing">
                  <Button size="sm" className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white">
                    <Crown className="w-3 h-3 mr-1" />
                    Upgrade to Premium
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}