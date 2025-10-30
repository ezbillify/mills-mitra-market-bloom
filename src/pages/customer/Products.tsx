import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import ProductCard from "@/components/customer/ProductCard";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useLocation, useNavigate } from "react-router-dom";

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
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Extract search query from URL parameters
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const searchParam = params.get('search');
    if (searchParam) {
      setSearchQuery(decodeURIComponent(searchParam));
    }
  }, [location.search]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, price, discounted_price, gst_percentage, selling_price_with_tax, image, category, stock, featured')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching products:', error);
        return;
      }

      console.log('Fetched products:', data);
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Update URL with search query
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/products');
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    navigate('/products');
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === "all" || 
                           product.category.toLowerCase() === selectedCategory.toLowerCase();
    
    return matchesSearch && matchesCategory;
  });

  // Get unique categories for filter
  const categories = ["all", ...Array.from(new Set(products.map(p => p.category)))];

  return (
    <div className="container mx-auto py-3 sm:py-4 md:py-8 px-3 sm:px-4">
      <div className="mb-4 sm:mb-6 md:mb-8">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-1 sm:mb-2 md:mb-3">Our Products</h1>
        <p className="text-gray-600 text-xs sm:text-sm md:text-base mb-3 sm:mb-4 md:mb-6">Discover our premium collection of millet-based health products</p>
        
        {/* Search and Filter Bar - Enhanced for mobile */}
        <div className="flex flex-col gap-2 sm:gap-3 mb-3 sm:mb-4">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="pl-8 sm:pl-10 pr-3 sm:pr-4 py-1.5 sm:py-2 w-full text-sm sm:text-base"
            />
          </form>
          
          {/* Mobile Filter Button */}
          <div className="sm:hidden">
            <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="w-full text-xs sm:text-sm">
                  <Filter className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                  Filters
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64">
                <SheetHeader>
                  <SheetTitle className="text-base sm:text-lg">Filters</SheetTitle>
                </SheetHeader>
                <div className="mt-4 sm:mt-6 space-y-3 sm:space-y-4">
                  <div>
                    <h3 className="font-medium mb-1.5 sm:mb-2 text-sm sm:text-base">Categories</h3>
                    <div className="space-y-1.5 sm:space-y-2">
                      {categories.map((category) => (
                        <Button
                          key={category}
                          variant={selectedCategory === category ? "default" : "outline"}
                          size="sm"
                          className="w-full justify-start text-xs sm:text-sm h-8 sm:h-9"
                          onClick={() => {
                            setSelectedCategory(category);
                            setIsFilterOpen(false);
                          }}
                        >
                          {category === "all" ? "All Categories" : category}
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  {(searchQuery || selectedCategory !== "all") && (
                    <Button 
                      onClick={clearFilters}
                      variant="outline"
                      size="sm"
                      className="w-full text-xs sm:text-sm h-8 sm:h-9"
                    >
                      <X className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                      Clear Filters
                    </Button>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
        
        {/* Desktop Category Filter */}
        <div className="hidden sm:flex gap-1.5 sm:gap-2 flex-wrap mb-2">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className="text-xs sm:text-sm h-7 sm:h-8 px-2 sm:px-3"
            >
              {category === "all" ? "All Categories" : category}
            </Button>
          ))}
        </div>
        
        {/* Active Filters Display */}
        {(searchQuery || selectedCategory !== "all") && (
          <div className="flex items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4 flex-wrap">
            <span className="text-xs sm:text-sm text-gray-600">Active filters:</span>
            {searchQuery && (
              <Badge variant="secondary" className="text-[10px] sm:text-xs">
                Search: {searchQuery}
                <button 
                  onClick={() => {
                    setSearchQuery("");
                    navigate('/products');
                  }}
                  className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                >
                  <X className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                </button>
              </Badge>
            )}
            {selectedCategory !== "all" && (
              <Badge variant="secondary" className="text-[10px] sm:text-xs">
                Category: {selectedCategory}
                <button 
                  onClick={() => setSelectedCategory("all")}
                  className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                >
                  <X className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                </button>
              </Badge>
            )}
            <Button 
              onClick={clearFilters}
              variant="ghost"
              size="sm"
              className="text-[10px] sm:text-xs h-5 sm:h-6 px-1.5 sm:px-2"
            >
              Clear all
            </Button>
          </div>
        )}
      </div>

      {/* Product Grid - Enhanced responsive behavior */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          {[1,2,3,4,5,6,7,8].map(i => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 h-32 sm:h-40 md:h-48 rounded-lg mb-2 sm:mb-3"></div>
              <div className="h-3 sm:h-4 bg-gray-200 rounded mb-1 sm:mb-2"></div>
              <div className="h-3 sm:h-4 bg-gray-200 rounded w-2/3 mb-2 sm:mb-3"></div>
              <div className="h-6 sm:h-8 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      ) : filteredProducts.length > 0 ? (
        <>
          <div className="mb-2 sm:mb-3 text-xs sm:text-sm text-gray-600">
            Showing {filteredProducts.length} of {products.length} products
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-8 sm:py-12">
          <div className="bg-gray-100 rounded-full w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <Search className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
          </div>
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-1 sm:mb-2">No products found</h3>
          <p className="text-gray-600 mb-3 sm:mb-4 max-w-md mx-auto text-sm sm:text-base">
            {searchQuery || selectedCategory !== "all" 
              ? "Try adjusting your search or filter criteria"
              : "Products will appear here once they are added to the store"
            }
          </p>
          {(searchQuery || selectedCategory !== "all") && (
            <Button 
              onClick={clearFilters}
              variant="outline"
              size="sm"
              className="text-xs sm:text-sm h-8 sm:h-9"
            >
              <X className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
              Clear Filters
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default Products;