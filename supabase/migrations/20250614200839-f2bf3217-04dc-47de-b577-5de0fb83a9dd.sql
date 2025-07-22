
-- First, let's enable RLS on order_items table if not already enabled
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Create policy for order_items based on order ownership (only if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'order_items' 
        AND policyname = 'Users can view their own order items'
    ) THEN
        CREATE POLICY "Users can view their own order items" 
          ON public.order_items 
          FOR SELECT 
          USING (EXISTS (
            SELECT 1 FROM public.orders 
            WHERE orders.id = order_items.order_id 
            AND orders.user_id = auth.uid()
          ));
    END IF;
END $$;

-- Create policy that allows users to insert order items for their own orders (only if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'order_items' 
        AND policyname = 'Users can create order items for their own orders'
    ) THEN
        CREATE POLICY "Users can create order items for their own orders" 
          ON public.order_items 
          FOR INSERT 
          WITH CHECK (EXISTS (
            SELECT 1 FROM public.orders 
            WHERE orders.id = order_items.order_id 
            AND orders.user_id = auth.uid()
          ));
    END IF;
END $$;
