
import { Customer } from "@/types/customer";

export const generateCustomerName = (profile: any): string => {
  console.log('🏷️ Generating customer name for profile:', {
    id: profile.id?.substring(0, 8),
    firstName: profile.first_name,
    lastName: profile.last_name,
    email: profile.email
  });

  // First try to use first_name and last_name - prioritize this
  if (profile.first_name || profile.last_name) {
    const firstName = (profile.first_name || '').trim();
    const lastName = (profile.last_name || '').trim();
    
    if (firstName || lastName) {
      const fullName = `${firstName} ${lastName}`.trim();
      console.log(`✅ Generated name from profile: "${fullName}"`);
      return fullName;
    }
  }

  // If no name components, try to extract from email
  if (profile.email && !profile.email.startsWith('user-') && profile.email !== 'No email provided') {
    // Only process real emails, not generated ones
    const emailPrefix = profile.email.split('@')[0];
    // Remove numbers and special characters, capitalize first letter
    const cleanName = emailPrefix.replace(/[0-9._-]/g, ' ').trim();
    if (cleanName && cleanName.length > 0) {
      const capitalizedName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
      console.log(`📧 Generated name from email: "${capitalizedName}"`);
      return capitalizedName;
    }
  }

  // For generated emails (user-xxx@unknown.com) or other cases, use a simple fallback
  const fallbackName = `Customer ${profile.id?.substring(0, 8) || 'Unknown'}`;
  console.log(`🔄 Using fallback name: "${fallbackName}"`);
  return fallbackName;
};

export const processCustomerData = (userData: any): Customer => {
  const { profile, orders, hasProfile } = userData;
  
  console.log(`🔄 Processing user: ${profile.id.substring(0, 8)}, hasProfile: ${hasProfile}, orderCount: ${orders.length}`);
  console.log(`📝 Raw profile data:`, {
    firstName: profile.first_name,
    lastName: profile.last_name,
    email: profile.email,
    phone: profile.phone,
    fullProfile: profile
  });

  // Calculate order statistics
  const totalOrders = orders.length;
  const totalSpent = orders.reduce((sum: number, order: any) => sum + Number(order.total || 0), 0);
  
  // Generate customer name with enhanced debugging
  console.log(`🔍 About to generate name for profile:`, profile);
  const customerName = generateCustomerName(profile);
  console.log(`🎯 Generated customer name: "${customerName}"`);

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

  console.log('🎯 Final customer object:', {
    id: customer.id.substring(0, 8),
    name: customer.name,
    email: customer.email,
    totalOrders: customer.totalOrders,
    totalSpent: customer.totalSpent,
    status: customer.status,
    hasProfile,
    profileData: customer.profile
  });

  return customer;
};
