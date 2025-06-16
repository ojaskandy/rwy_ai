#!/usr/bin/env python3

import json
import psycopg2
import os
from dotenv import load_dotenv

def main():
    print("🚀 FAST upload for Taegeuk 3 & 4 (JSON approach)...")
    
    # Load environment variables
    load_dotenv('../.env')
    
    # Database connection using DATABASE_URL
    database_url = os.getenv('DATABASE_URL')
    
    # Videos to process
    videos_to_process = [
        {
            'id': 3,
            'title': 'Taegeuk 3 (Sam Jang)',
            'pose_file': '../client/public/pose-data/taegeuk-3-full.json',
            'video_file': 'taekwondo/Taegeuk 3 Sam Jang June 16 2025.mp4'
        },
        {
            'id': 4,
            'title': 'Taegeuk 4 (Sa Jang)',
            'pose_file': '../client/public/pose-data/taegeuk-4-full.json',
            'video_file': 'taekwondo/Taegeuk 4 Sa Jang June 16 2025.mp4'
        }
    ]
    
    try:
        # Connect to PostgreSQL
        conn = psycopg2.connect(database_url)
        cur = conn.cursor()
        
        for video_info in videos_to_process:
            print(f"\n📹 Processing {video_info['title']}...")
            
            # Load pose data
            with open(video_info['pose_file'], 'r') as f:
                pose_data = json.load(f)
            
            frame_count = len(pose_data['frames'])
            print(f"📊 Loaded pose data: {frame_count} frames")
            
            # Check if video exists in martial_arts_videos
            cur.execute("SELECT id FROM martial_arts_videos WHERE id = %s", (video_info['id'],))
            if not cur.fetchone():
                # Insert video record
                cur.execute("""
                    INSERT INTO martial_arts_videos (id, title, video_path, description, difficulty_level, duration_seconds)
                    VALUES (%s, %s, %s, %s, %s, %s)
                """, (
                    video_info['id'],
                    video_info['title'],
                    video_info['video_file'],
                    f"Traditional Taekwondo form - {video_info['title']}",
                    'intermediate',
                    frame_count // 30  # Approximate duration assuming 30 FPS
                ))
                print(f"✅ Inserted new video record for {video_info['title']}")
            else:
                print(f"✅ Found existing video record for {video_info['title']}")
            
            # Check if pose sequence exists
            cur.execute("SELECT id FROM pose_sequences WHERE video_id = %s", (video_info['id'],))
            existing_sequence = cur.fetchone()
            
            if existing_sequence:
                print(f"⚠️ Pose sequence already exists for {video_info['title']}, skipping...")
                continue
            
            # Insert complete pose sequence as JSON
            print("💾 Inserting pose sequence as JSON...")
            cur.execute("""
                INSERT INTO pose_sequences (video_id, pose_data, frame_count, created_at)
                VALUES (%s, %s, %s, NOW())
            """, (
                video_info['id'],
                json.dumps(pose_data),
                frame_count
            ))
            
            print(f"✅ Successfully uploaded {video_info['title']} with {frame_count} frames")
        
        # Commit all changes
        conn.commit()
        print("\n🎉 All uploads completed successfully!")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        if 'conn' in locals():
            conn.rollback()
        raise
    finally:
        if 'cur' in locals():
            cur.close()
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    main() 