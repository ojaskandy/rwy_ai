import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link } from 'wouter';
import { Check, Star, Crown, Sparkles, Zap, Target, Heart, Trophy, Gift, ArrowRight } from 'lucide-react';
import { useSubscription } from '@/hooks/use-subscription';
import { useAuth } from '@/hooks/use-auth';

// Feature component for consistent styling
const Feature = ({ children, isPremium = false }: { children: React.ReactNode; isPremium?: boolean }) => (
  <motion.li 
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.5 }}
    className="flex items-center gap-3"
  >
    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${isPremium ? 'bg-gradient-to-r from-pink-500 to-purple-600' : 'bg-gray-200'}`}>
      <Check className={`w-4 h-4 ${isPremium ? 'text-white' : 'text-gray-600'}`} />
    </div>
    <span className="text-gray-700 font-medium">{children}</span>
  </motion.li>
);

export default function Pricing() {
  const [isYearly, setIsYearly] = useState(true);
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [code, setCode] = useState('');
  const [codeLoading, setCodeLoading] = useState(false);
  const [codeMessage, setCodeMessage] = useState('');
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  
  const { user } = useAuth();
  const { isPremium, applyCode, createCheckoutSession } = useSubscription();

  const basicFeatures = [
    "3 AI coaching sessions per month",
    "Basic walk analysis",
    "Community access",
    "Standard support"
  ];

  const premiumFeatures = [
    "Unlimited AI coaching sessions",
    "Advanced walk & posture analysis",
    "Personalized interview practice",
    "Virtual dress try-on",
    "Competition calendar & prep",
    "Premium inspiration board",
    "Priority support",
    "Exclusive masterclasses",
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
    <div className="min-h-screen w-full bg-gray-50 overflow-hidden">
      {/* Animated Background */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <motion.div
          animate={{
            background: [
              'radial-gradient(ellipse 80% 80% at 20% 20%, rgba(236, 72, 153, 0.1), transparent)',
              'radial-gradient(ellipse 80% 80% at 80% 30%, rgba(139, 92, 246, 0.1), transparent)',
              'radial-gradient(ellipse 80% 80% at 30% 80%, rgba(59, 130, 246, 0.1), transparent)',
              'radial-gradient(ellipse 80% 80% at 20% 20%, rgba(236, 72, 153, 0.1), transparent)',
            ],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            repeatType: "mirror",
          }}
          className="absolute inset-0"
        />
      </div>

      <div className="relative z-10 px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto text-center"
        >
          <h1 className="text-5xl md:text-7xl font-extrabold mb-4 tracking-tighter">
            <span className="bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
              Choose Your Crown Path
            </span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            Every queen deserves the perfect training. Pick the path that matches your ambition.
          </p>

          {/* Toggle */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="inline-flex items-center justify-center bg-gray-100 p-1 rounded-full gap-2 mb-12"
          >
            <Button
              onClick={() => setIsYearly(false)}
              variant="ghost"
              className={`rounded-full px-6 py-2 transition-all text-base font-semibold ${!isYearly ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Monthly
            </Button>
            <Button
              onClick={() => setIsYearly(true)}
              variant="ghost"
              className={`rounded-full px-6 py-2 transition-all text-base font-semibold ${isYearly ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Yearly
            </Button>
            <AnimatePresence>
            {isYearly && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold whitespace-nowrap"
              >
                Save 20%
              </motion.div>
            )}
            </AnimatePresence>
          </motion.div>
        </motion.div>

        {/* Pricing Cards */}
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 items-stretch max-w-4xl mx-auto">
            {/* Basic Plan */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              whileHover={{ y: -5 }}
              className="bg-white rounded-3xl p-8 shadow-lg border border-gray-200 flex flex-col"
            >
              <div className="text-left mb-8">
                <div className="inline-flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full mb-4">
                  <Target className="w-5 h-5 text-gray-600" />
                  <span className="font-semibold text-gray-700">Basic</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-1">Get Started</h3>
                <p className="text-gray-500">Perfect for exploring pageant training.</p>
              </div>

              <div className="text-left mb-8">
                <div className="text-4xl font-extrabold text-gray-800 mb-1">FREE</div>
                <p className="text-gray-500">Limited access to core features.</p>
              </div>

              <ul className="space-y-4 mb-8 flex-grow">
                {basicFeatures.map((feature) => <Feature key={feature}>{feature}</Feature>)}
              </ul>

              <Button 
                onClick={() => window.location.href = '/app'}
                size="lg"
                className="w-full bg-gray-800 hover:bg-gray-900 text-white text-lg font-semibold rounded-xl"
              >
                Start For Free
              </Button>
            </motion.div>

            {/* Premium Plan */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              whileHover={{ y: -5 }}
              className="relative rounded-3xl p-8 border-2 border-pink-500 bg-white shadow-2xl flex flex-col"
            >
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-5 py-2 rounded-full text-sm font-bold shadow-lg flex items-center gap-2">
                  <Crown className="w-4 h-4" />
                  MOST POPULAR
                </div>
              </div>

              <div className="text-left mb-8">
                <div className="inline-flex items-center gap-2 bg-pink-100 text-pink-700 px-3 py-1 rounded-full mb-4">
                  <Crown className="w-5 h-5" />
                  <span className="font-semibold">Premium</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-1">Crown Yourself</h3>
                <p className="text-gray-500">The complete pageant mastery experience.</p>
              </div>

              <div className="text-left mb-8">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={isYearly ? 'yearly' : 'monthly'}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    {isYearly ? (
                      <>
                        <span className="text-5xl font-extrabold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">$96</span>
                        <span className="text-xl font-medium text-gray-500 ml-2">/year</span>
                        <p className="text-gray-500 mt-1">$8/month, billed yearly</p>
                      </>
                    ) : (
                      <>
                        <span className="text-5xl font-extrabold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">$10</span>
                        <span className="text-xl font-medium text-gray-500 ml-2">/month</span>
                         <p className="text-gray-500 mt-1">Billed monthly</p>
                      </>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              <ul className="space-y-4 mb-8 flex-grow">
                {premiumFeatures.map((feature) => <Feature key={feature} isPremium>{feature}</Feature>)}
                 <Feature isPremium>
                  <span className="font-bold">And much more...</span>
                </Feature>
              </ul>

              <Button 
                onClick={() => handleUpgrade(isYearly ? 'yearly' : 'monthly')}
                disabled={upgradeLoading || isPremium}
                size="lg"
                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white text-lg font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:opacity-50"
              >
                {isPremium ? 'You are Premium' : upgradeLoading ? 'Processing...' : 'Claim Your Crown'}
                {!isPremium && <ArrowRight className="w-5 h-5 ml-2" />}
              </Button>

              <div className="text-center mt-4 text-green-700 text-sm font-semibold">
                30-day money-back guarantee
              </div>
            </motion.div>
          </div>
        </div>

        {/* Premium Code Section */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-center mt-16"
        >
          {!showCodeInput ? (
            <Button
              variant="link"
              onClick={() => setShowCodeInput(true)}
              className="text-gray-600 hover:text-pink-600 text-base"
            >
              <Gift className="w-4 h-4 mr-2" />
              Have a premium code?
            </Button>
          ) : (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="max-w-md mx-auto space-y-3 p-6 bg-white rounded-2xl shadow-md border"
            >
              <p className="font-semibold text-gray-800">Enter your code for premium access.</p>
              <div className="flex gap-2">
                <Input
                  placeholder="Your premium code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  onKeyPress={(e) => e.key === 'Enter' && handleApplyCode()}
                  disabled={codeLoading}
                  className="flex-1"
                />
                <Button
                  onClick={handleApplyCode}
                  disabled={codeLoading || !code.trim()}
                  className="bg-gray-800 hover:bg-gray-900 text-white"
                >
                  {codeLoading ? 'Applying...' : 'Apply'}
                </Button>
              </div>
              <AnimatePresence>
              {codeMessage && (
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={`text-sm font-semibold ${
                  codeMessage.includes('🎉') ? 'text-green-600' : 'text-red-600'
                }`}>
                  {codeMessage}
                </motion.p>
              )}
              </AnimatePresence>
            </motion.div>
          )}
        </motion.div>
        
        {/* Footer */}
        <div className="text-center mt-16 text-gray-500 text-sm">
          Questions? Contact us at{' '}
          <a href="mailto:arshia.x.kathpalia@gmail.com" className="text-pink-600 hover:underline">
            arshia.x.kathpalia@gmail.com
          </a>
        </div>
      </div>
    </div>
  );
}