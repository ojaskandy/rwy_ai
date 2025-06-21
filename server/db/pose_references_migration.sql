-- Migration to add pose references table for Shifu Says challenge
-- This stores the calibrated pose data permanently in the database

CREATE TABLE IF NOT EXISTS shifusays_references (
    id SERIAL PRIMARY KEY,
    pose_name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    reference_data JSONB NOT NULL, -- Stores angles, heights, measurements, tolerances
    required_keypoints TEXT[] NOT NULL, -- Array of required keypoint names
    min_confidence DECIMAL(3,2) NOT NULL DEFAULT 0.6,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for fast pose lookup
CREATE INDEX IF NOT EXISTS idx_shifusays_references_name ON shifusays_references(pose_name);

-- Create table for custom user poses (10 slots per user)
CREATE TABLE IF NOT EXISTS shifu_says_custom_poses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    pose_slot INTEGER NOT NULL CHECK (pose_slot >= 1 AND pose_slot <= 10),
    pose_name VARCHAR(100) NOT NULL,
    joint_data JSONB NOT NULL, -- Array of joint positions
    angle_data JSONB NOT NULL, -- Calculated angles
    height_data JSONB NOT NULL, -- Height measurements
    measurement_data JSONB NOT NULL, -- Other measurements
    key_angles TEXT[] NOT NULL, -- Array of important angle names
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, pose_slot)
);

-- Create indexes for custom poses
CREATE INDEX IF NOT EXISTS idx_custom_poses_user ON shifu_says_custom_poses(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_poses_slot ON shifu_says_custom_poses(user_id, pose_slot);

-- Insert default pose references for all 10 martial arts poses
INSERT INTO shifusays_references (pose_name, display_name, reference_data, required_keypoints, min_confidence) VALUES
(
    'front_kick',
    'Front Kick',
    '{
        "keyAngles": {
            "leftKneeAngle": 45,
            "rightKneeAngle": 160,
            "leftAnkleHeight": -100,
            "rightAnkleHeight": 50,
            "stanceWidth": 30
        },
        "tolerances": {
            "angleTolerance": 30,
            "heightTolerance": 40,
            "stanceTolerance": 20
        }
    }',
    ARRAY['left_hip', 'right_hip', 'left_knee', 'right_knee', 'left_ankle', 'right_ankle'],
    0.6
),
(
    'side_kick',
    'Side Kick',
    '{
        "keyAngles": {
            "leftKneeAngle": 90,
            "rightKneeAngle": 160,
            "leftAnkleHeight": -80,
            "rightAnkleHeight": 50,
            "stanceWidth": 80
        },
        "tolerances": {
            "angleTolerance": 25,
            "heightTolerance": 35,
            "stanceTolerance": 25
        }
    }',
    ARRAY['left_hip', 'right_hip', 'left_knee', 'right_knee', 'left_ankle', 'right_ankle'],
    0.6
),
(
    'round_kick',
    'Round Kick',
    '{
        "keyAngles": {
            "leftKneeAngle": 110,
            "rightKneeAngle": 160,
            "leftAnkleHeight": -60,
            "rightAnkleHeight": 50,
            "stanceWidth": 70
        },
        "tolerances": {
            "angleTolerance": 30,
            "heightTolerance": 40,
            "stanceTolerance": 25
        }
    }',
    ARRAY['left_hip', 'right_hip', 'left_knee', 'right_knee', 'left_ankle', 'right_ankle'],
    0.6
),
(
    'back_kick',
    'Back Kick',
    '{
        "keyAngles": {
            "leftKneeAngle": 45,
            "rightKneeAngle": 160,
            "leftAnkleHeight": -90,
            "rightAnkleHeight": 50,
            "stanceWidth": 40
        },
        "tolerances": {
            "angleTolerance": 35,
            "heightTolerance": 45,
            "stanceTolerance": 30
        }
    }',
    ARRAY['left_hip', 'right_hip', 'left_knee', 'right_knee', 'left_ankle', 'right_ankle'],
    0.6
),
(
    'axe_kick',
    'Axe Kick',
    '{
        "keyAngles": {
            "leftKneeAngle": 170,
            "rightKneeAngle": 160,
            "leftAnkleHeight": -120,
            "rightAnkleHeight": 50,
            "stanceWidth": 35
        },
        "tolerances": {
            "angleTolerance": 25,
            "heightTolerance": 50,
            "stanceTolerance": 25
        }
    }',
    ARRAY['left_hip', 'right_hip', 'left_knee', 'right_knee', 'left_ankle', 'right_ankle'],
    0.6
),
(
    'fighting_stance',
    'Fighting Stance',
    '{
        "keyAngles": {
            "leftKneeAngle": 150,
            "rightKneeAngle": 150,
            "leftAnkleHeight": 40,
            "rightAnkleHeight": 40,
            "stanceWidth": 60,
            "leftElbowAngle": 90,
            "rightElbowAngle": 90
        },
        "tolerances": {
            "angleTolerance": 20,
            "heightTolerance": 25,
            "stanceTolerance": 30
        }
    }',
    ARRAY['left_hip', 'right_hip', 'left_knee', 'right_knee', 'left_ankle', 'right_ankle', 'left_elbow', 'right_elbow'],
    0.5
),
(
    'horse_stance',
    'Horse Stance',
    '{
        "keyAngles": {
            "leftKneeAngle": 120,
            "rightKneeAngle": 120,
            "leftAnkleHeight": 45,
            "rightAnkleHeight": 45,
            "stanceWidth": 120
        },
        "tolerances": {
            "angleTolerance": 25,
            "heightTolerance": 30,
            "stanceTolerance": 40
        }
    }',
    ARRAY['left_hip', 'right_hip', 'left_knee', 'right_knee', 'left_ankle', 'right_ankle'],
    0.5
),
(
    'high_block',
    'High Block',
    '{
        "keyAngles": {
            "leftElbowAngle": 120,
            "rightElbowAngle": 160,
            "leftWristHeight": -80,
            "rightWristHeight": 20,
            "leftKneeAngle": 150,
            "rightKneeAngle": 150
        },
        "tolerances": {
            "angleTolerance": 30,
            "heightTolerance": 40,
            "stanceTolerance": 30
        }
    }',
    ARRAY['left_shoulder', 'right_shoulder', 'left_elbow', 'right_elbow', 'left_wrist', 'right_wrist'],
    0.6
),
(
    'low_block',
    'Low Block',
    '{
        "keyAngles": {
            "leftElbowAngle": 140,
            "rightElbowAngle": 160,
            "leftWristHeight": 60,
            "rightWristHeight": 20,
            "leftKneeAngle": 150,
            "rightKneeAngle": 150
        },
        "tolerances": {
            "angleTolerance": 30,
            "heightTolerance": 40,
            "stanceTolerance": 30
        }
    }',
    ARRAY['left_shoulder', 'right_shoulder', 'left_elbow', 'right_elbow', 'left_wrist', 'right_wrist'],
    0.6
),
(
    'punch',
    'Punch',
    '{
        "keyAngles": {
            "leftElbowAngle": 160,
            "rightElbowAngle": 90,
            "leftWristHeight": -20,
            "rightWristHeight": 10,
            "leftKneeAngle": 150,
            "rightKneeAngle": 150
        },
        "tolerances": {
            "angleTolerance": 25,
            "heightTolerance": 35,
            "stanceTolerance": 30
        }
    }',
    ARRAY['left_shoulder', 'right_shoulder', 'left_elbow', 'right_elbow', 'left_wrist', 'right_wrist'],
    0.6
); 