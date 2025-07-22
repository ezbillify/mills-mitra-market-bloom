
-- Ensure proper RLS policies for customer data privacy

-- First, drop the problematic policy that allows reading all profiles
DROP POLICY IF EXISTS "allow_read_all_profiles" ON public.profiles;

-- Create a strict policy that only allows users to see their own profile or admins to see all
CREATE POLICY "Users can view own profile or admins view all" 
  ON public.profiles 
  FOR SELECT 
  USING (
    auth.uid() = id OR public.is_admin()
  );

-- Ensure customers can only see their own orders
DROP POLICY IF EXISTS "Users can view their own orders and admins can view all" ON public.orders;
CREATE POLICY "Users can view own orders or admins view all" 
  ON public.orders 
  FOR SELECT 
  USING (
    auth.uid() = user_id OR public.is_admin()
  );

-- Ensure customers can only see their own order items
DROP POLICY IF EXISTS "Users can view their own order items and admins can view all" ON public.order_items;
CREATE POLICY "Users can view own order items or admins view all" 
  ON public.order_items 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE orders.id = order_items.order_id 
      AND (orders.user_id = auth.uid() OR public.is_admin())
    )
  );

-- Ensure customers can only see their own cart items
DROP POLICY IF EXISTS "Users can view their own cart items" ON public.cart_items;
CREATE POLICY "Users can view own cart items" 
  ON public.cart_items 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Allow customers to insert their own cart items
DROP POLICY IF EXISTS "Users can insert their own cart items" ON public.cart_items;
CREATE POLICY "Users can insert own cart items" 
  ON public.cart_items 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Allow customers to update their own cart items
DROP POLICY IF EXISTS "Users can update their own cart items" ON public.cart_items;
CREATE POLICY "Users can update own cart items" 
  ON public.cart_items 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Allow customers to delete their own cart items
DROP POLICY IF EXISTS "Users can delete their own cart items" ON public.cart_items;
CREATE POLICY "Users can delete own cart items" 
  ON public.cart_items 
  FOR DELETE 
  USING (auth.uid() = user_id);
