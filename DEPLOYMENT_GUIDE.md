# Complete PhonePe Payment Gateway Deployment Guide

This guide provides step-by-step instructions to deploy the PhonePe payment gateway integration for Mills Mitra Market.

## 📋 Table of Contents
1. [Database Setup](#1-database-setup)
2. [Supabase Environment Variables](#2-supabase-environment-variables)
3. [Deploy Edge Functions](#3-deploy-edge-functions)
4. [PhonePe Configuration](#4-phonepe-configuration)
5. [Testing](#5-testing)
6. [Go Live](#6-go-live)

---

## 1. Database Setup

### Step 1.1: Add Payment Fields to Orders Table

Run the following SQL in your **Supabase SQL Editor** (Dashboard → SQL Editor → New Query):

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

**✅ Verification:** Run this query to verify the columns were added:
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'orders'
AND column_name IN ('payment_id', 'phonepe_transaction_id', 'payment_status', 'payment_verified_at');
```

You should see all 4 columns listed.

---

## 2. Supabase Environment Variables

### Step 2.1: Get Your PhonePe Credentials

You need these credentials from PhonePe:
- **Merchant ID** - Your unique merchant identifier
- **Salt Key** - Secret key for generating checksums
- **Salt Index** - Usually "1" (check with PhonePe)

### Step 2.2: Add Environment Variables

1. Go to your **Supabase Dashboard**
2. Navigate to: **Project Settings** → **Edge Functions** → **Secrets**
3. Click **"Add new secret"** and add each of the following:

| Secret Name | Value | Description |
|------------|-------|-------------|
| `PHONEPE_MERCHANT_ID` | `M123456789` | Your PhonePe Merchant ID |
| `PHONEPE_SALT_KEY` | `your-salt-key-here` | Your PhonePe Salt Key |
| `PHONEPE_SALT_INDEX` | `1` | Salt Index (usually 1) |
| `PHONEPE_ENVIRONMENT` | `sandbox` | Use `sandbox` for testing, `production` for live |
| `FRONTEND_URL` | `http://localhost:5173` | Your frontend URL (update for production) |

**⚠️ Important Notes:**
- For testing, set `PHONEPE_ENVIRONMENT=sandbox`
- For production, set `PHONEPE_ENVIRONMENT=production`
- Update `FRONTEND_URL` to your actual domain in production (e.g., `https://millsmitra.com`)
- Keep your Salt Key secret - never commit it to git

---

## 3. Deploy Edge Functions

### Step 3.1: Install Supabase CLI

If you haven't installed the Supabase CLI yet:

```bash
# macOS
brew install supabase/tap/supabase

# Windows (with scoop)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# Linux
brew install supabase/tap/supabase

# Or npm (all platforms)
npm install -g supabase
```

### Step 3.2: Login to Supabase

```bash
supabase login
```

This will open a browser window. Login with your Supabase account.

### Step 3.3: Link Your Project

```bash
# Navigate to your project directory
cd /path/to/mills-mitra-market-bloom

# Link to your Supabase project
supabase link --project-ref your-project-ref
```

**Where to find project-ref:**
- Go to Supabase Dashboard → Project Settings → General
- Copy the "Reference ID"

### Step 3.4: Deploy PhonePe Functions

```bash
# Deploy phonepe-payment function
supabase functions deploy phonepe-payment

# Deploy phonepe-callback function
supabase functions deploy phonepe-callback

# Deploy phonepe-verify function (optional, for manual verification)
supabase functions deploy phonepe-verify
```

**✅ Verification:** After deployment, you should see:
```
Deployed Function phonepe-payment in 2.3s
Function URL: https://your-project-ref.supabase.co/functions/v1/phonepe-payment
```

**📝 Note down the URLs:** You'll need the callback URL for PhonePe configuration.

---

## 4. PhonePe Configuration

### Step 4.1: Login to PhonePe Merchant Dashboard

Go to [PhonePe Merchant Portal](https://www.phonepe.com/business/) and login.

### Step 4.2: Add Callback URL

1. Navigate to **API Configuration** or **Integration Settings**
2. Find **Callback URL** or **Redirect URL** section
3. Add your callback URL:

```
https://your-project-ref.supabase.co/functions/v1/phonepe-callback
```

**⚠️ Replace** `your-project-ref` with your actual Supabase project reference ID.

### Step 4.3: Enable Payment Methods

In your PhonePe dashboard, ensure these payment methods are enabled:
- ✅ UPI
- ✅ Credit Cards
- ✅ Debit Cards
- ✅ Net Banking
- ✅ Wallets (PhonePe, Google Pay, etc.)

### Step 4.4: Get Production Credentials

For going live:
1. Complete PhonePe merchant verification
2. Submit required documents (PAN, GST, Bank details)
3. Once approved, you'll receive production credentials
4. Update Supabase environment variables with production credentials

---

## 5. Testing

### Step 5.1: Test in Sandbox Mode

1. **Ensure sandbox mode is enabled:**
   - Check Supabase Edge Functions Secrets: `PHONEPE_ENVIRONMENT=sandbox`

2. **Start your frontend:**
   ```bash
   npm run dev
   ```

3. **Create a test order:**
   - Add products to cart
   - Go to checkout
   - Fill in address with a valid 10-digit phone number
   - Select **"Online Payment via PhonePe"**
   - Click **"Pay Now"**

4. **Complete payment on PhonePe:**
   - You'll be redirected to PhonePe's test environment
   - Use PhonePe sandbox test cards/UPI
   - Complete the payment

5. **Verify the flow:**
   - After payment, you should be redirected to `/payment-success`
   - Check order status in Orders page - should be "ACCEPTED"
   - Check payment status - should show "PAID"

### Step 5.2: Test Different Scenarios

**Test Case 1: Successful Payment**
- Complete payment normally
- Verify: Order status = "accepted", Payment status = "completed"

**Test Case 2: Failed Payment**
- Cancel payment on PhonePe page
- Verify: Redirected to `/payment-failed`, Order status = "cancelled"

**Test Case 3: Phone Number Validation**
- Try checkout without phone number
- Verify: Error message shown, payment blocked

### Step 5.3: Check Logs

Monitor edge function logs for issues:

```bash
# Watch real-time logs
supabase functions logs phonepe-payment --follow
supabase functions logs phonepe-callback --follow
```

---

## 6. Go Live

### Step 6.1: Update Environment Variables for Production

In Supabase Dashboard → Edge Functions → Secrets:

1. Update `PHONEPE_ENVIRONMENT` to `production`
2. Update `PHONEPE_MERCHANT_ID` with production merchant ID
3. Update `PHONEPE_SALT_KEY` with production salt key
4. Update `FRONTEND_URL` to your production domain
   ```
   https://www.yourdomain.com
   ```

### Step 6.2: Update Callback URL in PhonePe

Update the callback URL in PhonePe dashboard to your production URL:
```
https://your-production-project-ref.supabase.co/functions/v1/phonepe-callback
```

### Step 6.3: Pre-Launch Checklist

Before going live, verify:

- [ ] Database migration completed successfully
- [ ] All edge functions deployed to production project
- [ ] Production environment variables set correctly
- [ ] PhonePe production credentials obtained and configured
- [ ] Callback URL updated in PhonePe dashboard
- [ ] Test payment in production works (small amount)
- [ ] Email notifications configured (if applicable)
- [ ] Order confirmation emails sent after successful payment
- [ ] Refund process documented and tested
- [ ] Customer support team briefed on payment flow

### Step 6.4: Deploy Frontend

Build and deploy your frontend application:

```bash
# Build for production
npm run build

# Deploy to your hosting platform (Vercel, Netlify, etc.)
# Example for Vercel:
vercel deploy --prod
```

---

## 🔍 Monitoring & Troubleshooting

### Check Edge Function Logs

```bash
# View recent logs
supabase functions logs phonepe-payment
supabase functions logs phonepe-callback

# Stream live logs
supabase functions logs phonepe-payment --follow
```

### Common Issues & Solutions

**Issue: "PhonePe credentials not configured"**
- **Solution:** Check that PHONEPE_MERCHANT_ID and PHONEPE_SALT_KEY are set in Supabase Edge Functions Secrets

**Issue: "Invalid checksum error"**
- **Solution:** Verify PHONEPE_SALT_KEY and PHONEPE_SALT_INDEX are correct. Ensure no extra spaces.

**Issue: "Order not found" in callback**
- **Solution:** Check that `phonepe_transaction_id` field exists in orders table. Run the database migration again.

**Issue: Payment succeeds but order not updated**
- **Solution:** Check Edge Function logs for callback errors. Verify callback URL is accessible.

**Issue: "Phone number must be exactly 10 digits"**
- **Solution:** Ensure customer address has a valid Indian phone number (10 digits, no country code)

**Issue: User not redirected after payment**
- **Solution:** Check that FRONTEND_URL is correctly set in Edge Functions Secrets

### Database Queries for Debugging

**Check payment status:**
```sql
SELECT id, status, payment_type, payment_status, phonepe_transaction_id, payment_verified_at
FROM orders
WHERE payment_type = 'phonepe'
ORDER BY created_at DESC
LIMIT 10;
```

**Find pending payments:**
```sql
SELECT id, total, payment_status, phonepe_transaction_id, created_at
FROM orders
WHERE payment_type = 'phonepe'
AND payment_status = 'pending'
AND created_at > NOW() - INTERVAL '24 hours';
```

---

## 📁 Files Modified in This Integration

### Frontend Files
- ✅ `src/hooks/usePhonePe.tsx` - Payment initiation hook
- ✅ `src/components/customer/CheckoutDialog.tsx` - Checkout with PhonePe
- ✅ `src/pages/customer/PaymentSuccess.tsx` - Success page
- ✅ `src/pages/customer/PaymentFailed.tsx` - Failure page
- ✅ `src/pages/customer/PaymentPending.tsx` - Pending page
- ✅ `src/pages/customer/PaymentError.tsx` - Error page
- ✅ `src/App.tsx` - Route configuration
- ✅ `src/types/order.ts` - Order type definitions
- ✅ `src/components/admin/OrdersTableRow.tsx` - Admin order display
- ✅ `src/utils/invoiceGenerator.ts` - Invoice generation

### Backend Files (Supabase Edge Functions)
- ✅ `supabase/functions/phonepe-payment/index.ts` - Create payment
- ✅ `supabase/functions/phonepe-callback/index.ts` - Handle callback
- ✅ `supabase/functions/phonepe-verify/index.ts` - Verify payment (optional)

### Removed Files (Old Cashfree Integration)
- ❌ `src/hooks/useCashfree.tsx` - DELETED
- ❌ `supabase/functions/cashfree-payment/` - DELETED
- ❌ `supabase/functions/cashfree-verify/` - DELETED

---

## 🔐 Security Best Practices

1. **Never commit credentials**
   - Keep PhonePe credentials in Supabase Edge Functions Secrets only
   - Add `.env` to `.gitignore`

2. **Always use HTTPS in production**
   - HTTP will not work with PhonePe
   - Ensure SSL certificate is valid

3. **Validate callbacks server-side**
   - The callback function verifies payment with PhonePe API
   - Never trust client-side payment status alone

4. **Enable Row Level Security (RLS)**
   - Verify RLS is enabled on orders table
   - Users can only access their own orders

5. **Monitor transactions regularly**
   - Check PhonePe dashboard for suspicious activity
   - Set up alerts for failed payments

6. **Keep logs for audit trail**
   - Edge function logs are retained for 7 days
   - Export important logs for longer retention

---

## 📞 Support & Resources

### PhonePe Resources
- [PhonePe Developer Portal](https://developer.phonepe.com/)
- [API Documentation](https://developer.phonepe.com/docs)
- [Integration Guide](https://developer.phonepe.com/docs/integration)
- PhonePe Support: support@phonepe.com

### Supabase Resources
- [Supabase Documentation](https://supabase.com/docs)
- [Edge Functions Guide](https://supabase.com/docs/guides/functions)
- [Supabase Discord](https://discord.supabase.com/)

### Application Issues
- Check Edge Function logs in Supabase Dashboard
- Review browser console for frontend errors
- Test with sandbox environment first
- Contact your development team

---

## ✅ Quick Reference: Environment Variables

Copy this table for quick reference:

| Variable | Sandbox Value | Production Value | Location |
|----------|--------------|------------------|----------|
| `PHONEPE_MERCHANT_ID` | Sandbox Merchant ID | Production Merchant ID | Supabase Secrets |
| `PHONEPE_SALT_KEY` | Sandbox Salt Key | Production Salt Key | Supabase Secrets |
| `PHONEPE_SALT_INDEX` | `1` | `1` | Supabase Secrets |
| `PHONEPE_ENVIRONMENT` | `sandbox` | `production` | Supabase Secrets |
| `FRONTEND_URL` | `http://localhost:5173` | `https://yourdomain.com` | Supabase Secrets |

---

## 🚀 Quick Start Commands

```bash
# 1. Install dependencies
npm install

# 2. Link Supabase project
supabase link --project-ref your-project-ref

# 3. Deploy edge functions
supabase functions deploy phonepe-payment
supabase functions deploy phonepe-callback

# 4. Start development server
npm run dev

# 5. Monitor logs (in separate terminal)
supabase functions logs phonepe-callback --follow
```

---

**Need help?** Check troubleshooting section or review Edge Function logs for detailed error messages.

**Ready to go live?** Follow the "Go Live" checklist to ensure everything is configured correctly.
