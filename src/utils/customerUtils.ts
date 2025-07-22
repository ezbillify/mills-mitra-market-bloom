
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

// Enhanced helper function for better value validation
const isValidValue = (value: any): boolean => {
  return value !== null && 
         value !== undefined && 
         value !== "" && 
         value !== "null" && 
         value !== "undefined" &&
         typeof value === 'string' && 
         value.trim().length > 0;
};

export const generateCustomerName = (customer: CustomerData | OrderProfile): string => {
  console.log(`🎯 generateCustomerName called for customer:`, {
    id: 'id' in customer ? customer.id?.substring(0, 8) : 'N/A',
    first_name: customer.first_name,
    last_name: customer.last_name,
    email: customer.email,
    raw_first_name: JSON.stringify(customer.first_name),
    raw_last_name: JSON.stringify(customer.last_name)
  });
  
  // Extract and validate values properly
  const firstName = customer.first_name;
  const lastName = customer.last_name;
  const email = customer.email;
  
  console.log(`🔍 Validating values - firstName: "${firstName}", lastName: "${lastName}", email: "${email}"`);
  
  // Priority 1: Full name (best customer identification)
  if (isValidValue(firstName) && isValidValue(lastName)) {
    const fullName = `${firstName.trim()} ${lastName.trim()}`;
    console.log(`✅ Customer match: Full name "${fullName}"`);
    return fullName;
  }
  
  // Priority 2: First name only
  if (isValidValue(firstName)) {
    console.log(`✅ Customer match: First name "${firstName.trim()}"`);
    return firstName.trim();
  }
  
  // Priority 3: Last name only
  if (isValidValue(lastName)) {
    console.log(`✅ Customer match: Last name "${lastName.trim()}"`);
    return lastName.trim();
  }
  
  // Priority 4: Email-based name (good fallback for customer identification)
  if (isValidValue(email) && email.includes('@') && !email.includes('unknown.com')) {
    const emailName = email.split('@')[0];
    if (emailName && emailName.length > 0) {
      console.log(`✅ Customer match: Email-derived name "${emailName}"`);
      return emailName;
    }
  }
  
  // Priority 5: Fallback with customer ID (ensures order always shows a customer)
  if ('id' in customer && customer.id) {
    const fallbackName = `Customer ${customer.id.substring(0, 8)}`;
    console.log(`🔄 Customer fallback: "${fallbackName}"`);
    return fallbackName;
  } else {
    const fallbackName = 'Unknown Customer';
    console.log(`🔄 Customer generic fallback: "${fallbackName}"`);
    return fallbackName;
  }
};

export const getCustomerEmail = (customer: CustomerData | OrderProfile): string => {
  const email = customer.email;
  return isValidValue(email) && email.includes('@') && !email.includes('unknown.com') ? email : 'No email';
};

export const getCustomerAddress = (customer: OrderProfile): string => {
  const address = customer.address;
  const city = customer.city;
  const postalCode = customer.postal_code;
  const country = customer.country;
  
  const addressParts = [];
  if (isValidValue(address)) addressParts.push(address.trim());
  if (isValidValue(city)) addressParts.push(city.trim());
  if (isValidValue(postalCode)) addressParts.push(postalCode.trim());
  if (isValidValue(country)) addressParts.push(country.trim());
  
  return addressParts.length > 0 ? addressParts.join(', ') : 'No address provided';
};

// Enhanced customer data processing for better customer-order relationships
export const processCustomerData = (userData: UserData): Customer => {
  console.log(`🔄 Processing customer data: ${userData.profile.id.substring(0, 8)}`);
  console.log('📋 Raw profile data:', {
    first_name: userData.profile.first_name,
    last_name: userData.profile.last_name,
    email: userData.profile.email,
    hasProfile: userData.hasProfile,
    source: userData.source
  });
  
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

  console.log(`✅ Customer processing completed:`, {
    id: customer.id.substring(0, 8),
    name: customer.name,
    email: customer.email,
    totalOrders: customer.totalOrders,
    totalSpent: customer.totalSpent,
    status: customer.status,
    hasCompleteProfile: !!(customer.profile?.first_name || customer.profile?.last_name),
    profile_first_name: customer.profile?.first_name,
    profile_last_name: customer.profile?.last_name
  });

  return customer;
};
