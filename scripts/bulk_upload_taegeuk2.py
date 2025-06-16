#!/usr/bin/env python3
import psycopg2
import psycopg2.extras
import json
import os
from pathlib import Path

def get_db_connection():
    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        env_file = Path(__file__).parent.parent / '.env'
        if env_file.exists():
            with open(env_file) as f:
                for line in f:
                    if line.startswith('DATABASE_URL='):
                        database_url = line.strip().split('=', 1)[1].strip('"\'')
                        break
    return psycopg2.connect(database_url)

def main():
    print("🚀 Fast bulk upload starting for Taegeuk 2...")
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Load pose data
    json_file = Path(__file__).parent.parent / "client/public/pose-data/taegeuk-2-full.json"
    
    with open(json_file, 'r') as f:
        pose_data = json.load(f)
    
    print(f"📊 Loaded pose data: {len(pose_data['frames'])} frames")
    
    # Check if Taegeuk 2 video already exists (using correct column name 'name')
    cursor.execute("SELECT id FROM martial_arts_videos WHERE name = %s", ("Taegeuk 2 Ee Jang",))
    existing_video = cursor.fetchone()
    
    if existing_video:
        video_id = existing_video[0]
        print(f"✅ Found existing Taegeuk 2 video with ID: {video_id}")
        
        # Clear existing pose data for this video
        cursor.execute("DELETE FROM pose_keypoints WHERE sequence_id IN (SELECT id FROM pose_sequences WHERE video_id = %s)", (video_id,))
        cursor.execute("DELETE FROM pose_sequences WHERE video_id = %s", (video_id,))
        print("🧹 Cleared existing pose data")
    else:
        # Insert new video record (using correct column names)
        cursor.execute("""
            INSERT INTO martial_arts_videos (name, description, category, difficulty, duration_seconds, youtube_url)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (
            "Taegeuk 2 Ee Jang",
            "Taegeuk 2 Ee Jang taekwondo form with extracted pose data",
            "Taekwondo",
            "Beginner",
            len(pose_data['frames']) / 30.0,  # Assuming 30 FPS
            None  # No YouTube URL for local video
        ))
        video_id = cursor.fetchone()[0]
        print(f"✅ Created new video record with ID: {video_id}")
    
    # Prepare batch data
    pose_sequences_data = []
    
    print("📦 Preparing batch data...")
    for i, frame_data in enumerate(pose_data['frames']):
        if i % 500 == 0:
            print(f"📊 Processing frame {i+1}/{len(pose_data['frames'])}")
        
        timestamp = frame_data['timestamp']
        
        # Prepare pose sequence data (matching the actual schema)
        pose_sequences_data.append((
            video_id,
            i,  # frame_number
            timestamp,  # timestamp_seconds  
            len(frame_data['keypoints']) > 0,  # pose_detected (boolean)
            30.0  # fps
        ))
    
    print(f"📊 Prepared {len(pose_sequences_data)} pose sequences")
    
    # Bulk insert pose sequences
    print("💾 Bulk inserting pose sequences...")
    cursor.executemany("""
        INSERT INTO pose_sequences (video_id, frame_number, timestamp_seconds, pose_detected, fps)
        VALUES (%s, %s, %s, %s, %s)
    """, pose_sequences_data)
    
    # Get the inserted sequence IDs
    cursor.execute("SELECT id, frame_number FROM pose_sequences WHERE video_id = %s ORDER BY frame_number", (video_id,))
    sequence_ids = {frame_num: seq_id for seq_id, frame_num in cursor.fetchall()}
    
    # Prepare keypoints data
    pose_keypoints_data = []
    
    print("📦 Preparing keypoints data...")
    for i, frame_data in enumerate(pose_data['frames']):
        if i % 500 == 0:
            print(f"📊 Processing keypoints for frame {i+1}/{len(pose_data['frames'])}")
        
        sequence_id = sequence_ids[i]
        
        # Insert individual keypoints (matching the actual schema)
        for kp_idx, kp in enumerate(frame_data['keypoints']):
            pose_keypoints_data.append((
                sequence_id,
                kp_idx,  # keypoint_id
                kp['name'],  # keypoint_name
                kp['x'],  # x
                kp['y'],  # y
                0.0,  # z (not used in 2D pose detection)
                kp['visibility']  # visibility
            ))
    
    print(f"📊 Prepared {len(pose_keypoints_data)} keypoints")
    
    # Bulk insert keypoints in chunks
    chunk_size = 5000
    print(f"💾 Bulk inserting {len(pose_keypoints_data)} keypoints in chunks of {chunk_size}...")
    
    for i in range(0, len(pose_keypoints_data), chunk_size):
        chunk = pose_keypoints_data[i:i + chunk_size]
        cursor.executemany("""
            INSERT INTO pose_keypoints (sequence_id, keypoint_id, keypoint_name, x, y, z, visibility)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, chunk)
        print(f"💾 Inserted chunk {i//chunk_size + 1}/{(len(pose_keypoints_data) + chunk_size - 1)//chunk_size}")
    
    conn.commit()
    cursor.close()
    conn.close()
    
    print("🎉 Upload completed successfully!")
    print(f"📊 Summary:")
    print(f"   - Video: Taegeuk 2 Ee Jang (ID: {video_id})")
    print(f"   - Frames: {len(pose_data['frames'])}")
    print(f"   - Pose sequences: {len(pose_sequences_data)}")
    print(f"   - Keypoints: {len(pose_keypoints_data)}")
    print(f"   - Original file: 27.5MB → Structured database storage")

if __name__ == "__main__":
    main() 