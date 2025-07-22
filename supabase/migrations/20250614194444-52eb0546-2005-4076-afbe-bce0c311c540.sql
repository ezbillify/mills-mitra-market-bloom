
-- Create shipping/delivery options table
CREATE TABLE IF NOT EXISTS public.delivery_options (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  estimated_days_min INTEGER DEFAULT 1,
  estimated_days_max INTEGER DEFAULT 7,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add delivery option reference to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_option_id UUID REFERENCES public.delivery_options(id);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_price NUMERIC DEFAULT 0;

-- Update products table to handle tax-inclusive pricing
-- Add a column to indicate if the entered price includes tax
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS price_includes_tax BOOLEAN DEFAULT true;

-- Drop the existing trigger that calculates selling price with tax
DROP TRIGGER IF EXISTS trigger_calculate_selling_price_with_tax ON public.products;

-- Create new function for tax-inclusive pricing
CREATE OR REPLACE FUNCTION calculate_prices_with_tax_logic()
RETURNS TRIGGER AS $$
BEGIN
  -- If price includes tax, calculate the base price excluding tax
  IF NEW.price_includes_tax = true THEN
    -- The entered price already includes tax, so calculate base price
    NEW.selling_price_with_tax = NEW.price;
    
    -- If there's a discounted price, it also includes tax
    IF NEW.discounted_price IS NOT NULL THEN
      NEW.selling_price_with_tax = NEW.discounted_price;
    END IF;
  ELSE
    -- Original logic: price excludes tax, calculate selling price with tax
    IF NEW.discounted_price IS NOT NULL THEN
      NEW.selling_price_with_tax = NEW.discounted_price + (NEW.discounted_price * NEW.gst_percentage / 100);
    ELSE
      NEW.selling_price_with_tax = NEW.price + (NEW.price * NEW.gst_percentage / 100);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create new trigger
CREATE TRIGGER trigger_calculate_prices_with_tax_logic
  BEFORE INSERT OR UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION calculate_prices_with_tax_logic();

-- Insert some default delivery options
INSERT INTO public.delivery_options (name, description, price, estimated_days_min, estimated_days_max, display_order) VALUES
('Standard Delivery', 'Regular delivery within 5-7 business days', 50, 5, 7, 1),
('Express Delivery', 'Fast delivery within 2-3 business days', 150, 2, 3, 2),
('Same Day Delivery', 'Delivery within the same day (select areas only)', 300, 1, 1, 3),
('Free Delivery', 'Free delivery for orders above ₹1000 (7-10 business days)', 0, 7, 10, 4)
ON CONFLICT DO NOTHING;

-- Update existing products to use tax-inclusive pricing by default
UPDATE public.products SET price_includes_tax = true WHERE price_includes_tax IS NULL;
