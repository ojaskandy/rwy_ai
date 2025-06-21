// Pose Analysis Library for Shifu Says Challenge
// This analyzes joint angles and positions from reference images

interface JointPosition {
  x: number;
  y: number;
  score?: number;
  name?: string;
}

interface PoseSignature {
  keyAngles: {
    leftKneeAngle?: number;
    rightKneeAngle?: number;
    leftHipAngle?: number;
    rightHipAngle?: number;
    leftElbowAngle?: number;
    rightElbowAngle?: number;
    leftShoulderAngle?: number;
    rightShoulderAngle?: number;
    leftAnkleHeight?: number; // relative to hip
    rightAnkleHeight?: number; // relative to hip
    leftWristHeight?: number; // relative to shoulder
    rightWristHeight?: number; // relative to shoulder
    stanceWidth?: number; // distance between feet
    torsoAngle?: number; // lean forward/back
  };
  tolerances: {
    angleTolerance: number; // degrees
    heightTolerance: number; // pixels
    stanceTolerance: number; // pixels
  };
}

interface PoseReferenceData {
  [poseName: string]: PoseSignature;
}

// Default pose reference data - stored locally for immediate functionality
const defaultPoseReferences: PoseReferenceData = {
  front_kick: {
    keyAngles: {
      leftKneeAngle: 45,
      rightKneeAngle: 160,
      leftAnkleHeight: -100,
      rightAnkleHeight: 50,
      stanceWidth: 30
    },
    tolerances: {
      angleTolerance: 30,
      heightTolerance: 40,
      stanceTolerance: 20
    }
  },
  side_kick: {
    keyAngles: {
      leftKneeAngle: 90,
      rightKneeAngle: 160,
      leftAnkleHeight: -80,
      rightAnkleHeight: 50,
      stanceWidth: 80
    },
    tolerances: {
      angleTolerance: 25,
      heightTolerance: 35,
      stanceTolerance: 25
    }
  },
  round_kick: {
    keyAngles: {
      leftKneeAngle: 110,
      rightKneeAngle: 160,
      leftAnkleHeight: -60,
      rightAnkleHeight: 50,
      stanceWidth: 70
    },
    tolerances: {
      angleTolerance: 30,
      heightTolerance: 40,
      stanceTolerance: 25
    }
  },
  back_kick: {
    keyAngles: {
      leftKneeAngle: 45,
      rightKneeAngle: 160,
      leftAnkleHeight: -90,
      rightAnkleHeight: 50,
      stanceWidth: 40
    },
    tolerances: {
      angleTolerance: 35,
      heightTolerance: 45,
      stanceTolerance: 30
    }
  },
  axe_kick: {
    keyAngles: {
      leftKneeAngle: 170,
      rightKneeAngle: 160,
      leftAnkleHeight: -120,
      rightAnkleHeight: 50,
      stanceWidth: 35
    },
    tolerances: {
      angleTolerance: 25,
      heightTolerance: 50,
      stanceTolerance: 25
    }
  },
  fighting_stance: {
    keyAngles: {
      leftKneeAngle: 150,
      rightKneeAngle: 150,
      leftAnkleHeight: 40,
      rightAnkleHeight: 40,
      stanceWidth: 60,
      leftElbowAngle: 90,
      rightElbowAngle: 90
    },
    tolerances: {
      angleTolerance: 20,
      heightTolerance: 25,
      stanceTolerance: 30
    }
  },
  horse_stance: {
    keyAngles: {
      leftKneeAngle: 120,
      rightKneeAngle: 120,
      leftAnkleHeight: 45,
      rightAnkleHeight: 45,
      stanceWidth: 120
    },
    tolerances: {
      angleTolerance: 25,
      heightTolerance: 30,
      stanceTolerance: 40
    }
  },
  high_block: {
    keyAngles: {
      leftElbowAngle: 120,
      rightElbowAngle: 160,
      leftWristHeight: -80,
      rightWristHeight: 20,
      leftKneeAngle: 150,
      rightKneeAngle: 150
    },
    tolerances: {
      angleTolerance: 30,
      heightTolerance: 40,
      stanceTolerance: 30
    }
  },
  low_block: {
    keyAngles: {
      leftElbowAngle: 140,
      rightElbowAngle: 160,
      leftWristHeight: 60,
      rightWristHeight: 20,
      leftKneeAngle: 150,
      rightKneeAngle: 150
    },
    tolerances: {
      angleTolerance: 30,
      heightTolerance: 40,
      stanceTolerance: 30
    }
  },
  punch: {
    keyAngles: {
      leftElbowAngle: 160,
      rightElbowAngle: 90,
      leftWristHeight: -20,
      rightWristHeight: 10,
      leftKneeAngle: 150,
      rightKneeAngle: 150
    },
    tolerances: {
      angleTolerance: 25,
      heightTolerance: 35,
      stanceTolerance: 30
    }
  }
};

