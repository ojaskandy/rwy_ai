import psycopg2
import os
from pathlib import Path
import datetime

def get_db_connection():
    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        # Try to find .env file
        env_file = Path(__file__).parent.parent / '.env'
        if env_file.exists():
            with open(env_file) as f:
                for line in f:
                    if line.startswith('DATABASE_URL='):
                        database_url = line.strip().split('=', 1)[1].strip('"\'')
                    elif line.startswith('SUPABASE_DATABASE_URL='):
                         # Prioritize DATABASE_URL if found, else use SUPABASE...
                         if not database_url:
                             database_url = line.strip().split('=', 1)[1].strip('"\'')
    
    if not database_url:
        print("❌ Error: DATABASE_URL not found in environment or .env file")
        exit(1)
        
    return psycopg2.connect(database_url)

def upgrade_user(email, stripe_customer_id, stripe_subscription_id, plan_type='monthly'):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        print(f"🔍 Looking up user: {email}")
        
        # DEBUG: List tables
        cursor.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'")
        tables = cursor.fetchall()
        print("Tables in public schema:", [t[0] for t in tables])

        # DEBUG: Check profiles columns
        cursor.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'profiles'")
        print("Profiles columns:", [c[0] for c in cursor.fetchall()])

        # DEBUG: Check subscriptions columns
        cursor.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'subscriptions'")
        print("Subscriptions columns:", cursor.fetchall())

        # Try to find user in auth.users
        try:
             # Case insensitive search
             cursor.execute("SELECT id, email FROM auth.users WHERE email ILIKE %s", (email,))
             user = cursor.fetchone()
             if user:
                 user_id = user[0]
                 print(f"✅ Found user in auth.users: ID={user_id}, Email={user[1]}")
                 
                 # UPDATE profiles
                 print("🔄 Updating profiles table...")
                 # Check if profile exists
                 cursor.execute("SELECT id FROM profiles WHERE user_id = %s", (user_id,))
                 profile = cursor.fetchone()
                 if profile:
                     cursor.execute("""
                        UPDATE profiles 
                        SET has_paid = true, 
                            stripe_customer_id = %s 
                        WHERE user_id = %s
                     """, (stripe_customer_id, user_id))
                 else:
                     print("⚠️ Profile not found for user (creating one...)")
                     # Try to create profile? schema requires username/fullname... might fail
                     
                 # UPDATE subscriptions
                 print("🔄 Updating subscriptions table...")
                 # subscriptions table uses UUID user_id
                 
                 # Calculate dates
                 now = datetime.datetime.now()
                 if plan_type == 'yearly':
                     end_date = now + datetime.timedelta(days=365)
                 else:
                     end_date = now + datetime.timedelta(days=30)

                 cursor.execute("SELECT id FROM subscriptions WHERE user_id = %s", (user_id,))
                 sub = cursor.fetchone()
                 
                 if sub:
                     cursor.execute("""
                        UPDATE subscriptions 
                        SET status = 'premium',
                            plan_type = %s,
                            stripe_subscription_id = %s,
                            stripe_customer_id = %s,
                            current_period_start = %s,
                            current_period_end = %s,
                            updated_at = NOW()
                        WHERE user_id = %s
                     """, (plan_type, stripe_subscription_id, stripe_customer_id, now, end_date, user_id))
                 else:
                     cursor.execute("""
                        INSERT INTO subscriptions 
                        (user_id, status, plan_type, stripe_subscription_id, stripe_customer_id, current_period_start, current_period_end, updated_at)
                        VALUES (%s, 'premium', %s, %s, %s, %s, %s, NOW())
                     """, (user_id, plan_type, stripe_subscription_id, stripe_customer_id, now, end_date))
                 
                 conn.commit()
                 print(f"✅ Successfully upgraded {email}")
                 return True

             else:
                 print(f"❌ User not found in auth.users (searched for {email})")
                 # Debug: list some users
                 cursor.execute("SELECT email FROM auth.users LIMIT 5")
                 print("Sample users:", cursor.fetchall())
                 
        except Exception as e:
             print(f"⚠️ Error during upgrade: {e}")
             conn.rollback()

        return False
        
        # Fallback/Original logic (will fail if table missing)
        # cursor.execute("SELECT id, email FROM users WHERE email = %s", (email,))
        user = cursor.fetchone()
        
        if not user:
            print(f"❌ User not found: {email}")
            return False
            
        user_id = user[0]
        print(f"✅ Found user ID: {user_id}")
        
        # 1. Update users table
        print("🔄 Updating user payment status...")
        cursor.execute("""
            UPDATE users 
            SET has_paid = true, 
                stripe_customer_id = %s 
            WHERE id = %s
        """, (stripe_customer_id, user_id))
        
        # 2. Update subscriptions table
        print("🔄 Updating subscription record...")
        
        # Calculate dates (approximate if not provided, but we'll use the ones from the prompt for defaults in main)
        now = datetime.datetime.now()
        if plan_type == 'yearly':
            end_date = now + datetime.timedelta(days=365)
        else:
            end_date = now + datetime.timedelta(days=30)
            
        # Check if subscription exists
        cursor.execute("SELECT id FROM subscriptions WHERE user_id = %s", (user_id,))
        sub = cursor.fetchone()
        
        if sub:
            cursor.execute("""
                UPDATE subscriptions 
                SET status = 'premium',
                    plan_type = %s,
                    stripe_subscription_id = %s,
                    stripe_customer_id = %s,
                    current_period_start = %s,
                    current_period_end = %s,
                    updated_at = NOW()
                WHERE user_id = %s
            """, (plan_type, stripe_subscription_id, stripe_customer_id, now, end_date, user_id))
        else:
            cursor.execute("""
                INSERT INTO subscriptions 
                (user_id, status, plan_type, stripe_subscription_id, stripe_customer_id, current_period_start, current_period_end, updated_at)
                VALUES (%s, 'premium', %s, %s, %s, %s, %s, NOW())
            """, (user_id, plan_type, stripe_subscription_id, stripe_customer_id, now, end_date))
            
        conn.commit()
        print(f"✅ Successfully upgraded {email} to Premium ({plan_type})")
        
        cursor.close()
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        if conn:
            conn.rollback()
            conn.close()
        return False

if __name__ == "__main__":
    # Default values for the specific user mentioned
    DEFAULT_EMAIL = "lovesiempre004@gmail.com"
    DEFAULT_CUST_ID = "cus_TWdT0Lh26rWB6T"
    DEFAULT_SUB_ID = "sub_1SZaDgK7Z7V71Hbm2pqVlazA"
    
    print("--- Manual User Upgrade Tool ---")
    print("Press Enter to use defaults (for lovesiempre004@gmail.com) or type values.")
    
    email = input(f"Email [{DEFAULT_EMAIL}]: ").strip() or DEFAULT_EMAIL
    cust_id = input(f"Stripe Customer ID [{DEFAULT_CUST_ID}]: ").strip() or DEFAULT_CUST_ID
    sub_id = input(f"Stripe Subscription ID [{DEFAULT_SUB_ID}]: ").strip() or DEFAULT_SUB_ID
    
    confirm = input(f"\nUpgrade {email} to Premium? (y/n): ").lower()
    if confirm == 'y':
        upgrade_user(email, cust_id, sub_id)
    else:
        print("Cancelled.")

