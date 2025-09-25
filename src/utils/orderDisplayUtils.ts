import { Order } from "@/types/order";

export const getStatusBadgeConfig = (status: string) => {
  const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", className: string }> = {
    pending: { variant: "outline", className: "border-orange-200 text-orange-700 bg-orange-50" },
    processing: { variant: "default", className: "bg-blue-100 text-blue-700 border-blue-200" },
    shipped: { variant: "secondary", className: "bg-purple-100 text-purple-700 border-purple-200" },
    delivered: { variant: "default", className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
    accepted: { variant: "default", className: "bg-green-100 text-green-700 border-green-200" },
    out_for_delivery: { variant: "secondary", className: "bg-indigo-100 text-indigo-700 border-indigo-200" },
    completed: { variant: "default", className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
    cancelled: { variant: "destructive", className: "bg-red-100 text-red-700 border-red-200" }
  };
  
  return variants[status] || { variant: "default" as const, className: "bg-gray-100 text-gray-700" };
};

export const getShippingMethodInfo = (order: Order) => {
  // Handle case where shipping_settings might not be available due to removed relationship
  if (order.shipping_settings && order.shipping_settings.name) {
    return {
      name: order.shipping_settings.name,
      price: order.delivery_price || order.shipping_settings.price
    };
  }
  
  if (order.delivery_price !== null && order.delivery_price !== undefined) {
    if (order.delivery_price === 0) {
      return { name: "Free Shipping", price: 0 };
    } else {
      return { name: "Paid Shipping", price: order.delivery_price };
    }
  }
  
  return { name: "Standard Shipping", price: 0 };
};

export const getCustomerDisplayInfo = (order: Order) => {
  const profile = order.profiles;
  const addressData = (order as any).address_data; // Address fallback data
  
  // Build customer name with priority: Profile name → Address name → Email username → Customer ID
  let name = "Customer";
  let hasProfile = false;
  
  if (profile?.first_name || profile?.last_name) {
    name = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
    hasProfile = true;
  } else if (addressData?.first_name || addressData?.last_name) {
    // Fallback to address data
    name = `${addressData.first_name || ''} ${addressData.last_name || ''}`.trim();
    hasProfile = true; // Consider address data as having profile info
  } else if (profile?.email && profile.email.includes('@')) {
    name = profile.email.split('@')[0]; // Use part before @ as display name
    hasProfile = true;
  } else if (profile?.email && profile.email.includes('@')) {
    name = profile.email;
    hasProfile = true;
  } else {
    // Last resort: try to extract name from known email patterns or use customer ID
    name = `Customer ${order.user_id.substring(0, 8)}`;
    hasProfile = false;
  }
  
  // Determine email with priority: Profile → Fallback
  let email = "No email";
  if (profile?.email && profile.email.includes('@')) {
    email = profile.email;
  } else {
    // For orders we know have emails, provide fallback based on user patterns
    // This is a temporary solution until we can fetch auth emails
    email = "Email not in profile";
  }
  
  // A profile is considered "complete" if we have name info from either profile or address
  const hasCompleteProfile = !!(
    (profile?.first_name || profile?.last_name) || 
    (addressData?.first_name || addressData?.last_name) ||
    (profile?.email && profile.email.includes('@'))
  );
  
  return {
    name,
    email,
    hasProfile: hasCompleteProfile
  };
};