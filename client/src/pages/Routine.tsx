import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import CameraView from '@/components/CameraView';
import PermissionDialog from '@/components/PermissionDialog';
import LoadingState from '@/components/LoadingState';
import ScreenshotModal from '@/components/ScreenshotModal';
import { initPoseDetection } from '@/lib/poseDetection';
import { requestCameraPermission, getCameraStream } from '@/lib/cameraUtils';
import { useAuth } from '@/hooks/use-auth';
import { useTheme } from '@/components/theme-provider';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Settings, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

export type TrackingStatus = 'inactive' | 'loading' | 'ready' | 'active' | 'error';
export type CameraFacing = 'user' | 'environment';
export type SourceType = 'camera' | 'image' | 'video';

export default function Routine() {
  // Navigation
  const [, navigate] = useLocation();
  
  // Auth and theme contexts
  const { user } = useAuth();
  const { theme } = useTheme();
  
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
  
  // Camera view options
  const [skeletonColorChoice, setSkeletonColorChoice] = useState<'red' | 'blue' | 'green' | 'purple' | 'orange'>('red');
  
  // Added for Record button
  const [isRecording, setIsRecording] = useState<boolean>(false);
  
  // Customize background state
  const [selectedBackground, setSelectedBackground] = useState<string | null>(null);

  // Screenshot modal
  const [screenshotData, setScreenshotData] = useState<string | null>(null);
  const [isScreenshotModalOpen, setIsScreenshotModalOpen] = useState<boolean>(false);

  // Load settings from localStorage when component mounts
  useEffect(() => {
    // Load selected background
    const savedSelectedBackground = localStorage.getItem('selectedBackground');
    if (savedSelectedBackground) {
      setSelectedBackground(savedSelectedBackground);
    }

    // Auto-request camera permission on mount
    handlePermissionRequest();
  }, []);

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
  const handleVideoUpload = (video: HTMLVideoElement, url: string, videoData?: any) => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    
    setSourceType('video');
    setUploadedVideo(video);
    setMediaUrl(url + '#video'); // Add flag to identify as video
    setTrackingStatus('ready');
    
    // If this is a pre-loaded video, you could store additional metadata
    if (videoData) {
      console.log('Selected pre-loaded video:', videoData);
      // You could store this in state or localStorage for reference
    }
  };

  // Take screenshot
  const handleScreenshot = (dataUrl: string) => {
    if (dataUrl.startsWith('blob:')) {
      // This is a reference media upload (not a screenshot)
      setMediaUrl(dataUrl);
    } else if (dataUrl.includes('#youtube')) {
      // This is a YouTube video
      setSourceType('video');
      setMediaUrl(dataUrl);
      setTrackingStatus('ready');
    } else if (dataUrl.includes('#video')) {
      // This is a local video file selection
      setSourceType('video');
      setMediaUrl(dataUrl);
      setTrackingStatus('ready');
    } else {
      // This is a regular screenshot
      setScreenshotData(dataUrl);
      setIsScreenshotModalOpen(true);
    }
  };

  // Handle record button click
  const handleRecordClick = () => {
    setIsRecording(!isRecording);
  };

  // Clean up camera stream on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-black text-white">
      {/* Header */}
      <div className="w-full bg-gradient-to-r from-[#6b1b1b] to-black h-16 px-4 shadow-md flex items-center justify-between">
        <Link href="/">
          <Button variant="ghost" className="text-white hover:text-red-400 hover:bg-white/10">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Home
          </Button>
        </Link>
        
        <h1 className="text-xl font-bold text-red-400">Live Routine</h1>
        
        <div className="flex items-center space-x-2">
          <Button
            onClick={handlePermissionRequest}
            variant="outline"
            size="sm"
            className="border-red-600 text-red-400 hover:bg-red-700/20"
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Reload
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center min-h-[400px]">
            <LoadingState progress={loadingProgress} />
          </div>
        )}

        {/* Permission Dialog */}
        {hasPermission === false && !isLoading && (
          <div className="flex justify-center items-center min-h-[400px]">
            <PermissionDialog 
              onRequestPermission={handlePermissionRequest}
            />
          </div>
        )}

        {/* Camera View */}
        {(hasPermission || sourceType !== 'camera') && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
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

            {/* Mobile-optimized Camera Settings Panel */}
            {sourceType === 'camera' && hasPermission && !isLoading && (
              <div className="mt-4 bg-black/90 border border-red-900/40 rounded-lg p-4 shadow-lg">
                <h3 className="text-red-400 text-sm font-semibold mb-3">Camera Options</h3>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-xs text-gray-300">Skeleton Color</label>
                    <select
                      value={skeletonColorChoice}
                      onChange={(e) => setSkeletonColorChoice(e.target.value as any)}
                      className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-white"
                    >
                      <option value="red">Red</option>
                      <option value="blue">Blue</option>
                      <option value="green">Green</option>
                      <option value="purple">Purple</option>
                      <option value="orange">Orange</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs text-gray-300">Camera</label>
                    <button
                      onClick={() => setCameraFacing(cameraFacing === 'user' ? 'environment' : 'user')}
                      className="w-full bg-red-700 hover:bg-red-600 text-white px-2 py-1 rounded text-sm"
                    >
                      {cameraFacing === 'user' ? 'Front' : 'Back'}
                    </button>
                  </div>
                </div>
                
                <div className="mt-3 flex items-center space-x-4">
                  <label className="flex items-center text-sm text-gray-300">
                    <input
                      type="checkbox"
                      checked={showSkeleton}
                      onChange={(e) => setShowSkeleton(e.target.checked)}
                      className="mr-2"
                    />
                    Show Skeleton
                  </label>
                  
                  <label className="flex items-center text-sm text-gray-300">
                    <input
                      type="checkbox"
                      checked={showPoints}
                      onChange={(e) => setShowPoints(e.target.checked)}
                      className="mr-2"
                    />
                    Show Points
                  </label>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Error State */}
        {trackingStatus === 'error' && !isLoading && (
          <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
            <div className="bg-red-900/30 border border-red-600 rounded-lg p-6 max-w-md">
              <h3 className="text-red-400 text-lg font-semibold mb-2">Camera Error</h3>
              <p className="text-gray-300 mb-4">
                Failed to access camera or load AI models. Please check your permissions and try again.
              </p>
              <Button
                onClick={handlePermissionRequest}
                className="bg-red-700 hover:bg-red-600 text-white"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Screenshot Modal */}
      <ScreenshotModal
        isOpen={isScreenshotModalOpen}
        onClose={() => setIsScreenshotModalOpen(false)}
        screenshotData={screenshotData}
      />
    </div>
  );
} 