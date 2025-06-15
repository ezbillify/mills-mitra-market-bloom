
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { StockService } from "@/services/stockService";
import { Package, Plus } from "lucide-react";

interface StockManagementProps {
  productId: string;
  currentStock: number;
  productName: string;
  onStockUpdated: () => void;
}

const StockManagement = ({ productId, currentStock, productName, onStockUpdated }: StockManagementProps) => {
  const [addQuantity, setAddQuantity] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  const handleAddStock = async () => {
    const quantity = parseInt(addQuantity);
    
    if (!quantity || quantity <= 0) {
      toast({
        title: "Invalid Quantity",
        description: "Please enter a valid positive number",
        variant: "destructive",
      });
      return;
    }

    setIsUpdating(true);
    try {
      await StockService.addStock(productId, quantity);
      toast({
        title: "Stock Updated",
        description: `Added ${quantity} units to ${productName}`,
      });
      setAddQuantity("");
      onStockUpdated();
    } catch (error) {
      console.error("Error adding stock:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add stock",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Package className="h-4 w-4" />
          Stock Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-sm text-gray-600">Current Stock</Label>
          <div className="text-lg font-semibold">{currentStock} units</div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="add-stock">Add Stock</Label>
          <div className="flex gap-2">
            <Input
              id="add-stock"
              type="number"
              value={addQuantity}
              onChange={(e) => setAddQuantity(e.target.value)}
              placeholder="Enter quantity"
              min="1"
            />
            <Button
              onClick={handleAddStock}
              disabled={isUpdating}
              size="sm"
            >
              <Plus className="h-4 w-4 mr-1" />
              {isUpdating ? "Adding..." : "Add"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StockManagement;
