export type CameraFacing = 'user' | 'environment';

/**
 * Detect if device is mobile
 */
export function isMobileDevice(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * Get optimal camera constraints for mobile/desktop
 */
export function getOptimalCameraConstraints(facingMode: CameraFacing = 'user'): MediaStreamConstraints {
  const isMobile = isMobileDevice();
  
  if (isMobile) {
    // Mobile optimized constraints
    return {
      video: {
        facingMode: facingMode,
        width: { ideal: 720, max: 1280 },
        height: { ideal: 1280, max: 720 },
        frameRate: { ideal: 30, max: 60 },
        // Mobile-specific optimizations
        aspectRatio: { ideal: 9/16 },
        resizeMode: 'crop-and-scale'
      },
      audio: false
    };
  } else {
    // Desktop optimized constraints
    return {
      video: {
        facingMode: facingMode,
        width: { ideal: 1280, max: 1920 },
        height: { ideal: 720, max: 1080 },
        frameRate: { ideal: 30, max: 60 },
        aspectRatio: { ideal: 16/9 }
      },
      audio: false
    };
  }
}

/**
 * Request camera permission from the user with mobile-specific handling and fallback strategies
 */
export async function requestCameraPermission(): Promise<boolean> {
  try {
    // First check if getUserMedia is supported
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.error('getUserMedia is not supported');
      return false;
    }

    // For mobile devices, try multiple constraint strategies
    const isMobile = isMobileDevice();
    
    if (isMobile) {
      // Mobile fallback strategy - try progressively simpler constraints
      const constraintOptions = [
        // Try basic mobile constraints first
        {
          video: {
            facingMode: 'user',
            width: { ideal: 640 },
            height: { ideal: 480 }
          },
          audio: false
        },
        // Fallback to minimal constraints
        {
          video: {
            facingMode: 'user'
          },
          audio: false
        },
        // Final fallback - just video
        {
          video: true,
          audio: false
        }
      ];

      for (const constraints of constraintOptions) {
        try {
          console.log('Trying mobile constraints:', constraints);
          const stream = await navigator.mediaDevices.getUserMedia(constraints);
          console.log('Camera permission granted with constraints:', constraints);
          
          // Stop the stream immediately after getting permission
          stream.getTracks().forEach(track => track.stop());
          return true;
        } catch (error: any) {
          console.log('Failed with constraints:', constraints, 'Error:', error.name);
          // Continue to next constraint option
        }
      }
      
      // If all mobile constraints failed
      throw new Error('All mobile camera constraints failed');
    } else {
      // Desktop - use optimal constraints
      const constraints = getOptimalCameraConstraints();
      console.log('Requesting camera permission with constraints:', constraints);
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('Camera permission granted successfully');
      
      // Stop the stream immediately after getting permission
      stream.getTracks().forEach(track => track.stop());
      return true;
    }
  } catch (error: any) {
    console.error('Error requesting camera permission:', error);
    
    // Provide specific error messages for mobile users
    if (error.name === 'NotAllowedError') {
      console.error('Camera permission denied by user');
    } else if (error.name === 'NotFoundError') {
      console.error('No camera found on device');
    } else if (error.name === 'NotReadableError') {
      console.error('Camera is already in use by another application');
    } else if (error.name === 'OverconstrainedError') {
      console.error('Camera constraints not supported');
    } else if (error.name === 'SecurityError') {
      console.error('Camera access blocked by security policy');
    }
    
    return false;
  }
}

/**
 * Check if camera permissions are already granted
 */
export async function checkCameraPermissions(): Promise<boolean> {
  try {
    if (!navigator.permissions) {
      // Fallback: try to access camera briefly to check permissions
      return await requestCameraPermission();
    }
    
    const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
    return result.state === 'granted';
  } catch (error) {
    console.error('Error checking camera permissions:', error);
    return false;
  }
}

/**
 * Initialize camera with user gesture requirement for mobile
 * This function ensures that camera access is triggered by a user interaction
 */
