import { motion } from 'framer-motion';
import { Link } from 'wouter';
import { ArrowLeft, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PricingPreview() {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-pink-900 text-white">
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        {/* Back button */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <Link href="/welcome" className="inline-flex items-center text-pink-400 hover:text-pink-300 mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent">
                Premium Plans & Pricing
              </span>
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Choose the perfect plan for your pageant journey
            </p>
          </div>
        </motion.div>

        {/* Pricing comparison table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="bg-white/10 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/20 shadow-2xl mb-12"
        >
          <div className="grid grid-cols-3 font-bold text-lg border-b border-white/20">
            <div className="p-6 text-white">Feature</div>
            <div className="p-6 text-white">Free</div>
            {/* Premium with gradient text */}
            <div className="p-6">
              <span className="bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
                Premium
              </span>
            </div>
          </div>

          {/* Table Content */}
          {featureComparison.map((row, index) => (
            <div key={index} className="grid grid-cols-3 border-b border-white/10 last:border-b-0">
              <div className="p-6 font-medium text-white">{row.feature}</div>
              <div className="p-6 text-gray-300">{row.freeTier}</div>
              <div className="p-6 flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
                <span className="text-white">{row.premiumTier}</span>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Pricing Options */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="grid md:grid-cols-2 gap-6"
        >
          {/* Monthly Plan */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:border-pink-500/50 transition-all duration-300">
            <div className="mb-4">
              <h3 className="text-2xl font-bold text-white mb-1">Monthly Plan</h3>
              <p className="text-gray-300 text-sm">Perfect for short-term training</p>
            </div>
            <div className="mb-6">
              <div className="text-4xl font-bold text-white mb-1">$15<span className="text-xl font-normal text-gray-300">/month</span></div>
              <p className="text-gray-300 text-sm">Billed monthly</p>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-start">
                <Check className="w-5 h-5 text-green-400 mt-0.5 mr-3 flex-shrink-0" />
                <span className="text-gray-300">All premium features</span>
              </li>
              <li className="flex items-start">
                <Check className="w-5 h-5 text-green-400 mt-0.5 mr-3 flex-shrink-0" />
                <span className="text-gray-300">Cancel anytime</span>
              </li>
            </ul>
            <Link href="/auth">
              <Button className="w-full bg-pink-600 hover:bg-pink-700 text-white font-semibold">
                Start with Monthly
              </Button>
            </Link>
          </div>

          {/* Yearly Plan */}
          <div className="bg-gradient-to-br from-pink-600/20 via-purple-600/20 to-blue-600/20 rounded-2xl p-6 border border-pink-500/30 hover:border-pink-500/60 transition-all duration-300 relative overflow-hidden">
            {/* Best Value Tag */}
            <div className="absolute top-0 right-0 bg-gradient-to-r from-pink-600 to-purple-600 px-4 py-1 text-sm font-bold text-white transform translate-x-2 -translate-y-0 rotate-45 translate-y-6">
              SAVE 20%
            </div>
            
            <div className="mb-4">
              <h3 className="text-2xl font-bold text-white mb-1">Yearly Plan</h3>
              <p className="text-gray-300 text-sm">Best value for serious contestants</p>
            </div>
            <div className="mb-6">
              <div className="text-4xl font-bold text-white mb-1">$10<span className="text-xl font-normal text-gray-300">/month</span></div>
              <p className="text-gray-300 text-sm">Billed annually ($120/year)</p>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-start">
                <Check className="w-5 h-5 text-green-400 mt-0.5 mr-3 flex-shrink-0" />
                <span className="text-gray-300">All premium features</span>
              </li>
              <li className="flex items-start">
                <Check className="w-5 h-5 text-green-400 mt-0.5 mr-3 flex-shrink-0" />
                <span className="text-gray-300">Save 20% vs monthly plan</span>
              </li>
              <li className="flex items-start">
                <Check className="w-5 h-5 text-green-400 mt-0.5 mr-3 flex-shrink-0" />
                <span className="text-gray-300">Priority support</span>
              </li>
            </ul>
            <Link href="/auth">
              <Button className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold">
                Start with Yearly (Best Value)
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Additional information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="mt-12 text-center"
        >
          <p className="text-gray-300 mb-6">
            All plans include full access to our AI-powered coaching tools to help you excel in your pageant journey.
          </p>

          <Link href="/auth">
            <Button 
              className="bg-white text-black hover:bg-gray-100 px-8 py-4 text-lg font-semibold mx-auto"
            >
              Start Training Now
            </Button>
          </Link>
          
          <p className="text-gray-400 mt-4 text-sm">
            Questions about pricing? <a href="mailto:okandy@uw.edu" className="text-pink-400 hover:text-pink-300 underline">Contact us</a>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
