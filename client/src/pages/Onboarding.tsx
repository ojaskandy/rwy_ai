import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Link, useLocation } from 'wouter';
import { useOnboarding } from '@/hooks/use-onboarding';

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
  const [isCompleting, setIsCompleting] = useState(false);
  const { completeOnboarding } = useOnboarding();
  const [, setLocation] = useLocation();


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

  const handleCompleteOnboarding = async () => {
    setIsCompleting(true);
    try {
      // Save onboarding data to localStorage as backup
      localStorage.setItem('onboardingAnswers', JSON.stringify(answers));
      
      // Complete onboarding and redirect to pricing
      await completeOnboarding(answers);
      setLocation('/pricing');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      // If there's an error, still redirect to pricing with localStorage backup
      setLocation('/pricing');
    } finally {
      setIsCompleting(false);
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
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCompleteOnboarding}
                disabled={isCompleting}
                className="bg-gradient-to-r from-pink-400 to-pink-600 hover:from-pink-500 hover:to-pink-700 text-white px-16 py-6 text-3xl font-bold rounded-3xl shadow-2xl transition-all duration-300 transform hover:shadow-3xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCompleting ? 'Saving...' : 'Start Now'}
              </motion.button>
            </div>

            {/* Arshia's Speech Bubble - EXACT copy from welcome page */}
            <motion.div
              initial={{ opacity: 0, x: -100, rotate: 0 }}
              animate={{ 
                opacity: 1, 
                x: 0, 
                rotate: 2 
              }}
              transition={{ 
                duration: 0.8, 
                delay: 1.2,
                type: "spring",
                stiffness: 100
              }}
              whileHover={{ 
                scale: 1.05, 
                rotate: -3,
                transition: { duration: 0.3 }
              }}
              className="absolute -right-8 top-24 max-w-2xl"
            >
              <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-pink-200 hover:shadow-2xl transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className="text-4xl">💫</div>
                  <div>
                    <p className="text-2xl text-gray-700 leading-relaxed">
                      "This is the{" "}
                      <span className="text-pink-600 font-bold bg-pink-100 px-2 py-1 rounded-lg">
                        unfair advantage
                      </span>{" "}
                      you've been looking for."
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>

      {/* Footer Links - Moved to bottom */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 flex gap-8 text-sm text-gray-500 z-50">
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
    </div>
  );
}