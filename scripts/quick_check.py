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
    
    print("🔍 Current database status:")
    
    # Check videos
    cursor.execute("SELECT id, name, category FROM martial_arts_videos ORDER BY id")
    videos = cursor.fetchall()
    print(f"\n📹 Videos in database ({len(videos)}):")
    for video in videos:
        print(f"   - ID {video[0]}: {video[1]} ({video[2]})")
    
    # Check pose sequences count
    cursor.execute("SELECT video_id, COUNT(*) FROM pose_sequences GROUP BY video_id ORDER BY video_id")
    sequences = cursor.fetchall()
    print(f"\n📊 Pose sequences by video:")
    for seq in sequences:
        print(f"   - Video {seq[0]}: {seq[1]} sequences")
    
    # Check keypoints count  
    cursor.execute("""
        SELECT ps.video_id, COUNT(pk.*) 
        FROM pose_sequences ps 
        LEFT JOIN pose_keypoints pk ON ps.id = pk.sequence_id 
        GROUP BY ps.video_id 
        ORDER BY ps.video_id
    """)
    keypoints = cursor.fetchall()
    print(f"\n🎯 Keypoints by video:")
    for kp in keypoints:
        print(f"   - Video {kp[0]}: {kp[1]} keypoints")
    
    cursor.close()
    conn.close()

if __name__ == "__main__":
    main() 