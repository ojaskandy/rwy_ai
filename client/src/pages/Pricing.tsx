import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, ArrowRight, X } from 'lucide-react';
import { useSubscription } from '@/hooks/use-subscription';
import { useAuth } from '@/hooks/use-auth';
import { useLocation } from 'wouter';
import ReferralModal from '@/components/ReferralModal';

export default function Pricing() {
  const [isYearly, setIsYearly] = useState(true);
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [code, setCode] = useState('');
  const [codeLoading, setCodeLoading] = useState(false);
  const [codeMessage, setCodeMessage] = useState('');
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [isButtonAnimating, setIsButtonAnimating] = useState(false);
  const [showSkipConfirmation, setShowSkipConfirmation] = useState(false);
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [pendingPlanType, setPendingPlanType] = useState<'monthly' | 'yearly' | null>(null);
  const [, setLocation] = useLocation();
  
  const { user, session } = useAuth();
  const { isPremium, applyCode, createCheckoutSession } = useSubscription();

  // Feature comparison data
  const featureComparison = [
    { feature: "Q&A Practice", freeTier: "5/wk", premiumTier: "Unlimited" },
    { feature: "Walk Analysis", freeTier: "5/mo", premiumTier: "100/mo" },
    { feature: "Virtual try-ons", freeTier: "3/wk", premiumTier: "75/wk" },
    { feature: "Talent Feedback", freeTier: "X", premiumTier: "Unlimited" },
    { feature: "AI Coach", freeTier: "X", premiumTier: "Unlimited" },
    { feature: "Inspo Save", freeTier: "10/mo", premiumTier: "Unlimited" },
    { feature: "Smart Calendar", freeTier: "10/yr", premiumTier: "Unlimited" },
  ];

  const handleApplyCode = async () => {
    if (!code.trim()) return;
    
    setCodeLoading(true);
    setCodeMessage('');
    
    try {
      const result = await applyCode(code.trim());
      
      if (result.success) {
        setCodeMessage('🎉 Premium access activated! Redirecting...');
        setTimeout(() => {
          window.location.href = '/app';
        }, 2000);
      } else {
        setCodeMessage(result.error || 'Invalid code. Please try again.');
      }
    } catch (error) {
      setCodeMessage('Failed to apply code. Please check your connection.');
    } finally {
      setCodeLoading(false);
    }
  };

  const handleUpgrade = async (planType: 'monthly' | 'yearly') => {
    if (!user) {
      window.location.href = '/auth';
      return;
    }
    
    // Store the plan type and show referral modal
    setPendingPlanType(planType);
    setShowReferralModal(true);
  };

  const proceedWithCheckout = async (creatorCode: string | null) => {
    if (!pendingPlanType) return;

    // Start button animation
    setIsButtonAnimating(true);
    setUpgradeLoading(true);
    
    try {
      // Save referral attribution if a creator was selected
      if (creatorCode && creatorCode !== 'other') {
        await fetch('/api/referral/attribute', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ creatorCode }),
        });
      }

      const { url } = await createCheckoutSession(pendingPlanType);
      // Wait a moment for the animation to complete
      setTimeout(() => {
        window.location.href = url;
      }, 800);
    } catch (error) {
      console.error('Failed to create checkout session:', error);
      setUpgradeLoading(false);
      setIsButtonAnimating(false);
    }
  };

  const handleSkip = () => {
    setShowSkipConfirmation(true);
  };

  const confirmSkip = () => {
    setShowSkipConfirmation(false);
    // Navigate to main app with free tier
    setLocation('/app');
  };

  const handleContact = () => {
    window.location.href = 'mailto:arshia.x.kathpalia@gmail.com,okandy@uw.edu';
  };

  return (
    <div className="min-h-screen w-full bg-white overflow-hidden flex flex-col justify-center items-center px-6 py-8">
      {/* Skip Button */}
      <div className="absolute top-2 right-2">
        <Button
          variant="ghost"
          onClick={handleSkip}
          className="text-gray-400 hover:text-gray-700 text-sm"
        >
          Skip
        </Button>
      </div>

      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold mb-3">
            <span className="bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent">
              Path to your Crown
            </span>
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Every queen deserves the perfect training.
          </p>
        </div>

        {/* Pricing Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
          <div className="divide-y divide-gray-200">
            {/* Table Header */}
            <div className="grid grid-cols-3 font-bold text-lg">
              <div className="p-3 text-gray-700">Feature</div>
              <div className="p-3 text-gray-700">Free</div>
              {/* Premium with gradient text */}
              <div className="p-3">
                <span className="bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent">
                  Premium
                </span>
              </div>
            </div>

            {/* Table Content */}
            {featureComparison.map((row, index) => (
              <div key={index} className="grid grid-cols-3">
                <div className="p-3 font-medium text-gray-700">{row.feature}</div>
                <div className="p-3 text-gray-500">{row.freeTier}</div>
                <div className="p-3 flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-gray-700">{row.premiumTier}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Pricing Card - SwingVision Style */}
        <div className="mb-6">
          <div className="rounded-2xl overflow-hidden">
            {/* Pricing Toggle */}
            <div className="flex items-center justify-center mb-5">
              <div className="inline-flex items-center bg-gray-100 rounded-full p-1">
                <button
                  onClick={() => setIsYearly(false)}
                  className={`px-5 py-1.5 rounded-full text-sm font-medium transition-all ${
                    !isYearly ? 'bg-white shadow-md text-gray-800' : 'text-gray-500'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setIsYearly(true)}
                  className={`px-5 py-1.5 rounded-full text-sm font-medium transition-all ${
                    isYearly ? 'bg-white shadow-md text-gray-800' : 'text-gray-500'
                  }`}
                >
                  Yearly
                </button>
                {isYearly && (
                  <div className="ml-2 bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
                    Save 20%
                  </div>
                )}
              </div>
            </div>

            {/* Pricing Box */}
            <div className="bg-pink-50 text-gray-800 rounded-xl p-4 relative overflow-hidden border border-pink-100">
              <div className="absolute top-0 right-0 bg-green-500 w-12 h-12 transform rotate-45 translate-x-6 -translate-y-6"></div>
              <div className="absolute top-2 right-2">
                <Check className="w-5 h-5 text-white" />
              </div>
              
              <div className="flex justify-between items-center py-1">
                <div>
                  <h3 className="text-2xl font-bold text-gray-800">Premium {isYearly ? 'Yearly' : 'Monthly'}</h3>
                  <p className="text-gray-600 text-sm">
                    {isYearly ? '12 Months at $10/mo' : 'Billed monthly'}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-bold text-pink-600">${isYearly ? '10' : '15'}</span>
                  <span className="text-xl text-gray-700">/mo</span>
                </div>
              </div>
            </div>
            
            {/* CTA Button with Amazing Animation */}
            <div className="relative mt-4 overflow-hidden rounded-xl">
              <button
                onClick={() => handleUpgrade(isYearly ? 'yearly' : 'monthly')}
                disabled={upgradeLoading || isPremium}
                className="w-full py-5 text-white text-lg font-bold rounded-xl flex items-center justify-center relative overflow-hidden"
                style={{
                  background: "linear-gradient(135deg, #f72585 0%, #b5179e 25%, #7209b7 50%, #560bad 75%, #480ca8 100%)",
                  boxShadow: "0 4px 20px rgba(123, 9, 183, 0.3)"
                }}
              >
                {isPremium ? 'You are Premium' : 
                  <div className="relative flex items-center justify-center w-full">
                    <span className="relative z-10">{upgradeLoading ? 'Processing...' : 'Start Now'}</span>
                    {!isPremium && !upgradeLoading && <ArrowRight className="ml-2 relative z-10" />}
                    
                    {/* Enhanced Animation */}
                    {isButtonAnimating && (
                      <>
                        {/* Full height wave with glow */}
                        <motion.div 
                          className="absolute inset-0"
                          initial={{ x: "-100%", opacity: 0.7 }}
                          animate={{ x: "100%" }}
                          transition={{ duration: 0.8, ease: "easeInOut" }}
                          style={{
                            background: "linear-gradient(90deg, transparent 0%, rgba(255,60,172,0.8) 50%, transparent 100%)",
                            height: "100%",
                            filter: "blur(15px)"
                          }}
                        />
                        
                        {/* Full height solid color wave */}
                        <motion.div 
                          className="absolute inset-0"
                          initial={{ x: "-100%" }}
                          animate={{ x: "100%" }}
                          transition={{ duration: 0.8, ease: "easeInOut", delay: 0.1 }}
                          style={{
                            background: "linear-gradient(90deg, transparent 0%, #f72585 40%, #f72585 60%, transparent 100%)",
                            height: "100%"
                          }}
                        />
                      </>
                    )}
                  </div>
                }
              </button>
            </div>
          </div>
        </div>

        {/* Premium Code Section */}
        <div className="text-center mt-2">
          {!showCodeInput ? (
            <button
              onClick={() => setShowCodeInput(true)}
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              Have a premium code?
            </button>
          ) : (
            <div className="max-w-md mx-auto space-y-3 p-4 bg-white rounded-xl shadow-md border mt-4">
              <p className="font-medium text-gray-800">Enter your code for premium access.</p>
              <div className="flex gap-2">
                <Input
                  placeholder="Your premium code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  onKeyPress={(e) => e.key === 'Enter' && handleApplyCode()}
                  disabled={codeLoading}
                  className="flex-1 text-gray-800 bg-gray-100 border-gray-300"
                />
                <Button
                  onClick={handleApplyCode}
                  disabled={codeLoading || !code.trim()}
                  className="bg-gray-800 hover:bg-gray-900 text-white"
                >
                  {codeLoading ? 'Applying...' : 'Apply'}
                </Button>
              </div>
              {codeMessage && (
                <p className={`text-sm font-medium ${
                  codeMessage.includes('🎉') ? 'text-green-600' : 'text-red-600'
                }`}>
                  {codeMessage}
                </p>
              )}
            </div>
          )}

          {/* Contact */}
          <div className="mt-4 text-sm text-gray-500">
            <button 
              onClick={handleContact}
              className="text-gray-700 hover:underline"
            >
              Questions? Contact us
            </button>
          </div>
        </div>
      </div>

      {/* Skip Confirmation Modal */}
      {showSkipConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold text-gray-800">Are you sure?</h3>
              <button 
                onClick={() => setShowSkipConfirmation(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="my-4 text-gray-700 space-y-3">
              <p><span className="text-pink-500 font-bold">95% of premium users</span> achieve higher competition scores.</p>
              <p>Premium members are <span className="text-pink-500 font-bold">3x more likely</span> to place in the top 3 of their competitions.</p>
              <p>You'll miss unlimited access to our most powerful AI coaching features.</p>
            </div>

            <div className="flex flex-col gap-3 mt-6">
              {/* Fixed button visibility */}
              <button
                onClick={confirmSkip}
                className="w-full py-3 border border-gray-300 bg-white hover:bg-gray-50 text-gray-800 font-medium rounded-xl"
              >
                Continue with Free Plan
              </button>
              <button
                onClick={() => setShowSkipConfirmation(false)}
                className="w-full py-3 text-white font-medium rounded-xl"
                style={{
                  background: "linear-gradient(135deg, #f72585 0%, #7209b7 50%, #560bad 100%)",
                }}
              >
                Go Premium
              </button>
            </div>
            
            <p className="text-center text-gray-500 text-sm mt-4">
              You can always upgrade to premium later in your account settings.
            </p>
          </div>
        </div>
      )}

      {/* Referral Modal */}
      <ReferralModal
        isOpen={showReferralModal}
        onClose={() => {
          setShowReferralModal(false);
          setUpgradeLoading(false);
          setIsButtonAnimating(false);
        }}
        onSelect={proceedWithCheckout}
      />
    </div>
  );
}