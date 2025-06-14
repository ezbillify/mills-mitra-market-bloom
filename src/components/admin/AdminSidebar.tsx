
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  ShoppingCart, 
  BarChart3, 
  Image,
  Settings,
  LogOut,
  Truck,
  Tag
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

const AdminSidebar = () => {
  const location = useLocation();
  const { signOut } = useAuth();

  const navigation = [
    {
      name: "Dashboard",
      href: "/admin",
      icon: LayoutDashboard,
    },
    {
      name: "Products",
      href: "/admin/products",
      icon: Package,
    },
    {
      name: "Categories",
      href: "/admin/categories",
      icon: Tag,
    },
    {
      name: "Orders",
      href: "/admin/orders",
      icon: ShoppingCart,
    },
    {
      name: "Customers",
      href: "/admin/customers",
      icon: Users,
    },
    {
      name: "Analytics",
      href: "/admin/analytics",
      icon: BarChart3,
    },
    {
      name: "Banners",
      href: "/admin/banners",
      icon: Image,
    },
    {
      name: "Shipping",
      href: "/admin/shipping",
      icon: Truck,
    },
  ];

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="flex h-full w-72 flex-col bg-gradient-to-b from-royal-green to-royal-green/90 shadow-2xl border-r border-royal-green/20">
      {/* Header */}
      <div className="flex h-20 items-center px-8 border-b border-white/20">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg">
            <LayoutDashboard className="w-6 h-6 text-royal-green" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Admin Panel</h1>
            <p className="text-sm text-white/80">Mills Mitra Market</p>
          </div>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 space-y-2 px-6 py-6">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group",
                isActive
                  ? "bg-white text-royal-green shadow-lg shadow-white/30 transform scale-105"
                  : "text-white hover:bg-white/20 hover:text-white hover:translate-x-1"
              )}
            >
              <item.icon className={cn(
                "mr-3 h-5 w-5 transition-transform duration-200",
                isActive ? "text-royal-green" : "text-white/80 group-hover:text-white"
              )} />
              {item.name}
            </Link>
          );
        })}
      </nav>
      
      {/* Footer */}
      <div className="p-6 border-t border-white/20">
        <Button
          onClick={handleSignOut}
          variant="outline"
          className="w-full justify-start text-white border-white/30 hover:bg-white/20 hover:text-white hover:border-white/50 transition-all duration-200"
        >
          <LogOut className="mr-3 h-5 w-5" />
          Sign Out
        </Button>
      </div>
    </div>
  );
};

export default AdminSidebar;
