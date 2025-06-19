
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShoppingCart, User, LogOut, Package, Menu, Phone, Mail, Search } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { useCartCount } from "@/hooks/useCartCount";
import AdminAccessButton from "./AdminAccessButton";
import { useState, useEffect } from "react";
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
  SheetTrigger,
} from "@/components/ui/sheet";

const CustomerHeader = () => {
  const { user, signOut } = useAuth();
  const { cartCount, refetchCartCount } = useCartCount();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
    setMobileMenuOpen(false);
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
      {/* Top bar with contact info and shipping info */}
      <div className="bg-primary text-white py-2 hidden md:block">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4" />
                <span>+91 98765 43210</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4" />
                <span>support@millsmitra.com</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span>Free Shipping on Orders ₹999+</span>
              <Link to="/orders" className="hover:underline">Track Your Order</Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="text-2xl font-bold text-primary flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-bold">
              M
            </div>
            <span>MILLS MITRA</span>
          </Link>

          {/* Desktop Navigation and Search */}
          <div className="hidden md:flex items-center space-x-8 flex-1 max-w-2xl mx-8">
            <nav className="flex items-center space-x-6">
              <Link to="/" className="text-gray-700 hover:text-primary transition-colors font-medium">
                Home
              </Link>
              <Link to="/products" className="text-gray-700 hover:text-primary transition-colors font-medium">
                Health Mix
              </Link>
              <Link to="/about-us" className="text-gray-700 hover:text-primary transition-colors font-medium">
                About Us
              </Link>
              <Link to="/contact-us" className="text-gray-700 hover:text-primary transition-colors font-medium">
                Contact
              </Link>
            </nav>
            
            {/* Search bar */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search for millet products..."
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Right side actions */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                {/* Cart - Always visible */}
                <Link to="/cart">
                  <Button variant="ghost" size="sm" className="relative p-2">
                    <ShoppingCart className="h-5 w-5" />
                    {cartCount > 0 && (
                      <Badge 
                        variant="destructive" 
                        className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center text-xs p-0 min-w-4"
                      >
                        {cartCount > 99 ? '99+' : cartCount}
                      </Badge>
                    )}
                  </Button>
                </Link>

                {/* Desktop User menu */}
                <div className="hidden sm:block">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="p-2">
                        <User className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem asChild>
                        <Link to="/account" className="flex items-center">
                          <User className="h-4 w-4 mr-2" />
                          My Account
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/orders" className="flex items-center">
                          <Package className="h-4 w-4 mr-2" />
                          My Orders
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleSignOut} className="flex items-center">
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

                {/* Mobile Menu */}
                <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="sm" className="sm:hidden p-2">
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-64">
                    <div className="flex flex-col space-y-4 mt-8">
                      {/* Mobile Search */}
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          type="text"
                          placeholder="Search products..."
                          className="pl-10 pr-4 py-2 w-full"
                        />
                      </div>
                      
                      <Link 
                        to="/" 
                        className="text-lg font-medium"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Home
                      </Link>
                      <Link 
                        to="/products" 
                        className="text-lg font-medium"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Health Mix
                      </Link>
                      <Link 
                        to="/about-us" 
                        className="text-lg font-medium"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        About Us
                      </Link>
                      <Link 
                        to="/contact-us" 
                        className="text-lg font-medium"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Contact
                      </Link>
                      <Link 
                        to="/account" 
                        className="text-lg font-medium flex items-center"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <User className="h-5 w-5 mr-2" />
                        My Account
                      </Link>
                      <Link 
                        to="/orders" 
                        className="text-lg font-medium flex items-center"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Package className="h-5 w-5 mr-2" />
                        My Orders
                      </Link>
                      
                      {/* Mobile contact info */}
                      <div className="pt-4 border-t space-y-2 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <Phone className="h-4 w-4" />
                          <span>+91 98765 43210</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Mail className="h-4 w-4" />
                          <span>support@millsmitra.com</span>
                        </div>
                      </div>
                      
                      <div className="pt-4 border-t">
                        <AdminAccessButton />
                      </div>
                      <Button 
                        variant="outline" 
                        onClick={handleSignOut}
                        className="justify-start"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign Out
                      </Button>
                    </div>
                  </SheetContent>
                </Sheet>
              </>
            ) : (
              <>
                {/* Desktop Auth Buttons */}
                <div className="hidden sm:flex items-center space-x-2">
                  <Link to="/login">
                    <Button variant="ghost" size="sm">Sign In</Button>
                  </Link>
                  <Link to="/register">
                    <Button size="sm">Sign Up</Button>
                  </Link>
                </div>

                {/* Mobile Auth Menu */}
                <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="sm" className="sm:hidden p-2">
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-64">
                    <div className="flex flex-col space-y-4 mt-8">
                      {/* Mobile Search */}
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          type="text"
                          placeholder="Search products..."
                          className="pl-10 pr-4 py-2 w-full"
                        />
                      </div>
                      
                      <Link 
                        to="/" 
                        className="text-lg font-medium"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Home
                      </Link>
                      <Link 
                        to="/products" 
                        className="text-lg font-medium"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Health Mix
                      </Link>
                      <Link 
                        to="/about-us" 
                        className="text-lg font-medium"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        About Us
                      </Link>
                      <Link 
                        to="/contact-us" 
                        className="text-lg font-medium"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Contact
                      </Link>
                      
                      {/* Mobile contact info */}
                      <div className="pt-4 border-t space-y-2 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <Phone className="h-4 w-4" />
                          <span>+91 98765 43210</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Mail className="h-4 w-4" />
                          <span>support@millsmitra.com</span>
                        </div>
                      </div>
                      
                      <div className="pt-4 border-t space-y-2">
                        <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                          <Button variant="outline" className="w-full">Sign In</Button>
                        </Link>
                        <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                          <Button className="w-full">Sign Up</Button>
                        </Link>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default CustomerHeader;
