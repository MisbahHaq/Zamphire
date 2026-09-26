# Zamphire — Perfume e-commerce storefront

Zamphire is a React (Vite) perfume storefront for the Pakistani market. It ships with a customer storefront, an admin dashboard for managing products/orders/support, and Raast (EMVCo) QR payments — all backed by Firebase (Firestore + Auth) and deployed to Netlify.

## Features

**Storefront**
- Product catalogs: Men, Women, The Vault (rare pieces), Home landing page with bestsellers and carousels (`swiper`)
- Search, product detail pages (sizes, colors, variants), recently-viewed history
- Cart with guest + signed-in support, bookmarks/wishlist
- Checkout with cash-on-delivery or **Online Payment (Raast QR)**, standard/express delivery, order confirmation page
- Email/password auth plus Google sign-in, protected routes for checkout/profile/bookmarks
- Built-in **Zamphire Assistant** chatbot: track order status, request cancellation, chat with admin (replies stream into the chat)

**Admin (role-gated)**
- Dashboard, product create/edit/delete, order list + detail with status updates
- Support ticket inbox (all / unread / cancellations) with admin replies

**Payment**
- Online checkout renders a Raast-compatible QR scanned in any Raast-enabled Pakistani banking app. The pure payload logic (EMVCo format, IBAN validation, CRC-16, expiry) is vendored from the [`sendkardo-qr`](https://github.com/umr13/sendkardo-qr) npm package into `src/lib/sendkardo-qr` with zero runtime dependencies.

## Tech stack

| Layer | Tools |
| --- | --- |
| UI | React 18, React Router 6, Bootstrap 5, Bootstrap Icons, Swiper |
| Build | Vite 5 |
| Backend | Firebase 10 — Firestore (live sync via `onSnapshot`) + Authentication |
| Payments | `qrcode.react` for rendering + vendored `sendkardo-qr` Raast payload builder |
| Tests | Node built-in test runner (`node --test`) |
| Deploy | Netlify (`netlify.toml`, SPA redirects, cache headers) |

## Getting started

```bash
cp .env.example .env     # fill in your Firebase + store values
npm install
npm run dev              # http://localhost:5173
```

## Configuration

Copy `.env.example` → `.env` and set:

- `VITE_STORE_NAME`, `VITE_STORE_IBAN` — used to build the Raast payment QR
- `VITE_ADMIN_EMAILS` — comma-separated emails that get the `admin` role
- `VITE_FIREBASE_*` — your Firebase project config (Firestore + Auth enabled, Google provider on)

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview the production build |
| `npm test` | Run the vendored `sendkardo-qr` library tests |

## Structure

```
├── src/
│   ├── lib/sendkardo-qr/   # Vendored Raast QR payload library (browser-safe, tested)
│   ├── components/         # Layout, Navbar, ProductCard, ProtectedRoute, Chatbot…
│   ├── context/            # Auth, Data, Cart, Bookmarks providers
│   ├── pages/              # Storefront pages + admin/ dashboard
│   ├── store.js            # Firestore data layer (products, orders, support, cart…)
│   ├── firebase.js         # Firebase init + admin list from .env
│   ├── App.jsx             # Routes (public, protected, admin-only)
│   └── main.jsx
├── public/assets/          # static images
├── netlify.toml            # build config + SPA redirect + cache headers
└── firestore.rules         # Firestore security rules (dev/permissive — tighten for prod)
```

## Online payment (Raast QR)

When a customer picks **Cash on Delivery** or **Online Payment** at checkout, the order is written to Firestore with a numeric sequential id. For online payment a Raast QR is generated from the store IBAN + order total (`createRaastPayload` in `src/lib/sendkardo-qr`) and rendered with `qrcode.react`.

To update the vendored payload library after a new `sendkardo-qr` npm release: copy the pure functions from that package's `src/index.js` into `src/lib/sendkardo-qr/index.js`, refresh `index.d.ts` if needed, mirror the cases in `test/library.test.js`, then run `npm test`.

## Firestore security rules

`firestore.rules` are **permissive dev rules** (products are publicly readable; any signed-in user can write). Before going to production, restrict writes to admin users — see the comments at the top of the file.

## Deployment

Built straight into the repo root: Netlify build command is `npm run build` with `publish = "dist"`. `netlify.toml` also adds immutable cache headers for assets and an SPA fallback redirect.
