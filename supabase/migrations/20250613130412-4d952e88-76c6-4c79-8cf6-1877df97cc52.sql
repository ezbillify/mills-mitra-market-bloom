
-- Create banners table
CREATE TABLE public.banners (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  image_url TEXT NOT NULL,
  mobile_image_url TEXT,
  link_url TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_banners_updated_at 
    BEFORE UPDATE ON public.banners 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

-- Create policy for viewing active banners (public access)
CREATE POLICY "Anyone can view active banners" ON public.banners
    FOR SELECT USING (is_active = true);

-- Create policy for admin management (you can adjust this based on your admin setup)
CREATE POLICY "Admins can manage banners" ON public.banners
    FOR ALL USING (true);

-- Insert some sample banners
INSERT INTO public.banners (title, subtitle, image_url, link_url, is_active, display_order) VALUES
('Premium Fabrics & Materials', 'Discover our exclusive collection of high-quality fabrics', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=400&q=80', '/products', true, 1),
('New Collection Available', 'Explore the latest trends in textile industry', 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=400&q=80', '/products', true, 2);
