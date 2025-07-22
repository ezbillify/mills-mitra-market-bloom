
import React from 'react';
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Eye, Mail, Phone, User } from "lucide-react";
import { Customer } from "@/types/customer";

interface CustomerTableProps {
  customers: Customer[];
  onViewCustomer: (customer: Customer) => void;
}

const CustomerTable = ({ customers, onViewCustomer }: CustomerTableProps) => {
  const getStatusBadge = (status: 'active' | 'inactive') => {
    return (
      <Badge variant={status === 'active' ? 'default' : 'secondary'}>
        <div className="flex items-center gap-1">
          <div className={`w-2 h-2 rounded-full ${status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`} />
          {status}
        </div>
      </Badge>
    );
  };

  const getCustomerInitials = (customer: Customer): string => {
    const name = customer.name;
    const words = name.split(' ');
    if (words.length >= 2) {
      return `${words[0][0]}${words[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  if (customers.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500 mb-4">
          <User className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p className="font-medium">No customers found</p>
          <p className="text-sm">New customers will appear here automatically</p>
        </div>
      </div>
    );
  }

  console.log(`📊 CustomerTable rendering ${customers.length} customers`);

  return (
    <div className="space-y-4">
      {/* Customer Table */}
      <div className="rounded-md border">
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
              const initials = getCustomerInitials(customer);
              
              return (
                <TableRow key={customer.id} className="hover:bg-gray-50 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                        <span className="text-white font-medium text-sm">{initials}</span>
                      </div>
                      <div>
                        <div className="font-medium">{customer.name}</div>
                        <div className="text-sm text-gray-500">ID: {customer.id.substring(0, 8)}...</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-sm flex items-center gap-1">
                        <Mail className="h-3 w-3 text-gray-500" />
                        <span className="truncate max-w-[200px]">{customer.email || 'No email'}</span>
                      </div>
                      {customer.phone && (
                        <div className="text-sm text-gray-600 flex items-center gap-1">
                          <Phone className="h-3 w-3 text-gray-500" />
                          {customer.phone}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <span className="font-medium">{customer.totalOrders}</span>
                      <span className="text-xs text-gray-500">
                        {customer.totalOrders === 1 ? 'order' : 'orders'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">₹{customer.totalSpent.toFixed(2)}</div>
                  </TableCell>
                  <TableCell>{getStatusBadge(customer.status)}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {new Date(customer.joinDate).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => onViewCustomer(customer)}
                        className="hover:bg-blue-50"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="hover:bg-green-50"
                        title="Send Email"
                        onClick={() => window.open(`mailto:${customer.email}`, '_blank')}
                      >
                        <Mail className="h-4 w-4" />
                      </Button>
                      {customer.phone && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="hover:bg-yellow-50"
                          title="Call Customer"
                          onClick={() => window.open(`tel:${customer.phone}`, '_blank')}
                        >
                          <Phone className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default CustomerTable;
