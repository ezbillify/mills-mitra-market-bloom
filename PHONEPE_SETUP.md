# PhonePe Payment Gateway Integration Guide

This guide will help you set up PhonePe payment gateway integration in the Mills Mitra Market application.

## Prerequisites

Before you begin, ensure you have:
- A PhonePe Merchant account
- PhonePe Merchant ID
- PhonePe Salt Key
- PhonePe Salt Index
- Access to your Supabase project

## Step 1: Database Setup

Run the following SQL migration in your Supabase SQL Editor to add required payment fields to the orders table:

```sql
-- Add PhonePe payment fields to orders table

-- Add payment_id column to store the payment transaction ID
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_id TEXT;

-- Add phonepe_transaction_id column to store PhonePe's merchant transaction ID
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS phonepe_transaction_id TEXT;

-- Add payment_status column to track payment state (pending, completed, failed)
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';

-- Add payment_verified_at column to track when payment was verified
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_verified_at TIMESTAMP WITH TIME ZONE;

-- Add comment for documentation
COMMENT ON COLUMN public.orders.payment_id IS 'Payment transaction ID from payment gateway';
COMMENT ON COLUMN public.orders.phonepe_transaction_id IS 'PhonePe merchant transaction ID for payment tracking';
COMMENT ON COLUMN public.orders.payment_status IS 'Payment status: pending, completed, failed';
COMMENT ON COLUMN public.orders.payment_verified_at IS 'Timestamp when payment was verified';

-- Create index for faster lookups by phonepe_transaction_id
CREATE INDEX IF NOT EXISTS idx_orders_phonepe_transaction_id ON public.orders(phonepe_transaction_id);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);
```

## Step 2: Configure Supabase Edge Functions

### Set Environment Variables in Supabase

Go to your Supabase project dashboard and navigate to:
**Project Settings > Edge Functions > Secrets**

Add the following environment variables:

```bash
# PhonePe Credentials
PHONEPE_MERCHANT_ID=your_merchant_id_here
PHONEPE_SALT_KEY=your_salt_key_here
PHONEPE_SALT_INDEX=1

# Environment (sandbox or production)
PHONEPE_ENVIRONMENT=sandbox  # Use 'production' for live environment

# Frontend URL for redirects after payment
FRONTEND_URL=http://localhost:5173  # Update with your production URL
```

### Deploy Edge Functions

Deploy the PhonePe edge functions to Supabase:

```bash
# Navigate to your project root
cd /path/to/mills-mitra-market-bloom

# Deploy phonepe-payment function
supabase functions deploy phonepe-payment

# Deploy phonepe-callback function
supabase functions deploy phonepe-callback

# Deploy phonepe-verify function (optional, for manual verification)
supabase functions deploy phonepe-verify
```

## Step 3: PhonePe Merchant Dashboard Configuration

### Configure Callback URL

1. Log in to your PhonePe Merchant Dashboard
2. Navigate to API Configuration
3. Add the following callback URL:
   ```
   https://your-project-ref.supabase.co/functions/v1/phonepe-callback
   ```
   Replace `your-project-ref` with your actual Supabase project reference ID

### Enable Payment Methods

Ensure the following payment methods are enabled in your PhonePe merchant account:
- UPI
- Cards (Credit/Debit)
- Net Banking
- Wallets

## Step 4: Testing the Integration

### Test in Sandbox Mode

1. Set `PHONEPE_ENVIRONMENT=sandbox` in your Supabase Edge Function secrets
2. Use PhonePe's test credentials and test cards
3. Create a test order and proceed to checkout
4. Select "Online Payment via PhonePe" as payment method
5. Complete the payment on PhonePe's test environment

### Verify Payment Flow

The payment flow works as follows:

