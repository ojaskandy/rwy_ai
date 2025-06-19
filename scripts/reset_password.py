#!/usr/bin/env python3
import psycopg2
import os
import hashlib
import secrets
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

def simple_hash_password(password: str) -> str:
    """Create a simple hash - just for testing purposes"""
    salt = secrets.token_hex(16)
    # Simple hash for testing - not production secure
    hashed = hashlib.sha256((password + salt).encode()).hexdigest()
    return f"{hashed}.{salt}"

def main():
    new_password = "test123"  # Simple password for testing
    username = "ojaskandy"
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Hash the new password
    hashed_password = simple_hash_password(new_password)
    
    # Update user password
    cursor.execute(
        "UPDATE users SET password = %s WHERE username = %s",
        (hashed_password, username)
    )
    
    if cursor.rowcount > 0:
        conn.commit()
        print(f"✅ Password reset successful!")
        print(f"Username: {username}")
        print(f"New Password: {new_password}")
        print()
        print("🚀 You can now login with these credentials!")
    else:
        print(f"❌ User '{username}' not found")
    
    cursor.close()
    conn.close()

if __name__ == "__main__":
    main() 