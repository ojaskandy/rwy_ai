import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';

const onboardingSteps = [
  {
    id: 1,
    title: 'How long have you been participating in pageants?',
    options: [
      '0 (just starting out)',
      'Less than 1 year',
      '1-3 years', 
      'More than 3 years'
    ]
  },
  {
    id: 2,
    title: 'What is your main goal with Runway AI?',
    options: [
      'Perfect my catwalk technique',
      'Improve my interview skills',
      'Find the perfect outfits',
      'Build overall confidence'
    ]
  },
  {
    id: 3,
    title: 'Which areas do you want to focus on most?',
    options: [
      'Posture and movement',
      'Speech and communication',
      'Style and fashion',
      'All of the above'
    ]
  }
];

const inspirationalTags = [
  'Confident', 'Radiant', 'Graceful', 'Unstoppable', 'Champion',
  'Brilliant', 'Inspiring', 'Elegant', 'Powerful', 'Queen',
  'Determined', 'Beautiful', 'Strong', 'Winner', 'Star'
];

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const handleStepAnswer = (answer: string) => {
    const newAnswers = [...answers];
    newAnswers[currentStep] = answer;
    setAnswers(newAnswers);
    
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Move to final inspiration step
      setCurrentStep(onboardingSteps.length);
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const currentStepData = onboardingSteps[currentStep];
  const progress = ((currentStep + 1) / (onboardingSteps.length + 1)) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-pink-100 flex flex-col items-center justify-center px-6">
      {/* Progress Bar */}
      <div className="w-full max-w-md mb-8">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Step {Math.min(currentStep + 1, onboardingSteps.length + 1)} of {onboardingSteps.length + 1}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <motion.div 
            className="bg-gradient-to-r from-pink-500 to-purple-600 h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      <div className="w-full max-w-2xl">
        {currentStep < onboardingSteps.length ? (
          /* Regular Questions */
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-12 leading-tight">
              {currentStepData.title}
            </h1>
            
            <div className="space-y-4 max-w-lg mx-auto">
              {currentStepData.options.map((option, index) => (
                <motion.button
                  key={option}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleStepAnswer(option)}
                  className="w-full bg-white text-gray-800 border border-gray-300 hover:border-pink-400 hover:bg-pink-50 px-6 py-4 rounded-2xl text-lg font-medium transition-all duration-300 shadow-sm hover:shadow-md"
                >
                  {option}
                </motion.button>
              ))}
            </div>
          </motion.div>
        ) : (
          /* Final Inspiration Step */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-8">
              You Are
            </h1>
            
            <p className="text-gray-600 text-lg mb-8">
              Select the words that describe you best
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-12">
              {inspirationalTags.map((tag, index) => (
                <motion.button
                  key={tag}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => toggleTag(tag)}
                  className={`px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                    selectedTags.includes(tag)
                      ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg'
                      : 'bg-white text-gray-700 border border-gray-300 hover:border-pink-400 hover:bg-pink-50'
                  }`}
                >
                  {tag}
                </motion.button>
              ))}
            </div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.5 }}
            >
              <Link href="/app">
                <Button className="bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:from-pink-600 hover:to-purple-700 px-12 py-6 text-2xl font-bold rounded-2xl shadow-xl transform hover:scale-105 transition-all duration-300">
                  🚀 Start Training Now
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}