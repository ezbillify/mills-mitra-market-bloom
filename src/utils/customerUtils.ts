
import { Customer } from "@/types/customer";

export const generateCustomerName = (profile: any): string => {
  if (profile.first_name || profile.last_name) {
    const firstName = profile.first_name?.trim() || '';
    const lastName = profile.last_name?.trim() || '';
    return `${firstName} ${lastName}`.trim();
  } else if (profile.email) {
    const emailPrefix = profile.email.split('@')[0];
    return emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
  } else {
    return `Customer ${profile.id.substring(0, 8)}`;
  }
};

export const processCustomerData = (userData: any): Customer => {
  const { profile, orders, hasProfile } = userData;
  
  console.log(`🔄 Processing user: ${profile.id.substring(0, 8)}, hasProfile: ${hasProfile}`);

  // Calculate order statistics
  const totalOrders = orders.length;
  const totalSpent = orders.reduce((sum: number, order: any) => sum + Number(order.total || 0), 0);
  
  // Generate customer name
  const customerName = generateCustomerName(profile);

  const customer: Customer = {
    id: profile.id,
    name: customerName,
    email: profile.email || 'No email provided',
    phone: profile.phone || '',
    totalOrders,
    totalSpent,
    status: (totalOrders > 0 ? 'active' : 'inactive') as 'active' | 'inactive',
    joinDate: profile.created_at,
    profile: hasProfile ? {
      first_name: profile.first_name,
      last_name: profile.last_name,
      address: profile.address,
      city: profile.city,
      postal_code: profile.postal_code,
      country: profile.country
    } : undefined
  };

  console.log('🎯 Generated customer:', {
    id: customer.id.substring(0, 8),
    name: customer.name,
    email: customer.email,
    totalOrders: customer.totalOrders,
    hasProfile
  });

  return customer;
};
