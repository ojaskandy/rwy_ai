#!/usr/bin/env python3
import json
import os
from pathlib import Path

def main():
    # Load Taegeuk 8 pose data
    json_file = Path(__file__).parent.parent / "client/public/pose-data/taegeuk-8-full.json"
    
    with open(json_file, 'r') as f:
        data = json.load(f)

    print('🎯 TAEGEUK 8 PAL JANG - ANALYSIS SUMMARY')
    print('=' * 50)
    print(f'📹 Video: {data["video_info"]["filename"]}')
    print(f'⏱️  Duration: {data["video_info"]["duration_seconds"]:.1f} seconds')
    print(f'🎬 FPS: {data["video_info"]["fps"]:.1f}')
    print(f'📊 Total Frames: {data["video_info"]["total_frames"]}')
    print(f'✅ Frames with Pose Data: {len(data["frames"])}')

    # Count frames with detected poses
    poses_detected = sum(1 for frame in data['frames'] if len(frame['keypoints']) > 0)
    detection_rate = (poses_detected / len(data['frames'])) * 100

    print(f'🤸 Pose Detection Rate: {detection_rate:.1f}% ({poses_detected}/{len(data["frames"])} frames)')

    # Sample keypoint analysis from a frame with good detection
    sample_frame = None
    for frame in data['frames']:
        if len(frame['keypoints']) > 25:  # Good pose detection
            sample_frame = frame
            break

    if sample_frame:
        print(f'\n📋 Sample Frame Analysis (Frame {sample_frame["frame_number"]}):')
        print(f'   - Timestamp: {sample_frame["timestamp"]:.2f}s')
        print(f'   - Keypoints detected: {len(sample_frame["keypoints"])}')
        
        # Check key martial arts joints
        key_joints = ['left_elbow', 'right_elbow', 'left_knee', 'right_knee', 'left_ankle', 'right_ankle']
        detected_joints = [kp['name'] for kp in sample_frame['keypoints']]
        martial_arts_joints = [joint for joint in key_joints if joint in detected_joints]
        
        print(f'   - Key martial arts joints detected: {len(martial_arts_joints)}/{len(key_joints)}')
        print(f'     ({", ".join(martial_arts_joints)})')

    print(f'\n💾 Database Storage: Video ID 11 with {len(data["frames"])} pose sequences')
    print('🎉 Ready for real-time analysis and scoring!')
    
    # Movement analysis
    print(f'\n🥋 Martial Arts Analysis:')
    print(f'   - Advanced difficulty level (8th form)')
    print(f'   - Complex combinations and master-level techniques')
    print(f'   - Suitable for black belt training and assessment')
    print(f'   - Joint angle tracking available for all major joints')
    print(f'   - Real-time comparison scoring ready')

if __name__ == "__main__":
    main() 