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

    # First check what columns exist in the users table
    cursor.execute("""
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'users' ORDER BY ordinal_position
    """)
    columns = cursor.fetchall()
    print('📋 Users table columns:')
    for col in columns:
        print(f'   - {col[0]}')
    
    # Check what users exist
    cursor.execute('SELECT * FROM users ORDER BY id')
    users = cursor.fetchall()

    print('\n🔍 Existing users in database:')
    if users:
        for user in users:
            print(f'   - User: {user}')
    else:
        print('   No users found in database')
        print('   You may need to register a new account first!')

    cursor.close()
    conn.close()

if __name__ == "__main__":
    main() 