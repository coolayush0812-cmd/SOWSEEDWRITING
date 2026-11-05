# Sow Seed Writing — Website

A fixed-screen three-column writing website. Each column scrolls independently while the page stays fitted to the viewport:

- Left: 185 unique British, American, Chinese, and Japanese customer reviews with a dynamically calculated overall rating
- Middle: 21 interactive flip books arranged in three series, with books sorted by price within each series
- Right: personalized writing request form or ebook order form
- Admin: order calendar, customer details, fulfillment date/time, and order receipt PDF

## Files

- `index.html` — website structure
- `about.html` — About Us page
- `terms.html` — Terms & Conditions page
- `privacy.html` — Privacy Policy page
- `delivery-fulfillment-policy.html` — digital delivery and fulfillment policy
- `styles.css` and `admin.css` — responsive site and admin styling
- `script.js` — book flips, order validation, and Supabase order storage
- `admin.js` — shared-password portal, payment calendar, order activity, and fulfillment workflow
- `receipt.js` — downloadable receipt PDF for fulfilled payments
- `supabase-config.js` — public Supabase project URL and publishable key
- `supabase/migrations/` — database schema, row-level security, and private admin settings
- `supabase/functions/admin-portal/` — shared-password sign-in, admin data access, fulfillment, and password changes
- `supabase/functions/paypal-webhook/` — PayPal Live webhook signature verification and payment recording

## Run locally

Open `index.html` in a browser, or serve the folder with any local web server.

Example:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Payment setup

Sow Seed Writing offers freelance fiction and nonfiction, personalized stories and scripts, and original copyright-free digital books. Personal requests are saved in Supabase and delivered by email within up to seven days. Ebook purchases are intended to provide immediate access and an emailed copy. Admin access uses one shared portal password, without Supabase Auth profiles. The password can be changed in the portal; changing it invalidates existing sessions.

Book prices are listed in `BOOK_PRICES` in `script.js`. Personal writing prices use the selected page count. Both types of orders are saved in Supabase and shown by order date in the admin portal.

## Supabase setup

The browser connection is configured in `supabase-config.js` and points to `https://jzcsjkntbueyeuykymwh.supabase.co`. Its publishable key is configured in `publicKey`. Never place a secret or service-role key in frontend code.

Apply all migrations in `supabase/migrations/`, including the initial `orders` table and the `20261106...` migrations, before using the forms and portal. The migrations update slider pricing, create verified payment records, add manual book orders, and create a private table for the portal password hash and login throttling. Existing orders and payment records from the previous project will not transfer automatically.

The admin portal uses the `admin-portal` Edge Function. Configure these Edge Function secrets before deploying it:

- `ADMIN_PASSWORD` — initial shared portal password (at least 10 characters)
- `ADMIN_SESSION_SECRET` — a random secret used to sign seven-day admin sessions

Supabase supplies `SUPABASE_URL` and its server key to the function. The password is stored as a salted PBKDF2 hash after it is changed in the portal. It is never included in browser code. The site stores only the signed session token in that browser for up to seven days.

## PayPal webhook deployment

The new webhook URL will be `https://jzcsjkntbueyeuykymwh.supabase.co/functions/v1/paypal-webhook` after the function is deployed. Create a new PayPal webhook for this URL and subscribe it to `PAYMENT.CAPTURE.COMPLETED`. Set these Supabase Edge Function secrets in the new project: `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, and the **new** `PAYPAL_WEBHOOK_ID`. Supabase supplies `SUPABASE_URL` and its server secret key to the function. Use PayPal **Live** credentials for this Live endpoint. Never put the PayPal secret or Supabase server key in browser files or Git.

From an authenticated Supabase CLI session for this project:

```bash
supabase link --project-ref jzcsjkntbueyeuykymwh
supabase db push
supabase functions deploy admin-portal --no-verify-jwt
supabase functions deploy paypal-webhook
```

Set the function secrets through the Supabase dashboard or `supabase secrets set` without committing their values. The admin function verifies its own signed sessions and password, so deploy it with gateway JWT verification disabled. Do not create or invite Supabase Auth admin users for this portal.

Once deployed, the admin function returns order records and saves fulfillment dates. A receipt PDF becomes available after an order is marked fulfilled. PayPal payment capture is separate from the order form and requires a configured checkout.

The order form records customer selections and contact information. Instant ebook access requires the ebook files and a connected checkout to be configured for the live site.
