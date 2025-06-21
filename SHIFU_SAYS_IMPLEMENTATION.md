# Shifu Says Custom Pose System Implementation

## Overview
The Shifu Says custom pose system allows users to create, save, and manage up to 10 custom martial arts poses for the Shifu Says challenge. This system supports both manual pose creation through an interactive skeleton editor and automatic pose detection through image analysis.

## Features Implemented

### 1. Interactive Pose Creator (`PoseAnalyzer.tsx`)

#### Dual Mode Interface
- **Manual Pose Editor**: Interactive skeleton with draggable joints
- **Image Analysis**: Upload reference images for automatic pose detection

#### Pose Slot Management
- 10 numbered pose slots (Pose 1 through Pose 10)
- Quick load buttons for saved poses
- Slot indicator showing which poses are saved (✓)

#### Manual Skeleton Editor
- 17 interactive joints with color coding
- Real-time joint angle calculations
- Draggable joints with grid precision
- Visual feedback for selected joints

#### Image Analysis
- Upload any martial arts reference image
- Automatic pose detection using TensorFlow.js MoveNet
- Converts detected keypoints to skeleton format
- Allows refinement after automatic detection

#### Key Angles Selection
- Checkbox interface to mark important angles for each pose
- Real-time angle calculations displayed
- Helps identify critical measurements for pose matching

#### Data Export
- Export all poses to JSON format
- Timestamped backup files
- Comprehensive pose data preservation

### 2. Database Integration

#### Custom Poses Table (`shifu_says_custom_poses`)
```sql
CREATE TABLE shifu_says_custom_poses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    pose_slot INTEGER NOT NULL CHECK (pose_slot >= 1 AND pose_slot <= 10),
    pose_name VARCHAR(100) NOT NULL,
    joint_data JSONB NOT NULL,     -- Array of joint positions
    angle_data JSONB NOT NULL,     -- Calculated angles
    height_data JSONB NOT NULL,    -- Height measurements
    measurement_data JSONB NOT NULL, -- Other measurements
    key_angles TEXT[] NOT NULL,    -- Array of important angle names
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, pose_slot)
);
```

#### API Endpoints (`/server/routes/shifuSaysPoses.ts`)
- `GET /api/shifu-says/poses/:userId` - Get all custom poses for a user
- `POST /api/shifu-says/poses/:userId/:slot` - Save pose to specific slot
- `DELETE /api/shifu-says/poses/:userId/:slot` - Delete pose from slot
- `GET /api/shifu-says/export/:userId` - Export all poses as JSON

### 3. Pose Data Structure

#### Custom Pose Object
```typescript
interface CustomPose {
  id: number;                              // Pose slot (1-10)
  name: string;                           // Display name
  joints: Joint[];                        // Array of joint positions
  angles: Record<string, number>;         // Calculated joint angles
  heights: Record<string, number>;        // Height measurements
  measurements: Record<string, number>;   // Distance measurements
  keyAngles: string[];                    // Important angles for matching
  timestamp: string;                      // Creation/update time
}
```

#### Joint Structure
```typescript
interface Joint {
  id: string;           // Unique identifier
  name: string;         // Joint name (e.g., 'left_knee')
  x: number;           // X coordinate
  y: number;           // Y coordinate
  color: string;       // Display color
  connections: string[]; // Connected joints for skeleton lines
}
```

### 4. Calculated Measurements

#### Joint Angles (Degrees)
- `leftKneeAngle` - Angle between hip, knee, ankle
- `rightKneeAngle` - Right leg knee angle
- `leftElbowAngle` - Angle between shoulder, elbow, wrist
- `rightElbowAngle` - Right arm elbow angle
- `leftHipAngle` - Angle between shoulder, hip, knee
- `rightHipAngle` - Right hip angle
- `shoulderAngle` - Angle between shoulders and nose

