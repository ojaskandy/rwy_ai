import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useOnboarding } from '@/contexts/OnboardingContext';
import OnboardingPayment from '@/components/OnboardingPayment';

// Define question data structure
interface QuestionOption {
  value: string;
  label: string;
}

interface QuestionData {
  id: keyof import('@/contexts/OnboardingContext').OnboardingAnswers;
  title: string;
  options: QuestionOption[];
}

// All questionnaire data
const QUESTIONS: QuestionData[] = [
  {
    id: 'yearsExperience',
    title: 'How many years have you been practicing martial arts?',
    options: [
      { value: '0', label: '0 (just starting out)' },
      { value: 'less-than-1', label: 'Less than 1 year' },
      { value: '1-3', label: '1–3 years' },
      { value: 'more-than-3', label: 'More than 3 years' }
    ]
  },
  {
    id: 'mainReason',
    title: 'What is your main reason for training right now?',
    options: [
      { value: 'competitions', label: 'Preparing for competitions or gradings' },
      { value: 'technique', label: 'Improving technique and fundamentals' },
      { value: 'fitness', label: 'Getting back in shape or building strength' },
      { value: 'consistency', label: 'Staying consistent and motivated' }
    ]
  },
  {
    id: 'improvementArea',
    title: 'Which area do you feel needs the most improvement?',
    options: [
      { value: 'flexibility', label: 'Flexibility and mobility' },
      { value: 'stamina', label: 'Stamina and conditioning' },
      { value: 'speed', label: 'Speed and reaction time' },
      { value: 'precision', label: 'Precision and technique' }
    ]
  },
  {
    id: 'trainingDays',
    title: 'How many days per week can you realistically commit to training?',
    options: [
      { value: '1', label: '1' },
      { value: '2-3', label: '2–3' },
      { value: '4-5', label: '4–5' },
      { value: '6+', label: '6+' }
    ]
  },
  {
    id: 'holdingBack',
    title: "What's the one thing holding you back from progressing faster?",
    options: [
      { value: 'no-plan', label: 'Lack of a clear plan' },
      { value: 'no-time', label: 'Not enough time' },
      { value: 'motivation', label: 'Staying motivated' },
      { value: 'inconsistent-feedback', label: 'Inconsistent feedback' },
      { value: 'physical', label: 'Physical limitations' }
    ]
  },
  {
    id: 'sixMonthGoal',
    title: "What's your top goal for the next 6 months?",
    options: [
      { value: 'master-technique', label: 'Master a specific technique or form' },
      { value: 'competition', label: 'Win or place in a competition' },
      { value: 'physical-shape', label: 'Get in peak physical shape' },
      { value: 'consistent-habit', label: 'Build a consistent training habit' },
      { value: 'advance-belts', label: 'Advance belts' }
    ]
  }
];

// Props for the onboarding flow
interface OnboardingFlowProps {
  onComplete: () => void;
}

// Individual question component
interface QuestionStepProps {
  question: QuestionData;
  onAnswer: (answer: string) => void;
  selectedAnswer?: string;
}

const QuestionStep: React.FC<QuestionStepProps> = ({ question, onAnswer, selectedAnswer }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-2xl mx-auto px-6"
    >
      {/* Question Title */}
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-6 leading-tight">
          {question.title}
        </h2>
      </div>

      {/* Answer Options */}
      <div className="space-y-4">
        {question.options.map((option) => (
          <button
            key={option.value}
            onClick={() => onAnswer(option.value)}
            className={`w-full p-4 rounded-xl border-2 transition-all duration-200 text-left ${
              selectedAnswer === option.value
                ? 'border-red-500 bg-red-500/10 text-white'
                : 'border-gray-600 bg-gray-800/50 text-gray-300 hover:border-gray-500 hover:bg-gray-700/50'
            }`}
          >
            <span className="text-lg font-medium">{option.label}</span>
          </button>
        ))}
      </div>
    </motion.div>
  );
};

// Progress indicator component
const ProgressIndicator: React.FC<{ current: number; total: number }> = ({ current, total }) => {
  const progressPercentage = (current / total) * 100;

  return (
    <div className="w-full max-w-md mx-auto mb-8">
      {/* Progress Bar */}
      <div className="w-full bg-gray-700 rounded-full h-2 mb-4">
        <motion.div
          className="bg-gradient-to-r from-red-600 to-orange-600 h-2 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progressPercentage}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
      
      {/* Step Counter */}
      <div className="text-center">
        <span className="text-gray-400 text-sm">
          Step {current} of {total}
        </span>
      </div>
    </div>
  );
};

// Main OnboardingFlow component
export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete }) => {
  const { answers, setAnswer, currentStep, setCurrentStep, totalSteps, isComplete } = useOnboarding();

  // Handle answer selection and auto-advance
  const handleAnswer = (questionId: keyof import('@/contexts/OnboardingContext').OnboardingAnswers, answer: string) => {
    setAnswer(questionId, answer);
    
    // Auto-advance to next step after a short delay
    setTimeout(() => {
      if (currentStep < 6) { // 6 questions total
        setCurrentStep(currentStep + 1);
      } else {
        // All questions answered, move to payment step
        setCurrentStep(7); // Payment step
      }
    }, 500);
  };

  // Handle going back to questions from payment
  const handleBackToQuestions = () => {
    setCurrentStep(6); // Go back to last question
  };

  // Determine what to render based on current step
  const renderCurrentStep = () => {
    if (currentStep <= 6) {
      // Show questions
      const questionData = QUESTIONS[currentStep - 1];
      const selectedAnswer = answers[questionData.id];

      return (
        <QuestionStep
          question={questionData}
          onAnswer={(answer) => handleAnswer(questionData.id, answer)}
          selectedAnswer={selectedAnswer}
        />
      );
    } else {
      // Show payment step
      return (
        <OnboardingPayment
          onSuccess={onComplete}
          onBack={handleBackToQuestions}
        />
      );
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center relative p-4">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-red-900/20 via-black to-orange-900/20" />
      
      {/* Content Container */}
      <div className="relative z-10 w-full max-w-4xl mx-auto flex flex-col items-center justify-center min-h-screen">
        
        {/* Progress Indicator - only show during questions */}
        {currentStep <= 6 && (
          <ProgressIndicator current={currentStep} total={6} />
        )}

        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center w-full">
          <AnimatePresence mode="wait">
            {renderCurrentStep()}
          </AnimatePresence>
        </div>

        {/* Bottom Spacing */}
        <div className="h-16" />
      </div>
    </div>
  );
};

export default OnboardingFlow;