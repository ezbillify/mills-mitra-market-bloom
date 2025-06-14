
import { Outlet } from "react-router-dom";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";

const AdminLayout = () => {
  return (
    <div className="min-h-screen flex bg-warm-cream">
      <AdminSidebar />
      <div className="flex-1 flex flex-col">
        <AdminHeader />
        <main className="flex-1 p-8 bg-gradient-to-br from-warm-cream to-warm-beige/10">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
