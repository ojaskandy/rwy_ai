import { useState, useEffect, useRef } from 'react';
import { Link } from 'wouter';
import CameraView from '@/components/CameraView';
import PermissionDialog from '@/components/PermissionDialog';
import LoadingState from '@/components/LoadingState';
import ScreenshotModal from '@/components/ScreenshotModal';
import { initPoseDetection, getModels } from '@/lib/poseDetection';
import { requestCameraPermission, getCameraStream } from '@/lib/cameraUtils';
import { useAuth } from '@/hooks/use-auth';
import { useTheme } from '@/components/theme-provider';
import { Button } from '@/components/ui/button';
import { 
  Sun, Moon, User, LogOut, Settings, Clock, Calendar, Award, Play, 
  Dumbbell, HelpCircle, MessageSquare, BarChart, Info, RefreshCw, Trash2,
  Home as HomeIcon, ListChecks, Loader2, PanelRightOpen, PanelRightClose, Palette,
  ChevronDown, ChevronUp, ScrollText, Smartphone, Sword, Target, X
} from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import Leaderboard from '@/components/Leaderboard';
import BeltDisplay from '@/components/BeltDisplay';
import SessionTimer from '@/components/SessionTimer';
import CurrentTime from '@/components/CurrentTime';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { apiRequest, getQueryFn } from '@/lib/queryClient';
import { format } from 'date-fns';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { isMobileDevice } from '@/lib/deviceUtils';

export type TrackingStatus = 'inactive' | 'loading' | 'ready' | 'active' | 'error';
export type CameraFacing = 'user' | 'environment';
export type SourceType = 'camera' | 'image' | 'video';

interface Recording {
  id: number;
  userId: number;
  fileUrl: string;
  title: string | null;
  notes: string | null;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

// Timer component specifically for the current session view on this page
function CurrentPageTimer() {
  const [sessionSeconds, setSessionSeconds] = useState(0);
  useEffect(() => {
    const timerInterval = setInterval(() => {
      setSessionSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timerInterval);
  }, []);

  const formatDisplayTime = (totalSeconds: number): string => {
    const h = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };
  return <span className="font-mono text-red-400">{formatDisplayTime(sessionSeconds)}</span>;
}

export default function Home() {
  // Auth and theme contexts
  const { user, logoutMutation } = useAuth();
  const { theme, setTheme } = useTheme();
  
  // State for application flow
  const [trackingStatus, setTrackingStatus] = useState<TrackingStatus>('inactive');
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  const [isTracking, setIsTracking] = useState<boolean>(false);
  
  // Media source state
  const [sourceType, setSourceType] = useState<SourceType>('camera');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraFacing, setCameraFacing] = useState<CameraFacing>('user');
  const [uploadedImage, setUploadedImage] = useState<HTMLImageElement | null>(null);
  const [uploadedVideo, setUploadedVideo] = useState<HTMLVideoElement | null>(null);
  const [mediaUrl, setMediaUrl] = useState<string | undefined>(undefined);
  
  // Detection settings
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(0.5);
  const [modelSelection, setModelSelection] = useState<string>('lightning');
  const [maxPoses, setMaxPoses] = useState<number>(1);
  const [showSkeleton, setShowSkeleton] = useState<boolean>(true);
  const [showPoints, setShowPoints] = useState<boolean>(true);
  
  // Background settings
  const [showBackground, setShowBackground] = useState<boolean>(true);
  const [backgroundOpacity, setBackgroundOpacity] = useState<number>(0.8);
  const [backgroundBlur, setBackgroundBlur] = useState<number>(0);
  
  // Reference settings
  const [showReferenceOverlay, setShowReferenceOverlay] = useState<boolean>(false);
  
  // UI state
  const [isFullscreenMode, setIsFullscreenMode] = useState<boolean>(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [isSessionPanelExpanded, setIsSessionPanelExpanded] = useState<boolean>(false);
  
  // Camera view options
  const [skeletonColorChoice, setSkeletonColorChoice] = useState<'red' | 'blue' | 'green' | 'purple' | 'orange'>('red');
  const [blackoutMode, setBlackoutMode] = useState<boolean>(true);
  
  // Dialog states
  const [showHowItWorksDialog, setShowHowItWorksDialog] = useState<boolean>(false);
  const [showLeaderboardDialog, setShowLeaderboardDialog] = useState<boolean>(false);
  const [showTips, setShowTips] = useState<boolean>(false);
  const [showCustomizeDialog, setShowCustomizeDialog] = useState<boolean>(false);
  
  // Added for Record button
  const [isRecording, setIsRecording] = useState<boolean>(false);
  
  // State for mobile warning popup
  const [showMobileWarningDialog, setShowMobileWarningDialog] = useState<boolean>(false);
  
  // Customize background state
  const [backgroundImages, setBackgroundImages] = useState<string[]>([]);
  const [selectedBackground, setSelectedBackground] = useState<string | null>(null);
  
  // Mock user belt data - to be replaced with API call
  const [userBelt, setUserBelt] = useState({
    color: 'red',
    name: 'Red Belt',
    level: 2
  });
  
  // Theme state for buttons
  const [buttonTheme, setButtonTheme] = useState<'sky' | 'crimson' | 'emerald' | 'amber'>('sky');
  
  // Fetch recordings for the session log
  const { data: recordings, isLoading: isLoadingRecordings, error: recordingsError } = useQuery<Recording[], Error>({
    queryKey: ['/api/recordings', user?.id],
    queryFn: () => apiRequest("GET", "/api/recordings").then(res => res.json()),
    enabled: !!user,
  });

  // Load routine notes from localStorage when component mounts
  useEffect(() => {
    const savedBelt = localStorage.getItem('userBelt');
    if (savedBelt) {
      setUserBelt(JSON.parse(savedBelt));
    }
    
    // Load saved background images
    const savedBackgrounds = localStorage.getItem('backgroundImages');
    if (savedBackgrounds) {
      setBackgroundImages(JSON.parse(savedBackgrounds));
    }
    
    // Load selected background
    const savedSelectedBackground = localStorage.getItem('selectedBackground');
    if (savedSelectedBackground) {
      setSelectedBackground(savedSelectedBackground);
    }

    // Load button theme
    const savedButtonTheme = localStorage.getItem('buttonTheme') as typeof buttonTheme;
    if (savedButtonTheme) {
      setButtonTheme(savedButtonTheme);
    }

    // Check if user has seen the welcome guide
    const hasSeenGuide = localStorage.getItem('hasSeenWelcomeGuide');
    if (!hasSeenGuide) {
      setShowHowItWorksDialog(true); // Show dialog on first visit
    }

    // Check for mobile device after user context is available
    if (user) {
      if (isMobileDevice()) {
        // Optionally, check localStorage here to show only once per session/device
        // For now, show every time on mobile after login
        setShowMobileWarningDialog(true);
      }
    }
  }, [user]); // Add user to dependency array to run when user loads

  // Screenshot modal
  const [screenshotData, setScreenshotData] = useState<string | null>(null);
  const [isScreenshotModalOpen, setIsScreenshotModalOpen] = useState<boolean>(false);

  // Initialize pose detection
  const loadModels = async () => {
    try {
      setIsLoading(true);
      setLoadingProgress(0);
      
      // Load camera stream if needed
      if (sourceType === 'camera' && !stream) {
        const newStream = await getCameraStream(cameraFacing);
        setStream(newStream);
      }
      
      // Load AI models
      await initPoseDetection(modelSelection);
      
      // Update status when everything is ready
      setTrackingStatus('ready');
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading pose detection models:', error);
      setTrackingStatus('error');
      setIsLoading(false);
    }
  };

  // Handle camera permission request
  const handlePermissionRequest = async () => {
    try {
      setIsLoading(true);
      const permission = await requestCameraPermission();
      setHasPermission(permission);
      
      if (permission) {
        setTrackingStatus('loading');
        setSourceType('camera');
        // Load AI models
        await loadModels();
      } else {
        setTrackingStatus('error');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error requesting camera permission:', error);
      setTrackingStatus('error');
      setIsLoading(false);
    }
  };

  // Toggle tracking state
  const toggleTracking = () => {
    setIsTracking(!isTracking);
    if (trackingStatus === 'ready') {
      setTrackingStatus('active');
    }
  };

  // Toggle reference overlay
  const toggleReferenceOverlay = () => {
    setShowReferenceOverlay(!showReferenceOverlay);
  };

  // Toggle fullscreen mode
  const toggleFullscreenMode = () => {
    setIsFullscreenMode(!isFullscreenMode);
  };

  // Handle image upload
  const handleImageUpload = (image: HTMLImageElement, url: string) => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    
    setSourceType('image');
    setUploadedImage(image);
    setMediaUrl(url);
    setTrackingStatus('ready');
  };

  // Handle video upload
  const handleVideoUpload = (video: HTMLVideoElement, url: string) => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    
    setSourceType('video');
    setUploadedVideo(video);
    setMediaUrl(url + '#video'); // Add flag to identify as video
    setTrackingStatus('ready');
  };

  // Take screenshot
  const handleScreenshot = (dataUrl: string) => {
    if (dataUrl.startsWith('blob:')) {
      // This is a reference media upload (not a screenshot)
      setMediaUrl(dataUrl);
    } else {
      // This is a regular screenshot
      setScreenshotData(dataUrl);
      setIsScreenshotModalOpen(true);
    }
  };

  // Toggle dark/light mode
  const toggleDarkMode = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    setIsDarkMode(newTheme === 'dark');
  };

