
import { Outlet } from "react-router-dom";
import CustomerHeader from "@/components/customer/CustomerHeader";
import CustomerFooter from "@/components/customer/CustomerFooter";
import { useEffect } from "react";
import { initializeTheme, setupThemeListener } from "@/utils/themeUtils";

const CustomerLayout = () => {
  useEffect(() => {
    // Initialize theme when layout mounts
    initializeTheme();
    
    // Set up theme listener for real-time updates
    setupThemeListener();
    
    // Clean up listener on unmount
    return () => {
      window.removeEventListener('storage', () => {});
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background transition-colors duration-300">
      <CustomerHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <CustomerFooter />
    </div>
  );
};

export default CustomerLayout;
