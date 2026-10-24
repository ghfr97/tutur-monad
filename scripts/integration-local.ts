// Local-only integration test: needs `anvil` running on :8545 and `forge build` done. Uses Anvil unlocked accounts (no keys).
import { createPublicClient, createWalletClient, http, parseEther, parseEventLogs, defineChain, type Address } from "viem";
import fs from "node:fs";
import { factoryAbi, taskAbi } from "../lib/abi";
import { hashContribution, hashMetadata } from "../lib/hashing";
(async () => {

const chain = defineChain({ id: 31337, name: "anvil", nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 }, rpcUrls: { default: { http: ["http://127.0.0.1:8545"] } } });
const pc = createPublicClient({ chain, transport: http() });
const accs = (await pc.request({ method: "eth_accounts" })) as Address[];
const [deployer, treasury, v1, v2, v3, sponsor, contributor] = accs;
const wc = (a: Address) => createWalletClient({ account: a, chain, transport: http() });
const bytecode = JSON.parse(fs.readFileSync("contracts/out/TuturFactory.sol/TuturFactory.json", "utf8")).bytecode.object;
const ok = (c: boolean, m: string) => { if (!c) throw new Error("FAIL " + m); console.log("PASS", m); };

let h = await wc(deployer).deployContract({ abi: factoryAbi, bytecode, args: [treasury, v1, v2, v3, 800] });
const factory = (await pc.waitForTransactionReceipt({ hash: h })).contractAddress!;
const feeBps = await pc.readContract({ address: factory, abi: factoryAbi, functionName: "feeBps" });
ok(feeBps === 800, "feeBps read = 800");

async function create(reward: bigint, offset: number) {
  const fee = (reward * BigInt(feeBps)) / 10000n;
  const block = await pc.getBlock();
  const meta = hashMetadata({ title: "t" + offset, prompt: "Selamat pagi", sourceLanguage: "Indonesian", targetLanguage: "Javanese", registerOrDialect: "Ngoko", usageTermsVersion: "v0" });
  const hash = await wc(sponsor).writeContract({ address: factory, abi: factoryAbi, functionName: "createTask", args: [meta, reward, block.timestamp + BigInt(offset)], value: reward + fee });
  const r = await pc.waitForTransactionReceipt({ hash });
  const log = parseEventLogs({ abi: factoryAbi, logs: r.logs, eventName: "TaskCreated" })[0];
  return { task: log.args.taskAddress as Address, fee, reward };
}
const bal = (a: Address) => pc.getBalance({ address: a });
const send = async (a: Address, task: Address, fn: any, args: any[] = []) => {
  const hash = await wc(a).writeContract({ address: task, abi: taskAbi, functionName: fn, args } as any);
  const r = await pc.waitForTransactionReceipt({ hash }); return r;
};

// Flow: approve path
const A = await create(parseEther("1"), 86400);
ok(A.fee === parseEther("0.08"), "fee = 0.08 for 1 MON");
ok((await bal(A.task)) === parseEther("1.08"), "escrow holds reward+fee");
const text = "  Sugeng   enjing,\nkados pundi? ";
await send(contributor, A.task, "submitContribution", [hashContribution(text), true]);
ok((await pc.readContract({ address: A.task, abi: taskAbi, functionName: "contributionHash" })) === hashContribution("Sugeng enjing, kados pundi?"), "normalized hash matches on-chain hash");
const cb = await bal(contributor), tb = await bal(treasury);
await send(v1, A.task, "vote", [true]);
await send(v2, A.task, "vote", [true]);
ok((await pc.readContract({ address: A.task, abi: taskAbi, functionName: "status" })) === 2, "status Paid");
ok((await bal(contributor)) - cb === parseEther("1"), "contributor +1 MON");
ok((await bal(treasury)) - tb === parseEther("0.08"), "treasury +0.08 MON");
ok((await bal(A.task)) === 0n, "escrow empty");

// Flow: reject path
const B = await create(parseEther("2"), 86400);
await send(contributor, B.task, "submitContribution", [hashContribution("x"), true]);
const sb = await bal(sponsor);
await send(v1, B.task, "vote", [false]); await send(v3, B.task, "vote", [false]);
ok((await bal(sponsor)) - sb === parseEther("2.16"), "sponsor refunded full 2.16");

// Flow: expiry path (anyone triggers; funds go to sponsor)
const C = await create(parseEther("1"), 600);
await pc.request({ method: "evm_increaseTime" as any, params: [601] as any });
await pc.request({ method: "evm_mine" as any, params: [] as any });
const sb2 = await bal(sponsor);
await send(treasury, C.task, "refundAfterDeadline");
ok((await bal(sponsor)) - sb2 === parseEther("1.08"), "expired task refunded to sponsor by third party");

// Unauthorized + double vote revert
const D = await create(parseEther("1"), 86400);
await send(contributor, D.task, "submitContribution", [hashContribution("y"), true]);
const revertedTx = async (a: Address, task: Address, approve: boolean) => { try { const hash = await wc(a).writeContract({ address: task, abi: taskAbi, functionName: "vote", args: [approve], gas: 200000n }); return (await pc.waitForTransactionReceipt({ hash })).status === "reverted"; } catch { return true; } };
  let reverted = await revertedTx(contributor, D.task, true);
ok(reverted, "non-validator vote rejected");
await send(v1, D.task, "vote", [true]);
reverted = await revertedTx(v1, D.task, true);
ok(reverted, "double vote rejected");
const count = await pc.readContract({ address: factory, abi: factoryAbi, functionName: "getTaskCount" });
ok(count === 4n, "factory lists 4 tasks");
console.log("ALL INTEGRATION CHECKS PASSED");

})().catch((e) => { console.error(e); process.exit(1); });
