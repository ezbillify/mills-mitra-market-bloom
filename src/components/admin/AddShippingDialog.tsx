
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AddShippingDialogProps {
  onShippingAdded: () => void;
}

const AddShippingDialog = ({ onShippingAdded }: AddShippingDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    minOrderValue: "",
    maxWeight: "",
    deliveryDaysMin: "",
    deliveryDaysMax: "",
    isActive: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('shipping_settings')
        .insert({
          name: formData.name,
          description: formData.description || null,
          price: parseFloat(formData.price) || 0,
          min_order_value: formData.minOrderValue ? parseFloat(formData.minOrderValue) : null,
          max_weight: formData.maxWeight ? parseFloat(formData.maxWeight) : null,
          delivery_days_min: formData.deliveryDaysMin ? parseInt(formData.deliveryDaysMin) : 1,
          delivery_days_max: formData.deliveryDaysMax ? parseInt(formData.deliveryDaysMax) : 7,
          is_active: formData.isActive,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Shipping option added successfully",
      });

      setOpen(false);
      onShippingAdded();
      
      // Reset form
      setFormData({
        name: "",
        description: "",
        price: "",
        minOrderValue: "",
        maxWeight: "",
        deliveryDaysMin: "",
        deliveryDaysMax: "",
        isActive: true,
      });
    } catch (error) {
      console.error('Error adding shipping option:', error);
      toast({
        title: "Error",
        description: "Failed to add shipping option",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-[#C9A350] hover:bg-[#D49847] text-white">
          <Plus className="h-4 w-4 mr-2" />
          Add Shipping Option
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add New Shipping Option
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Option Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              placeholder="Optional description for the shipping option"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price (₹)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="minOrderValue">Min Order Value (₹)</Label>
              <Input
                id="minOrderValue"
                type="number"
                step="0.01"
                min="0"
                value={formData.minOrderValue}
                onChange={(e) => setFormData(prev => ({ ...prev, minOrderValue: e.target.value }))}
                placeholder="Optional"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="deliveryDaysMin">Min Delivery Days</Label>
              <Input
                id="deliveryDaysMin"
                type="number"
                min="1"
                value={formData.deliveryDaysMin}
                onChange={(e) => setFormData(prev => ({ ...prev, deliveryDaysMin: e.target.value }))}
                placeholder="1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deliveryDaysMax">Max Delivery Days</Label>
              <Input
                id="deliveryDaysMax"
                type="number"
                min="1"
                value={formData.deliveryDaysMax}
                onChange={(e) => setFormData(prev => ({ ...prev, deliveryDaysMax: e.target.value }))}
                placeholder="7"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxWeight">Max Weight (kg)</Label>
            <Input
              id="maxWeight"
              type="number"
              step="0.01"
              min="0"
              value={formData.maxWeight}
              onChange={(e) => setFormData(prev => ({ ...prev, maxWeight: e.target.value }))}
              placeholder="Optional"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
            />
            <Label htmlFor="isActive">Active Shipping Option</Label>
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1 bg-[#C9A350] hover:bg-[#D49847]">
              {loading ? "Adding..." : "Add Shipping Option"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddShippingDialog;
