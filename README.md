# PharmaTrack License System — Vercel + Supabase Setup

Simple steps, in order. Everything (the activation page + the backend) is
one Vercel project now — so no separate backend URL, no CORS setup.

## Step 1 — Supabase (your database)

1. Go to [supabase.com](https://supabase.com) → create a free account →
   **New Project**.
2. Once it's created, open **SQL Editor** (left sidebar) → **New query**.
3. Open `supabase-setup.sql` (in this folder), copy all of it, paste it in,
   click **Run**. This creates your two tables (`orders`, `trial_activations`).
4. Go to **Project Settings → API**. You'll need two things from this
   page in Step 3 below:
   - **Project URL** (`SUPABASE_URL`)
   - **service_role key**, under "Project API keys" (`SUPABASE_SERVICE_ROLE_KEY`)
     — this is a powerful secret key, never put it in the frontend.
5. To actually **see your data** any time: Supabase → **Table Editor** →
   click `orders`. Every order, payment status, and license key will be
   right there as rows you can browse/search — no separate tool needed.

## Step 2 — Fill in your real values (2 files)

**`lib/plans.js`** — replace the three `amount: null` with your real
prices in paise (₹500 → `50000`).

**`license_generator.html`** (your own file, not in this folder) — open
it, copy the exact `PRIVATE_KEY_B64` value. You'll paste this into Vercel
in Step 3, nowhere else.

## Step 3 — Push this folder to GitHub, then import into Vercel

1. Create a new GitHub repo, push this whole folder to it.
2. Go to [vercel.com](https://vercel.com) → **Add New → Project** → import
   that GitHub repo.
3. Before clicking Deploy, open **Environment Variables** and add these
   (see `.env.example` for exactly where each value comes from):
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `RAZORPAY_KEY_ID`
   - `RAZORPAY_KEY_SECRET`
   - `RAZORPAY_WEBHOOK_SECRET` (see Step 4 — you can add this after the
     first deploy too, then redeploy)
   - `LICENSE_PRIVATE_KEY_B64`
   - `GMAIL_USER`, `GMAIL_APP_PASSWORD`, `ADMIN_NOTIFICATION_EMAIL`,
     `SUPPORT_EMAIL` (see Step 4.5 below)
4. Click **Deploy**. Vercel gives you a URL like
   `https://your-project.vercel.app` — that's your whole site, activation
   page and API together.

## Step 4 — Razorpay webhook (one-time)

1. Razorpay Dashboard → **Settings → Webhooks → Add New Webhook**.
2. URL: `https://your-project.vercel.app/api/webhook/razorpay`
3. Active event: `payment.captured`
4. Save — Razorpay shows you a secret. Copy it into Vercel's
   `RAZORPAY_WEBHOOK_SECRET` env variable, then redeploy (Vercel →
   Deployments → ⋯ → Redeploy) so the new variable takes effect.

## Step 4.5 — Email notifications (one-time)

Whenever a license is issued (trial or paid), two emails go out
automatically: one to the customer with their license key, and one to
you with the order details. This uses Gmail SMTP, not a separate email
service:

1. On the Gmail account you want to send FROM, turn on 2-Step
   Verification: <https://myaccount.google.com/security>
2. Create an App Password: <https://myaccount.google.com/apppasswords>
   (app type: "Mail"). It gives you a 16-character code.
3. In Vercel's Environment Variables, set:
   - `GMAIL_USER` — that Gmail address
   - `GMAIL_APP_PASSWORD` — the 16-character code (no spaces)
   - `ADMIN_NOTIFICATION_EMAIL` — where you want the internal copy sent
   - `SUPPORT_EMAIL` — shown in the customer's email as the "need help" contact
4. Redeploy.

If these variables aren't set, the site still works exactly as before —
license issuance just skips sending emails and logs a warning, it never
blocks a customer from getting their key.

## Step 5 — Test before going live

1. Open `https://your-project.vercel.app/?request_code=test123` in a
   browser (any request code works for testing).
2. Try the **Free Trial** button — you should land on the success screen
   with a license key, and see a new row appear in Supabase's Table Editor
   under `orders`. If email is configured, check that both the customer
   inbox (use a real email address of your own for this test) and
   `ADMIN_NOTIFICATION_EMAIL` received their messages.
3. Try a paid plan with Razorpay's test mode (use test API keys first,
   switch to live keys only once this works end-to-end).
4. **Important:** take one generated license key and confirm it actually
   activates in your real PharmaTrack desktop app before accepting real
   payments — I've tested the sign/encode/decode/verify logic in isolation
   and it's correct, but I haven't been able to test it against your
   actual desktop app's verification code.

## What changed from before (for context)

- No more `better-sqlite3` / local `.db` file — replaced with Supabase
  (a real Postgres database, works properly with Vercel's serverless
  functions, and gives you the Table Editor to see your data anytime).
- No more separate Express server — each API route is now its own file
  under `/api/`, which is how Vercel expects serverless functions to be
  structured.
- Frontend (`index.html`) and backend (`/api`) now deploy together as one
  Vercel project, so `API_BASE_URL` in the page is just `''` (same-origin) —
  no CORS configuration needed anywhere.
