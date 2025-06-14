
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Eye, Mail, Phone, User, Wifi, Clock } from "lucide-react";

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalOrders: number;
  totalSpent: number;
  status: 'active' | 'inactive';
  joinDate: string;
}

interface CustomerTableProps {
  customers: Customer[];
  onViewCustomer: (customer: Customer) => void;
}

const CustomerTable = ({ customers, onViewCustomer }: CustomerTableProps) => {
  console.log('🔥 CustomerTable render - customers:', customers.length, 'at', new Date().toISOString());
  console.log('🔥 Latest customers:', customers.slice(0, 3).map(c => ({
    id: c.id.substring(0, 8),
    name: c.name,
    email: c.email,
    joinDate: c.joinDate
  })));
  
  const getStatusBadge = (status: string) => {
    return (
      <Badge variant={status === 'active' ? 'default' : 'secondary'}>
        {status}
      </Badge>
    );
  };

  const displayCustomerName = (customer: Customer) => {
    // Ensure we always show a meaningful name
    if (!customer.name || customer.name.trim() === '') {
      if (customer.email) {
        const emailPrefix = customer.email.split('@')[0];
        return emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
      }
      return `Customer ${customer.id.substring(0, 8)}`;
    }
    return customer.name;
  };

  if (customers.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500 mb-4">
          <User className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No customers found</p>
          <p className="text-sm">New customers will appear here automatically</p>
          <p className="text-xs mt-2 text-blue-600">Debug: Checking all auth users and profiles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-green-50 p-3 rounded-lg border border-green-200">
        <div className="flex items-center gap-2">
          <Wifi className="w-4 h-4 text-green-600" />
          <span className="text-sm text-green-700 font-medium">Enhanced Real-time Updates Active</span>
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-green-600" />
          <span className="text-sm text-green-600">{customers.length} customers loaded at {new Date().toLocaleTimeString()}</span>
        </div>
      </div>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Customer</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Orders</TableHead>
            <TableHead>Total Spent</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Join Date</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.map((customer) => {
            const displayName = displayCustomerName(customer);
            console.log(`👤 Rendering customer: ${customer.id.substring(0, 8)} - Name: "${customer.name}" -> Display: "${displayName}"`);
            
            return (
              <TableRow key={customer.id} className="hover:bg-gray-50 transition-colors">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                      <User className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <div className="font-medium">{displayName}</div>
                      <div className="text-sm text-gray-500">{customer.id.substring(0, 8)}...</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="text-sm flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {customer.email || 'No email'}
                    </div>
                    <div className="text-sm text-gray-500 flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {customer.phone || 'Not provided'}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <span className="font-medium">{customer.totalOrders}</span>
                    <span className="text-xs text-gray-500">orders</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-medium">₹{customer.totalSpent.toFixed(2)}</div>
                </TableCell>
                <TableCell>{getStatusBadge(customer.status)}</TableCell>
                <TableCell>
                  <div className="text-sm">
                    {new Date(customer.joinDate).toLocaleDateString()}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => onViewCustomer(customer)}
                      className="hover:bg-blue-50"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="hover:bg-green-50">
                      <Mail className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="hover:bg-yellow-50">
                      <Phone className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default CustomerTable;
