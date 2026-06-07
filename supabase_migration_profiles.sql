-- Migration to add display_name and bio to profiles table

-- 1. Add new columns
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS display_name TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT;

-- Note: The username column already exists from the previous trigger
-- We will just use the new columns for displaying data.

-- 2. Update existing policies if necessary (optional)
-- Since we already have:
-- CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
-- CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
-- The new columns will automatically be included in these existing RLS policies.
