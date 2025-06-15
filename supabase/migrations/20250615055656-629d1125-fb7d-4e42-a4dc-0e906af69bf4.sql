
-- Create a security definer function to check if user is admin (only if it doesn't exist)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if the user's email matches admin emails
  RETURN EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND (email = 'admin@ezbillify.com' OR email = 'admin@millsmitra.com')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Add admin policy for orders table (only if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'orders' 
        AND policyname = 'Admins can view all orders'
    ) THEN
        CREATE POLICY "Admins can view all orders" 
          ON public.orders 
          FOR SELECT 
          USING (public.is_admin());
    END IF;
END $$;

-- Add admin policy for order_items table (only if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'order_items' 
        AND policyname = 'Admins can view all order items'
    ) THEN
        CREATE POLICY "Admins can view all order items" 
          ON public.order_items 
          FOR SELECT 
          USING (public.is_admin());
    END IF;
END $$;

-- Add admin update policy for orders (only if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'orders' 
        AND policyname = 'Admins can update all orders'
    ) THEN
        CREATE POLICY "Admins can update all orders" 
          ON public.orders 
          FOR UPDATE 
          USING (public.is_admin());
    END IF;
END $$;

-- Add admin insert policy for order_items (only if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'order_items' 
        AND policyname = 'Admins can create all order items'
    ) THEN
        CREATE POLICY "Admins can create all order items" 
          ON public.order_items 
          FOR INSERT 
          WITH CHECK (public.is_admin());
    END IF;
END $$;
