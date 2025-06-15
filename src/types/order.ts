
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

export interface Order {
  id: string;
  user_id: string;
  total: number;
  status: OrderStatus;
  created_at: string;
  shipping_address: string;
  tracking_number?: string | null;
  delivery_option_id?: string | null;
  delivery_price?: number | null;
  shipping_settings?: {
    id: string;
    name: string;
    description?: string;
    price: number;
  };
  profiles?: OrderProfile | null;
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
