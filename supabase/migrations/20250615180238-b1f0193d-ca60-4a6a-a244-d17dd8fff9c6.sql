
-- Add HSN code and update GST percentage to be product-specific
ALTER TABLE public.products 
ADD COLUMN hsn_code TEXT,
ADD COLUMN product_type TEXT DEFAULT 'goods' CHECK (product_type IN ('goods', 'services'));

-- Update existing products with default HSN codes based on product type
UPDATE public.products SET hsn_code = '1234' WHERE hsn_code IS NULL;

-- Create GSTR-1 export table to store formatted data
CREATE TABLE public.gstr1_exports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  export_date DATE NOT NULL,
  period_from DATE NOT NULL,
  period_to DATE NOT NULL,
  total_taxable_value NUMERIC NOT NULL DEFAULT 0,
  total_tax_amount NUMERIC NOT NULL DEFAULT 0,
  total_invoice_value NUMERIC NOT NULL DEFAULT 0,
  export_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS policies for GSTR-1 exports (admin only)
ALTER TABLE public.gstr1_exports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage GSTR-1 exports" 
  ON public.gstr1_exports 
  FOR ALL 
  USING (is_admin());

-- Update the calculate_prices_with_tax_logic function to be more robust
CREATE OR REPLACE FUNCTION public.calculate_prices_with_tax_logic()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure gst_percentage has a default value
  IF NEW.gst_percentage IS NULL THEN
    NEW.gst_percentage = 18.0;
  END IF;
  
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
