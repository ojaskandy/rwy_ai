import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, MicOff, Play, Pause, Square, RotateCcw, 
  ChevronLeft, Volume2, Star, Target, MessageSquare,
  Brain, Clock, Award, TrendingUp, CheckCircle, AlertCircle,
  BookOpen, Lightbulb, Timer, BarChart3
} from 'lucide-react';
import { useLocation } from 'wouter';

// Mock interview questions for different categories
const INTERVIEW_CATEGORIES = [
  { id: 'pageant', name: 'Pageant Q&A', questions: 15 },
  { id: 'general', name: 'General Interview', questions: 20 },
  { id: 'current-events', name: 'Current Events', questions: 12 },
  { id: 'personal', name: 'Personal Story', questions: 18 },
  { id: 'leadership', name: 'Leadership', questions: 10 }
];

const SAMPLE_QUESTIONS = {
  pageant: [
    "What is your greatest accomplishment and why?",
    "How would you use your platform to make a positive impact?",
    "What does beauty mean to you?",
    "If you could change one thing about the world, what would it be?",
    "How do you handle criticism and setbacks?"
  ],
  general: [
    "Tell me about yourself.",
    "What are your strengths and weaknesses?",
    "Where do you see yourself in five years?",
    "Why are you interested in this opportunity?",
    "What motivates you every day?"
  ],
  "current-events": [
    "What current global issue concerns you most?",
    "How do you stay informed about world events?",
    "What role should social media play in spreading awareness?",
    "How can young people make a difference in their communities?",
    "What is your opinion on environmental conservation?"
  ],
  personal: [
    "What experience has shaped you the most?",
    "Tell me about a time you overcame a challenge.",
    "What is your proudest moment?",
    "How has your family influenced your values?",
    "What lesson has failure taught you?"
  ],
  leadership: [
    "Describe your leadership style.",
    "How do you motivate others?",
    "Tell me about a time you led a team through difficulty.",
    "What makes an effective leader?",
    "How do you handle conflict within a team?"
  ]
};

// Mock feedback analysis - in production this would come from LLM API
const generateFeedback = (transcript: string, duration: number): any => {
  const wordCount = transcript.split(' ').length;
  const wordsPerMinute = Math.round((wordCount / duration) * 60);
  
  // Simulate AI analysis
  const analysis = {
    overallScore: Math.floor(Math.random() * 30) + 70, // 70-100
    clarity: Math.floor(Math.random() * 20) + 80,
    confidence: Math.floor(Math.random() * 25) + 75,
    pacing: wordsPerMinute > 180 ? 'Fast' : wordsPerMinute < 120 ? 'Slow' : 'Good',
    wordCount,
    duration,
    wordsPerMinute,
    strengths: [
      'Clear articulation',
      'Good eye contact',
      'Confident posture'
    ],
    improvements: [
      'Reduce filler words',
      'Vary vocal tone',
      'Add specific examples'
    ],
    suggestions: [
      'Practice with a timer to improve pacing',
      'Use the STAR method for storytelling',
      'Record yourself to identify speech patterns'
    ]
  };
  
  return analysis;
};

