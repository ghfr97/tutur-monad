import type { Address, Hex } from "viem";
import { factoryAbi, taskAbi } from "./abi";
import { FACTORY_ADDRESS, publicClient } from "./chain";

export const STATUS = ["Open", "Submitted", "Paid", "Rejected", "Refunded"] as const;
export type StatusName = (typeof STATUS)[number];

export interface OnChainTask {
  address: Address;
  sponsor: Address;
  treasury: Address;
  rewardAmount: bigint;
  feeAmount: bigint;
  deadline: number;
  metadataHash: Hex;
  contributor: Address;
  contributionHash: Hex;
  status: StatusName;
  approvals: number;
  rejections: number;
  balance: bigint;
}

const ZERO = "0x0000000000000000000000000000000000000000";

export async function readTask(address: Address): Promise<OnChainTask> {
  const r = <T extends string>(fn: T) =>
    publicClient.readContract({ address, abi: taskAbi, functionName: fn as never }) as Promise<never>;
  const [sponsor, treasury, rewardAmount, feeAmount, deadline, metadataHash, contributor, contributionHash, status, approvals, rejections, balance] =
    await Promise.all([
      r("sponsor"),
      r("treasury"),
      r("rewardAmount"),
      r("feeAmount"),
      r("deadline"),
      r("metadataHash"),
      r("contributor"),
      r("contributionHash"),
      r("status"),
      r("approvals"),
      r("rejections"),
      publicClient.getBalance({ address }),
    ]);
  return {
    address,
    sponsor,
    treasury,
    rewardAmount,
    feeAmount,
    deadline: Number(deadline),
    metadataHash,
    contributor,
    contributionHash,
    status: STATUS[Number(status)] ?? "Open",
    approvals: Number(approvals),
    rejections: Number(rejections),
    balance,
  } as OnChainTask;
}

export async function readVoteState(task: Address, account?: Address) {
  const [isValidator, hasVoted] = account
    ? await Promise.all([
        publicClient.readContract({ address: task, abi: taskAbi, functionName: "isValidator", args: [account] }),
        publicClient.readContract({ address: task, abi: taskAbi, functionName: "hasVoted", args: [account] }),
      ])
    : [false, false];
  return { isValidator, hasVoted };
}

/** Newest first, up to `limit` tasks. */
export async function listTasks(limit = 30): Promise<OnChainTask[]> {
  if (!FACTORY_ADDRESS) return [];
  const count = Number(
    await publicClient.readContract({ address: FACTORY_ADDRESS, abi: factoryAbi, functionName: "getTaskCount" }),
  );
  const idx = Array.from({ length: Math.min(count, limit) }, (_, i) => count - 1 - i);
  const addrs = await Promise.all(
    idx.map((i) =>
      publicClient.readContract({ address: FACTORY_ADDRESS!, abi: factoryAbi, functionName: "taskAt", args: [BigInt(i)] }),
    ),
  );
  return Promise.all(addrs.map((a) => readTask(a as Address)));
}

export const hasContribution = (t: OnChainTask) => t.contributor !== ZERO;
export const isExpired = (t: OnChainTask) => Date.now() / 1000 > t.deadline;
