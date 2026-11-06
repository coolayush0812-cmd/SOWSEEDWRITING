# Sow Seed Writing — Website

A fixed-screen three-column writing website. Each column scrolls independently while the page stays fitted to the viewport:

- Left: 185 unique British, American, Chinese, and Japanese customer reviews with a dynamically calculated overall rating
- Middle: 21 interactive flip books arranged in three series, with books sorted by price within each series
- Right: PayPal checkout for personalized writing and paid ebooks; free ebooks skip payment
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
- `supabase/functions/paypal-checkout/` — server-priced PayPal Orders v2 creation and capture for books and custom writing
- `supabase/functions/paypal-webhook/` — PayPal Live webhook signature verification and payment recording

## Run locally

Open `index.html` in a browser, or serve the folder with any local web server.

Example:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Payment setup

Sow Seed Writing offers freelance fiction and nonfiction, personalized stories and scripts, and original copyright-free digital books. Personal requests are saved in Supabase and delivered by email within up to seven days. Admin access uses one shared portal password, without Supabase Auth profiles. The password can be changed in the portal; changing it invalidates existing sessions.

Book prices are listed in `BOOK_PRICES` in `script.js` and independently verified by `paypal-checkout`. Personal writing prices are calculated by the server from the selected page count. Checkout creates a pending order; PayPal capture and its webhook use the same atomic database operation to confirm the order and record one payment. Free books are recorded without a charge.

The portal shows pending, paid, free, cancelled, and older unverified orders. It also shows PayPal records without a matching website order, without counting linked orders twice. Only verified PayPal payments contribute to revenue. Existing manual orders remain visible as payment unverified. Marking an order fulfilled updates its linked payment in the same transaction; the PDF includes the PayPal transaction details when available.

## Supabase setup

The browser connection is configured in `supabase-config.js` and points to `https://jzcsjkntbueyeuykymwh.supabase.co`. Its publishable key is configured in `publicKey`. Never place a secret or service-role key in frontend code.

Apply all migrations in `supabase/migrations/`, through `202611060010_record_paypal_capture.sql`, before using checkout. The migrations update slider pricing, create verified payment records, add manual book orders, and add atomic PayPal recording and fulfillment. Existing orders and payment records from the previous project will not transfer automatically.

The admin portal uses the `admin-portal` Edge Function. Configure `ADMIN_PASSWORD` and `ADMIN_SESSION_SECRET` before deploying it. PayPal checkout uses the PayPal Live app; configure these Edge Function secrets before deploying the checkout and webhook functions:

- `PAYPAL_CLIENT_ID` — PayPal Live app client ID
- `PAYPAL_CLIENT_SECRET` — PayPal Live app secret
- `PAYPAL_WEBHOOK_ID` — webhook ID for this project's `paypal-webhook` URL

Supabase supplies `SUPABASE_URL` and its server key to the function. The password is stored as a salted PBKDF2 hash after it is changed in the portal. It is never included in browser code. The site stores only the signed session token in that browser for up to seven days.

## PayPal webhook deployment

The new webhook URL will be `https://jzcsjkntbueyeuykymwh.supabase.co/functions/v1/paypal-webhook` after the function is deployed. Create a new PayPal webhook for this URL and subscribe it to `PAYMENT.CAPTURE.COMPLETED`. Set these Supabase Edge Function secrets in the new project: `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, and the **new** `PAYPAL_WEBHOOK_ID`. Supabase supplies `SUPABASE_URL` and its server secret key to the function. Use PayPal **Live** credentials for this Live endpoint. Never put the PayPal secret or Supabase server key in browser files or Git.

From an authenticated Supabase CLI session for this project:

```bash
supabase link jzcsjkntbueyeuykymwh
supabase db push --remote
supabase functions deploy admin-portal --no-verify-jwt
supabase functions deploy paypal-checkout --no-verify-jwt
supabase functions deploy paypal-webhook --no-verify-jwt
```

Set the function secrets through the Supabase dashboard or `supabase secrets set` without committing their values. The admin function verifies its own signed sessions and password, so deploy it with gateway JWT verification disabled. Do not create or invite Supabase Auth admin users for this portal.

Once deployed, PayPal buttons create and capture orders through the server-side Orders v2 API. The server sets the displayed line-item name, verifies the amount against the selected book/page count, and records the completed payment. The signed webhook independently reconciles the capture. The admin function returns paid/free order records and saves fulfillment dates. A receipt PDF becomes available after an order is marked fulfilled.

Paid ebook checkout currently records and confirms the purchase. Instant ebook download and automatic email attachment require adding the ebook files and an email-delivery provider; they are not part of the PayPal capture flow.

## Checks

Run `deno test --allow-read --allow-env tests/backend_test.ts` for the function and portal regression tests. They mock PayPal and database requests and never charge a payment.

`tests/portal_database.sql` checks capture deduplication, amount matching, and fulfillment consistency in a rolled-back transaction. Run it against the migrated database with `supabase db query --remote --file tests/portal_database.sql --yes`. Its fixtures are never committed.
