import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { 
  Mic, MicOff, Play, RotateCcw, 
  Clock, CheckCircle, AlertCircle, Sparkles, MessageSquare,
  Award, Star, X
} from 'lucide-react';
import { useLocation } from 'wouter';
import { supabase } from '@/lib/supabase';
import UsageAfterAction from '@/components/UsageAfterAction';
import { useSubscription } from '@/hooks/use-subscription';
import { LimitReachedModal } from '@/components/LimitReachedModal';
import { Dialog, DialogContent } from '@/components/ui/dialog';

// Helper function to get time-appropriate example answers with specific stories
const getExampleAnswerForQuestion = (question: string, timeLimit: number): string => {
  // Handle questions about difficult decisions
  if (question.includes("difficult decision") || question.includes("make a decision")) {
    if (timeLimit <= 60) {
      return "One of the most difficult decisions I faced was choosing between attending college locally or accepting a scholarship at a university across the country. My mother had been diagnosed with an autoimmune condition, and I felt torn between pursuing my dreams and being there for my family. After many conversations with my parents, I ultimately decided to accept the scholarship while creating a detailed plan to visit home monthly and provide remote support. This taught me that sometimes the hardest decisions aren't between right and wrong, but between two values you hold dear. The experience shaped my approach to decision-making: gather all facts, consider who's affected, and align with your core values.";
    } else {
      return "During my junior year of college, I faced what felt like an impossible decision. I was offered both my dream internship with a major fashion house in New York and the opportunity to lead a service project in my hometown rebuilding a community center destroyed by flooding. The internship would advance my career goals, but the service project represented my commitment to giving back to the community that raised me. After deeply reflecting on my values, I chose the community project. I worked with my professors to create a hybrid schedule where I could complete coursework remotely while leading the rebuilding effort. That summer was transformative—we restored not just a building, but a sense of hope. We completed the project two weeks ahead of schedule, under budget, and created a space that now serves over 200 children weekly. While I initially worried about the professional opportunity I'd sacrificed, the leadership and project management skills I gained proved invaluable in my career. The fashion house was impressed by my commitment and offered me a position upon graduation. This experience taught me that when facing difficult decisions, I should align my choices with my core values, think creatively about alternatives, and recognize that sometimes what seems like a sacrifice can become your greatest strength.";
    }
  }
  
  // Handle questions about overcoming challenges
  if (question.includes("overcome") || question.includes("challenge") || question.includes("obstacle")) {
    if (timeLimit <= 60) {
      return "The greatest challenge I've overcome was developing severe performance anxiety during my junior year of high school, right as I was preparing for state-level piano competitions. After freezing during a critical recital, I was diagnosed with performance anxiety that manifested physically—racing heart, shaking hands—symptoms devastating for a pianist. Rather than quitting, I worked with both a music therapist and my piano teacher to develop a comprehensive approach. I practiced mindfulness techniques, created a pre-performance routine, and gradually exposed myself to increasingly stressful performance situations. The breakthrough came when I volunteered to play weekly at a senior center—the appreciative audience helped me reconnect with the joy of music rather than fear of judgment. Six months later, I successfully performed at state finals. This experience taught me that obstacles aren't permanent barriers but opportunities for transformative growth.";
    } else {
      return "The most significant challenge I've faced was overcoming a severe public speaking phobia while pursuing my communication degree—a seemingly impossible contradiction. During my freshman year presentation, I experienced such intense anxiety that I became physically ill and couldn't continue. The embarrassment was crushing, and I seriously considered changing my major despite my passion for the field. Instead of giving up, I decided to confront this obstacle methodically. First, I sought help from our university's counseling center, where I was diagnosed with performance anxiety disorder. I committed to weekly cognitive-behavioral therapy sessions where I learned to recognize and interrupt catastrophic thought patterns. Simultaneously, I joined Toastmasters International, deliberately placing myself in the very situations I feared most. I started with small roles—timekeeper, then evaluator—before attempting prepared speeches. I recorded each practice session, focusing on improvement rather than perfection. My professor allowed me to initially submit video recordings instead of live presentations, gradually transitioning to small-group settings as my confidence grew. The pivotal moment came during my junior year when I volunteered to speak at a campus-wide event about my journey with anxiety. Standing before 300 people, I experienced the same physical symptoms—racing heart, dry mouth—but this time, I had the tools to continue despite them. I received a standing ovation, not for perfect delivery, but for authentic connection. By graduation, I was serving as a peer coach helping other students with communication anxiety. This challenge taught me that our greatest weaknesses can become our unique strengths. I now approach obstacles with the understanding that progress comes through consistent, incremental steps and that vulnerability, rather than perfection, creates the most meaningful connections.";
    }
  }
  
  // Handle specific pageant questions
  if (question === "What is your stance on mental health awareness?") {
    if (timeLimit <= 60) {
      return "Mental health advocacy became deeply personal for me when my younger sister was diagnosed with anxiety disorder at 15. I witnessed firsthand how proper support and destigmatization made the difference in her recovery. This experience inspired me to create a peer support program at my high school, training 20 students to recognize warning signs and provide resources to classmates. We partnered with local therapists to offer three mental health workshops annually, reaching over 400 students. If crowned, I would expand this initiative statewide, because I believe everyone deserves access to mental health resources without shame or judgment. True strength isn't pretending to be perfect—it's acknowledging our struggles and supporting each other through them.";
    } else {
      return "Mental health advocacy became my mission after my best friend's battle with depression during our sophomore year. What began as subtle changes—skipping dance practice, withdrawing from friends—escalated until she confided in me about suicidal thoughts. The fear I felt that day transformed into determination when I realized how many teens face similar struggles silently. Working with our school counselor, I established 'Mindful Conversations,' weekly support sessions that created safe spaces for students to discuss mental health. The program initially faced resistance from parents concerned about privacy, so I organized an information night featuring testimony from a child psychologist and recovered students. This transparent approach earned their support, and within a year, participation grew from 7 to 65 students weekly. Seeing the impact locally, I developed a toolkit that's now been implemented in 12 schools across our state. Mental health education must become as fundamental as physical education in our curriculum. If given this platform, I would partner with the state department of education to integrate evidence-based mental wellness programs starting in elementary school, because prevention and early intervention save lives. I envision creating a digital resource hub connecting teens with age-appropriate support services and developing a parent education series that helps families recognize warning signs. Mental health challenges don't discriminate—they affect people regardless of achievement, popularity, or circumstance—and neither should our support systems. I want to use my voice to transform how we approach mental wellbeing, moving from crisis response to proactive care, because everyone deserves to know they're not alone in their struggles.";
    }
  }
  
  if (question === "Why do you want to win this title?") {
    if (timeLimit <= 60) {
      return "I want to win this title because of Sophia, a 12-year-old I mentor through Big Sisters. When we first met, she wouldn't make eye contact and told me girls 'can't be leaders.' This broke my heart. For two years, I've shown her examples of women breaking barriers, and recently, she announced she's running for student council. Her transformation reminds me of the power of visible role models. This title would amplify my work with the STEM mentorship program I founded, which has already reached 200 middle school girls in underserved communities. With this platform, I could expand to five additional schools next year. Beyond programs, this role demands authenticity, dedication and clear communication—skills I've honed through four years of competitive public speaking and community organizing. I'm ready not just to wear the crown, but to use it to reflect light onto others who need to see their own potential.";
    } else {
      return "I want to win this title because of what happened last April in Ms. Rodriguez's fifth-grade classroom. I was there to lead a workshop for my 'Girls Who Code' initiative when a student named Tanya asked me, 'Why would someone like you care about someone like me?' That question revealed how many young girls still don't see themselves represented in leadership positions. Growing up in a rural community with limited resources, I understand this perspective intimately. When I was Tanya's age, I had never met a woman engineer despite my passion for building and problem-solving. This reality inspired me to create STEM Sisters, a mentorship program pairing professional women in STEM with middle school girls from underrepresented backgrounds. What started with just 12 participants has grown to serve over 300 students across our state, with 87% reporting increased confidence in pursuing technical careers. While I'm proud of this impact, this title would provide the platform, connections, and resources to implement our program statewide. Beyond my STEM initiative, serving as titleholder would allow me to address the intersecting challenges facing young women today—from mental health stigma to economic opportunity gaps. My preparation for this responsibility has been lifelong: from overcoming selective mutism through speech therapy as a child, to developing communication skills through debate team and leadership experience as student body president and nonprofit founder. I bring not just passion but proven ability to create sustainable initiatives that continue beyond my involvement. Last week, Tanya emailed me about starting a coding club at her school. This title isn't about personal recognition—it's about becoming the mirror that reflects back possibility to every child who has ever doubted they belong. I want to serve as a role model who shows that leadership comes in many forms and backgrounds, and that with determination and support, one person's vision can create ripples of transformation throughout an entire community.";
    }
  }
  
  // Generic answer for other questions requiring stories
  if (question.includes("failure") || question.includes("failed")) {
    if (timeLimit <= 60) {
      return "My most significant failure occurred during my sophomore year when I ran for student government president and lost by just seven votes. I had been overconfident and hadn't adequately prepared for the debate portion of the campaign. The loss was devastating at first—I'd put my name forward publicly and fallen short. However, that failure became transformative. I reached out to the winner and asked to collaborate on initiatives we both valued. Through this partnership, we implemented a mental health awareness program that continues today. This experience taught me that failure isn't final—it's feedback. I learned to prepare more thoroughly, to listen to different perspectives, and that sometimes not getting what you want leads to something even more impactful.";
    } else {
      return "My most significant failure happened during my junior year of college when I organized a charity fashion show that fell dramatically short of expectations. Despite months of planning, we sold less than half our tickets and raised only 30% of our fundraising goal for the local women's shelter. I was devastated—not just for myself, but for the organization counting on those funds. After allowing myself time to process the disappointment, I conducted a thorough post-mortem analysis. I discovered several critical errors: I had selected an inconvenient date that conflicted with a major campus event, underestimated the marketing budget needed, and failed to leverage existing campus networks effectively. Rather than hiding from this failure, I met with the shelter director to apologize personally and propose a new fundraising strategy. Over the next semester, I coordinated a series of smaller, targeted events—a silent auction, a benefit concert, and a community workshop series—that ultimately raised three times our original goal. This experience fundamentally changed my approach to leadership and planning. I learned to conduct thorough research before committing to dates, to build broader coalitions of support, to create contingency plans, and most importantly, to view setbacks as opportunities for innovation. This failure taught me resilience and humility in ways success never could, and I now approach challenges with both greater confidence and greater care.";
    }
  }
  
  // Generic story-based response for all other questions
  if (question.includes("difficult decision") || question.includes("make a decision") || question.includes("overcome") || question.includes("challenge") || question.includes("obstacle") || question.includes("failure") || question.includes("failed") || question === "What is your stance on mental health awareness?" || question === "Why do you want to win this title?") {
    // Already handled above
    return "";
  }

  if (timeLimit <= 60) {
    return `When answering ${question}, I think of my experience volunteering at Hope Community Center last year. Our neighborhood faced rising youth disengagement, so I initiated weekend workshops teaching practical job skills. Initially, only five teens attended, but by addressing their specific needs—like resume building and interview practice—attendance grew to thirty weekly participants. The breakthrough moment came when Marcus, a previously disengaged student, secured an internship using the skills he'd learned. This experience taught me that meaningful impact comes from listening first, then acting with purpose. The program has now been adopted by three additional community centers, creating a sustainable model that continues helping young people connect their talents with opportunities. This taught me that small, consistent actions can create lasting positive change.`;
  } else {
    return `When considering ${question}, I'm reminded of my experience launching the "Bridge Builders" initiative at my university. After noticing the growing divide between international and domestic students on campus, I researched the issue by conducting interviews with students from both groups. The findings revealed a simple but profound barrier: lack of structured opportunities for meaningful interaction. With a team of five diverse student leaders, we created a program pairing international and domestic students for cultural exchange activities throughout the semester. We started with just 20 participants but faced an immediate challenge when attendance dropped significantly after the first event. Rather than giving up, we surveyed the remaining participants and discovered our formal approach felt forced. We pivoted to hosting casual cooking workshops where students taught each other family recipes, creating natural conversations around food and heritage. This adjustment transformed the program—participation grew to over 100 students, with 85% reporting they formed lasting friendships across cultural lines. The university has now incorporated our model into their official international student orientation. This experience taught me that effective leadership requires both vision and adaptability—being willing to adjust your approach when initial plans don't resonate. It also showed me that sometimes the simplest solutions, like sharing a meal, can bridge the most complex divides.`;
  }

};
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
  "What is your favorite holiday and why?",
  "What are your hobbies and interests?",
  "If you could have dinner with anyone, dead or alive, who would it be?",
  "What is your favorite book?",
  "What is your favorite movie?",
  "What is your favorite song?",
  "What is your favorite quote?",
  "If you could travel anywhere in the world, where would you go?",
  "What is your dream job?",
  "What is your biggest fear?",
  "What makes you laugh?",
  "What is something people would be surprised to know about you?",
  "How do you handle stress?",
  "What motivates you?",
  "What are you passionate about?",
  "What is your favorite memory?",
  "What do you do in your free time?",
  "Who has been the most influential person in your life?",
  "What is the best advice you've ever received?",
  "What would you do with a million dollars?",
  "If you could change one thing about the world, what would it be?",
  "What does success mean to you?",
  "What are three words that best describe you?",
  "What is your biggest accomplishment?",
  "What is something you've always wanted to try?",
  "How do you define beauty?",
  "What is your favorite charity or cause?",

  // Social Issues and Current Events
  "What do you think is the biggest issue facing young people today?",
  "How do you stay informed about current events?",
  "What is your opinion on social media's impact on society?",
  "How would you address bullying in schools?",
  "What are your thoughts on environmental conservation?",
  "How can we make our communities safer?",
  "What role should pageant winners play in social causes?",
  "How would you promote education in underserved communities?",
  "What is your stance on mental health awareness?",
  "How can we bridge generational divides?",
  "What would you do to promote diversity and inclusion?",
  "How do you think we can combat poverty?",
  "What is your opinion on the importance of voting?",
  "How would you encourage young people to get involved in their communities?",
  "What do you think about the role of technology in our daily lives?",
  "How can we support veterans and their families?",
  "What would you do to promote literacy?",
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

  const { checkUsage, limits } = useSubscription();
  const [showUsage, setShowUsage] = useState(false);
  
  const [isLimitModalOpen, setIsLimitModalOpen] = useState(false);
  const [showExampleAnswer, setShowExampleAnswer] = useState(false);
  
  // Practice setup state
  const [mode, setMode] = useState<'question' | 'rounds'>('question');
  const [numQuestions, setNumQuestions] = useState(3); // Only used for rounds mode
  const [timeLimit, setTimeLimit] = useState(90);
  const [currentStep, setCurrentStep] = useState<'setup' | 'settings' | 'question' | 'grading' | 'feedback'>('setup');
  const [showAudioVisualizer, setShowAudioVisualizer] = useState(true);
  
  // Question state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  
  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [hasStarted, setHasStarted] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  
  // Feedback state
  const [feedback, setFeedback] = useState<InterviewFeedback | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Audio recording
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const transcriptionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);

  // Timer ref
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);

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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (transcriptionIntervalRef.current) {
        clearInterval(transcriptionIntervalRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(console.error);
      }
    };
  }, []);

  // Start practice session
  const startPractice = async () => {
    const usage = await checkUsage('interview_question');
    if (!usage.allowed) {
      setIsLimitModalOpen(true);
      return;
    }

    const shuffled = [...INTERVIEW_QUESTIONS].sort(() => Math.random() - 0.5);
    
    // For Questions mode: prepare one question at a time
    // For Rounds mode: prepare all questions upfront
    if (mode === 'question') {
      setCurrentQuestion(shuffled[0]);
    } else {
      // Store all questions for the round
      setCurrentQuestion(shuffled[0]);
    }
    
    setCurrentQuestionIndex(0);
    setCurrentStep('question');
    setSessions([]);
    setFeedback(null);
    setError(null);
    setTimeLeft(timeLimit);
    setHasStarted(false);
    setCurrentTranscript('');
    setShowAudioVisualizer(false); // Hide audio visualizer when starting practice
  };

  // Audio visualization setup
  const setupAudioVisualization = (stream: MediaStream) => {
    // Create audio context and analyzer
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    const audioContext = new AudioContext();
    audioContextRef.current = audioContext;
    
    // Create analyzer node
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    analyserRef.current = analyser;
    
    // Connect audio source to analyzer
    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);
    
    // Create data array for visualization
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    dataArrayRef.current = dataArray;
    
    // Start visualization loop
    const updateVisualization = () => {
      if (!isRecording) return;
      
      analyser.getByteFrequencyData(dataArray);
      animationFrameRef.current = requestAnimationFrame(updateVisualization);
    };
    
    updateVisualization();
  };

  // Start recording with real-time transcription
  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      setIsRecording(true);
      setHasStarted(true);
      setError(null);
      setCurrentTranscript('Starting to listen...');
      audioChunksRef.current = [];

      // Setup audio visualization
      setupAudioVisualization(stream);

      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        await processRecordedAudio();
      };

      // Start recording with 1-second intervals for real-time transcription
      mediaRecorderRef.current.start(1000);
      setCurrentTranscript('🎤 Listening... speak now!');

      // Start real-time transcription every 2 seconds
      let chunkCount = 0;
      transcriptionIntervalRef.current = setInterval(async () => {
        if (audioChunksRef.current.length > chunkCount) {
          chunkCount = audioChunksRef.current.length;
          await transcribeRealTime();
        }
      }, 2000);

    } catch (error: any) {
      setError('Failed to access microphone. Please ensure you have granted microphone permissions.');
      console.error('Microphone access error:', error);
    }
  };

  // Real-time transcription during recording
  const transcribeRealTime = async () => {
    if (audioChunksRef.current.length === 0) return;

    try {
      // Create audio blob from current chunks
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      
      // Only transcribe if we have enough audio data (at least 1 second worth)
      if (audioBlob.size < 10000) return;

      // Convert to base64 for API
      const base64Audio = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(audioBlob);
      });

      // Send to Whisper API for real-time transcription
      const response = await fetch('/api/interview/transcribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          audio: base64Audio,
          questionNumber: currentQuestionIndex + 1,
          question: currentQuestion,
          duration: timeLimit - timeLeft,
          realtime: true
        })
      });

      const result = await response.json();

      if (response.ok && result.transcript) {
        setCurrentTranscript(`🎤 "${result.transcript}"`);
      }
    } catch (error) {
      // Don't show errors for real-time transcription, just continue
      console.log('Real-time transcription update failed, continuing...');
    }
  };

  // Stop recording
  const handleStopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      setIsRecording(false);
      mediaRecorderRef.current.stop();
      
      // Stop real-time transcription
      if (transcriptionIntervalRef.current) {
        clearInterval(transcriptionIntervalRef.current);
        transcriptionIntervalRef.current = null;
      }
      
      // Stop the stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      // Stop visualization
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      
      // Close audio context
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(console.error);
        audioContextRef.current = null;
      }
      
      setCurrentTranscript('🔄 Processing your complete answer...');
    }
  }, [isRecording]);

  // Process recorded audio with Whisper
  const processRecordedAudio = async () => {
    if (audioChunksRef.current.length === 0) {
      setError('No audio recorded. Please try again.');
      return;
    }

    try {
      setIsProcessing(true);
      
      // Create audio blob
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      
      // Convert to base64 for API using FileReader
      const base64Audio = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = (reader.result as string).split(',')[1]; // Remove data:audio/webm;base64, prefix
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(audioBlob);
      });

      // Send to Whisper API for transcription
      const transcribeResponse = await fetch('/api/interview/transcribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          audio: base64Audio,
          questionNumber: currentQuestionIndex + 1,
          question: currentQuestion,
          duration: timeLimit - timeLeft
        })
      });

      const transcribeResult = await transcribeResponse.json();

      if (!transcribeResponse.ok) {
        throw new Error(transcribeResult.error || 'Failed to transcribe audio');
      }

      const transcript = transcribeResult.transcript.trim();
      setCurrentTranscript(transcript);

      if (!transcript) {
        setError('No speech detected. Please try speaking more clearly.');
        setIsProcessing(false);
        return;
      }

      // Save the session
      const session: InterviewSession = {
        questionNumber: currentQuestionIndex + 1,
        question: currentQuestion,
        transcript: transcript,
        duration: timeLimit - timeLeft
      };
      
      setSessions(prev => [...prev, session]);
      
      // Process feedback
      await processFeedback([...sessions, session]);

    } catch (error: any) {
      setError(error.message || 'Failed to process audio');
      setIsProcessing(false);
    }
  };

  // Next question
  const nextQuestion = async () => {
    // Check if the user has reached their usage limit
    const usage = await checkUsage('interview_question');
    if (!usage.allowed) {
      setIsLimitModalOpen(true);
      return;
    }
    
    // For question mode, we always allow more questions as long as they're under their limit
    // For rounds mode, we check if we've reached the configured number of questions
    if (mode === 'question' || currentQuestionIndex < numQuestions - 1) {
      const shuffled = [...INTERVIEW_QUESTIONS].sort(() => Math.random() - 0.5);
      setCurrentQuestionIndex(prev => prev + 1);
      setCurrentQuestion(shuffled[0]); // Always get a fresh random question
      setTimeLeft(timeLimit);
      setHasStarted(false);
      setCurrentTranscript('');
    } else {
      // All questions completed for rounds mode, show final feedback
      setCurrentStep('feedback');
    }
  };

  // Retry current question
  const retryQuestion = () => {
    setTimeLeft(timeLimit);
    setHasStarted(false);
    setCurrentTranscript('');
    setError(null);
  };

  // Process speech and generate feedback
  const processFeedback = async (allSessions: InterviewSession[]) => {
    setIsProcessing(true);
    setError(null);
    setCurrentStep('grading');

    try {
      // Get the most recent session (the one we just completed)
      const currentSession = allSessions[allSessions.length - 1];
      
      const response = await fetch('/api/interview/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          question: currentSession.question,
          answer: currentSession.transcript
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate feedback');
      }

      setFeedback(result.feedback);
      // Usage tracking still happens but popup is disabled
      // setShowUsage(true);
      
      // Track interview question usage
      try {
        // Get the session either from supabase or from the session context
        let accessToken = null;
        if (supabase?.auth) {
          const { data } = await supabase.auth.getSession();
          accessToken = data?.session?.access_token;
        }
        
        if (accessToken) {
          await fetch('/api/subscription/track-interview-usage', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`
            }
          });
        }
      } catch (trackError) {
        console.error('Failed to track usage:', trackError);
        // Non-blocking - continue even if tracking fails
      }
      
      // CRITICAL DIFFERENCE: Questions mode vs Rounds mode
      if (mode === 'question') {
        // Questions mode: Show feedback immediately after each question
        setCurrentStep('feedback');
      } else if (mode === 'rounds') {
        // Rounds mode: Continue to next question OR show final feedback if done
        if (currentQuestionIndex >= numQuestions - 1) {
          // All rounds complete - show comprehensive feedback
          setCurrentStep('feedback'); 
        } else {
          // More questions remaining - automatically go to next question
          setTimeout(() => {
            nextQuestion();
            setCurrentStep('question');
            setIsProcessing(false);
          }, 1000); // Brief pause
        }
      }

    } catch (err: any) {
      setError(err.message || 'Failed to generate feedback');
      setCurrentStep('question'); // Go back to question on error
    } finally {
      if (mode === 'question') {
        setIsProcessing(false);
      }
      // For rounds mode, setIsProcessing(false) is handled in the setTimeout above
    }
  };

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate progress percentage - different for question vs rounds mode
  const progressPercentage = mode === 'question' 
    ? 0 // No progress bar needed for question mode
    : Math.min(100, (sessions.length / numQuestions) * 100);
  
  // For question numbering
  const currentQuestionNumber = currentQuestionIndex + 1;
  const questionDisplay = mode === 'question'
    ? `Question ${currentQuestionNumber}` // Just show the question number without limit
    : `Question ${currentQuestionNumber} of ${numQuestions}`; // Show progress for rounds mode

  // Audio Visualizer Component
  const AudioVisualizer = () => {
    const [bars] = useState(20); // Number of bars in the visualizer
    const [audioData, setAudioData] = useState<number[]>(Array(bars).fill(5));
    const [isListening, setIsListening] = useState(false);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const micStreamRef = useRef<MediaStream | null>(null);
    
    // Initialize audio context and start listening
    useEffect(() => {
      const startListening = async () => {
        try {
          // Get microphone access
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          micStreamRef.current = stream;
          
          // Create audio context
          const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
          const audioContext = new AudioContext();
          audioContextRef.current = audioContext;
          
                      // Create analyzer
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 1024; // Higher FFT size for more detailed frequency data
            analyser.smoothingTimeConstant = 0.5; // Balance between responsiveness and smoothness
            analyserRef.current = analyser;
          
          // Connect microphone to analyzer
          const source = audioContext.createMediaStreamSource(stream);
          source.connect(analyser);
          
          // Start visualization loop
          const bufferLength = analyser.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);
          
          const updateVisualization = () => {
            if (!analyserRef.current) return;
            
            // Get frequency data
            analyserRef.current.getByteFrequencyData(dataArray);
            
            // Calculate overall volume for better speech detection
            let totalSum = 0;
            for (let j = 0; j < bufferLength; j++) {
              totalSum += dataArray[j];
            }
            const overallVolume = totalSum / bufferLength;
            
            // Boost factor based on overall volume - makes visualizer more sensitive to speech
            // When volume is low, we apply more boost to make small sounds visible
            const minBoost = 1.5;
            const maxBoost = 3.5;
            const volumeThreshold = 10; // Lower threshold for detecting speech
            const boostFactor = overallVolume < volumeThreshold 
              ? maxBoost // Apply max boost when volume is very low
              : Math.max(minBoost, maxBoost - (overallVolume - volumeThreshold) / 50);
            
            // Map frequency data to our bars with emphasis on speech frequencies
            const newAudioData = Array(bars).fill(0).map((_, i) => {
              // Each bar represents a frequency range, but we'll emphasize mid-range frequencies
              // Human speech is typically 85-255 Hz (fundamental) and up to 8kHz (harmonics)
              // We'll give more weight to these frequency ranges
              
              // Get the frequency range for this bar
              const startIndex = Math.floor(i * bufferLength / bars);
              const endIndex = Math.floor((i + 1) * bufferLength / bars);
              
              // Calculate the center frequency of this range
              const centerFreq = (startIndex + endIndex) / 2 / bufferLength * (audioContext.sampleRate / 2);
              
              // Speech emphasis factor - boost frequencies in speech range
              // Peak emphasis around 1-3kHz where speech is most intelligible
              let speechEmphasis = 1.0;
              if (centerFreq > 200 && centerFreq < 4000) {
                // Extra boost for speech frequencies
                speechEmphasis = 1.5;
                if (centerFreq > 800 && centerFreq < 2500) {
                  // Maximum boost for the most important speech frequencies
                  speechEmphasis = 2.0;
                }
              }
              
              // Average the frequencies in this range
              let sum = 0;
              for (let j = startIndex; j < endIndex; j++) {
                sum += dataArray[j];
              }
              const average = sum / (endIndex - startIndex);
              
              // Apply speech emphasis and boost factor
              const boostedValue = average * speechEmphasis * boostFactor;
              
              // Scale to percentage (5-90%) with smoother response curve
              // Use cubic easing for smoother visual response
              const normalized = boostedValue / 255;
              const eased = normalized * normalized * (3 - 2 * normalized); // Smooth cubic easing
              return Math.max(5, Math.min(90, eased * 90));
            });
            
            setAudioData(newAudioData);
            animationFrameRef.current = requestAnimationFrame(updateVisualization);
          };
          
          setIsListening(true);
          animationFrameRef.current = requestAnimationFrame(updateVisualization);
        } catch (error) {
          console.error('Error accessing microphone:', error);
        }
      };
      
      startListening();
      
      // Cleanup
      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        
        if (audioContextRef.current) {
          audioContextRef.current.close().catch(console.error);
        }
        
        if (micStreamRef.current) {
          micStreamRef.current.getTracks().forEach(track => track.stop());
        }
      };
    }, [bars]);
    
    return (
      <div className="fixed bottom-40 left-0 right-0 mx-auto w-11/12 max-w-md" style={{ zIndex: 50 }}>
        <div className="flex items-end justify-center h-20 w-full gap-[2px]">
          {Array.from({ length: bars }).map((_, i) => {
            // Alternate colors for visual interest
            const isEven = i % 2 === 0;
            const gradientClass = isEven 
              ? "bg-gradient-to-t from-pink-600 to-pink-400" 
              : "bg-gradient-to-t from-purple-600 to-purple-400";
            
            return (
              <motion.div
                key={i}
                className={cn(
                  "rounded-t-full w-full", 
                  gradientClass
                )}
                style={{ 
                  height: `${audioData[i]}%`,
                  transition: 'height 0.15s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              />
            );
          })}
        </div>
        {!isListening && (
          <div className="text-center mt-2 text-xs text-white bg-pink-600/80 rounded-full py-1 px-2">
            Please allow microphone access
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Usage popup disabled
      <UsageAfterAction open={showUsage} onOpenChange={setShowUsage} focus="interview" /> */}
      
      {/* Example Answer Modal - iOS Style */}
      <Dialog open={showExampleAnswer} onOpenChange={setShowExampleAnswer}>
        <DialogContent className="max-w-md bg-white/90 backdrop-blur-sm rounded-3xl border-0 shadow-lg p-0 overflow-hidden">
          <div className="relative">
            {/* Floating close button */}
            <button
              onClick={() => setShowExampleAnswer(false)}
              className="absolute top-3 right-3 p-2 rounded-full bg-white/80 hover:bg-white shadow-sm z-10"
              aria-label="Close"
            >
              <X className="h-4 w-4 text-gray-600" />
            </button>
            
            {/* Header with gradient */}
            <div className="bg-gradient-to-r from-pink-400 to-purple-400 px-6 py-5">
              <div className="flex items-center gap-2 mb-1">
                <Award className="h-5 w-5 text-white" />
                <h3 className="text-lg font-bold text-white">Example Answer</h3>
              </div>
              <p className="text-white/80 text-sm">
                Speaking time: ~{Math.ceil(getExampleAnswerForQuestion(currentQuestion, timeLimit).split(' ').length / 2.5)} seconds
              </p>
            </div>
          </div>
          
          <div className="px-6 py-4 max-h-[50vh] overflow-y-auto">
            <div className="mb-3">
              <p className="text-sm font-medium text-gray-500">Question</p>
              <p className="text-gray-800 font-medium">{currentQuestion}</p>
            </div>
            
            <div className="bg-pink-50/50 border border-pink-100 rounded-xl p-4 mb-4 shadow-inner">
              <p className="text-gray-800 text-sm leading-relaxed">
                {getExampleAnswerForQuestion(currentQuestion, timeLimit)}
              </p>
            </div>
            
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1.5">What makes this answer effective:</p>
              <div className="flex flex-wrap gap-2">
                {["Personal", "Confident", "Specific", "Structured", "Authentic"].map((tag) => (
                  <span key={tag} className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      <LimitReachedModal
        isOpen={isLimitModalOpen}
        onClose={() => setIsLimitModalOpen(false)}
        limitType="Interview Questions"
        limit={limits.interviewQuestionsWeekly}
        timePeriod="week"
      />
      <AnimatePresence>
        {showAudioVisualizer && <AudioVisualizer />}
      </AnimatePresence>
      <div className="min-h-screen p-3 flex flex-col" style={{ backgroundColor: '#FFB6C1' }}>
      {/* Header at the top */}
      <div className="text-center mb-10 pt-8">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold text-gray-800 mb-2"
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
      
      {/* Content centered but higher up */}
      <div className="w-full max-w-md mx-auto mt-4 flex-grow flex flex-col justify-start items-center">

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
              <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl rounded-3xl overflow-hidden transform transition-all duration-300">
                  <CardHeader className="pb-4 pt-8">
                   <CardTitle className="text-gray-800 text-2xl font-bold text-center">
                      Pick Your Style
                    </CardTitle>
                  </CardHeader>
                 <CardContent className="space-y-6 px-6 pb-8">
                  <Button
                    onClick={() => { setMode('question'); setCurrentStep('settings'); }}
                    className="w-full bg-white hover:bg-pink-50 text-pink-600 border-2 border-pink-200 rounded-2xl py-8 font-medium text-lg shadow-sm flex items-center justify-center gap-3 transition-all duration-300 hover:shadow-md"
                  >
                    <MessageSquare className="w-6 h-6" />
                    Rapid Fire (one at a time)
                  </Button>
                  <div className="relative">
                    <Button
                      onClick={() => { setMode('rounds'); setCurrentStep('settings'); }}
                      className="w-full bg-white hover:bg-pink-50 text-pink-600 border-2 border-pink-200 rounded-2xl py-8 font-medium text-lg shadow-sm flex items-center justify-center gap-3 transition-all duration-300 hover:shadow-md"
                    >
                      <Sparkles className="w-6 h-6" />
                      Full Run (all at once)
                    </Button>
                    <span className="absolute top-0 right-4 bg-pink-100 text-pink-600 text-xs font-semibold px-3 py-1 rounded-full shadow-sm transform -translate-y-1/2">
                      More realistic
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Settings Step */}
          {currentStep === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl rounded-3xl overflow-hidden transform transition-all duration-300">
                 <CardHeader className="pb-4 pt-8">
                   <CardTitle className="text-gray-800 text-2xl font-bold text-center">
                    {mode === 'question' ? 'Rapid Fire Settings' : 'Full Run Settings'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 px-6 pb-8">
                  {mode === 'rounds' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Number of questions:
                      </label>
                      <div className="flex gap-2 flex-wrap">
                        {[3, 5, 7, 10].map((num) => (
                          <button
                            key={num}
                            onClick={() => setNumQuestions(num)}
                            className={`px-3 py-1 rounded text-sm transition-colors ${
                              numQuestions === num
                                ? 'bg-purple-600 text-white'
                                : 'bg-white text-purple-600 border border-purple-300 hover:bg-purple-100'
                            }`}
                          >
                            {num}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Time limit per question:
                    </label>
                    <div className="flex gap-2 flex-wrap">
                      {[30, 45, 60, 75, 90].map((time) => (
                        <button
                          key={time}
                          onClick={() => setTimeLimit(time)}
                          className={`px-3 py-1 rounded text-sm transition-colors ${
                            timeLimit === time
                              ? mode === 'question' ? 'bg-blue-600 text-white' : 'bg-purple-600 text-white'
                              : mode === 'question' ? 'bg-white text-blue-600 border border-blue-300 hover:bg-blue-100' : 'bg-white text-purple-600 border border-purple-300 hover:bg-purple-100'
                          }`}
                        >
                          {time}s
                        </button>
                      ))}
                    </div>
                  </div>
                  <Button
                    onClick={startPractice}
                    className={`w-full py-3 text-white font-medium rounded-lg ${
                      mode === 'question'
                        ? 'bg-blue-600 hover:bg-blue-700'
                        : 'bg-purple-600 hover:bg-purple-700'
                    }`}
                  >
                    Start {mode === 'question' ? 'Rapid Fire' : 'Full Run'}
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
                      <span className="text-sm font-medium text-gray-700">{questionDisplay}</span>
                      <span className="text-sm text-gray-500">{Math.round(progressPercentage)}% Complete</span>
                    </div>
                    <div className="w-full bg-pink-200 rounded-full h-2 relative">
                      <motion.div
                        className="bg-pink-500 h-full rounded-full"
                        style={{ width: `${progressPercentage}%` }}
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercentage}%` }}
                        transition={{ duration: 0.5 }}
                      />
                      {/* Fixed blue dot positioning - now properly aligned at end of pink bar */}
                      <motion.div
                        className="absolute top-1/2 w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow-sm"
                        style={{ 
                          left: `calc(${progressPercentage}% - 6px)`,
                          transform: 'translateY(-50%)'
                        }}
                        initial={{ left: '0%' }}
                        animate={{ left: `calc(${progressPercentage}% - 6px)` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Current Question */}
                <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center justify-between text-gray-800">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-pink-600" />
                        Interview Question
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                        mode === 'question' 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-purple-100 text-purple-700'
                      }`}>
                        {mode === 'question' ? 'Questions Mode' : 'Rounds Mode'}
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-pink-50 p-4 rounded-lg border border-pink-100">
                      <p className="text-gray-800 font-medium text-lg leading-relaxed">
                        {currentQuestion}
                      </p>
                    </div>

                    {/* Mode-specific instructions */}
                    <div className={`p-3 rounded-lg text-sm ${
                      mode === 'question' 
                        ? 'bg-blue-50 border border-blue-200 text-blue-800' 
                        : 'bg-purple-50 border border-purple-200 text-purple-800'
                    }`}>
                      {mode === 'question' ? (
                        <p><strong>Questions Mode:</strong> You'll get feedback after this question and can choose to continue or stop.</p>
                      ) : (
                        <p><strong>Rounds Mode:</strong> Answer all {numQuestions} questions, then get comprehensive feedback at the end.</p>
                      )}
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
                    <div className="flex justify-center">
                      {!isRecording && !hasStarted ? (
                        <Button
                          onClick={handleStartRecording}
                          size="lg"
                          className="bg-pink-600 hover:bg-pink-700 text-white px-8 py-3 rounded-full shadow-lg"
                        >
                          <Mic className="w-5 h-5 mr-2" />
                          Start Recording
                        </Button>
                      ) : isRecording ? (
                        <Button
                          onClick={handleStopRecording}
                          size="lg"
                          className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-full shadow-lg border-2 border-red-800 animate-pulse"
                        >
                          <MicOff className="w-5 h-5 mr-2" />
                          Stop Recording
                        </Button>
                      ) : (
                        <div className="flex gap-2">
                          <Button
                            onClick={retryQuestion}
                            variant="outline"
                            size="sm"
                            className="border-pink-200 text-pink-600 hover:bg-pink-50"
                          >
                            <RotateCcw className="w-4 h-4 mr-1" />
                            Retry
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Live Transcript Preview */}
                    {currentTranscript && (
                      <div className={`p-4 rounded-lg border-2 ${
                        isRecording 
                          ? 'bg-green-50 border-green-300 border-dashed animate-pulse' 
                          : 'bg-blue-50 border-blue-300'
                      }`}>
                        <div className="flex items-center gap-2 mb-2">
                          {isRecording ? (
                            <>
                              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                              <p className="text-sm font-semibold text-green-700">Live transcript:</p>
                            </>
                          ) : (
                            <>
                              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                              <p className="text-sm font-semibold text-blue-700">Transcript:</p>
                            </>
                          )}
                        </div>
                        <p className={`text-sm leading-relaxed ${
                          isRecording ? 'text-green-800' : 'text-blue-800'
                        }`}>
                          {currentTranscript}
                        </p>
                        {isRecording && (
                          <p className="text-xs text-green-600 mt-2 italic">
                            ✨ Updating in real-time as you speak...
                          </p>
                        )}
                      </div>
                    )}

                    {/* Processing Indicator */}
                    {isProcessing && (
                      <div className="text-center">
                        <div className="inline-flex items-center gap-2 text-pink-600">
                          <div className="w-4 h-4 border-2 border-pink-600 border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-sm font-medium">
                            Processing your response...
                          </span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          )}

          {/* Grading Step */}
          {currentStep === 'grading' && (
            <motion.div
              key="grading"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
                <CardContent className="p-8 text-center">
                  <div className="mb-6">
                    <div className="w-16 h-16 bg-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Sparkles className="w-8 h-8 text-white animate-pulse" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">
                      Analyzing Your Response
                    </h3>
                    <p className="text-gray-600">
                      Our AI pageant coach is evaluating your answer...
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-center gap-2 text-pink-600">
                      <div className="w-2 h-2 bg-pink-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-pink-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-pink-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                    <p className="text-sm text-gray-500">This usually takes a few seconds...</p>
                  </div>
                </CardContent>
              </Card>
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
                {/* Mode Banner - Only shown in Rounds mode */}
                {mode === 'rounds' && (
                  <Card className="border-0 shadow-lg rounded-2xl bg-purple-50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h3 className="font-bold text-purple-700">
                              Rounds Mode - Feedback
                            </h3>
                            <p className="text-xs text-purple-600">
                              All {numQuestions} questions completed - Comprehensive review
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Card for question coaching tip or rounds summary */}
                <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-gray-800">
                      <Sparkles className="w-5 h-5 text-green-600" />
                      {mode === 'question' ? 'Question Feedback' : 'Interview Summary'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-800 leading-relaxed text-sm">
                      {mode === 'question' 
                        ? feedback.answers[0]?.coachingTip // Show coaching tip for question mode
                        : feedback.summary // Show summary for rounds mode
                      }
                    </p>
                  </CardContent>
                </Card>

                {/* Individual Answer Feedback */}
                {feedback.answers.map((answer, index) => (
                  <Card key={index} className="bg-white/90 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-gray-800 text-lg">
                        <MessageSquare className="w-4 h-4 text-pink-600" />
                        Question {currentQuestionNumber}
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

                      {/* Remove duplicate coaching tip from individual answer card in question mode */}
                      {mode === 'rounds' && (
                        <div className="bg-gray-50 rounded-lg p-4">
                          <p className="text-gray-800 text-sm leading-relaxed">{answer.coachingTip}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}

                {/* Overall Tips - Only show in Rounds mode */}
                {mode === 'rounds' && feedback.overallTips && feedback.overallTips.length > 0 && (
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

                {/* Navigation Buttons - CLEARLY DIFFERENT FOR EACH MODE */}
                <Card className={`border-0 shadow-lg rounded-2xl ${
                  mode === 'question' ? 'bg-blue-50 border-blue-200' : 'bg-purple-50 border-purple-200'
                }`}>
                  <CardContent className="p-4">
                                          {mode === 'question' ? (
                      /* QUESTIONS MODE: Individual question controls */
                      <div className="space-y-3">
                        <h4 className="font-semibold text-blue-700 text-center">What would you like to do next?</h4>
                        <div className="flex gap-3 flex-wrap">
                          <Button
                            onClick={() => {
                              setCurrentStep('question');
                              setShowAudioVisualizer(false); // Keep audio visualizer hidden when retrying
                              retryQuestion();
                            }}
                            variant="outline"
                            className="flex-1 border-blue-300 text-blue-700 hover:bg-blue-100"
                            size="sm"
                          >
                            <RotateCcw className="w-4 h-4 mr-1" />
                            Retry This Question
                          </Button>
                          
                          <Button
                            onClick={() => setShowExampleAnswer(true)}
                            variant="outline"
                            className="flex-1 border-yellow-300 bg-yellow-50 text-yellow-700 hover:bg-yellow-100"
                            size="sm"
                          >
                            <Star className="w-4 h-4 mr-1 text-yellow-500" />
                            See a Great Answer
                          </Button>
                          
                          <Button
                            onClick={async () => {
                              await nextQuestion();
                              // Only proceed if the modal wasn't shown (meaning they haven't hit their limit)
                              if (!isLimitModalOpen) {
                                setCurrentStep('question');
                                setShowAudioVisualizer(false); // Keep audio visualizer hidden when going to next question
                              }
                            }}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                            size="sm"
                          >
                            Next Question →
                          </Button>
                        </div>
                      </div>
                    ) : (
                      /* ROUNDS MODE: Round completion */
                      <div className="space-y-3">
                        <h4 className="font-semibold text-purple-700 text-center">Interview Round Complete!</h4>
                        <p className="text-sm text-purple-600 text-center">
                          You answered all {numQuestions} questions. Review your feedback above.
                        </p>
                                                  <Button
                            onClick={() => {
                              setCurrentStep('setup');
                              setShowAudioVisualizer(true); // Show audio visualizer again when returning to home
                            }}
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold"
                            size="sm"
                          >
                            <RotateCcw className="w-4 h-4 mr-1" />
                            Start New Practice Session
                          </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
    </>
  );
}