
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Edit, Trash2, Search, Truck } from "lucide-react";
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
  min_order_value: number | null;
  max_weight: number | null;
  delivery_days_min: number | null;
  delivery_days_max: number | null;
  created_at: string;
}

const AdminShippingSettings = () => {
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [filteredOptions, setFilteredOptions] = useState<ShippingOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingOption, setEditingOption] = useState<ShippingOption | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchShippingOptions();
  }, []);

  useEffect(() => {
    filterOptions();
  }, [shippingOptions, searchTerm]);

  const fetchShippingOptions = async () => {
    try {
      const { data, error } = await supabase
        .from('shipping_settings')
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
        .from('shipping_settings')
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
        .from('shipping_settings')
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Shipping Settings</h1>
          <p className="text-gray-600 mt-1">Manage shipping options and pricing</p>
        </div>
        <AddShippingDialog onShippingAdded={fetchShippingOptions} />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Options</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{shippingOptions.length}</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Options</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {shippingOptions.filter(o => o.is_active).length}
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Average Price</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              ₹{shippingOptions.length > 0 
                ? (shippingOptions.reduce((sum, o) => sum + Number(o.price), 0) / shippingOptions.length).toFixed(0)
                : '0'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Shipping Options
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search shipping options..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Shipping Options Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Shipping Options ({filteredOptions.length} options)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold">Name</TableHead>
                  <TableHead className="font-semibold">Price</TableHead>
                  <TableHead className="font-semibold">Delivery Time</TableHead>
                  <TableHead className="font-semibold">Min Order</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOptions.map((option) => (
                  <TableRow key={option.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div>
                        <div className="font-medium text-gray-900">{option.name}</div>
                        <div className="text-sm text-gray-500 max-w-[200px] truncate">
                          {option.description || "No description"}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">₹{Number(option.price).toFixed(2)}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {option.delivery_days_min}-{option.delivery_days_max} days
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {option.min_order_value ? `₹${Number(option.min_order_value).toFixed(2)}` : 'No minimum'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={option.is_active ? 'default' : 'secondary'}>
                        {option.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEditOption(option)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => toggleOptionStatus(option.id, option.is_active)}
                          className="h-8 px-2 text-xs"
                        >
                          {option.is_active ? 'Deactivate' : 'Activate'}
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => deleteShippingOption(option.id)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
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
            <div className="text-center py-8 text-gray-500">
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
