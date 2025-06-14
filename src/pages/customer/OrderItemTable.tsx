
import { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface Product {
  id: string;
  name: string;
  image?: string | null;
  description?: string | null;
}

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  products: Product;
}

interface Props {
  orderId: string;
}

const OrderItemTable = ({ orderId }: Props) => {
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("order_items")
        .select("id, quantity, price, products(id, name, image, description)")
        .eq("order_id", orderId);

      setItems(data || []);
      setLoading(false);
    };
    fetchItems();
  }, [orderId]);

  if (loading) {
    return <div className="text-sm text-gray-500 p-3">Loading items...</div>;
  }

  if (items.length === 0) {
    return <div className="text-sm text-gray-500 p-3">No items for this order.</div>;
  }

  return (
    <div>
      <h4 className="font-medium mb-3">Items</h4>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                <div
                  className="flex items-center gap-3 cursor-pointer group"
                  onClick={() => navigate(`/products/${item.products.id}`)}
                >
                  {item.products.image && (
                    <img
                      src={item.products.image}
                      alt={item.products.name}
                      className="w-12 h-12 rounded object-cover ring-1 ring-muted group-hover:ring-primary transition"
                    />
                  )}
                  <span className="font-medium underline group-hover:text-primary">{item.products.name}</span>
                </div>
              </TableCell>
              <TableCell>{item.quantity}</TableCell>
              <TableCell>₹{Number(item.price).toFixed(2)}</TableCell>
              <TableCell>₹{(Number(item.price) * item.quantity).toFixed(2)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default OrderItemTable;
