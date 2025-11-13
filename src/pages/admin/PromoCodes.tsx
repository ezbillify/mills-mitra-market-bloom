import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { IndianRupee, Calendar } from "lucide-react";

interface PromoCode {
  id: string;
  code: string;
  description: string;
  discount_type: string;
  discount_value: number;
  minimum_order_value: number;
  max_uses: number | null;
  max_uses_per_user: number | null;
  used_count: number;
  valid_from: string | null;
  valid_until: string | null;
  is_active: boolean;
  created_at: string;
}

const PromoCodes = () => {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const [newPromoCode, setNewPromoCode] = useState({
    code: '',
    description: '',
    discount_type: 'percentage',
    discount_value: 0,
    minimum_order_value: 0,
    max_uses: '',
    max_uses_per_user: '',
    valid_from: '',
    valid_until: ''
  });

  useEffect(() => {
    fetchPromoCodes();
  }, []);

  const fetchPromoCodes = async () => {
    try {
      const { data, error } = await supabase
        .from('promo_codes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPromoCodes(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch promo codes",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createPromoCode = async () => {
    try {
      const { error }: any = await supabase
        .from('promo_codes')
        .insert({
          code: newPromoCode.code.toUpperCase(),
          description: newPromoCode.description,
          discount_type: newPromoCode.discount_type,
          discount_value: newPromoCode.discount_value,
          minimum_order_value: newPromoCode.minimum_order_value,
          max_uses: newPromoCode.max_uses ? parseInt(newPromoCode.max_uses) : null,
          max_uses_per_user: newPromoCode.max_uses_per_user ? parseInt(newPromoCode.max_uses_per_user) : null,
          valid_from: newPromoCode.valid_from || null,
          valid_until: newPromoCode.valid_until || null
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Promo code created successfully"
      });

      setNewPromoCode({
        code: '',
        description: '',
        discount_type: 'percentage',
        discount_value: 0,
        minimum_order_value: 0,
        max_uses: '',
        max_uses_per_user: '',
        valid_from: '',
        valid_until: ''
      });

      fetchPromoCodes();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create promo code",
        variant: "destructive"
      });
    }
  };

  const togglePromoCodeStatus = async (id: string, isActive: boolean) => {
    try {
      const { error }: any = await supabase
        .from('promo_codes')
        .update({ is_active: !isActive })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Promo code ${!isActive ? 'activated' : 'deactivated'} successfully`
      });

      fetchPromoCodes();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update promo code",
        variant: "destructive"
      });
    }
  };

  const deletePromoCode = async (id: string, code: string) => {
    try {
      const { error }: any = await supabase
        .from('promo_codes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Promo code ${code} deleted successfully`
      });

      fetchPromoCodes();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete promo code",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Promo Codes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <h3 className="text-lg font-medium mb-4">Create New Promo Code</h3>
              <div className="space-y-4">
                <div>
                  <Label>Code</Label>
                  <Input
                    value={newPromoCode.code}
                    onChange={(e) => setNewPromoCode({...newPromoCode, code: e.target.value})}
                    placeholder="e.g., SAVE20"
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Input
                    value={newPromoCode.description}
                    onChange={(e) => setNewPromoCode({...newPromoCode, description: e.target.value})}
                    placeholder="e.g., 20% off on orders above ₹500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Discount Type</Label>
                    <Select
                      value={newPromoCode.discount_type}
                      onValueChange={(value) => setNewPromoCode({...newPromoCode, discount_type: value})}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select discount type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage</SelectItem>
                        <SelectItem value="fixed">Fixed Amount</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Discount Value</Label>
                    <Input
                      type="number"
                      value={newPromoCode.discount_value}
                      onChange={(e) => setNewPromoCode({...newPromoCode, discount_value: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                </div>
                <div>
                  <Label>Minimum Order Value</Label>
                  <div className="relative">
                    <IndianRupee className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      className="pl-8"
                      type="number"
                      value={newPromoCode.minimum_order_value}
                      onChange={(e) => setNewPromoCode({...newPromoCode, minimum_order_value: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                </div>
                <div>
                  <Label>Max Uses (optional)</Label>
                  <Input
                    value={newPromoCode.max_uses}
                    onChange={(e) => setNewPromoCode({...newPromoCode, max_uses: e.target.value})}
                    placeholder="Leave blank for unlimited"
                  />
                </div>
                <div>
                  <Label>Max Uses Per User (optional)</Label>
                  <Input
                    value={newPromoCode.max_uses_per_user}
                    onChange={(e) => setNewPromoCode({...newPromoCode, max_uses_per_user: e.target.value})}
                    placeholder="Leave blank for unlimited"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Valid From (optional)</Label>
                    <div className="relative">
                      <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                      <Input
                        className="pl-8"
                        type="datetime-local"
                        value={newPromoCode.valid_from}
                        onChange={(e) => setNewPromoCode({...newPromoCode, valid_from: e.target.value})}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Valid Until (optional)</Label>
                    <div className="relative">
                      <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                      <Input
                        className="pl-8"
                        type="datetime-local"
                        value={newPromoCode.valid_until}
                        onChange={(e) => setNewPromoCode({...newPromoCode, valid_until: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
                <Button onClick={createPromoCode}>Create Promo Code</Button>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-4">Existing Promo Codes</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Min Order</TableHead>
                  <TableHead>Uses</TableHead>
                  <TableHead>Per User Limit</TableHead>
                  <TableHead>Validity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {promoCodes.map((promo) => (
                  <TableRow key={promo.id}>
                    <TableCell className="font-medium">{promo.code}</TableCell>
                    <TableCell>{promo.description}</TableCell>
                    <TableCell>
                      {promo.discount_type === 'percentage' 
                        ? `${promo.discount_value}%` 
                        : `₹${promo.discount_value}`}
                    </TableCell>
                    <TableCell>₹{promo.minimum_order_value}</TableCell>
                    <TableCell>
                      {promo.used_count}
                      {promo.max_uses && ` / ${promo.max_uses}`}
                    </TableCell>
                    <TableCell>
                      {promo.max_uses_per_user ? promo.max_uses_per_user : 'Unlimited'}
                    </TableCell>
                    <TableCell>
                      <div className="text-xs">
                        {promo.valid_from 
                          ? `From: ${new Date(promo.valid_from).toLocaleDateString()}` 
                          : ''}
                        {promo.valid_until 
                          ? `To: ${new Date(promo.valid_until).toLocaleDateString()}` 
                          : 'No expiry'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        promo.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {promo.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => togglePromoCodeStatus(promo.id, promo.is_active)}
                      >
                        {promo.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deletePromoCode(promo.id, promo.code)}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PromoCodes;