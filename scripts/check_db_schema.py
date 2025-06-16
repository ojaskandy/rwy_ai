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
    
    print("🔍 Checking database schema...")
    
    # List all tables
    cursor.execute("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name;
    """)
    tables = cursor.fetchall()
    
    print("\n📋 Available tables:")
    for table in tables:
        print(f"   - {table[0]}")
    
    # Check if martial_arts_videos table exists
    table_names = [table[0] for table in tables]
    if 'martial_arts_videos' in table_names:
        print(f"\n📊 martial_arts_videos table structure:")
        cursor.execute("""
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'martial_arts_videos'
            ORDER BY ordinal_position;
        """)
        columns = cursor.fetchall()
        for col in columns:
            print(f"   - {col[0]} ({col[1]}) {'NULL' if col[2] == 'YES' else 'NOT NULL'}")
    else:
        print("\n❌ martial_arts_videos table does not exist")
        
    # Check pose_sequences table if it exists
    if 'pose_sequences' in table_names:
        print(f"\n📊 pose_sequences table structure:")
        cursor.execute("""
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'pose_sequences'
            ORDER BY ordinal_position;
        """)
        columns = cursor.fetchall()
        for col in columns:
            print(f"   - {col[0]} ({col[1]}) {'NULL' if col[2] == 'YES' else 'NOT NULL'}")
    else:
        print("\n❌ pose_sequences table does not exist")
        
    # Check pose_keypoints table if it exists  
    if 'pose_keypoints' in table_names:
        print(f"\n📊 pose_keypoints table structure:")
        cursor.execute("""
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'pose_keypoints'
            ORDER BY ordinal_position;
        """)
        columns = cursor.fetchall()
        for col in columns:
            print(f"   - {col[0]} ({col[1]}) {'NULL' if col[2] == 'YES' else 'NOT NULL'}")
    else:
        print("\n❌ pose_keypoints table does not exist")
    
    cursor.close()
    conn.close()

if __name__ == "__main__":
    main() 