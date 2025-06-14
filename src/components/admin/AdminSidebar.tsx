import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Package, Users, ShoppingCart, BarChart3, Image, Settings, LogOut, Truck, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
const AdminSidebar = () => {
  const location = useLocation();
  const {
    signOut
  } = useAuth();
  const navigation = [{
    name: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard
  }, {
    name: "Products",
    href: "/admin/products",
    icon: Package
  }, {
    name: "Categories",
    href: "/admin/categories",
    icon: Tag
  }, {
    name: "Orders",
    href: "/admin/orders",
    icon: ShoppingCart
  }, {
    name: "Customers",
    href: "/admin/customers",
    icon: Users
  }, {
    name: "Analytics",
    href: "/admin/analytics",
    icon: BarChart3
  }, {
    name: "Banners",
    href: "/admin/banners",
    icon: Image
  }, {
    name: "Shipping",
    href: "/admin/shipping",
    icon: Truck
  }];
  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };
  return <div className="flex h-full w-80 flex-col bg-white shadow-xl border-r border-gray-100">
      {/* Header */}
      <div className="flex h-24 items-center px-8 border-b border-gray-100 bg-gradient-to-r from-royal-green to-medium-green">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-lg ring-2 ring-white/20">
            <LayoutDashboard className="w-7 h-7 text-royal-green" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-emerald-500">Admin Panel</h1>
            <p className="text-sm font-medium text-green-950">Mills Mitra Market</p>
          </div>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 px-6 py-8 space-y-2 bg-gradient-to-b from-gray-50/50 to-white">
        <div className="mb-6">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 mb-3">
            Management
          </h2>
        </div>
        {navigation.map(item => {
        const isActive = location.pathname === item.href;
        return <Link key={item.name} to={item.href} className={cn("group flex items-center px-4 py-3.5 text-sm font-medium rounded-xl transition-all duration-300 ease-out relative overflow-hidden", isActive ? "bg-royal-green text-white shadow-lg shadow-royal-green/25 scale-[1.02]" : "text-gray-700 hover:bg-gradient-to-r hover:from-royal-green/5 hover:to-medium-green/5 hover:text-royal-green hover:translate-x-1")}>
              {/* Active indicator */}
              {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-white rounded-r-full" />}
              
              <item.icon className={cn("mr-4 h-5 w-5 transition-all duration-300", isActive ? "text-white transform scale-110" : "text-gray-500 group-hover:text-royal-green group-hover:scale-110")} />
              
              <span className="relative z-10">{item.name}</span>
              
              {/* Hover effect background */}
              {!isActive && <div className="absolute inset-0 bg-gradient-to-r from-royal-green/0 to-royal-green/0 group-hover:from-royal-green/5 group-hover:to-medium-green/5 rounded-xl transition-all duration-300" />}
            </Link>;
      })}
      </nav>
      
      {/* Footer */}
      <div className="p-6 border-t border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100/50">
        <div className="mb-4 p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-royal-green to-medium-green rounded-full flex items-center justify-center">
              <span className="text-xs font-bold text-white">A</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">Admin User</p>
              <p className="text-xs text-gray-500 truncate">administrator</p>
            </div>
          </div>
        </div>
        
        <Button onClick={handleSignOut} variant="outline" className="w-full justify-start bg-white border-gray-200 text-gray-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all duration-200 shadow-sm">
          <LogOut className="mr-3 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>;
};
export default AdminSidebar;