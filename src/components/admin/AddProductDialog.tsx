
import { useState, useEffect } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import ProductImageUpload from "./ProductImageUpload";

interface Category {
  id: string;
  name: string;
  is_active: boolean;
}

interface AddProductDialogProps {
  onProductAdded: () => void;
}

const AddProductDialog = ({ onProductAdded }: AddProductDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    discountedPrice: "",
    gstPercentage: "18",
    category: "",
    stock: "",
    image: "",
    featured: false,
  });

  useEffect(() => {
    if (open) {
      fetchCategories();
    }
  }, [open]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, is_active')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) {
        console.error('Error fetching categories:', error);
        return;
      }

      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const originalPrice = parseFloat(formData.price);
      const discountedPrice = formData.discountedPrice ? parseFloat(formData.discountedPrice) : null;
      const gstPercentage = parseFloat(formData.gstPercentage);

      // Validate that discounted price is less than original price
      if (discountedPrice && discountedPrice >= originalPrice) {
        toast({
          title: "Error",
          description: "Discounted price must be less than the original price",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const { error } = await supabase
        .from('products')
        .insert({
          name: formData.name,
          description: formData.description || null,
          price: originalPrice,
          discounted_price: discountedPrice,
          gst_percentage: gstPercentage,
          category: formData.category,
          stock: parseInt(formData.stock) || 0,
          image: formData.image || null,
          featured: formData.featured,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Product added successfully",
      });

      setFormData({
        name: "",
        description: "",
        price: "",
        discountedPrice: "",
        gstPercentage: "18",
        category: "",
        stock: "",
        image: "",
        featured: false,
      });
      
      setOpen(false);
      onProductAdded();
    } catch (error) {
      console.error('Error adding product:', error);
      toast({
        title: "Error",
        description: "Failed to add product",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const hasDiscount = formData.discountedPrice && parseFloat(formData.discountedPrice) < parseFloat(formData.price);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Add New Product
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Add New Product</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Product Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter product name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe your product..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Original Price (₹) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                placeholder="0.00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="discounted-price">Discounted Price (₹)</Label>
              <Input
                id="discounted-price"
                type="number"
                step="0.01"
                min="0"
                value={formData.discountedPrice}
                onChange={(e) => setFormData(prev => ({ ...prev, discountedPrice: e.target.value }))}
                placeholder="Optional"
              />
            </div>
          </div>

          {hasDiscount && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-700">
                <span className="font-medium">Discount: </span>
                {(((parseFloat(formData.price) - parseFloat(formData.discountedPrice)) / parseFloat(formData.price)) * 100).toFixed(1)}% off
              </p>
            </div>
          )}

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="stock">Stock Quantity *</Label>
              <Input
                id="stock"
                type="number"
                min="0"
                value={formData.stock}
                onChange={(e) => setFormData(prev => ({ ...prev, stock: e.target.value }))}
                placeholder="0"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gst-percentage">GST % *</Label>
              <Input
                id="gst-percentage"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.gstPercentage}
                onChange={(e) => setFormData(prev => ({ ...prev, gstPercentage: e.target.value }))}
                placeholder="18"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.name.toLowerCase()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <ProductImageUpload
            currentImage={formData.image}
            onImageChange={(imageUrl) => setFormData(prev => ({ ...prev, image: imageUrl }))}
          />

          <div className="flex items-center space-x-2 pt-2">
            <Switch
              id="featured"
              checked={formData.featured}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, featured: checked }))}
            />
            <Label htmlFor="featured" className="text-sm font-medium">
              Mark as Featured Product
            </Label>
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
            <Button type="submit" disabled={loading} className="flex-1 bg-blue-600 hover:bg-blue-700">
              {loading ? "Adding..." : "Add Product"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddProductDialog;
