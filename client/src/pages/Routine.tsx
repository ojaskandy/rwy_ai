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
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-white">
      {/* Header */}
      <div className="w-full bg-white/95 backdrop-blur-sm shadow-sm h-14 px-4 flex items-center justify-between border-b border-pink-100">
        <Link href="/">
          <Button variant="ghost" className="text-gray-800 hover:text-pink-600 hover:bg-pink-50">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Home
          </Button>
        </Link>
        
        <h1 className="text-xl font-bold text-gray-800">Live Routine</h1>
        
        <div className="flex items-center space-x-2">
          <Button
            onClick={handlePermissionRequest}
            variant="outline"
            size="sm"
            className="border-pink-300 text-pink-600 hover:bg-pink-50"
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Reload
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-4">
        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center min-h-[300px]">
            <LoadingState progress={loadingProgress} />
          </div>
        )}

        {/* Permission Dialog */}
        {hasPermission === false && !isLoading && (
          <div className="flex justify-center items-center min-h-[300px]">
            <PermissionDialog 
              onRequestPermission={handlePermissionRequest}
            />
          </div>
        )}

        {/* Camera View + Settings Panel */}
        {(hasPermission || sourceType !== 'camera') && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-4"
          >
            {/* Camera Options - Moved to top for easy access */}
            {sourceType === 'camera' && hasPermission && !isLoading && (
              <div className="bg-white/90 backdrop-blur-sm shadow-md rounded-xl p-4 border border-pink-100">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-gray-800 text-sm font-semibold flex items-center">
                    <span className="material-icons text-pink-500 mr-2 text-sm">tune</span>
                    Camera Options
                  </h3>
                  
                  <div className="flex items-center space-x-3 text-xs">
                    <label className="flex items-center text-gray-700">
                      <input
                        type="checkbox"
                        checked={showSkeleton}
                        onChange={(e) => setShowSkeleton(e.target.checked)}
                        className="mr-1 accent-pink-500"
                      />
                      Skeleton
                    </label>
                    
                    <label className="flex items-center text-gray-700">
                      <input
                        type="checkbox"
                        checked={showPoints}
                        onChange={(e) => setShowPoints(e.target.checked)}
                        className="mr-1 accent-pink-500"
                      />
                      Points
                    </label>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-gray-600">Skeleton Color</label>
                    <select
                      value={skeletonColorChoice}
                      onChange={(e) => setSkeletonColorChoice(e.target.value as any)}
                      className="w-full bg-white border border-pink-200 rounded-lg px-3 py-1.5 text-sm text-gray-800 focus:border-pink-400 focus:ring-pink-400"
                    >
                      <option value="red">Red</option>
                      <option value="blue">Blue</option>
                      <option value="green">Green</option>
                      <option value="purple">Purple</option>
                      <option value="orange">Orange</option>
                    </select>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-xs text-gray-600">Camera View</label>
                    <button
                      onClick={() => setCameraFacing(cameraFacing === 'user' ? 'environment' : 'user')}
                      className="w-full bg-gradient-to-r from-pink-500 to-pink-400 hover:from-pink-600 hover:to-pink-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                    >
                      {cameraFacing === 'user' ? 'Front Camera' : 'Back Camera'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Camera View */}
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
          </motion.div>
        )}

        {/* Error State */}
        {trackingStatus === 'error' && !isLoading && (
          <div className="flex flex-col items-center justify-center min-h-[300px] text-center">
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-md">
              <div className="text-red-500 mb-3">
                <span className="material-icons text-3xl">error_outline</span>
              </div>
              <h3 className="text-red-700 text-lg font-semibold mb-2">Camera Error</h3>
              <p className="text-red-600 mb-4 text-sm">
                Failed to access camera or load AI models. Please check your permissions and try again.
              </p>
              <Button
                onClick={handlePermissionRequest}
                className="bg-red-500 hover:bg-red-600 text-white"
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