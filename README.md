# Seed Garden Writings — Static Website

A fixed-screen three-column writing website. Each column scrolls independently while the page stays fitted to the viewport:

- Left: 185 unique British, American, Chinese, and Japanese customer reviews with a dynamically calculated overall rating
- Middle: 21 interactive flip books arranged in three series, with books sorted by price within each series
- Right: personal request form or a book picker with the selected book's price and buy button
- Admin: calendar of verified PayPal payments, payment activity, and fulfillment controls

## Files

- `index.html` — website structure
- `about.html` — About Us page
- `terms.html` — Terms & Conditions page
- `privacy.html` — Privacy Policy page
- `delivery-fulfillment-policy.html` — digital delivery and fulfillment policy
- `styles.css` and `admin.css` — responsive site and admin styling
- `script.js` — book flips, form validation, and Supabase writing request storage
- `admin.js` — payment calendar, login, activity, and fulfillment workflow
- `receipt.js` — downloadable receipt PDF for fulfilled payments
- `supabase-config.js` — public Supabase project URL and publishable key
- `supabase/migrations/` — database schema, row-level security, and admin policies
- `supabase/functions/paypal-webhook/` — PayPal Live webhook signature verification and payment recording

## Run locally

Open `index.html` in a browser, or serve the folder with any local web server.

Example:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Payment setup

Personal requests are stored in Supabase and the admin portal uses Supabase Auth. The page slider runs from 10 to 130 pages. Pricing has eleven bands: 10–20 pages cost $11, 21–31 cost $22, and so on through 120–130 pages at $121. The personal request form still **does not collect money**. A saved request is not shown as a payment. The webhook records a PayPal payment only after PayPal verifies its completed capture event.

Book prices are listed in `BOOK_PRICES` in `script.js`. Add each paid checkout URL or free book download URL to `BOOK_CHECKOUT_URLS`, keyed by the exact book title. Book buttons stay disabled until their URLs are added. The personal request form continues to save requests to Supabase.

## Supabase setup

The browser connection is configured in `supabase-config.js` and points to `https://jzcsjkntbueyeuykymwh.supabase.co`. Its publishable key is configured in `publicKey`. Never place a secret or service-role key in frontend code.

This is a new project. Apply all migrations in `supabase/migrations/`, including the initial `orders` table and the three `20261106...` migrations, before using the form and admin portal. The later migrations update slider pricing, create verified payment records, and set the admin policy to `sowseed@gmail.com`. Existing orders and payment records from the previous project will not transfer automatically.

## PayPal webhook deployment

The new webhook URL will be `https://jzcsjkntbueyeuykymwh.supabase.co/functions/v1/paypal-webhook` after the function is deployed. Create a new PayPal webhook for this URL and subscribe it to `PAYMENT.CAPTURE.COMPLETED`. Set these Supabase Edge Function secrets in the new project: `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, and the **new** `PAYPAL_WEBHOOK_ID`. Supabase supplies `SUPABASE_URL` and its server secret key to the function. Use PayPal **Live** credentials for this Live endpoint. Never put the PayPal secret or Supabase server key in browser files or Git.

From an authenticated Supabase CLI session for this project:

```bash
supabase link --project-ref jzcsjkntbueyeuykymwh
supabase db push
supabase functions deploy paypal-webhook
```

Set the function secrets through the Supabase dashboard or `supabase secrets set` without committing their values. Create or update the `sowseed@gmail.com` user in Supabase Authentication with the chosen password. The frontend cannot securely create or change an administrator password.

Once the function is deployed and the PayPal webhook is active, a completed USD capture is inserted into `payment_records` and appears on its payment date in the admin calendar. PayPal signature verification and unique transaction/event IDs prevent unverified or duplicate records. The receipt PDF becomes available after the admin enters the fulfillment date and time. The receipt is generated from the verified payment record.

The checkout links and payment flow for books and personal requests still need to be connected. The webhook records captures from PayPal; it does not create a PayPal checkout on the site by itself.
