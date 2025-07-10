
import { Outlet } from "react-router-dom";
import { useEffect } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";
import { initializeTheme, setupThemeListener } from "@/utils/themeUtils";

const AdminLayout = () => {
  useEffect(() => {
    // Initialize theme on mount
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
    <div className="min-h-screen flex bg-gray-50">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader />
        <main className="flex-1 p-8 bg-gradient-to-br from-white via-gray-50/50 to-gray-100/30">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
