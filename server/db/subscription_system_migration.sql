-- Subscription System Migration
-- This migration adds premium access codes, usage tracking, and subscription management

-- Create premium codes table for special access codes
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
);

-- Create premium code usage tracking
CREATE TABLE IF NOT EXISTS premium_code_usage (
  id SERIAL PRIMARY KEY,
  code_id INTEGER REFERENCES premium_codes(id) ON DELETE CASCADE NOT NULL,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  used_at TIMESTAMP DEFAULT NOW()
);

-- Create user usage tracking table
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
);

-- Create subscriptions table
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
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_premium_codes_code ON premium_codes(code);
CREATE INDEX IF NOT EXISTS idx_premium_codes_active ON premium_codes(is_active);
CREATE INDEX IF NOT EXISTS idx_premium_code_usage_user ON premium_code_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_premium_code_usage_code ON premium_code_usage(code_id);
CREATE INDEX IF NOT EXISTS idx_user_usage_user ON user_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe ON subscriptions(stripe_subscription_id);

-- Initialize user_usage records for existing users
INSERT INTO user_usage (user_id)
SELECT id FROM users
WHERE id NOT IN (SELECT user_id FROM user_usage);

-- Initialize subscriptions for existing users
-- Set existing paid users to premium, others to basic
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
WHERE id NOT IN (SELECT user_id FROM subscriptions);

-- Create some initial premium codes for testing
INSERT INTO premium_codes (code, description, is_active, usage_limit, created_by) VALUES
('BETA2025', 'Beta tester access for 2025', true, null, 'system'),
('INFLUENCER50', 'Influencer access code', true, 50, 'system'),
('VIP100', 'VIP access for early adopters', true, 100, 'system')
ON CONFLICT (code) DO NOTHING;

-- Create function to reset usage counters
CREATE OR REPLACE FUNCTION reset_usage_counters()
RETURNS void AS $$
BEGIN
  -- Reset weekly counters (board saves and routine minutes)
  UPDATE user_usage 
  SET 
    board_saves_this_week = 0,
    board_saves_week_start = NOW()
  WHERE board_saves_week_start < NOW() - INTERVAL '7 days';
  
  UPDATE user_usage 
  SET 
    routine_minutes_this_week = 0,
    routine_week_start = NOW()
  WHERE routine_week_start < NOW() - INTERVAL '7 days';
  
  -- Reset daily counters (interview questions)
  UPDATE user_usage 
  SET 
    interview_questions_today = 0,
    interview_questions_date = NOW()
  WHERE DATE(interview_questions_date) < DATE(NOW());
  
  -- Reset monthly counters (dress try-ons)
  UPDATE user_usage 
  SET 
    dress_tryons_this_month = 0,
    dress_tryons_month_start = NOW()
  WHERE dress_tryons_month_start < NOW() - INTERVAL '30 days';
  
  UPDATE user_usage SET last_updated = NOW();
END;
$$ LANGUAGE plpgsql;

-- Create function to check if user has premium access
CREATE OR REPLACE FUNCTION has_premium_access(p_user_id INTEGER)
RETURNS boolean AS $$
DECLARE
  subscription_status TEXT;
  subscription_end TIMESTAMP;
BEGIN
  SELECT status, current_period_end 
  INTO subscription_status, subscription_end
  FROM subscriptions 
  WHERE user_id = p_user_id;
  
  -- If no subscription record, default to basic
  IF subscription_status IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check subscription status
  CASE subscription_status
    WHEN 'premium' THEN
      -- Check if subscription is still active
      IF subscription_end IS NULL OR subscription_end > NOW() THEN
        RETURN true;
      ELSE
        RETURN false;
      END IF;
    WHEN 'premium_code' THEN
      RETURN true;
    ELSE
      RETURN false;
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_subscription_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER subscription_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_subscription_updated_at();

COMMENT ON TABLE premium_codes IS 'Stores special access codes that grant premium features without payment';
COMMENT ON TABLE premium_code_usage IS 'Tracks which users have used which premium codes';
COMMENT ON TABLE user_usage IS 'Tracks feature usage for implementing subscription limits';
COMMENT ON TABLE subscriptions IS 'Manages user subscription status and billing information';