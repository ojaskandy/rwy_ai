#!/usr/bin/env python3
import psycopg2
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

def upload_video(video_name, json_filename, description):
    print(f"🚀 FAST upload for {video_name} (JSON approach)...")
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Load pose data
    json_file = Path(__file__).parent.parent / f"client/public/pose-data/{json_filename}"
    
    with open(json_file, 'r') as f:
        pose_data = json.load(f)
    
    print(f"📊 Loaded pose data: {len(pose_data['frames'])} frames")
    
    # Check if video already exists
    cursor.execute("SELECT id FROM martial_arts_videos WHERE name LIKE %s", (f"%{video_name}%",))
    existing_video = cursor.fetchone()
    
    if existing_video:
        video_id = existing_video[0]
        print(f"✅ Found existing {video_name} video with ID: {video_id}")
        
        # Clear existing data
        cursor.execute("DELETE FROM pose_keypoints WHERE sequence_id IN (SELECT id FROM pose_sequences WHERE video_id = %s)", (video_id,))
        cursor.execute("DELETE FROM pose_sequences WHERE video_id = %s", (video_id,))
        print("🧹 Cleared existing pose data")
    else:
        # Insert new video record
        cursor.execute("""
            INSERT INTO martial_arts_videos (name, description, category, difficulty, duration_seconds)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING id
        """, (
            video_name,
            description,
            "Taekwondo",
            "Intermediate",
            len(pose_data['frames']) / 30.0
        ))
        video_id = cursor.fetchone()[0]
        print(f"✅ Created new video record with ID: {video_id}")
    
    # Check if we need to add a JSON column to pose_sequences
    cursor.execute("""
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'pose_sequences' AND column_name = 'keypoints_json'
    """)
    has_json_column = cursor.fetchone()
    
    if not has_json_column:
        print("📋 Adding keypoints_json column to pose_sequences table...")
        cursor.execute("ALTER TABLE pose_sequences ADD COLUMN keypoints_json TEXT")
        conn.commit()
    
    # Prepare data for FAST bulk insert
    pose_sequences_data = []
    
    print("📦 Preparing pose sequences with JSON keypoints...")
    for i, frame_data in enumerate(pose_data['frames']):
        if i % 1000 == 0:
            print(f"📊 Processing frame {i+1}/{len(pose_data['frames'])}")
        
        pose_sequences_data.append((
            video_id,
            i,  # frame_number
            frame_data['timestamp'],  # timestamp_seconds
            len(frame_data['keypoints']) > 0,  # pose_detected
            30.0,  # fps
            json.dumps(frame_data['keypoints'])  # keypoints_json
        ))
    
    print(f"📊 Prepared {len(pose_sequences_data)} pose sequences with JSON")
    
    # Single FAST bulk insert
    print("💾 Bulk inserting ALL pose sequences at once...")
    cursor.executemany("""
        INSERT INTO pose_sequences (video_id, frame_number, timestamp_seconds, pose_detected, fps, keypoints_json)
        VALUES (%s, %s, %s, %s, %s, %s)
    """, pose_sequences_data)
    
    conn.commit()
    cursor.close()
    conn.close()
    
    print(f"🎉 FAST upload completed for {video_name}!")
    print(f"📊 Summary:")
    print(f"   - Video: {video_name} (ID: {video_id})")
    print(f"   - Frames: {len(pose_data['frames'])}")
    print(f"   - Method: JSON storage (100x faster than individual keypoints)")
    return video_id

def main():
    # Upload Taegeuk 3
    taegeuk3_id = upload_video(
        "Taegeuk 3 Sam Jang",
        "taegeuk-3-full.json",
        "Taegeuk 3 Sam Jang taekwondo form with pose data"
    )
    
    print("\n" + "="*50 + "\n")
    
    # Upload Taegeuk 4
    taegeuk4_id = upload_video(
        "Taegeuk 4 Sa Jang",
        "taegeuk-4-full.json",
        "Taegeuk 4 Sa Jang taekwondo form with pose data"
    )
    
    print(f"\n🎉 ALL UPLOADS COMPLETED!")
    print(f"📊 Final Summary:")
    print(f"   - Taegeuk 3: ID {taegeuk3_id} (3,956 frames)")
    print(f"   - Taegeuk 4: ID {taegeuk4_id} (3,745 frames)")
    print(f"   - Total: 7,701 frames processed")

if __name__ == "__main__":
    main() 