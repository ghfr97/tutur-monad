"use client";

import { useCallback, useState } from "react";
import type { Hash, TransactionReceipt } from "viem";
import { publicClient } from "./chain";
import { friendlyError } from "./errors";

export type TxPhase = "idle" | "wallet" | "pending" | "confirmed" | "failed";
export interface TxState {
  phase: TxPhase;
  hash?: Hash;
  receipt?: TransactionReceipt;
  error?: string;
}

/**
 * Sends a transaction via `send` (must return a hash from the wallet) and only reports
 * "confirmed" after a successful on-chain receipt. Reverted receipts are "failed".
 */
export function useTx() {
  const [state, setState] = useState<TxState>({ phase: "idle" });

  const run = useCallback(async (send: () => Promise<Hash>): Promise<TransactionReceipt | undefined> => {
    setState({ phase: "wallet" });
    let hash: Hash;
    try {
      hash = await send();
    } catch (e) {
      setState({ phase: "failed", error: friendlyError(e) });
      return undefined;
    }
    setState({ phase: "pending", hash });
    try {
      const receipt = await publicClient.waitForTransactionReceipt({ hash, timeout: 120_000 });
      if (receipt.status !== "success") {
        setState({ phase: "failed", hash, receipt, error: "Transaction was mined but reverted on-chain." });
        return undefined;
      }
      setState({ phase: "confirmed", hash, receipt });
      return receipt;
    } catch (e) {
      setState({ phase: "failed", hash, error: friendlyError(e) });
      return undefined;
    }
  }, []);

  const reset = useCallback(() => setState({ phase: "idle" }), []);
  return { state, run, reset };
}
