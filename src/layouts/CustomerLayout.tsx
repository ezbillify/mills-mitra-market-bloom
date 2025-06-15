
import { Outlet } from "react-router-dom";
import CustomerHeader from "@/components/customer/CustomerHeader";
import CustomerFooter from "@/components/customer/CustomerFooter";

const CustomerLayout = () => {
  // Ensure only ONE footer – do not render additional footers in any children or here!
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <CustomerHeader />
      <main className="flex-1 bg-organic-gradient">
        <Outlet />
      </main>
      {/* Only ONE footer here */}
      <CustomerFooter />
    </div>
  );
};

export default CustomerLayout;
