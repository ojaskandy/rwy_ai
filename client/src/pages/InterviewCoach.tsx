import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, Mic, MicOff, Play, RotateCcw, 
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
  "How do you handle criticism and negative feedback?",
  "How do you stay confident and positive in the face of adversity?",
  "How do you handle stress and pressure in high-stakes situations?",
  "What is your biggest weakness and how are you working to overcome it?",
  "Have you ever bullied anyone?",
  "Share a personal accomplishment that you are most proud of and why.",
  "Describe a situation where you had to confront a stereotype about your culture. How did you handle it?",
  "Who is someone you have no respect for?",
  "How do you relate to people who differ from you?",
  "What's the hardest piece of criticism you have ever received?",
  "Tell me about your platform and why it's important to you.",
  "Would you be proud of your biography?",
  "What is something you've learned about yourself during the Covid 19 pandemic?",
  "Do you feel social media has helped or hurt society?",
  "What is the best invention of the century?",
  "What do you plan to do with your life in the next 5 years?",
  "How do you define beauty and why do you believe it is important in today's society?",
  "Would you rather be President or First Lady?",
  "What topic would you want to address if you spoke at your school or city council?",
  "What advice would you give to someone entering their first pageant?",
  "Who is your favorite villain and why?",
  "What makes you proud of your generation?"
];

interface InterviewSession {
  questionNumber: number;
  question: string;
  transcript: string;
  duration: number;
  timestamp: string;
}

interface AnswerFeedback {
  questionNumber: number;
  question: string;
  transcript: string;
  grades: {
    confidence: number;
    clarity: number;
    engagement: number;
    conciseness: number;
    poise: number;
  };
  coachingTip: string;
}

interface SessionFeedback {
  answers: AnswerFeedback[];
  overallTips: string[];
  summary: string;
}