export default function InterviewCoach() {
  const [, navigate] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState<string>('pageant');
  const [currentQuestion, setCurrentQuestion] = useState<string>('');
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState<any>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [sessionHistory, setSessionHistory] = useState<any[]>([]);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      
      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setTranscript(prev => prev + finalTranscript + ' ');
        }
      };
    }
  }, []);

  const getRandomQuestion = () => {
    const questions = SAMPLE_QUESTIONS[selectedCategory as keyof typeof SAMPLE_QUESTIONS] || SAMPLE_QUESTIONS.general;
    return questions[Math.floor(Math.random() * questions.length)];
  };

  const startNewSession = () => {
    const question = getRandomQuestion();
    setCurrentQuestion(question);
    setTranscript('');
    setFeedback(null);
    setShowFeedback(false);
    setRecordingDuration(0);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setAudioBlob(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };
      
      setIsRecording(true);
      setRecordingDuration(0);
      mediaRecorderRef.current.start();
      
      // Start speech recognition
      if (recognitionRef.current) {
        recognitionRef.current.start();
      }
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      // Generate feedback
      setTimeout(() => {
        const analysis = generateFeedback(transcript, recordingDuration);
        setFeedback(analysis);
        setShowFeedback(true);
        
        // Add to session history
        setSessionHistory(prev => [...prev, {
          question: currentQuestion,
          transcript,
          feedback: analysis,
          timestamp: new Date()
        }]);
      }, 1000);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 80) return 'text-blue-400';
    if (score >= 70) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 text-white">
      {/* Header */}
      <div className="w-full bg-gradient-to-r from-blue-800 to-purple-800 h-16 px-4 shadow-lg flex items-center">
        <button 
          onClick={() => navigate('/')} 
          className="flex items-center text-white hover:text-blue-200 font-semibold transition-colors"
        >
          <ChevronLeft className="w-5 h-5 mr-2" /> Back to Home
        </button>
        <div className="flex-1 flex justify-center">
          <span className="text-blue-200 font-bold text-xl">Interview Coach</span>
        </div>
        <div className="w-24" />
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Practice Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Category Selection */}
            <Card className="bg-black/30 border-blue-600/30">
              <CardHeader>
                <CardTitle className="text-blue-300 flex items-center">
                  <BookOpen className="w-5 h-5 mr-2" />
                  Interview Category
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {INTERVIEW_CATEGORIES.map((category) => (
                    <Button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      variant={selectedCategory === category.id ? 'default' : 'outline'}
                      className={`h-16 flex flex-col ${
                        selectedCategory === category.id 
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600' 
                          : 'border-blue-600 text-blue-300 hover:bg-blue-600/20'
                      }`}
                    >
                      <span className="font-semibold">{category.name}</span>
                      <span className="text-xs opacity-70">{category.questions} questions</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Current Question */}
            <Card className="bg-black/30 border-blue-600/30">
              <CardHeader>
                <CardTitle className="text-blue-300 flex items-center justify-between">
                  <div className="flex items-center">
                    <MessageSquare className="w-5 h-5 mr-2" />
                    Practice Question
                  </div>
                  <Button 
                    onClick={startNewSession}
                    variant="outline"
                    size="sm"
                    className="border-blue-600 text-blue-300 hover:bg-blue-600/20"
                  >
                    <RotateCcw className="w-4 h-4 mr-1" />
                    New Question
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {currentQuestion ? (
                  <div className="text-center p-6">
                    <p className="text-lg font-medium text-gray-200 leading-relaxed">
                      {currentQuestion}
                    </p>
                  </div>
                ) : (
                  <div className="text-center p-6">
                    <p className="text-gray-400">Click "New Question" to get started</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recording Interface */}
            <Card className="bg-black/30 border-blue-600/30">
              <CardHeader>
                <CardTitle className="text-blue-300 flex items-center">
                  <Mic className="w-5 h-5 mr-2" />
                  Record Your Answer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-6">
                  {/* Recording Button */}
                  <div className="relative">
                    <Button
                      onClick={isRecording ? stopRecording : startRecording}
                      disabled={!currentQuestion || isProcessing}
                      className={`w-24 h-24 rounded-full ${
                        isRecording 
                          ? 'bg-red-600 hover:bg-red-700 animate-pulse' 
                          : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
                      }`}
                    >
                      {isRecording ? <Square className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
                    </Button>
                    
                    {isRecording && (
                      <motion.div
                        className="absolute inset-0 rounded-full border-4 border-red-400"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      />
                    )}
                  </div>

                  {/* Timer */}
                  {(isRecording || recordingDuration > 0) && (
                    <div className="flex items-center justify-center space-x-2">
                      <Timer className="w-5 h-5 text-blue-400" />
                      <span className="text-xl font-mono text-blue-300">
                        {formatDuration(recordingDuration)}
                      </span>
                    </div>
                  )}

                  {/* Status */}
                  <p className="text-gray-400">
                    {!currentQuestion 
                      ? 'Select a question to begin'
                      : isRecording 
                        ? 'Recording... Click to stop'
                        : isProcessing
                          ? 'Processing your response...'
                          : 'Click to start recording'
                    }
                  </p>

                  {/* Live Transcript */}
                  {transcript && (
                    <div className="bg-gray-900/50 rounded-lg p-4 text-left">
                      <h4 className="text-sm font-semibold text-blue-300 mb-2">Live Transcript:</h4>
                      <p className="text-gray-300 text-sm">{transcript}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Feedback Sidebar */}
          <div className="space-y-6">
            {/* Feedback Results */}
            <AnimatePresence>
              {showFeedback && feedback && (
                <motion.div
                  initial={{ opacity: 0, x: 100 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 100 }}
                >
                  <Card className="bg-black/30 border-blue-600/30">
                    <CardHeader>
                      <CardTitle className="text-blue-300 flex items-center">
                        <Brain className="w-5 h-5 mr-2" />
                        AI Feedback
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Overall Score */}
                      <div className="text-center">
                        <div className={`text-4xl font-bold ${getScoreColor(feedback.overallScore)}`}>
                          {feedback.overallScore}
                        </div>
                        <p className="text-gray-400 text-sm">Overall Score</p>
                      </div>

                      {/* Metrics */}
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-300">Clarity</span>
                          <span className={`font-semibold ${getScoreColor(feedback.clarity)}`}>
                            {feedback.clarity}%
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-300">Confidence</span>
                          <span className={`font-semibold ${getScoreColor(feedback.confidence)}`}>
                            {feedback.confidence}%
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-300">Pacing</span>
                          <Badge variant="outline" className="border-blue-600 text-blue-300">
                            {feedback.pacing}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-300">Words/Min</span>
                          <span className="text-blue-300 font-semibold">
                            {feedback.wordsPerMinute}
                          </span>
                        </div>
                      </div>

                      {/* Strengths */}
                      <div>
                        <h4 className="text-sm font-semibold text-green-400 mb-2 flex items-center">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Strengths
                        </h4>
                        <ul className="space-y-1">
                          {feedback.strengths.map((strength: string, index: number) => (
                            <li key={index} className="text-xs text-gray-300 flex items-center">
                              <Star className="w-3 h-3 mr-1 text-green-400" />
                              {strength}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Improvements */}
                      <div>
                        <h4 className="text-sm font-semibold text-yellow-400 mb-2 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          Areas to Improve
                        </h4>
                        <ul className="space-y-1">
                          {feedback.improvements.map((improvement: string, index: number) => (
                            <li key={index} className="text-xs text-gray-300 flex items-center">
                              <Target className="w-3 h-3 mr-1 text-yellow-400" />
                              {improvement}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Suggestions */}
                      <div>
                        <h4 className="text-sm font-semibold text-blue-400 mb-2 flex items-center">
                          <Lightbulb className="w-4 h-4 mr-1" />
                          Suggestions
                        </h4>
                        <ul className="space-y-1">
                          {feedback.suggestions.map((suggestion: string, index: number) => (
                            <li key={index} className="text-xs text-gray-300">
                              • {suggestion}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Session History */}
            {sessionHistory.length > 0 && (
              <Card className="bg-black/30 border-blue-600/30">
                <CardHeader>
                  <CardTitle className="text-blue-300 flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2" />
                    Session History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {sessionHistory.slice(-5).reverse().map((session, index) => (
                      <div key={index} className="bg-gray-900/50 rounded-lg p-3">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs font-semibold text-blue-300">
                            Question {sessionHistory.length - index}
                          </span>
                          <span className={`text-sm font-bold ${getScoreColor(session.feedback.overallScore)}`}>
                            {session.feedback.overallScore}
                          </span>
                        </div>
                        <p className="text-xs text-gray-300 truncate">
                          {session.question}
                        </p>
                        <div className="flex justify-between text-xs text-gray-400 mt-1">
                          <span>{session.feedback.wordCount} words</span>
                          <span>{formatDuration(session.feedback.duration)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Tips */}
            <Card className="bg-black/30 border-blue-600/30">
              <CardHeader>
                <CardTitle className="text-blue-300 flex items-center">
                  <Award className="w-5 h-5 mr-2" />
                  Interview Tips
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm text-gray-300">
                  <div className="flex items-start">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 mr-3 flex-shrink-0" />
                    <span>Make eye contact with the camera to simulate eye contact with judges</span>
                  </div>
                  <div className="flex items-start">
                    <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 mr-3 flex-shrink-0" />
                    <span>Use the STAR method: Situation, Task, Action, Result</span>
                  </div>
                  <div className="flex items-start">
                    <div className="w-2 h-2 bg-pink-400 rounded-full mt-2 mr-3 flex-shrink-0" />
                    <span>Practice speaking at 150-160 words per minute for optimal pacing</span>
                  </div>
                  <div className="flex items-start">
                    <div className="w-2 h-2 bg-green-400 rounded-full mt-2 mr-3 flex-shrink-0" />
                    <span>Use specific examples and personal anecdotes when possible</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 