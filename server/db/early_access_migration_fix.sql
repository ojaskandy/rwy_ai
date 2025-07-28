-- Clean migration for Runway AI early access signups
-- Run this in your Supabase SQL Editor to fix the early_access_signups table

-- Drop existing table and policies if they exist (clean slate)
DROP POLICY IF EXISTS "Allow anonymous signup insertion" ON early_access_signups;
DROP POLICY IF EXISTS "Allow authenticated users to view signups" ON early_access_signups;
DROP TABLE IF EXISTS early_access_signups;

-- Create the early access signups table fresh
CREATE TABLE early_access_signups (
    id SERIAL PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    referral_source TEXT NOT NULL DEFAULT 'runway-ai-early-access',
    experience_level TEXT,
    newsletter_opt_in BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_early_access_email ON early_access_signups(email);
CREATE INDEX idx_early_access_created_at ON early_access_signups(created_at DESC);
CREATE INDEX idx_early_access_referral_source ON early_access_signups(referral_source);

-- Enable RLS (Row Level Security)
ALTER TABLE early_access_signups ENABLE ROW LEVEL SECURITY;

-- Policy to allow anonymous users to insert their own signups
CREATE POLICY "Allow anonymous signup insertion" 
ON early_access_signups 
FOR INSERT 
TO anon 
WITH CHECK (true);

-- Policy to allow authenticated users to view all signups (admin access)
CREATE POLICY "Allow authenticated users to view signups" 
ON early_access_signups 
FOR SELECT 
TO authenticated 
USING (true);

-- Add a trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_early_access_signups_updated_at 
    BEFORE UPDATE ON early_access_signups 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE early_access_signups IS 'Stores early access waitlist signups for Runway AI';
COMMENT ON COLUMN early_access_signups.full_name IS 'User''s full name';
COMMENT ON COLUMN early_access_signups.email IS 'User''s email address (unique)';
COMMENT ON COLUMN early_access_signups.referral_source IS 'How the user found out about Runway AI';
COMMENT ON COLUMN early_access_signups.newsletter_opt_in IS 'Whether user opted in to newsletter';

-- Test the table works
SELECT 'early_access_signups table created successfully!' as message; 