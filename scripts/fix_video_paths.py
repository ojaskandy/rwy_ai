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
    
    print("🔧 UPDATING VIDEO FILE PATHS IN DATABASE...")
    
    # Map video IDs to their correct file paths
    video_path_updates = {
        1: "/videos/taekwondo/Taegeuk 1 Il Jang.mp4",
        2: "/videos/taekwondo/Taegeuk 1 Il Jang.mp4",  # Duplicate entry
        5: "/videos/taekwondo/Taegeuk 2 Ee Jang June 16 2025.mp4",
        6: "/videos/taekwondo/Taegeuk 3 Sam Jang June 16 2025.mp4",
        7: "/videos/taekwondo/Taegeuk 4 Sa Jang June 16 2025.mp4",
        8: "/videos/taekwondo/Taegeuk 5 Oh Jang June 16 2025.mp4",
        9: "/videos/taekwondo/Taegeuk 6 Yook Jang June 16 2025.mp4",
        10: "/videos/taekwondo/Taegeuk 7 Chil Jang June 16 2025.mp4",
        11: "/videos/taekwondo/Taegeuk 8 Pal Jang June 17 2025.mp4"
    }
    
    # Update each video's file path
    for video_id, file_path in video_path_updates.items():
        cursor.execute("""
            UPDATE martial_arts_videos 
            SET youtube_url = %s 
            WHERE id = %s
        """, (file_path, video_id))
        
        print(f"✅ Updated video ID {video_id}: {file_path}")
    
    # Also update thumbnail paths for Taegeuk videos
    thumbnail_updates = {
        1: "/videos/taekwondo/Taegeuk 1 Il Jang.jpg",
        2: "/videos/taekwondo/Taegeuk 1 Il Jang.jpg",
        5: "/videos/taekwondo/Taegeuk 2 Ee Jang.jpg",
        6: "/videos/taekwondo/Taegeuk 3 Sam Jang.jpg",
        7: "/videos/taekwondo/Taegeuk 4 Sa Jang.jpg",
        8: "/videos/taekwondo/Taegeuk 5 Oh Jang.jpg",
        9: "/videos/taekwondo/Taegeuk 6 Yook Jang.jpg",
        10: "/videos/taekwondo/Taegeuk 7 Chil Jang.jpg",
        11: "/videos/taekwondo/Taegeuk 8 Pal Jang.jpg"
    }
    
    for video_id, thumbnail_path in thumbnail_updates.items():
        cursor.execute("""
            UPDATE martial_arts_videos 
            SET thumbnail_url = %s 
            WHERE id = %s
        """, (thumbnail_path, video_id))
        
        print(f"🖼️  Updated thumbnail ID {video_id}: {thumbnail_path}")
    
    conn.commit()
    print(f"\n🎉 Successfully updated {len(video_path_updates)} video file paths!")
    
    # Verify the updates
    print("\n✅ VERIFICATION:")
    cursor.execute("""
        SELECT id, name, youtube_url 
        FROM martial_arts_videos 
        WHERE name LIKE '%Taegeuk%' 
        ORDER BY id
    """)
    
    for video in cursor.fetchall():
        video_id, name, url = video
        print(f"   ID {video_id}: {name} → {url}")
    
    cursor.close()
    conn.close()

if __name__ == "__main__":
    main() 