import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { Check, Star, Crown, Sparkles, Zap, Target, Heart, Trophy } from 'lucide-react';

export default function Pricing() {
  const [isYearly, setIsYearly] = useState(true);

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
    "One-on-one mentorship calls",
    "Custom training plans",
    "Advanced analytics & insights",
    "Competition strategy guidance"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-200/30 via-purple-200/30 to-blue-200/30"></div>
        
        {/* Floating Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-pink-300/20 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -30, 0],
                opacity: [0.2, 0.8, 0.2],
                scale: [1, 2, 1],
              }}
              transition={{
                duration: 4 + Math.random() * 3,
                repeat: Infinity,
                delay: Math.random() * 3,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 px-6 py-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto"
          >
            <h1 className="text-6xl md:text-7xl font-black mb-6 leading-tight">
              <span className="bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                Choose Your
              </span>
              <br />
              <span className="text-gray-800">
                Crown Path
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
              Every queen deserves the perfect training. Pick the path that matches your ambition.
            </p>

            {/* Yearly/Monthly Toggle */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="flex items-center justify-center gap-4 mb-16"
            >
              <span className={`text-lg font-medium ${!isYearly ? 'text-gray-800' : 'text-gray-500'}`}>
                Monthly
              </span>
              <button
                onClick={() => setIsYearly(!isYearly)}
                className={`relative w-16 h-8 rounded-full transition-all duration-300 ${
                  isYearly ? 'bg-gradient-to-r from-pink-500 to-purple-600' : 'bg-gray-300'
                }`}
              >
                <div
                  className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg transition-all duration-300 ${
                    isYearly ? 'translate-x-9' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className={`text-lg font-medium ${isYearly ? 'text-gray-800' : 'text-gray-500'}`}>
                Yearly
              </span>
              {isYearly && (
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold"
                >
                  Save 20%
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="relative px-6 pb-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            
            {/* Basic Plan */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              whileHover={{ scale: 1.02 }}
              className="relative"
            >
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-gray-200 h-full">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-full mb-4">
                    <Target className="w-5 h-5 text-gray-600" />
                    <span className="font-semibold text-gray-700">Basic</span>
                  </div>
                  <h3 className="text-3xl font-bold text-gray-800 mb-2">Get Started</h3>
                  <p className="text-gray-600 mb-6">Perfect for beginners exploring pageant training</p>
                  
                  <div className="text-4xl font-black text-gray-800 mb-2">
                    FREE
                  </div>
                  <p className="text-gray-500">Limited access</p>
                </div>

                <ul className="space-y-4 mb-8">
                  {basicFeatures.map((feature, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-gray-500 flex-shrink-0" />
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link href="/app">
                  <Button className="w-full bg-gray-600 hover:bg-gray-700 text-white py-4 text-lg font-semibold rounded-2xl transition-all duration-300">
                    Start Free
                  </Button>
                </Link>
              </div>
            </motion.div>

            {/* Premium Plan */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              whileHover={{ scale: 1.05 }}
              className="relative"
            >
              {/* Premium Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-pink-400/20 via-purple-400/20 to-blue-400/20 rounded-3xl blur-2xl scale-110"></div>
              
              {/* Most Popular Badge */}
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg flex items-center gap-2">
                  <Crown className="w-4 h-4" />
                  MOST POPULAR
                  <Crown className="w-4 h-4" />
                </div>
              </div>

              <div className="relative bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 rounded-3xl p-8 shadow-2xl border-2 border-pink-200 h-full">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-100 to-purple-100 px-4 py-2 rounded-full mb-4">
                    <Crown className="w-5 h-5 text-pink-600" />
                    <span className="font-semibold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">Premium</span>
                  </div>
                  <h3 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-2">
                    Crown Yourself
                  </h3>
                  <p className="text-gray-700 mb-6">The complete pageant mastery experience</p>
                  
                  <div className="mb-4">
                    {isYearly ? (
                      <div>
                        <div className="text-5xl font-black bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-1">
                          $96
                        </div>
                        <div className="text-gray-500 line-through text-lg mb-1">$120/year</div>
                        <p className="text-gray-600">$8/month, billed yearly</p>
                      </div>
                    ) : (
                      <div>
                        <div className="text-5xl font-black bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-2">
                          $10
                        </div>
                        <p className="text-gray-600">per month</p>
                      </div>
                    )}
                  </div>

                  <div className="bg-gradient-to-r from-pink-100 to-purple-100 rounded-2xl p-4 mb-6">
                    <div className="flex items-center justify-center gap-2 text-pink-700">
                      <Sparkles className="w-5 h-5" />
                      <span className="font-semibold">Everything you need to win</span>
                      <Sparkles className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {premiumFeatures.map((feature, index) => (
                    <motion.li 
                      key={index} 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 + index * 0.05 }}
                      className="flex items-center gap-3"
                    >
                      <div className="w-6 h-6 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-gray-700 font-medium">{feature}</span>
                    </motion.li>
                  ))}
                </ul>

                <Link href="/app">
                  <Button className="w-full bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 hover:from-pink-600 hover:via-purple-600 hover:to-blue-600 text-white py-4 text-lg font-bold rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02]">
                    <Crown className="w-5 h-5 mr-2" />
                    Claim Your Crown
                    <Trophy className="w-5 h-5 ml-2" />
                  </Button>
                </Link>

                {/* Guarantee Badge */}
                <div className="text-center mt-6">
                  <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-semibold">
                    <Heart className="w-4 h-4" />
                    30-day money-back guarantee
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Footer */}
          <div className="text-center mt-16 text-gray-500 text-sm">
            Questions? Contact us at{' '}
            <a href="mailto:arshia.x.kathpalia@gmail.com" className="text-pink-600 hover:text-pink-700">
              arshia.x.kathpalia@gmail.com
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}