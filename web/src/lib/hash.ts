import { keccak256, toBytes } from "viem";

export function normalizeContribution(text: string): string {
  return text.normalize("NFC").replace(/\r\n?/g, "\n").trim();
}

export function hashContribution(text: string): `0x${string}` {
  const normalized = normalizeContribution(text);
  if (!normalized) throw new Error("Teks kontribusi tidak boleh kosong.");
  return keccak256(toBytes(normalized));
}

export function hashTaskMetadata(metadata: {
  title: string;
  prompt: string;
  usageTerms: string;
  sourceLanguage: string;
  targetLanguage: string;
  registerOrDialect: string;
  usageTermsVersion: string;
  createdAt: string;
}): `0x${string}` {
  return keccak256(toBytes(JSON.stringify(metadata)));
}
