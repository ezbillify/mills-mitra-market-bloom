import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { 
  Info, 
  Leaf, 
  Heart, 
  Shield, 
  Star, 
  ShoppingCart, 
  Truck, 
  Award, 
  Users,
  ChevronRight
} from "lucide-react";
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
  featured: boolean;
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
        .select('id, name, price, discounted_price, gst_percentage, selling_price_with_tax, image, category, stock, featured')
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
      <section className="relative min-h-[150px] sm:min-h-[250px] md:min-h-[350px] lg:h-[500px] overflow-hidden">
        <HeroBanner />
      </section>

      {/* Featured Products - Enhanced UI */}
      <section className="py-8 sm:py-12 bg-white">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="text-center mb-6 sm:mb-10 md:mb-12">
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 sm:mb-3">Featured Products</h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-xs sm:text-sm md:text-base">
              Discover our most popular millet-based products that blend traditional wisdom with modern convenience.
            </p>
          </div>
          
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-200 h-32 sm:h-48 md:h-64 rounded-lg mb-2 sm:mb-3"></div>
                  <div className="h-3 sm:h-4 bg-gray-200 rounded mb-1 sm:mb-2"></div>
                  <div className="h-3 sm:h-4 bg-gray-200 rounded w-2/3 mb-2 sm:mb-3"></div>
                  <div className="h-6 sm:h-8 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
              {featuredProducts.map(product => {
                const basePrice = getBasePrice(product);
                const gstAmount = getGSTAmount(product);
                const finalPrice = product.selling_price_with_tax || (basePrice + gstAmount);

                return (
                  <div key={product.id} className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border hover:-translate-y-1 flex flex-col h-full">
                    {/* Make the image area clickable */}
                    <Link to={`/products/${product.id}`} className="block">
                      <div className="relative overflow-hidden bg-gray-50 flex items-center justify-center aspect-square">
                        <img
                          src={product.image || '/placeholder.svg'}
                          alt={product.name}
                          className="w-full h-full object-contain p-4 transition-transform duration-300 group-hover:scale-105"
                        />
                        {product.discounted_price && (
                          <div className="absolute top-2 sm:top-3 left-2 sm:left-3 bg-red-500 text-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold">
                            {calculateDiscountPercentage(product.price, product.discounted_price)}% OFF
                          </div>
                        )}
                        {product.stock === 0 && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <span className="bg-red-500 text-white px-2 sm:px-3 py-1 rounded-lg font-semibold text-xs sm:text-sm">Out of Stock</span>
                          </div>
                        )}
                        {product.featured && (
                          <div className="absolute top-2 sm:top-3 right-2 sm:right-3 bg-yellow-500 text-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold">
                            Featured
                          </div>
                        )}
                      </div>
                    </Link>
                    
                    <div className="p-4 sm:p-5 flex flex-col flex-grow">
                      {/* Make product name clickable */}
                      <Link to={`/products/${product.id}`} className="block">
                        <div className="flex items-start justify-between mb-2 sm:mb-3">
                          <h3 className="font-bold text-sm md:text-base text-gray-900 line-clamp-2 hover:text-primary transition-colors flex-grow">
                            {product.name}
                          </h3>
                          <span className="bg-green-100 text-green-800 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium ml-2 flex-shrink-0">
                            {product.category}
                          </span>
                        </div>
                      </Link>
                      
                      <div className="mb-3 sm:mb-4">
                        {product.discounted_price ? (
                          <div className="flex items-baseline gap-1.5 sm:gap-2">
                            <span className="text-lg sm:text-xl md:text-2xl font-bold text-green-600">₹{Number(product.discounted_price).toFixed(2)}</span>
                            <span className="text-xs sm:text-sm text-gray-500 line-through">₹{Number(product.price).toFixed(2)}</span>
                          </div>
                        ) : (
                          <div className="text-lg sm:text-xl md:text-2xl font-bold text-green-600">₹{Number(product.price).toFixed(2)}</div>
                        )}
                        <div className="text-[10px] sm:text-xs text-gray-600 mt-1">
                          Final Price: <span className="font-semibold">₹{finalPrice.toFixed(0)}</span> (incl. GST)
                        </div>
                      </div>
                      <div className="flex items-center justify-between mb-3 sm:mb-4">
                        <span className="text-[10px] sm:text-xs text-gray-600">Stock:</span>
                        {product.stock > 0 ? (
                          <span className="bg-green-100 text-green-800 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium">
                            {product.stock} units
                          </span>
                        ) : (
                          <span className="bg-red-100 text-red-800 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium">
                            Out of Stock
                          </span>
                        )}
                      </div>
                      <div className="space-y-2 mt-auto">
                        <AddToCartButton 
                          productId={product.id}
                          productName={product.name}
                          disabled={product.stock === 0}
                          showBuyNow={true}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div className="text-center mt-6 sm:mt-8 md:mt-10">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-white px-4 sm:px-6 md:px-8 py-2 sm:py-3 md:py-4 rounded-lg font-semibold text-sm sm:text-base md:text-lg shadow-lg" asChild>
              <Link to="/products" className="flex items-center gap-1 sm:gap-2">
                View All Products
                <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Trust Indicators - Enhanced for mobile */}
      <section className="py-8 bg-primary text-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 text-center">
            <div className="flex flex-col items-center p-2">
              <div className="bg-white/20 p-3 rounded-full mb-2">
                <Truck className="h-6 w-6 sm:h-8 sm:w-8" />
              </div>
              <span className="font-semibold text-sm">Free Shipping</span>
              <span className="text-xs opacity-80 mt-1">On orders ₹700+</span>
            </div>
            <div className="flex flex-col items-center p-2">
              <div className="bg-white/20 p-3 rounded-full mb-2">
                <Award className="h-6 w-6 sm:h-8 sm:w-8" />
              </div>
              <span className="font-semibold text-sm">Premium Quality</span>
              <span className="text-xs opacity-80 mt-1">Certified Products</span>
            </div>
            <div className="flex flex-col items-center p-2">
              <div className="bg-white/20 p-3 rounded-full mb-2">
                <Users className="h-6 w-6 sm:h-8 sm:w-8" />
              </div>
              <span className="font-semibold text-sm">10K+ Customers</span>
              <span className="text-xs opacity-80 mt-1">Trusted by families</span>
            </div>
            <div className="flex flex-col items-center p-2">
              <div className="bg-white/20 p-3 rounded-full mb-2">
                <Star className="h-6 w-6 sm:h-8 sm:w-8" />
              </div>
              <span className="font-semibold text-sm">5★ Rated</span>
              <span className="text-xs opacity-80 mt-1">Customer satisfaction</span>
            </div>
          </div>
        </div>
      </section>

      {/* Product Categories Mini-Banner */}
      <section className="py-10 sm:py-12 bg-accent/30">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-6 sm:mb-8">
            Best Buy for the Season - Combo Deals Packed with Nutrition
          </h2>
          <div className="grid md:grid-cols-1 gap-4 sm:gap-6 max-w-md mx-auto">
            <div className="bg-white p-5 sm:p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <h3 className="font-bold text-lg sm:text-xl text-green-700 mb-2">Health Mix</h3>
              <p className="text-gray-600 text-sm">Premium millet health mixes with Ayurvedic herbs</p>
            </div>
          </div>
        </div>
      </section>

      {/* Health Benefits - Improved grid for mobile */}
      <section className="py-12 sm:py-16 bg-green-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3">
              Add Millets To Your Daily Diet And Add Happiness To Your Lifestyle
            </h2>
            <p className="text-gray-600 max-w-3xl mx-auto text-sm sm:text-base leading-relaxed">
              Millets are naturally rich in nutrients and drought-tolerant, grown in arid regions of India. 
              They provide exceptional health benefits and play a vital role in ecological security.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            <div className="bg-white p-5 sm:p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <div className="bg-red-100 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <Heart className="h-6 w-6 text-red-500" />
              </div>
              <h3 className="font-bold text-lg mb-2">Heart Healthy</h3>
              <p className="text-gray-600 text-sm">Rich in antioxidants that help lower cholesterol and maintain healthy blood vessels</p>
            </div>
            <div className="bg-white p-5 sm:p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <div className="bg-blue-100 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-blue-500" />
              </div>
              <h3 className="font-bold text-lg mb-2">Diabetes Management</h3>
              <p className="text-gray-600 text-sm">Low glycemic index helps stabilize blood sugar levels and promotes insulin sensitivity</p>
            </div>
            <div className="bg-white p-5 sm:p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <div className="bg-green-100 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <Leaf className="h-6 w-6 text-green-500" />
              </div>
              <h3 className="font-bold text-lg mb-2">Weight Management</h3>
              <p className="text-gray-600 text-sm">High fiber content aids in weight loss and improves gut health for sustained results</p>
            </div>
            <div className="bg-white p-5 sm:p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <div className="bg-yellow-100 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <Star className="h-6 w-6 text-yellow-500" />
              </div>
              <h3 className="font-bold text-lg mb-2">Cancer Prevention</h3>
              <p className="text-gray-600 text-sm">Phytochemicals help inhibit growth of cancerous cells without damaging normal cells</p>
            </div>
            <div className="bg-white p-5 sm:p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <div className="bg-purple-100 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <Info className="h-6 w-6 text-purple-500" />
              </div>
              <h3 className="font-bold text-lg mb-2">Digestive Health</h3>
              <p className="text-gray-600 text-sm">Rich dietary fiber improves digestion and supports liver and kidney function</p>
            </div>
            <div className="bg-white p-5 sm:p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <div className="bg-orange-100 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <Award className="h-6 w-6 text-orange-500" />
              </div>
              <h3 className="font-bold text-lg mb-2">Instant Energy</h3>
              <p className="text-gray-600 text-sm">Provides immediate energy boost while building strong muscles and boosting immunity</p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action - Enhanced for mobile */}
      <section className="py-12 sm:py-16 bg-primary text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6">Ready to Transform Your Health?</h2>
          <p className="text-base sm:text-xl mb-8 sm:mb-10 opacity-90 max-w-2xl mx-auto">
            Join thousands of families who trust our premium millet products for their daily nutrition needs
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <Button className="bg-white text-primary hover:bg-gray-100 px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold text-base sm:text-lg transition-colors shadow-lg" asChild>
              <Link to="/products">Start Shopping</Link>
            </Button>
            <Button className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-primary px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold text-base sm:text-lg transition-colors shadow-lg" asChild>
              <Link to="/contact-us">Contact Us</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;