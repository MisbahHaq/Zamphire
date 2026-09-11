# sendkardo-qr (browser copy)

A vendored, browser-safe copy of the standalone [`sendkardo-qr`](https://github.com/umr13/sendkardo-qr) package. It implements the pure logic — Raast (EMVCo) payload format, Pakistani IBAN validation, CRC-16 checksum and default expiry — with **zero runtime dependencies**, so it runs safely in the browser.

The original npm package additionally renders PNG/SVG via the Node-only `qrcode` library; that part is intentionally **not** vendored — in this app the QR is rendered with `qrcode.react`.

## Usage

```js
import { createSendKardoPayload } from '../lib/sendkardo-qr';
import { QRCodeSVG } from 'qrcode.react';

const payload = createSendKardoPayload({ iban: storeConfig.iban, amount: total });
// <QRCodeSVG value={payload} size={200} level="H" includeMargin />
```

## Keeping this copy in sync

The canonical source of truth is the standalone [`sendkardo-qr`](https://github.com/umr13/sendkardo-qr) npm package (this repo was originally a multi-directory workspace). When that package changes, update this vendored copy:

1. Copy every **pure** function from the package's `src/index.js` into `index.js` — that is everything **except** the `import QRCode from "qrcode"` line and the two rendering helpers (`createSendKardoQrDataUrl`, `createSendKardoQrSvg`).
2. Update `index.d.ts` if public types changed.
3. Mirror the relevant cases in `test/library.test.js`.

Run the vendored tests from the repo root:

```bash
npm test            # alias for node --test src/lib/sendkardo-qr/test/library.test.js
# or directly:
node --test src/lib/sendkardo-qr/test/library.test.js
```

## Files

| File | Purpose |
| --- | --- |
| `index.js` | Browser-safe ESM source (no runtime deps) |
| `index.d.ts` | TypeScript definitions |
| `README.md` | This file — includes the sync checklist above |
| `test/library.test.js` | Test suite mirroring the npm package's pure-logic tests |

## License

MIT — see `LICENSE`. Part of the [sendkardo-qr](https://github.com/umr13/sendkardo-qr) project by umr13.
