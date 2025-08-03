import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';

const onboardingSteps = [
  {
    id: 1,
    title: 'What is the exact title you are training to win?',
    type: 'text',
    placeholder: 'e.g., Miss Universe, Miss Teen USA, Miss California',
    variable: 'end_goal'
  },
  {
    id: 2,
    title: 'How many pageants have you competed in?',
    type: 'choice',
    options: [
      'Zero, I\'m just starting out.',
      '1-3, I\'m learning the ropes.',
      '4+, I\'m a seasoned competitor.'
    ],
    variable: 'experience_level'
  },
  {
    id: 3,
    title: 'To win [end_goal], which of these needs the most work right now?',
    type: 'choice',
    options: [
      'My Onstage Walk & Presence',
      'My Interview & Q&A Skills',
      'My Overall Prep & Scheduling',
      'My Wardrobe & Styling'
    ],
    variable: 'focus_area'
  },
  {
    id: 4,
    title: 'When is your next competition?',
    type: 'choice',
    options: [
      'Less than 1 month',
      '1-3 months',
      '3-6 months',
      'I haven\'t scheduled one yet'
    ],
    variable: 'timeline'
  },
  {
    id: 5,
    title: 'Winning [end_goal] is a launchpad. What is the main thing the crown unlocks for you?',
    type: 'choice',
    options: [
      'A platform for my social cause',
      'A career in modeling or entertainment',
      'Scholarships and academic opportunities',
      'The confidence to take on any challenge'
    ],
    variable: 'motivation'
  },
  {
    id: 6,
    title: 'A single hour with a top-tier pageant coach can cost over $250. How are you getting that level of expertise?',
    type: 'choice',
    options: [
      'I\'m currently working with a coach.',
      'I\'m looking for the right coach.',
      'I\'m learning from free sources (YouTube, etc.).',
      'I\'m just using LLMs (ChatGPT, Gemini, etc)',
      'I\'m not sure where to start.'
    ],
    variable: 'coach_status'
  }
];



