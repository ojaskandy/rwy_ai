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
 * Request camera permission from the user
 */
export async function requestCameraPermission(): Promise<boolean> {
  try {
    const constraints = getOptimalCameraConstraints();
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    // Stop the stream immediately after getting permission
    stream.getTracks().forEach(track => track.stop());
    return true;
  } catch (error) {
    console.error('Error requesting camera permission:', error);
    return false;
  }
}

/**
 * Get a camera stream with specified facing mode and mobile optimization
 */
export async function getCameraStream(facingMode: CameraFacing = 'user'): Promise<MediaStream> {
  try {
    // Try with optimal constraints first
    try {
      const constraints = getOptimalCameraConstraints(facingMode);
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      return stream;
    } catch {
      // Fall back to basic constraints if optimal fails
      console.warn(`Couldn't get ${facingMode} camera with optimal constraints, trying basic constraints`);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: facingMode
          }
        });
        return stream;
      } catch {
        // Final fallback - any camera
        console.warn(`Couldn't get ${facingMode} camera, trying default camera`);
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true
        });
        return stream;
      }
    }
  } catch (error) {
    console.error('Error getting camera stream:', error);
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
 * Setup mobile-optimized canvas
 */
export function setupMobileCanvas(canvas: HTMLCanvasElement, video: HTMLVideoElement): void {
  const { width, height } = getOptimalCanvasSize(video);
  
  canvas.width = width;
  canvas.height = height;
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.objectFit = 'cover';
  
  // Handle device pixel ratio for sharp rendering
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const devicePixelRatio = window.devicePixelRatio || 1;
    canvas.width = width * devicePixelRatio;
    canvas.height = height * devicePixelRatio;
    ctx.scale(devicePixelRatio, devicePixelRatio);
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
  }
}
