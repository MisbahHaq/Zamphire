export interface RaastPayloadOptions {
  /** A 24-character Pakistani IBAN. Spaces and letter casing are normalized. */
  iban: string;
  /** Optional positive payment amount with no more than two decimal places. */
  amount?: string | number;
  /** Optional expiry in YYYY-MM-DD or YYYY-MM-DDTHH:mm format. Defaults to tomorrow at 23:59 when amount is present. */
  expiry?: string;
}

export type SendKardoErrorCode =
  | "INVALID_OPTIONS"
  | "INVALID_IBAN"
  | "INVALID_AMOUNT"
  | "INVALID_EXPIRY"
  | "INVALID_CRC_INPUT"
  | "INVALID_QR_OPTIONS";

export declare const ERROR_CODES: Readonly<{
  INVALID_OPTIONS: "INVALID_OPTIONS";
  INVALID_IBAN: "INVALID_IBAN";
  INVALID_AMOUNT: "INVALID_AMOUNT";
  INVALID_EXPIRY: "INVALID_EXPIRY";
  INVALID_CRC_INPUT: "INVALID_CRC_INPUT";
  INVALID_QR_OPTIONS: "INVALID_QR_OPTIONS";
}>;

export declare class SendKardoError extends TypeError {
  readonly code: SendKardoErrorCode;
  constructor(code: SendKardoErrorCode, message: string);
}

/** Create a payment payload using SendKardo's supported Raast payload format. */
export declare function createRaastPayload(options: RaastPayloadOptions): string;

/** Return the next local calendar day in YYYY-MM-DD format. */
export declare function getDefaultExpiry(now?: Date): string;

/** Validate the structure and checksum of a Pakistani IBAN. */
export declare function isValidPakistaniIban(value: unknown): boolean;

/** Remove spaces and uppercase a Pakistani IBAN without validating it. */
export declare function normalizePakistaniIban(value: unknown): string;

/** Normalize an amount, return an empty string when omitted, or null when invalid. */
export declare function normalizeAmount(value: unknown): string | null;

/** Calculate the CRC-16 checksum used by the payment payload. */
export declare function crc16(value: string): string;