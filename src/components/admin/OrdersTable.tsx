
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, Truck, Bug, User, UserCheck, IndianRupee } from "lucide-react";
import { Order } from "@/types/order";
import { generateCustomerName } from "@/utils/customerUtils";
import { DebugUtils } from "@/utils/debugUtils";
import { PricingUtils } from "@/utils/pricingUtils";

interface OrdersTableProps {
  orders: Order[];
  onUpdateStatus: (orderId: string, newStatus: "pending" | "processing" | "shipped" | "delivered" | "cancelled" | "accepted" | "out_for_delivery" | "completed") => void;
  onViewDetails: (orderId: string) => void;
}

// Helper function to validate if a value contains actual data
const hasValidData = (value: any): boolean => {
  return value !== null && 
         value !== undefined && 
         value !== "" && 
         value !== "null" && 
         value !== "undefined" &&
         typeof value === 'string' && 
         value.trim().length > 0;
};

// Helper function to check if profile has complete data
const hasCompleteProfileData = (profiles: any): boolean => {
  if (!profiles) return false;
  
  return hasValidData(profiles.first_name) || 
         hasValidData(profiles.last_name) || 
         (hasValidData(profiles.email) && profiles.email.includes('@') && !profiles.email.includes('unknown.com'));
};

const OrdersTable = ({ orders, onUpdateStatus, onViewDetails }: OrdersTableProps) => {
  DebugUtils.log("OrdersTable", `🔥 Enhanced customer-order display: Received ${orders.length} orders`);
  
  // Enhanced customer-order analysis with better profile detection
  const ordersWithProfiles = orders.filter(order => hasCompleteProfileData(order.profiles));
  const ordersWithoutProfiles = orders.filter(order => !hasCompleteProfileData(order.profiles));
  
  DebugUtils.log("OrdersTable", `📊 Customer-order breakdown: ${ordersWithProfiles.length} with valid profiles, ${ordersWithoutProfiles.length} without valid profiles`);

  const getStatusBadge = (status: string) => {
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
    
    const config = variants[status] || { variant: "default" as const, className: "bg-gray-100 text-gray-700" };
    
    return (
      <Badge variant={config.variant} className={config.className}>
        {status.replace("_", " ").toUpperCase()}
      </Badge>
    );
  };

  const getShippingMethod = (order: Order) => {
    DebugUtils.log("OrdersTable", `🚚 Getting shipping method for order ${order.id.substring(0, 8)}`);
    
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

  // Enhanced customer info extraction with proper validation
  const getCustomerInfo = (order: Order) => {
    console.log(`🔍 Getting customer info for order ${order.id.substring(0, 8)}:`, {
      profiles: order.profiles,
      user_id: order.user_id.substring(0, 8),
      hasProfiles: !!order.profiles,
      profilesKeys: order.profiles ? Object.keys(order.profiles) : []
    });
    
    // Create customer data object for generateCustomerName
    const customerData = {
      id: order.user_id,
      first_name: order.profiles?.first_name || null,
      last_name: order.profiles?.last_name || null,
      email: order.profiles?.email || null
    };
    
    console.log(`📋 Customer data being passed to generateCustomerName:`, {
      ...customerData,
      first_name_valid: hasValidData(customerData.first_name),
      last_name_valid: hasValidData(customerData.last_name),
      email_valid: hasValidData(customerData.email)
    });
    
    const customerName = generateCustomerName(customerData);
    
    // Enhanced email validation
    const customerEmail = hasValidData(order.profiles?.email) && 
                         order.profiles.email.includes('@') && 
                         !order.profiles.email.includes('unknown.com') 
                         ? order.profiles.email 
                         : 'No email';
    
    // Better profile completeness check
    const hasCompleteProfile = hasCompleteProfileData(order.profiles);
    
    console.log(`✅ Generated customer info:`, {
      customerName,
      customerEmail,
      hasCompleteProfile,
      profileData: {
        first_name: order.profiles?.first_name,
        last_name: order.profiles?.last_name,
        email: order.profiles?.email
      }
    });
    
    return { customerName, customerEmail, hasCompleteProfile };
  };

  // Enhanced pricing calculation for admin view
  const getOrderPricing = (order: Order) => {
    // For now, we'll use the stored total from the order
    // In a future enhancement, we could fetch order items and recalculate
    const orderTotal = Number(order.total) || 0;
    const shippingCost = Number(order.delivery_price || 0);
    
    // Calculate approximate breakdown
    const totalWithoutShipping = orderTotal - shippingCost;
    const approximateTaxRate = 0.18; // 18% GST as default
    const approximateSubtotal = totalWithoutShipping / (1 + approximateTaxRate);
    const approximateTax = totalWithoutShipping - approximateSubtotal;
    
    return {
      subtotal: approximateSubtotal,
      tax: approximateTax,
      shipping: shippingCost,
      total: orderTotal
    };
  };

  if (orders.length === 0) {
    return (
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-white to-gray-50">
          <CardTitle className="text-royal-green">Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Eye className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-gray-700 text-lg">No orders found</p>
            <p className="text-gray-500 text-sm mt-2">Orders will appear here once customers start placing them.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  DebugUtils.log("OrdersTable", `📋 Rendering enhanced customer-order table with ${orders.length} orders`);

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-white to-gray-50">
        <CardTitle className="text-royal-green flex items-center gap-2">
          Recent Orders ({orders.length})
          <div className="flex items-center gap-2 text-sm font-normal">
            <UserCheck className="h-4 w-4 text-green-600" />
            <span className="text-green-600">{ordersWithProfiles.length} with complete profiles</span>
            <User className="h-4 w-4 text-orange-600" />
            <span className="text-orange-600">{ordersWithoutProfiles.length} incomplete profiles</span>
          </div>
          {DebugUtils.isDebugEnabled() && (
            <Bug className="h-4 w-4 text-red-500" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-200 bg-gray-50">
                <TableHead className="text-gray-700 font-semibold">Order ID</TableHead>
                <TableHead className="text-gray-700 font-semibold">Customer Info</TableHead>
                <TableHead className="text-gray-700 font-semibold">Email</TableHead>
                <TableHead className="text-gray-700 font-semibold">Shipping Method</TableHead>
                <TableHead className="text-gray-700 font-semibold">Order Value</TableHead>
                <TableHead className="text-gray-700 font-semibold">Status</TableHead>
                <TableHead className="text-gray-700 font-semibold">Date</TableHead>
                <TableHead className="text-gray-700 font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order, index) => {
                DebugUtils.log("OrdersTable", `🎨 Rendering customer-order row ${index + 1} for order ${order.id.substring(0, 8)}`);
                
                const { customerName, customerEmail, hasCompleteProfile } = getCustomerInfo(order);
                const shippingInfo = getShippingMethod(order);
                const pricing = getOrderPricing(order);
                
                DebugUtils.log("OrdersTable", `✨ Customer-order display data for row ${index + 1}:`, {
                  orderID: order.id.substring(0, 8),
                  customerName,
                  customerEmail,
                  hasCompleteProfile,
                  shippingMethod: shippingInfo.name,
                  profileDataAvailable: !!order.profiles,
                  profileDataValid: hasCompleteProfileData(order.profiles),
                  pricing
                });
                
                return (
                  <TableRow key={order.id} className="border-gray-200 hover:bg-gray-50 transition-colors">
                    <TableCell className="font-mono text-sm text-royal-green bg-gray-50 rounded-md m-1 px-3 py-2">
                      #{order.id.slice(0, 8)}
                      {DebugUtils.isDebugEnabled() && (
                        <div className="text-xs mt-1">
                          {!order.profiles && <span className="text-red-500">NO PROFILE</span>}
                          {order.profiles && !hasCompleteProfile && <span className="text-orange-500">INCOMPLETE</span>}
                          {order.profiles && hasCompleteProfile && <span className="text-green-500">COMPLETE</span>}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {hasCompleteProfile ? (
                          <UserCheck className="h-4 w-4 text-green-600" />
                        ) : (
                          <User className="h-4 w-4 text-orange-600" />
                        )}
                        <div>
                          <div className="font-medium text-gray-900">{customerName}</div>
                          {DebugUtils.isDebugEnabled() && (
                            <div className="text-xs text-gray-500">
                              User: {order.user_id.substring(0, 8)} | Profile: {hasCompleteProfile ? 'Complete' : 'Incomplete'}
                              {order.profiles && (
                                <div className="text-xs text-blue-600">
                                  F: "{order.profiles.first_name || 'null'}" | L: "{order.profiles.last_name || 'null'}" | E: "{order.profiles.email || 'null'}"
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-600">{customerEmail}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4 text-gray-500" />
                        <div>
                          <div className="font-medium text-gray-900">{shippingInfo.name}</div>
                          {shippingInfo.price > 0 && (
                            <div className="text-xs text-gray-500 flex items-center gap-1">
                              <IndianRupee className="h-3 w-3" />
                              {PricingUtils.formatPrice(shippingInfo.price)}
                            </div>
                          )}
                          {shippingInfo.price === 0 && shippingInfo.name.includes("Free") && (
                            <div className="text-xs text-green-600 font-medium">
                              Free
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-bold text-royal-green text-lg flex items-center gap-1">
                          <IndianRupee className="h-4 w-4" />
                          {PricingUtils.formatPrice(pricing.total)}
                        </div>
                        <div className="text-xs text-gray-500 space-y-1">
                          <div className="flex justify-between items-center gap-2">
                            <span>Subtotal:</span>
                            <span className="flex items-center gap-1">
                              <IndianRupee className="h-3 w-3" />
                              {PricingUtils.formatPrice(pricing.subtotal)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center gap-2">
                            <span>Tax (~18%):</span>
                            <span className="flex items-center gap-1">
                              <IndianRupee className="h-3 w-3" />
                              {PricingUtils.formatPrice(pricing.tax)}
                            </span>
                          </div>
                          {pricing.shipping > 0 && (
                            <div className="flex justify-between items-center gap-2">
                              <span>Shipping:</span>
                              <span className="flex items-center gap-1">
                                <IndianRupee className="h-3 w-3" />
                                {PricingUtils.formatPrice(pricing.shipping)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell className="text-gray-600">
                      {new Date(order.created_at).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onViewDetails(order.id)}
                        className="border-royal-green/30 text-royal-green hover:bg-royal-green hover:text-white transition-all duration-200 shadow-sm"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrdersTable;
