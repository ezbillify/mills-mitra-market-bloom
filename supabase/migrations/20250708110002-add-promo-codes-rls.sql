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