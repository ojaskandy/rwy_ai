import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Check, ArrowRight, ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';

export default function PricingDetails() {
  const [isYearly, setIsYearly] = useState(true);
  
  // Feature comparison data with more detailed descriptions
  const featureComparison = [
    { 
      feature: "Q&A Practice", 
      freeTier: "5/week", 
      premiumTier: "Unlimited",
      description: "Practice answering pageant questions with AI feedback on your delivery, content, and presentation."
    },
    { 
      feature: "Walk Analysis", 
      freeTier: "5/month", 
      premiumTier: "100/month",
      description: "Get detailed feedback on your runway walk with posture analysis, movement fluidity scoring, and personalized improvement tips."
    },
    { 
      feature: "Virtual Try-ons", 
      freeTier: "3/week", 
      premiumTier: "75/week",
      description: "Try on different dresses and outfits virtually to find your perfect look before purchasing."
    },
    { 
      feature: "Talent Feedback", 
      freeTier: "Not included", 
      premiumTier: "Unlimited",
      description: "Receive comprehensive feedback on your talent performances with specific improvement suggestions from AI judges."
    },
    { 
      feature: "AI Coach", 
      freeTier: "Not included", 
      premiumTier: "Unlimited",
      description: "Get 24/7 access to your personal AI pageant coach for guidance, motivation, and strategic advice."
    },
    { 
      feature: "Inspiration Board", 
      freeTier: "10/month", 
      premiumTier: "Unlimited",
      description: "Save and organize inspiration for your pageant journey including poses, outfits, makeup looks, and more."
    },
    { 
      feature: "Smart Calendar", 
      freeTier: "10/year", 
      premiumTier: "Unlimited",
      description: "Manage your pageant schedule with AI-powered reminders, preparation timelines, and competition tracking."
    },
    { 
      feature: "Priority Support", 
      freeTier: "Not included", 
      premiumTier: "Included",
      description: "Get priority access to our support team for any questions or issues you may encounter."
    },
    { 
      feature: "Early Access to Features", 
      freeTier: "Not included", 
      premiumTier: "Included",
      description: "Be the first to try new features and tools before they're released to all users."
    },
  ];

  // Testimonials from pageant contestants
  const testimonials = [
    {
      name: "Sophia R.",
      title: "Miss Teen California Finalist",
      quote: "Runway AI transformed my pageant preparation. The walk analysis helped me perfect my posture and the Q&A practice gave me the confidence to shine on stage.",
      avatar: "https://i.pravatar.cc/100?img=1"
    },
    {
      name: "Madison T.",
      title: "Miss Junior America Winner",
      quote: "The virtual try-ons saved me thousands of dollars on dresses that wouldn't have worked. I found my perfect gown and the judges loved it!",
      avatar: "https://i.pravatar.cc/100?img=5"
    },
    {
      name: "Olivia K.",
      title: "State Pageant Contestant",
      quote: "Having an AI coach available 24/7 made all the difference in my preparation. The personalized feedback helped me improve faster than I ever thought possible.",
      avatar: "https://i.pravatar.cc/100?img=9"
    }
  ];

  // FAQ items
  const faqItems = [
    {
      question: "Can I cancel my premium subscription anytime?",
      answer: "Yes, you can cancel your premium subscription at any time. Your premium features will remain active until the end of your billing period."
    },
    {
      question: "Is there a free trial for premium features?",
      answer: "We offer limited access to premium features on our free tier so you can experience the value before upgrading. You can also use a premium code if you have one."
    },
    {
      question: "How does the billing work?",
      answer: "You can choose between monthly or yearly billing. Yearly subscriptions offer a 20% discount compared to monthly billing."
    },
    {
      question: "Can I share my account with others?",
      answer: "Each subscription is for individual use only. Sharing accounts is not permitted and may result in account suspension."
    },
    {
      question: "Do you offer refunds?",
      answer: "We offer a 7-day money-back guarantee if you're not satisfied with your premium subscription."
    }
  ];

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-pink-50 via-white to-purple-50 overflow-hidden">
      {/* Header */}
      <header className="py-6 px-6 flex justify-between items-center max-w-7xl mx-auto">
        <Link href="/welcome">
          <Button variant="ghost" className="flex items-center gap-2 text-gray-700 hover:text-pink-600">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Button>
        </Link>
        <div className="flex items-center">
          <img 
            src="/rwyai_favicon.png" 
            alt="Runway AI Logo" 
            className="h-8 w-8 mr-2" 
          />
          <span className="font-bold text-lg bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
            Runway AI
          </span>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Main Heading */}
        <div className="text-center mb-16">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-5xl md:text-6xl font-bold mb-6"
          >
            <span className="bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
              Elevate Your Pageant Journey
            </span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl text-gray-700 max-w-3xl mx-auto"
          >
            Choose the perfect plan to transform your pageant preparation and performance.
          </motion.p>
        </div>

        {/* Pricing Toggle */}
        <div className="flex items-center justify-center mb-12">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center bg-white rounded-full p-1.5 shadow-md border border-pink-100"
          >
            <button
              onClick={() => setIsYearly(false)}
              className={`px-6 py-2 rounded-full text-base font-medium transition-all ${
                !isYearly ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg' : 'text-gray-600'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsYearly(true)}
              className={`px-6 py-2 rounded-full text-base font-medium transition-all ${
                isYearly ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg' : 'text-gray-600'
              }`}
            >
              Yearly
            </button>
            {isYearly && (
              <div className="ml-3 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                Save 20%
              </div>
            )}
          </motion.div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-20">
          {/* Free Tier */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200"
          >
            <div className="p-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Free</h3>
              <p className="text-gray-600 mb-6">Basic tools to start your journey</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-800">$0</span>
                <span className="text-gray-500">/forever</span>
              </div>
              <Link href="/auth">
                <Button 
                  className="w-full py-6 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-lg font-medium"
                >
                  Get Started
                </Button>
              </Link>
            </div>
            <div className="bg-gray-50 p-8">
              <h4 className="font-medium text-gray-700 mb-4">Included features:</h4>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-600">Limited Q&A practice (5/week)</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-600">Basic walk analysis (5/month)</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-600">Limited virtual try-ons (3/week)</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-600">Basic inspiration board (10/month)</span>
                </li>
              </ul>
            </div>
          </motion.div>

          {/* Premium Tier */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-2xl shadow-xl overflow-hidden border border-pink-200 relative"
          >
            <div className="absolute top-0 right-0 bg-gradient-to-r from-pink-500 to-purple-500 text-white text-sm font-bold py-1 px-4 rounded-bl-lg">
              MOST POPULAR
            </div>
            <div className="p-8 pt-12">
              <h3 className="text-2xl font-bold mb-2">
                <span className="bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                  Premium
                </span>
              </h3>
              <p className="text-gray-600 mb-6">Complete toolkit for pageant success</p>
              <div className="mb-6">
                <span className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                  ${isYearly ? '10' : '15'}
                </span>
                <span className="text-gray-500">/month</span>
                {isYearly && <p className="text-sm text-gray-500 mt-1">Billed annually (${10 * 12})</p>}
              </div>
              <Link href="/pricing">
                <Button 
                  className="w-full py-6 rounded-xl text-lg font-medium relative overflow-hidden group"
                  style={{
                    background: "linear-gradient(135deg, #f72585 0%, #b5179e 25%, #7209b7 50%, #560bad 75%, #480ca8 100%)",
                  }}
                >
                  <span className="relative z-10 text-white">Upgrade Now</span>
                  <ArrowRight className="ml-2 relative z-10 text-white" />
                  
                  {/* Button Hover Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </Button>
              </Link>
            </div>
            <div className="bg-white/50 backdrop-blur-sm p-8">
              <h4 className="font-medium text-gray-700 mb-4">Everything in Free, plus:</h4>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-pink-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700"><strong>Unlimited</strong> Q&A practice sessions</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-pink-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700"><strong>100/month</strong> detailed walk analyses</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-pink-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700"><strong>Unlimited</strong> talent performance feedback</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-pink-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700"><strong>24/7</strong> access to AI pageant coach</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-pink-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Priority support & early feature access</span>
                </li>
              </ul>
            </div>
          </motion.div>
        </div>

        {/* Detailed Feature Comparison */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mb-20"
        >
          <h2 className="text-3xl font-bold text-center mb-10">
            <span className="bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              Detailed Feature Comparison
            </span>
          </h2>
          
          <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
            <div className="grid grid-cols-12 font-bold text-lg bg-gray-50 border-b border-gray-200">
              <div className="col-span-6 p-4 text-gray-700">Feature</div>
              <div className="col-span-3 p-4 text-center text-gray-700">Free</div>
              <div className="col-span-3 p-4 text-center">
                <span className="bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                  Premium
                </span>
              </div>
            </div>

            {featureComparison.map((row, index) => (
              <div key={index} className="grid grid-cols-12 border-b border-gray-100">
                <div className="col-span-6 p-4">
                  <h4 className="font-medium text-gray-800 mb-1">{row.feature}</h4>
                  <p className="text-sm text-gray-600">{row.description}</p>
                </div>
                <div className="col-span-3 p-4 flex items-center justify-center">
                  <span className={`text-center ${row.freeTier === "Not included" ? "text-gray-400" : "text-gray-700"}`}>
                    {row.freeTier === "Not included" ? (
                      <span className="flex items-center justify-center">
                        <span className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                        </span>
                      </span>
                    ) : row.freeTier}
                  </span>
                </div>
                <div className="col-span-3 p-4 flex items-center justify-center">
                  <span className="text-center font-medium text-gray-800">
                    {row.premiumTier === "Included" ? (
                      <span className="w-6 h-6 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </span>
                    ) : row.premiumTier}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Testimonials */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mb-20"
        >
          <h2 className="text-3xl font-bold text-center mb-10">
            <span className="bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              Success Stories
            </span>
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                <div className="flex items-center mb-4">
                  <img 
                    src={testimonial.avatar} 
                    alt={testimonial.name} 
                    className="w-12 h-12 rounded-full object-cover mr-4 border-2 border-pink-200"
                  />
                  <div>
                    <h4 className="font-bold text-gray-800">{testimonial.name}</h4>
                    <p className="text-sm text-pink-600">{testimonial.title}</p>
                  </div>
                </div>
                <p className="text-gray-700 italic">"{testimonial.quote}"</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="mb-20"
        >
          <h2 className="text-3xl font-bold text-center mb-10">
            <span className="bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              Frequently Asked Questions
            </span>
          </h2>
          
          <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
            {faqItems.map((item, index) => (
              <div key={index} className={`border-b border-gray-100 ${index === faqItems.length - 1 ? 'border-b-0' : ''}`}>
                <details className="group">
                  <summary className="flex justify-between items-center p-6 cursor-pointer">
                    <h3 className="text-lg font-medium text-gray-800">{item.question}</h3>
                    <span className="ml-6 flex-shrink-0 text-gray-400 group-open:rotate-180 transition-transform">
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </span>
                  </summary>
                  <div className="px-6 pb-6 pt-0">
                    <p className="text-gray-700">{item.answer}</p>
                  </div>
                </details>
              </div>
            ))}
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-center"
        >
          <div className="bg-gradient-to-r from-pink-100 to-purple-100 rounded-2xl p-12 border border-pink-200 relative overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-pink-300/20 to-purple-300/20 rounded-full -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-pink-300/20 to-purple-300/20 rounded-full translate-y-1/2 -translate-x-1/2"></div>
            
            <h2 className="text-3xl md:text-4xl font-bold mb-6 relative z-10">Ready to elevate your pageant journey?</h2>
            <p className="text-lg text-gray-700 mb-8 max-w-2xl mx-auto relative z-10">
              Join thousands of pageant contestants who are using Runway AI to perfect their skills and win competitions.
            </p>
            <Link href="/pricing">
              <Button 
                className="px-10 py-6 text-xl font-bold rounded-xl relative overflow-hidden group"
                style={{
                  background: "linear-gradient(135deg, #f72585 0%, #b5179e 25%, #7209b7 50%, #560bad 75%, #480ca8 100%)",
                }}
              >
                <span className="relative z-10 text-white">Get Premium Now</span>
                <ArrowRight className="ml-2 relative z-10 text-white" />
                
                {/* Button Hover Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8 mt-20">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-gray-600 text-sm">
            Questions? Reach out to <a href="mailto:arshia.x.kathpalia@gmail.com" className="text-pink-600 underline">arshia.x.kathpalia@gmail.com</a> or <a href="mailto:okandy@uw.edu" className="text-pink-600 underline">okandy@uw.edu</a> anytime.
          </p>
          <p className="text-gray-500 text-xs mt-4">
            © {new Date().getFullYear()} Runway AI. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
