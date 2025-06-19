#!/usr/bin/env python3
import psycopg2
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
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Check all videos in database
    print("🔍 VIDEOS IN DATABASE:")
    cursor.execute("""
        SELECT id, name, category, youtube_url 
        FROM martial_arts_videos 
        ORDER BY id
    """)
    
    videos = cursor.fetchall()
    for video in videos:
        video_id, name, category, url = video
        print(f"   ID {video_id}: {name} ({category}) - {url}")
        
        # Check pose sequences count for each video
        cursor.execute("""
            SELECT COUNT(*) FROM pose_sequences WHERE video_id = %s
        """, (video_id,))
        pose_count = cursor.fetchone()[0]
        print(f"      └── {pose_count} pose sequences")
    
    print(f"\n📊 TOTAL: {len(videos)} videos in database")
    
    # Check specifically for Taegeuk videos
    print("\n🥋 TAEGEUK VIDEOS:")
    cursor.execute("""
        SELECT id, name, youtube_url 
        FROM martial_arts_videos 
        WHERE name LIKE '%Taegeuk%' 
        ORDER BY id
    """)
    
    taegeuk_videos = cursor.fetchall()
    for video in taegeuk_videos:
        video_id, name, url = video
        cursor.execute("SELECT COUNT(*) FROM pose_sequences WHERE video_id = %s", (video_id,))
        pose_count = cursor.fetchone()[0]
        print(f"   ID {video_id}: {name}")
        print(f"      └── File: {url}")
        print(f"      └── Poses: {pose_count}")
    
    cursor.close()
    conn.close()

if __name__ == "__main__":
    main() 