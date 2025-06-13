
-- First, let's add the new enum values for order_status
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'accepted';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'out_for_delivery';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'completed';
