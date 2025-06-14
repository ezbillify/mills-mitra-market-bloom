
import { Outlet } from "react-router-dom";
import CustomerHeader from "@/components/customer/CustomerHeader";
import CustomerFooter from "@/components/customer/CustomerFooter";

const CustomerLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <CustomerHeader />
      <main className="flex-1 bg-organic-gradient">
        <Outlet />
      </main>
      <CustomerFooter />
    </div>
  );
};

export default CustomerLayout;
