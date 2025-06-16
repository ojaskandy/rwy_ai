// Import TensorFlow.js and the pose-detection library
import * as poseDetection from '@tensorflow-models/pose-detection';
import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';

// Store detector instance
let detector: poseDetection.PoseDetector | null = null;
let modelConfig: poseDetection.MoveNetModelConfig = {
  modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
  enableSmoothing: true,
};

// Pose smoothing variables
interface SmoothedKeypoint {
  x: number;
  y: number;
  score: number;
  name: string;
}

interface PoseHistory {
  poses: Array<{
    keypoints: SmoothedKeypoint[];
    timestamp: number;
  }>;
  maxHistory: number;
}

const poseHistory: PoseHistory = {
  poses: [],
  maxHistory: 5 // Keep last 5 poses for smoothing
};

/**
 * Initialize the pose detection models
 */
export async function initPoseDetection(modelName: string = 'lightning') {
  try {
    console.log('Initializing pose detection with model:', modelName);
    
    // Clean up existing detector
    if (detector) {
      detector.dispose();
      detector = null;
    }
    
    // Make sure TensorFlow backend is initialized
    await tf.ready();
    
    // Ensure WebGL backend is set
    if (tf.getBackend() !== 'webgl') {
      console.log('Setting backend to WebGL');
      await tf.setBackend('webgl');
    }
    
    console.log('Current backend:', tf.getBackend());
    
    // Select model based on user preference
    switch (modelName) {
      case 'lightning':
        modelConfig.modelType = poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING;
        break;
      case 'thunder':
        modelConfig.modelType = poseDetection.movenet.modelType.SINGLEPOSE_THUNDER;
        break;
      case 'heavy':
        modelConfig.modelType = poseDetection.movenet.modelType.MULTIPOSE_LIGHTNING;
        break;
      default:
        modelConfig.modelType = poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING;
    }
    
    console.log('Creating detector with model config:', modelConfig);
    
    // Create detector
    detector = await poseDetection.createDetector(
      poseDetection.SupportedModels.MoveNet,
      modelConfig
    );
    
    console.log('Detector created successfully');
    return detector;
  } catch (error) {
    console.error('Error initializing pose detection:', error);
    throw error;
  }
}

/**
 * Get available models
 */
export function getModels() {
  return [
    { id: 'lightning', name: 'Lightning (Fast)' },
    { id: 'thunder', name: 'Thunder (Accurate)' },
    { id: 'heavy', name: 'Heavy (Most Accurate)' }
  ];
}

/**
 * Detect poses in an image/video frame
 */
export async function detectPoses(
  image: HTMLVideoElement | HTMLImageElement,
  maxPoses: number = 1,
  minConfidence: number = 0.5
) {
  if (!detector) {
    console.error('Detector not initialized. Call initPoseDetection first.');
    throw new Error('Detector not initialized. Call initPoseDetection first.');
  }
  
  // Check if the element is ready and has proper dimensions
  let isSourceReady = false;
  let sourceWidth = 0;
  let sourceHeight = 0;
  
  if (image instanceof HTMLVideoElement) {
    // For video, check readyState and dimensions
    isSourceReady = image.readyState >= 2;
    sourceWidth = image.videoWidth;
    sourceHeight = image.videoHeight;
    
    if (!isSourceReady) {
      console.log('Video not ready yet, waiting for metadata');
      return [];
    }
    
    if (sourceWidth === 0 || sourceHeight === 0) {
      console.log('Video dimensions are zero, cannot detect poses');
      return [];
    }
  } else if (image instanceof HTMLImageElement) {
    // For image, check if it's loaded and has dimensions
    isSourceReady = image.complete && image.naturalWidth > 0;
    sourceWidth = image.naturalWidth;
    sourceHeight = image.naturalHeight;
    
    if (!isSourceReady) {
      console.log('Image not fully loaded yet, waiting to complete');
      return [];
    }
    
    if (sourceWidth === 0 || sourceHeight === 0) {
      console.log('Image dimensions are zero, cannot detect poses');
      return [];
    }
  }
  
  try {
    // Log source dimensions for debugging
    console.log(`Source dimensions: ${sourceWidth}x${sourceHeight}`);
    
    // Run inference with enhanced settings for better detection
    console.log(`Running pose detection with maxPoses: ${maxPoses}, confidence: ${minConfidence}`);
    
    // Enhanced estimation options for better stability
    const estimationOptions = {
      maxPoses,
      flipHorizontal: false,
      scoreThreshold: Math.max(0.3, minConfidence * 0.6), // Lower threshold to get more keypoints initially
    };
    
    const poses = await detector.estimatePoses(image, estimationOptions);
    
    if (!poses || poses.length === 0) {
      return [];
    }
    
    // Filter keypoints by confidence - PRECISE TRACKING, NO SMOOTHING
    const filteredPoses = poses.map(pose => {
      const filteredKeypoints = pose.keypoints.filter(kp => 
        typeof kp.score === 'number' && kp.score > minConfidence
      );

      return {
        ...pose,
        keypoints: filteredKeypoints
      };
    });
    
    return filteredPoses;
  } catch (error) {
    console.error('Error estimating poses:', error);
    throw error;
  }
}

