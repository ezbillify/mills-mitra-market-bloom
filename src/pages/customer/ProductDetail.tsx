
import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Heart, Share2, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import AddToCartButton from "@/components/customer/AddToCartButton";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  discounted_price: number | null;
  gst_percentage: number | null;
  selling_price_with_tax: number | null;
  image: string | null;
  category: string;
  stock: number;
  featured: boolean;
}

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchProduct();
    }
  }, [id]);

  const fetchProduct = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching product:', error);
        return;
      }

      setProduct(data);
    } catch (error) {
      console.error('Error fetching product:', error);
    } finally {
      setLoading(false);
    }
  };

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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading product...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Product not found</h2>
          <Link to="/products">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Products
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const basePrice = getBasePrice(product);
  const gstAmount = getGSTAmount(product);
  const finalPrice = product.selling_price_with_tax || (basePrice + gstAmount);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile-optimized header */}
      <div className="bg-white border-b px-4 py-3 sticky top-0 z-10">
        <Link to="/products">
          <Button variant="ghost" size="sm" className="p-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
      </div>

      <div className="container mx-auto px-4 py-4">
        {/* Mobile-first layout */}
        <div className="space-y-6">
          {/* Product Image - Full width on mobile */}
          <div className="w-full relative">
            <img
              src={product.image || "/placeholder.svg"}
              alt={product.name}
              className="w-full h-64 sm:h-80 md:h-96 object-cover rounded-lg shadow-sm"
            />
            {product.discounted_price && (
              <Badge className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1">
                {calculateDiscountPercentage(product.price, product.discounted_price)}% OFF
              </Badge>
            )}
          </div>

          {/* Product Info Card */}
          <Card className="shadow-sm">
            <CardContent className="p-4 sm:p-6 space-y-4">
              {/* Title and Featured Badge */}
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold leading-tight">{product.name}</h1>
                  {product.featured && <Badge className="shrink-0">Featured</Badge>}
                </div>
                <p className="text-sm text-gray-600 capitalize">Category: {product.category}</p>
              </div>

              {/* Price Breakdown */}
              <div className="space-y-3">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-base font-semibold mb-3">Price Details</h3>
                  
                  {product.discounted_price ? (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Original Price:</span>
                        <span className="text-sm line-through text-gray-500">₹{Number(product.price).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Discounted Price:</span>
                        <span className="text-sm font-medium text-green-600">₹{Number(product.discounted_price).toFixed(2)}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Base Price:</span>
                      <span className="text-sm font-medium">₹{Number(product.price).toFixed(2)}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-sm text-gray-600">GST ({product.gst_percentage || 18}%):</span>
                    <span className="text-sm">₹{gstAmount.toFixed(2)}</span>
                  </div>
                  
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-base font-semibold">Final Price:</span>
                      <span className="text-xl font-bold text-primary">₹{finalPrice.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {product.discounted_price && (
                  <div className="bg-green-50 border border-green-200 rounded-md p-3">
                    <p className="text-sm text-green-700">
                      <span className="font-medium">You save: </span>
                      ₹{(product.price - product.discounted_price).toFixed(2)} ({calculateDiscountPercentage(product.price, product.discounted_price)}% discount)
                    </p>
                  </div>
                )}
              </div>

              {/* Stock Status */}
              <div>
                <h3 className="text-base font-semibold mb-2">Stock Status</h3>
                {product.stock > 0 ? (
                  <Badge variant="default" className="bg-green-500">
                    {product.stock} units in stock
                  </Badge>
                ) : (
                  <Badge variant="destructive">Out of Stock</Badge>
                )}
              </div>

              {/* Description */}
              {product.description && (
                <div>
                  <h3 className="text-base font-semibold mb-2">Description</h3>
                  <p className="text-gray-700 text-sm sm:text-base leading-relaxed">{product.description}</p>
                </div>
              )}

              {/* GST Information */}
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                  <div className="text-sm text-blue-700">
                    <p className="font-medium mb-1">Tax Information</p>
                    <p>This product includes {product.gst_percentage || 18}% GST. The final price shown is inclusive of all taxes.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons - Mobile optimized */}
          <div className="space-y-3">
            <AddToCartButton 
              productId={product.id}
              productName={product.name}
              disabled={product.stock === 0}
            />
            
            {/* Secondary Actions */}
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="w-full h-12 text-sm">
                <Heart className="h-4 w-4 mr-2" />
                Add to Wishlist
              </Button>
              <Button variant="outline" className="w-full h-12 text-sm">
                <Share2 className="h-4 w-4 mr-2" />
                Share Product
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
