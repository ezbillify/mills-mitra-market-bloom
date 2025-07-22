
-- Create a table for invoice settings
CREATE TABLE public.invoice_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL DEFAULT 'Your Company Name',
  company_address TEXT NOT NULL DEFAULT '123 Business Street, City, State 12345',
  company_phone TEXT NOT NULL DEFAULT '+91 9876543210',
  company_email TEXT NOT NULL DEFAULT 'info@yourcompany.com',
  gst_number TEXT NOT NULL DEFAULT '22AAAAA0000A1Z5',
  fssai_number TEXT,
  pan_number TEXT,
  invoice_prefix TEXT NOT NULL DEFAULT 'INV',
  invoice_counter INTEGER NOT NULL DEFAULT 1,
  terms_and_conditions TEXT DEFAULT 'Thank you for your business!',
  bank_name TEXT,
  account_number TEXT,
  ifsc_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.invoice_settings ENABLE ROW LEVEL SECURITY;

-- Create policy for admin access only
CREATE POLICY "Only admins can manage invoice settings" 
  ON public.invoice_settings 
  FOR ALL 
  USING (public.is_admin());

-- Insert default settings
INSERT INTO public.invoice_settings (
  company_name, 
  company_address, 
  company_phone, 
  company_email, 
  gst_number,
  invoice_prefix,
  invoice_counter,
  terms_and_conditions
) VALUES (
  'Your Company Name',
  '123 Business Street, City, State 12345',
  '+91 9876543210',
  'info@yourcompany.com',
  '22AAAAA0000A1Z5',
  'INV',
  1,
  'Thank you for your business! Please make payment within 30 days of invoice date.'
);

-- Create trigger to update the updated_at column
CREATE TRIGGER update_invoice_settings_updated_at
  BEFORE UPDATE ON public.invoice_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
