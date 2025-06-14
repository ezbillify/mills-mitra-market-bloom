
import EmployeesTable from "@/components/admin/EmployeesTable";

const AdminEmployees = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Employee Management</h1>
        <p className="text-gray-600 mt-2">Manage your team members and their information</p>
      </div>
      
      <EmployeesTable />
    </div>
  );
};

export default AdminEmployees;
