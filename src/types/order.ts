export interface OrderProfile {
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  address?: string | null;
  city?: string | null;
  postal_code?: string | null;
  country?: string | null;
}

export interface PromoCode {
  id: string;
  code: string;
  description: string | null;
  discount_type: string;
  discount_value: number;
}

export interface Order {
  id: string;
  user_id: string;
  total: number;
  status: OrderStatus;
  created_at: string;
  updated_at?: string;
  shipping_address: string;
  tracking_number?: string | null;
  delivery_option_id?: string | null;
  delivery_price?: number | null;
  shipping_settings?: {
    id: string;
    name: string;
    description?: string;
    price: number;
  } | null;
  profiles?: OrderProfile | null;
  payment_type?: string; // 'cod' or 'razorpay'
  payment_status?: string; // 'pending', 'completed', 'failed'
  payment_id?: string | null; // Payment transaction ID
  razorpay_order_id?: string | null; // RazorPay order ID
  payment_verified_at?: string | null; // Timestamp when payment was verified
  // Promo code fields
  promo_code_id?: string | null;
  discount_amount?: number;
  promo_codes?: PromoCode | null;
}

export type OrderStatus = 
  | "pending"
  | "processing" 
  | "shipped"
  | "delivered"
  | "cancelled"
  | "accepted"
  | "out_for_delivery"
  | "completed";