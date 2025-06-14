
export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalOrders: number;
  totalSpent: number;
  status: 'active' | 'inactive';
  joinDate: string;
  profile?: {
    first_name: string | null;
    last_name: string | null;
    address: string | null;
    city: string | null;
    postal_code: string | null;
    country: string | null;
  };
}
