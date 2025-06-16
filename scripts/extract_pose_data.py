#!/usr/bin/env python3
"""
Extract pose data from MP4 video using MediaPipe

Usage:
    python extract_pose_data.py video.mp4 -o output.json
    python extract_pose_data.py video.mp4 --database
"""

import cv2
import mediapipe as mp
import numpy as np
import json
import argparse
import os
import sys
from pathlib import Path
import psycopg2
from psycopg2.extras import RealDictCursor

# MediaPipe pose detection setup
mp_drawing = mp.solutions.drawing_utils
mp_pose = mp.solutions.pose

def get_database_connection():
    """Get database connection using environment variable or default"""
    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        # Check for .env file in parent directory
        env_file = Path(__file__).parent.parent / '.env'
        if env_file.exists():
            with open(env_file) as f:
                for line in f:
                    if line.startswith('DATABASE_URL='):
                        database_url = line.strip().split('=', 1)[1].strip('"\'')
                        break
    
    if not database_url:
        raise ValueError("DATABASE_URL not found. Please set the environment variable or create a .env file.")
    
    return psycopg2.connect(database_url)

def find_or_create_video_record(cursor, video_filename):
    """Find existing video record or create a new one"""
    # Extract video name without extension for matching
    video_name = Path(video_filename).stem
    
    # Try to find existing video by name
    cursor.execute("""
        SELECT id FROM martial_arts_videos 
        WHERE name ILIKE %s OR name ILIKE %s
    """, (f"%{video_name}%", f"%{video_filename}%"))
    
    result = cursor.fetchone()
    if result:
        return result['id']
    
    # Create new video record
    cursor.execute("""
        INSERT INTO martial_arts_videos (name, description, category, difficulty, duration_seconds)
        VALUES (%s, %s, %s, %s, %s)
        RETURNING id
    """, (
        video_name,
        f"Extracted from {video_filename}",
        'taekwondo',  # default category
        'beginner',   # default difficulty
        0.0           # will be updated after processing
    ))
    
    return cursor.fetchone()['id']

def save_pose_data_to_database(video_filename, pose_data):
    """Save pose data to PostgreSQL database"""
    try:
        conn = get_database_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Find or create video record
        video_id = find_or_create_video_record(cursor, video_filename)
        print(f"Using video ID: {video_id}")
        
        # Update video duration
        duration = pose_data['video_info']['duration_seconds']
        cursor.execute("""
            UPDATE martial_arts_videos 
            SET duration_seconds = %s 
            WHERE id = %s
        """, (duration, video_id))
        
        # Clear existing pose data for this video
        cursor.execute("DELETE FROM pose_sequences WHERE video_id = %s", (video_id,))
        
        # Insert pose sequences in batches for better performance
        batch_size = 100
        frames = pose_data['frames']
        
        for i in range(0, len(frames), batch_size):
            batch = frames[i:i + batch_size]
            
            # Insert pose sequences
            sequence_values = []
            for frame in batch:
                sequence_values.append((
                    video_id,
                    frame['frame_number'],
                    frame['timestamp'],
                    frame['pose_detected'],
                    pose_data['video_info']['fps']
                ))
            
            cursor.executemany("""
                INSERT INTO pose_sequences (video_id, frame_number, timestamp_seconds, pose_detected, fps)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING id
            """, sequence_values)
            
            # Get the inserted sequence IDs
            sequence_ids = [row['id'] for row in cursor.fetchall()]
            
            # Insert keypoints for this batch
            keypoint_values = []
            for frame, sequence_id in zip(batch, sequence_ids):
                if frame['pose_detected']:
                    for keypoint in frame['keypoints']:
                        keypoint_values.append((
                            sequence_id,
                            keypoint['id'],
                            keypoint['name'],
                            keypoint['x'],
                            keypoint['y'],
                            keypoint['z'],
                            keypoint['visibility']
                        ))
            
            if keypoint_values:
                cursor.executemany("""
                    INSERT INTO pose_keypoints (sequence_id, keypoint_id, keypoint_name, x, y, z, visibility)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                """, keypoint_values)
            
            print(f"Processed batch {i//batch_size + 1}/{(len(frames) + batch_size - 1)//batch_size}")
        
        conn.commit()
        print(f"Successfully saved {len(frames)} frames to database for video ID {video_id}")
        
    except Exception as e:
        print(f"Database error: {e}")
        conn.rollback()
        raise
    finally:
        if 'conn' in locals():
            conn.close()

