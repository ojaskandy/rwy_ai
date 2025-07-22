import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, MicOff, Play, RotateCcw, 
  Clock, CheckCircle, AlertCircle, Sparkles, MessageSquare
} from 'lucide-react';
import { useLocation } from 'wouter';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';

// Interview question data - Real pageant questions
const INTERVIEW_QUESTIONS = [
  // Core Pageant Questions
  "Why do you want to win this title?",
  "What would you do if you won this pageant?",
  "What qualities should a titleholder have?",
  "Why are you competing in this pageant?",
  "Tell me about yourself.",
  "What is your proudest accomplishment?",
  "What is your greatest weakness?",
  "What is your greatest strength?",
  "Who is your role model?",
  "What is your platform?",
  "Tell me something that isn't on your resume.",
  "How did you prepare for this pageant?",
  "What pageant queen do you look up to?",
  "What would make you a good representative for this specific pageant?",
  "How would you balance the title with other obligations?",
  "What would be your first appearance if you won the title?",
  "How would you serve as a role model to younger titleholders?",
  "Are you ready for the crown?",
  "What have you learned from pageantry?",
  "Why did you choose this specific pageant system?",
  "Why do you want this title?",
  "Why did you start pageants?",
  "How have your extracurricular activities shaped you into the person you are today?",
  "What are some of your goals?",
  "What advice would you give your younger self?",

  // Personality, Hobbies, and Background
  "What makes you unique?",
  "What do you do to make a difference?",
  "What is your favorite social media platform?",
  "Who is your favorite celebrity and what characteristics do you have in common with them?",
  "What is your favorite thing to do with your family?",
  "If you could take a vacation anywhere in the world, where would you go?",
  "What do you love to eat for breakfast?",
  "What is your favorite TV show or movie, and why?",
  "What book are you currently reading?",
  "What do you like most about pageants?",
  "What is your favorite color?",
  "If you could live anywhere in the world, where would you live?",
  "Who is your favorite cartoon character?",
  "What is your favorite thing to do in the summer?",
  "What is your favorite game to play?",
  "Which animal do you like the most?",
  "What is your favorite part of pageant weekend?",
  "What do you look for in a friend?",
  "What qualities do you think are essential for a role model?",
  "What makes you happy?",
  "What is your dream job?",
  "Who do you think is the most popular person in the world right now and why?",
  "What is the nicest thing someone could say about you?",
  "What makes you different from the other contestants?",
  "What has been your greatest accomplishment?",

  // Social and Current Events
  "What current topic in the news has caught your attention and why?",
  "What do you think is the biggest misconception people have about beauty pageants?",
  "What is the most significant challenge facing young people today, and how can they overcome it?",
  "What is the biggest problem facing your generation? How can you solve this?",
  "How would you promote diversity and inclusion within your community?",
  "How do you plan to use this platform to make a positive impact in your community?",
  "If you could change one thing about the world, what would it be and why?",
  "What role do you think education plays in shaping a person's character?",
  "How do you define success?",
  "What does the term 'defund the police' mean to you?",
  "Why do you think race continues to be an issue in our society?",
  "How do you plan to advocate for equal opportunities and rights for all individuals?",
  "Share a personal experience that has helped you develop empathy and understanding for others.",
  "How would you address the issue of gender inequality in the workplace?",
  "How would you work to address environmental challenges if you were crowned?",
  "If you were able talk to the president for one hour, what would you discuss?",
  "What role do you believe beauty pageants play in promoting positive change in society?",

  // Pageant-Specific & Hypothetical Questions
  "If you were a judge, what question would you ask? Answer it.",
  "If I gave you $1,000, what would you do with it?",
  "If you were to win the title, what would you do to bring new contestants to the pageant?",
  "How would your greatest strength make you an effective titleholder?",
  "If you had a million dollars, what would you spend it on?",
  "What would be your first action if you were crowned?",
  "How would you handle the responsibilities of a titleholder while managing your personal life?",
  "What initiatives would you focus on during your reign?",
  "What would you do with the title if you win?",
  "What new project or event would you start for the pageant organization?",
  "If you could develop an app, what would it do?",

  // Personal Challenges, Ethics & Deeper Questions
  "Tell me about a time you made a mistake and how you handled it.",
  "Describe a time when you had to make a difficult decision.",
  "Tell me about a time when you failed at something.",
  "What is the biggest challenge you've faced and how did you overcome it?",
  "Tell me about a time when you stood up for something you believed in.",
  "Describe a situation where you had to work with someone you didn't like.",
  "What would you do if you won but later found out there was an error?",
  "How do you handle criticism?",
  "If you saw another contestant breaking a rule, what would you do?",
  "What would you do if you disagreed with a judge's decision?",
  "Describe a time when you had to overcome a fear.",
  "What is something you've had to sacrifice for pageantry?",
  "How do you stay true to yourself while competing?",
  "What would you do if you were having a bad day during your reign?",
  "How do you balance confidence with humility?",
];