export async function initializeCameraWithUserGesture(): Promise<MediaStream | null> {
  try {
    console.log('Initializing camera with user gesture...');
    
    // Check if we're on mobile
    const isMobile = isMobileDevice();
    
    if (isMobile) {
      // For mobile, we need to ensure this is called from a user event
      console.log('Mobile device detected - ensuring user gesture');
      
      // Check if we have camera permissions first
      const hasPermission = await checkCameraPermissions();
      if (!hasPermission) {
        console.log('No camera permission - requesting permission');
        const granted = await requestCameraPermission();
        if (!granted) {
          console.error('Camera permission denied');
          return null;
        }
      }
    }
    
    // Get camera stream with fallback
    const stream = await getCameraStream('user');
    console.log('Camera initialized successfully');
    return stream;
  } catch (error: any) {
    console.error('Failed to initialize camera:', error);
    return null;
  }
}

/**
 * Mobile-specific camera initialization with enhanced error handling
 */
export async function initializeMobileCamera(): Promise<MediaStream | null> {
  try {
    console.log('Initializing mobile camera...');
    
    // Ensure this is called from user interaction
    if (!isMobileDevice()) {
      console.log('Not a mobile device, using standard initialization');
      return await getCameraStream('user');
    }
    
    // Mobile-specific initialization with progressive fallback
    const constraintOptions = [
      // Try mobile-optimized constraints first
      {
        video: {
          facingMode: 'user',
          width: { ideal: 640, max: 1280 },
          height: { ideal: 480, max: 720 },
          frameRate: { ideal: 15, max: 30 }
        },
        audio: false
      },
      // Fallback to basic constraints
      {
        video: {
          facingMode: 'user'
        },
        audio: false
      },
      // Final fallback
      {
        video: true,
        audio: false
      }
    ];
    
    for (const constraints of constraintOptions) {
      try {
        console.log('Trying mobile camera constraints:', constraints);
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        console.log('Mobile camera initialized successfully');
        return stream;
      } catch (error: any) {
        console.log('Mobile camera constraint failed:', error.name);
        // Continue to next constraint
      }
    }
    
    throw new Error('All mobile camera constraints failed');
  } catch (error: any) {
    console.error('Failed to initialize mobile camera:', error);
    return null;
  }
}

/**
 * Get a camera stream with specified facing mode and mobile optimization
 */
export async function getCameraStream(facingMode: CameraFacing = 'user'): Promise<MediaStream> {
  try {
    // First check if getUserMedia is supported
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('getUserMedia is not supported on this device');
    }

    const isMobile = isMobileDevice();
    
    // Try with optimal constraints first
    try {
      const constraints = getOptimalCameraConstraints(facingMode);
      console.log(`Trying ${facingMode} camera with optimal constraints:`, constraints);
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('Camera stream obtained with optimal constraints');
      return stream;
    } catch (error: any) {
      console.warn(`Couldn't get ${facingMode} camera with optimal constraints:`, error.message);
      
      // Mobile-specific fallback strategy
      if (isMobile) {
        try {
          // Try simpler mobile constraints
          const mobileConstraints = {
            video: {
              facingMode: facingMode,
              width: { ideal: 640, max: 1280 },
              height: { ideal: 480, max: 720 }
            },
            audio: false
          };
          console.log(`Trying ${facingMode} camera with mobile constraints:`, mobileConstraints);
          const stream = await navigator.mediaDevices.getUserMedia(mobileConstraints);
          console.log('Camera stream obtained with mobile constraints');
          return stream;
        } catch (mobileError: any) {
          console.warn(`Couldn't get ${facingMode} camera with mobile constraints:`, mobileError.message);
        }
      }
      
      // Fall back to basic constraints if optimal fails
      try {
        const basicConstraints = {
          video: {
            facingMode: facingMode
          }
        };
        console.log(`Trying ${facingMode} camera with basic constraints:`, basicConstraints);
        const stream = await navigator.mediaDevices.getUserMedia(basicConstraints);
        console.log('Camera stream obtained with basic constraints');
        return stream;
      } catch (basicError: any) {
        console.warn(`Couldn't get ${facingMode} camera with basic constraints:`, basicError.message);
        
        // Final fallback - any camera
        try {
          console.log('Trying default camera as final fallback');
          const stream = await navigator.mediaDevices.getUserMedia({
            video: true
          });
          console.log('Camera stream obtained with default constraints');
          return stream;
        } catch (fallbackError: any) {
          console.error('All camera access attempts failed:', fallbackError.message);
          throw fallbackError;
        }
      }
    }
  } catch (error: any) {
    console.error('Error getting camera stream:', error);
    
    // Provide helpful error messages for mobile users
    if (error.name === 'NotAllowedError') {
      throw new Error('Camera permission denied. Please allow camera access in your browser settings.');
    } else if (error.name === 'NotFoundError') {
      throw new Error('No camera found on this device.');
    } else if (error.name === 'NotReadableError') {
      throw new Error('Camera is already in use by another application.');
    } else if (error.name === 'OverconstrainedError') {
      throw new Error('Camera constraints not supported by this device.');
    } else if (error.name === 'SecurityError') {
      throw new Error('Camera access blocked by security policy. Please ensure you\'re using HTTPS.');
    }
    
    throw error;
  }
}

