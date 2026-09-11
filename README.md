# Zamphire — Represent e-commerce storefront

A single-directory React (Vite) storefront deployed to Netlify, backed by Firebase (Firestore + Auth). The standalone `sendkardo-qr` Raast QR package is vendored in as `src/lib/sendkardo-qr` for easy in-app use.

## Run locally

```bash
cp .env.example .env     # fill in your Firebase / IBAN values
npm install
npm run dev              # http://localhost:5173
```

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
│   ├── components/         # Layout, ProductCard, ProtectedRoute, Chatbot…
│   ├── context/            # Data, Cart, Auth, Bookmarks
│   ├── pages/              # Home, Checkout, Cart, admin/…
│   └── firebase.js         # Firebase config from .env
├── public/                 # static assets
├── netlify.toml            # build + SPA redirect
└── firestore.rules         # Firestore security rules
```

## Raast QR (online payment)

When a customer chooses **Online Payment** at checkout, a Raast-compatible QR code is rendered from the store IBAN + the order total. The payload builder lives in `src/lib/sendkardo-qr` and is verified against the upstream `sendkardo-qr` npm package. To update it after a new npm release, copy the pure logic from that package's `src/index.js` into `src/lib/sendkardo-qr/index.js`, then run `npm test`.

Deploy config: this app is built straight into the repo root (no `react-app/` subfolder), so the Netlify build command is simply `npm run build` with `publish = "dist"`.
