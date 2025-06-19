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
    
    cursor.execute("""
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'martial_arts_videos' ORDER BY ordinal_position
    """)
    columns = cursor.fetchall()
    print('📋 martial_arts_videos table columns:')
    for col in columns:
        print(f'   - {col[0]}')
    
    print('\n📋 pose_sequences table columns:')
    cursor.execute("""
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'pose_sequences' ORDER BY ordinal_position
    """)
    columns = cursor.fetchall()
    for col in columns:
        print(f'   - {col[0]}')
    
    cursor.close()
    conn.close()

if __name__ == "__main__":
    main() 