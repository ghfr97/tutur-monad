import type { Hex } from "viem";
import type { TaskMetadataInput } from "./hashing";

/**
 * Baseline off-chain store: browser localStorage. Works for a same-browser demo only.
 * Another browser will see on-chain state but "metadata unavailable on this device".
 */
export interface StoredTaskMetadata extends TaskMetadataInput {
  metadataHash: Hex;
  createdAt: string;
  taskAddress?: string;
}

export interface StoredContribution {
  taskAddress: string;
  contentHash: Hex;
  contributionText: string;
  contributorWallet: string;
  consentAt: string;
  consentVersion: string;
}

const META_KEY = "tutur:meta:v1";
const CONTRIB_KEY = "tutur:contrib:v1";

function read<T>(key: string): Record<string, T> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(key) ?? "{}");
  } catch {
    return {};
  }
}
function write(key: string, v: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(v));
  } catch {
    /* storage may be full or blocked; the app still works from on-chain state */
  }
}

export function saveMetadata(m: StoredTaskMetadata) {
  const all = read<StoredTaskMetadata>(META_KEY);
  all[m.metadataHash.toLowerCase()] = m;
  write(META_KEY, all);
}
export function getMetadata(hash: string): StoredTaskMetadata | undefined {
  return read<StoredTaskMetadata>(META_KEY)[hash.toLowerCase()];
}
export function saveContribution(c: StoredContribution) {
  const all = read<StoredContribution>(CONTRIB_KEY);
  all[c.taskAddress.toLowerCase()] = c;
  write(CONTRIB_KEY, all);
}
export function getContribution(taskAddress: string): StoredContribution | undefined {
  return read<StoredContribution>(CONTRIB_KEY)[taskAddress.toLowerCase()];
}
