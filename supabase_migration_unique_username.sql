-- Migration to enforce unique usernames and prevent empty spaces

-- 1. Create a function to generate a random fallback username
CREATE OR REPLACE FUNCTION random_string(length INTEGER) RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'abcdefghijklmnopqrstuvwxyz0123456789';
  result TEXT := '';
  i INTEGER := 0;
BEGIN
  FOR i IN 1..length LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::INTEGER, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 2. Update existing profiles that have null or empty usernames
UPDATE public.profiles
SET username = 'user_' || random_string(8)
WHERE username IS NULL OR username = '' OR username LIKE '% %';

-- Note: If you encounter an error on the next step because of duplicate usernames,
-- you will need to manually change the duplicates in your database first!
-- You can find duplicates using:
-- SELECT username, COUNT(*) FROM public.profiles GROUP BY username HAVING COUNT(*) > 1;

-- 3. Enforce the UNIQUE constraint on the username column
ALTER TABLE public.profiles ADD CONSTRAINT profiles_username_key UNIQUE (username);