1. **Customer initiates payment** → Frontend calls `phonepe-payment` edge function
2. **Payment order created** → PhonePe returns redirect URL
3. **Customer redirected** → User completes payment on PhonePe
4. **Callback triggered** → PhonePe calls `phonepe-callback` edge function
5. **Status verified** → Order status updated in database
6. **Customer redirected** → User sees success/failure page

### Check Payment Status Pages

The following pages handle different payment outcomes:
- `/payment-success` - Payment completed successfully
- `/payment-failed` - Payment failed
- `/payment-pending` - Payment is being processed
- `/payment-error` - Error occurred during payment

## Step 5: Go Live

### Update Environment Variables

When moving to production:

1. Update `PHONEPE_ENVIRONMENT` to `production` in Supabase Edge Function secrets
2. Update `FRONTEND_URL` to your production domain
3. Use production PhonePe credentials (Merchant ID, Salt Key)

### Update Callback URL

Update the callback URL in PhonePe Merchant Dashboard to use your production domain:
```
https://your-production-project-ref.supabase.co/functions/v1/phonepe-callback
```

## Troubleshooting

### Common Issues

**Issue**: Payment succeeds but order not updated
- **Solution**: Check Supabase Edge Function logs for callback errors
- Verify that `phonepe_transaction_id` field exists in orders table

**Issue**: Invalid checksum error
- **Solution**: Verify PHONEPE_SALT_KEY and PHONEPE_SALT_INDEX are correct
- Ensure there are no extra spaces in environment variables

**Issue**: Redirect fails after payment
- **Solution**: Check that FRONTEND_URL is correctly set
- Verify callback URL is properly configured in PhonePe dashboard

**Issue**: Phone number validation error
- **Solution**: Ensure customer address has a valid 10-digit phone number
- Phone number is required for PhonePe payments

### Enable Debugging

To enable detailed logging, check the Supabase Edge Function logs:

```bash
# View real-time logs
supabase functions logs phonepe-payment
supabase functions logs phonepe-callback
```

## Security Best Practices

1. **Never commit credentials** - Keep PhonePe credentials in Supabase secrets only
2. **Use HTTPS** - Always use HTTPS for production
3. **Validate callbacks** - The callback function verifies payment status with PhonePe API
4. **Enable RLS** - Ensure Row Level Security is enabled on orders table
5. **Monitor transactions** - Regularly check PhonePe dashboard for suspicious activity

## Support

For PhonePe API documentation and support:
- [PhonePe Developer Portal](https://developer.phonepe.com/)
- [PhonePe API Documentation](https://developer.phonepe.com/docs)

For application issues:
- Check Supabase Edge Function logs
- Review browser console for frontend errors
- Contact your development team

## Files Modified

This integration includes the following files:

### Frontend
- `src/hooks/usePhonePe.tsx` - Payment initiation hook
- `src/components/customer/CheckoutDialog.tsx` - Checkout with PhonePe option
- `src/pages/customer/PaymentSuccess.tsx` - Success page
- `src/pages/customer/PaymentFailed.tsx` - Failure page
- `src/pages/customer/PaymentPending.tsx` - Pending page
- `src/pages/customer/PaymentError.tsx` - Error page
- `src/App.tsx` - Route configuration

### Backend (Supabase Edge Functions)
- `supabase/functions/phonepe-payment/index.ts` - Create payment order
- `supabase/functions/phonepe-callback/index.ts` - Handle payment callback
- `supabase/functions/phonepe-verify/index.ts` - Verify payment status

### Database
- Add payment fields migration (see Step 1)

## Testing Checklist

Before going live, ensure:

- [ ] Database migration completed successfully
- [ ] All edge functions deployed
- [ ] Environment variables set correctly
- [ ] Callback URL configured in PhonePe dashboard
- [ ] Test payment in sandbox mode works
- [ ] Success/failure pages display correctly
- [ ] Order status updates after payment
- [ ] Email notifications sent (if configured)
- [ ] Phone number validation works
- [ ] Production credentials obtained from PhonePe
- [ ] Production callback URL updated
