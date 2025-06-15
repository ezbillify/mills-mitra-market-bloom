
-- 1) Make sure RLS is on (you can turn it off later if you want)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2) Remove the old "only your own" SELECT policy
DROP POLICY IF EXISTS "Allow logged-in users to select their own profile"
  ON public.profiles;

-- 3) Allow everyone (including your admin UI on the anon key) to SELECT all rows
CREATE POLICY allow_read_all_profiles
  ON public.profiles
  FOR SELECT
  USING (true);
