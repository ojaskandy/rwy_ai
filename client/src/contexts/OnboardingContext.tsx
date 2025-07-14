import React, { createContext, useContext, useState, ReactNode } from 'react';

// Define the structure for onboarding answers
export interface OnboardingAnswers {
  yearsExperience?: string;
  mainReason?: string;
  improvementArea?: string;
  trainingDays?: string;
  holdingBack?: string;
  sixMonthGoal?: string;
}

// Define the onboarding context type
interface OnboardingContextType {
  answers: OnboardingAnswers;
  setAnswer: (question: keyof OnboardingAnswers, answer: string) => void;
  clearAnswers: () => void;
  isComplete: boolean;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  totalSteps: number;
}

// Create the context
const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

// Provider component props
interface OnboardingProviderProps {
  children: ReactNode;
}

// Provider component
export const OnboardingProvider: React.FC<OnboardingProviderProps> = ({ children }) => {
  const [answers, setAnswers] = useState<OnboardingAnswers>({});
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 7; // 6 questions + payment step

  // Function to set a specific answer
  const setAnswer = (question: keyof OnboardingAnswers, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [question]: answer
    }));
  };

  // Function to clear all answers
  const clearAnswers = () => {
    setAnswers({});
    setCurrentStep(1);
  };

  // Check if all questions are answered
  const isComplete = !!(
    answers.yearsExperience &&
    answers.mainReason &&
    answers.improvementArea &&
    answers.trainingDays &&
    answers.holdingBack &&
    answers.sixMonthGoal
  );

  const value: OnboardingContextType = {
    answers,
    setAnswer,
    clearAnswers,
    isComplete,
    currentStep,
    setCurrentStep,
    totalSteps
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
};

// Custom hook to use the onboarding context
export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};

// Export the context for testing purposes
export { OnboardingContext };