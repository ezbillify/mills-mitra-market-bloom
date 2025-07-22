
-- Create analytics tracking table
CREATE TABLE public.analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  event_data JSONB,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  page_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create employees table
CREATE TABLE public.employees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_id TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  position TEXT NOT NULL,
  department TEXT,
  hire_date DATE NOT NULL DEFAULT CURRENT_DATE,
  salary DECIMAL(10,2),
  status TEXT NOT NULL DEFAULT 'active',
  manager_id UUID REFERENCES public.employees(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create website visits tracking table
CREATE TABLE public.website_visits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  visitor_id TEXT NOT NULL,
  page_url TEXT NOT NULL,
  referrer TEXT,
  user_agent TEXT,
  ip_address TEXT,
  session_duration INTEGER, -- in seconds
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sales metrics view for dashboard
CREATE OR REPLACE VIEW public.sales_metrics AS
SELECT 
  DATE(created_at) as date,
  COUNT(*) as orders_count,
  SUM(total) as total_revenue,
  AVG(total) as avg_order_value,
  COUNT(DISTINCT user_id) as unique_customers
FROM public.orders 
WHERE status != 'cancelled'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Enable RLS
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_visits ENABLE ROW LEVEL SECURITY;

-- RLS policies for analytics (admin only)
CREATE POLICY "Admins can manage analytics" ON public.analytics FOR ALL USING (auth.role() = 'authenticated');

-- RLS policies for employees (admin only)
CREATE POLICY "Admins can manage employees" ON public.employees FOR ALL USING (auth.role() = 'authenticated');

-- RLS policies for website visits (admin only)
CREATE POLICY "Admins can view website visits" ON public.website_visits FOR ALL USING (auth.role() = 'authenticated');

-- Insert sample employees data
INSERT INTO public.employees (employee_id, first_name, last_name, email, position, department, salary, status) VALUES
('EMP001', 'John', 'Smith', 'john.smith@company.com', 'Sales Manager', 'Sales', 75000.00, 'active'),
('EMP002', 'Sarah', 'Johnson', 'sarah.johnson@company.com', 'Marketing Specialist', 'Marketing', 55000.00, 'active'),
('EMP003', 'Mike', 'Davis', 'mike.davis@company.com', 'Customer Support', 'Support', 45000.00, 'active'),
('EMP004', 'Emily', 'Brown', 'emily.brown@company.com', 'Product Manager', 'Product', 85000.00, 'active'),
('EMP005', 'David', 'Wilson', 'david.wilson@company.com', 'Developer', 'IT', 70000.00, 'active');

-- Insert sample analytics data
INSERT INTO public.analytics (event_type, event_data, page_url) VALUES
('page_view', '{"source": "direct"}', '/'),
('page_view', '{"source": "google"}', '/products'),
('product_view', '{"product_id": "123", "category": "electronics"}', '/products/123'),
('add_to_cart', '{"product_id": "123", "quantity": 1}', '/products/123'),
('page_view', '{"source": "social"}', '/'),
('checkout_started', '{"cart_value": 299.99}', '/cart'),
('purchase', '{"order_id": "456", "total": 299.99}', '/checkout/success');

-- Insert sample website visits
INSERT INTO public.website_visits (visitor_id, page_url, referrer, session_duration) VALUES
('visitor_1', '/', 'https://google.com', 120),
('visitor_2', '/products', 'https://facebook.com', 180),
('visitor_3', '/products/electronics', 'direct', 95),
('visitor_1', '/cart', '/', 45),
('visitor_4', '/', 'https://twitter.com', 200),
('visitor_5', '/products/clothing', 'https://google.com', 150);

-- Update order_status enum to include new statuses if not already present
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
        CREATE TYPE order_status AS ENUM ('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'accepted', 'out_for_delivery', 'completed');
    ELSE
        -- Add new values if they don't exist
        BEGIN
            ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'accepted';
            ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'out_for_delivery';
            ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'completed';
        EXCEPTION
            WHEN duplicate_object THEN NULL;
        END;
    END IF;
END $$;