// Global reference store - now starts with default data
let poseReferences: PoseReferenceData = { ...defaultPoseReferences };

/**
 * Calculate angle between three points
 */
function calculateAngle(point1: JointPosition, point2: JointPosition, point3: JointPosition): number {
  const vector1 = { x: point1.x - point2.x, y: point1.y - point2.y };
  const vector2 = { x: point3.x - point2.x, y: point3.y - point2.y };
  
  const dot = vector1.x * vector2.x + vector1.y * vector2.y;
  const mag1 = Math.sqrt(vector1.x * vector1.x + vector1.y * vector1.y);
  const mag2 = Math.sqrt(vector2.x * vector2.x + vector2.y * vector2.y);
  
  const cosAngle = dot / (mag1 * mag2);
  const angle = Math.acos(Math.max(-1, Math.min(1, cosAngle))); // Clamp to avoid NaN
  
  return angle * (180 / Math.PI); // Convert to degrees
}

/**
 * Analyze keypoints from an image and extract pose signature
 */
export function analyzePoseFromKeypoints(keypoints: JointPosition[]): {
  angles: Record<string, number>;
  heights: Record<string, number>;
  measurements: Record<string, number>;
} {
  const angles: Record<string, number> = {};
  const heights: Record<string, number> = {};
  const measurements: Record<string, number> = {};

  // Find keypoints
  const getKeypoint = (name: string) => keypoints.find(kp => kp.name === name);
  
  const leftHip = getKeypoint('left_hip');
  const rightHip = getKeypoint('right_hip');
  const leftKnee = getKeypoint('left_knee');
  const rightKnee = getKeypoint('right_knee');
  const leftAnkle = getKeypoint('left_ankle');
  const rightAnkle = getKeypoint('right_ankle');
  const leftShoulder = getKeypoint('left_shoulder');
  const rightShoulder = getKeypoint('right_shoulder');
  const leftElbow = getKeypoint('left_elbow');
  const rightElbow = getKeypoint('right_elbow');
  const leftWrist = getKeypoint('left_wrist');
  const rightWrist = getKeypoint('right_wrist');

  // Calculate angles
  if (leftHip && leftKnee && leftAnkle) {
    angles.leftKneeAngle = calculateAngle(leftHip, leftKnee, leftAnkle);
  }
  if (rightHip && rightKnee && rightAnkle) {
    angles.rightKneeAngle = calculateAngle(rightHip, rightKnee, rightAnkle);
  }
  if (leftShoulder && leftElbow && leftWrist) {
    angles.leftElbowAngle = calculateAngle(leftShoulder, leftElbow, leftWrist);
  }
  if (rightShoulder && rightElbow && rightWrist) {
    angles.rightElbowAngle = calculateAngle(rightShoulder, rightElbow, rightWrist);
  }

  // Calculate heights (relative to hip level)
  const hipLevel = leftHip && rightHip ? (leftHip.y + rightHip.y) / 2 : 0;
  const shoulderLevel = leftShoulder && rightShoulder ? (leftShoulder.y + rightShoulder.y) / 2 : 0;

  if (leftAnkle && hipLevel) {
    heights.leftAnkleHeight = hipLevel - leftAnkle.y; // Negative = above hip
  }
  if (rightAnkle && hipLevel) {
    heights.rightAnkleHeight = hipLevel - rightAnkle.y; // Negative = above hip
  }
  if (leftWrist && shoulderLevel) {
    heights.leftWristHeight = shoulderLevel - leftWrist.y; // Negative = above shoulder
  }
  if (rightWrist && shoulderLevel) {
    heights.rightWristHeight = shoulderLevel - rightWrist.y; // Negative = above shoulder
  }

  // Calculate measurements
  if (leftAnkle && rightAnkle) {
    measurements.stanceWidth = Math.abs(leftAnkle.x - rightAnkle.x);
  }

  return { angles, heights, measurements };
}

/**
 * Compare user pose with reference pose signature
 */
