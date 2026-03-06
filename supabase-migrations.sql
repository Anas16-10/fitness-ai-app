-- supabase-migrations.sql
-- Database schema migrations for fitness-ai-app
-- Run these SQL commands in your Supabase SQL editor to add new columns and tables.

-- ============================================
-- 1. Add plan_json column to workout_plans
-- ============================================
ALTER TABLE workout_plans
ADD COLUMN IF NOT EXISTS plan_json JSONB;

-- ============================================
-- 2. Add name, activity_level, workout_streak, last_workout_date to profiles
-- ============================================
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS name TEXT;

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS activity_level TEXT;

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS workout_streak INT DEFAULT 0;

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS last_workout_date DATE;

-- NOTE: last_workout_date is automatically managed by the streak tracking system.
-- It should NOT be manually edited by users. It tracks when the last workout was logged
-- to calculate consecutive workout days (streak).

-- ============================================
-- 3. Create body_weight_logs table
-- ============================================
CREATE TABLE IF NOT EXISTS body_weight_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  weight FLOAT NOT NULL,
  log_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 4. Create favorite_foods table
-- ============================================
CREATE TABLE IF NOT EXISTS favorite_foods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  food_name TEXT NOT NULL,
  calories FLOAT NOT NULL,
  protein FLOAT NOT NULL,
  carbs FLOAT NOT NULL,
  fat FLOAT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 5. Create workout_templates table
-- ============================================
CREATE TABLE IF NOT EXISTS workout_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  template JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 6. Performance indexes
-- ============================================
CREATE INDEX IF NOT EXISTS workout_logs_user_date
ON workout_logs(user_id, created_at);

CREATE INDEX IF NOT EXISTS nutrition_logs_user_date
ON nutrition_logs(user_id, log_date);

CREATE INDEX IF NOT EXISTS body_weight_logs_user_date
ON body_weight_logs(user_id, log_date);

CREATE INDEX IF NOT EXISTS favorite_foods_user_id
ON favorite_foods(user_id);

CREATE INDEX IF NOT EXISTS workout_templates_user_id
ON workout_templates(user_id);

-- ============================================
-- 7. Create ai_usage table (for Rate Limiting)
-- ============================================
CREATE TABLE IF NOT EXISTS ai_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS and add policies
ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can insert their own usage" ON ai_usage FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own usage" ON ai_usage FOR SELECT USING (auth.uid() = user_id);

-- ============================================
-- 8. Create ai_recommendations table (for caching/saving responses)
-- ============================================
CREATE TABLE IF NOT EXISTS ai_recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS and add policies
ALTER TABLE ai_recommendations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can insert their own recommendations" ON ai_recommendations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own recommendations" ON ai_recommendations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own recommendations" ON ai_recommendations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own recommendations" ON ai_recommendations FOR DELETE USING (auth.uid() = user_id);

-- Fix for ai_recommendations missing 'type' column
ALTER TABLE IF EXISTS ai_recommendations ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'diet';

-- ============================================
-- 9. Setup RLS for Core Workout Tables
-- ============================================

-- workout_logs (Note: Assumes table exists from initial setup)
ALTER TABLE IF EXISTS workout_logs ENABLE ROW LEVEL SECURITY;
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'workout_logs' AND policyname = 'Users can manage their own workout logs') THEN
        CREATE POLICY "Users can manage their own workout logs" ON workout_logs
        FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- exercise_progress
CREATE TABLE IF NOT EXISTS exercise_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_name TEXT NOT NULL,
  best_weight FLOAT DEFAULT 0,
  best_reps INT DEFAULT 0,
  estimated_1rm FLOAT DEFAULT 0,
  last_updated TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, exercise_name)
);

-- Fix for existing tables that might have different column names or missing columns
DO $$ 
BEGIN
    -- Rename 'exercise' to 'exercise_name' if it exists.
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='exercise_progress' AND column_name='exercise') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='exercise_progress' AND column_name='exercise_name') THEN
        ALTER TABLE exercise_progress RENAME COLUMN exercise TO exercise_name;
    ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='exercise_progress' AND column_name='exercise_name') THEN
        ALTER TABLE exercise_progress ADD COLUMN exercise_name TEXT NOT NULL DEFAULT 'Unknown';
    END IF;

    -- Add best_weight if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='exercise_progress' AND column_name='best_weight') THEN
        ALTER TABLE exercise_progress ADD COLUMN best_weight FLOAT DEFAULT 0;
    END IF;

    -- Add best_reps if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='exercise_progress' AND column_name='best_reps') THEN
        ALTER TABLE exercise_progress ADD COLUMN best_reps INT DEFAULT 0;
    END IF;

    -- Add estimated_1rm if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='exercise_progress' AND column_name='estimated_1rm') THEN
        ALTER TABLE exercise_progress ADD COLUMN estimated_1rm FLOAT DEFAULT 0;
    END IF;

    -- Add last_updated if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='exercise_progress' AND column_name='last_updated') THEN
        ALTER TABLE exercise_progress ADD COLUMN last_updated TIMESTAMP DEFAULT NOW();
    END IF;
END $$;

ALTER TABLE exercise_progress ENABLE ROW LEVEL SECURITY;
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'exercise_progress' AND policyname = 'Users can manage their own progress') THEN
        CREATE POLICY "Users can manage their own progress" ON exercise_progress
        FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- ============================================
-- 10. Fix workout_logs missing date
-- ============================================
ALTER TABLE IF EXISTS workout_logs ADD COLUMN IF NOT EXISTS workout_date DATE DEFAULT CURRENT_DATE;


-- ============================================
-- Notes:
-- - All tables use ON DELETE CASCADE to automatically
--   remove user data when a user account is deleted.
-- - Indexes improve query performance for common filters.
-- - JSONB columns allow flexible structured data storage.
-- ============================================

