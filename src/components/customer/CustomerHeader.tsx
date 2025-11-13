import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShoppingCart, User, LogOut, Package, Menu, Phone, Mail, Search, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { useCartCount } from "@/hooks/useCartCount";
import AdminAccessButton from "./AdminAccessButton";
import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const CustomerHeader = () => {
  const { user, signOut } = useAuth();
  const { cartCount, refetchCartCount } = useCartCount();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
    setMobileMenuOpen(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      setMobileMenuOpen(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch(e as any);
    }
  };

  // Ensure cart badge updates as soon as a product is added to cart in ANY tab/component
  useEffect(() => {
    // Listen for the custom event fired when "Add to Cart" occurs
    function handleInstantRecount() {
      refetchCartCount();
    }
    window.addEventListener("cart_instant_update", handleInstantRecount);
    return () => {
      window.removeEventListener("cart_instant_update", handleInstantRecount);
    };
  }, [refetchCartCount]);

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      {/* Top contact bar - Hidden on mobile for better space utilization */}
      <div className="bg-primary text-white hidden sm:block">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between text-sm py-2">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4" />
                <span className="hidden sm:inline">+91 88619 23747</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4" />
                <span className="hidden sm:inline">support@millsmitra.com</span>
              </div>
            </div>
            <div className="flex items-center space-x-4 text-xs sm:text-sm">
              <span className="hidden md:inline">Free Shipping on Orders ₹700+</span>
              <Link to="/orders" className="hover:underline">Track Your Order</Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main navigation */}
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-2 sm:py-3">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 sm:space-x-3">
            <img 
              src="/lovable-uploads/15f592d4-1f27-4123-b5d7-dcf05b8463c7.png" 
              alt="Mills Mitra Logo" 
              className="w-8 h-8 sm:w-10 sm:h-10 object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/placeholder.svg';
              }}
            />
            <div className="text-white">
              <div className="text-base sm:text-lg font-bold text-primary">MILLS MITRA</div>
              <div className="text-[8px] sm:text-[10px] text-gray-600 hidden sm:block">Pure Organic Millets Products</div>
            </div>
          </Link>

          {/* Desktop Navigation and Search */}
          <div className="hidden lg:flex items-center space-x-6 flex-1 max-w-3xl mx-4">
            <nav className="flex items-center space-x-4">
              <Link to="/" className="text-primary hover:text-gray-700 transition-colors font-medium text-sm">
                Home
              </Link>
              <Link to="/products" className="text-primary hover:text-gray-700 transition-colors font-medium text-sm">
                Health Mix
              </Link>
              <Link to="/about-us" className="text-primary hover:text-gray-700 transition-colors font-medium text-sm">
                About Us
              </Link>
              <Link to="/contact-us" className="text-primary hover:text-gray-700 transition-colors font-medium text-sm">
                Contact
              </Link>
            </nav>
            
            {/* Search bar */}
            <div className="flex-1 max-w-md">
              <form onSubmit={handleSearch}>
                <div className="relative">
                  <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleKeyPress}
                    className="pl-8 sm:pl-10 pr-3 sm:pr-4 py-1.5 sm:py-2 w-full bg-gray-100 border-0 rounded-md focus:ring-2 focus:ring-primary text-sm"
                  />
                </div>
              </form>
            </div>
          </div>

          {/* Right side actions */}
          <div className="flex items-center space-x-1 sm:space-x-2">
            {/* Cart - Always visible */}
            <Link to="/cart" className="relative">
              <Button variant="ghost" size="icon" className="relative p-1.5 sm:p-2 text-primary hover:bg-gray-100 h-8 w-8 sm:h-9 sm:w-9">
                <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
                {cartCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-3.5 w-3.5 sm:h-4 sm:w-4 flex items-center justify-center text-[8px] sm:text-xs p-0 min-w-3.5 sm:min-w-4"
                  >
                    {cartCount > 99 ? '99+' : cartCount}
                  </Badge>
                )}
              </Button>
            </Link>

            {user ? (
              <>
                {/* Desktop User menu */}
                <div className="hidden sm:block">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="p-1.5 sm:p-2 text-primary hover:bg-gray-100 h-8 w-8 sm:h-9 sm:w-9">
                        <User className="h-4 w-4 sm:h-5 sm:w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40 sm:w-48">
                      <DropdownMenuItem asChild>
                        <Link to="/account" className="flex items-center text-sm">
                          <User className="h-4 w-4 mr-2" />
                          My Account
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/orders" className="flex items-center text-sm">
                          <Package className="h-4 w-4 mr-2" />
                          My Orders
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleSignOut} className="flex items-center text-sm">
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign Out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Admin Access Button - Hidden on mobile */}
                <div className="hidden sm:block">
                  <AdminAccessButton />
                </div>
              </>
            ) : (
              <>
                {/* Desktop Auth Buttons */}
                <div className="hidden sm:flex items-center space-x-1">
                  <Link to="/login">
                    <Button variant="ghost" size="sm" className="text-primary hover:bg-gray-100 text-xs sm:text-sm h-7 sm:h-8 px-2 sm:px-3">
                      Sign In
                    </Button>
                  </Link>
                  <Link to="/register">
                    <Button size="sm" className="bg-primary text-white hover:bg-primary/90 text-xs sm:text-sm h-7 sm:h-8 px-2 sm:px-3">
                      Sign Up
                    </Button>
                  </Link>
                </div>
              </>
            )}

            {/* Mobile Menu Trigger */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden p-1.5 sm:p-2 text-primary hover:bg-gray-100 h-8 w-8 sm:h-9 sm:w-9">
                  <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64 p-0">
                <SheetHeader className="p-3 sm:p-4 border-b">
                  <SheetTitle className="flex items-center justify-between text-base sm:text-lg">
                    <span>Menu</span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="p-1 h-auto"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <X className="h-4 w-4 sm:h-5 sm:w-5" />
                    </Button>
                  </SheetTitle>
                </SheetHeader>
                <div className="flex flex-col h-full">
                  <div className="flex-1 overflow-y-auto p-3 sm:p-4">
                    {/* Mobile Search */}
                    <form onSubmit={handleSearch} className="relative mb-4 sm:mb-6">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        type="text"
                        placeholder="Search products..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={handleKeyPress}
                        className="pl-10 pr-4 py-2 w-full text-sm"
                      />
                    </form>
                    
                    {/* Navigation Links */}
                    <nav className="space-y-1 mb-4 sm:mb-6">
                      <Link 
                        to="/" 
                        className="block py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg hover:bg-gray-100 font-medium text-sm"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Home
                      </Link>
                      <Link 
                        to="/products" 
                        className="block py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg hover:bg-gray-100 font-medium text-sm"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Health Mix
                      </Link>
                      <Link 
                        to="/about-us" 
                        className="block py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg hover:bg-gray-100 font-medium text-sm"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        About Us
                      </Link>
                      <Link 
                        to="/contact-us" 
                        className="block py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg hover:bg-gray-100 font-medium text-sm"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Contact
                      </Link>
                    </nav>
                    
                    {/* User Menu */}
                    {user ? (
                      <div className="space-y-1 mb-4 sm:mb-6">
                        <Link 
                          to="/account" 
                          className="flex items-center py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg hover:bg-gray-100 text-sm"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <User className="h-4 w-4 mr-3" />
                          My Account
                        </Link>
                        <Link 
                          to="/orders" 
                          className="flex items-center py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg hover:bg-gray-100 text-sm"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <Package className="h-4 w-4 mr-3" />
                          My Orders
                        </Link>
                        <button 
                          onClick={handleSignOut}
                          className="flex items-center w-full py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg hover:bg-gray-100 text-left text-sm"
                        >
                          <LogOut className="h-4 w-4 mr-3" />
                          Sign Out
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2 mb-4 sm:mb-6">
                        <Link 
                          to="/login" 
                          className="block py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg bg-gray-100 text-center font-medium text-sm"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          Sign In
                        </Link>
                        <Link 
                          to="/register" 
                          className="block py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg bg-primary text-white text-center font-medium text-sm"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          Sign Up
                        </Link>
                      </div>
                    )}
                    
                    {/* Admin Access */}
                    {user && (
                      <div className="mb-4 sm:mb-6">
                        <AdminAccessButton />
                      </div>
                    )}
                    
                    {/* Mobile contact info */}
                    <div className="pt-3 sm:pt-4 border-t space-y-2 sm:space-y-3 text-xs sm:text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        <span>+91 88619 23747</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        <span>support@millsmitra.com</span>
                      </div>
                      <div className="text-[10px] sm:text-xs text-gray-500 mt-1">
                        Free Shipping on Orders ₹700+
                      </div>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};

export default CustomerHeader;