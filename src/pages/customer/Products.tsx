
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const Products = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("name");
  
  // Mock products data
  const products = [
    {
      id: 1,
      name: "Premium Cotton Fabric",
      price: 299,
      originalPrice: 399,
      image: "https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?w=300&h=300&fit=crop",
      category: "Cotton",
      inStock: true,
      rating: 4.5
    },
    {
      id: 2,
      name: "Silk Blend Material",
      price: 599,
      originalPrice: 799,
      image: "https://images.unsplash.com/photo-1558618047-1c4b9c3b0e70?w=300&h=300&fit=crop",
      category: "Silk",
      inStock: true,
      rating: 4.8
    },
    {
      id: 3,
      name: "Linen Collection",
      price: 449,
      originalPrice: 549,
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop",
      category: "Linen",
      inStock: false,
      rating: 4.2
    },
    {
      id: 4,
      name: "Wool Fabric",
      price: 699,
      originalPrice: 899,
      image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=300&fit=crop",
      category: "Wool",
      inStock: true,
      rating: 4.7
    },
    {
      id: 5,
      name: "Denim Material",
      price: 399,
      originalPrice: 499,
      image: "https://images.unsplash.com/photo-1582142306909-195724d33861?w=300&h=300&fit=crop",
      category: "Denim",
      inStock: true,
      rating: 4.3
    },
    {
      id: 6,
      name: "Polyester Blend",
      price: 199,
      originalPrice: 299,
      image: "https://images.unsplash.com/photo-1596003906949-67221c37965c?w=300&h=300&fit=crop",
      category: "Synthetic",
      inStock: true,
      rating: 4.0
    }
  ];

  const categories = ["All", "Cotton", "Silk", "Linen", "Wool", "Denim", "Synthetic"];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Our Products</h1>
        <p className="text-gray-600">Discover our premium collection of fabrics and materials</p>
      </div>

      {/* Filters */}
      <div className="mb-8 space-y-4 md:space-y-0 md:flex md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <Button key={category} variant="outline" size="sm">
              {category}
            </Button>
          ))}
        </div>
        
        <div className="flex gap-4">
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-64"
          />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
              <SelectItem value="rating">Rating</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product) => (
          <Card key={product.id} className="group hover:shadow-lg transition-shadow">
            <CardContent className="p-0">
              <div className="relative">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-48 object-cover rounded-t-lg group-hover:scale-105 transition-transform duration-300"
                />
                {!product.inStock && (
                  <Badge className="absolute top-2 left-2 bg-red-500">Out of Stock</Badge>
                )}
                <div className="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
                  ⭐ {product.rating}
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold mb-1">{product.name}</h3>
                <p className="text-sm text-gray-500 mb-2">{product.category}</p>
                <div className="flex items-center space-x-2 mb-3">
                  <span className="text-lg font-bold text-primary">₹{product.price}</span>
                  <span className="text-sm text-gray-500 line-through">₹{product.originalPrice}</span>
                </div>
                <Button 
                  className="w-full" 
                  disabled={!product.inStock}
                  asChild={product.inStock}
                >
                  {product.inStock ? (
                    <Link to={`/products/${product.id}`}>View Details</Link>
                  ) : (
                    "Out of Stock"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Products;
