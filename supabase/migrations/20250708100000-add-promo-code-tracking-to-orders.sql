-- Add promo code tracking columns to orders table if they don't exist
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS promo_code_id UUID REFERENCES public.promo_codes(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10,2) DEFAULT 0;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_promo_code_id ON public.orders(promo_code_id);