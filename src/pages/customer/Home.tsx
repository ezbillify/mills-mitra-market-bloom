import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Info, Leaf, Heart, Shield, Star, ShoppingCart, Eye, Truck, Award, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import HeroBanner from "@/components/customer/HeroBanner";
import AddToCartButton from "@/components/customer/AddToCartButton";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

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
        .limit(6);
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
    <div className="min-h-screen bg-white">
      {/* Hero Banner with improved layout */}
      <section className="relative min-h-[350px] md:h-[500px] overflow-hidden">
        <HeroBanner />
      </section>

      {/* Featured Products - Removed top padding to eliminate gap */}
      <section className="pb-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Featured Products</h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">
              Discover our most popular millet-based products that blend traditional wisdom with modern convenience.
            </p>
          </div>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-200 h-64 rounded-xl mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
                  <div className="h-8 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredProducts.map(product => {
                const basePrice = getBasePrice(product);
                const gstAmount = getGSTAmount(product);
                const finalPrice = product.selling_price_with_tax || (basePrice + gstAmount);

                return (
                  <div key={product.id} className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border hover:-translate-y-1">
                    <div className="relative overflow-hidden">
                      <img
                        src={product.image || '/placeholder.svg'}
                        alt={product.name}
                        className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {product.discounted_price && (
                        <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                          {calculateDiscountPercentage(product.price, product.discounted_price)}% OFF
                        </div>
                      )}
                      {product.stock === 0 && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <span className="bg-red-500 text-white px-4 py-2 rounded-lg font-semibold">Out of Stock</span>
                        </div>
                      )}
                    </div>
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                          {product.category}
                        </span>
                        <span className="text-gray-500 text-sm"></span>
                      </div>
                      <h3 className="font-bold text-lg text-gray-900 mb-3 line-clamp-2">{product.name}</h3>
                      <div className="mb-4">
                        {product.discounted_price ? (
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-2xl font-bold text-green-600">₹{Number(product.discounted_price).toFixed(2)}</span>
                            <span className="text-lg text-gray-500 line-through">₹{Number(product.price).toFixed(2)}</span>
                          </div>
                        ) : (
                          <div className="text-2xl font-bold text-green-600 mb-1">₹{Number(product.price).toFixed(2)}</div>
                        )}
                        <div className="text-sm text-gray-600">
                          Final Price: <span className="font-semibold">₹{finalPrice.toFixed(0)}</span> (incl. GST)
                        </div>
                      </div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm text-gray-600">Stock:</span>
                        {product.stock > 0 ? (
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                            {product.stock} units available
                          </span>
                        ) : (
                          <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
                            Out of Stock
                          </span>
                        )}
                      </div>
                      <div className="space-y-2">
                        <AddToCartButton 
                          productId={product.id}
                          productName={product.name}
                          disabled={product.stock === 0}
                        />
                        <Link to={`/products/${product.id}`}>
                          <Button variant="outline" size="sm" className="w-full h-11 font-semibold flex items-center justify-center gap-2 text-green-700 border-green-700 hover:bg-green-50 hover:text-green-900">
                            <Eye className="h-4 w-4" />
                            View Details
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div className="text-center mt-12">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-white px-8 py-4 rounded-lg font-semibold text-lg shadow-lg" asChild>
              <Link to="/products">View All Products</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-8 bg-primary text-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="flex flex-col items-center">
              <Truck className="h-8 w-8 mb-2" />
              <span className="font-semibold text-sm md:text-base">Free Shipping</span>
              <span className="text-xs opacity-80">On orders ₹798+</span>
            </div>
            <div className="flex flex-col items-center">
              <Award className="h-8 w-8 mb-2" />
              <span className="font-semibold text-sm md:text-base">Premium Quality</span>
              <span className="text-xs opacity-80">Certified Products</span>
            </div>
            <div className="flex flex-col items-center">
              <Users className="h-8 w-8 mb-2" />
              <span className="font-semibold text-sm md:text-base">10K+ Customers</span>
              <span className="text-xs opacity-80">Trusted by families</span>
            </div>
            <div className="flex flex-col items-center">
              <Star className="h-8 w-8 mb-2" />
              <span className="font-semibold text-sm md:text-base">5★ Rated</span>
              <span className="text-xs opacity-80">Customer satisfaction</span>
            </div>
          </div>
        </div>
      </section>

      {/* Product Categories Mini-Banner */}
      <section className="py-12 bg-accent/30">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
            Best Buy for the Season - Combo Deals Packed with Nutrition
          </h2>
          <div className="grid md:grid-cols-1 gap-6 max-w-md mx-auto">
            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <h3 className="font-bold text-lg text-green-700 mb-2">Health Mix</h3>
              <p className="text-gray-600 text-sm">Premium millet health mixes with Ayurvedic herbs</p>
            </div>
          </div>
        </div>
      </section>

      {/* Health Benefits */}
      <section className="py-16 bg-green-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Add Millets To Your Daily Diet And Add Happiness To Your Lifestyle
            </h2>
            <p className="text-gray-600 max-w-3xl mx-auto text-lg leading-relaxed">
              Millets are naturally rich in nutrients and drought-tolerant, grown in arid regions of India. 
              They provide exceptional health benefits and play a vital role in ecological security.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-md">
              <Heart className="h-12 w-12 text-red-500 mb-4" />
              <h3 className="font-bold text-lg mb-3">Heart Healthy</h3>
              <p className="text-gray-600">Rich in antioxidants that help lower cholesterol and maintain healthy blood vessels</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md">
              <Shield className="h-12 w-12 text-blue-500 mb-4" />
              <h3 className="font-bold text-lg mb-3">Diabetes Management</h3>
              <p className="text-gray-600">Low glycemic index helps stabilize blood sugar levels and promotes insulin sensitivity</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md">
              <Leaf className="h-12 w-12 text-green-500 mb-4" />
              <h3 className="font-bold text-lg mb-3">Weight Management</h3>
              <p className="text-gray-600">High fiber content aids in weight loss and improves gut health for sustained results</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md">
              <Star className="h-12 w-12 text-yellow-500 mb-4" />
              <h3 className="font-bold text-lg mb-3">Cancer Prevention</h3>
              <p className="text-gray-600">Phytochemicals help inhibit growth of cancerous cells without damaging normal cells</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md">
              <Info className="h-12 w-12 text-purple-500 mb-4" />
              <h3 className="font-bold text-lg mb-3">Digestive Health</h3>
              <p className="text-gray-600">Rich dietary fiber improves digestion and supports liver and kidney function</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md">
              <Award className="h-12 w-12 text-orange-500 mb-4" />
              <h3 className="font-bold text-lg mb-3">Instant Energy</h3>
              <p className="text-gray-600">Provides immediate energy boost while building strong muscles and boosting immunity</p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action - Fixed Contact Us button styling */}
      <section className="py-16 bg-primary text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Transform Your Health?</h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Join thousands of families who trust our premium millet products for their daily nutrition needs
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button className="bg-white text-primary hover:bg-gray-100 px-8 py-4 rounded-lg font-semibold text-lg transition-colors shadow-lg" asChild>
              <Link to="/products">Start Shopping</Link>
            </Button>
            <Button className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-primary px-8 py-4 rounded-lg font-semibold text-lg transition-colors shadow-lg" asChild>
              <Link to="/contact-us">Contact Us</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
