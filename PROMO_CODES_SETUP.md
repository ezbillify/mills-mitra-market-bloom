# Promo Codes Feature Setup Guide

This guide explains how to deploy and set up the promo codes feature in your Mills Mitra Market application.

## Database Migration

The promo codes feature requires running the database migration to create the necessary tables and columns:

1. **Run the migration files:**
   ```bash
   supabase migration up
   ```

This will create:
- `promo_codes` table for storing promo code definitions
- `promo_code_id` and `discount_amount` columns in the `orders` table

## Supabase Functions Deployment

Deploy the Supabase edge functions for promo code validation and usage tracking:

1. **Deploy the promo code validation function:**
   ```bash
   supabase functions deploy promo-code-validate
   ```

2. **Deploy the promo code usage update function:**
   ```bash
   supabase functions deploy promo-code-update-usage
   ```

## Environment Variables

No additional environment variables are required for the promo codes feature.

## Usage

### Admin Panel

1. Navigate to the Promo Codes section in the admin panel
2. Create new promo codes with:
   - Unique code (e.g., "SAVE20")
   - Description (e.g., "20% off on orders above ₹500")
   - Discount type (percentage or fixed amount)
   - Discount value (e.g., 20 for 20% or ₹20 off)
   - Minimum order value (e.g., ₹500)
   - Max uses (optional, leave blank for unlimited)
   - Valid until date (optional)
3. Activate/deactivate promo codes as needed

### Customer Checkout

Customers can apply promo codes during checkout:
1. Enter promo code in the designated input field
2. Click "Apply" to validate the code
3. If valid, the discount will be automatically applied to the order total
4. Complete the checkout process as usual

## Promo Code Rules

1. Promo codes are case-insensitive
2. Each promo code can have usage limits
3. Promo codes can have expiration dates
4. Promo codes can require minimum order amounts
5. Percentage discounts are calculated on the subtotal before shipping
6. Fixed amount discounts are deducted from the subtotal

## Troubleshooting

### If promo codes don't appear in admin panel:
- Ensure the database migration has been run
- Check that the `promo_codes` table exists in your database

### If promo code validation fails:
- Verify the `promo-code-validate` function is deployed
- Check the Supabase function logs for errors

### If promo code usage isn't tracked:
- Verify the `promo-code-update-usage` function is deployed
- Check that the order creation process calls the update function