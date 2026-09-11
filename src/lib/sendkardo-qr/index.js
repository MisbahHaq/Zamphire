// ═══════════════════════════════════════════════════════════════════════
//  sendkardo-qr (browser copy)
//
//  Vendored from the standalone `sendkardo-qr` npm package at the repo
//  root. This copy is browser-safe: it implements the Raast payment
//  payload format, IBAN validation and CRC-16 checksum with ZERO runtime
//  dependencies (the Node `qrcode` package is NOT used here).
//
//  In the React app, QR rendering is handled by `qrcode.react`:
//      import { createRaastPayload } from '../lib/sendkardo-qr';
//      import { QRCodeSVG } from 'qrcode.react';
//      <QRCodeSVG value={createRaastPayload({ iban, amount })} />
//
//  To sync with the npm package: copy the pure-logic functions from
//  ../src/index.js (keep the nodes running without the `qrcode` import
//  and the two QR-rendering helpers) into this file, then update the
//  tests in ./test/library.test.js.
// ═══════════════════════════════════════════════════════════════════════

const ERROR_CODES = Object.freeze({
  INVALID_OPTIONS: "INVALID_OPTIONS",
  INVALID_IBAN: "INVALID_IBAN",
  INVALID_AMOUNT: "INVALID_AMOUNT",
  INVALID_EXPIRY: "INVALID_EXPIRY",
  INVALID_CRC_INPUT: "INVALID_CRC_INPUT",
  INVALID_QR_OPTIONS: "INVALID_QR_OPTIONS"
});

class SendKardoError extends TypeError {
  constructor(code, message) {
    super(message);
    this.name = "SendKardoError";
    this.code = code;
  }
}

function normalizePakistaniIban(value) {
  if (typeof value !== "string") return "";
  return value.trim().toUpperCase().replace(/\s+/g, "");
}

function isValidPakistaniIban(value) {
  const iban = normalizePakistaniIban(value);
  if (!/^PK\d{2}[A-Z]{4}[A-Z0-9]{16}$/.test(iban)) return false;

  const rearranged = iban.slice(4) + iban.slice(0, 4);
  let remainder = 0;

  for (const character of rearranged) {
    const expanded = /[A-Z]/.test(character)
      ? String(character.charCodeAt(0) - 55)
      : character;

    for (const digit of expanded) {
      remainder = (remainder * 10 + Number(digit)) % 97;
    }
  }

  return remainder === 1;
}

function normalizeAmount(value) {
  if (value === undefined || value === null) return "";
  if (typeof value !== "string" && typeof value !== "number") return null;

  const raw = String(value).trim().replace(/,/g, "");
  if (!raw) return "";
  if (!/^\d+(?:\.\d{1,2})?$/.test(raw)) return null;

  const amount = Number(raw);
  if (!Number.isFinite(amount) || amount <= 0) return null;

  const normalized = raw.replace(/^0+(?=\d)/, "");
  return normalized.length <= 10 ? normalized : null;
}

function crc16(value) {
  if (typeof value !== "string") {
    throw new SendKardoError(
      ERROR_CODES.INVALID_CRC_INPUT,
      "CRC input must be a string."
    );
  }

  let crc = 0xFFFF;

  for (let i = 0; i < value.length; i += 1) {
    crc ^= value.charCodeAt(i) << 8;

    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 0x8000
        ? ((crc << 1) ^ 0x1021) & 0xFFFF
        : (crc << 1) & 0xFFFF;
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, "0");
}

function normalizeExpiry(value) {
  if (value === undefined || value === null || value === "") return "";
  if (typeof value !== "string") return null;

  const expiry = value.trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?$/.exec(expiry);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = match[4] === undefined ? 23 : Number(match[4]);
  const minute = match[5] === undefined ? 59 : Number(match[5]);
  const date = new Date(Date.UTC(year, month - 1, day, hour, minute));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day ||
    date.getUTCHours() !== hour ||
    date.getUTCMinutes() !== minute
  ) return null;

  return expiry;
}

function getDefaultExpiry(now = new Date()) {
  if (!(now instanceof Date) || !Number.isFinite(now.getTime())) {
    throw new SendKardoError(
      ERROR_CODES.INVALID_EXPIRY,
      "Default expiry requires a valid Date."
    );
  }

  const expiry = new Date(now.getTime());
  expiry.setDate(expiry.getDate() + 1);

  const year = expiry.getFullYear();
  const month = String(expiry.getMonth() + 1).padStart(2, "0");
  const day = String(expiry.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function createRaastPayload(options) {
  if (!options || typeof options !== "object" || Array.isArray(options)) {
    throw new SendKardoError(
      ERROR_CODES.INVALID_OPTIONS,
      "createRaastPayload expects an options object."
    );
  }

  const iban = normalizePakistaniIban(options.iban);
  if (!isValidPakistaniIban(iban)) {
    throw new SendKardoError(
      ERROR_CODES.INVALID_IBAN,
      "Enter a valid 24-character Pakistani IBAN."
    );
  }

  const amount = normalizeAmount(options.amount);
  if (amount === null) {
    throw new SendKardoError(
      ERROR_CODES.INVALID_AMOUNT,
      "Amount must be positive, use no more than two decimal places, and fit within 10 characters."
    );
  }

  const expiry = normalizeExpiry(
    options.expiry || (amount ? getDefaultExpiry() : "")
  );
  if (expiry === null) {
    throw new SendKardoError(
      ERROR_CODES.INVALID_EXPIRY,
      "Expiry must be a valid date in YYYY-MM-DD or YYYY-MM-DDTHH:mm format."
    );
  }

  const dynamic = Boolean(amount || expiry);
  let payload = "000202";
  payload += "0102" + (dynamic ? "12" : "11");
  payload += "020200";
  payload += "0424" + iban;

  if (amount) {
    payload += "05" + String(amount.length).padStart(2, "0") + amount;
  }

  if (expiry) {
    const [datePart, timePart = "23:59"] = expiry.split("T");
    const [year, month, day] = datePart.split("-");
    payload += "0712" + day + month + year + timePart.replace(":", "");
  }

  payload += "1004";
  return payload + crc16(payload);
}

export {
  ERROR_CODES,
  SendKardoError,
  crc16,
  createRaastPayload,
  getDefaultExpiry,
  isValidPakistaniIban,
  normalizeAmount,
  normalizePakistaniIban
};