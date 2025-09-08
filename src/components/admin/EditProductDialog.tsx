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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Edit } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import MultipleImageUpload from "./MultipleImageUpload";
import { ProductImage } from "@/types/product";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  discounted_price: number | null;
  gst_percentage: number | null;
  price_includes_tax: boolean | null;
  category: string;
  stock: number;
  image: string | null;
  featured: boolean;
  hsn_code: string | null;
}

interface Category {
  id: string;
  name: string;
  is_active: boolean;
}

interface EditProductDialogProps {
  product: Product;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProductUpdated: () => void;
}

const EditProductDialog = ({ product, open, onOpenChange, onProductUpdated }: EditProductDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [productImages, setProductImages] = useState<ProductImage[]>([]);
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    discountedPrice: "",
    gstPercentage: "",
    priceIncludesTax: true,
    category: "",
    stock: "",
    featured: false,
    hsnCode: "",
  });

  useEffect(() => {
    if (open) {
      fetchCategories();
      fetchProductImages();
    }
  }, [open, product.id]);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        description: product.description || "",
        price: product.price.toString(),
        discountedPrice: product.discounted_price?.toString() || "",
        gstPercentage: product.gst_percentage?.toString() || "18",
        priceIncludesTax: product.price_includes_tax ?? true,
        category: product.category,
        stock: product.stock.toString(),
        featured: product.featured,
        hsnCode: product.hsn_code || "",
      });
    }
  }, [product]);

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

  const fetchProductImages = async () => {
    try {
      const { data, error } = await supabase
        .from('product_images')
        .select('*')
        .eq('product_id', product.id)
        .order('display_order', { ascending: true });

      if (error) {
        console.error('Error fetching product images:', error);
        return;
      }

      setProductImages(data || []);
    } catch (error) {
      console.error('Error fetching product images:', error);
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

      // Get primary image for backward compatibility
      const primaryImage = productImages.find(img => img.is_primary)?.image_url || productImages[0]?.image_url || null;

      const { error } = await supabase
        .from('products')
        .update({
          name: formData.name,
          description: formData.description || null,
          price: originalPrice,
          discounted_price: discountedPrice,
          gst_percentage: gstPercentage,
          price_includes_tax: formData.priceIncludesTax,
          category: formData.category,
          stock: parseInt(formData.stock) || 0,
          image: primaryImage, // Backward compatibility
          featured: formData.featured,
          hsn_code: formData.hsnCode || null,
        })
        .eq('id', product.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Product updated successfully",
      });

      onOpenChange(false);
      onProductUpdated();
    } catch (error) {
      console.error('Error updating product:', error);
      toast({
        title: "Error",
        description: "Failed to update product",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const hasDiscount = formData.discountedPrice && parseFloat(formData.discountedPrice) < parseFloat(formData.price);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Edit Product
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Product Name</Label>
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
            />
          </div>

          {/* Price includes tax toggle */}
          <div className="flex items-center space-x-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <Switch
              id="edit-price-includes-tax"
              checked={formData.priceIncludesTax}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, priceIncludesTax: checked }))}
            />
            <Label htmlFor="edit-price-includes-tax" className="text-sm font-medium">
              Prices include tax (recommended)
            </Label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-price">
                {formData.priceIncludesTax ? 'Selling Price (₹)' : 'Base Price (₹)'}
              </Label>
              <Input
                id="edit-price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                required
              />
              {formData.priceIncludesTax && (
                <p className="text-xs text-blue-600">
                  This is the final selling price including {formData.gstPercentage}% GST
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-discounted-price">
                {formData.priceIncludesTax ? 'Discounted Price (₹)' : 'Discounted Base Price (₹)'}
              </Label>
              <Input
                id="edit-discounted-price"
                type="number"
                step="0.01"
                min="0"
                value={formData.discountedPrice}
                onChange={(e) => setFormData(prev => ({ ...prev, discountedPrice: e.target.value }))}
                placeholder="Optional"
              />
              {formData.priceIncludesTax && formData.discountedPrice && (
                <p className="text-xs text-green-600">
                  Final discounted price including {formData.gstPercentage}% GST
                </p>
              )}
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-stock">Stock Quantity</Label>
              <Input
                id="edit-stock"
                type="number"
                min="0"
                value={formData.stock}
                onChange={(e) => setFormData(prev => ({ ...prev, stock: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-gst-percentage">GST %</Label>
              <Input
                id="edit-gst-percentage"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.gstPercentage}
                onChange={(e) => setFormData(prev => ({ ...prev, gstPercentage: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-hsn-code">HSN Code</Label>
              <Input
                id="edit-hsn-code"
                value={formData.hsnCode}
                onChange={(e) => setFormData(prev => ({ ...prev, hsnCode: e.target.value }))}
                placeholder="e.g., 5208"
              />
              <p className="text-xs text-gray-500">
                HSN code for GST classification
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-category">Category</Label>
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

          {/* Multiple Image Upload */}
          <MultipleImageUpload
            productId={product.id}
            images={productImages}
            onImagesChange={setProductImages}
            maxImages={5}
          />

          <div className="flex items-center space-x-2">
            <Switch
              id="edit-featured"
              checked={formData.featured}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, featured: checked }))}
            />
            <Label htmlFor="edit-featured">Featured Product</Label>
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
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Updating..." : "Update Product"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditProductDialog;
