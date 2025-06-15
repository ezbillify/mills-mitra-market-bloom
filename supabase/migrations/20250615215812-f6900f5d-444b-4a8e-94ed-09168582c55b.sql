
-- Add payment_type to orders table
ALTER TABLE public.orders ADD COLUMN payment_type text NOT NULL DEFAULT 'cod';

-- Optional: If you want to restrict payment types, you can later use a CHECK or an ENUM, but for now, we'll just use text for flexibility.
