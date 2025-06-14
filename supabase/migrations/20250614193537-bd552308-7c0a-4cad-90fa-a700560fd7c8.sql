
-- Remove the enum constraint from the category column and update the schema
ALTER TABLE public.products ALTER COLUMN category TYPE text;

-- Drop the old enum type if it exists
DROP TYPE IF EXISTS product_category;

-- Update existing products to use lowercase category names to match the new system
UPDATE public.products SET category = LOWER(category);

-- Add an index on the category column for better performance
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);

-- Update the trigger to recalculate selling price with tax for existing products
UPDATE public.products 
SET updated_at = now();
