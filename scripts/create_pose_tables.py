#!/usr/bin/env python3
"""
Create the necessary database tables for pose data storage
"""

import os
import sys
from pathlib import Path
import psycopg2
from psycopg2.extras import RealDictCursor
import json

def get_database_connection():
    """Get database connection using environment variable"""
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

def create_tables():
    """Create the martial arts video and pose data tables"""
    
    # SQL for creating tables
    create_tables_sql = """
    -- Martial Arts Videos metadata
    CREATE TABLE IF NOT EXISTS martial_arts_videos (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(50) NOT NULL,
        difficulty VARCHAR(20) NOT NULL,
        duration_seconds DECIMAL(8,2),
        youtube_url VARCHAR(500),
        thumbnail_url VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Pre-extracted pose sequences
    CREATE TABLE IF NOT EXISTS pose_sequences (
        id SERIAL PRIMARY KEY,
        video_id INTEGER REFERENCES martial_arts_videos(id) ON DELETE CASCADE,
        frame_number INTEGER NOT NULL,
        timestamp_seconds DECIMAL(8,3) NOT NULL,
        pose_detected BOOLEAN NOT NULL DEFAULT FALSE,
        fps DECIMAL(8,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(video_id, frame_number)
    );

    -- Individual keypoints for each frame
    CREATE TABLE IF NOT EXISTS pose_keypoints (
        id SERIAL PRIMARY KEY,
        sequence_id INTEGER REFERENCES pose_sequences(id) ON DELETE CASCADE,
        keypoint_id INTEGER NOT NULL,
        keypoint_name VARCHAR(50) NOT NULL,
        x DECIMAL(10,8) NOT NULL,
        y DECIMAL(10,8) NOT NULL,
        z DECIMAL(10,8),
        visibility DECIMAL(6,4),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Indexes for performance
    CREATE INDEX IF NOT EXISTS idx_pose_sequences_video_timestamp 
    ON pose_sequences(video_id, timestamp_seconds);
    
    CREATE INDEX IF NOT EXISTS idx_pose_keypoints_sequence 
    ON pose_keypoints(sequence_id);
    
    CREATE INDEX IF NOT EXISTS idx_pose_keypoints_name 
    ON pose_keypoints(keypoint_name);
    """
    
    try:
        conn = get_database_connection()
        cursor = conn.cursor()
        
        print("Creating martial arts video and pose data tables...")
        cursor.execute(create_tables_sql)
        conn.commit()
        print("✅ Tables created successfully!")
        
        # Insert sample video if it doesn't exist
        cursor.execute("""
            INSERT INTO martial_arts_videos (name, description, category, difficulty, duration_seconds)
            SELECT 'Taegeuk 1 - Il Jang', 'First taekwondo poomsae with basic stances and blocks', 'taekwondo', 'beginner', 150
            WHERE NOT EXISTS (
                SELECT 1 FROM martial_arts_videos WHERE name ILIKE '%Taegeuk 1%'
            )
        """)
        conn.commit()
        print("✅ Sample video data added!")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"❌ Error creating tables: {e}")
        sys.exit(1)

def upload_pose_data():
    conn = get_database_connection()
    cursor = conn.cursor()
    
    # Load the JSON data we already extracted
    json_file = Path(__file__).parent.parent / "client/public/pose-data/taegeuk-1-full.json"
    
    with open(json_file, 'r') as f:
        pose_data = json.load(f)
    
    # Insert or update video record
    cursor.execute("""
        INSERT INTO martial_arts_videos (name, description, category, difficulty, duration_seconds)
        VALUES (%s, %s, %s, %s, %s)
        ON CONFLICT DO NOTHING
        RETURNING id;
    """, (
        "Taegeuk 1 - Il Jang",
        "First taekwondo poomsae with basic stances and blocks",
        "taekwondo",
        "beginner",
        pose_data['video_info']['duration_seconds']
    ))
    
    result = cursor.fetchone()
    if result:
        video_id = result[0]
    else:
        # Get existing video ID
        cursor.execute("SELECT id FROM martial_arts_videos WHERE name LIKE %s", ("%Taegeuk 1%",))
        video_id = cursor.fetchone()[0]
    
    print(f"Using video ID: {video_id}")
    
    # Clear existing pose data
    cursor.execute("DELETE FROM pose_sequences WHERE video_id = %s", (video_id,))
    
    # Insert pose sequences and keypoints in batches
    frames = pose_data['frames']
    batch_size = 100
    
    for i in range(0, len(frames), batch_size):
        batch = frames[i:i + batch_size]
        
        # Insert sequences
        for frame in batch:
            cursor.execute("""
                INSERT INTO pose_sequences (video_id, frame_number, timestamp_seconds, pose_detected, fps)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING id;
            """, (
                video_id,
                frame['frame_number'],
                frame['timestamp'],
                frame['pose_detected'],
                pose_data['video_info']['fps']
            ))
            
            sequence_id = cursor.fetchone()[0]
            
            # Insert keypoints for this frame
            if frame['pose_detected'] and frame['keypoints']:
                keypoint_values = []
                for kp in frame['keypoints']:
                    keypoint_values.append((
                        sequence_id, kp['id'], kp['name'], 
                        kp['x'], kp['y'], kp['z'], kp['visibility']
                    ))
                
                cursor.executemany("""
                    INSERT INTO pose_keypoints (sequence_id, keypoint_id, keypoint_name, x, y, z, visibility)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                """, keypoint_values)
        
        print(f"✅ Uploaded batch {i//batch_size + 1}/{(len(frames) + batch_size - 1)//batch_size}")
        conn.commit()
    
    cursor.close()
    conn.close()
    print(f"🎉 Successfully uploaded {len(frames)} frames to database!")

if __name__ == "__main__":
    print("Creating database tables...")
    create_tables()
    
    print("Uploading pose data...")
    upload_pose_data()
    
    print("Done! ✨") 