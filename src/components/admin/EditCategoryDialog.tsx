
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

interface Category {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  display_order: number | null;
}

interface EditCategoryDialogProps {
  category: Category;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCategoryUpdated: () => void;
}

const EditCategoryDialog = ({ category, open, onOpenChange, onCategoryUpdated }: EditCategoryDialogProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    displayOrder: "",
    isActive: true,
  });

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        description: category.description || "",
        displayOrder: (category.display_order || 0).toString(),
        isActive: category.is_active,
      });
    }
  }, [category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('categories')
        .update({
          name: formData.name,
          description: formData.description || null,
          display_order: formData.displayOrder ? parseInt(formData.displayOrder) : 0,
          is_active: formData.isActive,
        })
        .eq('id', category.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Category updated successfully",
      });

      onOpenChange(false);
      onCategoryUpdated();
    } catch (error) {
      console.error('Error updating category:', error);
      toast({
        title: "Error",
        description: "Failed to update category",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Edit Category
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Category Name</Label>
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
              placeholder="Optional description for the category"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-displayOrder">Display Order</Label>
            <Input
              id="edit-displayOrder"
              type="number"
              min="0"
              value={formData.displayOrder}
              onChange={(e) => setFormData(prev => ({ ...prev, displayOrder: e.target.value }))}
              placeholder="0"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="edit-isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
            />
            <Label htmlFor="edit-isActive">Active Category</Label>
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
              {loading ? "Updating..." : "Update Category"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditCategoryDialog;