  // Handle record button click
  const handleRecordClick = () => {
    setIsRecording(!isRecording);
  };
  
  // Handle background image upload
  const handleBackgroundImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) return;
    
    const file = event.target.files[0];
    const reader = new FileReader();
    
    reader.onload = (e) => {
      if (typeof e.target?.result === 'string') {
        const newImage = e.target.result;
        const updatedImages = [...backgroundImages, newImage];
        
        // Save to state and localStorage
        setBackgroundImages(updatedImages);
        localStorage.setItem('backgroundImages', JSON.stringify(updatedImages));
        
        // Automatically select the new image
        setSelectedBackground(newImage);
        localStorage.setItem('selectedBackground', newImage);
      }
    };
    
    reader.readAsDataURL(file);
  };
  
  // Handle background selection
  const handleSelectBackground = (imageUrl: string) => {
    setSelectedBackground(imageUrl);
    localStorage.setItem('selectedBackground', imageUrl);
  };
  
  // Handle background deletion
  const handleDeleteBackground = (imageUrl: string) => {
    const updatedImages = backgroundImages.filter(img => img !== imageUrl);
    setBackgroundImages(updatedImages);
    localStorage.setItem('backgroundImages', JSON.stringify(updatedImages));
    
    // If the deleted image was selected, clear the selection
    if (selectedBackground === imageUrl) {
      setSelectedBackground(null);
      localStorage.removeItem('selectedBackground');
    }
  };

  // Handle feedback submission by opening email client
  const handleFeedbackSubmit = () => {
    const username = user?.username || 'User';
    const subject = encodeURIComponent(`Feedback on CoachT by ${username}`);
    const body = encodeURIComponent("Please type your feedback here:\n\n"); // Default body
    window.location.href = `mailto:ojaskandy@gmail.com?subject=${subject}&body=${body}`;
  };

  const getButtonClasses = (theme: typeof buttonTheme, type: 'primary' | 'outline') => {
    const themes = {
      sky: {
        primary: 'bg-gradient-to-r from-sky-600 to-cyan-500 hover:from-sky-700 hover:to-cyan-600 text-white shadow-lg hover:shadow-sky-500/40 focus:ring-sky-500',
        outline: 'border-sky-700 text-sky-400 hover:bg-sky-900/30 hover:text-sky-300 focus:ring-sky-500',
      },
      crimson: {
        primary: 'bg-gradient-to-r from-red-600 to-rose-500 hover:from-red-700 hover:to-rose-600 text-white shadow-lg hover:shadow-red-500/40 focus:ring-red-500',
        outline: 'border-red-700 text-red-400 hover:bg-red-900/30 hover:text-red-300 focus:ring-red-500',
      },
      emerald: {
        primary: 'bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-700 hover:to-green-600 text-white shadow-lg hover:shadow-emerald-500/40 focus:ring-emerald-500',
        outline: 'border-emerald-700 text-emerald-400 hover:bg-emerald-900/30 hover:text-emerald-300 focus:ring-emerald-500',
      },
      amber: {
        primary: 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg hover:shadow-amber-500/40 focus:ring-amber-500',
        outline: 'border-amber-700 text-amber-400 hover:bg-amber-900/30 hover:text-amber-300 focus:ring-amber-500',
      }
    };
    return themes[theme][type];
  };

  // Effect to update background visibility based on blackout mode
  useEffect(() => {
    setShowBackground(!blackoutMode);
  }, [blackoutMode]);

  // Render main component
  return (
    <div className="min-h-screen flex flex-col bg-black overflow-hidden">
      {/* Mobile-optimized Header */}
      <header className="bg-gradient-to-r from-black to-red-950/90 border-b border-red-900/30 px-3 sm:px-6 py-2 sm:py-3 flex justify-between items-center shadow-md">
        <div className="flex items-center gap-2 sm:gap-4">
          <Link to="/welcome" className="cursor-pointer">
            <h1 className="text-lg sm:text-2xl font-bold gradient-heading flex items-center group z-50 relative">
              <motion.span 
                className="material-icons text-red-600 mr-1 sm:mr-2 text-base sm:text-lg"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
              >
                sports_martial_arts
              </motion.span>
              <span className="group-hover:text-red-500 transition-colors">CoachT</span>
            </h1>
          </Link>
          
          <div className="hidden sm:block h-8 w-px bg-red-900/30 mx-2"></div>
          
          {/* Current time - hidden on mobile */}
          <div className="hidden md:block">
            <CurrentTime className="ml-2" showSeconds={false} />
          </div>
        </div>

        {/* Belt Display - responsive */}
        <div className="flex-1 mx-2 sm:mx-4 max-w-lg">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 100, damping: 15 }}
          >
            <BeltDisplay 
              beltColor={userBelt.color} 
              beltName={userBelt.name} 
              beltLevel={userBelt.level} 
              stretched={true} 
              username={user?.username?.toUpperCase()} 
            />
          </motion.div>
        </div>
        
        <div className="flex items-center space-x-1 sm:space-x-3">
          {/* Animated Session timer - mobile optimized */}
          <motion.div 
            className="relative group hidden sm:block"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <SessionTimer className="transition-transform duration-300" />
            <div className="absolute inset-0 bg-red-500/10 rounded-md scale-105 animate-pulse -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </motion.div>
          
          {/* Profile button - mobile optimized */}
          <Link href="/profile">
            <motion.div 
              whileHover={{ scale: 1.05 }} 
              whileTap={{ scale: 0.95 }} 
              className="relative group"
            >
              <Button 
                variant="outline" 
                className="h-8 rounded-full border-red-600 bg-transparent hover:bg-red-700/20 flex items-center px-2 sm:px-3 transition-all duration-300 hover:shadow-red-500/30 hover:shadow-sm"
              >
                <User className="h-4 w-4 text-white sm:mr-2" />
                <span className="hidden sm:inline text-sm text-white font-medium">Profile</span>
              </Button>
            </motion.div>
          </Link>
            
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  variant="outline" 
                  className="h-8 rounded-full border-red-600 bg-transparent hover:bg-red-700/20 flex items-center px-2 sm:px-3"
                >
                  <Settings className="h-4 w-4 text-white sm:mr-2" />
                  <span className="hidden sm:inline text-sm text-white font-medium">Menu</span>
                </Button>
              </motion.div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40 border border-red-600 bg-gray-900">
              <DropdownMenuItem 
                className="cursor-pointer flex items-center text-white hover:bg-red-700/30"
              >
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="cursor-pointer flex items-center text-white hover:bg-red-700/30"
                onClick={() => setShowTips(true)}
              >
                <Info className="mr-2 h-4 w-4" />
                <span>Training Tips</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-red-900/30" />
              <DropdownMenuItem 
                className="cursor-pointer flex items-center text-white hover:bg-red-700/30" 
                onClick={() => logoutMutation.mutate()}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      
      {/* Mobile-optimized Navigation buttons bar */}
      <div className="bg-black/70 border-b border-red-900/30 px-3 sm:px-6 py-2 flex justify-center items-center shadow-md overflow-x-auto">
        <div className="w-full max-w-4xl flex justify-between min-w-fit">
          <div className="flex items-center gap-2 sm:gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="h-8 sm:h-10 rounded-full px-2 sm:px-4 py-1 sm:py-2 border border-red-600 bg-transparent hover:bg-red-700/20 flex items-center text-white transition-colors whitespace-nowrap"
              onClick={() => setShowHowItWorksDialog(true)}
            >
              <HelpCircle className="h-3 sm:h-4 w-3 sm:w-4 sm:mr-2" />
              <span className="hidden sm:inline font-medium text-sm">How it Works</span>
              <span className="sm:hidden font-medium text-xs ml-1">Help</span>
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="h-8 sm:h-10 rounded-full px-2 sm:px-4 py-1 sm:py-2 border border-red-600 bg-transparent hover:bg-red-700/20 flex items-center text-white transition-colors whitespace-nowrap"
              onClick={() => setShowLeaderboardDialog(true)}
            >
              <BarChart className="h-3 sm:h-4 w-3 sm:w-4 sm:mr-2" />
              <span className="hidden sm:inline font-medium text-sm">Leaderboard</span>
              <span className="sm:hidden font-medium text-xs ml-1">Stats</span>
            </motion.button>

            <Link href="/welcome">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="h-8 sm:h-10 rounded-full px-2 sm:px-4 py-1 sm:py-2 border border-red-600 bg-transparent hover:bg-red-700/20 flex items-center text-white transition-colors whitespace-nowrap"
              >
                <HomeIcon className="h-3 sm:h-4 w-3 sm:w-4 sm:mr-2" />
                <span className="hidden sm:inline font-medium text-sm">View Welcome Page</span>
                <span className="sm:hidden font-medium text-xs ml-1">Home</span>
              </motion.button>
            </Link>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="h-8 sm:h-10 rounded-full px-2 sm:px-4 py-1 sm:py-2 border border-red-600 bg-transparent hover:bg-red-700/20 flex items-center text-white transition-colors whitespace-nowrap"
              onClick={handleFeedbackSubmit}
            >
              <MessageSquare className="h-3 sm:h-4 w-3 sm:w-4 sm:mr-2" />
              <span className="hidden sm:inline font-medium text-sm">Feedback</span>
            </motion.button>
            
            <Button 
              variant="outline" 
              size="icon" 
              onClick={toggleDarkMode} 
              className="h-8 w-8 sm:h-10 sm:w-10 rounded-full border-red-600 bg-transparent hover:bg-red-700/20"
            >
              {isDarkMode ? 
                <Sun className="h-4 w-4 sm:h-5 sm:w-5 text-white" /> : 
                <Moon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              }
            </Button>
          </div>
        </div>
      </div>
      
      <main className="flex-1 flex flex-col">
        {/* Adjusted padding for the main content area */}
        <div className="flex-1 p-8 md:p-10">
          {isLoading && <LoadingState progress={loadingProgress} message="Loading pose detection models..." />}
          
          {(!hasPermission || trackingStatus === 'inactive') && !isTracking ? (
            // New layout for the home screen
            <div className="flex-1 flex flex-col items-center max-w-screen-xl mx-auto w-full h-full">
              {/* Centered Welcome Text and Actions */}
              <div className="space-y-6 sm:space-y-8 flex flex-col items-center mt-8 sm:mt-16 md:mt-24 px-4 sm:px-0 w-full max-w-2xl">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-center w-full">
                  <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold text-white leading-tight">
                    Ready to train, <span className="gradient-heading">{user?.username || 'User'}</span>?
                  </h1>
                  <p className="text-sky-200 mt-2 sm:mt-3 text-base sm:text-lg md:text-xl">
                    Track progress. Perfect your form.
                  </p>
                </motion.div>

                <motion.div 
                  className="space-y-4 w-full"
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                >
                  {/* Challenges Button - Featured with glow */}
                  <Link href="/challenges">
                    <motion.button
                      className="w-full py-4 md:py-5 text-lg font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50 flex items-center justify-center transition-all duration-300 ease-in-out transform hover:scale-103 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white shadow-lg shadow-amber-500/25 ring-2 ring-amber-500/50 animate-pulse"
                      whileTap={{ scale: 0.97 }}
                    >
                      <Target className="mr-2 h-5 w-5" />
                      <span className="whitespace-nowrap">Challenges</span>
                    </motion.button>
                  </Link>

                  {/* Start Live Routine */}
                  <motion.button 
                    onClick={handlePermissionRequest}
                    className={`w-full py-3 sm:py-4 md:py-5 text-base sm:text-lg font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50 flex items-center justify-center transition-all duration-300 ease-in-out transform hover:scale-103 ${getButtonClasses(buttonTheme, 'primary')}`}
                    whileTap={{ scale: 0.97 }}
                  >
                    <Play className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="whitespace-nowrap">Start Live Routine</span>
                  </motion.button>
                
                  {/* Practice Library */}
                  <Link href="/practice">
                    <motion.button
                      className={`w-full py-3 sm:py-4 md:py-5 text-base sm:text-lg font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50 flex items-center justify-center transition-all duration-300 ease-in-out transform hover:scale-103 ${getButtonClasses(buttonTheme, 'primary')}`}
                      whileTap={{ scale: 0.97 }}
                    >
                      <Dumbbell className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                      <span className="whitespace-nowrap">Practice Library</span>
                    </motion.button>
                  </Link>

                  {/* Workouts */}
                  <Link href="/workouts">
                    <motion.button
                      className={`w-full py-3 sm:py-4 md:py-5 text-base sm:text-lg font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50 flex items-center justify-center transition-all duration-300 ease-in-out transform hover:scale-103 ${getButtonClasses(buttonTheme, 'primary')}`}
                      whileTap={{ scale: 0.97 }}
                    >
                      <Sword className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                      <span className="whitespace-nowrap">Workouts</span>
                    </motion.button>
                  </Link>

                </motion.div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {/* Camera view with pose detection */}
              {(hasPermission || sourceType !== 'camera') && (
                <CameraView
                  stream={stream}
                  isTracking={isTracking}
                  confidenceThreshold={confidenceThreshold}
                  modelSelection={modelSelection}
                  maxPoses={maxPoses}
                  skeletonColor={skeletonColorChoice}
                  showSkeleton={showSkeleton}
                  showPoints={showPoints}
                  showBackground={showBackground}
                  backgroundOpacity={backgroundOpacity}
                  backgroundBlur={backgroundBlur}
                  sourceType={sourceType}
                  imageElement={uploadedImage}
                  videoElement={uploadedVideo}
                  mediaUrl={uploadedMediaUrl}
                  showReferenceOverlay={showReferenceOverlay}
                  isFullscreenMode={false}
                  onScreenshot={handleScreenshot}
                  toggleTracking={toggleTracking}
                  toggleReferenceOverlay={() => setShowReferenceOverlay(!showReferenceOverlay)}
                  cameraFacing={cameraFacing}
                  setCameraFacing={setCameraFacing}
                  externalIsRecording={isRecording}
                  onRecordClick={handleRecordClick}
                  routineNotes={routineNotes}
                  setRoutineNotes={setRoutineNotes}
                  customBackground={selectedBackground}
                />
              )}

              {/* Mobile-optimized Camera Settings Panel */}
              {sourceType === 'camera' && hasPermission && !isLoading && (
                <div className="absolute bottom-2 sm:bottom-4 left-2 sm:left-4 bg-black/90 border border-red-900/40 rounded-lg p-3 sm:p-4 shadow-lg z-20 max-w-[calc(100vw-1rem)] sm:max-w-none">
                  <h3 className={`text-sm font-semibold mb-2 ${buttonTheme === 'sky' ? 'text-sky-400' : buttonTheme === 'crimson' ? 'text-red-400' : buttonTheme === 'emerald' ? 'text-emerald-400' : 'text-amber-400'}`}>
                    Camera Options
                  </h3>
                  
                  <div className="space-y-3">
                    {/* Mobile-friendly Skeleton Color Selection */}
                    <div>
                      <label className="text-xs text-gray-400 block mb-2">Skeleton Color</label>
                      <div className="flex space-x-3 sm:space-x-2">
                        {['red', 'blue', 'green', 'purple', 'orange'].map((color) => (
                          <button
                            key={color}
                            onClick={() => setSkeletonColorChoice(color as typeof skeletonColorChoice)}
                            className={`w-8 h-8 sm:w-6 sm:h-6 rounded-full border ${skeletonColorChoice === color ? 'border-white border-2' : 'border-gray-600'} transition-all duration-200 hover:scale-110 active:scale-95`}
                            style={{ backgroundColor: 
                              color === 'red' ? '#ef4444' : 
                              color === 'blue' ? '#3b82f6' : 
                              color === 'green' ? '#10b981' : 
                              color === 'purple' ? '#8b5cf6' : 
                              '#f97316' // orange
                            }}
                            aria-label={`Set skeleton color to ${color}`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Camera permission request */}
          {trackingStatus === 'error' && hasPermission === false && (
            <PermissionDialog
              onRequestPermission={handlePermissionRequest}
            />
          )}
        </div>
      </main>
                  </div>
                </div>
                 {/* Collapsed State Icons */}
                {!isSessionPanelExpanded && (
                  <div className="flex flex-col items-center space-y-6 mt-6">
                    <span title="Current Session">
                      <Clock className={`h-7 w-7 ${buttonTheme === 'sky' ? 'text-sky-400' : buttonTheme === 'crimson' ? 'text-red-400' : buttonTheme === 'emerald' ? 'text-emerald-400' : 'text-amber-400'}`} />
                    </span>
                    <span title="Recent Recordings">
                      <ListChecks className={`h-7 w-7 ${buttonTheme === 'sky' ? 'text-sky-400' : buttonTheme === 'crimson' ? 'text-red-400' : buttonTheme === 'emerald' ? 'text-emerald-400' : 'text-amber-400'}`} />
                    </span>
                  </div>
                )}
              </motion.div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {/* Camera view with pose detection */}
              {(hasPermission || sourceType !== 'camera') && (
                <CameraView
                  stream={stream}
                  isTracking={isTracking}
                  confidenceThreshold={confidenceThreshold}
                  modelSelection={modelSelection}
                  maxPoses={maxPoses}
                  skeletonColor={skeletonColorChoice}
                  showSkeleton={showSkeleton}
                  showPoints={showPoints}
                  showBackground={showBackground}
                  backgroundOpacity={backgroundOpacity}
                  backgroundBlur={backgroundBlur}
                  sourceType={sourceType}
                  imageElement={uploadedImage}
                  videoElement={uploadedVideo}
                  mediaUrl={mediaUrl}
                  showReferenceOverlay={showReferenceOverlay}
                  isFullscreenMode={isFullscreenMode}
                  onScreenshot={handleScreenshot}
                  toggleTracking={toggleTracking}
                  toggleReferenceOverlay={toggleReferenceOverlay}
                  cameraFacing={cameraFacing}
                  setCameraFacing={setCameraFacing}
                  externalIsRecording={isRecording}
                  onRecordClick={handleRecordClick}
                  customBackground={selectedBackground}
                />
              )}

              {/* Mobile-optimized Camera Settings Panel */}
              {sourceType === 'camera' && hasPermission && !isLoading && (
                <div className="absolute bottom-2 sm:bottom-4 left-2 sm:left-4 bg-black/90 border border-red-900/40 rounded-lg p-3 sm:p-4 shadow-lg z-20 max-w-[calc(100vw-1rem)] sm:max-w-none">
                  <h3 className={`text-sm font-semibold mb-2 ${buttonTheme === 'sky' ? 'text-sky-400' : buttonTheme === 'crimson' ? 'text-red-400' : buttonTheme === 'emerald' ? 'text-emerald-400' : 'text-amber-400'}`}>
                    Camera Options
                  </h3>
                  
                  <div className="space-y-3">
                    {/* Mobile-friendly Skeleton Color Selection */}
                    <div>
                      <label className="text-xs text-gray-400 block mb-2">Skeleton Color</label>
                      <div className="flex space-x-3 sm:space-x-2">
                        {['red', 'blue', 'green', 'purple', 'orange'].map((color) => (
                          <button
                            key={color}
                            onClick={() => setSkeletonColorChoice(color as typeof skeletonColorChoice)}
                            className={`w-8 h-8 sm:w-6 sm:h-6 rounded-full border ${skeletonColorChoice === color ? 'border-white border-2' : 'border-gray-600'} transition-all duration-200 hover:scale-110 active:scale-95`}
                            style={{ backgroundColor: 
                              color === 'red' ? '#ef4444' : 
                              color === 'blue' ? '#3b82f6' : 
                              color === 'green' ? '#10b981' : 
                              color === 'purple' ? '#8b5cf6' : 
                              '#f97316' // orange
                            }}
                            aria-label={`Set skeleton color to ${color}`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Camera permission request */}
          {trackingStatus === 'error' && hasPermission === false && (
            <PermissionDialog
              onRequestPermission={handlePermissionRequest}
            />
          )}
        </div>
      </main>
      
      {/* Screenshot modal */}
      {isScreenshotModalOpen && screenshotData && (
        <ScreenshotModal
          screenshotData={screenshotData}
          onClose={() => setIsScreenshotModalOpen(false)}
        />
      )}

      {/* "How It Works" Dialog */}
      <Dialog open={showHowItWorksDialog} onOpenChange={(isOpen) => {
        setShowHowItWorksDialog(isOpen);
        if (!isOpen) {
          localStorage.setItem('hasSeenWelcomeGuide', 'true'); // Mark as seen when closed
        }
      }}>
        <DialogContent className="bg-gradient-to-br from-gray-950 to-black border border-red-600/30 text-white max-w-4xl h-[90vh] flex flex-col">
          <DialogHeader className="pb-4 flex-shrink-0">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-3xl font-bold flex items-center text-red-400">
                <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center mr-3">
                  <HelpCircle className="h-5 w-5 text-white" />
                </div>
                How CoachT Works
              </DialogTitle>
              <button
                onClick={() => setShowHowItWorksDialog(false)}
                className="p-2 hover:bg-red-600/20 rounded-full transition-colors"
              >
                <X className="h-6 w-6 text-red-400 hover:text-red-300" />
              </button>
            </div>
            <DialogDescription className="text-gray-300 text-base mt-2">
              Master Taekwondo with AI-powered training. Here's your complete guide.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-track-gray-800 scrollbar-thumb-red-600">
            <div className="space-y-6">
              
              {/* Step 1: Start Live Training */}
              <div className="bg-gradient-to-r from-red-900/20 to-red-800/10 border border-red-600/30 rounded-xl p-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-lg">1</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-red-400 mb-3 flex items-center">
                      <Play className="mr-3 h-6 w-6" />
                      Start Live Training
                    </h3>
                    <p className="text-gray-200 text-lg mb-4">
                      Click "Start Live Routine" to begin AI-powered pose tracking with your camera.
                    </p>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="bg-black/30 rounded-lg p-4">
                        <h4 className="font-semibold text-red-300 mb-2">🎥 Camera Setup</h4>
                        <p className="text-sm text-gray-300">Allow camera access when prompted. Position yourself 3-6 feet from your device.</p>
                      </div>
                      <div className="bg-black/30 rounded-lg p-4">
                        <h4 className="font-semibold text-red-300 mb-2">⚡ Real-Time Analysis</h4>
                        <p className="text-sm text-gray-300">AI tracks your movements and provides instant visual feedback on your form.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 2: Practice Library */}
              <div className="bg-gradient-to-r from-blue-900/20 to-blue-800/10 border border-blue-600/30 rounded-xl p-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-lg">2</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-blue-400 mb-3 flex items-center">
                      <Dumbbell className="mr-3 h-6 w-6" />
                      Practice Library
                    </h3>
                    <p className="text-gray-200 text-lg mb-4">
                      Explore and master individual Taekwondo techniques with guided practice sessions.
                    </p>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="bg-black/30 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-300 mb-2">📚 Browse Techniques</h4>
                        <p className="text-sm text-gray-300">Navigate categories to find specific moves, forms, and drills organized by skill level.</p>
                      </div>
                      <div className="bg-black/30 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-300 mb-2">🎯 Focused Training</h4>
                        <p className="text-sm text-gray-300">Practice individual moves with detailed reference poses and angle analysis.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3: Get Feedback */}
              <div className="bg-gradient-to-r from-purple-900/20 to-purple-800/10 border border-purple-600/30 rounded-xl p-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-lg">3</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-purple-400 mb-3 flex items-center">
                      <MessageSquare className="mr-3 h-6 w-6" />
                      Get Instant Feedback
                    </h3>
                    <p className="text-gray-200 text-lg mb-4">
                      Receive real-time analysis and improve your technique with AI-powered guidance.
                    </p>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="bg-black/30 rounded-lg p-4">
                        <h4 className="font-semibold text-purple-300 mb-2">🎯 Real-Time Scoring</h4>
                        <p className="text-sm text-gray-300">See your form accuracy instantly with joint angle analysis and pose comparison.</p>
                      </div>
                      <div className="bg-black/30 rounded-lg p-4">
                        <h4 className="font-semibold text-purple-300 mb-2">📧 Share Feedback</h4>
                        <p className="text-sm text-gray-300">Help improve CoachT by sharing your experience and suggestions with our team.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pro Tips Section */}
              <div className="bg-gradient-to-r from-amber-900/20 to-amber-800/10 border border-amber-600/30 rounded-xl p-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-amber-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <Info className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-amber-400 mb-3">
                      Pro Tips for Best Results
                    </h3>
                    <div className="grid gap-3">
                      <div className="flex items-center space-x-3 bg-black/30 rounded-lg p-3">
                        <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
                        <p className="text-gray-200">Position yourself 6-8 feet from camera for full-body tracking</p>
                      </div>
                      <div className="flex items-center space-x-3 bg-black/30 rounded-lg p-3">
                        <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
                        <p className="text-gray-200">Train in well-lit area with contrasting background</p>
                      </div>
                      <div className="flex items-center space-x-3 bg-black/30 rounded-lg p-3">
                        <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
                        <p className="text-gray-200">Wear clothing that contrasts with your surroundings</p>
                      </div>
                      <div className="flex items-center space-x-3 bg-black/30 rounded-lg p-3">
                        <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
                        <p className="text-gray-200">Start with slower movements to help AI calibration</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter className="mt-4 pt-4 border-t border-red-600/30 flex-shrink-0">
            <Button 
              onClick={() => {
                setShowHowItWorksDialog(false);
                localStorage.setItem('hasSeenWelcomeGuide', 'true');
              }}
              className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 text-lg font-semibold rounded-lg transition-colors w-full"
            >
              Got it, Let's Train!
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Leaderboard Dialog */}
      <Dialog open={showLeaderboardDialog} onOpenChange={setShowLeaderboardDialog}>
        <DialogContent className={`bg-gray-950 border text-white max-w-3xl ${getButtonClasses(buttonTheme, 'outline').split(' ').find(c => c.startsWith('border-')) || 'border-sky-800'}`}>
          <DialogHeader>
            <DialogTitle className={`text-2xl flex items-center ${buttonTheme === 'sky' ? 'text-sky-400' : buttonTheme === 'crimson' ? 'text-red-400' : buttonTheme === 'emerald' ? 'text-emerald-400' : 'text-amber-400'}`}>
              <BarChart className="mr-2 h-5 w-5" /> 
              Leaderboard
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              See how you rank among other CoachT practitioners
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Leaderboard currentUsername={user?.username} />
          </div>
          
          <DialogFooter>
            <Button 
              onClick={() => setShowLeaderboardDialog(false)}
              className={`text-white ${getButtonClasses(buttonTheme, 'primary')}`}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Training Tips Dialog */}
      <Dialog open={showTips} onOpenChange={setShowTips}>
        <DialogContent className={`bg-gray-950 border text-white ${getButtonClasses(buttonTheme, 'outline').split(' ').find(c => c.startsWith('border-')) || 'border-sky-800'}`}>
          <DialogHeader>
            <DialogTitle className={`text-2xl flex items-center ${buttonTheme === 'sky' ? 'text-sky-400' : buttonTheme === 'crimson' ? 'text-red-400' : buttonTheme === 'emerald' ? 'text-emerald-400' : 'text-amber-400'}`}>
              <Info className="mr-2 h-5 w-5" /> 
              Training Tips
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Expert advice to help improve your technique
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="bg-black/50 p-4 rounded-lg border border-red-900/30">
              <h3 className="font-bold text-lg mb-2">Stance Tips</h3>
              <ul className="list-disc pl-5 space-y-1 text-gray-300">
                <li>Keep your knees bent at the proper angle</li>
                <li>Distribute weight evenly between feet</li>
                <li>Maintain straight back and proper posture</li>
              </ul>
            </div>
            
            <div className="bg-black/50 p-4 rounded-lg border border-red-900/30">
              <h3 className="font-bold text-lg mb-2">Kick Techniques</h3>
              <ul className="list-disc pl-5 space-y-1 text-gray-300">
                <li>Chamber your knee properly before extending</li>
                <li>Keep your supporting foot firmly planted</li>
                <li>Focus on hip rotation for power</li>
              </ul>
            </div>
            
            <div className="bg-black/50 p-4 rounded-lg border border-red-900/30">
              <h3 className="font-bold text-lg mb-2">Training Consistency</h3>
              <ul className="list-disc pl-5 space-y-1 text-gray-300">
                <li>Train at least 3-4 times per week</li>
                <li>Balance technical practice with conditioning</li>
                <li>Record and review your movements regularly</li>
              </ul>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              onClick={() => setShowTips(false)}
              className={`text-white ${getButtonClasses(buttonTheme, 'primary')}`}
            >
              Got it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Customize Screen Dialog - Repurposed for Color Themes */}
      <Dialog open={showCustomizeDialog} onOpenChange={setShowCustomizeDialog}>
        <DialogContent className={`bg-gray-950 border text-white max-w-lg ${getButtonClasses(buttonTheme, 'outline').split(' ').find(c => c.startsWith('border-')) || 'border-sky-800'}`}>
          <DialogHeader>
            <DialogTitle className={`text-2xl flex items-center ${buttonTheme === 'sky' ? 'text-sky-400' : buttonTheme === 'crimson' ? 'text-red-400' : buttonTheme === 'emerald' ? 'text-emerald-400' : 'text-amber-400'}`}>
              <Palette className="mr-3 h-6 w-6" />
              Customize UI Theme
            </DialogTitle>
            <DialogDescription className="text-gray-400 mt-1">
              Change the primary color theme for buttons and accents.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-6">
            <div className="space-y-3">
              <h3 className="font-semibold text-lg text-gray-200">Select a Color Theme:</h3>
              {(['sky', 'crimson', 'emerald', 'amber'] as const).map((themeOption) => (
                <Button
                  key={themeOption}
                  onClick={() => {
                    setButtonTheme(themeOption);
                    localStorage.setItem('buttonTheme', themeOption);
                  }}
                  className={`w-full justify-start py-3 px-4 text-base rounded-md transition-all duration-200 ease-in-out ${getButtonClasses(themeOption, 'primary')} ${buttonTheme === themeOption ? 'ring-2 ring-offset-2 ring-offset-gray-950 ' + (themeOption === 'sky' ? 'ring-sky-400' : themeOption === 'crimson' ? 'ring-red-400' : themeOption === 'emerald' ? 'ring-emerald-400' : 'ring-amber-400') : ''}`}
                >
                  <span className={`w-4 h-4 rounded-full mr-3 ${
                    themeOption === 'sky' ? 'bg-sky-500' : 
                    themeOption === 'crimson' ? 'bg-red-500' : 
                    themeOption === 'emerald' ? 'bg-emerald-500' : 
                    'bg-amber-500'
                  }`}></span>
                  {themeOption.charAt(0).toUpperCase() + themeOption.slice(1)}
                </Button>
              ))}
            </div>
          </div>
          <DialogFooter className="mt-2">
            <Button onClick={() => setShowCustomizeDialog(false)} className={`text-white px-6 py-2 text-base ${getButtonClasses(buttonTheme, 'primary')}`}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mobile Device Warning Dialog */}
      {user && showMobileWarningDialog && (
        <Dialog open={showMobileWarningDialog} onOpenChange={setShowMobileWarningDialog}>
          <DialogContent className={`bg-gray-950 border text-white max-w-md ${getButtonClasses(buttonTheme, 'outline').split(' ').find(c => c.startsWith('border-')) || 'border-sky-800'}`}>
            <DialogHeader>
              <DialogTitle className={`text-2xl flex items-center ${buttonTheme === 'sky' ? 'text-sky-400' : buttonTheme === 'crimson' ? 'text-red-400' : buttonTheme === 'emerald' ? 'text-emerald-400' : 'text-amber-400'}`}>
                <Smartphone className="mr-3 h-6 w-6" />
                Mobile Device Detected
              </DialogTitle>
              <DialogDescription className="text-gray-400 mt-2">
                For the best experience with CoachT, including optimal pose tracking and interface usability, we recommend using a tablet or laptop/desktop computer.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 text-gray-300">
              <p>
                While CoachT may function on mobile devices, its features are optimized for larger screens. You might experience layout issues or reduced performance on a smaller screen.
              </p>
            </div>
            <DialogFooter className="mt-2">
              <Button
                onClick={() => setShowMobileWarningDialog(false)}
                className={`text-white px-6 py-2 text-base ${getButtonClasses(buttonTheme, 'primary')}`}
              >
                Understood, Continue
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Gallery frames for welcome screen (only shown if not tracking and backgroundImages exist) */}
      {(!hasPermission || trackingStatus === 'inactive') && !isTracking && backgroundImages.length > 0 && (
        <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: -1 }}>
          <div className="flex h-full items-center justify-between">
            {/* Left side frames */}
            <div className="hidden md:flex flex-col ml-8 space-y-8" style={{ position: 'absolute', left: '2rem', top: '50%', transform: 'translateY(-50%)' }}>
              {backgroundImages.slice(0, Math.min(3, Math.ceil(backgroundImages.length / 2))).map((image, index) => (
                <motion.div
                  key={`left-${index}`}
                  className="picture-frame pointer-events-auto"
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + (index * 0.1) }}
                  whileHover={{ scale: 1.05, rotate: index % 2 === 0 ? -8 : -4 }}
                  style={{ 
                    transform: `rotate(${index % 2 === 0 ? -10 : -5}deg)`,
                    width: '180px',
                    height: '200px',
                    transformOrigin: 'center center'
                  }}
                >
                  <div className="relative w-full h-full">
                    {/* Outer frame with shadow */}
                    <div className="absolute inset-0 border-[12px] rounded-lg shadow-[0_8px_30px_rgb(0,0,0,0.6)]" 
                      style={{
                        borderImage: 'linear-gradient(45deg, #0c2a4d 0%, #1f6bac 50%, #0c2a4d 100%) 1',
                        boxShadow: 'inset 0 0 20px rgba(0,0,0,0.8), 0 10px 25px rgba(0,0,0,0.7)'
                      }}>
                    </div>
                    
                    {/* Inner frame with glass effect */}
                    <div className="absolute inset-[12px] border-2 border-sky-900/40 backdrop-blur-sm bg-white/5 rounded"></div>
                    
                    {/* Decorative corner elements */}
                    <div className="absolute top-[-5px] left-[-5px] w-8 h-8 bg-gradient-to-br from-sky-900 to-sky-700 rounded-full flex items-center justify-center transform -rotate-45">
                      <span className="text-white text-xs">◆</span>
                    </div>
                    <div className="absolute top-[-5px] right-[-5px] w-8 h-8 bg-gradient-to-bl from-sky-900 to-sky-700 rounded-full flex items-center justify-center transform rotate-45">
                      <span className="text-white text-xs">◆</span>
                    </div>
                    <div className="absolute bottom-[-5px] left-[-5px] w-8 h-8 bg-gradient-to-tr from-sky-900 to-sky-700 rounded-full flex items-center justify-center transform rotate-45">
                      <span className="text-white text-xs">◆</span>
                    </div>
                    <div className="absolute bottom-[-5px] right-[-5px] w-8 h-8 bg-gradient-to-tl from-sky-900 to-sky-700 rounded-full flex items-center justify-center transform -rotate-45">
                      <span className="text-white text-xs">◆</span>
                    </div>
                    
                    {/* Image with overlay */}
                    <img 
                      src={image} 
                      alt="Gallery" 
                      className="absolute inset-[16px] object-cover w-[calc(100%-32px)] h-[calc(100%-32px)]"
                    />
                    
                    {/* Enhanced glass-like reflection overlay */}
                    <div className="absolute inset-[16px] bg-gradient-to-br from-white/20 to-transparent pointer-events-none"></div>
                    <div className="absolute inset-[16px] overflow-hidden rounded">
                      <div className="absolute top-0 left-[-100%] w-[300%] h-[50%] bg-gradient-to-br from-white/30 to-transparent transform rotate-45 opacity-60"></div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            
            {/* Right side frames */}
            <div className="hidden md:flex flex-col mr-8 space-y-8" style={{ position: 'absolute', right: '2rem', top: '50%', transform: 'translateY(-50%)' }}>
              {backgroundImages.slice(Math.ceil(backgroundImages.length / 2), Math.min(6, backgroundImages.length)).map((image, index) => (
                <motion.div
                  key={`right-${index}`}
                  className="picture-frame pointer-events-auto"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + (index * 0.1) }}
                  whileHover={{ scale: 1.05, rotate: index % 2 === 0 ? 8 : 4 }}
                  style={{ 
                    transform: `rotate(${index % 2 === 0 ? 10 : 5}deg)`,
                    width: '180px',
                    height: '200px',
                    transformOrigin: 'center center'
                  }}
                >
                  <div className="relative w-full h-full">
                    {/* Outer frame with shadow */}
                    <div className="absolute inset-0 border-[12px] rounded-lg shadow-[0_8px_30px_rgb(0,0,0,0.6)]" 
                      style={{
                        borderImage: 'linear-gradient(45deg, #0c2a4d 0%, #1f6bac 50%, #0c2a4d 100%) 1',
                        boxShadow: 'inset 0 0 20px rgba(0,0,0,0.8), 0 10px 25px rgba(0,0,0,0.7)'
                      }}>
                    </div>
                    
                    {/* Inner frame with glass effect */}
                    <div className="absolute inset-[12px] border-2 border-sky-900/40 backdrop-blur-sm bg-white/5 rounded"></div>
                    
                    {/* Decorative corner elements */}
                    <div className="absolute top-[-5px] left-[-5px] w-8 h-8 bg-gradient-to-br from-sky-900 to-sky-700 rounded-full flex items-center justify-center transform -rotate-45">
                      <span className="text-white text-xs">◆</span>
                    </div>
                    <div className="absolute top-[-5px] right-[-5px] w-8 h-8 bg-gradient-to-bl from-sky-900 to-sky-700 rounded-full flex items-center justify-center transform rotate-45">
                      <span className="text-white text-xs">◆</span>
                    </div>
                    <div className="absolute bottom-[-5px] left-[-5px] w-8 h-8 bg-gradient-to-tr from-sky-900 to-sky-700 rounded-full flex items-center justify-center transform rotate-45">
                      <span className="text-white text-xs">◆</span>
                    </div>
                    <div className="absolute bottom-[-5px] right-[-5px] w-8 h-8 bg-gradient-to-tl from-sky-900 to-sky-700 rounded-full flex items-center justify-center transform -rotate-45">
                      <span className="text-white text-xs">◆</span>
                    </div>
                    
                    {/* Image with overlay */}
                    <img 
                      src={image} 
                      alt="Gallery" 
                      className="absolute inset-[16px] object-cover w-[calc(100%-32px)] h-[calc(100%-32px)]"
                    />
                    
                    {/* Enhanced glass-like reflection overlay */}
                    <div className="absolute inset-[16px] bg-gradient-to-br from-white/20 to-transparent pointer-events-none"></div>
                    <div className="absolute inset-[16px] overflow-hidden rounded">
                      <div className="absolute top-0 left-[-100%] w-[300%] h-[50%] bg-gradient-to-br from-white/30 to-transparent transform rotate-45 opacity-60"></div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
          
          {/* Colorful animated elements at the bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-40 overflow-hidden">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#ff3366" stopOpacity="0.8">
                    <animate attributeName="offset" values="0;0.3;0" dur="10s" repeatCount="indefinite" />
                  </stop>
                  <stop offset="30%" stopColor="#4f6df5" stopOpacity="0.8">
                    <animate attributeName="offset" values="0.3;0.6;0.3" dur="10s" repeatCount="indefinite" />
                  </stop>
                  <stop offset="60%" stopColor="#11d3f3" stopOpacity="0.8">
                    <animate attributeName="offset" values="0.6;0.9;0.6" dur="10s" repeatCount="indefinite" />
                  </stop>
                  <stop offset="90%" stopColor="#ff9933" stopOpacity="0.8">
                    <animate attributeName="offset" values="0.9;1.0;0.9" dur="10s" repeatCount="indefinite" />
                  </stop>
                </linearGradient>
                <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#11d3f3" stopOpacity="0.8">
                    <animate attributeName="offset" values="0;0.3;0" dur="8s" repeatCount="indefinite" />
                  </stop>
                  <stop offset="30%" stopColor="#ff9933" stopOpacity="0.8">
                    <animate attributeName="offset" values="0.3;0.6;0.3" dur="8s" repeatCount="indefinite" />
                  </stop>
                  <stop offset="60%" stopColor="#ff3366" stopOpacity="0.8">
                    <animate attributeName="offset" values="0.6;0.9;0.6" dur="8s" repeatCount="indefinite" />
                  </stop>
                  <stop offset="90%" stopColor="#4f6df5" stopOpacity="0.8">
                    <animate attributeName="offset" values="0.9;1.0;0.9" dur="8s" repeatCount="indefinite" />
                  </stop>
                </linearGradient>
              </defs>
              
              <path d="M0,40 Q250,5 500,40 T1000,40 T1500,40 T2000,40 T2500,40 V100 H0 V40" fill="url(#grad1)">
                <animate attributeName="d" 
                  values="M0,40 Q250,5 500,40 T1000,40 T1500,40 T2000,40 T2500,40 V100 H0 V40;
                          M0,40 Q250,20 500,35 T1000,35 T1500,45 T2000,30 T2500,40 V100 H0 V40;
                          M0,40 Q250,40 500,20 T1000,30 T1500,25 T2000,40 T2500,40 V100 H0 V40;
                          M0,40 Q250,5 500,40 T1000,40 T1500,40 T2000,40 T2500,40 V100 H0 V40"
                  dur="20s" 
                  repeatCount="indefinite" />
              </path>
              
              <path d="M0,65 Q250,45 500,65 T1000,65 T1500,65 T2000,65 T2500,65 V100 H0 V65" fill="url(#grad2)">
                <animate attributeName="d" 
                  values="M0,65 Q250,45 500,65 T1000,65 T1500,65 T2000,65 T2500,65 V100 H0 V65;
                          M0,65 Q250,75 500,60 T1000,60 T1500,70 T2000,55 T2500,65 V100 H0 V65;
                          M0,65 Q250,65 500,45 T1000,55 T1500,50 T2000,65 T2500,65 V100 H0 V65;
                          M0,65 Q250,45 500,65 T1000,65 T1500,65 T2000,65 T2500,65 V100 H0 V65"
                  dur="15s" 
                  repeatCount="indefinite" />
              </path>
              
              <path d="M0,80 Q250,105 500,80 T1000,80 T1500,80 T2000,80 T2500,80 V100 H0 V80" fill="url(#grad1)" opacity="0.6">
                <animate attributeName="d" 
                  values="M0,80 Q250,105 500,80 T1000,80 T1500,80 T2000,80 T2500,80 V100 H0 V80;
                          M0,80 Q250,70 500,80 T1000,90 T1500,75 T2000,85 T2500,80 V100 H0 V80;
                          M0,80 Q250,85 500,70 T1000,75 T1500,90 T2000,80 T2500,80 V100 H0 V80;
                          M0,80 Q250,105 500,80 T1000,80 T1500,80 T2000,80 T2500,80 V100 H0 V80"
                  dur="25s" 
                  repeatCount="indefinite" />
              </path>
              
              <circle cx="10%" cy="85%" r="5" fill="#ff3366">
                <animate attributeName="cx" values="10%;90%;10%" dur="20s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.8;0.4;0.8" dur="5s" repeatCount="indefinite" />
              </circle>
              
              <circle cx="20%" cy="75%" r="3" fill="#4f6df5">
                <animate attributeName="cx" values="20%;70%;20%" dur="15s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.7;0.3;0.7" dur="7s" repeatCount="indefinite" />
              </circle>
              
              <circle cx="80%" cy="80%" r="6" fill="#11d3f3">
                <animate attributeName="cx" values="80%;30%;80%" dur="25s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.6;0.2;0.6" dur="8s" repeatCount="indefinite" />
              </circle>
              
              <circle cx="65%" cy="90%" r="4" fill="#ff9933">
                <animate attributeName="cx" values="65%;25%;65%" dur="18s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.5;0.3;0.5" dur="6s" repeatCount="indefinite" />
              </circle>
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}