export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  display_order: number;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  discounted_price: number | null;
  gst_percentage: number | null;
  selling_price_with_tax: number | null;
  image: string | null; // Keep for backward compatibility
  category: string;
  stock: number;
  featured: boolean;
  description: string | null;
  hsn_code: string | null;
  price_includes_tax: boolean | null;
  created_at: string;
  updated_at: string;
  // New field for multiple images
  product_images?: ProductImage[];
  [key: string]: any; // Allow extra properties if they exist
}
