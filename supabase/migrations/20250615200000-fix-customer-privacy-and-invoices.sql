
-- Fix RLS policies to ensure customer data privacy while maintaining admin access

-- Drop the current policy that allows reading all profiles
DROP POLICY IF EXISTS allow_read_all_profiles ON public.profiles;

-- Create a more restrictive policy for customer data access
CREATE POLICY "Users can view their own profile and admins can view all" 
  ON public.profiles 
  FOR SELECT 
  USING (
    auth.uid() = id OR public.is_admin()
  );

-- Ensure customers can only see their own orders
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
CREATE POLICY "Users can view their own orders and admins can view all" 
  ON public.orders 
  FOR SELECT 
  USING (
    auth.uid() = user_id OR public.is_admin()
  );

-- Ensure customers can only see their own order items  
DROP POLICY IF EXISTS "Users can view their own order items" ON public.order_items;
CREATE POLICY "Users can view their own order items and admins can view all" 
  ON public.order_items 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE orders.id = order_items.order_id 
      AND (orders.user_id = auth.uid() OR public.is_admin())
    )
  );
