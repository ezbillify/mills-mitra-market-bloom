import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit, Trash2, Search, Truck, CreditCard, Save, Gift } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import AddShippingDialog from "@/components/admin/AddShippingDialog";
import EditShippingDialog from "@/components/admin/EditShippingDialog";

interface ShippingOption {
  id: string;
  name: string;
  description: string | null;
  price: number;
  is_active: boolean;
  estimated_days_min: number | null;
  estimated_days_max: number | null;
  created_at: string;
}

interface CODSettings {
  amount: number;
  enabled: boolean;
}

interface FreeShippingSettings {
  minimum_amount: number;
  enabled: boolean;
}

const AdminShippingSettings = () => {
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [filteredOptions, setFilteredOptions] = useState<ShippingOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingOption, setEditingOption] = useState<ShippingOption | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [codSettings, setCodSettings] = useState<CODSettings>({ amount: 50, enabled: true });
  const [codLoading, setCodLoading] = useState(false);
  const [freeShippingSettings, setFreeShippingSettings] = useState<FreeShippingSettings>({ minimum_amount: 700, enabled: true });
  const [freeShippingLoading, setFreeShippingLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchShippingOptions();
    fetchCODSettings();
    fetchFreeShippingSettings();
  }, []);

  useEffect(() => {
    filterOptions();
  }, [shippingOptions, searchTerm]);

  const fetchShippingOptions = async () => {
    try {
      const { data, error } = await supabase
        .from('delivery_options')
        .select('*')
        .order('price', { ascending: true });

      if (error) {
        console.error('Error fetching shipping options:', error);
        toast({
          title: "Error",
          description: "Failed to fetch shipping options",
          variant: "destructive",
        });
        return;
      }

      setShippingOptions(data || []);
    } catch (error) {
      console.error('Error fetching shipping options:', error);
      toast({
        title: "Error",
        description: "Failed to fetch shipping options",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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
        // Properly cast Json to CODSettings with type checking
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
        // Properly cast Json to FreeShippingSettings with type checking
        const settings = data.value as unknown;
        if (typeof settings === 'object' && settings !== null && 'minimum_amount' in settings && 'enabled' in settings) {
          setFreeShippingSettings(settings as FreeShippingSettings);
        }
      }
    } catch (error) {
      console.error('Error fetching free shipping settings:', error);
    }
  };

  const saveCODSettings = async () => {
    setCodLoading(true);
    try {
      const { error } = await supabase
        .from('admin_settings')
        .upsert({
          key: 'cod_charges',
          value: codSettings as any // Cast to any to satisfy Json type
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "COD charges settings updated successfully",
      });
    } catch (error) {
      console.error('Error updating COD settings:', error);
      toast({
        title: "Error",
        description: "Failed to update COD charges settings",
        variant: "destructive",
      });
    } finally {
      setCodLoading(false);
    }
  };

  const saveFreeShippingSettings = async () => {
    setFreeShippingLoading(true);
    try {
      const { error } = await supabase
        .from('admin_settings')
        .upsert({
          key: 'free_shipping',
          value: freeShippingSettings as any // Cast to any to satisfy Json type
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Free shipping settings updated successfully",
      });
    } catch (error) {
      console.error('Error updating free shipping settings:', error);
      toast({
        title: "Error",
        description: "Failed to update free shipping settings",
        variant: "destructive",
      });
    } finally {
      setFreeShippingLoading(false);
    }
  };

  const filterOptions = () => {
    let filtered = shippingOptions;

    if (searchTerm) {
      filtered = filtered.filter(option =>
        option.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (option.description && option.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredOptions(filtered);
  };

  const handleEditOption = (option: ShippingOption) => {
    setEditingOption(option);
    setEditDialogOpen(true);
  };

  const deleteShippingOption = async (optionId: string) => {
    if (!confirm("Are you sure you want to delete this shipping option? This action cannot be undone.")) return;

    try {
      const { error } = await supabase
        .from('delivery_options')
        .delete()
        .eq('id', optionId);

      if (error) {
        console.error('Error deleting shipping option:', error);
        toast({
          title: "Error",
          description: "Failed to delete shipping option",
          variant: "destructive",
        });
        return;
      }

      await fetchShippingOptions();
      toast({
        title: "Success",
        description: "Shipping option deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting shipping option:', error);
      toast({
        title: "Error",
        description: "Failed to delete shipping option",
        variant: "destructive",
      });
    }
  };

  const toggleOptionStatus = async (optionId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('delivery_options')
        .update({ is_active: !currentStatus })
        .eq('id', optionId);

      if (error) {
        console.error('Error updating shipping option:', error);
        toast({
          title: "Error",
          description: "Failed to update shipping option status",
          variant: "destructive",
        });
        return;
      }

      await fetchShippingOptions();
      toast({
        title: "Success",
        description: "Shipping option status updated successfully",
      });
    } catch (error) {
      console.error('Error updating shipping option:', error);
      toast({
        title: "Error",
        description: "Failed to update shipping option status",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-golden-millet"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-warm-brown">Shipping Settings</h1>
          <p className="text-earth-brown/70 mt-1">Manage shipping options, COD charges, free shipping, and pricing</p>
        </div>
        <AddShippingDialog onShippingAdded={fetchShippingOptions} />
      </div>

      {/* Free Shipping Configuration */}
      <Card className="border-l-4 border-l-green-500 bg-white shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-warm-brown">
            <Gift className="h-5 w-5 text-green-500" />
            Free Shipping Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="space-y-2">
              <Label htmlFor="free-shipping-amount">Minimum Order Amount (₹)</Label>
              <Input
                id="free-shipping-amount"
                type="number"
                min="0"
                step="0.01"
                value={freeShippingSettings.minimum_amount}
                onChange={(e) => setFreeShippingSettings(prev => ({ 
                  ...prev, 
                  minimum_amount: parseFloat(e.target.value) || 0 
                }))}
                placeholder="700.00"
              />
              <p className="text-xs text-gray-500">
                Orders above this amount will get free shipping
              </p>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <div className="flex items-center space-x-2 h-10">
                <Switch
                  id="free-shipping-enabled"
                  checked={freeShippingSettings.enabled}
                  onCheckedChange={(checked) => setFreeShippingSettings(prev => ({ 
                    ...prev, 
                    enabled: checked 
                  }))}
                />
                <Label htmlFor="free-shipping-enabled" className="text-sm">
                  {freeShippingSettings.enabled ? 'Enabled' : 'Disabled'}
                </Label>
              </div>
            </div>

            <div>
              <Button 
                onClick={saveFreeShippingSettings}
                disabled={freeShippingLoading}
                className="w-full bg-green-500 hover:bg-green-600 text-white"
              >
                <Save className="h-4 w-4 mr-2" />
                {freeShippingLoading ? "Saving..." : "Save Free Shipping"}
              </Button>
            </div>
          </div>

          <div className="p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-700">
              <span className="font-medium">Current Free Shipping Setup: </span>
              {freeShippingSettings.enabled ? (
                <>
                  Orders above ₹{freeShippingSettings.minimum_amount.toFixed(2)} will get free shipping
                </>
              ) : (
                "Free shipping is currently disabled"
              )}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* COD Charges Configuration */}
      <Card className="border-l-4 border-l-orange-500 bg-white shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-warm-brown">
            <CreditCard className="h-5 w-5 text-orange-500" />
            Cash on Delivery (COD) Charges
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="space-y-2">
              <Label htmlFor="cod-amount">COD Charges (₹)</Label>
              <Input
                id="cod-amount"
                type="number"
                min="0"
                step="0.01"
                value={codSettings.amount}
                onChange={(e) => setCodSettings(prev => ({ 
                  ...prev, 
                  amount: parseFloat(e.target.value) || 0 
                }))}
                placeholder="0.00"
              />
              <p className="text-xs text-gray-500">
                Fixed amount charged for Cash on Delivery orders
              </p>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <div className="flex items-center space-x-2 h-10">
                <Switch
                  id="cod-enabled"
                  checked={codSettings.enabled}
                  onCheckedChange={(checked) => setCodSettings(prev => ({ 
                    ...prev, 
                    enabled: checked 
                  }))}
                />
                <Label htmlFor="cod-enabled" className="text-sm">
                  {codSettings.enabled ? 'Enabled' : 'Disabled'}
                </Label>
              </div>
            </div>

            <div>
              <Button 
                onClick={saveCODSettings}
                disabled={codLoading}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white"
              >
                <Save className="h-4 w-4 mr-2" />
                {codLoading ? "Saving..." : "Save COD Settings"}
              </Button>
            </div>
          </div>

          <div className="p-3 bg-orange-50 border border-orange-200 rounded-md">
            <p className="text-sm text-orange-700">
              <span className="font-medium">Current COD Setup: </span>
              {codSettings.enabled ? (
                <>
                  ₹{codSettings.amount.toFixed(2)} will be added to all Cash on Delivery orders
                </>
              ) : (
                "COD charges are currently disabled"
              )}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-olive-leaf bg-white shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-earth-brown">Total Options</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-warm-brown">{shippingOptions.length}</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-golden-millet bg-white shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-earth-brown">Active Options</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-warm-brown">
              {shippingOptions.filter(o => o.is_active).length}
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-earth-brown bg-white shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-earth-brown">Average Price</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-warm-brown">
              ₹{shippingOptions.length > 0 
                ? (shippingOptions.reduce((sum, o) => sum + Number(o.price), 0) / shippingOptions.length).toFixed(0)
                : '0'}
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500 bg-white shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-earth-brown">Free Shipping</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-warm-brown">
              {freeShippingSettings.enabled ? `₹${freeShippingSettings.minimum_amount}+` : 'Disabled'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search Section */}
      <Card className="bg-white shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-warm-brown">
            <Search className="h-5 w-5 text-olive-leaf" />
            Search Shipping Options
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-earth-brown/50" />
            <Input
              placeholder="Search shipping options..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-warm-beige/30 focus:border-golden-millet focus:ring-golden-millet/20"
            />
          </div>
        </CardContent>
      </Card>

      {/* Shipping Options Table */}
      <Card className="bg-white shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-warm-brown">
            <Truck className="h-5 w-5 text-olive-leaf" />
            Shipping Options ({filteredOptions.length} options)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-warm-beige/10 border-b border-warm-beige/20">
                  <TableHead className="font-semibold text-warm-brown">Name</TableHead>
                  <TableHead className="font-semibold text-warm-brown">Price</TableHead>
                  <TableHead className="font-semibold text-warm-brown">Delivery Time</TableHead>
                  <TableHead className="font-semibold text-warm-brown">Status</TableHead>
                  <TableHead className="font-semibold text-warm-brown">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOptions.map((option) => (
                  <TableRow key={option.id} className="hover:bg-warm-beige/5 border-b border-warm-beige/10">
                    <TableCell>
                      <div>
                        <div className="font-medium text-warm-brown">{option.name}</div>
                        <div className="text-sm text-earth-brown/70 max-w-[200px] truncate">
                          {option.description || "No description"}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-warm-brown">₹{Number(option.price).toFixed(2)}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-earth-brown">
                        {option.estimated_days_min}-{option.estimated_days_max} days
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={option.is_active ? 'default' : 'secondary'}
                        className={option.is_active ? 'bg-olive-leaf text-warm-cream' : 'bg-warm-beige text-earth-brown'}
                      >
                        {option.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEditOption(option)}
                          className="h-8 w-8 p-0 border-olive-leaf/30 text-olive-leaf hover:bg-olive-leaf hover:text-warm-cream"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => toggleOptionStatus(option.id, option.is_active)}
                          className="h-8 px-2 text-xs border-golden-millet/30 text-golden-millet hover:bg-golden-millet hover:text-warm-brown"
                        >
                          {option.is_active ? 'Deactivate' : 'Activate'}
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => deleteShippingOption(option.id)}
                          className="h-8 w-8 p-0 border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {filteredOptions.length === 0 && (
            <div className="text-center py-8 text-earth-brown/70">
              <p>No shipping options found matching your search.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Shipping Dialog */}
      {editingOption && (
        <EditShippingDialog
          option={editingOption}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onShippingUpdated={fetchShippingOptions}
        />
      )}
    </div>
  );
};

export default AdminShippingSettings;
