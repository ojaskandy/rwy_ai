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
      'Onstage Walk & Presence',
      'Interview & Q&A Skills',
      'Overall Prep & Scheduling',
      'Wardrobe & Styling'
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
  const [chatOpen, setChatOpen] = useState(false);


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
      case 'Onstage Walk & Presence':
        return 'Live Routine Coach';
      case 'Interview & Q&A Skills':
        return 'Interview Simulator';
      case 'Wardrobe & Styling':
        return 'Virtual Dress Try-On';
      case 'Overall Prep & Scheduling':
        return 'Competition Calendar';
      default:
        return 'Personalized Training Tool';
    }
  };

  // Get timeline-based message
  const getTimelineMessage = (timeline?: string) => {
    switch (timeline) {
      case 'Less than 1 month':
        return 'quickly';
      case '1-3 months':
        return 'over the next few months';
      case '3-6 months':
        return 'with plenty of time to perfect your skills';
      default:
        return 'at your own pace';
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
          /* Minimal Start Now Page */
          <motion.div
            key="conversion"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-2xl mx-auto relative"
          >
            {/* Big Beautiful Start Now Button */}
            <div className="mb-16">
              <Link href="/app">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-gradient-to-r from-pink-400 to-pink-600 hover:from-pink-500 hover:to-pink-700 text-white px-16 py-6 text-3xl font-bold rounded-3xl shadow-2xl transition-all duration-300 transform hover:shadow-3xl"
                >
                  Start Now
                </motion.button>
              </Link>
            </div>

            {/* Arshia's Speech Bubble - Swoops in from side */}
            <motion.div
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 1.2, duration: 0.8, type: "spring" }}
              className="absolute -right-4 top-32 max-w-sm"
            >
              <div className="relative bg-white rounded-3xl p-6 shadow-2xl border border-gray-100">
                {/* Speech bubble tail */}
                <div className="absolute -left-2 top-6 w-4 h-4 bg-white border-l border-b border-gray-100 transform rotate-45"></div>
                
                <p className="text-gray-700 text-base leading-relaxed mb-4">
                  "This is the <span className="text-pink-600 font-semibold">unfair advantage</span> you've been looking for."
                </p>
                
                <div className="text-right">
                  <p className="font-bold text-gray-800 text-sm">Arshia</p>
                  <p className="text-xs text-gray-500">Miss Teen India USA 2024</p>
                </div>
              </div>
            </motion.div>

            {/* Footer Links */}
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 flex gap-8 text-sm text-gray-500">
              <button 
                onClick={() => window.location.href = 'mailto:arshia.x.kathpalia@gmail.com,ojaskandy@gmail.com?subject=Runway AI Contact'}
                className="hover:text-pink-600 transition-colors"
              >
                Contact Us
              </button>
              <Link href="/privacy" className="hover:text-pink-600 transition-colors">
                Learn about your privacy
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}