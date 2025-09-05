-- Referral System Database Schema
-- This creates tables for tracking content creators and referrals

-- Table for storing content creators/referrers
CREATE TABLE IF NOT EXISTS referral_creators (
  id SERIAL PRIMARY KEY,
  creator_code TEXT NOT NULL UNIQUE, -- e.g., "ojaskandy"
  display_name TEXT NOT NULL, -- e.g., "Ojas Kandy"
  email TEXT,
  commission_rate DECIMAL(3,2) DEFAULT 0.20, -- 20% default commission
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Table for tracking referral attributions and conversions
CREATE TABLE IF NOT EXISTS referral_conversions (
  id SERIAL PRIMARY KEY,
  creator_code TEXT NOT NULL REFERENCES referral_creators(creator_code),
  user_id TEXT NOT NULL, -- UUID from Supabase auth.users
  user_email TEXT NOT NULL,
  attributed_at TIMESTAMP DEFAULT NOW(), -- When user selected the creator
  converted_at TIMESTAMP, -- When user became paid subscriber
  conversion_type TEXT, -- 'stripe_subscription', 'premium_code'
  stripe_subscription_id TEXT,
  plan_type TEXT, -- 'monthly', 'yearly'
  subscription_amount DECIMAL(10,2), -- Monthly subscription amount
  commission_earned DECIMAL(10,2), -- Commission amount for this conversion
  payout_status TEXT DEFAULT 'pending', -- 'pending', 'paid', 'cancelled'
  payout_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_referral_conversions_creator ON referral_conversions(creator_code);
CREATE INDEX IF NOT EXISTS idx_referral_conversions_user ON referral_conversions(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_conversions_status ON referral_conversions(payout_status);

-- Insert some initial creators (examples)
INSERT INTO referral_creators (creator_code, display_name, email) VALUES
  ('ojaskandy', 'Ojas Kandy', 'ojas@example.com'),
  ('sarahsmith', 'Sarah Smith', 'sarah@example.com'),
  ('mikejones', 'Mike Jones', 'mike@example.com')
ON CONFLICT (creator_code) DO NOTHING;

-- Function to calculate creator stats
CREATE OR REPLACE FUNCTION get_creator_stats(p_creator_code TEXT)
RETURNS TABLE (
  total_referrals BIGINT,
  converted_referrals BIGINT,
  total_revenue DECIMAL,
  total_commission DECIMAL,
  pending_commission DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_referrals,
    COUNT(converted_at)::BIGINT as converted_referrals,
    COALESCE(SUM(subscription_amount), 0) as total_revenue,
    COALESCE(SUM(commission_earned), 0) as total_commission,
    COALESCE(SUM(CASE WHEN payout_status = 'pending' THEN commission_earned ELSE 0 END), 0) as pending_commission
  FROM referral_conversions
  WHERE creator_code = p_creator_code;
END;
$$ LANGUAGE plpgsql;

-- Add column to track referral source in user metadata (for analytics)
COMMENT ON TABLE referral_creators IS 'Stores content creators and referrers who can earn commissions';
COMMENT ON TABLE referral_conversions IS 'Tracks user referrals and payment conversions for commission payouts';
