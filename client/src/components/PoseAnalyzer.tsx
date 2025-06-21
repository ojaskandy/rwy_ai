import React, { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Settings, Save, Upload, X, Edit2, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Import pose detection utilities
import * as poseDetection from '@tensorflow-models/pose-detection';
import '@tensorflow/tfjs-backend-webgl';

interface PoseAnalyzerProps {
  onClose?: () => void;
}

interface CustomPose {
  id: number;
  name: string;
  imageUrl: string;
  angles: Record<string, number>;
  heights: Record<string, number>;
  measurements: Record<string, number>;
  keyAngles: string[];
  timestamp: string;
}

const PoseAnalyzer: React.FC<PoseAnalyzerProps> = ({ onClose }) => {
  // Pose slot management
  const [selectedSlot, setSelectedSlot] = useState<number>(1);
  const [customPoses, setCustomPoses] = useState<Record<number, CustomPose>>({});
  const [poseName, setPoseName] = useState<string>('');
  
  // Image analysis state
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [detector, setDetector] = useState<poseDetection.PoseDetector | null>(null);
  const [analyzedAngles, setAnalyzedAngles] = useState<Record<string, number>>({});
  const [analyzedHeights, setAnalyzedHeights] = useState<Record<string, number>>({});
  const [analyzedMeasurements, setAnalyzedMeasurements] = useState<Record<string, number>>({});
  const [keyAngles, setKeyAngles] = useState<Set<string>>(new Set());
  const [detectedKeypoints, setDetectedKeypoints] = useState<any[]>([]);
  
  // Manual angle editing
  const [editingAngle, setEditingAngle] = useState<string | null>(null);
  const [newAngleName, setNewAngleName] = useState<string>('');
  const [newAngleValue, setNewAngleValue] = useState<string>('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Load existing custom poses from localStorage on mount
  React.useEffect(() => {
    const savedPoses = localStorage.getItem('shifuSaysCustomPoses');
    if (savedPoses) {
      try {
        setCustomPoses(JSON.parse(savedPoses));
      } catch (error) {
        console.error('Error loading saved poses:', error);
      }
    }
  }, []);

  // Initialize pose detector
  React.useEffect(() => {
    const initDetector = async () => {
      try {
        const detectorConfig = {
          modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
        };
        const detector = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, detectorConfig);
        setDetector(detector);
      } catch (error) {
        console.error('Error initializing pose detector:', error);
      }
    };
    
    initDetector();
  }, []);

  // Draw keypoints and angles on the image
  const drawKeypointsOnImage = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !uploadedImage || detectedKeypoints.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      // Set canvas size to match image aspect ratio
      const aspectRatio = img.width / img.height;
      const canvasWidth = 400;
      const canvasHeight = canvasWidth / aspectRatio;
      
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      
      // Draw the image
      ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);
      
      // Scale keypoints to canvas size
      const scaleX = canvasWidth / img.width;
      const scaleY = canvasHeight / img.height;
      
      // Draw keypoints
      detectedKeypoints.forEach((keypoint: any) => {
        if (keypoint.score > 0.3) {
          const x = keypoint.x * scaleX;
          const y = keypoint.y * scaleY;
          
          // Draw keypoint circle
          ctx.fillStyle = '#FFD700';
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(x, y, 6, 0, 2 * Math.PI);
          ctx.fill();
          ctx.stroke();
          
          // Draw keypoint label
          ctx.fillStyle = '#FFFFFF';
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 3;
          ctx.font = '12px Arial';
          ctx.textAlign = 'center';
          ctx.strokeText(keypoint.name.replace('_', ' '), x, y - 10);
          ctx.fillText(keypoint.name.replace('_', ' '), x, y - 10);
        }
      });

      // Draw connections for angle visualization
      const connections = [
        ['left_shoulder', 'left_elbow', 'left_wrist'],
        ['right_shoulder', 'right_elbow', 'right_wrist'],
        ['left_hip', 'left_knee', 'left_ankle'],
        ['right_hip', 'right_knee', 'right_ankle'],
        ['left_shoulder', 'left_hip', 'left_knee'],
        ['right_shoulder', 'right_hip', 'right_knee'],
      ];

      connections.forEach(([point1, point2, point3]) => {
        const kp1 = detectedKeypoints.find((kp: any) => kp.name === point1);
        const kp2 = detectedKeypoints.find((kp: any) => kp.name === point2);
        const kp3 = detectedKeypoints.find((kp: any) => kp.name === point3);
        
        if (kp1 && kp2 && kp3 && kp1.score > 0.3 && kp2.score > 0.3 && kp3.score > 0.3) {
          // Draw lines
          ctx.strokeStyle = '#FF6B6B';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(kp1.x * scaleX, kp1.y * scaleY);
          ctx.lineTo(kp2.x * scaleX, kp2.y * scaleY);
          ctx.lineTo(kp3.x * scaleX, kp3.y * scaleY);
          ctx.stroke();
        }
      });
    };
    
    img.src = uploadedImage;
  }, [uploadedImage, detectedKeypoints]);

  // Update keypoint visualization when image or keypoints change
  React.useEffect(() => {
    drawKeypointsOnImage();
  }, [drawKeypointsOnImage]);

  // Calculate angle between three points
  const calculateAngle = useCallback((point1: any, point2: any, point3: any): number => {
    const vector1 = { x: point1.x - point2.x, y: point1.y - point2.y };
    const vector2 = { x: point3.x - point2.x, y: point3.y - point2.y };
    
    const dot = vector1.x * vector2.x + vector1.y * vector2.y;
    const mag1 = Math.sqrt(vector1.x * vector1.x + vector1.y * vector1.y);
    const mag2 = Math.sqrt(vector2.x * vector2.x + vector2.y * vector2.y);
    
    if (mag1 === 0 || mag2 === 0) return 0;
    
    const cosAngle = dot / (mag1 * mag2);
    const clampedCos = Math.max(-1, Math.min(1, cosAngle));
    return Math.acos(clampedCos) * (180 / Math.PI);
  }, []);

  // Handle image upload and analysis
  const handleImageUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !detector) return;

    setAnalyzing(true);
    
    try {
      // Create image URL for display
      const imageUrl = URL.createObjectURL(file);
      setUploadedImage(imageUrl);

      // Create image element for pose detection
      const img = new Image();
      img.onload = async () => {
        try {
          // Detect poses
          const poses = await detector.estimatePoses(img);
          
          if (poses.length > 0) {
            const pose = poses[0];
            const keypoints = pose.keypoints;
            setDetectedKeypoints(keypoints);
            
            // Find keypoints by name
            const getKeypoint = (name: string) => keypoints.find((kp: any) => kp.name === name);
            
            const angles: Record<string, number> = {};
            const heights: Record<string, number> = {};
            const measurements: Record<string, number> = {};

            // Get key joints
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

            // Calculate joint angles
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
            if (leftShoulder && leftHip && leftKnee) {
              angles.leftHipAngle = calculateAngle(leftShoulder, leftHip, leftKnee);
            }
            if (rightShoulder && rightHip && rightKnee) {
              angles.rightHipAngle = calculateAngle(rightShoulder, rightHip, rightKnee);
            }

            // Calculate heights (relative to hip level)
            const hipLevel = leftHip && rightHip ? (leftHip.y + rightHip.y) / 2 : 0;
            const shoulderLevel = leftShoulder && rightShoulder ? (leftShoulder.y + rightShoulder.y) / 2 : 0;

            if (leftAnkle && hipLevel) {
              heights.leftAnkleHeight = hipLevel - leftAnkle.y;
            }
            if (rightAnkle && hipLevel) {
              heights.rightAnkleHeight = hipLevel - rightAnkle.y;
            }
            if (leftWrist && shoulderLevel) {
              heights.leftWristHeight = shoulderLevel - leftWrist.y;
            }
            if (rightWrist && shoulderLevel) {
              heights.rightWristHeight = shoulderLevel - rightWrist.y;
            }

            // Calculate measurements
            if (leftAnkle && rightAnkle) {
              measurements.stanceWidth = Math.abs(leftAnkle.x - rightAnkle.x);
            }
            if (leftShoulder && rightShoulder) {
              measurements.shoulderWidth = Math.abs(leftShoulder.x - rightShoulder.x);
            }

            setAnalyzedAngles(angles);
            setAnalyzedHeights(heights);
            setAnalyzedMeasurements(measurements);
          }
        } catch (error) {
          console.error('Error detecting pose:', error);
        } finally {
          setAnalyzing(false);
        }
      };
      
      img.src = imageUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      setAnalyzing(false);
    }
  }, [detector, calculateAngle]);

  // Add new angle manually
  const addNewAngle = () => {
    if (newAngleName && newAngleValue) {
      const value = parseFloat(newAngleValue);
      if (!isNaN(value)) {
        setAnalyzedAngles(prev => ({
          ...prev,
          [newAngleName]: value
        }));
        setNewAngleName('');
        setNewAngleValue('');
      }
    }
  };

  // Edit existing angle
  const editAngle = (angleName: string, newValue: string) => {
    const value = parseFloat(newValue);
    if (!isNaN(value)) {
      setAnalyzedAngles(prev => ({
        ...prev,
        [angleName]: value
      }));
      setEditingAngle(null);
    }
  };

  // Delete angle
  const deleteAngle = (angleName: string) => {
    setAnalyzedAngles(prev => {
      const newAngles = { ...prev };
      delete newAngles[angleName];
      return newAngles;
    });
    setKeyAngles(prev => {
      const newKeyAngles = new Set(prev);
      newKeyAngles.delete(angleName);
      return newKeyAngles;
    });
  };

  // Save custom pose to slot
  const saveCustomPose = useCallback(async () => {
    if (!uploadedImage) {
      alert('Please upload an image first!');
      return;
    }

    const finalPoseName = poseName.trim() || `Shifu Says Pose ${selectedSlot}`;
    
    const customPose: CustomPose = {
      id: selectedSlot,
      name: finalPoseName,
      imageUrl: uploadedImage,
      angles: { ...analyzedAngles },
      heights: { ...analyzedHeights },
      measurements: { ...analyzedMeasurements },
      keyAngles: Array.from(keyAngles),
      timestamp: new Date().toISOString()
    };

    const updatedPoses = {
      ...customPoses,
      [selectedSlot]: customPose
    };

    setCustomPoses(updatedPoses);
    
    // Save to localStorage
    localStorage.setItem('shifuSaysCustomPoses', JSON.stringify(updatedPoses));
    
    // Also save to database via API
    try {
      const response = await fetch(`/api/shifu-says/poses/1/${selectedSlot}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(customPose),
      });
      
      if (response.ok) {
        console.log('Saved custom pose to database:', customPose);
        alert(`✅ Saved "${finalPoseName}" successfully!`);
      } else {
        console.error('Failed to save to database');
        alert(`✅ Saved "${finalPoseName}" locally! (Database save failed)`);
      }
    } catch (error) {
      console.error('Error saving to database:', error);
      alert(`✅ Saved "${finalPoseName}" locally!`);
    }
  }, [selectedSlot, poseName, uploadedImage, analyzedAngles, analyzedHeights, analyzedMeasurements, keyAngles, customPoses]);

  // Load custom pose from slot
  const loadCustomPose = useCallback((slotId: number) => {
    const pose = customPoses[slotId];
    if (pose) {
      setUploadedImage(pose.imageUrl);
      setAnalyzedAngles(pose.angles);
      setAnalyzedHeights(pose.heights);
      setAnalyzedMeasurements(pose.measurements);
      setKeyAngles(new Set(pose.keyAngles));
      setSelectedSlot(slotId);
      setPoseName(pose.name);
    }
  }, [customPoses]);

  return (
    <>
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div 
          className="bg-gray-900 rounded-2xl p-6 w-full max-w-6xl max-h-[95vh] overflow-y-auto border border-yellow-500/30"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-xl flex items-center justify-center">
                <Settings className="h-6 w-6 text-black" />
              </div>
              <div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 bg-clip-text text-transparent">
                  Shifu Says Pose Creator
                </h2>
                <p className="text-gray-400 text-lg">Upload images, analyze poses, and create custom challenges</p>
              </div>
            </div>
            {onClose && (
              <Button 
                variant="ghost" 
                onClick={onClose} 
                className="text-gray-400 hover:text-white hover:bg-red-500/20 rounded-xl p-3"
              >
                <X className="h-5 w-5" />
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Controls */}
            <div className="space-y-4">
              {/* Pose Slot Selection */}
              <div className="bg-gradient-to-br from-gray-800/60 to-gray-800/40 rounded-xl p-4 border border-yellow-500/20">
                <label className="block text-yellow-300 font-bold mb-3 text-sm">🎯 Pose Slot</label>
                <select 
                  value={selectedSlot} 
                  onChange={(e) => setSelectedSlot(Number(e.target.value))}
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm mb-3"
                >
                  {[1,2,3,4,5,6,7,8,9,10].map(slot => (
                    <option key={slot} value={slot}>
                      Pose {slot} {customPoses[slot] ? '✓' : ''}
                    </option>
                  ))}
                </select>
                
                {/* Pose Name Input */}
                <label className="block text-yellow-300 font-bold mb-2 text-sm">📝 Pose Name</label>
                <input
                  type="text"
                  value={poseName}
                  onChange={(e) => setPoseName(e.target.value)}
                  placeholder={`Shifu Says Pose ${selectedSlot}`}
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm"
                />
              </div>

              {/* Image Upload */}
              <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 rounded-xl p-4 border border-blue-500/30">
                <label className="block text-blue-300 font-bold mb-3 text-sm flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  📸 Upload Pose Image
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <Button 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm py-3"
                  disabled={analyzing}
                >
                  {analyzing ? 'Analyzing Pose...' : 'Choose Image'}
                </Button>
                {uploadedImage && (
                  <div className="mt-3 text-xs text-green-400">
                    ✅ Image analyzed - joints detected and angles calculated
                  </div>
                )}
              </div>

              {/* Add New Angle */}
              <div className="bg-gradient-to-br from-orange-900/20 to-red-900/20 rounded-xl p-4 border border-orange-500/30">
                <label className="block text-orange-300 font-bold mb-3 text-sm flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  ➕ Add Custom Angle
                </label>
                <input
                  type="text"
                  value={newAngleName}
                  onChange={(e) => setNewAngleName(e.target.value)}
                  placeholder="Angle name (e.g., customShoulderAngle)"
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm mb-2"
                />
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={newAngleValue}
                    onChange={(e) => setNewAngleValue(e.target.value)}
                    placeholder="Degrees"
                    className="flex-1 bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm"
                  />
                  <Button
                    onClick={addNewAngle}
                    size="sm"
                    className="bg-orange-600 hover:bg-orange-700"
                    disabled={!newAngleName || !newAngleValue}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button 
                  onClick={saveCustomPose}
                  className="w-full bg-gradient-to-r from-yellow-500 via-amber-500 to-yellow-600 hover:from-yellow-600 hover:via-amber-600 hover:to-yellow-700 text-black font-bold text-sm py-3 rounded-lg"
                  disabled={!uploadedImage}
                >
                  <Save className="h-4 w-4 mr-2" />
                  💾 Save "{poseName || `Pose ${selectedSlot}`}"
                </Button>
              </div>

              {/* Quick Load */}
              <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 rounded-xl p-4 border border-purple-500/30">
                <h3 className="text-purple-300 font-bold mb-3 text-sm">Quick Load Saved Poses</h3>
                <div className="grid grid-cols-5 gap-2">
                  {[1,2,3,4,5,6,7,8,9,10].map(slot => (
                    <Button
                      key={slot}
                      size="sm"
                      variant={customPoses[slot] ? "default" : "outline"}
                      onClick={() => loadCustomPose(slot)}
                      disabled={!customPoses[slot]}
                      className="text-xs py-2 px-2 h-10"
                      title={customPoses[slot]?.name}
                    >
                      {slot}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Middle Column - Image Display with Keypoints */}
            <div>
              <div className="bg-gradient-to-br from-gray-800/60 to-gray-800/40 rounded-xl p-4 border border-yellow-500/20">
                <label className="block text-yellow-300 font-bold text-sm flex items-center gap-2 mb-3">
                  📷 Pose Image with Joints
                </label>
                
                <div className="border border-gray-600 rounded-lg overflow-hidden bg-gray-800 aspect-square flex items-center justify-center">
                  {uploadedImage ? (
                    <canvas 
                      ref={canvasRef}
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <div className="text-gray-500 text-center p-8">
                      <Upload className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <p>Upload an image to see joints and angles</p>
                    </div>
                  )}
                </div>
                
                {uploadedImage && (
                  <div className="mt-3 text-xs text-gray-400 text-center">
                    🟡 Yellow dots = detected joints • 🔴 Red lines = angle connections
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Angles Table */}
            <div className="space-y-4">
              {/* Joint Angles Table */}
              {Object.keys(analyzedAngles).length > 0 && (
                <div className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 rounded-xl p-4 border border-green-500/30">
                  <h3 className="text-green-300 font-bold mb-3 text-sm flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    🎯 Joint Angles Table
                  </h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {Object.entries(analyzedAngles).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                        <div className="flex-1">
                          <span className="text-white font-medium text-sm block">{key.replace(/([A-Z])/g, ' $1')}</span>
                          {editingAngle === key ? (
                            <input
                              type="number"
                              defaultValue={value.toFixed(1)}
                              onBlur={(e) => editAngle(key, e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && editAngle(key, (e.target as HTMLInputElement).value)}
                              className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs w-20 mt-1"
                              autoFocus
                            />
                          ) : (
                            <div className="text-green-300 font-mono text-sm">{value.toFixed(1)}°</div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {/* Key Angle Checkbox */}
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 text-yellow-500 rounded"
                            checked={keyAngles.has(key)}
                            onChange={(e) => {
                              const newKeyAngles = new Set(keyAngles);
                              if (e.target.checked) {
                                newKeyAngles.add(key);
                              } else {
                                newKeyAngles.delete(key);
                              }
                              setKeyAngles(newKeyAngles);
                            }}
                            title="Mark as key angle"
                          />
                          {keyAngles.has(key) && <span className="text-yellow-400 text-xs">⭐</span>}
                          
                          {/* Edit Button */}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingAngle(editingAngle === key ? null : key)}
                            className="h-6 w-6 p-1 text-blue-400 hover:bg-blue-400/20"
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          
                          {/* Delete Button */}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteAngle(key)}
                            className="h-6 w-6 p-1 text-red-400 hover:bg-red-400/20"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Legend */}
                  <div className="mt-3 text-xs text-gray-400 space-y-1">
                    <div className="flex items-center gap-2">
                      <input type="checkbox" className="w-3 h-3" checked readOnly />
                      <span>⭐ = Key angle (important for pose matching)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Edit2 className="h-3 w-3 text-blue-400" />
                      <span>= Edit angle value</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Trash2 className="h-3 w-3 text-red-400" />
                      <span>= Delete angle</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Heights & Measurements */}
              <div className="grid grid-cols-1 gap-3">
                {Object.keys(analyzedHeights).length > 0 && (
                  <div className="bg-blue-900/20 rounded-xl p-3 border border-blue-500/30">
                    <strong className="text-blue-400 text-xs flex items-center gap-2 mb-2">
                      📏 Heights
                    </strong>
                    <div className="space-y-1">
                      {Object.entries(analyzedHeights).map(([key, value]) => (
                        <div key={key} className="flex justify-between text-xs">
                          <span className="text-gray-300">{key.replace(/([A-Z])/g, ' $1')}</span>
                          <span className="font-mono text-blue-300">{value.toFixed(1)}px</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {Object.keys(analyzedMeasurements).length > 0 && (
                  <div className="bg-purple-900/20 rounded-xl p-3 border border-purple-500/30">
                    <strong className="text-purple-400 text-xs flex items-center gap-2 mb-2">
                      📐 Measurements
                    </strong>
                    <div className="space-y-1">
                      {Object.entries(analyzedMeasurements).map(([key, value]) => (
                        <div key={key} className="flex justify-between text-xs">
                          <span className="text-gray-300">{key.replace(/([A-Z])/g, ' $1')}</span>
                          <span className="font-mono text-purple-300">{value.toFixed(1)}px</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Instructions */}
              {Object.keys(analyzedAngles).length === 0 && !analyzing && (
                <div className="bg-gray-800/40 rounded-xl p-4 border border-gray-600/30">
                  <h3 className="text-gray-300 font-bold mb-2 text-sm">📋 Instructions</h3>
                  <div className="text-gray-400 text-xs space-y-2">
                    <p>1. Select a pose slot (1-10) and name your pose</p>
                    <p>2. Upload a clear martial arts pose image</p>
                    <p>3. Review detected joints and calculated angles</p>
                    <p>4. Add missing angles manually if needed</p>
                    <p>5. Mark important angles as "key" with ⭐</p>
                    <p>6. Edit angle values by clicking the edit button</p>
                    <p>7. Save your custom pose</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default PoseAnalyzer; 