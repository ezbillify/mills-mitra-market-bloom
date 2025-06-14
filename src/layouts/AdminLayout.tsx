
import { Outlet } from "react-router-dom";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";

const AdminLayout = () => {
  return (
    <div className="min-h-screen flex bg-warm-cream">
      <AdminSidebar />
      <div className="flex-1 flex flex-col">
        <AdminHeader />
        <main className="flex-1 p-6 bg-warm-cream">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