export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [textInput, setTextInput] = useState('');


  const handleStepAnswer = (answer: string) => {
    const currentStepData = onboardingSteps[currentStep];
    const newAnswers = { ...answers };
    newAnswers[currentStepData.variable] = answer;
    setAnswers(newAnswers);
    setTextInput('');
    
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Move to final inspiration step
      setCurrentStep(onboardingSteps.length);
    }
  };

  const handleTextSubmit = () => {
    if (textInput.trim()) {
      handleStepAnswer(textInput.trim());
    }
  };



  const currentStepData = onboardingSteps[currentStep];
  const progress = ((currentStep + 1) / (onboardingSteps.length + 1)) * 100;

  // Replace placeholders in title with user's answers
  const getProcessedTitle = (title: string) => {
    let processedTitle = title;
    if (answers.end_goal) {
      processedTitle = processedTitle.replace('[end_goal]', answers.end_goal);
    }
    return processedTitle;
  };

  // Map focus area to corresponding feature
  const getMappedFeature = (focusArea?: string) => {
    switch (focusArea) {
      case 'My Onstage Walk & Presence':
        return 'Live Routine Coach';
      case 'My Interview & Q&A Skills':
        return 'Interview Simulator';
      case 'My Wardrobe & Styling':
        return 'Virtual Dress Try-On';
      case 'My Overall Prep & Scheduling':
        return 'Competition Calendar';
      default:
        return 'Personalized Training Tool';
    }
  };

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
              {getProcessedTitle(currentStepData.title)}
            </h1>
            
            {currentStepData.type === 'text' ? (
              /* Text Input */
              <div className="max-w-lg mx-auto">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="mb-6"
                >
                  <input
                    type="text"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder={currentStepData.placeholder}
                    className="w-full bg-white text-gray-800 border border-gray-300 focus:border-pink-400 focus:ring-2 focus:ring-pink-200 px-6 py-4 rounded-2xl text-lg font-medium transition-all duration-300 shadow-sm focus:shadow-md outline-none"
                    onKeyPress={(e) => e.key === 'Enter' && handleTextSubmit()}
                  />
                </motion.div>
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleTextSubmit}
                  disabled={!textInput.trim()}
                  className="bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:from-pink-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed px-8 py-3 rounded-xl text-lg font-semibold transition-all duration-300"
                >
                  Continue
                </motion.button>
              </div>
            ) : (
              /* Multiple Choice */
              <div className="space-y-4 max-w-lg mx-auto">
                {currentStepData.options?.map((option, index) => (
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
            )}
          </motion.div>
        ) : (
          /* Dynamic Landing Page */
          <motion.div
            key="conversion"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-6xl mx-auto"
          >
            {/* Personalized Headline */}
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-12 leading-tight">
              Your Game Plan for {answers.end_goal || 'Your Pageant Goal'} is Ready.
            </h1>
            
            {/* Diagnostic Summary */}
            <div className="bg-gray-50 rounded-3xl p-8 mb-12 border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Your Goal</h3>
                  <p className="text-lg font-bold text-gray-800">{answers.end_goal || 'Your Pageant Goal'}</p>
                </div>
                <div className="text-center">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Your Timeline</h3>
                  <p className="text-lg font-bold text-gray-800">{answers.timeline || 'Your Timeline'}</p>
                </div>
                <div className="text-center">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Primary Focus</h3>
                  <p className="text-lg font-bold text-gray-800">{answers.focus_area || 'Your Focus Area'}</p>
                </div>
              </div>
            </div>

            {/* First Mission */}
            <div className="bg-white rounded-3xl p-8 mb-12 border border-pink-200 shadow-lg">
              <h2 className="text-3xl font-bold text-gray-800 mb-6">
                Your First Mission: Master Your {answers.focus_area || 'Focus Area'}
              </h2>
              <p className="text-xl text-gray-600 mb-6 max-w-4xl mx-auto leading-relaxed">
                Based on your timeline, the single most impactful thing you can do right now is improve your {answers.focus_area || 'focus area'}. 
                We'll start you with our AI-powered <span className="font-semibold text-pink-600">{getMappedFeature(answers.focus_area)}</span> to see immediate improvement.
              </p>
            </div>

            {/* Pricing Cards */}
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-gray-800 mb-8">Choose Your Training Intensity</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                
                {/* Premium Plan - Highlighted */}
                <div className="relative bg-white rounded-3xl p-8 border-4 border-pink-500 shadow-xl">
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-pink-500 text-white px-6 py-2 rounded-full text-sm font-semibold">Most Popular</span>
                  </div>
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">Premium Plan</h3>
                    <div className="text-4xl font-bold text-pink-600 mb-2">$29.99<span className="text-lg text-gray-500">/month</span></div>
                    <p className="text-gray-600">Everything you need to compete at the highest level.</p>
                  </div>
                  <ul className="space-y-3 mb-8 text-left">
                    <li className="flex items-center text-gray-700">
                      <span className="text-green-500 mr-3">✅</span>
                      AI {getMappedFeature(answers.focus_area)}: Your priority training tool
                    </li>
                    <li className="flex items-center text-gray-700">
                      <span className="text-green-500 mr-3">✅</span>
                      Unlimited AI Walk Analysis
                    </li>
                    <li className="flex items-center text-gray-700">
                      <span className="text-green-500 mr-3">✅</span>
                      Unlimited Interview Practice
                    </li>
                    <li className="flex items-center text-gray-700">
                      <span className="text-green-500 mr-3">✅</span>
                      Virtual Dress Try-On
                    </li>
                    <li className="flex items-center text-gray-700">
                      <span className="text-green-500 mr-3">✅</span>
                      Personalized Prep Calendar
                    </li>
                    <li className="flex items-center text-gray-700">
                      <span className="text-green-500 mr-3">✅</span>
                      Access to All Creator Content
                    </li>
                  </ul>
                  <button className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white py-4 rounded-2xl text-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl">
                    Start My 7-Day Free Trial
                  </button>
                </div>

                {/* Elite Plan */}
                <div className="bg-white rounded-3xl p-8 border border-gray-300 shadow-lg">
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">Elite Plan</h3>
                    <div className="text-4xl font-bold text-gray-800 mb-2">$49.99<span className="text-lg text-gray-500">/month</span></div>
                    <p className="text-gray-600">For contestants who need every possible edge.</p>
                  </div>
                  <ul className="space-y-3 mb-8 text-left">
                    <li className="flex items-center text-gray-700">
                      <span className="text-green-500 mr-3">✅</span>
                      Everything in Premium
                    </li>
                    <li className="flex items-center text-gray-700">
                      <span className="text-green-500 mr-3">✅</span>
                      1-on-1 Session with an Expert Coach
                    </li>
                    <li className="flex items-center text-gray-700">
                      <span className="text-green-500 mr-3">✅</span>
                      Direct Feedback from Champions
                    </li>
                  </ul>
                  <button className="w-full bg-gray-800 hover:bg-gray-900 text-white py-4 rounded-2xl text-lg font-semibold transition-all duration-300">
                    Upgrade to Elite
                  </button>
                </div>
              </div>
            </div>

            {/* Credibility Anchor */}
            <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-3xl p-8 mb-12">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="flex-shrink-0">
                  <img 
                    src="/arshia_kathpalia_champion.jpg" 
                    alt="Arshia Kathpalia" 
                    className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                  />
                </div>
                <div className="text-left">
                  <h4 className="text-xl font-bold text-gray-800 mb-2">Arshia Kathpalia, Miss Teen India USA 2024</h4>
                  <blockquote className="text-lg text-gray-700 italic leading-relaxed">
                    "I trained on these exact principles to win my crown. Runway AI gives you that same elite strategy, 24/7. 
                    This is the unfair advantage you've been looking for."
                  </blockquote>
                </div>
              </div>
            </div>

            {/* Final CTA */}
            <div className="text-center">
              <button className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-12 py-4 text-xl font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 mb-4">
                Start My Free 7-Day Trial
              </button>
              <p className="text-gray-500 text-sm">Full access. Cancel anytime. No questions asked.</p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}