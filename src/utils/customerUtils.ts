
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

// Enhanced helper function for better customer-order data extraction
const extractValue = (value: any): string | null => {
  // Handle actual null/undefined first
  if (value === null || value === undefined) {
    return null;
  }
  
  // Handle string representations of null/undefined
  if (value === "null" || value === "undefined") {
    return null;
  }
  
  // If it's a wrapped object with _type and value properties (from some frameworks)
  if (typeof value === 'object' && value._type && value.value !== undefined) {
    if (value._type === 'undefined' || value.value === 'undefined' || value.value === "null") {
      return null;
    }
    return value.value;
  }
  
  // For plain strings, return them if they have content, otherwise null
  return typeof value === 'string' && value.length > 0 ? value : null;
};

export const generateCustomerName = (customer: CustomerData | OrderProfile): string => {
  console.log(`🎯 generateCustomerName called for customer-order matching:`, {
    id: 'id' in customer ? customer.id?.substring(0, 8) : 'N/A',
    first_name: customer.first_name,
    last_name: customer.last_name,
    email: customer.email
  });
  
  // Extract values safely for better customer-order matching
  const firstName = extractValue(customer.first_name);
  const lastName = extractValue(customer.last_name);
  const email = extractValue(customer.email);
  
  console.log(`🔍 Enhanced extraction - firstName: ${firstName === null ? 'null' : `"${firstName}"`}, lastName: ${lastName === null ? 'null' : `"${lastName}"`}, email: ${email === null ? 'null' : `"${email}"`}`);
  
  // Priority 1: Full name (best customer identification)
  if (firstName && lastName) {
    const fullName = `${firstName} ${lastName}`;
    console.log(`✅ Customer-order match: Full name "${fullName}"`);
    return fullName;
  }
  
  // Priority 2: First name only
  if (firstName) {
    console.log(`✅ Customer-order match: First name "${firstName}"`);
    return firstName;
  }
  
  // Priority 3: Last name only
  if (lastName) {
    console.log(`✅ Customer-order match: Last name "${lastName}"`);
    return lastName;
  }
  
  // Priority 4: Email-based name (good fallback for customer identification)
  if (email && email !== 'No email provided' && !email.includes('unknown.com')) {
    const emailName = email.split('@')[0];
    console.log(`✅ Customer-order match: Email-derived name "${emailName}"`);
    return emailName;
  }
  
  // Priority 5: Fallback with customer ID (ensures order always shows a customer)
  if ('id' in customer) {
    const fallbackName = `Customer ${customer.id.substring(0, 8)}`;
    console.log(`🔄 Customer-order fallback: "${fallbackName}"`);
    return fallbackName;
  } else {
    const fallbackName = 'Unknown Customer';
    console.log(`🔄 Customer-order generic fallback: "${fallbackName}"`);
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

// Enhanced customer data processing for better customer-order relationships
export const processCustomerData = (userData: UserData): Customer => {
  console.log(`🔄 Processing customer data for enhanced customer-order matching: ${userData.profile.id.substring(0, 8)}`);
  
  const customerData: CustomerData = {
    id: userData.profile.id,
    first_name: userData.profile.first_name,
    last_name: userData.profile.last_name,
    email: userData.profile.email
  };

  const name = generateCustomerName(customerData);
  const email = getCustomerEmail(customerData);
  
  // Calculate order statistics for customer-order relationship
  const totalOrders = userData.orders.length;
  const totalSpent = userData.orders.reduce((sum, order) => sum + Number(order.total), 0);
  
  // Determine customer activity status based on recent orders
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

  console.log(`✅ Enhanced customer-order processing completed:`, {
    id: customer.id.substring(0, 8),
    name: customer.name,
    email: customer.email,
    totalOrders: customer.totalOrders,
    totalSpent: customer.totalSpent,
    status: customer.status,
    hasCompleteProfile: !!(customer.profile?.first_name || customer.profile?.last_name)
  });

  return customer;
};
