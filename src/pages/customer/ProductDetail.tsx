import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Product, ProductImage } from "@/types/product";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react";
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
    return (
      <div className="container mx-auto mt-8 p-4">
        <div className="flex items-center gap-2 mb-6">
          <ArrowLeft className="h-4 w-4" />
          <span>Loading product details...</span>
        </div>
        <div className="animate-pulse">
          <div className="h-64 bg-gray-200 rounded-lg mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto mt-8 p-4">
        <Button variant="ghost" className="mb-6" asChild>
          <Link to="/products">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Products
          </Link>
        </Button>
        <div className="text-center py-10">
          <h2 className="text-xl font-semibold mb-2">Product not found</h2>
          <p className="text-gray-600">The product you're looking for doesn't exist or is no longer available.</p>
        </div>
      </div>
    );
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
    <div className="container mx-auto mt-3 sm:mt-4 md:mt-8 p-3 sm:p-4">
      <Button variant="ghost" size="sm" className="mb-3 sm:mb-4 md:mb-6 h-8 sm:h-9 text-xs sm:text-sm" asChild>
        <Link to="/products">
          <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
          Back to Products
        </Link>
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
        {/* Product Images - Enhanced for mobile */}
        <div className="space-y-3 sm:space-y-4">
          {/* Main Image */}
          <div className="relative bg-gray-100 rounded-lg overflow-hidden shadow-md">
            <div className="aspect-square w-full">
              <img
                src={currentImage?.image_url || "/placeholder.svg"}
                alt={product.name}
                className="w-full h-full object-contain"
              />
            </div>
            
            {/* Navigation arrows for multiple images */}
            {productImages.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-1.5 sm:left-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-1.5 sm:p-2 shadow-md transition-colors"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-1.5 sm:right-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-1.5 sm:p-2 shadow-md transition-colors"
                  aria-label="Next image"
                >
                  <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
                
                {/* Image counter */}
                <div className="absolute bottom-1.5 sm:bottom-2 right-1.5 sm:right-2 bg-black/50 text-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs">
                  {currentImageIndex + 1} / {productImages.length}
                </div>
              </>
            )}
          </div>

          {/* Thumbnail Images */}
          {productImages.length > 1 && (
            <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-2">
              {productImages.map((image, index) => (
                <button
                  key={image.id}
                  onClick={() => goToImage(index)}
                  className={`flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-md overflow-hidden border-2 transition-colors ${
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

        {/* Product Details - Improved layout */}
        <div>
          <div className="bg-white rounded-lg p-3 sm:p-4 md:p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-2 mb-2 sm:mb-3">
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">{product.name}</h1>
              {product.featured && (
                <Badge variant="default" className="bg-yellow-500 text-[10px] sm:text-xs">Featured</Badge>
              )}
            </div>
            
            <div className="mb-3 sm:mb-4">
              <span className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded-full text-[10px] sm:text-xs font-medium">
                {product.category}
              </span>
            </div>

            {/* Price Details - Enhanced presentation */}
            <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
              <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2 sm:mb-3">
                  {product.discounted_price ? (
                    <>
                      <div className="flex items-baseline gap-1.5 sm:gap-2">
                        <span className="text-xl sm:text-2xl md:text-3xl font-bold text-green-600">₹{Number(product.discounted_price).toFixed(2)}</span>
                        <span className="text-base sm:text-lg text-gray-500 line-through">₹{Number(product.price).toFixed(2)}</span>
                      </div>
                      <Badge variant="destructive" className="text-[10px] sm:text-xs">
                        {calculateDiscountPercentage(product.price, product.discounted_price)}% OFF
                      </Badge>
                    </>
                  ) : (
                    <span className="text-xl sm:text-2xl md:text-3xl font-bold text-green-600">₹{Number(product.price).toFixed(2)}</span>
                  )}
                </div>

                {/* Removed GST calculation and final price display */}
              </div>

              {product.discounted_price && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-2 sm:p-3">
                  <p className="text-[10px] sm:text-xs text-green-700">
                    You save ₹{(product.price - product.discounted_price).toFixed(2)} (
                    {calculateDiscountPercentage(product.price, product.discounted_price)}% off)
                  </p>
                </div>
              )}
            </div>

            {/* Stock Status */}
            <div className="flex items-center justify-between mb-4 sm:mb-6 p-2 sm:p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600 font-medium text-sm sm:text-base">Availability:</span>
              {product.stock > 0 ? (
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-green-500"></div>
                  <span className="font-medium text-green-600 text-sm sm:text-base">{product.stock} units in stock</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-red-500"></div>
                  <span className="font-medium text-red-600 text-sm sm:text-base">Out of Stock</span>
                </div>
              )}
            </div>

            {/* Action Buttons - Enhanced with Buy Now option */}
            <div className="space-y-2 sm:space-y-3">
              <AddToCartButton 
                productId={product.id}
                productName={product.name}
                disabled={product.stock === 0}
                showBuyNow={true}
              />
            </div>

            {/* About our Product - Moved description here with improved formatting */}
            <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-200">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">About our Product</h2>
              {product.description ? (
                <div className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
                  {product.description}
                </div>
              ) : (
                <p className="text-gray-500 italic text-sm">No description available for this product.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;