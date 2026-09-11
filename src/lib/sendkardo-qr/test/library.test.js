import assert from "node:assert/strict";
import test from "node:test";

import {
  ERROR_CODES,
  SendKardoError,
  crc16,
  createRaastPayload,
  getDefaultExpiry,
  isValidPakistaniIban,
  normalizeAmount,
  normalizePakistaniIban
} from "../index.js";

const VALID_IBAN = "PK33ABCD0000000000000000";

test("exports the browser copy API", () => {
  assert.equal(typeof createRaastPayload, "function");
  assert.equal(typeof isValidPakistaniIban, "function");
  assert.equal(typeof crc16, "function");
});

test("normalizes and validates Pakistani IBANs", () => {
  assert.equal(
    normalizePakistaniIban(" pk33 abcd 0000 0000 0000 0000 "),
    VALID_IBAN
  );
  assert.equal(isValidPakistaniIban(VALID_IBAN), true);
  assert.equal(isValidPakistaniIban("PK00ABCD0000000000000000"), false);
  assert.equal(isValidPakistaniIban("GB82WEST12345698765432"), false);
});

test("normalizes optional payment amounts", () => {
  assert.equal(normalizeAmount(undefined), "");
  assert.equal(normalizeAmount("5,000.50"), "5000.50");
  assert.equal(normalizeAmount("00050"), "50");
  assert.equal(normalizeAmount("0"), null);
  assert.equal(normalizeAmount("12.345"), null);
});

test("preserves the original static payload byte-for-byte", () => {
  assert.equal(
    createRaastPayload({ iban: VALID_IBAN }),
    "0002020102110202000424PK33ABCD00000000000000001004BA20"
  );
});

test("preserves the dynamic payload format with an explicit expiry", () => {
  assert.equal(
    createRaastPayload({
      iban: VALID_IBAN,
      amount: "5,000.50",
      expiry: "2026-12-31T18:30"
    }),
    "0002020102120202000424PK33ABCD000000000000000005075000.50071231122026183010041E4C"
  );
});

test("defaults amount-bearing payloads to the next calendar day", () => {
  const before = getDefaultExpiry();
  const payload = createRaastPayload({ iban: VALID_IBAN, amount: "500" });
  const after = getDefaultExpiry();
  const toPayloadDate = (value) => {
    const [year, month, day] = value.split("-");
    return day + month + year + "2359";
  };

  const encodedExpiry = payload.match(/07(12)(\d{12})/)[2];
  assert.ok(
    encodedExpiry === toPayloadDate(before) || encodedExpiry === toPayloadDate(after)
  );
});

test("returns the next local calendar day as the default", () => {
  assert.equal(
    getDefaultExpiry(new Date(2026, 0, 1, 10, 15, 45, 500)),
    "2026-01-02"
  );
});

test("preserves the original dynamic expiry payload byte-for-byte", () => {
  assert.equal(
    createRaastPayload({
      iban: VALID_IBAN,
      amount: "500",
      expiry: "2026-12-31"
    }),
    "0002020102120202000424PK33ABCD0000000000000000050350007123112202623591004EC99"
  );
});

test("encodes date-only expiry as DDMMYYYY2359", () => {
  const payload = createRaastPayload({
    iban: VALID_IBAN,
    amount: "100",
    expiry: "2026-09-01"
  });

  assert.match(payload, /0712010920262359/);
});

test("calculates a stable uppercase CRC", () => {
  assert.equal(crc16("123456789"), "29B1");
});

test("throws errors with machine-readable codes", () => {
  assert.throws(
    () => createRaastPayload({ iban: "not-an-iban" }),
    (error) => error instanceof SendKardoError && error.code === ERROR_CODES.INVALID_IBAN
  );
  assert.throws(
    () => createRaastPayload({ iban: VALID_IBAN, amount: -1 }),
    (error) => error instanceof SendKardoError && error.code === ERROR_CODES.INVALID_AMOUNT
  );
  assert.throws(
    () => createRaastPayload({ iban: VALID_IBAN, expiry: "2026-02-31" }),
    (error) => error instanceof SendKardoError && error.code === ERROR_CODES.INVALID_EXPIRY
  );
});