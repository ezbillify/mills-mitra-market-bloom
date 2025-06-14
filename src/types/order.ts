
export interface OrderProfile {
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone?: string | null;
}

export interface ShippingSettings {
  id: string;
  name: string;
  description: string | null;
  price: number;
}

export interface Order {
  id: string;
  user_id: string;
  total: number;
  status:
    | "pending"
    | "processing"
    | "shipped"
    | "delivered"
    | "cancelled"
    | "accepted"
    | "out_for_delivery"
    | "completed";
  created_at: string;
  shipping_address: string;
  tracking_number: string | null;
  delivery_option_id?: string | null;
  delivery_price?: number | null;
  shipping_settings?: ShippingSettings | null;
  profiles: OrderProfile | null;
}

export type OrderStatus = Order['status'];
