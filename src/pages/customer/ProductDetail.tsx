import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Product, ProductImage } from "@/types/product";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import AddToCartButton from "@/components/customer/AddToCartButton";

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [productImages, setProductImages] = useState<ProductImage[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
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
        // Fetch product details
        const { data: productData, error: productError } = await supabase
          .from("products")
          .select("*")
          .eq("id", id)
          .single();

        if (productError) {
          console.error("Error fetching product:", productError);
          toast({
            title: "Error",
            description: "Failed to load product details.",
            variant: "destructive",
          });
          return;
        }

        setProduct(productData);

        // Fetch product images
        const { data: imagesData, error: imagesError } = await supabase
          .from("product_images")
          .select("*")
          .eq("product_id", id)
          .order("display_order", { ascending: true });

        if (imagesError) {
          console.error("Error fetching product images:", imagesError);
          // Don't show error for images, just use fallback
        }

        // Use product images if available, otherwise fallback to single image
        if (imagesData && imagesData.length > 0) {
          setProductImages(imagesData);
        } else if (productData.image) {
          // Create a fallback image object for backward compatibility
          setProductImages([{
            id: 'fallback',
            product_id: id,
            image_url: productData.image,
            display_order: 0,
            is_primary: true,
            created_at: '',
            updated_at: ''
          }]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id, toast]);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % productImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + productImages.length) % productImages.length);
  };

  const goToImage = (index: number) => {
    setCurrentImageIndex(index);
  };

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

  const currentImage = productImages[currentImageIndex];

  return (
    <div className="container mx-auto mt-8 p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Product Images */}
        <div className="space-y-4">
          {/* Main Image */}
          <div className="relative bg-gray-100 rounded-lg overflow-hidden shadow-md">
            <div className="aspect-square w-full">
              <img
                src={currentImage?.image_url || "/placeholder.svg"}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Navigation arrows for multiple images */}
            {productImages.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-md transition-colors"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-md transition-colors"
                  aria-label="Next image"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
                
                {/* Image counter */}
                <div className="absolute bottom-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-sm">
                  {currentImageIndex + 1} / {productImages.length}
                </div>
              </>
            )}
          </div>

          {/* Thumbnail Images */}
          {productImages.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {productImages.map((image, index) => (
                <button
                  key={image.id}
                  onClick={() => goToImage(index)}
                  className={`flex-shrink-0 w-20 h-20 rounded-md overflow-hidden border-2 transition-colors ${
                    index === currentImageIndex ? 'border-primary' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <img
                    src={image.image_url}
                    alt={`${product.name} - Image ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
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
