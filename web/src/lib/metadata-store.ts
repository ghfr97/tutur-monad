export type TaskMetadata = {
  taskAddress: string;
  title: string;
  prompt: string;
  usageTerms: string;
  sourceLanguage: string;
  targetLanguage: string;
  registerOrDialect: string;
  usageTermsVersion: string;
  createdAt: string;
};

export type ContributionMetadata = {
  contributionText: string;
  contributorWallet: string;
  consentAt: string;
  consentVersion: string;
  contentHash: `0x${string}`;
};

function getLocalStorage(): Storage {
  if (typeof window === "undefined") {
    throw new Error("Penyimpanan metadata hanya tersedia di browser.");
  }
  return window.localStorage;
}

function metadataKey(address: string): string {
  return address.toLowerCase();
}

function notifyMetadataChanged(): void {
  window.dispatchEvent(new Event("tutur:metadata"));
}

function isTaskMetadata(value: unknown): value is TaskMetadata {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return [
    "taskAddress",
    "title",
    "prompt",
    "usageTerms",
    "sourceLanguage",
    "targetLanguage",
    "registerOrDialect",
    "usageTermsVersion",
    "createdAt",
  ].every((key) => typeof record[key] === "string");
}

function isContributionMetadata(value: unknown): value is ContributionMetadata {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.contributionText === "string" &&
    typeof record.contributorWallet === "string" &&
    typeof record.consentAt === "string" &&
    typeof record.consentVersion === "string" &&
    typeof record.contentHash === "string"
  );
}

export function saveTaskMetadata(metadata: TaskMetadata): void {
  getLocalStorage().setItem(
    `tutur:task:${metadata.taskAddress.toLowerCase()}`,
    JSON.stringify(metadata),
  );
  notifyMetadataChanged();
}

export function readTaskMetadata(address: string): TaskMetadata | undefined {
  const stored = getLocalStorage().getItem(`tutur:task:${address.toLowerCase()}`);
  if (!stored) return undefined;
  const parsed: unknown = JSON.parse(stored);
  if (!isTaskMetadata(parsed)) throw new Error("Metadata task lokal tidak valid.");
  return parsed;
}

export function saveContributionMetadata(
  taskAddress: string,
  metadata: ContributionMetadata,
): void {
  getLocalStorage().setItem(
    `tutur:contribution:${taskAddress.toLowerCase()}`,
    JSON.stringify(metadata),
  );
  notifyMetadataChanged();
}

export function readContributionMetadata(
  taskAddress: string,
): ContributionMetadata | undefined {
  const stored = getLocalStorage().getItem(
    `tutur:contribution:${taskAddress.toLowerCase()}`,
  );
  if (!stored) return undefined;
  const parsed: unknown = JSON.parse(stored);
  if (!isContributionMetadata(parsed)) {
    throw new Error("Metadata kontribusi lokal tidak valid.");
  }
  return parsed;
}

export function subscribeToMetadata(
  address: string,
  onChange: () => void,
): () => void {
  const key = metadataKey(address);
  const handleStorage = (event: Event) => {
    if (
      event.type === "tutur:metadata" ||
      (event instanceof StorageEvent &&
        (event.key?.includes(key) || event.key === null))
    ) {
      onChange();
    }
  };
  window.addEventListener("storage", handleStorage);
  window.addEventListener("tutur:metadata", handleStorage);
  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener("tutur:metadata", handleStorage);
  };
}

export function getMetadataSnapshot(address: string): string {
  if (typeof window === "undefined") return "";
  try {
    return JSON.stringify({
      task: readTaskMetadata(address) ?? null,
      contribution: readContributionMetadata(address) ?? null,
    });
  } catch (error) {
    return JSON.stringify({
      error: error instanceof Error ? error.message : "Metadata lokal tidak dapat dibaca.",
    });
  }
}
