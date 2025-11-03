import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { IndianRupee, MapPin, AlertCircle } from "lucide-react";
import { PricingUtils } from "@/utils/pricingUtils";
import AddressManager from "./AddressManager";

// Extend window interface for RazorPay
declare global {
  interface Window {
    Razorpay: any;
  }
}

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

interface CODSettings {
  amount: number;
  enabled: boolean;
}

interface FreeShippingSettings {
  minimum_amount: number;
  enabled: boolean;
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
  const [userProfile, setUserProfile] = useState<any>(null);
  const [codSettings, setCodSettings] = useState<CODSettings>({ amount: 0, enabled: false });
  const [freeShippingSettings, setFreeShippingSettings] = useState<FreeShippingSettings>({ minimum_amount: 0, enabled: false });
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    paymentMethod: "cod",
    shippingOptionId: "",
  });

  const [selectedAddress, setSelectedAddress] = useState<any>(null);

  // Function to load RazorPay SDK if not already loaded
  const loadRazorPayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // Preload RazorPay SDK when component mounts
  useEffect(() => {
    loadRazorPayScript();
  }, []);

  // Fetch user profile, shipping options, COD settings, and free shipping settings when dialog opens
  useEffect(() => {
    if (open && user) {
      fetchUserProfile();
      fetchShippingOptions();
      fetchCODSettings();
      fetchFreeShippingSettings();
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

  const fetchCODSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('value')
        .eq('key', 'cod_charges')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching COD settings:', error);
        return;
      }

      if (data && data.value) {
        const settings = data.value as unknown;
        if (typeof settings === 'object' && settings !== null && 'amount' in settings && 'enabled' in settings) {
          setCodSettings(settings as CODSettings);
        }
      }
    } catch (error) {
      console.error('Error fetching COD settings:', error);
    }
  };

  const fetchFreeShippingSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('value')
        .eq('key', 'free_shipping')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching free shipping settings:', error);
        return;
      }

      if (data && data.value) {
        const settings = data.value as unknown;
        if (typeof settings === 'object' && settings !== null && 'minimum_amount' in settings && 'enabled' in settings) {
          setFreeShippingSettings(settings as FreeShippingSettings);
        }
      }
    } catch (error) {
      console.error('Error fetching free shipping settings:', error);
    }
  };

  const fetchUserProfile = async () => {
    if (!user) return;
    
    setLoadingProfile(true);
    try {
      // Fetch profile from database
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error fetching profile:', profileError);
      }

      setUserProfile(profile);

      // Fetch default address from addresses table
      const { data: defaultAddress, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_default', true)
        .single();

      if (!error && defaultAddress) {
        setSelectedAddress(defaultAddress);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoadingProfile(false);
    }
  };

  // Calculate order totals using centralized pricing
  const getShippingAddress = () => {
    if (selectedAddress) {
      const parts = [selectedAddress.address_line_1];
      if (selectedAddress.address_line_2) parts.push(selectedAddress.address_line_2);
      parts.push(`${selectedAddress.city}, ${selectedAddress.state} ${selectedAddress.postal_code}`);
      return parts.join(', ');
    }
    return "";
  };
  
  const shippingAddress = getShippingAddress();
  const selectedShippingOption = shippingOptions.find(option => option.id === formData.shippingOptionId);
  
  // Calculate base shipping price
  const baseShippingPrice = selectedShippingOption?.price || 0;
  
  // Calculate subtotal for free shipping check
  const orderTotals = PricingUtils.calculateOrderTotals(
    cartItems.map(item => ({
      product: item.products,
      quantity: item.quantity
    })),
    shippingAddress,
    0 // Pass 0 for shipping to calculate subtotal first
  );

  // Check if eligible for free shipping
  const isEligibleForFreeShipping = freeShippingSettings.enabled && 
    orderTotals.totalFinalPrice >= freeShippingSettings.minimum_amount;
  
  // Apply free shipping if eligible
  const finalShippingPrice = isEligibleForFreeShipping ? 0 : baseShippingPrice;
  
  // Calculate COD charges
  const codCharges = formData.paymentMethod === 'cod' && codSettings.enabled ? codSettings.amount : 0;
  
  // Calculate final total with actual shipping price
  const finalTotal = orderTotals.totalFinalPrice + finalShippingPrice + codCharges;

  // Check if user has phone number from selected address or profile
  const existingPhone = selectedAddress?.phone || userProfile?.phone || user?.user_metadata?.phone;
  
  // Validate phone number format (10 digits minimum)
  const isValidPhoneNumber = (phone: string) => {
    if (!phone) return false;
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    return cleanPhone.length === 10;
  };
  
  const hasValidPhone = isValidPhoneNumber(existingPhone);
  const needsPhoneForOnlinePayment = formData.paymentMethod === 'razorpay' && !hasValidPhone;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedAddress) return;
    
    setLoading(true);

    try {
      // Create order first
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          total: finalTotal,
          status: 'pending',
          shipping_address: shippingAddress,
          delivery_option_id: formData.shippingOptionId,
          delivery_price: finalShippingPrice,
          payment_type: formData.paymentMethod, // Set payment type
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
      if (formData.paymentMethod === 'razorpay') {
        const customerName = userProfile?.first_name && userProfile?.last_name 
          ? `${userProfile.first_name} ${userProfile.last_name}`
          : userProfile?.email || user.email || 'Customer';

        const phoneNumber = existingPhone;
        
        if (!phoneNumber) {
          throw new Error('Phone number is required for online payment');
        }
        
        // Validate phone number is exactly 10 digits
        const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
        if (cleanPhone.length !== 10) {
          throw new Error('Phone number must be exactly 10 digits');
        }

        // Load RazorPay SDK if not already loaded (should be preloaded)
        const isScriptLoaded = await loadRazorPayScript();
        if (!isScriptLoaded) {
          throw new Error('Failed to load payment gateway. Please try again.');
        }

        // Initiate RazorPay payment
        const { data: paymentData, error: paymentError } = await supabase.functions.invoke('razorpay-payment', {
          body: {
            amount: finalTotal,
            currency: 'INR',
            orderId: order.id,
            customerInfo: {
              name: customerName,
              email: userProfile?.email || user.email || '',
              phone: cleanPhone,
            },
          },
        });

        if (paymentError) {
          throw new Error(`Payment initiation failed: ${paymentError.message}`);
        }

        if (!paymentData || !paymentData.success) {
          throw new Error(paymentData?.error || 'Failed to create payment order');
        }

        // Store the RazorPay order ID in the database
        const { error: updateError } = await supabase
          .from('orders')
          .update({
            razorpay_order_id: paymentData.razorpayOrderId,
            payment_status: 'pending',
            updated_at: new Date().toISOString()
          })
          .eq('id', order.id);

        if (updateError) {
          console.error('Failed to update order with RazorPay order ID:', updateError);
          throw new Error('Failed to save payment details');
        }

        // Close the dialog immediately before opening RazorPay modal
        onOpenChange(false);
        
        // Small delay to ensure dialog is closed before opening RazorPay
        setTimeout(() => {
          // Redirect to RazorPay checkout
          const options = {
            key: paymentData.keyId,
            amount: paymentData.amount,
            currency: paymentData.currency,
            name: 'MILLS MITRA',
            description: `Order #${order.id.slice(0, 8)}`,
            order_id: paymentData.razorpayOrderId,
            handler: async function (response: any) {
              // Verify payment with backend
              const { data: verifyData, error: verifyError } = await supabase.functions.invoke('razorpay-verify', {
                body: {
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  orderId: order.id,
                },
              });

              if (verifyError || !verifyData?.success) {
                toast({
                  title: 'Payment Verification Failed',
                  description: verifyData?.error || 'Unable to verify payment. Please contact support.',
                  variant: 'destructive',
                });
                
                // Mark order as cancelled when verification fails
                supabase
                  .from('orders')
                  .update({ 
                    status: 'cancelled',
                    payment_status: 'failed',
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', order.id)
                  .then(({ error }) => {
                    if (error) {
                      console.error('Failed to update order status:', error);
                    } else {
                      console.log('Order marked as cancelled due to verification failure:', order.id);
                    }
                  });
                  
                return;
              }

              // Clear cart after successful payment
              await supabase.from('cart_items').delete().eq('user_id', user.id);
              
              navigate('/payment-success');
              onOrderComplete();
            },
            prefill: {
              name: customerName,
              email: userProfile?.email || user.email || '',
              contact: cleanPhone,
            },
            theme: {
              color: '#6A8A4E',
            },
            modal: {
              ondismiss: function() {
                // User closed the modal without completing payment
                toast({
                  title: 'Payment Cancelled',
                  description: 'You have cancelled the payment. Your order will be marked as cancelled.',
                  variant: 'default',
                });
                
                // Mark order as cancelled immediately
                supabase
                  .from('orders')
                  .update({ 
                    status: 'cancelled',
                    payment_status: 'failed',
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', order.id)
                  .then(({ error }) => {
                    if (error) {
                      console.error('Failed to update order status:', error);
                    } else {
                      console.log('Order marked as cancelled:', order.id);
                    }
                  });
                
                navigate('/orders');
              }
            }
          };

          const rzp = new window.Razorpay(options);
          rzp.open();
        }, 100); // 100ms delay
      } else {
        // COD - complete the order
        const { error: cartError } = await supabase
          .from('cart_items')
          .delete()
          .eq('user_id', user.id);

        if (cartError) throw cartError;

        toast({
          title: "Order placed successfully!",
          description: `Your order has been placed. Order ID: ${order.id.slice(0, 8)}${codCharges > 0 ? ` (COD charges: ₹${codCharges.toFixed(2)})` : ''}`,
        });

        onOrderComplete();
        onOpenChange(false);
      }
      
      // Reset form only for COD payments
      if (formData.paymentMethod !== 'razorpay') {
        setFormData({
          paymentMethod: "cod",
          shippingOptionId: "",
        });
      }
    } catch (error) {
      console.error('Error creating order:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to place order. Please try again.",
        variant: "destructive",
      });
      // Only reset loading state on error
      setLoading(false);
    }
  };

  const getRemainingAmountForFreeShipping = () => {
    if (!freeShippingSettings.enabled || isEligibleForFreeShipping) return 0;
    return freeShippingSettings.minimum_amount - orderTotals.totalFinalPrice;
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
                    <span>
                      Shipping ({selectedShippingOption.name})
                      {isEligibleForFreeShipping && (
                        <span className="text-green-600 ml-1">(FREE)</span>
                      )}:
                    </span>
                    <span className="flex items-center gap-1">
                      {isEligibleForFreeShipping ? (
                        <span className="text-green-600 line-through text-xs mr-1">₹{baseShippingPrice.toFixed(2)}</span>
                      ) : null}
                      <IndianRupee className="h-3 w-3" />
                      {finalShippingPrice.toFixed(2)}
                    </span>
                  </div>
                )}
                {codCharges > 0 && (
                  <div className="flex justify-between text-sm text-orange-600">
                    <span>COD Charges:</span>
                    <span className="flex items-center gap-1">
                      <IndianRupee className="h-3 w-3" />
                      {codCharges.toFixed(2)}
                    </span>
                  </div>
                )}
                {freeShippingSettings.enabled && !isEligibleForFreeShipping && getRemainingAmountForFreeShipping() > 0 && (
                  <div className="text-xs text-blue-600 mt-2 p-2 bg-blue-50 rounded">
                    Add ₹{getRemainingAmountForFreeShipping().toFixed(2)} more to get free shipping!
                  </div>
                )}
                {isEligibleForFreeShipping && (
                  <div className="text-xs text-green-600 mt-2 p-2 bg-green-50 rounded">
                    🎉 You've qualified for free shipping!
                  </div>
                )}
                <div className="flex justify-between font-semibold text-lg border-t pt-2">
                  <span>Total:</span>
                  <span className="flex items-center gap-1">
                    <IndianRupee className="h-4 w-4" />
                    {finalTotal.toFixed(2)}
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
                            {(isEligibleForFreeShipping ? 0 : option.price) === 0 ? 'Free' : (
                              <>
                                {isEligibleForFreeShipping && option.price > 0 && (
                                  <span className="text-green-600 line-through text-xs mr-1">₹{option.price.toFixed(2)}</span>
                                )}
                                <IndianRupee className="h-3 w-3" />
                                {(isEligibleForFreeShipping ? 0 : Number(option.price)).toFixed(2)}
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

          {/* Shipping Address - Only Saved Addresses */}
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
                  <p className="text-sm text-gray-600 mt-2">Loading your addresses...</p>
                </div>
              ) : (
                <AddressManager 
                  onAddressSelect={setSelectedAddress}
                  selectedAddressId={selectedAddress?.id}
                  showSelection={true}
                />
              )}
              {!selectedAddress && !loadingProfile && (
                <p className="text-sm text-gray-500 text-center py-4">
                  Please select or add a delivery address to continue
                </p>
              )}
            </CardContent>
          </Card>

          {/* Phone Number Alert for Online Payment */}
          {needsPhoneForOnlinePayment && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Phone number is required for online payment. Please add a phone number to your selected address or choose a different address.
              </AlertDescription>
            </Alert>
          )}

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
                  <Label htmlFor="cod" className="flex-1">
                    <div className="flex justify-between items-center">
                      <span>Cash on Delivery (COD)</span>
                      {codSettings.enabled && codSettings.amount > 0 && (
                        <span className="text-sm text-orange-600">
                          +₹{codSettings.amount.toFixed(2)} charges
                        </span>
                      )}
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="razorpay" id="razorpay" />
                  <Label htmlFor="razorpay">Online Payment via RazorPay</Label>
                </div>
              </RadioGroup>
              
              {codSettings.enabled && codCharges > 0 && formData.paymentMethod === 'cod' && (
                <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-md">
                  <p className="text-sm text-orange-700">
                    <span className="font-medium">COD Charges: </span>
                    ₹{codSettings.amount.toFixed(2)} will be added to your order total
                  </p>
                </div>
              )}
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
                !formData.shippingOptionId || 
                shippingOptions.length === 0 ||
                !selectedAddress ||
                needsPhoneForOnlinePayment
              } 
              className="flex-1 bg-[#6A8A4E] hover:bg-[green] text-white"
            >
              {loading ? (
                <span className="flex items-center gap-1">
                  <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
                  Processing...
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  {formData.paymentMethod === 'razorpay' ? 'Pay Now' : 'Place Order'} (<IndianRupee className="h-3 w-3" />{finalTotal.toFixed(2)})
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