/**
 * Check if device has multiple cameras
 */
export async function hasMultipleCameras(): Promise<boolean> {
  if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
    return false;
  }
  
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(device => device.kind === 'videoinput');
    return videoDevices.length > 1;
  } catch (error) {
    console.error('Error checking for multiple cameras:', error);
    return false;
  }
}

/**
 * Initialize video element with mobile optimizations
 */
export function initializeMobileVideo(videoElement: HTMLVideoElement): void {
  // Set video attributes for mobile optimization
  videoElement.setAttribute('playsinline', 'true');
  videoElement.setAttribute('webkit-playsinline', 'true');
  videoElement.setAttribute('muted', 'true');
  videoElement.setAttribute('autoplay', 'true');
  
  // Prevent video from going fullscreen on mobile
  videoElement.style.objectFit = 'cover';
  videoElement.style.width = '100%';
  videoElement.style.height = '100%';
  
  // Handle orientation changes
  const handleOrientationChange = () => {
    setTimeout(() => {
      videoElement.style.width = '100%';
      videoElement.style.height = '100%';
    }, 100);
  };
  
  window.addEventListener('orientationchange', handleOrientationChange);
  
  // Return cleanup function
  return () => {
    window.removeEventListener('orientationchange', handleOrientationChange);
  };
}

/**
 * Get canvas size that maintains aspect ratio for mobile
 */
export function getOptimalCanvasSize(videoElement: HTMLVideoElement): { width: number; height: number } {
  const isMobile = isMobileDevice();
  const container = videoElement.parentElement;
  
  if (!container) {
    return { width: 640, height: 480 };
  }
  
  const containerWidth = container.clientWidth;
  const containerHeight = container.clientHeight;
  const videoWidth = videoElement.videoWidth || 640;
  const videoHeight = videoElement.videoHeight || 480;
  
  if (isMobile) {
    // For mobile, prioritize fitting the screen
    const aspectRatio = videoWidth / videoHeight;
    
    if (containerWidth / containerHeight > aspectRatio) {
      return {
        width: containerHeight * aspectRatio,
        height: containerHeight
      };
    } else {
      return {
        width: containerWidth,
        height: containerWidth / aspectRatio
      };
    }
  } else {
    // For desktop, use video dimensions
    return {
      width: Math.min(videoWidth, containerWidth),
      height: Math.min(videoHeight, containerHeight)
    };
  }
}

/**
 * Setup mobile-optimized canvas that matches the video preview exactly
 */
export function setupMobileCanvas(canvas: HTMLCanvasElement, video: HTMLVideoElement): void {
  // Get the actual displayed dimensions of the video element
  const displayWidth = video.clientWidth;
  const displayHeight = video.clientHeight;
  
  // Set canvas dimensions to match exactly what the user sees
  canvas.width = displayWidth;
  canvas.height = displayHeight;
  canvas.style.width = displayWidth + 'px';
  canvas.style.height = displayHeight + 'px';
  canvas.style.objectFit = 'cover';
  
  console.log('Canvas setup:', {
    canvasWidth: canvas.width,
    canvasHeight: canvas.height,
    videoDisplayWidth: displayWidth,
    videoDisplayHeight: displayHeight,
    videoNativeWidth: video.videoWidth,
    videoNativeHeight: video.videoHeight
  });
}
