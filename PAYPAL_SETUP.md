# PayPal checkout

The normal PayPal checkout is enabled for personalized writing and paid books. Free books record an order without payment. The website loads the current PayPal client ID from the backend, so changing credentials does not require editing browser code or rebuilding the site.

If PayPal temporarily restricts the merchant account, checkout remains configured. Once PayPal restores the account's ability to receive payments, customers can use the existing checkout. There is no website activation switch to change.

## Change the PayPal app or account later

1. Open the website's [Supabase Edge Function secrets](https://supabase.com/dashboard/project/jzcsjkntbueyeuykymwh/functions/secrets).
2. Set `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET` to the matching **Live REST app** credentials for the receiving PayPal account. Keep these values in Supabase; never put the secret in website files or Git.
3. In that PayPal app, create a Live webhook for `https://jzcsjkntbueyeuykymwh.supabase.co/functions/v1/paypal-webhook` and subscribe to `PAYMENT.CAPTURE.COMPLETED`.
4. Set `PAYPAL_WEBHOOK_ID` in Supabase to the ID of that webhook. A webhook ID from another app or endpoint will not verify this site's events.
5. Save the secrets and refresh the website. Confirm the book title or personalized-writing item, quantity, and USD price in checkout before making an approved payment.

The receiving PayPal account must be allowed by PayPal to accept payments. Correct credentials cannot remove an account restriction.

## Order and delivery workflow

- PayPal prices are calculated on the server from the selected book or page count.
- The item for custom writing is `Personalised Digital Writing - Custom Order Made Writing`; books use their exact titles.
- A pending order is created when checkout starts. It becomes paid only after the server verifies PayPal's completed capture.
- Checkout and webhook delivery use the same database transaction to prevent duplicate payment records.
- Sign in to the website's admin portal, send the book or writing by email, then use **Mark fulfilled** to record the delivery date and time. The receipt PDF becomes available afterward.

## Checks completed

Live shared-password login, order listing, free-book recording, and fulfillment were checked. Temporary test orders were removed afterward. PayPal Live credentials authenticated successfully; the merchant account restriction prevented an approved paid checkout test. No PayPal payment was approved or captured during these checks.
