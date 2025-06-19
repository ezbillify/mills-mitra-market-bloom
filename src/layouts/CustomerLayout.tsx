
import { Outlet } from "react-router-dom";
import CustomerHeader from "@/components/customer/CustomerHeader";
import CustomerFooter from "@/components/customer/CustomerFooter";
import { useEffect } from "react";
import { initializeTheme } from "@/utils/themeUtils";

const CustomerLayout = () => {
  useEffect(() => {
    // Initialize theme when layout mounts
    initializeTheme();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <CustomerHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <CustomerFooter />
    </div>
  );
};

export default CustomerLayout;
