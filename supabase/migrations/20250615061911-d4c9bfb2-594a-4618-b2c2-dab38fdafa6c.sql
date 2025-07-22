
-- First, let's check if there are any orders using delivery_options table
-- If there are orders with delivery_option_id, we need to keep delivery_options
-- If not, we can safely remove it and use shipping_settings

-- Check if any orders reference delivery_options
SELECT COUNT(*) as orders_with_delivery_options 
FROM orders 
WHERE delivery_option_id IS NOT NULL;

-- Since the code is using delivery_options table for joins, let's standardize on that
-- Copy any data from shipping_settings to delivery_options if needed
INSERT INTO delivery_options (name, description, price, estimated_days_min, estimated_days_max, is_active, display_order)
SELECT name, description, price, delivery_days_min, delivery_days_max, is_active, 0 as display_order
FROM shipping_settings
WHERE NOT EXISTS (
    SELECT 1 FROM delivery_options d 
    WHERE d.name = shipping_settings.name
);

-- Drop the shipping_settings table since we're standardizing on delivery_options
DROP TABLE IF EXISTS shipping_settings;
