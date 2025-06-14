
interface CustomerData {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
}

interface UserData {
  profile: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    city: string | null;
    postal_code: string | null;
    country: string | null;
    created_at: string;
  };
  orders: Array<{
    total: number;
    status: string;
    created_at: string;
  }>;
  hasProfile: boolean;
  source: string;
}

interface Customer {
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

export const generateCustomerName = (customer: CustomerData): string => {
  console.log(`🎯 generateCustomerName called with data:`, customer);
  
  // If we have both first and last name, use them
  if (customer.first_name && customer.last_name) {
    const fullName = `${customer.first_name} ${customer.last_name}`;
    console.log(`✅ Using full name: "${fullName}"`);
    return fullName;
  }
  
  // If we have just first name, use it
  if (customer.first_name) {
    console.log(`✅ Using first name only: "${customer.first_name}"`);
    return customer.first_name;
  }
  
  // If we have just last name, use it
  if (customer.last_name) {
    console.log(`✅ Using last name only: "${customer.last_name}"`);
    return customer.last_name;
  }
  
  // If we have email, use the part before @
  if (customer.email && customer.email !== 'No email provided') {
    const emailName = customer.email.split('@')[0];
    console.log(`✅ Using email-derived name: "${emailName}"`);
    return emailName;
  }
  
  // Fallback to customer ID
  const fallbackName = `Customer ${customer.id.substring(0, 8)}`;
  console.log(`🔄 Using fallback name: "${fallbackName}"`);
  return fallbackName;
};

export const getCustomerEmail = (customer: CustomerData): string => {
  return customer.email && customer.email !== 'No email provided' ? customer.email : 'No email';
};

export const processCustomerData = (userData: UserData): Customer => {
  console.log(`🔄 Processing customer data for ID: ${userData.profile.id.substring(0, 8)}`);
  
  const customerData: CustomerData = {
    id: userData.profile.id,
    first_name: userData.profile.first_name,
    last_name: userData.profile.last_name,
    email: userData.profile.email
  };

  const name = generateCustomerName(customerData);
  const email = getCustomerEmail(customerData);
  
  // Calculate order statistics
  const totalOrders = userData.orders.length;
  const totalSpent = userData.orders.reduce((sum, order) => sum + Number(order.total), 0);
  
  // Determine status based on recent activity (orders in last 90 days)
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  
  const recentOrders = userData.orders.filter(order => 
    new Date(order.created_at) > ninetyDaysAgo
  );
  
  const status: 'active' | 'inactive' = recentOrders.length > 0 ? 'active' : 'inactive';
  
  const customer: Customer = {
    id: userData.profile.id,
    name,
    email,
    phone: userData.profile.phone || '',
    totalOrders,
    totalSpent,
    status,
    joinDate: userData.profile.created_at,
    profile: {
      first_name: userData.profile.first_name,
      last_name: userData.profile.last_name,
      address: userData.profile.address,
      city: userData.profile.city,
      postal_code: userData.profile.postal_code,
      country: userData.profile.country
    }
  };

  console.log(`✅ Processed customer:`, {
    id: customer.id.substring(0, 8),
    name: customer.name,
    email: customer.email,
    totalOrders: customer.totalOrders,
    totalSpent: customer.totalSpent,
    status: customer.status
  });

  return customer;
};
