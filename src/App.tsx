import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import CustomerLayout from "@/layouts/CustomerLayout";
import AdminLayout from "@/layouts/AdminLayout";
import AdminProtectedRoute from "@/components/admin/AdminProtectedRoute";
import AuthWrapper from "@/components/customer/AuthWrapper";

// Customer Pages
import Home from "@/pages/customer/Home";
import Products from "@/pages/customer/Products";
import ProductDetail from "@/pages/customer/ProductDetail";
import Cart from "@/pages/customer/Cart";
import Login from "@/pages/customer/Login";
import Register from "@/pages/customer/Register";
import ResetPassword from "@/pages/customer/ResetPassword";
import Account from "@/pages/customer/Account";
import AddressBook from "@/pages/customer/AddressBook";
import Orders from "@/pages/customer/Orders";
import OrderDetails from "@/pages/customer/OrderDetails";
import PaymentSuccess from "@/pages/customer/PaymentSuccess";
import PaymentFailed from "@/pages/customer/PaymentFailed";
import PaymentPending from "@/pages/customer/PaymentPending";
import PaymentError from "@/pages/customer/PaymentError";
import AboutUs from "@/pages/customer/AboutUs";
import TermsAndConditions from "@/pages/customer/TermsAndConditions";
import PrivacyPolicy from "@/pages/customer/PrivacyPolicy";
import ContactUs from "@/pages/customer/ContactUs";
import ReturnPolicy from "@/pages/customer/ReturnPolicy";
import ShippingPolicy from "@/pages/customer/ShippingPolicy";
import FAQ from "@/pages/customer/FAQ";

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
import PromoCodes from "@/pages/admin/PromoCodes";

import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthWrapper>
              <Routes>
                {/* Customer Routes */}
                <Route element={<CustomerLayout />}>
                  <Route path="/" element={<Home />} />
                  <Route path="/products" element={<Products />} />
                  <Route path="/products/:id" element={<ProductDetail />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/account" element={<Account />} />
                  <Route path="/address-book" element={<AddressBook />} />
                  <Route path="/orders" element={<Orders />} />
                  <Route path="/orders/:orderId" element={<OrderDetails />} />
                  <Route path="/payment-success" element={<PaymentSuccess />} />
                  <Route path="/payment-failed" element={<PaymentFailed />} />
                  <Route path="/payment-pending" element={<PaymentPending />} />
                  <Route path="/payment-error" element={<PaymentError />} />
                  <Route path="/about-us" element={<AboutUs />} />
                  <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
                  <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                  <Route path="/contact-us" element={<ContactUs />} />
                  <Route path="/return-policy" element={<ReturnPolicy />} />
                  <Route path="/shipping-policy" element={<ShippingPolicy />} />
                  <Route path="/faq" element={<FAQ />} />
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
                  <Route path="promo-codes" element={<PromoCodes />} />
                  <Route path="banners" element={<Banners />} />
                  <Route path="categories" element={<Categories />} />
                  <Route path="shipping" element={<ShippingSettings />} />
                  <Route path="invoice-settings" element={<InvoiceSettings />} />
                </Route>

                {/* 404 Page */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AuthWrapper>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;