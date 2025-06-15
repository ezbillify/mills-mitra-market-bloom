
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export class StockService {
  static async updateProductStock(productId: string, quantityChange: number, operation: 'decrease' | 'increase' = 'decrease'): Promise<boolean> {
    try {
      console.log(`📦 ${operation === 'decrease' ? 'Decreasing' : 'Increasing'} stock for product ${productId} by ${Math.abs(quantityChange)}`);

      // Get current product stock
      const { data: product, error: fetchError } = await supabase
        .from('products')
        .select('stock, name')
        .eq('id', productId)
        .single();

      if (fetchError) {
        console.error('Error fetching product:', fetchError);
        throw new Error(`Failed to fetch product: ${fetchError.message}`);
      }

      if (!product) {
        throw new Error('Product not found');
      }

      const currentStock = product.stock;
      let newStock: number;

      if (operation === 'decrease') {
        newStock = currentStock - Math.abs(quantityChange);
        
        // Prevent negative stock
        if (newStock < 0) {
          console.warn(`⚠️ Insufficient stock for product ${product.name}. Current: ${currentStock}, Required: ${Math.abs(quantityChange)}`);
          throw new Error(`Insufficient stock. Available: ${currentStock}, Required: ${Math.abs(quantityChange)}`);
        }
      } else {
        newStock = currentStock + Math.abs(quantityChange);
      }

      // Update the stock
      const { error: updateError } = await supabase
        .from('products')
        .update({ 
          stock: newStock,
          updated_at: new Date().toISOString()
        })
        .eq('id', productId);

      if (updateError) {
        console.error('Error updating stock:', updateError);
        throw new Error(`Failed to update stock: ${updateError.message}`);
      }

      console.log(`✅ Stock updated for ${product.name}: ${currentStock} → ${newStock}`);
      return true;
    } catch (error) {
      console.error('💥 Stock update failed:', error);
      throw error;
    }
  }

  static async decreaseStockForOrder(orderItems: Array<{ product_id: string; quantity: number }>): Promise<void> {
    console.log(`📉 Decreasing stock for ${orderItems.length} items`);
    
    for (const item of orderItems) {
      try {
        await this.updateProductStock(item.product_id, item.quantity, 'decrease');
      } catch (error) {
        console.error(`Failed to decrease stock for product ${item.product_id}:`, error);
        // Continue with other items but log the error
        throw new Error(`Stock update failed for one or more items: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    console.log('✅ All stock decreases completed successfully');
  }

  static async increaseStockForOrder(orderItems: Array<{ product_id: string; quantity: number }>): Promise<void> {
    console.log(`📈 Increasing stock for ${orderItems.length} items (order cancellation)`);
    
    for (const item of orderItems) {
      try {
        await this.updateProductStock(item.product_id, item.quantity, 'increase');
      } catch (error) {
        console.error(`Failed to increase stock for product ${item.product_id}:`, error);
        // Continue with other items but log the error
      }
    }
    
    console.log('✅ All stock increases completed successfully');
  }

  static async addStock(productId: string, quantity: number): Promise<void> {
    if (quantity <= 0) {
      throw new Error('Quantity must be positive');
    }

    console.log(`📦 Adding ${quantity} units to product ${productId}`);
    await this.updateProductStock(productId, quantity, 'increase');
  }
}
