# ⚡ Quick Start Guide - RazorPay Integration

## 🎯 What You Need to Do

There are 3 main steps to get RazorPay working:

### 1️⃣ Update Database Fields
### 2️⃣ Configure Keys in Supabase
### 3️⃣ Deploy Functions to Supabase

---

## 1️⃣ UPDATE DATABASE FIELDS (Run Once)

### Where: Supabase Dashboard → SQL Editor

**Copy and paste this entire SQL query and click "Run":**

```sql
-- Remove PhonePe fields
ALTER TABLE public.orders DROP COLUMN IF EXISTS phonepe_transaction_id;

-- Add RazorPay fields
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT;

CREATE INDEX IF NOT EXISTS idx_orders_razorpay_order_id ON public.orders(razorpay_order_id);
```

✅ That's it for database! Click Run once.

---

## 2️⃣ ADD RAZORPAY KEYS

### Where: Supabase Dashboard → Project Settings → Edge Functions → Secrets

Click **"Add new secret"** button and add these **3 secrets** one by one:

| Secret Name (copy exactly) | Your Value | Example |
|---------------------------|------------|---------|
| `RAZORPAY_KEY_ID` | Your RazorPay Key ID | `rzp_test_XXXXXXXXXXXXXX` |
| `RAZORPAY_KEY_SECRET` | Your RazorPay Key Secret | `your-key-secret-here` |
| `FRONTEND_URL` | Your website URL | `http://localhost:5173` |

**📝 Notes:**
- For testing: Use test keys (starts with `rzp_test_`)
- For live: Use live keys (starts with `rzp_live_`)
- Get Key ID & Key Secret from RazorPay Dashboard

---

## 3️⃣ DEPLOY FUNCTIONS TO SUPABASE

### Step A: Install Supabase CLI (One Time)

**macOS/Linux:**
```bash
brew install supabase/tap/supabase
```

**Windows (using npm):**
```bash
npm install -g supabase
```

### Step B: Login to Supabase

```bash
supabase login
```

A browser will open → Login with your Supabase account

### Step C: Link Your Project

```bash
# Go to your project folder
cd /Users/devacc/Desktop/mills-mitra-market-bloom

# Link to Supabase (get project-ref from Supabase Dashboard → Settings)
supabase link --project-ref YOUR_PROJECT_REF
```

**Where to find YOUR_PROJECT_REF:**
- Supabase Dashboard → Project Settings → General → Reference ID
- Example: `abcdefghijklmnop`

### Step D: Deploy the Functions

```bash
# Deploy payment function
supabase functions deploy razorpay-payment

# Deploy verify function
supabase functions deploy razorpay-verify
```

✅ You'll see: `Deployed Function razorpay-payment in 2.3s`

---

## 4️⃣ CONFIGURE RAZORPAY DASHBOARD

### Where: RazorPay Merchant Portal

1. Login to [RazorPay Merchant Dashboard](https://dashboard.razorpay.com/)
2. Go to **Settings** → **API Keys**
3. Copy your **Test Key ID** and **Test Key Secret**

---

## 5️⃣ TEST IT

### Start Your Application

```bash
npm run dev
```

### Try Making a Payment

1. Add items to cart
2. Go to checkout
3. Add address (with 10-digit phone number)
4. Select **"Online Payment via RazorPay"**
5. Click **"Pay Now"**
6. Complete payment with test card:
   - Card Number: `4111 1111 1111 1111`
   - Expiry: `12/24`
   - CVV: `123`
   - Name: `Test User`

### Check It Worked

- ✅ Payment modal opens and closes successfully
- ✅ Redirected to "Payment Successful" page
- ✅ Order status shows "ACCEPTED"
- ✅ Payment status shows "PAID"

---

## 🐛 Troubleshooting

### "RazorPay credentials not configured"
- Check you added all 3 secrets in Supabase
- Names must match exactly (case-sensitive)

### "Order not found"
- Run the database SQL again
- Check fields were added: `SELECT * FROM orders LIMIT 1;`

### "Phone number must be 10 digits"
- Add a valid 10-digit phone number in address
- No country code, just 10 digits

### Check Logs

```bash
# See what's happening
supabase functions logs razorpay-payment --follow
```

---

## 📋 Checklist

Before testing, make sure:

- [ ] Database SQL run successfully
- [ ] All 3 environment variables added to Supabase
- [ ] Functions deployed (razorpay-payment, razorpay-verify)
- [ ] Using test keys for testing
- [ ] Frontend running (`npm run dev`)

---

## 🔄 When Going to Production

Change these in Supabase Secrets:

```bash
RAZORPAY_KEY_ID = rzp_live_XXXXXXXXXXXXXX  (change from test)
RAZORPAY_KEY_SECRET = <production key secret>
FRONTEND_URL = https://yourdomain.com
```

And use live keys from RazorPay dashboard.

---

## 📖 Need More Details?

See [RAZORPAY_DEPLOYMENT_GUIDE.md](RAZORPAY_DEPLOYMENT_GUIDE.md) for complete instructions.

---