
-- Add GST percentage column to products table
ALTER TABLE public.products ADD COLUMN gst_percentage NUMERIC DEFAULT 18.0;

-- Add a column to store the final selling price including tax
ALTER TABLE public.products ADD COLUMN selling_price_with_tax NUMERIC;

-- Create a function to automatically calculate selling price with tax
CREATE OR REPLACE FUNCTION calculate_selling_price_with_tax()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate selling price with tax based on discounted price or regular price
  IF NEW.discounted_price IS NOT NULL THEN
    NEW.selling_price_with_tax = NEW.discounted_price + (NEW.discounted_price * NEW.gst_percentage / 100);
  ELSE
    NEW.selling_price_with_tax = NEW.price + (NEW.price * NEW.gst_percentage / 100);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically calculate selling price with tax on insert/update
CREATE TRIGGER trigger_calculate_selling_price_with_tax
  BEFORE INSERT OR UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION calculate_selling_price_with_tax();

-- Update existing products to calculate their selling price with tax
UPDATE public.products 
SET gst_percentage = COALESCE(gst_percentage, 18.0);