/**
 * Get joint connections for visualization
 * @returns {Array<[string, string]>} An array of joint connections represented as [start, end] pairs
 */
export function getJointConnections(): Array<[string, string]> {
  return [
    // Torso
    ['left_shoulder', 'right_shoulder'],
    ['left_shoulder', 'left_hip'],
    ['right_shoulder', 'right_hip'],
    ['left_hip', 'right_hip'],
    // Arms
    ['left_shoulder', 'left_elbow'],
    ['left_elbow', 'left_wrist'],
    ['right_shoulder', 'right_elbow'],
    ['right_elbow', 'right_wrist'],
    // Legs
    ['left_hip', 'left_knee'],
    ['left_knee', 'left_ankle'],
    ['right_hip', 'right_knee'],
    ['right_knee', 'right_ankle'],
    // Face
    ['nose', 'left_eye'],
    ['nose', 'right_eye'],
    ['left_eye', 'left_ear'],
    ['right_eye', 'right_ear'],
  ] as Array<[string, string]>;
}

// Lightweight smoothing function for keypoints - minimal drift
function smoothKeypoints(currentPose: any, history: PoseHistory): SmoothedKeypoint[] {
  if (!currentPose?.keypoints || history.poses.length < 2) {
    return currentPose?.keypoints || [];
  }

  const smoothedKeypoints: SmoothedKeypoint[] = [];
  const alpha = 0.85; // Much less smoothing to prevent drift (0 = all history, 1 = all current)

  currentPose.keypoints.forEach((currentKp: any) => {
    // Only use the most recent pose for minimal smoothing
    const lastPose = history.poses[history.poses.length - 1];
    const lastKp = lastPose?.keypoints.find(kp => kp.name === currentKp.name);

    if (lastKp && lastKp.score > 0.4) {
      // Apply very light smoothing only if the distance isn't too large (prevents jumps)
      const distance = Math.sqrt(
        Math.pow(currentKp.x - lastKp.x, 2) + Math.pow(currentKp.y - lastKp.y, 2)
      );
      
      // Only smooth if movement is reasonable (not a detection error)
      if (distance < 50) {
        smoothedKeypoints.push({
          x: alpha * currentKp.x + (1 - alpha) * lastKp.x,
          y: alpha * currentKp.y + (1 - alpha) * lastKp.y,
          score: currentKp.score,
          name: currentKp.name
        });
      } else {
        // Large movement - don't smooth, use current position
        smoothedKeypoints.push({
          x: currentKp.x,
          y: currentKp.y,
          score: currentKp.score,
          name: currentKp.name
        });
      }
    } else {
      // No history or low confidence - use current position
      smoothedKeypoints.push({
        x: currentKp.x,
        y: currentKp.y,
        score: currentKp.score,
        name: currentKp.name
      });
    }
  });

  return smoothedKeypoints;
}

export async function detectPosesSmooth(
  image: HTMLVideoElement | HTMLImageElement,
  maxPoses: number = 1,
  minConfidence: number = 0.5
) {
  if (!detector) {
    detector = await initPoseDetection();
  }

  if (!detector) {
    throw new Error('Pose detector not initialized');
  }

  const sourceWidth = image instanceof HTMLVideoElement ? image.videoWidth : image.naturalWidth;
  const sourceHeight = image instanceof HTMLVideoElement ? image.videoHeight : image.naturalHeight;

  if (sourceWidth === 0 || sourceHeight === 0) {
    console.warn('Invalid source dimensions, skipping detection');
    return [];
  }

  try {
    // Enhanced estimation options for better stability
    const estimationOptions = {
      maxPoses,
      flipHorizontal: false,
      scoreThreshold: Math.max(0.3, minConfidence * 0.6), // Lower threshold to get more keypoints initially
    };

    const poses = await detector.estimatePoses(image, estimationOptions);

    if (!poses || poses.length === 0) {
      return [];
    }

    // Apply smoothing to reduce jitter
    const smoothedPoses = poses.map(pose => {
      const smoothedKeypoints = smoothKeypoints(pose, poseHistory);
      
      // Filter keypoints by confidence after smoothing
      const filteredKeypoints = smoothedKeypoints.filter(kp => 
        kp.score > minConfidence
      );

      return {
        ...pose,
        keypoints: filteredKeypoints
      };
    });

    // Update history with current pose (before smoothing for next frame)
    if (smoothedPoses.length > 0 && smoothedPoses[0].keypoints.length > 5) {
      poseHistory.poses.push({
        keypoints: smoothedPoses[0].keypoints,
        timestamp: Date.now()
      });

      // Maintain history size
      if (poseHistory.poses.length > poseHistory.maxHistory) {
        poseHistory.poses.shift();
      }
    }

    return smoothedPoses;
  } catch (error) {
    console.error('Error estimating poses:', error);
    throw error;
  }
}

// Reset pose history (useful when switching cameras or starting new sessions)
export function resetPoseHistory() {
  poseHistory.poses = [];
}
