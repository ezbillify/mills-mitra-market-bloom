
-- Add discounted_price column to products table
ALTER TABLE public.products 
ADD COLUMN discounted_price numeric DEFAULT NULL;

-- Add a check constraint to ensure discounted_price is less than original price when set
ALTER TABLE public.products 
ADD CONSTRAINT check_discounted_price_valid 
CHECK (discounted_price IS NULL OR discounted_price < price);
