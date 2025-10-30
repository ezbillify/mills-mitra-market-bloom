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
    <Card className="group hover:shadow-md transition-all duration-200 bg-white flex flex-col h-full">
      {/* Make the entire image area clickable */}
      <Link to={`/products/${product.id}`} className="block">
        <div className="relative">
          <img
            src={primaryImage || "/placeholder.svg"}
            alt={product.name}
            className="w-full h-32 sm:h-40 md:h-48 object-contain rounded-t-lg group-hover:scale-105 transition-transform duration-300 block p-1 sm:p-2"
          />
          {product.stock === 0 && (
            <Badge className="absolute top-1 sm:top-2 left-1 sm:left-2 bg-red-500 text-[8px] sm:text-xs">Out of Stock</Badge>
          )}
          {product.featured && (
            <Badge className="absolute top-1 sm:top-2 right-1 sm:right-2 bg-yellow-500 text-[8px] sm:text-xs">Featured</Badge>
          )}
          {product.discounted_price && (
            <Badge className="absolute bottom-1 sm:bottom-2 left-1 sm:left-2 bg-green-500 text-[8px] sm:text-xs">
              {calculateDiscountPercentage(product.price, product.discounted_price)}% OFF
            </Badge>
          )}
        </div>
      </Link>
      
      <CardContent className="p-2 sm:p-3 md:p-4 flex flex-col flex-grow">
        {/* Make the product name clickable */}
        <Link to={`/products/${product.id}`} className="block">
          <h3 className="font-semibold text-sm md:text-base mb-1 line-clamp-2 hover:text-primary transition-colors">
            {product.name}
          </h3>
        </Link>
        <p className="text-[10px] sm:text-xs text-gray-500 mb-1 sm:mb-2 capitalize">{product.category}</p>
        
        {/* Price Section - Simplified for better mobile experience */}
        <div className="mb-2 sm:mb-3">
          {product.discounted_price ? (
            <div className="flex items-baseline gap-1 sm:gap-2">
              <span className="text-base sm:text-lg font-bold text-green-600">₹{Number(product.discounted_price).toFixed(2)}</span>
              <span className="text-xs sm:text-sm text-gray-500 line-through">₹{Number(product.price).toFixed(2)}</span>
            </div>
          ) : (
            <div className="text-base sm:text-lg font-bold text-green-600">₹{Number(product.price).toFixed(2)}</div>
          )}
          <div className="text-[10px] sm:text-xs text-gray-600 mt-1">
            Final: <span className="font-semibold">₹{finalPrice.toFixed(2)}</span> (incl. GST)
          </div>
        </div>

        {/* Stock Status */}
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <span className="text-[10px] sm:text-xs text-gray-600">Stock:</span>
          {product.stock > 0 ? (
            <Badge variant="default" className="bg-green-500 text-[10px] sm:text-xs">
              {product.stock} units
            </Badge>
          ) : (
            <Badge variant="destructive" className="text-[10px] sm:text-xs">Out of Stock</Badge>
          )}
        </div>
        
        <div className="space-y-1.5 sm:space-y-2 mt-auto">
          <AddToCartButton 
            productId={product.id}
            productName={product.name}
            disabled={product.stock === 0}
            showBuyNow={true}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductCard;