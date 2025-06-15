
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  products: {
    id: string;
    name: string;
    price: number;
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
  
  const [formData, setFormData] = useState({
    address: "",
    city: "",
    state: "",
    postalCode: "",
    phone: "",
    paymentMethod: "cod",
    shippingOptionId: "",
  });

  const [hasExistingAddress, setHasExistingAddress] = useState(false);

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
      
      // Set first option as default
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
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('address, city, postal_code, phone')
      .eq('id', user.id)
      .single();

    if (!error && profile) {
      const hasAddress = !!(profile.address || profile.city || profile.postal_code);
      setHasExistingAddress(hasAddress);
      
      if (hasAddress) {
        setFormData(prev => ({
          ...prev,
          address: profile.address || "",
          city: profile.city || "",
          postalCode: profile.postal_code || "",
          phone: profile.phone || "",
        }));
      }
    }
    setLoadingProfile(false);
  };

  const selectedShippingOption = shippingOptions.find(option => option.id === formData.shippingOptionId);
  const shippingPrice = selectedShippingOption?.price || 0;
  const finalTotal = total + shippingPrice;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);

    try {
      const shippingAddress = `${formData.address}, ${formData.city}, ${formData.state} - ${formData.postalCode}`;
      
      // Create order with delivery option reference
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          total: finalTotal,
          status: 'pending',
          shipping_address: shippingAddress,
          delivery_option_id: formData.shippingOptionId,
          delivery_price: shippingPrice,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = cartItems.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.products.price,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

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
          <Card className={hasExistingAddress ? "border-[#88B04B]" : ""}>
            <CardHeader>
              <CardTitle className="text-lg">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {cartItems.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>{item.products.name} × {item.quantity}</span>
                  <span>₹{(item.products.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t pt-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>₹{total.toFixed(2)}</span>
                </div>
                {selectedShippingOption && (
                  <div className="flex justify-between text-sm">
                    <span>Shipping ({selectedShippingOption.name}):</span>
                    <span>₹{shippingPrice.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold text-lg border-t pt-2">
                  <span>Total:</span>
                  <span>₹{finalTotal.toFixed(2)}</span>
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
                          <div className="font-semibold">
                            {option.price === 0 ? 'Free' : `₹${Number(option.price).toFixed(2)}`}
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
          <Card className={hasExistingAddress ? "border-[#88B04B] bg-[#88B04B]/5" : ""}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                Shipping Address
                {hasExistingAddress && (
                  <span className="text-xs px-2 py-1 bg-[#88B04B] text-white rounded-full">
                    Address Found
                  </span>
                )}
              </CardTitle>
              {hasExistingAddress && (
                <p className="text-sm text-[#88B04B] font-medium">
                  Using your saved address information
                </p>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingProfile ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#C9A350] mx-auto"></div>
                  <p className="text-sm text-gray-600 mt-2">Loading your address...</p>
                </div>
              ) : (
                <>
                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Textarea
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      required
                      rows={3}
                      className={hasExistingAddress ? "border-[#88B04B]/50 focus:border-[#88B04B]" : ""}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        required
                        className={hasExistingAddress ? "border-[#88B04B]/50 focus:border-[#88B04B]" : ""}
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        required
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
                        required
                        className={hasExistingAddress ? "border-[#88B04B]/50 focus:border-[#88B04B]" : ""}
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        required
                        className={hasExistingAddress ? "border-[#88B04B]/50 focus:border-[#88B04B]" : ""}
                      />
                    </div>
                  </div>
                </>
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
                  <RadioGroupItem value="razorpay" id="razorpay" />
                  <Label htmlFor="razorpay">Razorpay (Online Payment)</Label>
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
              disabled={loading || loadingProfile || !formData.shippingOptionId || shippingOptions.length === 0} 
              className="flex-1 bg-[#C9A350] hover:bg-[#D49847] text-white"
            >
              {loading ? "Placing Order..." : `Place Order (₹${finalTotal.toFixed(2)})`}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CheckoutDialog;
