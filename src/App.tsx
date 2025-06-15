
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useRealtimeSubscriptions } from "@/hooks/useRealtimeSubscriptions";
import CustomerLayout from "@/layouts/CustomerLayout";
import AdminLayout from "@/layouts/AdminLayout";
import AdminProtectedRoute from "@/components/admin/AdminProtectedRoute";

// Customer Pages
import Home from "@/pages/customer/Home";
import Products from "@/pages/customer/Products";
import ProductDetail from "@/pages/customer/ProductDetail";
import Cart from "@/pages/customer/Cart";
import Login from "@/pages/customer/Login";
import Register from "@/pages/customer/Register";
import Account from "@/pages/customer/Account";
import Orders from "@/pages/customer/Orders";
import OrderDetails from "@/pages/customer/OrderDetails";

// Admin Pages
import Dashboard from "@/pages/admin/Dashboard";
import AdminProducts from "@/pages/admin/Products";
import AdminOrders from "@/pages/admin/Orders";
import Customers from "@/pages/admin/Customers";
import Analytics from "@/pages/admin/Analytics";
import Banners from "@/pages/admin/Banners";
import Categories from "@/pages/admin/Categories";
import ShippingSettings from "@/pages/admin/ShippingSettings";
import InvoiceSettings from "@/pages/admin/InvoiceSettings";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  useRealtimeSubscriptions();

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Customer Routes */}
            <Route element={<CustomerLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/products" element={<Products />} />
              <Route path="/products/:id" element={<ProductDetail />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/account" element={<Account />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/orders/:orderId" element={<OrderDetails />} />
            </Route>

            {/* Admin Routes */}
            <Route
              path="/admin"
              element={
                <AdminProtectedRoute>
                  <AdminLayout />
                </AdminProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="products" element={<AdminProducts />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="customers" element={<Customers />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="banners" element={<Banners />} />
              <Route path="categories" element={<Categories />} />
              <Route path="shipping" element={<ShippingSettings />} />
              <Route path="invoice-settings" element={<InvoiceSettings />} />
            </Route>

            {/* 404 Page */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
