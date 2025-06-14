
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Eye, Mail, Phone, User } from "lucide-react";

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
  console.log('=== CUSTOMER TABLE RENDER ===');
  console.log('Customers received:', customers.length);
  console.log('Sample customer data:', customers[0]);
  
  const getStatusBadge = (status: string) => {
    return (
      <Badge variant={status === 'active' ? 'default' : 'secondary'}>
        {status}
      </Badge>
    );
  };

  const getCustomerTier = (totalSpent: number) => {
    if (totalSpent >= 1000) {
      return <Badge variant="default">VIP</Badge>;
    } else if (totalSpent >= 500) {
      return <Badge variant="secondary">Premium</Badge>;
    }
    return <Badge variant="outline">Regular</Badge>;
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Customer</TableHead>
          <TableHead>Contact</TableHead>
          <TableHead>Orders</TableHead>
          <TableHead>Total Spent</TableHead>
          <TableHead>Tier</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Join Date</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {customers.map((customer) => {
          console.log('Rendering customer:', {
            id: customer.id,
            name: customer.name,
            email: customer.email
          });
          
          return (
            <TableRow key={customer.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                    <User className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-medium">{customer.name || 'No Name'}</div>
                    <div className="text-sm text-gray-500">{customer.id.substring(0, 8)}...</div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  <div className="text-sm">{customer.email || 'No email'}</div>
                  <div className="text-sm text-gray-500">{customer.phone || 'Not provided'}</div>
                </div>
              </TableCell>
              <TableCell>{customer.totalOrders}</TableCell>
              <TableCell>₹{customer.totalSpent.toFixed(2)}</TableCell>
              <TableCell>{getCustomerTier(customer.totalSpent)}</TableCell>
              <TableCell>{getStatusBadge(customer.status)}</TableCell>
              <TableCell>{new Date(customer.joinDate).toLocaleDateString()}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onViewCustomer(customer)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Mail className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Phone className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};

export default CustomerTable;
