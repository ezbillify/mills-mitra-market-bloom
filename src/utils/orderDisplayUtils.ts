
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
  if (!order.profiles) {
    return {
      name: `Customer ${order.user_id.substring(0, 8)}`,
      email: "No email",
      hasProfile: false
    };
  }

  const { first_name, last_name, email } = order.profiles;
  
  let name = "Customer";
  if (first_name || last_name) {
    name = `${first_name || ''} ${last_name || ''}`.trim();
  } else if (email && email.includes('@')) {
    name = email;
  } else {
    name = `Customer ${order.user_id.substring(0, 8)}`;
  }
  
  return {
    name,
    email: email && email.includes('@') ? email : 'No email',
    hasProfile: !!(first_name || last_name || (email && email.includes('@')))
  };
};
