
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { IndianRupee } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { TaxCalculator } from "@/utils/taxCalculator";

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  products: {
    id: string;
    name: string;
    description: string | null;
    price: number;
    discounted_price: number | null;
    gst_percentage: number | null;
    selling_price_with_tax: number | null;
    image: string | null;
    category: string;
    hsn_code: string | null;
  };
}

interface OrderItemTableProps {
  orderId: string;
}

const OrderItemTable = ({ orderId }: OrderItemTableProps) => {
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [shippingAddress, setShippingAddress] = useState<string>("");

  useEffect(() => {
    const fetchOrderItems = async () => {
      setLoading(true);

      // First fetch the order to get shipping address for tax calculation
      const { data: orderData } = await supabase
        .from("orders")
        .select("shipping_address")
        .eq("id", orderId)
        .single();

      if (orderData) {
        setShippingAddress(orderData.shipping_address);
      }

      // Then fetch order items
      const { data, error } = await supabase
        .from("order_items")
        .select(`
          id,
          quantity,
          price,
          products (
            id,
            name,
            description,
            price,
            discounted_price,
            gst_percentage,
            selling_price_with_tax,
            image,
            category,
            hsn_code
          )
        `)
        .eq("order_id", orderId);

      if (error) {
        console.error("Error fetching order items:", error);
      } else {
        setOrderItems(data || []);
      }
      setLoading(false);
    };

    if (orderId) {
      fetchOrderItems();
    }
  }, [orderId]);

  const calculateItemTotals = (item: OrderItem) => {
    const gstPercentage = item.products.gst_percentage || 18;
    const basePrice = item.products.discounted_price || item.products.price;
    const itemTotal = basePrice * item.quantity;
    
    // Calculate proper tax breakdown
    const taxBreakdown = TaxCalculator.calculateTaxBreakdown(itemTotal, gstPercentage, shippingAddress);
    
    return {
      basePrice,
      itemTotal,
      taxableAmount: taxBreakdown.taxableAmount,
      totalTax: taxBreakdown.totalTax,
      finalAmount: taxBreakdown.taxableAmount + taxBreakdown.totalTax,
      cgst: taxBreakdown.cgst || 0,
      sgst: taxBreakdown.sgst || 0,
      igst: taxBreakdown.igst || 0,
      discountPerItem: item.products.discounted_price ? (item.products.price - item.products.discounted_price) : 0
    };
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Order Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Loading order items...</div>
        </CardContent>
      </Card>
    );
  }

  if (orderItems.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Order Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">No items found for this order.</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IndianRupee className="h-5 w-5" />
          Order Items
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {orderItems.map((item) => {
            const itemTotals = calculateItemTotals(item);
            
            return (
              <div key={item.id} className="border rounded-lg p-4">
                <div className="flex items-start gap-4">
                  <img
                    src={item.products.image || "/placeholder.svg"}
                    alt={item.products.name}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <h4 className="font-semibold">{item.products.name}</h4>
                    <Badge variant="secondary" className="mt-1 mb-2">
                      {item.products.category}
                    </Badge>
                    {item.products.description && (
                      <p className="text-sm text-gray-600 mb-2">{item.products.description}</p>
                    )}
                    
                    {/* HSN Code */}
                    {item.products.hsn_code && (
                      <p className="text-xs text-gray-500 mb-2">
                        HSN: {item.products.hsn_code}
                      </p>
                    )}

                    {/* Price Breakdown */}
                    <div className="bg-gray-50 p-3 rounded-md">
                      <h5 className="text-sm font-semibold mb-2">Price Details</h5>
                      <div className="space-y-1 text-sm">
                        {item.products.discounted_price ? (
                          <>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Original Price:</span>
                              <span className="line-through text-gray-500 flex items-center gap-1">
                                <IndianRupee className="h-3 w-3" />
                                {Number(item.products.price).toFixed(2)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Discounted Price:</span>
                              <span className="text-green-600 flex items-center gap-1">
                                <IndianRupee className="h-3 w-3" />
                                {Number(item.products.discounted_price).toFixed(2)}
                              </span>
                            </div>
                            <div className="flex justify-between text-green-600">
                              <span>You saved:</span>
                              <span className="flex items-center gap-1">
                                <IndianRupee className="h-3 w-3" />
                                {(itemTotals.discountPerItem * item.quantity).toFixed(2)}
                              </span>
                            </div>
                          </>
                        ) : (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Base Price:</span>
                            <span className="flex items-center gap-1">
                              <IndianRupee className="h-3 w-3" />
                              {itemTotals.basePrice.toFixed(2)}
                            </span>
                          </div>
                        )}
                        
                        <div className="flex justify-between">
                          <span className="text-gray-600">Quantity:</span>
                          <span>{item.quantity}</span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-gray-600">Subtotal (Taxable):</span>
                          <span className="flex items-center gap-1">
                            <IndianRupee className="h-3 w-3" />
                            {itemTotals.taxableAmount.toFixed(2)}
                          </span>
                        </div>
                        
                        {/* Tax Details */}
                        <div className="border-t pt-1 mt-1">
                          <div className="flex justify-between text-xs text-gray-600">
                            <span>GST ({item.products.gst_percentage || 18}%):</span>
                            <span className="flex items-center gap-1">
                              <IndianRupee className="h-3 w-3" />
                              {itemTotals.totalTax.toFixed(2)}
                            </span>
                          </div>
                          
                          {/* Show CGST/SGST or IGST breakdown */}
                          {itemTotals.cgst > 0 && itemTotals.sgst > 0 ? (
                            <>
                              <div className="flex justify-between text-xs text-gray-500 ml-2">
                                <span>CGST:</span>
                                <span className="flex items-center gap-1">
                                  <IndianRupee className="h-2 w-2" />
                                  {itemTotals.cgst.toFixed(2)}
                                </span>
                              </div>
                              <div className="flex justify-between text-xs text-gray-500 ml-2">
                                <span>SGST:</span>
                                <span className="flex items-center gap-1">
                                  <IndianRupee className="h-2 w-2" />
                                  {itemTotals.sgst.toFixed(2)}
                                </span>
                              </div>
                            </>
                          ) : (
                            <div className="flex justify-between text-xs text-gray-500 ml-2">
                              <span>IGST:</span>
                              <span className="flex items-center gap-1">
                                <IndianRupee className="h-2 w-2" />
                                {itemTotals.igst.toFixed(2)}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        <div className="border-t pt-1 mt-1 font-semibold">
                          <div className="flex justify-between">
                            <span>Total Amount:</span>
                            <span className="text-primary flex items-center gap-1">
                              <IndianRupee className="h-3 w-3" />
                              {itemTotals.finalAmount.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderItemTable;
