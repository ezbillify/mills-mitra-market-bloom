
import { Customer } from "@/types/customer";

export const generateCustomerName = (profile: any): string => {
  console.log('🎯 generateCustomerName called with profile:', {
    profile,
    profileType: typeof profile,
    profileId: profile?.id?.substring(0, 8),
    firstName: profile?.first_name,
    lastName: profile?.last_name,
    email: profile?.email
  });

  const rawFirstName = profile.first_name;
  const rawLastName = profile.last_name;

  console.log('📋 Raw name data:', { rawFirstName, rawLastName });

  // First priority: use first_name and last_name from profile
  if (rawFirstName || rawLastName) {
    const firstName = (rawFirstName || '').trim();
    const lastName = (rawLastName || '').trim();
    
    console.log('✅ Using first/last name strategy:', { firstName, lastName });
    
    if (firstName || lastName) {
      const fullName = `${firstName} ${lastName}`.trim();
      console.log('🎉 Generated name from first/last:', fullName);
      return fullName;
    }
  }

  // Second priority: extract name from email (only for real emails)
  const rawEmail = profile.email;
  console.log('📧 Trying email strategy with:', rawEmail);
  
  if (rawEmail && typeof rawEmail === 'string' && !rawEmail.startsWith('user-') && rawEmail !== 'No email provided') {
    const emailPrefix = rawEmail.split('@')[0];
    console.log('📧 Email prefix:', emailPrefix);
    
    // Clean up email prefix - remove numbers and special characters
    const cleanName = emailPrefix.replace(/[0-9._-]/g, ' ').trim();
    console.log('🧹 Cleaned email name:', cleanName);
    
    if (cleanName && cleanName.length > 2) {
      // Capitalize first letter of each word
      const capitalizedName = cleanName.split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
      console.log('🎉 Generated name from email:', capitalizedName);
      return capitalizedName;
    }
  }

  // Fallback: use a simple customer identifier
  const fallbackName = `Customer ${profile.id?.substring(0, 8) || 'Unknown'}`;
  console.log('🔄 Using fallback name:', fallbackName);
  return fallbackName;
};

export const processCustomerData = (userData: any): Customer => {
  const { profile, orders, hasProfile } = userData;
  
  console.log(`🔄 Processing customer data for user: ${profile.id.substring(0, 8)}, hasProfile: ${hasProfile}, orderCount: ${orders.length}`);

  // Calculate order statistics
  const totalOrders = orders.length;
  const totalSpent = orders.reduce((sum: number, order: any) => sum + Number(order.total || 0), 0);
  
  // Generate customer name
  const customerName = generateCustomerName(profile);

  // Determine status based on profile existence and recent orders
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

  console.log('✅ Processed customer result:', {
    id: customer.id.substring(0, 8),
    name: customer.name,
    email: customer.email,
    status: customer.status
  });

  return customer;
};
