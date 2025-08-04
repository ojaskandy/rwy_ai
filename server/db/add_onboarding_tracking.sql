-- Add onboarding completion tracking to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS onboarding_data JSONB;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding_completed 
ON public.profiles(onboarding_completed);

-- Update RLS policy to allow users to update their own onboarding status
CREATE POLICY "Users can update own onboarding status" ON public.profiles
FOR UPDATE USING (auth.uid() = user_id);

COMMENT ON COLUMN public.profiles.onboarding_completed IS 'Whether user has completed the onboarding flow';
COMMENT ON COLUMN public.profiles.onboarding_data IS 'Stores user responses from onboarding questions';