export default function InterviewCoach() {
  const [, navigate] = useLocation();
  const [currentStep, setCurrentStep] = useState<'setup' | 'interview' | 'feedback'>('setup');
  const [mode, setMode] = useState<'question' | 'round'>('question');
  const [numQuestions, setNumQuestions] = useState(1);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [timer, setTimer] = useState(60);
  const [timeRemaining, setTimeRemaining] = useState(60);
  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  const [currentSession, setCurrentSession] = useState<InterviewSession | null>(null);
  const [feedback, setFeedback] = useState<SessionFeedback | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [speechSupported, setSpeechSupported] = useState<boolean | null>(null);
  const [hasRecordedSpeech, setHasRecordedSpeech] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Speech Recognition Hook
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
    isMicrophoneAvailable
  } = useSpeechRecognition();

  // Developer logging for speech recognition states
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[Interview - Dev] Speech recognition state:', {
        listening,
        transcript: transcript.slice(0, 50) + (transcript.length > 50 ? '...' : ''),
        transcriptLength: transcript.length,
        browserSupported: browserSupportsSpeechRecognition,
        micAvailable: isMicrophoneAvailable,
        hasRecordedSpeech
      });
    }
  }, [listening, transcript, browserSupportsSpeechRecognition, isMicrophoneAvailable, hasRecordedSpeech]);

  // Get current question - randomly select from the pool
  const getCurrentQuestion = () => INTERVIEW_QUESTIONS[currentQuestionIndex];

  // Check speech recognition support on component mount
  useEffect(() => {
    console.log('[Interview] Checking browser support for speech recognition...');
    
    if (!browserSupportsSpeechRecognition) {
      console.warn('[Interview] Speech recognition not supported in this browser');
      setSpeechSupported(false);
      setError('Speech recognition not supported in this browser. Please use Chrome for full functionality.');
      return;
    }

    if (!isMicrophoneAvailable) {
      console.warn('[Interview] Microphone not available');
      setSpeechSupported(false);
      setError('Microphone access is required. Please enable microphone permissions and refresh the page.');
      return;
    }

    setSpeechSupported(true);
    console.log('[Interview] Speech recognition supported and microphone available');
  }, [browserSupportsSpeechRecognition, isMicrophoneAvailable]);

  // Track if user has spoken during recording
  useEffect(() => {
    if (listening && transcript.trim().length > 0) {
      setHasRecordedSpeech(true);
    }
  }, [listening, transcript]);

  // Timer countdown effect
  useEffect(() => {
    if (isRecording && timeRemaining > 0) {
      timerRef.current = setTimeout(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);
    } else if (timeRemaining === 0 && isRecording) {
      stopRecording();
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isRecording, timeRemaining]);

  // Start recording
  const startRecording = useCallback(async () => {
    try {
      setError(null);
      setHasRecordedSpeech(false);
      console.log('[Interview] Starting speech recognition...');
      
      if (!speechSupported) {
        setError('Speech recognition not available. Please check browser compatibility.');
        return;
      }

      // Reset transcript and start listening
      resetTranscript();
      
      // Configure speech recognition options
      SpeechRecognition.startListening({
        continuous: true,
        language: 'en-US',
        interimResults: true
      });
      
      setIsRecording(true);
      setTimeRemaining(timer);
      
      console.log('[Interview] Speech recognition started');
      
    } catch (err: any) {
      console.error('[Interview] Speech recognition start failed:', err);
      setError('Failed to start speech recognition. Please check microphone permissions and try again.');
    }
  }, [speechSupported, resetTranscript, timer]);

  // Stop recording and submit answer with a short delay to finalize transcript
  const stopRecording = useCallback(() => {
    console.log('[Interview] Stopping speech recognition...');
    
    if (listening) {
      SpeechRecognition.stopListening();
    }
    
    setIsRecording(false);

    // Clear the timer immediately when stopping
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    setIsProcessing(true);

    // Wait a moment for the transcript to finalize
    setTimeout(() => {
      const currentTranscript = transcript.trim();
      
      if (currentTranscript.length === 0) {
        setError('No speech detected. Please try again and speak clearly into your microphone.');
        setIsProcessing(false);
        console.warn('[Interview] No transcript captured');
        return;
      }
      
      // Save the session
      const session: InterviewSession = {
        questionNumber: currentQuestionIndex + 1,
        question: getCurrentQuestion(),
        transcript: currentTranscript,
        duration: timer - timeRemaining,
        timestamp: new Date().toISOString()
      };
      
      console.log('[Interview] Session saved:', {
        questionNumber: session.questionNumber,
        transcriptLength: session.transcript.length,
        duration: session.duration
      });
      
      setSessions(prev => [...prev, session]);
      setCurrentSession(session);
      
      // In question mode, get immediate feedback
      if (mode === 'question') {
        generateFeedback([session]);
      }
      
      setIsProcessing(false);
    }, 500);
  }, [listening, transcript, currentQuestionIndex, timer, timeRemaining, mode, getCurrentQuestion]);

  // Start interview session
  const startInterview = () => {
    setCurrentStep('interview');
    // Start with the first question (index 0)
    const randomIndex = Math.floor(Math.random() * INTERVIEW_QUESTIONS.length);
    setCurrentQuestionIndex(randomIndex);
    setSessions([]);
    setCurrentSession(null);
    setFeedback(null);
    setError(null);
    setHasRecordedSpeech(false);
  };

  // Next question
  const nextQuestion = () => {
    if (sessions.length < numQuestions - 1) {
      // Randomly select next question
      const randomIndex = Math.floor(Math.random() * INTERVIEW_QUESTIONS.length);
      setCurrentQuestionIndex(randomIndex);
      setCurrentSession(null);
      setTimeRemaining(timer);
      setFeedback(null);
      setHasRecordedSpeech(false);
      resetTranscript();
    } else {
      // Round complete
      if (mode === 'round') {
        generateFeedback(sessions);
      } else {
        setCurrentStep('feedback');
      }
    }
  };

  // Manual submit function
  const submitAnswer = useCallback(() => {
    if (isRecording) {
      stopRecording();
    }
  }, [isRecording, stopRecording]);

  // Retry current question
  const retryQuestion = () => {
    setCurrentSession(null);
    setTimeRemaining(timer);
    setError(null);
    setHasRecordedSpeech(false);
    resetTranscript();
    if (mode === 'question') {
      setFeedback(null);
    }
  };

  // Generate feedback for all answers
  const generateFeedback = async (sessionsToAnalyze: InterviewSession[]) => {
    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch('/api/interview/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessions: sessionsToAnalyze
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="text-purple-600 hover:text-purple-800"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Dashboard
          </Button>
          
          <div className="text-center">
            <h1 className="text-2xl font-bold text-purple-800">Interview Coach</h1>
            <p className="text-purple-600">Practice your pageant interview skills</p>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <div>
                <p className="text-red-800 font-medium">Oops! Something went wrong</p>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setError(null)}
                className="ml-auto text-red-500 hover:text-red-700"
              >
                ✕
              </Button>
            </div>
          </div>
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
              <Card className="border-2 border-purple-100 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-purple-800">
                    <MessageSquare className="w-5 h-5" />
                    Setup Interview Practice
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Browser Support Warning */}
                  {speechSupported === false && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="w-5 h-5 text-orange-500" />
                        <p className="font-medium text-orange-800">Browser Compatibility Notice</p>
                      </div>
                      <p className="text-orange-700 text-sm">
                        Speech recognition works best in Chrome browser. Other browsers may have limited support.
                      </p>
                    </div>
                  )}

                  {/* Mode Selection */}
                  <div>
                    <label className="block text-sm font-medium text-purple-700 mb-3">
                      Practice Mode
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <div
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                          mode === 'question'
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-purple-300'
                        }`}
                        onClick={() => setMode('question')}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded-full border-2 ${
                            mode === 'question'
                              ? 'border-purple-500 bg-purple-500'
                              : 'border-gray-300'
                          }`}>
                            {mode === 'question' && <div className="w-2 h-2 bg-white rounded-full m-0.5" />}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">Question Mode</p>
                            <p className="text-sm text-gray-600">Get feedback after each question</p>
                          </div>
                        </div>
                      </div>
                      
                      <div
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                          mode === 'round'
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-purple-300'
                        }`}
                        onClick={() => setMode('round')}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded-full border-2 ${
                            mode === 'round'
                              ? 'border-purple-500 bg-purple-500'
                              : 'border-gray-300'
                          }`}>
                            {mode === 'round' && <div className="w-2 h-2 bg-white rounded-full m-0.5" />}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">Round Mode</p>
                            <p className="text-sm text-gray-600">Complete all questions, then get feedback</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Number of Questions */}
                  <div>
                    <label className="block text-sm font-medium text-purple-700 mb-2">
                      Number of Questions
                    </label>
                    <select
                      value={numQuestions}
                      onChange={(e) => setNumQuestions(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-purple-200 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value={1}>1 Question</option>
                      <option value={2}>2 Questions</option>
                      <option value={3}>3 Questions</option>
                      <option value={4}>4 Questions</option>
                      <option value={5}>5 Questions</option>
                    </select>
                  </div>

                  {/* Timer Selection */}
                  <div>
                    <label className="block text-sm font-medium text-purple-700 mb-2">
                      Response Time Limit
                    </label>
                    <select
                      value={timer}
                      onChange={(e) => setTimer(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-purple-200 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value={30}>30 seconds</option>
                      <option value={45}>45 seconds</option>
                      <option value={60}>60 seconds</option>
                      <option value={90}>90 seconds</option>
                      <option value={120}>2 minutes</option>
                    </select>
                  </div>

                  {/* Start Button */}
                  <Button
                    onClick={startInterview}
                    disabled={speechSupported === false}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Play className="w-5 h-5 mr-2" />
                    Start {mode === 'question' ? 'Question' : 'Round'} Practice ({numQuestions} question{numQuestions > 1 ? 's' : ''})
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Interview Step */}
          {currentStep === 'interview' && (
            <motion.div
              key="interview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="space-y-6">
                {/* Progress Bar */}
                <div className="bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
                <p className="text-center text-sm text-purple-600">
                  Question {currentQuestionNumber} of {numQuestions}
                </p>

                {/* Current Question */}
                <Card className="border-2 border-blue-100 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-blue-800">
                      <MessageSquare className="w-5 h-5" />
                      Interview Question
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-lg text-gray-800 leading-relaxed">
                      {getCurrentQuestion()}
                    </p>
                  </CardContent>
                </Card>

                {/* Recording Interface */}
                {!currentSession && (
                  <Card className="border-2 border-purple-100 shadow-2xl bg-gradient-to-br from-white to-purple-50">
                    <CardContent className="p-12">
                      <div className="text-center space-y-8">
                        {/* Timer */}
                        <div className="flex items-center justify-center gap-3 mb-8">
                          <Clock className="w-8 h-8 text-purple-600" />
                          <span className={`text-4xl font-mono font-bold ${
                            timeRemaining <= 10 ? 'text-red-500' : 'text-purple-800'
                          }`}>
                            {formatTime(timeRemaining)}
                          </span>
                        </div>

                        {/* Recording Button and Submit Button */}
                        <div className="flex justify-center relative mb-8">
                          <div className="relative">
                            <Button
                              onClick={isRecording ? stopRecording : startRecording}
                              disabled={isProcessing || speechSupported === false}
                              className={`w-40 h-40 rounded-full text-white shadow-2xl transition-all duration-300 transform hover:scale-105 ${
                                isRecording 
                                  ? 'bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700' 
                                  : speechSupported === false
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-gradient-to-br from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
                              }`}
                            >
                              {isRecording ? (
                                <div className="flex flex-col items-center">
                                  <MicOff className="w-12 h-12 mb-2" />
                                  <span className="text-lg font-semibold">STOP</span>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center">
                                  <Mic className="w-12 h-12 mb-2" />
                                  <span className="text-lg font-semibold">START</span>
                                </div>
                              )}
                            </Button>
                          </div>
                        </div>

                        {/* Submit Button - shown when recording and has speech */}
                        {isRecording && hasRecordedSpeech && (
                          <div className="flex justify-center mb-6">
                            <Button
                              onClick={submitAnswer}
                              disabled={isProcessing}
                              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-4 text-lg font-semibold shadow-lg"
                            >
                              ✓ Submit Answer
                            </Button>
                          </div>
                        )}

                        {/* Status */}
                        <div className="text-center space-y-4">
                          <p className="text-xl font-semibold text-purple-700">
                            {isRecording ? '🎤 Recording... Speak clearly' : 'Click START to begin recording'}
                          </p>
                          
                          {isRecording && (
                            <div className="space-y-3 bg-blue-50 border border-blue-200 rounded-xl p-6">
                              <p className="text-sm font-medium text-blue-800">
                                🔴 Your speech is being transcribed live
                              </p>
                              
                              {/* Listening indicator */}
                              <div className="flex items-center justify-center gap-3">
                                <span className="text-sm text-gray-600">Status:</span>
                                <span className={`text-sm px-3 py-1 rounded-full font-medium ${
                                  listening ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                                }`}>
                                  {listening ? '● Listening...' : '○ Not listening'}
                                </span>
                              </div>
                              
                              {!hasRecordedSpeech && isRecording && (
                                <p className="text-sm text-orange-600 font-medium">
                                  ⚠️ No speech detected yet - please speak into your microphone
                                </p>
                              )}
                            </div>
                          )}
                          
                          {/* Speech Support Warning */}
                          {speechSupported === false && (
                            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                              <p className="text-sm text-red-700 font-medium">
                                🚫 Speech recognition not supported. Please use Chrome for full functionality.
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Real-time Transcript Display */}
                        {isRecording && transcript && (
                          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6 mx-4">
                            <p className="text-lg font-semibold text-blue-800 mb-3">💬 Live Transcript:</p>
                            <div className="bg-white rounded-lg p-4 min-h-[4rem] border border-blue-100">
                              <p className="text-gray-800 text-left leading-relaxed">
                                {transcript || '...'}
                              </p>
                            </div>
                            <div className="flex justify-between items-center mt-3 text-sm text-blue-600">
                              <span>Words: {transcript.split(' ').filter((word: string) => word.length > 0).length}</span>
                              <span>Characters: {transcript.length}</span>
                            </div>
                          </div>
                        )}

                        {isProcessing && (
                          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                            <div className="flex items-center justify-center gap-3 text-yellow-700">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-600"></div>
                              <span className="font-medium">Processing your response...</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Final Transcript Display */}
                {currentSession && (
                  <Card className="border-2 border-green-100 shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-green-800">
                        <CheckCircle className="w-5 h-5" />
                        Your Response
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="bg-green-50 p-4 rounded-lg">
                        <p className="text-gray-800 leading-relaxed">
                          {currentSession.transcript}
                        </p>
                        <p className="text-sm text-green-600 mt-2">
                          Duration: {currentSession.duration}s | Words: {currentSession.transcript.split(' ').length}
                        </p>
                      </div>
                      
                      {/* Show immediate feedback in question mode */}
                      {mode === 'question' && feedback && feedback.answers.length > 0 && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                          <p className="font-medium text-yellow-800 mb-2">Quick Feedback:</p>
                          <div className="space-y-2">
                            <div className="flex gap-2 text-sm">
                              {Object.entries(feedback.answers[0].grades).map(([key, value]) => (
                                <span key={key} className="bg-yellow-100 px-2 py-1 rounded">
                                  {key}: {value}/10
                                </span>
                              ))}
                            </div>
                            <p className="text-yellow-700">{feedback.answers[0].coachingTip}</p>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex gap-3">
                        <Button
                          onClick={retryQuestion}
                          variant="outline"
                          className="flex-1 border-purple-200 text-purple-600"
                        >
                          <RotateCcw className="w-4 h-4 mr-2" />
                          Retry
                        </Button>
                        <Button
                          onClick={nextQuestion}
                          className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
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
              <div className="space-y-6">
                {/* Summary */}
                <Card className="border-2 border-green-100 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-800">
                      <Sparkles className="w-5 h-5" />
                      Interview Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-800 leading-relaxed">
                      {feedback.summary}
                    </p>
                  </CardContent>
                </Card>

                {/* Individual Answer Feedback */}
                {feedback.answers.map((answer, index) => (
                  <Card key={index} className="border-2 border-purple-100 shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-purple-800">
                        <MessageSquare className="w-5 h-5" />
                        Question {answer.questionNumber}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="font-medium text-gray-800 mb-2">Question:</p>
                        <p className="text-gray-700">{answer.question}</p>
                      </div>
                      
                      <div>
                        <p className="font-medium text-gray-800 mb-2">Your Response:</p>
                        <p className="text-gray-700 bg-gray-50 p-3 rounded">{answer.transcript}</p>
                      </div>

                      {/* Grades */}
                      <div>
                        <p className="font-medium text-gray-800 mb-3">Grades:</p>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                          {Object.entries(answer.grades).map(([key, value]) => (
                            <div key={key} className="text-center">
                              <div className="text-lg font-bold text-purple-600">{value}/10</div>
                              <div className="text-xs text-gray-600 capitalize">{key}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Coaching Tip */}
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <p className="font-medium text-yellow-800 mb-1">Coaching Tip:</p>
                        <p className="text-yellow-700">{answer.coachingTip}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {/* Overall Tips */}
                {feedback.overallTips && feedback.overallTips.length > 0 && (
                  <Card className="border-2 border-blue-100 shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-blue-800">
                        <Sparkles className="w-5 h-5" />
                        Overall Improvement Tips
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {feedback.overallTips.map((tip, index) => (
                          <div key={index} className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold mt-0.5">
                              {index + 1}
                            </div>
                            <p className="text-gray-800">{tip}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <Button
                    onClick={() => setCurrentStep('setup')}
                    variant="outline"
                    className="flex-1 border-purple-200 text-purple-600"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Practice Again
                  </Button>
                  <Button
                    onClick={() => navigate('/')}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    Back to Dashboard
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