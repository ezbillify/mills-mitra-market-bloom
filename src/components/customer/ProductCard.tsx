import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import AddToCartButton from "./AddToCartButton";

interface Product {
  id: string;
  name: string;
  price: number;
  discounted_price: number | null;
  gst_percentage: number | null;
  selling_price_with_tax: number | null;
  image: string | null;
  category: string;
  stock: number;
  featured: boolean;
}

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const [primaryImage, setPrimaryImage] = useState<string | null>(product.image);

  useEffect(() => {
    const fetchPrimaryImage = async () => {
      try {
        // Fetch primary image from product_images table
        const { data, error } = await supabase
          .from('product_images')
          .select('image_url')
          .eq('product_id', product.id)
          .eq('is_primary', true)
          .single();

        if (!error && data) {
          setPrimaryImage(data.image_url);
        } else {
          // Fallback to first image if no primary image
          const { data: firstImage, error: firstError } = await supabase
            .from('product_images')
            .select('image_url')
            .eq('product_id', product.id)
            .order('display_order', { ascending: true })
            .limit(1)
            .single();

          if (!firstError && firstImage) {
            setPrimaryImage(firstImage.image_url);
          }
          // If no images in product_images table, keep the fallback product.image
        }
      } catch (error) {
        console.error('Error fetching primary image:', error);
        // Keep the fallback product.image
      }
    };

    fetchPrimaryImage();
  }, [product.id, product.image]);

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
    <Card className="group hover:shadow-md transition-all duration-200 bg-white">
      <CardContent className="p-0">
        <div className="relative">
          <img
            src={primaryImage || "/placeholder.svg"}
            alt={product.name}
            // Responsive: ensures image is visible and sized right on mobile
            className="w-full h-40 sm:h-48 object-cover rounded-t-lg group-hover:scale-105 transition-transform duration-300 block"
            style={{
              minHeight: "140px", // Ensures on mobile it's tall enough to see 
              maxHeight: "12rem",  // Prevent image overflow in all modes
              objectFit: "cover"
            }}
          />
          {product.stock === 0 && (
            <Badge className="absolute top-2 left-2 bg-red-500 text-xs">Out of Stock</Badge>
          )}
          {product.featured && (
            <Badge className="absolute top-2 right-2 text-xs">Featured</Badge>
          )}
          {product.discounted_price && (
            <Badge className="absolute bottom-2 left-2 bg-green-500 text-xs">
              {calculateDiscountPercentage(product.price, product.discounted_price)}% OFF
            </Badge>
          )}
        </div>
        <div className="p-3 sm:p-4">
          <h3 className="font-semibold text-sm sm:text-base mb-1 line-clamp-2">{product.name}</h3>
          <p className="text-xs text-gray-500 mb-2 capitalize">{product.category}</p>
          
          {/* Detailed Price Breakdown */}
          <div className="space-y-2 mb-3">
            <div className="bg-gray-50 p-2 rounded-md text-xs">
              {product.discounted_price ? (
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Original:</span>
                    <span className="line-through text-gray-500">₹{Number(product.price).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Discounted:</span>
                    <span className="font-medium text-green-600">₹{Number(product.discounted_price).toFixed(2)}</span>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Base Price:</span>
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
                <div className="flex items-center gap-1">
                  <Info className="h-3 w-3 text-green-600" />
                  <p className="text-xs text-green-700">
                    Save ₹{(product.price - product.discounted_price).toFixed(2)} 
                    ({calculateDiscountPercentage(product.price, product.discounted_price)}% off)
                  </p>
                </div>
              </div>
            )}

            {/* Stock Status */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">Stock:</span>
              {product.stock > 0 ? (
                <Badge variant="default" className="bg-green-500 text-xs">
                  {product.stock} units
                </Badge>
              ) : (
                <Badge variant="destructive" className="text-xs">Out of Stock</Badge>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <Link to={`/products/${product.id}`}>
              <Button variant="outline" size="sm" className="w-full h-9 text-xs">
                View Details
              </Button>
            </Link>
            <AddToCartButton 
              productId={product.id}
              productName={product.name}
              disabled={product.stock === 0}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductCard;
