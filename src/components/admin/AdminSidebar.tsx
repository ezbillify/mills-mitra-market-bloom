
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
    <div className="flex h-full w-64 flex-col bg-olive-leaf">
      <div className="flex h-16 items-center px-6">
        <h1 className="text-xl font-bold text-warm-cream">Admin Panel</h1>
      </div>
      
      <nav className="flex-1 space-y-1 px-4 py-4">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                isActive
                  ? "bg-golden-millet text-warm-brown"
                  : "text-warm-cream hover:bg-warm-beige hover:text-warm-brown"
              )}
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>
      
      <div className="p-4">
        <Button
          onClick={handleSignOut}
          variant="outline"
          className="w-full justify-start text-warm-cream border-warm-beige hover:bg-warm-beige hover:text-warm-brown"
        >
          <LogOut className="mr-3 h-5 w-5" />
          Sign Out
        </Button>
      </div>
    </div>
  );
};

export default AdminSidebar;
