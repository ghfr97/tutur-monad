export type TransactionErrorInfo = {
  message: string;
  rateLimited: boolean;
};

export function getTransactionErrorInfo(error: unknown): TransactionErrorInfo {
  const rawMessage =
    error instanceof Error ? error.message : String(error ?? "Unknown transaction error");
  const normalized = rawMessage.toLowerCase();
  const rateLimited =
    normalized.includes("rate limited") ||
    normalized.includes("rate limit") ||
    normalized.includes("429") ||
    normalized.includes("too many requests");

  if (rateLimited) {
    return {
      rateLimited: true,
      message:
        "RPC Monad Testnet sedang membatasi permintaan. Ini bukan bukti transaksi revert. Tunggu jeda, lalu coba kirim sekali lagi. Jika berulang, ganti RPC Monad Testnet di pengaturan jaringan wallet dengan endpoint dari provider yang mendukung testnet.",
    };
  }

  if (
    normalized.includes("user rejected") ||
    normalized.includes("user denied") ||
    normalized.includes("rejected the request")
  ) {
    return {
      rateLimited: false,
      message: "Permintaan transaksi dibatalkan di wallet.",
    };
  }

  return { rateLimited: false, message: rawMessage };
}
