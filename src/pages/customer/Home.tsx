
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Info } from "lucide-react";
import HeroBanner from "@/components/customer/HeroBanner";
import AddToCartButton from "@/components/customer/AddToCartButton";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

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
}

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  const fetchFeaturedProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, price, discounted_price, gst_percentage, selling_price_with_tax, image, category, stock')
        .eq('featured', true)
        .limit(4);

      if (error) {
        console.error('Error fetching featured products:', error);
        return;
      }

      setFeaturedProducts(data || []);
    } catch (error) {
      console.error('Error fetching featured products:', error);
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

  return (
    <div>
      {/* Hero Section with Dynamic Banner */}
      <HeroBanner />

      {/* Features */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🚚</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Free Shipping</h3>
              <p className="text-gray-600">On orders above ₹999</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">✨</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Premium Quality</h3>
              <p className="text-gray-600">Carefully curated materials</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💎</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Expert Support</h3>
              <p className="text-gray-600">Professional guidance</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Featured Products</h2>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-0">
                    <div className="bg-gray-200 h-48 rounded-t-lg"></div>
                    <div className="p-4">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product) => {
                const basePrice = getBasePrice(product);
                const gstAmount = getGSTAmount(product);
                const finalPrice = product.selling_price_with_tax || (basePrice + gstAmount);

                return (
                  <Card key={product.id} className="group hover:shadow-lg transition-shadow bg-white">
                    <CardContent className="p-0">
                      <div className="relative">
                        <img
                          src={product.image || '/placeholder.svg'}
                          alt={product.name}
                          className="w-full h-48 object-cover rounded-t-lg group-hover:scale-105 transition-transform duration-300"
                        />
                        <Badge className="absolute top-2 left-2">Featured</Badge>
                        {product.stock === 0 && (
                          <Badge className="absolute top-2 right-2 bg-red-500 text-xs">Out of Stock</Badge>
                        )}
                        {product.discounted_price && (
                          <Badge className="absolute bottom-2 left-2 bg-green-500 text-xs">
                            {calculateDiscountPercentage(product.price, product.discounted_price)}% OFF
                          </Badge>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold mb-1 line-clamp-2">{product.name}</h3>
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
              })}
            </div>
          )}
          <div className="text-center mt-8">
            <Button variant="outline" size="lg" asChild>
              <Link to="/products">View All Products</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-primary text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of satisfied customers who trust Mills Mitra
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link to="/register">Create Account</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/products">Browse Products</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
