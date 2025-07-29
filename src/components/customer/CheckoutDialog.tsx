import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // ADD THIS IMPORT
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { IndianRupee, MapPin, Plus } from "lucide-react";
import { PricingUtils } from "@/utils/pricingUtils";
import { useCashfree } from "@/hooks/useCashfree";
import AddressManager from "./AddressManager";

interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  products: {
    id: string;
    name: string;
    price: number;
    discounted_price?: number | null;
    gst_percentage?: number | null;
  };
}

interface DeliveryOption {
  id: string;
  name: string;
  description: string | null;
  price: number;
  estimated_days_min: number | null;
  estimated_days_max: number | null;
  is_active: boolean;
}

interface CheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cartItems: CartItem[];
  total: number;
  onOrderComplete: () => void;
}

const CheckoutDialog = ({ open, onOpenChange, cartItems, total, onOrderComplete }: CheckoutDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [shippingOptions, setShippingOptions] = useState<DeliveryOption[]>([]);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate(); // ADD THIS LINE
  const { initiatePayment, loading: cashfreeLoading } = useCashfree();
  
  const [formData, setFormData] = useState({
    address: "",
    city: "",
    state: "",
    postalCode: "",
    phone: "",
    paymentMethod: "cod",
    shippingOptionId: "",
  });

  const [selectedAddress, setSelectedAddress] = useState<any>(null);
  const [addressTab, setAddressTab] = useState("saved");

  // Fetch user profile and shipping options when dialog opens
  useEffect(() => {
    if (open && user) {
      fetchUserProfile();
      fetchShippingOptions();
    }
  }, [open, user]);

  const fetchShippingOptions = async () => {
    try {
      console.log('Fetching shipping options...');
      const { data, error } = await supabase
        .from('delivery_options')
        .select('*')
        .eq('is_active', true)
        .order('price', { ascending: true });

      if (error) {
        console.error('Error fetching shipping options:', error);
        return;
      }

      console.log('Fetched shipping options:', data);
      setShippingOptions(data || []);
      
      if (data && data.length > 0) {
        setFormData(prev => ({ ...prev, shippingOptionId: data[0].id }));
      }
    } catch (error) {
      console.error('Error fetching shipping options:', error);
    }
  };

  const fetchUserProfile = async () => {
    if (!user) return;
    
    setLoadingProfile(true);
    try {
      // Fetch default address from addresses table
      const { data: defaultAddress, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_default', true)
        .single();

      if (!error && defaultAddress) {
        setSelectedAddress(defaultAddress);
        setAddressTab("saved");
      } else {
        // Fallback to profile data if no saved addresses
        const { data: profile } = await supabase
          .from('profiles')
          .select('address, city, state, postal_code, phone')
          .eq('id', user.id)
          .single();

        if (profile && (profile.address || profile.city || profile.postal_code)) {
          setFormData(prev => ({
            ...prev,
            address: profile.address || "",
            city: profile.city || "",
            state: profile.state || "",
            postalCode: profile.postal_code || "",
            phone: profile.phone || "",
          }));
          setAddressTab("manual");
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoadingProfile(false);
    }
  };

  // Calculate order totals using centralized pricing
  const getShippingAddress = () => {
    if (selectedAddress && addressTab === "saved") {
      const parts = [selectedAddress.address_line_1];
      if (selectedAddress.address_line_2) parts.push(selectedAddress.address_line_2);
      parts.push(`${selectedAddress.city}, ${selectedAddress.state} ${selectedAddress.postal_code}`);
      return parts.join(', ');
    }
    return `${formData.address}, ${formData.city}, ${formData.state} - ${formData.postalCode}`;
  };
  
  const shippingAddress = getShippingAddress();
  const selectedShippingOption = shippingOptions.find(option => option.id === formData.shippingOptionId);
  const shippingPrice = selectedShippingOption?.price || 0;
  
  const orderTotals = PricingUtils.calculateOrderTotals(
    cartItems.map(item => ({
      product: item.products,
      quantity: item.quantity
    })),
    shippingAddress,
    shippingPrice
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);

    try {
      // Create order first
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          total: orderTotals.grandTotal,
          status: 'pending',
          shipping_address: shippingAddress,
          delivery_option_id: formData.shippingOptionId,
          delivery_price: shippingPrice,
          payment_type: formData.paymentMethod,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items with proper pricing
      const orderItems = cartItems.map(item => {
        const itemPricing = PricingUtils.calculateProductPrice(item.products, 1);
        return {
          order_id: order.id,
          product_id: item.product_id,
          quantity: item.quantity,
          price: itemPricing.discountedPrice,
        };
      });

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Handle payment based on method
      if (formData.paymentMethod === 'cashfree') {
        // Get user profile for customer info
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name, last_name, email, phone')
          .eq('id', user.id)
          .single();

        const customerName = profile?.first_name && profile?.last_name 
          ? `${profile.first_name} ${profile.last_name}`
          : profile?.email || 'Customer';

        // Validate phone number for Cashfree (required)
        const phoneNumber = formData.phone || profile?.phone;
        if (!phoneNumber) {
          throw new Error('Phone number is required for online payment');
        }

        await initiatePayment({
          amount: orderTotals.grandTotal,
          orderId: order.id,
          customerInfo: {
            name: customerName,
            email: profile?.email || user.email || '',
            phone: phoneNumber,
          },
          onSuccess: async (paymentId: string) => {
            // Clear cart after successful payment
            await supabase.from('cart_items').delete().eq('user_id', user.id);
            
            // CLOSE DIALOG FIRST
            onOpenChange(false);
            
            // NAVIGATE TO SUCCESS PAGE
            navigate('/payment-success');
            
            // Call onOrderComplete to refresh cart count
            onOrderComplete();
          },
          onFailure: (error: any) => {
            console.error('Payment failed:', error);
            // Order remains in pending state for manual review
          },
        });
      } else {
        // COD - complete the order
        // Clear cart
        const { error: cartError } = await supabase
          .from('cart_items')
          .delete()
          .eq('user_id', user.id);

        if (cartError) throw cartError;

        toast({
          title: "Order placed successfully!",
          description: `Your order has been placed. Order ID: ${order.id.slice(0, 8)}`,
        });

        onOrderComplete();
        onOpenChange(false);
      }
      
      // Reset form
      setFormData({
        address: "",
        city: "",
        state: "",
        postalCode: "",
        phone: "",
        paymentMethod: "cod",
        shippingOptionId: "",
      });
    } catch (error) {
      console.error('Error creating order:', error);
      toast({
        title: "Error",
        description: "Failed to place order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Complete Your Order</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {cartItems.map((item) => {
                const itemPricing = PricingUtils.calculateProductPrice(item.products, item.quantity);
                return (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>{item.products.name} × {item.quantity}</span>
                    <span className="flex items-center gap-1">
                      <IndianRupee className="h-3 w-3" />
                      {itemPricing.finalPrice.toFixed(2)}
                    </span>
                  </div>
                );
              })}
              <div className="border-t pt-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span className="flex items-center gap-1">
                    <IndianRupee className="h-3 w-3" />
                    {orderTotals.totalFinalPrice.toFixed(2)}
                  </span>
                </div>
                {selectedShippingOption && (
                  <div className="flex justify-between text-sm">
                    <span>Shipping ({selectedShippingOption.name}):</span>
                    <span className="flex items-center gap-1">
                      <IndianRupee className="h-3 w-3" />
                      {shippingPrice.toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between font-semibold text-lg border-t pt-2">
                  <span>Total:</span>
                  <span className="flex items-center gap-1">
                    <IndianRupee className="h-4 w-4" />
                    {orderTotals.grandTotal.toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Shipping Options */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Choose Shipping Option</CardTitle>
            </CardHeader>
            <CardContent>
              {shippingOptions.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  No shipping options available.
                </div>
              ) : (
                <RadioGroup 
                  value={formData.shippingOptionId} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, shippingOptionId: value }))}
                >
                  {shippingOptions.map((option) => (
                    <div key={option.id} className="flex items-center space-x-2 p-3 border rounded-lg">
                      <RadioGroupItem value={option.id} id={option.id} />
                      <div className="flex-1">
                        <Label htmlFor={option.id} className="flex justify-between items-start cursor-pointer">
                          <div>
                            <div className="font-medium">{option.name}</div>
                            {option.description && (
                              <div className="text-sm text-gray-600">{option.description}</div>
                            )}
                            {option.estimated_days_min && option.estimated_days_max && (
                              <div className="text-xs text-gray-500">
                                Delivery in {option.estimated_days_min === option.estimated_days_max 
                                  ? `${option.estimated_days_min} day${option.estimated_days_min > 1 ? 's' : ''}`
                                  : `${option.estimated_days_min}-${option.estimated_days_max} days`
                                }
                              </div>
                            )}
                          </div>
                          <div className="font-semibold flex items-center gap-1">
                            {option.price === 0 ? 'Free' : (
                              <>
                                <IndianRupee className="h-3 w-3" />
                                {Number(option.price).toFixed(2)}
                              </>
                            )}
                          </div>
                        </Label>
                      </div>
                    </div>
                  ))}
                </RadioGroup>
              )}
            </CardContent>
          </Card>

          {/* Shipping Address */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Shipping Address
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingProfile ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                  <p className="text-sm text-gray-600 mt-2">Loading your address...</p>
                </div>
              ) : (
                <Tabs value={addressTab} onValueChange={setAddressTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="saved">Saved Addresses</TabsTrigger>
                    <TabsTrigger value="manual">New Address</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="saved" className="space-y-4">
                    <AddressManager 
                      onAddressSelect={setSelectedAddress}
                      selectedAddressId={selectedAddress?.id}
                      showSelection={true}
                    />
                    {!selectedAddress && (
                      <p className="text-sm text-gray-500 text-center py-4">
                        Please select an address or create a new one
                      </p>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="manual" className="space-y-4">
                    <div>
                      <Label htmlFor="address">Address</Label>
                      <Textarea
                        id="address"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        required={addressTab === "manual"}
                        rows={3}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                          required={addressTab === "manual"}
                        />
                      </div>
                      <div>
                        <Label htmlFor="state">State</Label>
                        <Input
                          id="state"
                          value={formData.state}
                          onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                          required={addressTab === "manual"}
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="postalCode">Postal Code</Label>
                        <Input
                          id="postalCode"
                          value={formData.postalCode}
                          onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                          required={addressTab === "manual"}
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          required={addressTab === "manual"}
                        />
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              )}
            </CardContent>
          </Card>

          {/* Payment Method */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Payment Method</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup 
                value={formData.paymentMethod} 
                onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="cod" id="cod" />
                  <Label htmlFor="cod">Cash on Delivery (COD)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="cashfree" id="cashfree" />
                  <Label htmlFor="cashfree">Online Payment via Cashfree</Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)} 
              className="flex-1 border-[#6A8A4E] text-[#6A8A4E] hover:bg-[#6A8A4E] hover:text-white"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={
                loading || 
                loadingProfile || 
                cashfreeLoading || 
                !formData.shippingOptionId || 
                shippingOptions.length === 0 ||
                (addressTab === "saved" && !selectedAddress) ||
                (addressTab === "manual" && (!formData.address || !formData.city || !formData.state || !formData.postalCode || !formData.phone))
              } 
              className="flex-1 bg-[#6A8A4E] hover:bg-[green] text-white"
            >
              {loading || cashfreeLoading ? "Processing..." : (
                <span className="flex items-center gap-1">
                  {formData.paymentMethod === 'cashfree' ? 'Pay Now' : 'Place Order'} (<IndianRupee className="h-3 w-3" />{orderTotals.grandTotal.toFixed(2)})
                </span>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CheckoutDialog;
