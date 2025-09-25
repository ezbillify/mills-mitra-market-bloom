
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
      {/* Single unified header */}
      <div className="bg-primary text-white">
        <div className="container mx-auto px-4">
          {/* Top contact bar */}
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

          {/* Main navigation */}
          <div className="flex items-center justify-between py-4">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-3">
              <img 
                src="/lovable-uploads/15f592d4-1f27-4123-b5d7-dcf05b8463c7.png" 
                alt="Mills Mitra Logo" 
                className="w-12 h-12 object-contain"
              />
              <div className="text-white">
                <div className="text-xl font-bold">MILLS MITRA</div>
                <div className="text-xs opacity-90">pure organic millets products</div>
              </div>
            </Link>

            {/* Desktop Navigation and Search */}
            <div className="hidden lg:flex items-center space-x-8 flex-1 max-w-3xl mx-8">
              <nav className="flex items-center space-x-6">
                <Link to="/" className="text-white hover:text-gray-200 transition-colors font-medium">
                  Home
                </Link>
                <Link to="/products" className="text-white hover:text-gray-200 transition-colors font-medium">
                  Health Mix
                </Link>
                <Link to="/about-us" className="text-white hover:text-gray-200 transition-colors font-medium">
                  About Us
                </Link>
                <Link to="/contact-us" className="text-white hover:text-gray-200 transition-colors font-medium">
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
                    className="pl-10 pr-4 py-2 w-full bg-white border-0 rounded-md focus:ring-2 focus:ring-white focus:ring-opacity-50"
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
                    <Button variant="ghost" size="sm" className="relative p-2 text-white hover:bg-white hover:bg-opacity-20">
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
                        <Button variant="ghost" size="sm" className="p-2 text-white hover:bg-white hover:bg-opacity-20">
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
                      <Button variant="ghost" size="sm" className="lg:hidden p-2 text-white hover:bg-white hover:bg-opacity-20">
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
                            <span>+91 88619 23747</span>
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
                      <Button variant="ghost" size="sm" className="text-white hover:bg-white hover:bg-opacity-20">
                        Sign In
                      </Button>
                    </Link>
                    <Link to="/register">
                      <Button size="sm" className="bg-white text-primary hover:bg-gray-100">
                        Sign Up
                      </Button>
                    </Link>
                  </div>

                  {/* Mobile Auth Menu */}
                  <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                    <SheetTrigger asChild>
                      <Button variant="ghost" size="sm" className="lg:hidden p-2 text-white hover:bg-white hover:bg-opacity-20">
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
                            <span>+91 88619 23747</span>
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
      </div>
    </header>
  );
};

export default CustomerHeader;