def extract_pose_landmarks(video_path, output_path=None, save_to_db=False):
    """Extract pose landmarks from video"""
    
    # Initialize MediaPipe Pose
    with mp_pose.Pose(
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5) as pose:
        
        # Open video file
        cap = cv2.VideoCapture(video_path)
        
        if not cap.isOpened():
            raise ValueError(f"Error opening video file: {video_path}")
        
        # Get video properties
        fps = cap.get(cv2.CAP_PROP_FPS)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        duration = total_frames / fps
        
        print(f"Processing {total_frames} frames from {video_path}")
        
        # Store results
        pose_data = {
            "video_info": {
                "filename": os.path.basename(video_path),
                "fps": fps,
                "total_frames": total_frames,
                "duration_seconds": duration
            },
            "frames": []
        }
        
        frame_count = 0
        
        while cap.isOpened():
            success, image = cap.read()
            if not success:
                break
            
            # Convert BGR to RGB
            image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            
            # Process the frame
            results = pose.process(image_rgb)
            
            # Extract landmarks
            frame_data = {
                "frame_number": frame_count,
                "timestamp": frame_count / fps,
                "pose_detected": results.pose_landmarks is not None,
                "keypoints": []
            }
            
            if results.pose_landmarks:
                # Convert landmarks to our format
                for idx, landmark in enumerate(results.pose_landmarks.landmark):
                    # MediaPipe pose landmark names
                    landmark_names = [
                        "nose", "left_eye_inner", "left_eye", "left_eye_outer",
                        "right_eye_inner", "right_eye", "right_eye_outer",
                        "left_ear", "right_ear", "mouth_left", "mouth_right",
                        "left_shoulder", "right_shoulder", "left_elbow", "right_elbow",
                        "left_wrist", "right_wrist", "left_pinky", "right_pinky",
                        "left_index", "right_index", "left_thumb", "right_thumb",
                        "left_hip", "right_hip", "left_knee", "right_knee",
                        "left_ankle", "right_ankle", "left_heel", "right_heel",
                        "left_foot_index", "right_foot_index"
                    ]
                    
                    keypoint = {
                        "id": idx,
                        "name": landmark_names[idx] if idx < len(landmark_names) else f"landmark_{idx}",
                        "x": landmark.x,
                        "y": landmark.y,
                        "z": landmark.z,
                        "visibility": landmark.visibility
                    }
                    frame_data["keypoints"].append(keypoint)
            
            pose_data["frames"].append(frame_data)
            frame_count += 1
            
            # Progress indicator
            if frame_count % 30 == 0:
                progress = (frame_count / total_frames) * 100
                print(f"Progress: {progress:.1f}% ({frame_count}/{total_frames})")
        
        cap.release()
        
        # Save results
        if save_to_db:
            save_pose_data_to_database(video_path, pose_data)
            print(f"Pose data saved to database")
        
        if output_path:
            with open(output_path, 'w') as f:
                json.dump(pose_data, f, indent=2)
            print(f"Pose data saved to {output_path}")
        
        print(f"Successfully extracted pose data for {len(pose_data['frames'])} frames")
        return pose_data

def main():
    parser = argparse.ArgumentParser(description='Extract pose data from MP4 video')
    parser.add_argument('video_path', help='Path to input MP4 video')
    parser.add_argument('-o', '--output', help='Output JSON file path')
    parser.add_argument('-d', '--database', action='store_true', 
                       help='Save to database instead of file')
    
    args = parser.parse_args()
    
    # Validate input file
    if not os.path.exists(args.video_path):
        print(f"Error: Video file '{args.video_path}' not found")
        sys.exit(1)
    
    # Set default output path if not provided and not saving to database
    if not args.output and not args.database:
        video_name = Path(args.video_path).stem
        args.output = f"{video_name}_pose_data.json"
    
    try:
        extract_pose_landmarks(
            video_path=args.video_path,
            output_path=args.output,
            save_to_db=args.database
        )
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 