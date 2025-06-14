
-- Create categories table
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create shipping_settings table
CREATE TABLE public.shipping_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  min_order_value NUMERIC DEFAULT 0,
  max_weight NUMERIC,
  delivery_days_min INTEGER DEFAULT 1,
  delivery_days_max INTEGER DEFAULT 7,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add trigger to update updated_at timestamp
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_shipping_settings_updated_at
  BEFORE UPDATE ON public.shipping_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some default categories
INSERT INTO public.categories (name, description, display_order) VALUES
('Electronics', 'Electronic devices and accessories', 1),
('Clothing', 'Apparel and fashion items', 2),
('Books', 'Books and educational materials', 3),
('Home', 'Home and garden items', 4),
('Sports', 'Sports and fitness equipment', 5);

-- Insert some default shipping options
INSERT INTO public.shipping_settings (name, description, price, delivery_days_min, delivery_days_max) VALUES
('Standard Shipping', 'Regular delivery within 5-7 business days', 50.00, 5, 7),
('Express Shipping', 'Fast delivery within 2-3 business days', 150.00, 2, 3),
('Free Shipping', 'Free delivery for orders above ₹500', 0.00, 5, 10);

-- Now migrate existing product categories
DO $$
DECLARE
    cat_record RECORD;
BEGIN
    -- For each unique category in products, create a category if it doesn't exist
    FOR cat_record IN 
        SELECT DISTINCT category FROM products 
        WHERE category IS NOT NULL
    LOOP
        INSERT INTO categories (name, description, display_order)
        SELECT cat_record.category::text, 'Auto-generated from existing products', 999
        WHERE NOT EXISTS (
            SELECT 1 FROM categories WHERE LOWER(name) = LOWER(cat_record.category::text)
        );
    END LOOP;
END $$;

-- Add a category_id column to products table
ALTER TABLE public.products ADD COLUMN category_id UUID REFERENCES public.categories(id);

-- Update existing products to link to the new categories
UPDATE products 
SET category_id = categories.id 
FROM categories 
WHERE LOWER(categories.name) = LOWER(products.category::text);
