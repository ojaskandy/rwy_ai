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

const inspirationalTags = [
  'Confident', 'Radiant', 'Graceful', 'Unstoppable', 'Champion',
  'Brilliant', 'Inspiring', 'Elegant', 'Powerful', 'Queen',
  'Determined', 'Beautiful', 'Strong', 'Winner', 'Star'
];

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [textInput, setTextInput] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

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

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
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