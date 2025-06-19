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

def main():
    print("🥋 FAST upload for Heian Shodan (JSON approach)...")
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Load pose data
    json_file = Path(__file__).parent.parent / "client/public/pose-data/heian-shodan-full.json"
    
    with open(json_file, 'r') as f:
        data = json.load(f)

    print(f"📊 Loaded pose data: {len(data['frames'])} frames")
    
    # Insert video record
    cursor.execute("""
        INSERT INTO martial_arts_videos (name, description, category, difficulty, duration_seconds, youtube_url)
        VALUES (%s, %s, %s, %s, %s, %s)
        RETURNING id
    """, (
        "Heian Shodan",
        "First kata in the Heian series - fundamental Shotokan karate form with basic blocks, punches and stances",
        "karate",
        "beginner",
        data['video_info']['duration_seconds'],
        "/videos/karate/Heian Shodan June 17 2025.mp4"
    ))
    
    video_id = cursor.fetchone()[0]
    print(f"✅ Video inserted with ID: {video_id}")
    
    # Batch insert pose sequences
    print("🔄 Inserting pose sequences...")
    
    sequences_data = []
    for i, frame_data in enumerate(data['frames']):
        if frame_data['keypoints']:  # Only if pose detected
            sequences_data.append((
                video_id,
                i,
                frame_data['timestamp'],
                True,  # pose_detected
                data['video_info']['fps'],
                json.dumps(frame_data['keypoints'])
            ))
    
    # Batch insert all sequences
    cursor.executemany("""
        INSERT INTO pose_sequences (video_id, frame_number, timestamp_seconds, pose_detected, fps, keypoints_json)
        VALUES (%s, %s, %s, %s, %s, %s)
    """, sequences_data)
    
    conn.commit()
    print(f"✅ Inserted {len(sequences_data)} pose sequences")
    print(f"🎯 Heian Shodan successfully uploaded to database!")
    print(f"📹 Video ID: {video_id}")
    print(f"⏱️  Duration: {data['video_info']['duration_seconds']:.1f} seconds")
    print(f"🎬 Total Frames: {len(data['frames'])}")
    print(f"✨ Pose Detection: {len(sequences_data)}/{len(data['frames'])} frames")
    
    cursor.close()
    conn.close()

if __name__ == "__main__":
    main() 