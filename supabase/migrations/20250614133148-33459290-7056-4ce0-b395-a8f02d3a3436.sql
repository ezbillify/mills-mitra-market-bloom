
-- First, let's check and create missing profiles for any orders that don't have them
INSERT INTO public.profiles (id, first_name, last_name, email, created_at)
SELECT DISTINCT 
    o.user_id,
    'Customer' as first_name,
    CONCAT('ID-', SUBSTRING(o.user_id::text, 1, 8)) as last_name,
    COALESCE(au.email, CONCAT('customer-', SUBSTRING(o.user_id::text, 1, 8), '@noemail.com')) as email,
    COALESCE(o.created_at, NOW()) as created_at
FROM public.orders o
LEFT JOIN public.profiles p ON o.user_id = p.id
LEFT JOIN auth.users au ON o.user_id = au.id
WHERE p.id IS NULL
ON CONFLICT (id) DO UPDATE SET
    first_name = COALESCE(EXCLUDED.first_name, profiles.first_name),
    last_name = COALESCE(EXCLUDED.last_name, profiles.last_name),
    email = COALESCE(EXCLUDED.email, profiles.email),
    updated_at = NOW();

-- Update any profiles that have null or empty names to have meaningful defaults
UPDATE public.profiles 
SET 
    first_name = COALESCE(NULLIF(first_name, ''), 'Customer'),
    last_name = COALESCE(NULLIF(last_name, ''), CONCAT('ID-', SUBSTRING(id::text, 1, 8))),
    updated_at = NOW()
WHERE first_name IS NULL OR first_name = '' OR last_name IS NULL OR last_name = '';

-- Ensure the foreign key constraint is properly set up
ALTER TABLE public.orders 
DROP CONSTRAINT IF EXISTS orders_user_id_profiles_fkey;

ALTER TABLE public.orders 
ADD CONSTRAINT orders_user_id_profiles_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
