# Seed Garden Writings — Static Website

A fixed-screen three-column writing website. Each column scrolls independently while the page stays fitted to the viewport:

- Left: 185 unique British, American, Chinese, and Japanese customer reviews with a dynamically calculated overall rating
- Middle: 21 interactive flip books arranged in three series, with books sorted by price within each series
- Right: personal request form or a book order form with price and customer contact fields
- Admin: calendar of verified PayPal payments, saved book and writing requests, and fulfillment controls

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

Personal requests are stored in Supabase. Admin access uses one shared portal password, without Supabase Auth profiles. The password is entered on each device and can be changed in the portal; changing it invalidates existing sessions. The page slider runs from 10 to 130 pages. Pricing has eleven bands: 10–20 pages cost $11, 21–31 cost $22, and so on through 120–130 pages at $121. The personal request form still **does not collect money**. A saved request is not shown as a payment. The webhook records a PayPal payment only after PayPal verifies its completed capture event.

Book prices are listed in `BOOK_PRICES` in `script.js`. Customers place a book order with their name and email; the order is saved in Supabase for manual email delivery and fulfillment in the admin portal. No download or checkout link is required for this workflow. Personal requests are also saved as orders. Verified PayPal captures, when used, are recorded separately by the webhook.

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

Once the function is deployed and the PayPal webhook is active, a completed USD capture is inserted into `payment_records` and appears on its payment date in the admin calendar. PayPal signature verification and unique transaction/event IDs prevent unverified or duplicate records. The receipt PDF becomes available after the admin enters the fulfillment date and time. The receipt is generated from the verified payment record.

Book orders are saved for manual email delivery and can be marked fulfilled with a date and time in the admin portal. The webhook records verified PayPal captures separately; it does not create a PayPal checkout on the site by itself.
