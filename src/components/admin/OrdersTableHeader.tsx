
import { TableHead, TableHeader, TableRow } from "@/components/ui/table";

const OrdersTableHeader = () => {
  return (
    <TableHeader>
      <TableRow className="border-gray-200 bg-gray-50">
        <TableHead className="text-gray-700 font-semibold">Order ID</TableHead>
        <TableHead className="text-gray-700 font-semibold">Customer</TableHead>
        <TableHead className="text-gray-700 font-semibold">Email</TableHead>
        <TableHead className="text-gray-700 font-semibold">Shipping</TableHead>
        <TableHead className="text-gray-700 font-semibold">Total</TableHead>
        <TableHead className="text-gray-700 font-semibold">Status</TableHead>
        <TableHead className="text-gray-700 font-semibold">Date</TableHead>
        <TableHead className="text-gray-700 font-semibold">Actions</TableHead>
      </TableRow>
    </TableHeader>
  );
};

export default OrdersTableHeader;
