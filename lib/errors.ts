/** Turn wallet/RPC/revert errors into short, user-readable messages. */
const REVERTS: Record<string, string> = {
  NotOpen: "This task is no longer open for contributions.",
  NotSubmitted: "There is no pending contribution to vote on.",
  DeadlinePassed: "The deadline has passed.",
  DeadlineNotPassed: "The deadline has not passed yet.",
  ZeroHash: "Contribution hash cannot be empty.",
  SponsorCannotContribute: "The sponsor cannot contribute to their own task.",
  TermsNotAccepted: "You must accept the usage terms.",
  NotValidator: "This wallet is not a configured validator.",
  AlreadyVoted: "This validator has already voted.",
  AlreadyFinal: "This task is already finalized.",
  TransferFailed: "A payout transfer failed, so the whole transaction was reverted.",
  WrongPayment: "Sent amount must equal reward + fee exactly.",
  ZeroFee: "Reward is too small: the fee would round to zero.",
  InvalidDeadline: "Deadline must be at least 5 minutes in the future.",
};

export function friendlyError(e: unknown): string {
  const err = e as { name?: string; shortMessage?: string; message?: string; code?: number; cause?: unknown };
  const msg = `${err?.shortMessage ?? ""} ${err?.message ?? ""}`;
  if (err?.code === 4001 || /user rejected|User denied|rejected the request/i.test(msg)) {
    return "You rejected the request in your wallet.";
  }
  if (/insufficient funds|exceeds the balance/i.test(msg)) {
    return "Insufficient MON balance for this transaction (including gas).";
  }
  for (const [k, v] of Object.entries(REVERTS)) if (msg.includes(k)) return v;
  if (/chain|network/i.test(msg) && /mismatch|switch|wrong/i.test(msg)) {
    return "Wrong network. Switch your wallet to Monad Testnet.";
  }
  return (err?.shortMessage ?? "Transaction failed.").slice(0, 200);
}
