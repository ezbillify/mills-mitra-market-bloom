-- Update existing orders from phonepe to razorpay
UPDATE public.orders 
SET payment_type = 'razorpay' 
WHERE payment_type = 'phonepe';

-- Update any orders that might have null payment_type but have razorpay_order_id
UPDATE public.orders 
SET payment_type = 'razorpay' 
WHERE payment_type IS NULL 
AND razorpay_order_id IS NOT NULL;

-- Update any orders that might have phonepe but should be COD
UPDATE public.orders 
SET payment_type = 'cod' 
WHERE payment_type = 'phonepe' 
AND EXISTS (
    SELECT 1 FROM order_items oi 
    WHERE oi.order_id = orders.id
)
AND NOT EXISTS (
    SELECT 1 FROM orders o2 
    WHERE o2.id = orders.id 
    AND o2.razorpay_order_id IS NOT NULL
);

-- Verify the updates
SELECT payment_type, COUNT(*) as count 
FROM public.orders 
GROUP BY payment_type 
ORDER BY count DESC;