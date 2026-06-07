-- ============================================================
-- Migration: Follow System
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Create follows table
CREATE TABLE IF NOT EXISTS follows (
  follower_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  following_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- 2. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);

-- 3. Enable RLS
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
-- Everyone can see follow relationships
CREATE POLICY "Anyone can view follows" ON follows
  FOR SELECT USING (true);

-- Users can only follow as themselves
CREATE POLICY "Users can follow others" ON follows
  FOR INSERT WITH CHECK (auth.uid() = follower_id);

-- Users can only unfollow their own follows
CREATE POLICY "Users can unfollow" ON follows
  FOR DELETE USING (auth.uid() = follower_id);

-- 5. Ensure profiles table is readable by all (if not already)
-- This allows viewing other users' profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Users can view all profiles'
  ) THEN
    CREATE POLICY "Users can view all profiles" ON profiles
      FOR SELECT USING (true);
  END IF;
END $$;
