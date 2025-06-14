
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import AddToCartButton from "@/components/customer/AddToCartButton";

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

const Products = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const categories = ["All", "cotton", "silk", "linen", "wool", "denim", "synthetic"];

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching products:', error);
        return;
      }

      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products
    .filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "All" || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      const aPrice = a.selling_price_with_tax || a.discounted_price || a.price;
      const bPrice = b.selling_price_with_tax || b.discounted_price || b.price;
      
      switch (sortBy) {
        case "price-low":
          return Number(aPrice) - Number(bPrice);
        case "price-high":
          return Number(bPrice) - Number(aPrice);
        case "name":
        default:
          return a.name.localeCompare(b.name);
      }
    });

  const calculateDiscountPercentage = (originalPrice: number, discountedPrice: number) => {
    return Math.round(((originalPrice - discountedPrice) / originalPrice) * 100);
  };

  const getDisplayPrice = (product: Product) => {
    return product.selling_price_with_tax || product.discounted_price || product.price;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading products...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile-optimized header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Our Products</h1>
          <p className="text-gray-600 text-sm sm:text-base">Discover our premium collection of fabrics and materials</p>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12"
            />
          </div>

          {/* Mobile Filter Toggle */}
          <div className="flex items-center justify-between">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="sm:hidden"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
            
            {/* Sort - Always visible */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 hidden sm:inline">Sort:</span>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Category Filters - Collapsible on mobile */}
          <div className={`${showFilters ? 'block' : 'hidden'} sm:block`}>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Button 
                  key={category} 
                  variant={selectedCategory === category ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className="text-xs"
                >
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </Button>
              ))}
            </div>
          </div>

          {/* Price Information Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-blue-600 shrink-0" />
              <p className="text-sm text-blue-700">
                All prices shown include GST. Final price breakdown available on product detail page.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="group hover:shadow-md transition-all duration-200 bg-white">
              <CardContent className="p-0">
                <div className="relative">
                  <img
                    src={product.image || "/placeholder.svg"}
                    alt={product.name}
                    className="w-full h-40 sm:h-48 object-cover rounded-t-lg group-hover:scale-105 transition-transform duration-300"
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
                  
                  <div className="space-y-2 mb-3">
                    {product.discounted_price ? (
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-500 line-through">₹{Number(product.price).toFixed(2)}</span>
                          <span className="text-sm font-medium text-green-600">₹{Number(product.discounted_price).toFixed(2)}</span>
                        </div>
                        <div className="text-lg font-bold text-primary">₹{Number(getDisplayPrice(product)).toFixed(2)}</div>
                        <div className="text-xs text-gray-500">incl. GST</div>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="text-lg font-bold text-primary">₹{Number(getDisplayPrice(product)).toFixed(2)}</div>
                        <div className="text-xs text-gray-500">incl. {product.gst_percentage || 18}% GST</div>
                      </div>
                    )}
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
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-600">No products found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;
