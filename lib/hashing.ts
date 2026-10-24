import { keccak256, stringToBytes, type Hex } from "viem";

/**
 * Normalization (v1) — used for BOTH hashing and display consistency:
 *  1. Unicode NFC
 *  2. Trim leading/trailing whitespace
 *  3. Collapse any run of whitespace (incl. newlines) into one space
 * Case and punctuation are preserved (they can be meaningful in language data).
 * Hash = keccak256(UTF-8 bytes of the normalized text).
 */
export const NORMALIZATION_VERSION = "tutur-norm-v1";

export function normalizeText(text: string): string {
  return text.normalize("NFC").trim().replace(/\s+/g, " ");
}

export function hashContribution(text: string): Hex {
  return keccak256(stringToBytes(normalizeText(text)));
}

export interface TaskMetadataInput {
  title: string;
  prompt: string;
  sourceLanguage: string;
  targetLanguage: string;
  registerOrDialect: string;
  usageTermsVersion: string;
}

/** Deterministic metadata hash: keccak256 of JSON with fixed key order. */
export function hashMetadata(m: TaskMetadataInput): Hex {
  const canonical = JSON.stringify([
    normalizeText(m.title),
    normalizeText(m.prompt),
    normalizeText(m.sourceLanguage),
    normalizeText(m.targetLanguage),
    normalizeText(m.registerOrDialect),
    m.usageTermsVersion,
  ]);
  return keccak256(stringToBytes(canonical));
}