#### Height Measurements (Pixels)
- `leftAnkleHeight` - Left ankle relative to hip level
- `rightAnkleHeight` - Right ankle relative to hip level
- `leftWristHeight` - Left wrist relative to shoulder level
- `rightWristHeight` - Right wrist relative to shoulder level
- `leftKneeHeight` - Left knee relative to hip level
- `rightKneeHeight` - Right knee relative to hip level

#### Distance Measurements (Pixels)
- `stanceWidth` - Distance between ankles
- `shoulderWidth` - Distance between shoulders
- `torsoLength` - Distance between shoulder and hip levels

### 5. Precision Features

#### Vector Math Calculations
- Precise angle calculations using dot product
- Normalized vector calculations
- Clamped cosine values for stability

#### Real-time Updates
- Live calculations as joints are moved
- Immediate visual feedback
- Dynamic measurement displays

#### Key Angle Selection
- User-selectable important angles
- Pose-specific measurement priorities
- Optimized matching criteria

### 6. User Experience

#### Visual Design
- Golden theme matching Shifu Says branding
- Responsive layout with proper spacing
- Color-coded data displays (green for angles, blue for heights, purple for measurements)
- Professional gradient backgrounds

#### Intuitive Controls
- Mode toggle between manual and image analysis
- Pose slot dropdown with visual indicators
- One-click pose loading
- Clear action buttons with icons

#### Error Handling
- Graceful fallbacks for failed image analysis
- Local storage backup for poses
- Database sync with offline capability

## Usage Instructions

### Creating a Custom Pose

1. **Access the Creator**
   - Navigate to Shifu Says challenge page
   - Click "Calibrate Poses" button (development mode only)

2. **Choose Creation Method**
   - **Manual**: Use interactive skeleton editor
   - **Image**: Upload reference image for analysis

3. **Manual Pose Creation**
   - Drag joints to desired positions
   - Watch real-time angle calculations
   - Mark important angles with checkboxes

4. **Image Analysis**
   - Click "Choose Image" in Image Analysis mode
   - Upload clear martial arts pose image
   - System automatically detects and positions joints
   - Refine positions manually if needed

5. **Save the Pose**
   - Select pose slot (1-10) from dropdown
   - Click "Save to Slot X" button
   - Pose saved to both local storage and database

### Managing Saved Poses

1. **Loading Poses**
   - Use Quick Load buttons to load saved poses
   - Poses instantly populate the skeleton editor

2. **Exporting Poses**
   - Click "Export All Poses" to download JSON backup
   - Contains all pose data with timestamps

3. **Overwriting Poses**
   - Select occupied slot and save new pose
   - System confirms overwrite operation

## Technical Implementation

### Dependencies
- `@tensorflow/tfjs` - Core TensorFlow.js functionality
- `@tensorflow-models/pose-detection` - Pose detection models
- `@tensorflow/tfjs-backend-webgl` - WebGL acceleration
- `framer-motion` - Smooth animations
- `lucide-react` - Icons

### Database Schema
- User-specific pose storage with 10 slots per user
- JSONB storage for efficient pose data handling
- Indexes for fast user and slot lookups
- Automatic timestamps and unique constraints

### API Integration
- RESTful API design
- JSON payload handling
- Error handling and validation
- Database transaction safety

## Future Enhancements

### Potential Features
1. **Pose Comparison**: Visual diff between poses
2. **Pose Templates**: Pre-made pose starting points
3. **Sharing System**: Export/import poses between users
4. **Advanced Analysis**: Biomechanical feedback
5. **Pose Sequences**: Create multi-pose combinations

### Performance Optimizations
1. **WebGL Acceleration**: Faster pose detection
2. **Image Compression**: Optimize upload sizes
3. **Caching**: Local pose data caching
4. **Lazy Loading**: On-demand pose loading

This implementation provides a comprehensive foundation for custom pose creation in the Shifu Says challenge, supporting both technical users who want precise control and casual users who prefer automatic image analysis. 