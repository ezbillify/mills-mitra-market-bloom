
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Edit } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
}

interface EditShippingDialogProps {
  option: ShippingOption;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onShippingUpdated: () => void;
}

const EditShippingDialog = ({ option, open, onOpenChange, onShippingUpdated }: EditShippingDialogProps) => {
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

  useEffect(() => {
    if (option) {
      setFormData({
        name: option.name,
        description: option.description || "",
        price: option.price.toString(),
        minOrderValue: option.min_order_value?.toString() || "",
        maxWeight: option.max_weight?.toString() || "",
        deliveryDaysMin: (option.delivery_days_min || 1).toString(),
        deliveryDaysMax: (option.delivery_days_max || 7).toString(),
        isActive: option.is_active,
      });
    }
  }, [option]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('shipping_settings')
        .update({
          name: formData.name,
          description: formData.description || null,
          price: parseFloat(formData.price) || 0,
          min_order_value: formData.minOrderValue ? parseFloat(formData.minOrderValue) : null,
          max_weight: formData.maxWeight ? parseFloat(formData.maxWeight) : null,
          delivery_days_min: formData.deliveryDaysMin ? parseInt(formData.deliveryDaysMin) : 1,
          delivery_days_max: formData.deliveryDaysMax ? parseInt(formData.deliveryDaysMax) : 7,
          is_active: formData.isActive,
        })
        .eq('id', option.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Shipping option updated successfully",
      });

      onOpenChange(false);
      onShippingUpdated();
    } catch (error) {
      console.error('Error updating shipping option:', error);
      toast({
        title: "Error",
        description: "Failed to update shipping option",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Edit Shipping Option
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Option Name</Label>
            <Input
              id="edit-name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              placeholder="Optional description for the shipping option"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-price">Price (₹)</Label>
              <Input
                id="edit-price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-minOrderValue">Min Order Value (₹)</Label>
              <Input
                id="edit-minOrderValue"
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
              <Label htmlFor="edit-deliveryDaysMin">Min Delivery Days</Label>
              <Input
                id="edit-deliveryDaysMin"
                type="number"
                min="1"
                value={formData.deliveryDaysMin}
                onChange={(e) => setFormData(prev => ({ ...prev, deliveryDaysMin: e.target.value }))}
                placeholder="1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-deliveryDaysMax">Max Delivery Days</Label>
              <Input
                id="edit-deliveryDaysMax"
                type="number"
                min="1"
                value={formData.deliveryDaysMax}
                onChange={(e) => setFormData(prev => ({ ...prev, deliveryDaysMax: e.target.value }))}
                placeholder="7"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-maxWeight">Max Weight (kg)</Label>
            <Input
              id="edit-maxWeight"
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
              id="edit-isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
            />
            <Label htmlFor="edit-isActive">Active Shipping Option</Label>
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1 bg-[#C9A350] hover:bg-[#D49847]">
              {loading ? "Updating..." : "Update Shipping Option"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditShippingDialog;
