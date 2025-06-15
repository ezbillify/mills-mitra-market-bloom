import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Product } from "@/types";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import AddToCartButton from "@/components/customer/AddToCartButton";

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) {
        console.error("Product ID is missing.");
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .eq("id", id)
          .single();

        if (error) {
          console.error("Error fetching product:", error);
          toast({
            title: "Error",
            description: "Failed to load product details.",
            variant: "destructive",
          });
        }

        if (data) {
          setProduct(data);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id, toast]);

  if (loading) {
    return <div className="text-center py-10">Loading product details...</div>;
  }

  if (!product) {
    return <div className="text-center py-10">Product not found.</div>;
  }

  const calculateDiscountPercentage = (originalPrice: number, discountedPrice: number) => {
    return Math.round(((originalPrice - discountedPrice) / originalPrice) * 100);
  };

  const getBasePrice = (product: Product) => {
    return product.discounted_price || product.price;
  };

  const getGSTAmount = (product: Product) => {
    const basePrice = getBasePrice(product);
    const gstPercentage = product.gst_percentage || 18;
    return (basePrice * gstPercentage) / 100;
  };

  const basePrice = getBasePrice(product);
  const gstAmount = getGSTAmount(product);
  const finalPrice = product.selling_price_with_tax || (basePrice + gstAmount);

  return (
    <div className="container mx-auto mt-8 p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Product Image */}
        <div>
          <img
            src={product.image || "/placeholder.svg"}
            alt={product.name}
            className="w-full h-auto rounded-lg shadow-md"
          />
        </div>

        {/* Product Details */}
        <div>
          <h1 className="text-2xl font-semibold mb-2">{product.name}</h1>
          <p className="text-gray-600 mb-4">{product.description}</p>

          {/* Price Details */}
          <div className="space-y-2 mb-4">
            <div className="bg-gray-50 p-3 rounded-md">
              {product.discounted_price ? (
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Original Price:</span>
                    <span className="line-through text-gray-500">₹{Number(product.price).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Discounted Price:</span>
                    <span className="font-medium text-green-600">₹{Number(product.discounted_price).toFixed(2)}</span>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Price:</span>
                  <span className="font-medium">₹{Number(product.price).toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between items-center mt-1">
                <span className="text-gray-600">GST ({product.gst_percentage || 18}%):</span>
                <span>₹{gstAmount.toFixed(2)}</span>
              </div>

              <div className="border-t pt-1 mt-1">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Final Price:</span>
                  <span className="font-bold text-primary">₹{finalPrice.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {product.discounted_price && (
              <div className="bg-green-50 border border-green-200 rounded-md p-2">
                <p className="text-xs text-green-700">
                  You save ₹{(product.price - product.discounted_price).toFixed(2)} (
                  {calculateDiscountPercentage(product.price, product.discounted_price)}% off)
                </p>
              </div>
            )}
          </div>

          {/* Stock Status */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-600">Stock:</span>
            {product.stock > 0 ? (
              <Badge variant="default" className="bg-green-500">
                {product.stock} units
              </Badge>
            ) : (
              <Badge variant="destructive">Out of Stock</Badge>
            )}
          </div>

          {/* Add to Cart Button */}
          <AddToCartButton 
            productId={product.id}
            productName={product.name}
            disabled={product.stock === 0}
          />
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