export function comparePoseWithReference(
  userKeypoints: JointPosition[], 
  referencePoseName: string
): {
  match: boolean;
  confidence: number;
  details: Record<string, { expected: number; actual: number; withinTolerance: boolean }>;
} {
  const reference = poseReferences[referencePoseName];
  if (!reference) {
    return { match: false, confidence: 0, details: {} };
  }

  // Check if keypoints have sufficient confidence (default minimum 0.6)
  const minConfidence = 0.6;
  const availableKeypoints = userKeypoints.filter(kp => (kp.score || 0) >= minConfidence);
  
  if (availableKeypoints.length < 3) {
    console.log(`Insufficient keypoints with confidence >= ${minConfidence} for ${referencePoseName}`);
    return { match: false, confidence: 0, details: {} };
  }

  // Analyze user pose
  const userAnalysis = analyzePoseFromKeypoints(userKeypoints);
  const details: Record<string, { expected: number; actual: number; withinTolerance: boolean }> = {};
  
  let totalChecks = 0;
  let passedChecks = 0;

  // Check angles
  Object.entries(reference.keyAngles).forEach(([angleName, expectedValue]) => {
    if (expectedValue !== undefined) {
      totalChecks++;
      
      let actualValue: number | undefined;
      
      if (angleName.endsWith('Angle')) {
        actualValue = userAnalysis.angles[angleName];
      } else if (angleName.endsWith('Height')) {
        actualValue = userAnalysis.heights[angleName];
      } else if (angleName.endsWith('Width')) {
        actualValue = userAnalysis.measurements[angleName];
      }

      if (actualValue !== undefined) {
        const tolerance = angleName.endsWith('Angle') ? reference.tolerances.angleTolerance :
                         angleName.endsWith('Height') ? reference.tolerances.heightTolerance :
                         reference.tolerances.stanceTolerance;
        
        const difference = Math.abs(actualValue - expectedValue);
        const withinTolerance = difference <= tolerance;
        
        details[angleName] = {
          expected: expectedValue,
          actual: actualValue,
          withinTolerance
        };

        if (withinTolerance) {
          passedChecks++;
        }
      } else {
        details[angleName] = {
          expected: expectedValue,
          actual: 0,
          withinTolerance: false
        };
      }
    }
  });

  const confidence = totalChecks > 0 ? passedChecks / totalChecks : 0;
  const match = confidence >= 0.7; // 70% of measurements must be within tolerance

  return { match, confidence, details };
}

/**
 * Detect martial arts pose from user keypoints
 */
export function detectMartialArtsPoseAdvanced(keypoints: JointPosition[]): {
  pose: string | null;
  confidence: number;
  allResults: Array<{ pose: string; confidence: number }>;
} {
  const results: Array<{ pose: string; confidence: number }> = [];

  // Test against all reference poses
  Object.keys(poseReferences).forEach(poseName => {
    const comparison = comparePoseWithReference(keypoints, poseName);
    results.push({
      pose: poseName,
      confidence: comparison.confidence
    });
  });

  // Sort by confidence
  results.sort((a, b) => b.confidence - a.confidence);
  
  const bestMatch = results[0];
  const detectedPose = bestMatch && bestMatch.confidence >= 0.7 ? bestMatch.pose : null;

  return {
    pose: detectedPose,
    confidence: bestMatch ? bestMatch.confidence : 0,
    allResults: results
  };
}

/**
 * Update reference pose from analyzed image data
 */
export function updateReferencePose(poseName: string, analyzedData: {
  angles: Record<string, number>;
  heights: Record<string, number>;
  measurements: Record<string, number>;
}) {
  if (poseReferences[poseName]) {
    // Update the reference with analyzed data
    const updatedAngles: any = {};
    
    Object.entries(analyzedData.angles).forEach(([key, value]) => {
      updatedAngles[key] = value;
    });
    Object.entries(analyzedData.heights).forEach(([key, value]) => {
      updatedAngles[key] = value;
    });
    Object.entries(analyzedData.measurements).forEach(([key, value]) => {
      updatedAngles[key] = value;
    });

    poseReferences[poseName].keyAngles = { ...poseReferences[poseName].keyAngles, ...updatedAngles };
    
    console.log(`Updated reference pose ${poseName}:`, poseReferences[poseName]);
  }
}

/**
 * Get all available reference poses
 */
export function getAvailablePoses(): string[] {
  return Object.keys(poseReferences);
}

/**
 * Get reference pose details
 */
export function getReferencePose(poseName: string): PoseSignature | null {
  return poseReferences[poseName] || null;
} 