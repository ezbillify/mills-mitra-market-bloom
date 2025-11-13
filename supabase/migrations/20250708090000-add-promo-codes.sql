-- Create promo_codes table
CREATE TABLE public.promo_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10,2) NOT NULL,
  minimum_order_value DECIMAL(10,2) DEFAULT 0,
  max_uses INTEGER,
  used_count INTEGER DEFAULT 0,
  valid_from TIMESTAMP WITH TIME ZONE,
  valid_until TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add promo_code_id to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS promo_code_id UUID REFERENCES public.promo_codes(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10,2) DEFAULT 0;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON public.promo_codes(code);
CREATE INDEX IF NOT EXISTS idx_promo_codes_active ON public.promo_codes(is_active);
CREATE INDEX IF NOT EXISTS idx_orders_promo_code_id ON public.orders(promo_code_id);

-- Enable RLS on promo_codes table
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

-- RLS policies for promo_codes
CREATE POLICY "Promo codes are viewable by everyone" ON public.promo_codes FOR SELECT USING (is_active = true AND (valid_until IS NULL OR valid_until > now()));
CREATE POLICY "Promo codes are editable by authenticated users" ON public.promo_codes FOR ALL USING (auth.role() = 'authenticated');

-- Insert sample promo codes
INSERT INTO public.promo_codes (code, description, discount_type, discount_value, minimum_order_value, max_uses) VALUES
('WELCOME10', '10% off your first order', 'percentage', 10.00, 100.00, 1000),
('SAVE20', 'Flat ₹20 off on orders above ₹500', 'fixed', 20.00, 500.00, 500),
('FREESHIP', 'Free shipping on orders above ₹1000', 'fixed', 0.00, 1000.00, 200);

-- Update RLS policy for orders to allow users to view their own orders with promo code info
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
CREATE POLICY "Users can view their own orders" ON public.orders FOR SELECT USING (
  auth.uid() = user_id OR auth.role() = 'authenticated'
);