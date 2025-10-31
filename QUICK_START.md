# ⚡ Quick Start Guide - PhonePe Integration

## 🎯 What You Need to Do

There are 3 main steps to get PhonePe working:

### 1️⃣ Add Database Fields
### 2️⃣ Configure Keys in Supabase
### 3️⃣ Deploy Functions to Supabase

---

## 1️⃣ ADD DATABASE FIELDS (Run Once)

### Where: Supabase Dashboard → SQL Editor

**Copy and paste this entire SQL query and click "Run":**

```sql
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_id TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS phonepe_transaction_id TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_verified_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_orders_phonepe_transaction_id ON public.orders(phonepe_transaction_id);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);
```

✅ That's it for database! Click Run once.

---

## 2️⃣ ADD PHONEPE KEYS

### Where: Supabase Dashboard → Project Settings → Edge Functions → Secrets

Click **"Add new secret"** button and add these **5 secrets** one by one:

| Secret Name (copy exactly) | Your Value | Example |
|---------------------------|------------|---------|
| `PHONEPE_MERCHANT_ID` | Your PhonePe Merchant ID | `M123456789` |
| `PHONEPE_SALT_KEY` | Your PhonePe Salt Key | `abc123xyz...` |
| `PHONEPE_SALT_INDEX` | Usually `1` | `1` |
| `PHONEPE_ENVIRONMENT` | `sandbox` for testing | `sandbox` |
| `FRONTEND_URL` | Your website URL | `http://localhost:5173` |

**📝 Notes:**
- For testing: Use `PHONEPE_ENVIRONMENT=sandbox`
- For live: Use `PHONEPE_ENVIRONMENT=production`
- Get Merchant ID & Salt Key from PhonePe Dashboard

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
supabase functions deploy phonepe-payment

# Deploy callback function
supabase functions deploy phonepe-callback
```

✅ You'll see: `Deployed Function phonepe-payment in 2.3s`

---

## 4️⃣ CONFIGURE PHONEPE DASHBOARD

### Where: PhonePe Merchant Portal

1. Login to [PhonePe Merchant Dashboard](https://www.phonepe.com/business/)
2. Go to **API Configuration** or **Settings**
3. Add **Callback URL**:

```
https://YOUR_PROJECT_REF.supabase.co/functions/v1/phonepe-callback
```

**Replace** `YOUR_PROJECT_REF` with your actual Supabase project reference.

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
4. Select **"Online Payment via PhonePe"**
5. Click **"Pay Now"**
6. Complete payment on PhonePe sandbox

### Check It Worked

- ✅ Redirected to "Payment Successful" page
- ✅ Order status shows "ACCEPTED"
- ✅ Payment status shows "PAID"

---

## 🐛 Troubleshooting

### "PhonePe credentials not configured"
- Check you added all 5 secrets in Supabase
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
supabase functions logs phonepe-callback --follow
```

---

## 📋 Checklist

Before testing, make sure:

- [ ] Database SQL run successfully
- [ ] All 5 environment variables added to Supabase
- [ ] Functions deployed (phonepe-payment, phonepe-callback)
- [ ] Callback URL added in PhonePe dashboard
- [ ] Using sandbox mode for testing
- [ ] Frontend running (`npm run dev`)

---

## 🔄 When Going to Production

Change these in Supabase Secrets:

```bash
PHONEPE_ENVIRONMENT = production  (change from sandbox)
PHONEPE_MERCHANT_ID = <production merchant ID>
PHONEPE_SALT_KEY = <production salt key>
FRONTEND_URL = https://yourdomain.com
```

And update callback URL in PhonePe dashboard to production URL.

---

## 📖 Need More Details?

See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for complete instructions.

---

## ⚡ Summary: The 3 Commands

```bash
# 1. Link project (once)
supabase link --project-ref YOUR_PROJECT_REF

# 2. Deploy functions (whenever you make changes)
supabase functions deploy phonepe-payment
supabase functions deploy phonepe-callback

# 3. Check logs (for debugging)
supabase functions logs phonepe-callback --follow
```

That's it! 🎉
