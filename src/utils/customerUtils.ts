
import { Customer } from "@/types/customer";

export const generateCustomerName = (profile: any): string => {
  console.log('🏷️ Generating customer name for profile:', {
    id: profile.id?.substring(0, 8),
    firstName: profile.first_name,
    lastName: profile.last_name,
    email: profile.email
  });

  if (profile.first_name || profile.last_name) {
    const firstName = profile.first_name?.trim() || '';
    const lastName = profile.last_name?.trim() || '';
    const fullName = `${firstName} ${lastName}`.trim();
    console.log(`✅ Generated name from profile: "${fullName}"`);
    return fullName;
  } else if (profile.email) {
    const emailPrefix = profile.email.split('@')[0];
    const capitalizedName = emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
    console.log(`📧 Generated name from email: "${capitalizedName}"`);
    return capitalizedName;
  } else {
    const fallbackName = `Customer ${profile.id?.substring(0, 8) || 'Unknown'}`;
    console.log(`🔄 Using fallback name: "${fallbackName}"`);
    return fallbackName;
  }
};

export const processCustomerData = (userData: any): Customer => {
  const { profile, orders, hasProfile } = userData;
  
  console.log(`🔄 Processing user: ${profile.id.substring(0, 8)}, hasProfile: ${hasProfile}, orderCount: ${orders.length}`);

  // Calculate order statistics
  const totalOrders = orders.length;
  const totalSpent = orders.reduce((sum: number, order: any) => sum + Number(order.total || 0), 0);
  
  // Generate customer name
  const customerName = generateCustomerName(profile);

  // Determine status based on profile existence and orders
  let status: 'active' | 'inactive' = 'inactive';
  if (hasProfile && totalOrders > 0) {
    status = 'active';
  } else if (hasProfile && totalOrders === 0) {
    status = 'inactive';
  } else if (!hasProfile && totalOrders > 0) {
    status = 'active'; // User with orders but no complete profile
  }

  const customer: Customer = {
    id: profile.id,
    name: customerName,
    email: profile.email || 'No email provided',
    phone: profile.phone || '',
    totalOrders,
    totalSpent,
    status,
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
    totalSpent: customer.totalSpent,
    status: customer.status,
    hasProfile
  });

  return customer;
};
