
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Users, 
  Package,
  FileText,
  Settings 
} from "lucide-react";

const AdminSidebar = () => {
  const location = useLocation();
  
  const navigation = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Orders", href: "/admin/orders", icon: ShoppingCart },
    { name: "Customers", href: "/admin/customers", icon: Users },
    { name: "Products", href: "/admin/products", icon: Package },
    { name: "Invoices", href: "/admin/invoices", icon: FileText },
    { name: "Settings", href: "/admin/settings", icon: Settings },
  ];

  return (
    <div className="bg-gray-900 text-white w-64 min-h-screen">
      <div className="p-6">
        <Link to="/admin" className="text-xl font-bold">
          MILLS MITRA
        </Link>
        <p className="text-gray-400 text-sm mt-1">Admin Panel</p>
      </div>
      
      <nav className="mt-8">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href || 
            (item.href !== "/admin" && location.pathname.startsWith(item.href));
          
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center px-6 py-3 text-sm hover:bg-gray-800 transition-colors",
                isActive && "bg-gray-800 border-r-2 border-blue-500"
              )}
            >
              <item.icon className="h-5 w-5 mr-3" />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default AdminSidebar;
