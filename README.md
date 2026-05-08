# SBC Sales Distribution

Expo React Native app for field sales teams selling to mapped shops, enforcing geo-locked shop interactions, onboarding new outlets, and reviewing order/activity history.

## Setup

1. Copy `.env.example` to `.env`.
2. Add your Supabase project URL and anon key.
3. Install dependencies with `npm install`.
4. Start the app with `npm run start`.

## Supabase Connection

The local `.env` file has been configured with the provided Supabase project URL and publishable key. Keep `.env` out of Git.

The live project currently uses camelCase columns for shops and locations:

- `shops.ownerName`
- `shops.ownerMobile`
- `shops.regionId`
- `locations.shopId`

Products use the existing lowercase names:

- `products.unitofmeasurement`
- `products.price`
- `products.retailprice`
- `products.isactive`

## Supabase Tables Expected

The data layer is centralized in `services/supabase-queries.ts`. Rename table or column references there to match the existing web dashboard schema.

- `shops` plus `locations`: mapped outlets with GPS coordinates.
- `products` plus `product_categories`: SKU catalog with category, unit, price, and stock.
- `orders`: order header with shop, sales rep, totals, payment totals, and status.
- `payments`: payment collection history.

The provided live Supabase project currently exposes `shops`, `locations`, `products`, `regions`, `routes`, `route_shops`, and `users` to the publishable key. `orders` and `payments` were not visible during the mobile smoke test. The app handles that gracefully for reads, but mobile order submission requires `public.orders` to be present and exposed through RLS/API policies.

For product-level order details, add an `order_items` table that stores each SKU and quantity. Without it, the mobile app can only persist the order total.

The mobile app also supports rep clock-in controls. Add `sales_attendance_sessions` and `sales_attendance_events` from `supabase-mobile-additions.sql` so clock-in, pauses, resumes, and clock-out events are audited in Supabase.

Manager notifications use `sales_notifications`. Set `userid` for a rep-specific message, or leave it `NULL` for a broadcast message visible to every rep.

Support form submissions use `support_requests`. Reps can also call or WhatsApp `0746583509` directly from the app.
