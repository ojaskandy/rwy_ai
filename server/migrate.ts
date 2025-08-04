import 'dotenv/config';
import { supabase } from "./db";

// Define the migrations to run
async function runMigrations() {
  try {
    console.log("Running migrations...");

    // Add lastPracticeDate, recordingsCount, goal, goalDueDate, createdAt to users table
    await supabase.rpc('exec_sql', {
      sql_query: `
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS last_practice_date TIMESTAMP,
        ADD COLUMN IF NOT EXISTS recordings_count INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS goal TEXT DEFAULT '',
        ADD COLUMN IF NOT EXISTS goal_due_date TIMESTAMP,
        ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW(),
        ADD COLUMN IF NOT EXISTS belt TEXT DEFAULT 'white',
        ADD COLUMN IF NOT EXISTS belt_name TEXT DEFAULT 'White Belt',
        ADD COLUMN IF NOT EXISTS belt_level INTEGER DEFAULT 1,
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW()
      `
    });
    console.log("Updated users table");

    // Create userProfiles table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS user_profiles (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        goal TEXT,
        goal_due_date TIMESTAMP,
        profile_image_url TEXT,
        gallery_images JSONB DEFAULT '[]'
      )
    `);
    console.log("Created user_profiles table");

    // Create recordings table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS recordings (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        title TEXT DEFAULT 'Untitled Recording',
        file_url TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        notes TEXT
      )
    `);
    console.log("Created recordings table");
    
    // Create reference_moves table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS reference_moves (
        id SERIAL PRIMARY KEY,
        move_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        image_url TEXT NOT NULL,
        joint_angles JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log("Created reference_moves table");

    // Create shifusays_references table for Shifu Says challenge
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS shifusays_references (
        id SERIAL PRIMARY KEY,
        pose_name VARCHAR(50) NOT NULL UNIQUE,
        display_name VARCHAR(100) NOT NULL,
        reference_data JSONB NOT NULL,
        required_keypoints TEXT[] NOT NULL,
        min_confidence DECIMAL(3,2) NOT NULL DEFAULT 0.6,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("Created shifusays_references table");

    // Create index for fast pose lookup
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_shifusays_references_name ON shifusays_references(pose_name)
    `);
    console.log("Created shifusays_references index");

    // Create shifu_says_custom_poses table for user custom poses (10 slots per user)
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS shifu_says_custom_poses (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        pose_slot INTEGER NOT NULL CHECK (pose_slot >= 1 AND pose_slot <= 10),
        pose_name VARCHAR(100) NOT NULL,
        joint_data JSONB NOT NULL,
        angle_data JSONB NOT NULL,
        height_data JSONB NOT NULL,
        measurement_data JSONB NOT NULL,
        key_angles TEXT[] NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, pose_slot)
      )
    `);
    console.log("Created shifu_says_custom_poses table");

    // Create shifu_logs table for daily goals and streak tracking
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS shifu_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) NOT NULL,
        date TIMESTAMP NOT NULL,
        daily_goal TEXT NOT NULL,
        goal_category VARCHAR(50) NOT NULL,
        target_accuracy INTEGER,
        completed BOOLEAN DEFAULT FALSE,
        actual_accuracy INTEGER,
        session_started BOOLEAN DEFAULT FALSE,
        current_streak INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("Created shifu_logs table");

    // Create index for shifu_logs performance
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_shifu_logs_user_date ON shifu_logs(user_id, date)
    `);
    console.log("Created shifu_logs index");

    // Create indexes for custom poses
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_custom_poses_user ON shifu_says_custom_poses(user_id)
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_custom_poses_slot ON shifu_says_custom_poses(user_id, pose_slot)
    `);
    console.log("Created custom poses indexes");

    // Insert default pose references for all 10 martial arts poses
    await db.execute(sql`
      INSERT INTO shifusays_references (pose_name, display_name, reference_data, required_keypoints, min_confidence) 
      VALUES 
      ('front_kick', 'Front Kick', '{"keyAngles":{"leftKneeAngle":45,"rightKneeAngle":160,"leftAnkleHeight":-100,"rightAnkleHeight":50,"stanceWidth":30},"tolerances":{"angleTolerance":30,"heightTolerance":40,"stanceTolerance":20}}', ARRAY['left_hip','right_hip','left_knee','right_knee','left_ankle','right_ankle'], 0.6),
      ('side_kick', 'Side Kick', '{"keyAngles":{"leftKneeAngle":90,"rightKneeAngle":160,"leftAnkleHeight":-80,"rightAnkleHeight":50,"stanceWidth":80},"tolerances":{"angleTolerance":25,"heightTolerance":35,"stanceTolerance":25}}', ARRAY['left_hip','right_hip','left_knee','right_knee','left_ankle','right_ankle'], 0.6),
      ('round_kick', 'Round Kick', '{"keyAngles":{"leftKneeAngle":110,"rightKneeAngle":160,"leftAnkleHeight":-60,"rightAnkleHeight":50,"stanceWidth":70},"tolerances":{"angleTolerance":30,"heightTolerance":40,"stanceTolerance":25}}', ARRAY['left_hip','right_hip','left_knee','right_knee','left_ankle','right_ankle'], 0.6),
      ('back_kick', 'Back Kick', '{"keyAngles":{"leftKneeAngle":45,"rightKneeAngle":160,"leftAnkleHeight":-90,"rightAnkleHeight":50,"stanceWidth":40},"tolerances":{"angleTolerance":35,"heightTolerance":45,"stanceTolerance":30}}', ARRAY['left_hip','right_hip','left_knee','right_knee','left_ankle','right_ankle'], 0.6),
      ('axe_kick', 'Axe Kick', '{"keyAngles":{"leftKneeAngle":170,"rightKneeAngle":160,"leftAnkleHeight":-120,"rightAnkleHeight":50,"stanceWidth":35},"tolerances":{"angleTolerance":25,"heightTolerance":50,"stanceTolerance":25}}', ARRAY['left_hip','right_hip','left_knee','right_knee','left_ankle','right_ankle'], 0.6),
      ('fighting_stance', 'Fighting Stance', '{"keyAngles":{"leftKneeAngle":150,"rightKneeAngle":150,"leftAnkleHeight":40,"rightAnkleHeight":40,"stanceWidth":60,"leftElbowAngle":90,"rightElbowAngle":90},"tolerances":{"angleTolerance":20,"heightTolerance":25,"stanceTolerance":30}}', ARRAY['left_hip','right_hip','left_knee','right_knee','left_ankle','right_ankle','left_elbow','right_elbow'], 0.5),
      ('horse_stance', 'Horse Stance', '{"keyAngles":{"leftKneeAngle":120,"rightKneeAngle":120,"leftAnkleHeight":45,"rightAnkleHeight":45,"stanceWidth":120},"tolerances":{"angleTolerance":25,"heightTolerance":30,"stanceTolerance":40}}', ARRAY['left_hip','right_hip','left_knee','right_knee','left_ankle','right_ankle'], 0.5),
      ('high_block', 'High Block', '{"keyAngles":{"leftElbowAngle":120,"rightElbowAngle":160,"leftWristHeight":-80,"rightWristHeight":20,"leftKneeAngle":150,"rightKneeAngle":150},"tolerances":{"angleTolerance":30,"heightTolerance":40,"stanceTolerance":30}}', ARRAY['left_shoulder','right_shoulder','left_elbow','right_elbow','left_wrist','right_wrist'], 0.6),
      ('low_block', 'Low Block', '{"keyAngles":{"leftElbowAngle":140,"rightElbowAngle":160,"leftWristHeight":60,"rightWristHeight":20,"leftKneeAngle":150,"rightKneeAngle":150},"tolerances":{"angleTolerance":30,"heightTolerance":40,"stanceTolerance":30}}', ARRAY['left_shoulder','right_shoulder','left_elbow','right_elbow','left_wrist','right_wrist'], 0.6),
      ('punch', 'Punch', '{"keyAngles":{"leftElbowAngle":160,"rightElbowAngle":90,"leftWristHeight":-20,"rightWristHeight":10,"leftKneeAngle":150,"rightKneeAngle":150},"tolerances":{"angleTolerance":25,"heightTolerance":35,"stanceTolerance":30}}', ARRAY['left_shoulder','right_shoulder','left_elbow','right_elbow','left_wrist','right_wrist'], 0.6)
      ON CONFLICT (pose_name) DO NOTHING
    `);
    console.log("Inserted default pose references");

    // SUBSCRIPTION SYSTEM MIGRATION - Add premium access codes, usage tracking, and subscription management
    console.log("Running subscription system migration...");

    // Create premium codes table for special access codes
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS premium_codes (
        id SERIAL PRIMARY KEY,
        code TEXT NOT NULL UNIQUE,
        description TEXT,
        is_active BOOLEAN DEFAULT true,
        usage_limit INTEGER, -- null = unlimited, number = max uses
        used_count INTEGER DEFAULT 0,
        expires_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        created_by TEXT
      )
    `);
    console.log("Created premium_codes table");

    // Create premium code usage tracking
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS premium_code_usage (
        id SERIAL PRIMARY KEY,
        code_id INTEGER REFERENCES premium_codes(id) ON DELETE CASCADE NOT NULL,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
        used_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log("Created premium_code_usage table");

    // Create user usage tracking table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS user_usage (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
        
        -- Board usage (weekly limit: 10 saves for basic users)
        board_saves_this_week INTEGER DEFAULT 0,
        board_saves_week_start TIMESTAMP DEFAULT NOW(),
        
        -- Routine usage (weekly limit: 7 minutes for basic users)
        routine_minutes_this_week INTEGER DEFAULT 0,
        routine_week_start TIMESTAMP DEFAULT NOW(),
        
        -- Interview coach (daily limit: 3 questions for basic users)
        interview_questions_today INTEGER DEFAULT 0,
        interview_questions_date TIMESTAMP DEFAULT NOW(),
        
        -- Dress try-on (monthly limit: 10 try-ons for basic users)
        dress_tryons_this_month INTEGER DEFAULT 0,
        dress_tryons_month_start TIMESTAMP DEFAULT NOW(),
        
        last_updated TIMESTAMP DEFAULT NOW(),
        
        -- Ensure one record per user
        UNIQUE(user_id)
      )
    `);
    console.log("Created user_usage table");

    // Create subscriptions table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL UNIQUE,
        status TEXT NOT NULL, -- 'basic', 'premium', 'premium_code'
        plan_type TEXT, -- 'monthly', 'yearly', 'code'
        stripe_subscription_id TEXT,
        stripe_customer_id TEXT,
        current_period_start TIMESTAMP,
        current_period_end TIMESTAMP,
        cancel_at_period_end BOOLEAN DEFAULT false,
        premium_code_id INTEGER REFERENCES premium_codes(id),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log("Created subscriptions table");

    // Create indexes for better performance
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_premium_codes_code ON premium_codes(code)
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_premium_codes_active ON premium_codes(is_active)
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_premium_code_usage_user ON premium_code_usage(user_id)
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_premium_code_usage_code ON premium_code_usage(code_id)
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_user_usage_user ON user_usage(user_id)
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id)
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status)
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe ON subscriptions(stripe_subscription_id)
    `);
    console.log("Created subscription system indexes");

    // Initialize user_usage records for existing users
    await db.execute(sql`
      INSERT INTO user_usage (user_id)
      SELECT id FROM users
      WHERE id NOT IN (SELECT user_id FROM user_usage WHERE user_id IS NOT NULL)
    `);
    console.log("Initialized user_usage records");

    // Initialize subscriptions for existing users
    await db.execute(sql`
      INSERT INTO subscriptions (user_id, status, plan_type)
      SELECT 
        id,
        CASE 
          WHEN has_paid = true OR has_code_bypass = true THEN 'premium'
          ELSE 'basic'
        END as status,
        CASE 
          WHEN has_code_bypass = true THEN 'code'
          WHEN has_paid = true THEN 'yearly' -- assume yearly for existing paid users
          ELSE 'basic'
        END as plan_type
      FROM users
      WHERE id NOT IN (SELECT user_id FROM subscriptions WHERE user_id IS NOT NULL)
    `);
    console.log("Initialized subscription records");

    // Create some initial premium codes for testing
    await db.execute(sql`
      INSERT INTO premium_codes (code, description, is_active, usage_limit, created_by) VALUES
      ('BETA2025', 'Beta tester access for 2025', true, null, 'system'),
      ('INFLUENCER50', 'Influencer access code', true, 50, 'system'),
      ('VIP100', 'VIP access for early adopters', true, 100, 'system')
      ON CONFLICT (code) DO NOTHING
    `);
    console.log("Created initial premium codes");

    console.log("Subscription system migration completed successfully");

    console.log("Migrations completed successfully");
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  }
}

// Run the migrations
runMigrations().then(() => {
  console.log("All migrations completed");
  process.exit(0);
}).catch(err => {
  console.error("Migration script failed:", err);
  process.exit(1);
});