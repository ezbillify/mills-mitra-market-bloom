
-- First, let's check if the foreign key constraint exists
DO $$ 
BEGIN
    -- Drop the existing constraint if it exists to avoid conflicts
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'orders_user_id_profiles_fkey' 
        AND table_name = 'orders'
    ) THEN
        ALTER TABLE public.orders DROP CONSTRAINT orders_user_id_profiles_fkey;
    END IF;
END $$;

-- Now add the proper foreign key constraint
ALTER TABLE public.orders 
ADD CONSTRAINT orders_user_id_profiles_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Also ensure we have profiles for all existing orders
-- This will create missing profiles for any orders that don't have corresponding profiles
INSERT INTO public.profiles (id, first_name, last_name, email)
SELECT DISTINCT 
    o.user_id,
    'Unknown' as first_name,
    'Customer' as last_name,
    COALESCE(au.email, 'unknown@example.com') as email
FROM public.orders o
LEFT JOIN public.profiles p ON o.user_id = p.id
LEFT JOIN auth.users au ON o.user_id = au.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Enable real-time updates for both tables to ensure UI stays in sync
ALTER TABLE public.orders REPLICA IDENTITY FULL;
ALTER TABLE public.profiles REPLICA IDENTITY FULL;

-- Add both tables to the real-time publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
