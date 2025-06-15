
interface CustomerData {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
}

interface OrderProfile {
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  postal_code?: string | null;
  country?: string | null;
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

// Helper function to safely extract value from potentially wrapped objects
const extractValue = (value: any): string | null => {
  if (value === null || value === undefined) {
    return null;
  }
  
  // If it's a wrapped object with _type and value properties
  if (typeof value === 'object' && value._type && value.value !== undefined) {
    if (value._type === 'undefined' || value.value === 'undefined') {
      return null;
    }
    return value.value;
  }
  
  // If it's a plain string or null
  return typeof value === 'string' ? value : null;
};

export const generateCustomerName = (customer: CustomerData | OrderProfile): string => {
  console.log(`🎯 generateCustomerName called with data:`, customer);
  
  // Extract values safely, handling both wrapped and unwrapped formats
  const firstName = extractValue(customer.first_name);
  const lastName = extractValue(customer.last_name);
  const email = extractValue(customer.email);
  
  console.log(`🔍 Extracted values - firstName: "${firstName}", lastName: "${lastName}", email: "${email}"`);
  
  // If we have both first and last name, use them
  if (firstName && lastName) {
    const fullName = `${firstName} ${lastName}`;
    console.log(`✅ Using full name: "${fullName}"`);
    return fullName;
  }
  
  // If we have just first name, use it
  if (firstName) {
    console.log(`✅ Using first name only: "${firstName}"`);
    return firstName;
  }
  
  // If we have just last name, use it
  if (lastName) {
    console.log(`✅ Using last name only: "${lastName}"`);
    return lastName;
  }
  
  // If we have email, use the part before @
  if (email && email !== 'No email provided' && !email.includes('unknown.com')) {
    const emailName = email.split('@')[0];
    console.log(`✅ Using email-derived name: "${emailName}"`);
    return emailName;
  }
  
  // Fallback - for CustomerData use ID, for OrderProfile use generic fallback
  if ('id' in customer) {
    const fallbackName = `Customer ${customer.id.substring(0, 8)}`;
    console.log(`🔄 Using fallback name: "${fallbackName}"`);
    return fallbackName;
  } else {
    const fallbackName = 'Unknown Customer';
    console.log(`🔄 Using generic fallback name: "${fallbackName}"`);
    return fallbackName;
  }
};

export const getCustomerEmail = (customer: CustomerData | OrderProfile): string => {
  const email = extractValue(customer.email);
  return email && email !== 'No email provided' && !email.includes('unknown.com') ? email : 'No email';
};

export const getCustomerAddress = (customer: OrderProfile): string => {
  const address = extractValue(customer.address);
  const city = extractValue(customer.city);
  const postalCode = extractValue(customer.postal_code);
  const country = extractValue(customer.country);
  
  if (!address && !city) {
    return 'No address provided';
  }
  
  const addressParts = [];
  if (address) addressParts.push(address);
  if (city) addressParts.push(city);
  if (postalCode) addressParts.push(postalCode);
  if (country) addressParts.push(country);
  
  return addressParts.join(', ') || 'No address provided';
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
    status: customer.status,
    hasAddress: !!(customer.profile?.address || customer.profile?.city)
  });

  return customer;
};
