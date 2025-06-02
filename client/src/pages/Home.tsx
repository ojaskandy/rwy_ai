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
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { apiRequest, getQueryFn } from '@/lib/queryClient';
import { format } from 'date-fns';

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

export default function Home() {
  const { user, logoutMutation } = useAuth();
  const { theme, setTheme } = useTheme();
  
  // State management
  const [trackingStatus, setTrackingStatus] = useState<TrackingStatus>('inactive');
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  
  // Dialog states
  const [showHowItWorksDialog, setShowHowItWorksDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const [isScreenshotModalOpen, setIsScreenshotModalOpen] = useState(false);
  const [screenshotData, setScreenshotData] = useState<string | null>(null);
  
  // Camera settings
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.5);
  const [modelSelection, setModelSelection] = useState<'lite' | 'full' | 'heavy'>('lite');
  const [maxPoses, setMaxPoses] = useState(1);
  const [skeletonColorChoice, setSkeletonColorChoice] = useState<'red' | 'blue' | 'green' | 'purple' | 'orange'>('red');
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [showPoints, setShowPoints] = useState(true);
  const [showBackground, setShowBackground] = useState(true);
  const [backgroundOpacity, setBackgroundOpacity] = useState(0.5);
  const [backgroundBlur, setBackgroundBlur] = useState(0);
  const [sourceType, setSourceType] = useState<SourceType>('camera');
  const [cameraFacing, setCameraFacing] = useState<CameraFacing>('user');
  const [showReferenceOverlay, setShowReferenceOverlay] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [routineNotes, setRoutineNotes] = useState('');
  
  const [uploadedImage, setUploadedImage] = useState<HTMLImageElement | null>(null);
  const [uploadedVideo, setUploadedVideo] = useState<HTMLVideoElement | null>(null);
  const [uploadedMediaUrl, setUploadedMediaUrl] = useState<string | null>(null);

  // Initialize pose detection
  useEffect(() => {
    const initializeModels = async () => {
      try {
        setIsLoading(true);
        setLoadingProgress(0);
        
        const progressCallback = (progress: number) => {
          setLoadingProgress(progress);
        };
        
        await initPoseDetection(progressCallback);
        setTrackingStatus('ready');
      } catch (error) {
        console.error('Failed to initialize pose detection:', error);
        setTrackingStatus('error');
      } finally {
        setIsLoading(false);
      }
    };

    initializeModels();
  }, []);

  // Camera permission and stream setup
  useEffect(() => {
    const setupCamera = async () => {
      if (sourceType === 'camera') {
        try {
          const permission = await requestCameraPermission();
          setHasPermission(permission);
          
          if (permission) {
            const mediaStream = await getCameraStream(cameraFacing);
            setStream(mediaStream);
          }
        } catch (error) {
          console.error('Camera setup failed:', error);
          setHasPermission(false);
          setTrackingStatus('error');
        }
      }
    };

    setupCamera();
  }, [sourceType, cameraFacing]);

  const handlePermissionRequest = async () => {
    try {
      const permission = await requestCameraPermission();
      setHasPermission(permission);
      
      if (permission) {
        const mediaStream = await getCameraStream(cameraFacing);
        setStream(mediaStream);
        setTrackingStatus('ready');
      }
    } catch (error) {
      console.error('Permission request failed:', error);
      setTrackingStatus('error');
    }
  };

  const toggleTracking = () => {
    setIsTracking(!isTracking);
  };

  const handleScreenshot = (imageData: string) => {
    setScreenshotData(imageData);
    setIsScreenshotModalOpen(true);
  };

  const handleRecordClick = () => {
    setIsRecording(!isRecording);
  };

  const getButtonClasses = (variant: 'primary' | 'secondary' | 'outline' = 'primary', glowing = false) => {
    const baseClasses = "transition-all duration-200 font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black";
    
    if (variant === 'primary') {
      return `${baseClasses} bg-red-600 hover:bg-red-700 text-white focus:ring-red-500 ${glowing ? 'shadow-lg shadow-red-500/50 animate-pulse' : ''}`;
    } else if (variant === 'secondary') {
      return `${baseClasses} bg-gray-800 hover:bg-gray-700 text-white border border-gray-600 focus:ring-gray-500`;
    } else {
      return `${baseClasses} border border-red-600 text-red-400 hover:bg-red-600 hover:text-white focus:ring-red-500`;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-black overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-red-900/40 bg-black/95 backdrop-blur-sm relative z-50">
        <div className="flex items-center space-x-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-3"
          >
            <Sword className="h-8 w-8 text-red-500" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
              CoachT
            </h1>
          </motion.div>
        </div>

        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="text-gray-300 hover:text-white hover:bg-red-700/30"
          >
            {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </Button>

          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-gray-300 hover:text-white hover:bg-red-700/30 flex items-center space-x-2"
                >
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline-block">{user.username}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="end" 
                className="w-56 bg-black border-red-900/40 text-white"
              >
                <DropdownMenuItem 
                  onClick={() => setShowSettingsDialog(true)}
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
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        <div className="flex-1 p-8 md:p-10">
          {isLoading && <LoadingState progress={loadingProgress} message="Loading pose detection models..." />}
          
          {(!hasPermission || trackingStatus === 'inactive') && !isTracking ? (
            // New layout for the home screen without sidebar
            <div className="flex-1 flex flex-col items-center max-w-screen-xl mx-auto w-full h-full">
              {/* Centered Welcome Text and Actions */}
              <div className="space-y-6 sm:space-y-8 flex flex-col items-center mt-8 sm:mt-16 md:mt-24 px-4 sm:px-0 w-full max-w-2xl">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-center w-full">
                  <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-4 leading-tight">
                    Master Your <span className="text-red-500">Taekwondo</span>
                  </h2>
                  <p className="text-lg sm:text-xl text-gray-300 mb-8 leading-relaxed max-w-2xl mx-auto">
                    AI-powered movement analysis for precision training and technique perfection
                  </p>
                </motion.div>

                {/* Main Action Buttons - Rearranged as requested */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="w-full space-y-4">
                  {/* Challenges - with glow effect */}
                  <Button 
                    className={`w-full py-4 px-6 text-lg ${getButtonClasses('primary', true)}`}
                    onClick={() => setShowHowItWorksDialog(true)}
                  >
                    <Target className="mr-3 h-6 w-6" />
                    Challenges
                  </Button>

                  {/* Start Live Routine */}
                  <Button 
                    className={`w-full py-4 px-6 text-lg ${getButtonClasses('primary')}`}
                    onClick={hasPermission ? toggleTracking : handlePermissionRequest}
                  >
                    <Play className="mr-3 h-6 w-6" />
                    Start Live Routine
                  </Button>

                  {/* Practice Library */}
                  <Button 
                    className={`w-full py-4 px-6 text-lg ${getButtonClasses('secondary')}`}
                    onClick={() => setShowTips(true)}
                  >
                    <ScrollText className="mr-3 h-6 w-6" />
                    Practice Library
                  </Button>

                  {/* Workouts */}
                  <Button 
                    className={`w-full py-4 px-6 text-lg ${getButtonClasses('secondary')}`}
                  >
                    <Dumbbell className="mr-3 h-6 w-6" />
                    Workouts
                  </Button>
                </motion.div>

                {/* Quick Actions Row */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="flex flex-wrap gap-3 justify-center w-full">
                  <Button 
                    className={`${getButtonClasses('outline')} px-4 py-2`}
                    onClick={() => setShowHowItWorksDialog(true)}
                  >
                    <HelpCircle className="mr-2 h-4 w-4" />
                    How it Works
                  </Button>
                  
                  <Link href="/auth">
                    <Button className={`${getButtonClasses('outline')} px-4 py-2`}>
                      <User className="mr-2 h-4 w-4" />
                      {user ? 'Profile' : 'Sign In'}
                    </Button>
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
                  customBackground={null}
                />
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

      {/* Modals */}
      {isScreenshotModalOpen && screenshotData && (
        <ScreenshotModal
          imageData={screenshotData}
          onClose={() => setIsScreenshotModalOpen(false)}
        />
      )}

      {/* How it Works Dialog - Fixed with better visibility */}
      <Dialog open={showHowItWorksDialog} onOpenChange={setShowHowItWorksDialog}>
        <DialogContent className="bg-black border-red-900/40 text-white max-w-4xl max-h-[85vh] overflow-y-auto">
          {/* More visible X button at top right */}
          <Button
            onClick={() => setShowHowItWorksDialog(false)}
            className="absolute top-4 right-4 z-50 bg-red-600 hover:bg-red-700 text-white w-8 h-8 p-0 rounded-full"
            size="sm"
          >
            <X className="h-4 w-4" />
          </Button>
          
          <DialogHeader>
            <DialogTitle className="text-red-400 text-2xl pr-12">How CoachT Works</DialogTitle>
            <DialogDescription className="text-gray-300">
              Master Taekwondo techniques with AI-powered movement analysis
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid md:grid-cols-3 gap-6 mt-6">
            <div className="text-center p-4 bg-gray-900/50 rounded-lg border border-red-900/20">
              <div className="w-16 h-16 mx-auto mb-4 bg-red-600/20 rounded-full flex items-center justify-center">
                <Play className="h-8 w-8 text-red-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-red-400">1. Start Training</h3>
              <p className="text-gray-300 text-sm">
                Position yourself in front of the camera and begin your Taekwondo routine. Our AI will track your movements in real-time.
              </p>
            </div>
            
            <div className="text-center p-4 bg-gray-900/50 rounded-lg border border-red-900/20">
              <div className="w-16 h-16 mx-auto mb-4 bg-red-600/20 rounded-full flex items-center justify-center">
                <Target className="h-8 w-8 text-red-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-red-400">2. Get Analysis</h3>
              <p className="text-gray-300 text-sm">
                Receive instant feedback on your form, technique accuracy, and areas for improvement with detailed biomechanical analysis.
              </p>
            </div>
            
            <div className="text-center p-4 bg-gray-900/50 rounded-lg border border-red-900/20">
              <div className="w-16 h-16 mx-auto mb-4 bg-red-600/20 rounded-full flex items-center justify-center">
                <Award className="h-8 w-8 text-red-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-red-400">3. Track Progress</h3>
              <p className="text-gray-300 text-sm">
                Monitor your improvement over time with detailed performance metrics and personalized training recommendations.
              </p>
            </div>
          </div>

          {/* Fixed footer with better spacing */}
          <DialogFooter className="mt-8 pb-4">
            <Button 
              onClick={() => setShowHowItWorksDialog(false)}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2"
            >
              Start Training
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog - New functionality */}
      <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
        <DialogContent className="bg-black border-red-900/40 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-red-400 text-2xl">Settings</DialogTitle>
            <DialogDescription className="text-gray-300">
              Customize your training experience
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-6">
            <div>
              <h3 className="text-lg font-semibold mb-3 text-red-400">Camera Settings</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-300">Show Skeleton</label>
                  <Button
                    variant={showSkeleton ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowSkeleton(!showSkeleton)}
                    className={showSkeleton ? "bg-red-600 hover:bg-red-700" : "border-red-600 text-red-400 hover:bg-red-600 hover:text-white"}
                  >
                    {showSkeleton ? "On" : "Off"}
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-300">Show Points</label>
                  <Button
                    variant={showPoints ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowPoints(!showPoints)}
                    className={showPoints ? "bg-red-600 hover:bg-red-700" : "border-red-600 text-red-400 hover:bg-red-600 hover:text-white"}
                  >
                    {showPoints ? "On" : "Off"}
                  </Button>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-3 text-red-400">Skeleton Color</h3>
              <div className="flex space-x-2">
                {(['red', 'blue', 'green', 'purple', 'orange'] as const).map((color) => (
                  <button
                    key={color}
                    onClick={() => setSkeletonColorChoice(color)}
                    className={`w-8 h-8 rounded-full border-2 ${skeletonColorChoice === color ? 'border-white' : 'border-gray-600'} transition-all duration-200 hover:scale-110`}
                    style={{ backgroundColor: 
                      color === 'red' ? '#ef4444' : 
                      color === 'blue' ? '#3b82f6' : 
                      color === 'green' ? '#10b981' : 
                      color === 'purple' ? '#8b5cf6' : 
                      '#f97316'
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button 
              onClick={() => setShowSettingsDialog(false)}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2"
            >
              Save Settings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Training Tips Dialog */}
      <Dialog open={showTips} onOpenChange={setShowTips}>
        <DialogContent className="bg-black border-red-900/40 text-white max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-red-400 text-2xl">Taekwondo Training Tips</DialogTitle>
            <DialogDescription className="text-gray-300">
              Expert advice to improve your technique
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-6">
            <div className="bg-gray-900/50 p-4 rounded-lg border border-red-900/20">
              <h3 className="text-lg font-semibold mb-2 text-red-400">Camera Positioning</h3>
              <p className="text-gray-300 text-sm">
                • Position the camera at chest height, about 6-8 feet away<br/>
                • Ensure good lighting - natural light or bright room lighting works best<br/>
                • Make sure your entire body is visible in the frame<br/>
                • Avoid backgrounds with busy patterns or similar colors to your clothing
              </p>
            </div>
            
            <div className="bg-gray-900/50 p-4 rounded-lg border border-red-900/20">
              <h3 className="text-lg font-semibold mb-2 text-red-400">Training Best Practices</h3>
              <p className="text-gray-300 text-sm">
                • Warm up properly before each session<br/>
                • Focus on form over speed initially<br/>
                • Practice basic techniques before advanced combinations<br/>
                • Record short sessions to analyze specific movements
              </p>
            </div>
            
            <div className="bg-gray-900/50 p-4 rounded-lg border border-red-900/20">
              <h3 className="text-lg font-semibold mb-2 text-red-400">Understanding AI Feedback</h3>
              <p className="text-gray-300 text-sm">
                • Green indicators show good form and timing<br/>
                • Yellow suggests areas for improvement<br/>
                • Red highlights significant technique issues<br/>
                • Review recordings to understand feedback patterns
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button 
              onClick={() => setShowTips(false)}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2"
            >
              Got it!
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}