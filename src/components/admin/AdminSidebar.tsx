
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  BarChart3,
  Image,
  Grid3X3,
  Truck,
  FileText,
  Palette,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useState } from "react";

const sidebarItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    href: "/admin",
  },
  {
    title: "Products",
    icon: Package,
    href: "/admin/products",
  },
  {
    title: "Orders", 
    icon: ShoppingCart,
    href: "/admin/orders",
  },
  {
    title: "Customers",
    icon: Users,
    href: "/admin/customers",
  },
  {
    title: "Analytics",
    icon: BarChart3,
    href: "/admin/analytics",
  },
  {
    title: "Banners",
    icon: Image,
    href: "/admin/banners",
  },
  {
    title: "Categories",
    icon: Grid3X3,
    href: "/admin/categories",
  },
  {
    title: "Shipping",
    icon: Truck,
    href: "/admin/shipping",
  },
  {
    title: "Invoice Settings",
    icon: FileText,
    href: "/admin/invoice-settings",
  },
];

const AdminSidebar = () => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={cn(
      "relative border-r bg-white transition-all duration-300",
      collapsed ? "w-16" : "w-64"
    )}>
      <div className="flex h-14 items-center border-b px-4">
        {!collapsed && (
          <Link to="/admin" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
              <LayoutDashboard className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-lg">Admin Panel</span>
          </Link>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "h-8 w-8 p-0",
            collapsed ? "mx-auto" : "ml-auto"
          )}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="space-y-2 p-2">
          {sidebarItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link key={item.href} to={item.href}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start",
                    collapsed && "px-2",
                    isActive && "bg-primary/10 text-primary font-medium"
                  )}
                >
                  <item.icon className={cn("h-4 w-4", !collapsed && "mr-2")} />
                  {!collapsed && item.title}
                </Button>
              </Link>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};

export default AdminSidebar;
