-- Alter the user_usage table to enforce new basic user limits

-- Drop old columns that are no longer needed
ALTER TABLE "user_usage" DROP COLUMN IF EXISTS "board_saves_this_week";
ALTER TABLE "user_usage" DROP COLUMN IF EXISTS "board_saves_week_start";
ALTER TABLE "user_usage" DROP COLUMN IF EXISTS "routine_minutes_this_week";
ALTER TABLE "user_usage" DROP COLUMN IF EXISTS "routine_week_start";
ALTER TABLE "user_usage" DROP COLUMN IF EXISTS "interview_questions_today";
ALTER TABLE "user_usage" DROP COLUMN IF EXISTS "interview_questions_date";
ALTER TABLE "user_usage" DROP COLUMN IF EXISTS "dress_tryons_this_month";
ALTER TABLE "user_usage" DROP COLUMN IF EXISTS "dress_tryons_month_start";

-- Add new columns for the updated limits

-- Dress try-on (weekly limit: 3)
ALTER TABLE "user_usage" ADD COLUMN "dress_tryons_this_week" INTEGER DEFAULT 0;
ALTER TABLE "user_usage" ADD COLUMN "dress_tryons_week_start" TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Interview coach (weekly limit: 5 questions)
ALTER TABLE "user_usage" ADD COLUMN "interview_questions_this_week" INTEGER DEFAULT 0;
ALTER TABLE "user_usage" ADD COLUMN "interview_questions_week_start" TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Board usage (monthly limit: 10 saves)
ALTER TABLE "user_usage" ADD COLUMN "board_saves_this_month" INTEGER DEFAULT 0;
ALTER TABLE "user_usage" ADD COLUMN "board_saves_month_start" TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Note: Walk routine and calendar event limits will be handled differently
-- as they are not simple counters. They will be enforced in the application logic.
