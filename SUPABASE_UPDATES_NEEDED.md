# Supabase Database Updates Required

## Current Status
✅ **Onboarding flow is working!** 
- Guest users now see onboarding (hasCompletedOnboarding: false)
- Onboarding endpoints are functional
- App redirects properly to onboarding

## Required Supabase SQL Updates

### 1. Create profiles table (for onboarding tracking)
```sql
-- Create profiles table that uses Supabase auth.users UUIDs
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  onboarding_completed BOOLEAN DEFAULT false,
  onboarding_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding_completed 
ON public.profiles(onboarding_completed);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY "Users can update own onboarding status" ON public.profiles
FOR ALL USING (auth.uid() = user_id);
```

### 2. Update existing tables to use UUIDs (as per your memory)

#### Update users table:
```sql
-- Add user_id column that references auth.users
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON public.users(auth_user_id);
```

#### Update related tables:
```sql
-- Update premiumCodeUsage.userId to text (UUID)
ALTER TABLE public.premium_code_usage 
ALTER COLUMN user_id TYPE UUID USING user_id::text::uuid;

-- Update userUsage.userId to text (UUID)  
ALTER TABLE public.user_usage 
ALTER COLUMN user_id TYPE UUID USING user_id::text::uuid;

-- Update subscriptions.userId to text (UUID)
ALTER TABLE public.subscriptions 
ALTER COLUMN user_id TYPE UUID USING user_id::text::uuid;
```

### 3. Backend Code Updates Needed

#### Fix field name consistency in server/routes.ts:
Change snake_case to camelCase in onboarding endpoints:
- `has_completed_onboarding` → `hasCompletedOnboarding`
- `has_paid` → `hasPaid` 
- `has_code_bypass` → `hasCodeBypass`

## Testing Instructions

1. Run the SQL updates in Supabase SQL Editor
2. Test user signup/login flow
3. Complete onboarding as a new user
4. Verify onboarding doesn't show again for completed users
5. Test that users with payment/code bypass skip onboarding

## Current Working State
- ✅ Onboarding flow works for guest users
- ✅ Endpoints require proper authentication  
- ✅ Guest users see onboarding form
- ⚠️ Database needs UUID migration for full Supabase integration