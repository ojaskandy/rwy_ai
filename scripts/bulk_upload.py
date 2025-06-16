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
    print("🚀 Fast bulk upload starting...")
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Load pose data
    json_file = Path(__file__).parent.parent / "client/public/pose-data/taegeuk-1-full.json"
    with open(json_file, 'r') as f:
        pose_data = json.load(f)
    
    print(f"📊 Loaded {len(pose_data['frames'])} frames")
    
    # Check if video exists
    cursor.execute("SELECT id FROM martial_arts_videos WHERE name = %s", ("Taegeuk 1 - Il Jang",))
    result = cursor.fetchone()
    
    if result:
        video_id = result[0]
        print(f"📹 Found existing video ID: {video_id}")
    else:
        # Create new video
        cursor.execute("""
            INSERT INTO martial_arts_videos (name, description, category, difficulty, duration_seconds)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING id;
        """, (
            "Taegeuk 1 - Il Jang",
            "First taekwondo poomsae with basic stances and blocks", 
            "taekwondo",
            "beginner",
            pose_data['video_info']['duration_seconds']
        ))
        video_id = cursor.fetchone()[0]
        print(f"📹 Created new video ID: {video_id}")
    
    # Clear existing data
    cursor.execute("DELETE FROM pose_sequences WHERE video_id = %s", (video_id,))
    
    # Bulk insert sequences
    sequence_data = []
    
    for frame in pose_data['frames']:
        sequence_data.append((
            video_id,
            frame['frame_number'], 
            frame['timestamp'],
            frame['pose_detected'],
            pose_data['video_info']['fps']
        ))
    
    print("⚡ Bulk inserting sequences...")
    psycopg2.extras.execute_values(
        cursor,
        "INSERT INTO pose_sequences (video_id, frame_number, timestamp_seconds, pose_detected, fps) VALUES %s RETURNING id",
        sequence_data,
        template=None,
        page_size=1000
    )
    
    # Get sequence IDs
    sequence_ids = [row[0] for row in cursor.fetchall()]
    
    print("⚡ Preparing keypoints...")
    # Prepare keypoints data
    keypoint_data = []
    for frame, seq_id in zip(pose_data['frames'], sequence_ids):
        if frame['pose_detected'] and frame['keypoints']:
            for kp in frame['keypoints']:
                keypoint_data.append((
                    seq_id, kp['id'], kp['name'],
                    kp['x'], kp['y'], kp['z'], kp['visibility']
                ))
    
    print(f"⚡ Bulk inserting {len(keypoint_data)} keypoints...")
    psycopg2.extras.execute_values(
        cursor,
        "INSERT INTO pose_keypoints (sequence_id, keypoint_id, keypoint_name, x, y, z, visibility) VALUES %s",
        keypoint_data,
        template=None,
        page_size=5000
    )
    
    conn.commit()
    cursor.close()
    conn.close()
    
    print("🎉 DONE! All data uploaded successfully!")
    print(f"📈 Uploaded {len(sequence_data)} frames and {len(keypoint_data)} keypoints")

if __name__ == "__main__":
    main() 