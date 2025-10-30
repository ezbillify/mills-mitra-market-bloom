import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Edit, Trash2, MapPin } from "lucide-react";

interface Address {
  id: string;
  label: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default: boolean;
}

interface AddressManagerProps {
  onAddressSelect?: (address: Address) => void;
  selectedAddressId?: string;
  showSelection?: boolean;
}

const AddressManager = ({ onAddressSelect, selectedAddressId, showSelection = false }: AddressManagerProps) => {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [isEditing, setIsEditing] = useState(false); // Add isEditing state
  const { toast } = useToast();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    label: "",
    first_name: "",
    last_name: "",
    phone: "",
    address_line_1: "",
    address_line_2: "",
    city: "",
    state: "",
    postal_code: "",
    country: "India",
    is_default: false,
  });

  useEffect(() => {
    if (user) {
      fetchAddresses();
    }
  }, [user]);

  const fetchAddresses = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAddresses(data || []);
    } catch (error: any) {
      console.error('Error fetching addresses:', error);
      toast({
        title: "Error",
        description: "Failed to load addresses",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveAddress = async () => {
    if (!user) return;

    // Validate phone number if provided
    if (formData.phone) {
      const cleanPhone = formData.phone.replace(/[^0-9]/g, '');
      if (cleanPhone.length !== 10) {
        toast({
          title: "Invalid Phone Number",
          description: "Phone number must be exactly 10 digits.",
          variant: "destructive",
        });
        return;
      }
      
      // Update formData with cleaned phone number
      setFormData(prev => ({ ...prev, phone: cleanPhone }));
    }

    setLoading(true);
    try {
      const addressData = {
        ...formData,
        user_id: user.id,
      };

      let result;
      if (editingAddress) {
        result = await supabase
          .from('addresses')
          .update(addressData)
          .eq('id', editingAddress.id)
          .select()
          .single();
      } else {
        result = await supabase
          .from('addresses')
          .insert(addressData)
          .select()
          .single();
      }

      if (result.error) throw result.error;

      // If this is set as default, update other addresses
      if (formData.is_default) {
        await supabase
          .from('addresses')
          .update({ is_default: false })
          .eq('user_id', user.id)
          .neq('id', result.data.id);
      }

      toast({
        title: "Success",
        description: editingAddress ? "Address updated successfully" : "Address added successfully",
      });

      resetForm();
      fetchAddresses();
    } catch (error: any) {
      console.error('Error saving address:', error);
      toast({
        title: "Error",
        description: "Failed to save address",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setIsEditing(false); // Reset editing state after save
    }
  };

  const deleteAddress = async (addressId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('addresses')
        .delete()
        .eq('id', addressId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Address deleted successfully",
      });

      fetchAddresses();
    } catch (error: any) {
      console.error('Error deleting address:', error);
      toast({
        title: "Error",
        description: "Failed to delete address",
        variant: "destructive",
      });
    }
  };

  const setAsDefault = async (addressId: string) => {
    if (!user) return;

    try {
      // Remove default from all addresses
      await supabase
        .from('addresses')
        .update({ is_default: false })
        .eq('user_id', user.id);

      // Set new default
      const { error } = await supabase
        .from('addresses')
        .update({ is_default: true })
        .eq('id', addressId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Default address updated",
      });

      fetchAddresses();
    } catch (error: any) {
      console.error('Error setting default address:', error);
      toast({
        title: "Error",
        description: "Failed to update default address",
        variant: "destructive",
      });
    }
  };

  const startEdit = (address: Address) => {
    setFormData({
      label: address.label,
      first_name: address.first_name || "",
      last_name: address.last_name || "",
      phone: address.phone || "",
      address_line_1: address.address_line_1,
      address_line_2: address.address_line_2 || "",
      city: address.city,
      state: address.state,
      postal_code: address.postal_code,
      country: address.country,
      is_default: address.is_default,
    });
    setEditingAddress(address);
    setShowAddForm(true);
    setIsEditing(true); // Set editing state
  };

  const resetForm = () => {
    setFormData({
      label: "",
      first_name: "",
      last_name: "",
      phone: "",
      address_line_1: "",
      address_line_2: "",
      city: "",
      state: "",
      postal_code: "",
      country: "India",
      is_default: false,
    });
    setEditingAddress(null);
    setShowAddForm(false);
    setIsEditing(false); // Reset editing state
  };

  const formatAddress = (address: Address) => {
    const parts = [address.address_line_1];
    if (address.address_line_2) parts.push(address.address_line_2);
    parts.push(`${address.city}, ${address.state} ${address.postal_code}`);
    return parts.join(', ');
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Saved Addresses
        </h3>
        <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Address
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingAddress ? 'Edit Address' : 'Add New Address'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <Label htmlFor="label">Address Label</Label>
                <Input
                  id="label"
                  placeholder="e.g., Home, Office"
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name">First Name</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => {
                    // Only allow numbers and limit to 10 digits
                    const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
                    setFormData({ ...formData, phone: value });
                  }}
                  maxLength={10}
                  placeholder="1234567890"
                />
                <p className="text-xs text-gray-500 mt-1">Enter exactly 10 digits</p>
              </div>

              <div>
                <Label htmlFor="address_line_1">Address Line 1</Label>
                <Textarea
                  id="address_line_1"
                  value={formData.address_line_1}
                  onChange={(e) => setFormData({ ...formData, address_line_1: e.target.value })}
                  required
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="address_line_2">Address Line 2 (Optional)</Label>
                <Input
                  id="address_line_2"
                  value={formData.address_line_2}
                  onChange={(e) => setFormData({ ...formData, address_line_2: e.target.value })}
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

              <div>
                <Label htmlFor="postal_code">Postal Code</Label>
                <Input
                  id="postal_code"
                  value={formData.postal_code}
                  onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                  required
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_default"
                  checked={formData.is_default}
                  onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                />
                <Label htmlFor="is_default">Set as default address</Label>
              </div>

              <div className="flex gap-3">
                <Button onClick={resetForm} variant="outline" className="flex-1">
                  Cancel
                </Button>
                <Button onClick={saveAddress} disabled={loading} className="flex-1">
                  {loading ? "Saving..." : editingAddress ? "Update" : "Save"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
        </div>
      ) : addresses.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No saved addresses yet</p>
            <p className="text-sm text-gray-400">Add your first address to make checkout faster</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {addresses.map((address) => (
            <Card
              key={address.id}
              className={`cursor-pointer transition-colors ${
                showSelection && selectedAddressId === address.id
                  ? "border-primary bg-primary/5"
                  : "hover:bg-gray-50"
              }`}
              onClick={(e) => {
                // Only select address if not currently editing and showSelection is true
                if (showSelection && !isEditing) {
                  // Check if the click target is a button or within a button
                  const clickedElement = e.target as HTMLElement;
                  const isButtonClick = clickedElement.closest('button') !== null;
                  
                  // Only select address if it wasn't a button click
                  if (!isButtonClick) {
                    onAddressSelect?.(address);
                  }
                }
              }}
            >
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium">{address.label}</h4>
                      {address.is_default && (
                        <Badge variant="secondary" className="text-xs">Default</Badge>
                      )}
                    </div>
                    {(address.first_name || address.last_name) && (
                      <p className="text-sm text-gray-600">
                        {[address.first_name, address.last_name].filter(Boolean).join(' ')}
                      </p>
                    )}
                    {address.phone && (
                      <p className="text-sm text-gray-600">{address.phone}</p>
                    )}
                    <p className="text-sm text-gray-700 mt-1">{formatAddress(address)}</p>
                  </div>
                  
                  {!showSelection && (
                    <div className="flex items-center gap-2">
                      {!address.is_default && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setAsDefault(address.id);
                          }}
                        >
                          Set Default
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          startEdit(address);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteAddress(address.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  {showSelection && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        startEdit(address);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AddressManager;