// Speech analysis interfaces
interface FeedbackAnswer {
  questionNumber: number;
  question: string;
  transcript: string;
  grades: {
    clarity: number;
    confidence: number;
    content: number;
    pace: number;
    engagement: number;
  };
  coachingTip: string;
}

interface InterviewFeedback {
  summary: string;
  overallScore: number;
  answers: FeedbackAnswer[];
  overallTips: string[];
}

interface InterviewSession {
  questionNumber: number;
  question: string;
  transcript: string;
  duration: number;
}

export default function InterviewCoach() {
  const [, navigate] = useLocation();
  
  // Practice setup state
  const [mode, setMode] = useState<'question' | 'round'>('question');
  const [numQuestions, setNumQuestions] = useState(3);
  const [timeLimit, setTimeLimit] = useState(90);
  const [currentStep, setCurrentStep] = useState<'setup' | 'question' | 'feedback'>('setup');
  
  // Question state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  
  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [hasStarted, setHasStarted] = useState(false);
  
  // Feedback state
  const [feedback, setFeedback] = useState<InterviewFeedback | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Speech recognition setup
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition();

  const [speechSupported, setSpeechSupported] = useState<boolean | null>(null);

  // Timer ref
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Check speech recognition support
  useEffect(() => {
    setSpeechSupported(browserSupportsSpeechRecognition);
  }, [browserSupportsSpeechRecognition]);

  // Timer management
  useEffect(() => {
    if (isRecording && hasStarted && timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRecording) {
      // Auto-stop when time runs out
      handleStopRecording();
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [isRecording, hasStarted, timeLeft]);

  // Start practice session
  const startPractice = () => {
    const shuffled = [...INTERVIEW_QUESTIONS].sort(() => Math.random() - 0.5);
    const selectedQuestions = shuffled.slice(0, numQuestions);
    
    setCurrentQuestionIndex(0);
    setCurrentQuestion(selectedQuestions[0]);
    setCurrentStep('question');
    setSessions([]);
    setFeedback(null);
    setError(null);
    setTimeLeft(timeLimit);
    setHasStarted(false);
    resetTranscript();
  };

  // Start recording
  const handleStartRecording = () => {
    if (!speechSupported) {
      setError('Speech recognition is not supported in your browser. Please use Chrome for the best experience.');
      return;
    }

    setIsRecording(true);
    setHasStarted(true);
    setError(null);
    resetTranscript();
    SpeechRecognition.startListening({ 
      continuous: true,
      language: 'en-US'
    });
  };

  // Stop recording
  const handleStopRecording = useCallback(() => {
    setIsRecording(false);
    SpeechRecognition.stopListening();
    
    // Save the session
    const session: InterviewSession = {
      questionNumber: currentQuestionIndex + 1,
      question: currentQuestion,
      transcript: transcript.trim(),
      duration: timeLimit - timeLeft
    };
    
    setSessions(prev => [...prev, session]);
    
    // Auto-process if we have a transcript
    if (session.transcript) {
      processFeedback([...sessions, session]);
    } else {
      setError('No speech detected. Please try speaking more clearly.');
    }
  }, [currentQuestion, currentQuestionIndex, transcript, timeLimit, timeLeft, sessions]);

  // Next question
  const nextQuestion = () => {
    if (currentQuestionIndex < numQuestions - 1) {
      const shuffled = [...INTERVIEW_QUESTIONS].sort(() => Math.random() - 0.5);
      setCurrentQuestionIndex(prev => prev + 1);
      setCurrentQuestion(shuffled[currentQuestionIndex + 1] || shuffled[0]);
      setTimeLeft(timeLimit);
      setHasStarted(false);
      resetTranscript();
    } else {
      // All questions completed, show final feedback
      setCurrentStep('feedback');
    }
  };

  // Retry current question
  const retryQuestion = () => {
    setTimeLeft(timeLimit);
    setHasStarted(false);
    resetTranscript();
    setError(null);
  };

  // Process speech and generate feedback
  const processFeedback = async (allSessions: InterviewSession[]) => {
    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch('/api/interview/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessions: allSessions,
          mode: mode
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate feedback');
      }

      setFeedback(result.feedback);
      if (mode === 'round' || (mode === 'question' && currentQuestionIndex >= numQuestions - 1)) {
        setCurrentStep('feedback');
      }

    } catch (err: any) {
      setError(err.message || 'Failed to generate feedback');
    } finally {
      setIsProcessing(false);
    }
  };

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate progress percentage - fixed logic
  const progressPercentage = Math.min(100, (sessions.length / numQuestions) * 100);
  const currentQuestionNumber = sessions.length + 1;

  return (
    <div className="min-h-screen p-3" style={{ backgroundColor: '#FFC5D3' }}>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-bold text-gray-800 mb-2"
          >
            Interview Coach
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-gray-600 text-sm"
          >
            Practice your pageant interview skills
          </motion.p>
        </div>

        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-4"
          >
            <Card className="bg-red-50 border-red-200">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 text-red-700">
                  <AlertCircle className="w-4 h-4" />
                  <p className="text-xs flex-1">{error}</p>
                  <Button
                    onClick={() => setError(null)}
                    size="sm"
                    variant="ghost"
                    className="text-red-700 hover:bg-red-100 p-1"
                  >
                    ✕
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {/* Setup Step */}
          {currentStep === 'setup' && (
            <motion.div
              key="setup"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-gray-800">
                    <MessageSquare className="w-5 h-5 text-pink-600" />
                    Setup Interview Practice
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Browser Support Warning */}
                  {speechSupported === false && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="w-4 h-4 text-orange-500" />
                        <p className="font-medium text-orange-800 text-sm">Browser Compatibility Notice</p>
                      </div>
                      <p className="text-orange-700 text-xs">
                        Speech recognition works best in Chrome browser. Other browsers may have limited support.
                      </p>
                    </div>
                  )}

                  {/* Practice Mode */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Practice Mode</label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant={mode === 'question' ? 'default' : 'outline'}
                        onClick={() => setMode('question')}
                        className={mode === 'question' 
                          ? 'bg-pink-500 hover:bg-pink-600 text-white' 
                          : 'border-pink-200 text-pink-600 hover:bg-pink-50'
                        }
                        size="sm"
                      >
                        Single Questions
                      </Button>
                      <Button
                        variant={mode === 'round' ? 'default' : 'outline'}
                        onClick={() => setMode('round')}
                        className={mode === 'round' 
                          ? 'bg-pink-500 hover:bg-pink-600 text-white' 
                          : 'border-pink-200 text-pink-600 hover:bg-pink-50'
                        }
                        size="sm"
                      >
                        Full Round
                      </Button>
                    </div>
                  </div>

                  {/* Number of Questions */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Number of Questions: {numQuestions}
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={numQuestions}
                      onChange={(e) => setNumQuestions(parseInt(e.target.value))}
                      className="w-full h-2 bg-pink-200 rounded-lg appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, #ec4899 0%, #ec4899 ${numQuestions * 10}%, #fce7f3 ${numQuestions * 10}%, #fce7f3 100%)`
                      }}
                    />
                  </div>

                  {/* Time Limit */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Time Limit: {formatTime(timeLimit)}
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[60, 90, 120].map((time) => (
                        <Button
                          key={time}
                          variant={timeLimit === time ? 'default' : 'outline'}
                          onClick={() => setTimeLimit(time)}
                          className={timeLimit === time 
                            ? 'bg-pink-500 hover:bg-pink-600 text-white' 
                            : 'border-pink-200 text-pink-600 hover:bg-pink-50'
                          }
                          size="sm"
                        >
                          {formatTime(time)}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Start Button */}
                  <Button
                    onClick={startPractice}
                    className="w-full bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white font-medium py-3"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Start Practice Session
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Question Step */}
          {currentStep === 'question' && (
            <motion.div
              key="question"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="space-y-4">
                {/* Progress */}
                <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Question {currentQuestionNumber} of {numQuestions}</span>
                      <span className="text-sm text-gray-500">{Math.round(progressPercentage)}% Complete</span>
                    </div>
                    <div className="w-full bg-pink-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-pink-500 to-pink-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progressPercentage}%` }}
                      ></div>
                    </div>
                  </CardContent>
                </Card>

                {/* Current Question */}
                <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-gray-800">
                      <MessageSquare className="w-5 h-5 text-pink-600" />
                      Interview Question
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-pink-50 p-4 rounded-lg border border-pink-100">
                      <p className="text-gray-800 font-medium text-lg leading-relaxed">
                        {currentQuestion}
                      </p>
                    </div>

                    {/* Timer and Recording Controls */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-pink-600" />
                        <span className={`font-mono text-lg font-bold ${
                          timeLeft <= 30 ? 'text-red-500' : 'text-pink-600'
                        }`}>
                          {formatTime(timeLeft)}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {isRecording && (
                          <div className="flex items-center gap-2 text-red-500">
                            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                            <span className="text-sm font-medium">Recording</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Recording Button */}
                    <div className="text-center">
                      {!isRecording ? (
                        <Button
                          onClick={handleStartRecording}
                          disabled={isProcessing}
                          className="bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white px-8 py-4 rounded-xl"
                        >
                          <Mic className="w-5 h-5 mr-2" />
                          Start Recording
                        </Button>
                      ) : (
                        <Button
                          onClick={handleStopRecording}
                          className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-8 py-4 rounded-xl"
                        >
                          <MicOff className="w-5 h-5 mr-2" />
                          Stop Recording
                        </Button>
                      )}
                    </div>

                    {/* Live Transcript Preview */}
                    {transcript && (
                      <div className="bg-gray-50 p-3 rounded-lg border">
                        <p className="text-sm text-gray-600 mb-1">Live transcript:</p>
                        <p className="text-gray-800 text-sm">{transcript}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Processing Feedback */}
                {isProcessing && (
                  <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
                    <CardContent className="p-4">
                      <div className="text-center">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          className="mb-3"
                        >
                          <Sparkles className="w-8 h-8 mx-auto text-pink-500" />
                        </motion.div>
                        <p className="text-gray-600 font-medium">Analyzing your response...</p>
                        <p className="text-gray-500 text-sm">This may take a few seconds</p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Question Feedback */}
                {feedback && feedback.answers.length > 0 && !isProcessing && (
                  <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-2 text-gray-800">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        Question Feedback
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Grades */}
                      <div>
                        <p className="font-medium text-gray-800 mb-3">Your Scores:</p>
                        <div className="grid grid-cols-3 gap-3">
                          {Object.entries(feedback.answers[0].grades).map(([key, value]) => (
                            <div key={key} className="text-center bg-pink-50 p-2 rounded-lg">
                              <div className="text-lg font-bold text-pink-600">{value}/10</div>
                              <div className="text-xs text-gray-600 capitalize">{key}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Coaching Tip */}
                      {feedback.answers[0].coachingTip && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                          <p className="font-medium text-yellow-800 mb-1 text-sm">Coaching Tip:</p>
                          <p className="text-yellow-700 text-sm">{feedback.answers[0].coachingTip}</p>
                        </div>
                      )}
                      
                      <div className="flex gap-3">
                        <Button
                          onClick={retryQuestion}
                          variant="outline"
                          className="flex-1 border-pink-200 text-pink-600 hover:bg-pink-50"
                          size="sm"
                        >
                          <RotateCcw className="w-4 h-4 mr-1" />
                          Retry
                        </Button>
                        <Button
                          onClick={nextQuestion}
                          className="flex-1 bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white"
                          size="sm"
                        >
                          {sessions.length < numQuestions ? 'Next Question' : 'Get Final Feedback'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </motion.div>
          )}

          {/* Feedback Step */}
          {currentStep === 'feedback' && feedback && (
            <motion.div
              key="feedback"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="space-y-4">
                {/* Summary */}
                <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-gray-800">
                      <Sparkles className="w-5 h-5 text-green-600" />
                      Interview Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-800 leading-relaxed text-sm">
                      {feedback.summary}
                    </p>
                  </CardContent>
                </Card>

                {/* Individual Answer Feedback */}
                {feedback.answers.map((answer, index) => (
                  <Card key={index} className="bg-white/90 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-gray-800 text-lg">
                        <MessageSquare className="w-4 h-4 text-pink-600" />
                        Question {answer.questionNumber}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="font-medium text-gray-800 mb-1 text-sm">Question:</p>
                        <p className="text-gray-700 text-sm">{answer.question}</p>
                      </div>
                      
                      <div>
                        <p className="font-medium text-gray-800 mb-1 text-sm">Your Response:</p>
                        <p className="text-gray-700 bg-gray-50 p-2 rounded text-xs">{answer.transcript}</p>
                      </div>

                      {/* Grades */}
                      <div>
                        <p className="font-medium text-gray-800 mb-2 text-sm">Scores:</p>
                        <div className="grid grid-cols-3 gap-2">
                          {Object.entries(answer.grades).map(([key, value]) => (
                            <div key={key} className="text-center bg-pink-50 p-2 rounded">
                              <div className="text-sm font-bold text-pink-600">{value}/10</div>
                              <div className="text-xs text-gray-600 capitalize">{key}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Coaching Tip */}
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <p className="font-medium text-yellow-800 mb-1 text-xs">Coaching Tip:</p>
                        <p className="text-yellow-700 text-xs">{answer.coachingTip}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {/* Overall Tips */}
                {feedback.overallTips && feedback.overallTips.length > 0 && (
                  <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-gray-800 text-lg">
                        <Sparkles className="w-4 h-4 text-blue-600" />
                        Overall Improvement Tips
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {feedback.overallTips.map((tip, index) => (
                          <div key={index} className="flex items-start gap-2">
                            <div className="w-5 h-5 rounded-full bg-pink-500 text-white flex items-center justify-center text-xs font-bold mt-0.5 flex-shrink-0">
                              {index + 1}
                            </div>
                            <p className="text-gray-800 text-sm">{tip}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button
                    onClick={() => setCurrentStep('setup')}
                    variant="outline"
                    className="flex-1 border-pink-200 text-pink-600 hover:bg-pink-50"
                    size="sm"
                  >
                    <RotateCcw className="w-4 h-4 mr-1" />
                    Practice Again
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
} 