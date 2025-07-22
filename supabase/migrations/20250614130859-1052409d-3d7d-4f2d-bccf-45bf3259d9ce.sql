
-- First, let's check if we have the foreign key constraint between orders and profiles
-- If not, we'll add it to ensure data integrity

-- Add foreign key constraint between orders.user_id and profiles.id if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'orders_user_id_profiles_fkey' 
        AND table_name = 'orders'
    ) THEN
        ALTER TABLE public.orders 
        ADD CONSTRAINT orders_user_id_profiles_fkey 
        FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Now let's check if there are orders with user_ids that don't have corresponding profiles
-- and create missing profiles for those users
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
