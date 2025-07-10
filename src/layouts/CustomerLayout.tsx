
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
    
    // Additional initialization for mobile devices
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        // Re-apply theme on orientation change for mobile
        const savedTheme = localStorage.getItem('customer-theme');
        if (savedTheme) {
          try {
            const colors = JSON.parse(savedTheme);
            setTimeout(() => initializeTheme(), 100);
          } catch (error) {
            initializeTheme();
          }
        }
      }
    };
    
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    
    // Clean up listeners on unmount
    return () => {
      window.removeEventListener('storage', () => {});
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
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
