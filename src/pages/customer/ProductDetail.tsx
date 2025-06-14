
import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Heart, Share2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import AddToCartButton from "@/components/customer/AddToCartButton";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
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
          <div className="w-full">
            <img
              src={product.image || "/placeholder.svg"}
              alt={product.name}
              className="w-full h-64 sm:h-80 md:h-96 object-cover rounded-lg shadow-sm"
            />
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

              {/* Price */}
              <div>
                <p className="text-2xl sm:text-3xl font-bold text-primary">₹{Number(product.price).toFixed(2)}</p>
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
