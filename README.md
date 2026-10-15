# MeShop

A responsive, buildless six-page shopping application using HTML, CSS, and JavaScript.

## Run

Use Node.js 24 or newer. No dependencies are required.

```sh
npm start
```

Open http://localhost:3000. Use a local HTTP server or HTTPS hosting; do not open the HTML files directly. Run `npm test` for logic and page checks.

## Features

- Landing page, login, signup, shop, cart, profile; Inter font and responsive layouts.
- Signup, login, salted PBKDF2 password hashing, random session token, 24-hour expiry, route guards, profile and password updates, logout.
- Live FakeStoreAPI catalog, loading/error/retry states, search, category tabs and checkboxes, color filters, price/rating sliders, sorting, combined filtering and reset.
- Account-specific persistent carts, quantities, removal, totals and explicit demo checkout.
- Razorpay Checkout integration with server-created orders and server verification before clearing the cart.

FakeStoreAPI has no color field; deterministic demo colors are assigned to products and labeled in the filters. Catalog prices are USD. No currency conversion is assumed.

## Authentication scope

Local-storage authentication is for this educational assignment. Passwords are hashed, but browser storage and route guards can be modified by the visitor and provide no trusted server authentication. Do not use real passwords or sensitive personal information. Production requires server-managed accounts, authorization and secure HTTP-only sessions. Payment servers must use their own trusted authentication; the browser demo token is not a server credential.

## Razorpay

Demo checkout works immediately and never charges money. To enable Razorpay, configure `paymentApi` (HTTPS backend origin/path) and the public `razorpayKey` in `config.js`. Never put a key secret in browser files.

Required backend contract:

1. `POST /orders` accepts `{items:[{id,quantity}]}`. Authenticate the customer server-side, validate products/quantities, calculate authoritative prices, and create a Razorpay order. Return `{id,amount,currency}`, where amount is an integer in the currency's smallest unit. Choose a supported settlement currency and perform any USD conversion server-side with explicit customer confirmation.
2. `POST /verify` accepts Razorpay's `razorpay_order_id`, `razorpay_payment_id`, `razorpay_signature`, plus `orderId`. Check order ownership, the stored order ID and amount, validate HMAC SHA-256 with the server secret, and verify captured/paid state. Return `{verified:true}` only after successful verification and durable, idempotent order recording.
3. Use verified webhooks and reconciliation for interrupted browser sessions. Add rate limiting, CORS allowlisting, input validation, and server-side session protection.

Payment failures, cancellation and verification errors retain the cart. The backend and merchant credentials are not included. See https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/ .

## GitHub Pages deployment

1. Create a GitHub repository and upload this project with `main` as the default branch.
2. In repository Settings ? Pages ? Build and deployment, select **GitHub Actions**.
3. Push to `main` or run the Deploy GitHub Pages workflow. It tests the application and publishes only the six pages and browser assets.
4. Open the deployment URL reported by the workflow.

Relative URLs support GitHub project subpaths. GitHub Pages hosts static files only; host the payment backend separately. Repository: https://github.com/viveklb/Shopping-Cart-Application-using-Javascript . Production: https://shopping-cart-application-using-jav.vercel.app .

## Design and verification

No Figma reference was supplied. The original neutral/olive storefront uses a shared visual system rather than claiming a match to an unavailable template. Product imagery and the catalog need external network access; Google Fonts falls back to Arial if unavailable.

Automated checks cover route guards, expired sessions, HTML escaping, cart isolation, password derivation and page assets. Browser interaction and live payment acceptance require separate verification with a connected browser and merchant test environment.

## Vercel deployment

The GitHub repository is connected to Vercel for automatic deployments. Vercel runs npm run build and serves dist using vercel.json. Manual deployment: vercel deploy --prod. Checkout remains in demo mode until a payment backend is configured.
