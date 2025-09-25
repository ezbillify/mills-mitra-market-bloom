import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Package, IndianRupee, Truck, CreditCard } from "lucide-react";
import { PricingUtils } from "@/utils/pricingUtils";

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  products: {
    name: string;
    image: string | null;
    description: string | null;
    gst_percentage?: number;
  };
}

interface OrderItemsCardProps {
  orderItems: OrderItem[];
  total: number;
  orderData?: {
    delivery_price?: number;
    payment_type?: string;
    shipping_address?: string;
  };
}

const OrderItemsCard = ({ orderItems, total, orderData }: OrderItemsCardProps) => {
  const calculateDetailedTotals = () => {
    if (!orderItems.length) {
      return { 
        itemsSubtotal: 0, 
        totalTax: 0, 
        shippingCost: 0, 
        codCharges: 0,
        grandTotal: Number(total)
      };
    }

    const shippingAddress = orderData?.shipping_address || '';
    const shippingCost = Number(orderData?.delivery_price || 0);
    
    const orderTotals = PricingUtils.calculateOrderTotals(
      orderItems.map(item => ({
        product: {
          price: item.price,
          discounted_price: null,
          gst_percentage: item.products?.gst_percentage || 18
        },
        quantity: item.quantity
      })),
      shippingAddress,
      shippingCost
    );

    // Calculate COD charges if payment is COD
    let codCharges = 0;
    if (orderData?.payment_type === 'cod') {
      // Assuming COD charges might be included in the total
      // You can adjust this logic based on how COD charges are calculated
      const itemsAndTaxTotal = orderTotals.totalTaxableAmount + orderTotals.totalTaxAmount + shippingCost;
      codCharges = Number(total) - itemsAndTaxTotal;
      codCharges = Math.max(0, codCharges); // Ensure non-negative
    }

    return {
      itemsSubtotal: orderTotals.totalTaxableAmount,
      totalTax: orderTotals.totalTaxAmount,
      shippingCost: orderTotals.deliveryPrice,
      codCharges,
      grandTotal: Number(total)
    };
  };

  const getShippingMethodName = () => {
    const deliveryPrice = Number(orderData?.delivery_price || 0);
    if (deliveryPrice === 0) {
      return "Free Shipping";
    } else if (deliveryPrice <= 50) {
      return "Standard Shipping";
    } else {
      return "Express Shipping";
    }
  };

  const totals = calculateDetailedTotals();
  const shippingMethodName = getShippingMethodName();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Order Items ({orderItems.length} items)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Order Items List */}
          {orderItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-4 p-4 border rounded-lg"
            >
              <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center">
                {item.products.image ? (
                  <img
                    src={item.products.image}
                    alt={item.products.name}
                    className="w-full h-full object-cover rounded"
                  />
                ) : (
                  <Package className="h-8 w-8 text-gray-400" />
                )}
              </div>
              <div className="flex-1">
                <h4 className="font-medium">{item.products.name}</h4>
                {item.products.description && (
                  <p className="text-sm text-gray-600 mt-1">
                    {item.products.description}
                  </p>
                )}
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                  <span>Quantity: {item.quantity}</span>
                  <span>Unit Price: ₹{Number(item.price).toFixed(2)}</span>
                  <span>GST: {item.products?.gst_percentage || 18}%</span>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold">₹{(item.quantity * Number(item.price)).toFixed(2)}</p>
              </div>
            </div>
          ))}

          <Separator />

          {/* Detailed Pricing Breakdown */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <IndianRupee className="h-4 w-4" />
              Order Summary
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Items Subtotal (Taxable Amount):</span>
                <span className="flex items-center gap-1">
                  <IndianRupee className="h-3 w-3" />
                  {totals.itemsSubtotal.toFixed(2)}
                </span>
              </div>
              
              {totals.totalTax > 0 && (
                <div className="flex justify-between">
                  <span>Total GST:</span>
                  <span className="flex items-center gap-1">
                    <IndianRupee className="h-3 w-3" />
                    {totals.totalTax.toFixed(2)}
                  </span>
                </div>
              )}

              {totals.shippingCost > 0 && (
                <div className="flex justify-between">
                  <span className="flex items-center gap-1">
                    <Truck className="h-3 w-3" />
                    Shipping ({shippingMethodName}):
                  </span>
                  <span className="flex items-center gap-1">
                    <IndianRupee className="h-3 w-3" />
                    {totals.shippingCost.toFixed(2)}
                  </span>
                </div>
              )}

              {totals.codCharges > 0 && (
                <div className="flex justify-between">
                  <span className="flex items-center gap-1">
                    <CreditCard className="h-3 w-3" />
                    COD Charges:
                  </span>
                  <span className="flex items-center gap-1">
                    <IndianRupee className="h-3 w-3" />
                    {totals.codCharges.toFixed(2)}
                  </span>
                </div>
              )}

              <div className="border-t pt-2 font-semibold">
                <div className="flex justify-between text-base">
                  <span>Order Total:</span>
                  <span className="flex items-center gap-1">
                    <IndianRupee className="h-4 w-4" />
                    {totals.grandTotal.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Method Info */}
            {orderData?.payment_type && (
              <div className="mt-3 pt-3 border-t">
                <div className="flex items-center gap-2 text-sm">
                  <CreditCard className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">Payment Method:</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    orderData.payment_type === 'cod' 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {orderData.payment_type === 'cod' ? 'Cash on Delivery (COD)' : 'Online Payment'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderItemsCard;