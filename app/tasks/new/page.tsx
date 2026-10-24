"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { formatEther, parseEther, parseEventLogs, type Address } from "viem";
import { AddressLink, Mon, NoFactory, TxPanel, WalletGate } from "@/components/ui";
import { factoryAbi } from "@/lib/abi";
import { FACTORY_ADDRESS, publicClient } from "@/lib/chain";
import { hashMetadata } from "@/lib/hashing";
import { saveMetadata } from "@/lib/metadata-store";
import { USAGE_TERMS_VERSION } from "@/lib/terms";
import { useTx } from "@/lib/useTx";
import { useWallet } from "@/lib/wallet";
import { friendlyError } from "@/lib/errors";

const MIN_MINUTES = 10; // UI minimum; contract enforces >= 5 minutes

function defaultDeadline() {
  const d = new Date(Date.now() + 24 * 3600 * 1000);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

export default function NewTaskPage() {
  const w = useWallet();
  const { state, run } = useTx();
  const [feeBps, setFeeBps] = useState<number>();
  const [f, setF] = useState({
    title: "",
    prompt: "",
    sourceLanguage: "Indonesian",
    targetLanguage: "Javanese",
    registerOrDialect: "Ngoko",
    reward: "1",
    deadline: defaultDeadline(),
  });
  const [created, setCreated] = useState<{ task: Address; reward: bigint; fee: bigint } | undefined>();
  const [formError, setFormError] = useState<string>();

  useEffect(() => {
    if (!FACTORY_ADDRESS) return;
    publicClient
      .readContract({ address: FACTORY_ADDRESS, abi: factoryAbi, functionName: "feeBps" })
      .then((v) => setFeeBps(Number(v)))
      .catch(() => setFeeBps(undefined));
  }, []);

  const calc = useMemo(() => {
    try {
      if (!f.reward || Number(f.reward) <= 0) return undefined;
      const reward = parseEther(f.reward);
      if (reward <= BigInt(0) || feeBps === undefined) return undefined;
      const fee = (reward * BigInt(feeBps)) / BigInt(10000); // identical rounding to the contract
      return { reward, fee, total: reward + fee };
    } catch {
      return undefined;
    }
  }, [f.reward, feeBps]);

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setF((p) => ({ ...p, [k]: e.target.value }));

  function validate(): string | undefined {
    if (f.title.trim().length < 3) return "Title must be at least 3 characters.";
    if (f.prompt.trim().length < 5) return "Source prompt must be at least 5 characters.";
    if (!f.sourceLanguage.trim() || !f.targetLanguage.trim() || !f.registerOrDialect.trim())
      return "Languages and register/dialect are required.";
    if (!calc) return "Enter a valid reward greater than zero.";
    if (calc.fee === BigInt(0)) return "Reward is too small: the fee would round to zero.";
    const dl = new Date(f.deadline).getTime();
    if (!dl || dl < Date.now() + MIN_MINUTES * 60_000) return `Deadline must be at least ${MIN_MINUTES} minutes from now.`;
    if (w.balance !== undefined && calc.total > w.balance) return "Insufficient MON balance for reward + fee (plus gas).";
    return undefined;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(undefined);
    setCreated(undefined);
    const err = validate();
    if (err) return setFormError(err);
    const client = w.getWalletClient();
    if (!client || !FACTORY_ADDRESS || !calc) return setFormError("Wallet or factory not ready.");

    const meta = {
      title: f.title,
      prompt: f.prompt,
      sourceLanguage: f.sourceLanguage,
      targetLanguage: f.targetLanguage,
      registerOrDialect: f.registerOrDialect,
      usageTermsVersion: USAGE_TERMS_VERSION,
    };
    const metadataHash = hashMetadata(meta);
    const deadline = BigInt(Math.floor(new Date(f.deadline).getTime() / 1000));

    const receipt = await run(() =>
      client.writeContract({
        address: FACTORY_ADDRESS!,
        abi: factoryAbi,
        functionName: "createTask",
        args: [metadataHash, calc.reward, deadline],
        value: calc.total,
        account: w.account!,
        chain: client.chain,
      }),
    );
    if (!receipt) return;
    try {
      const logs = parseEventLogs({ abi: factoryAbi, logs: receipt.logs, eventName: "TaskCreated" });
      const log = logs[0];
      if (!log) throw new Error("TaskCreated event not found in receipt");
      const task = log.args.taskAddress as Address;
      saveMetadata({ ...meta, metadataHash, createdAt: new Date().toISOString(), taskAddress: task });
      setCreated({ task, reward: log.args.rewardAmount as bigint, fee: log.args.feeAmount as bigint });
      w.refreshBalance();
    } catch (e2) {
      setFormError(`Task was created on-chain, but the receipt could not be parsed: ${friendlyError(e2)}`);
    }
  }

  return (
    <div className="grid gap-8 md:grid-cols-[1fr_300px]">
      <div>
        <h1 className="text-3xl font-bold">Create a bounty</h1>
        <p className="mt-1 text-sm text-soft">Funds are locked in a dedicated escrow contract for this single task.</p>
        {!FACTORY_ADDRESS && <div className="mt-4"><NoFactory /></div>}
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label className="label" htmlFor="title">Task title</label>
            <input id="title" className="field" value={f.title} onChange={set("title")} maxLength={120} placeholder="Translate a neutral greeting into Javanese" />
          </div>
          <div>
            <label className="label" htmlFor="prompt">Source prompt</label>
            <textarea id="prompt" className="field min-h-24" value={f.prompt} onChange={set("prompt")} maxLength={500} placeholder="Selamat pagi, apa kabar hari ini?" />
            <p className="mt-1 text-xs text-soft">Use neutral, non-sensitive sentences only.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div><label className="label" htmlFor="src">Source language</label><input id="src" className="field" value={f.sourceLanguage} onChange={set("sourceLanguage")} /></div>
            <div><label className="label" htmlFor="tgt">Target language</label><input id="tgt" className="field" value={f.targetLanguage} onChange={set("targetLanguage")} /></div>
            <div><label className="label" htmlFor="reg">Register / dialect</label><input id="reg" className="field" value={f.registerOrDialect} onChange={set("registerOrDialect")} /></div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="reward">Reward (MON)</label>
              <input id="reward" className="field" inputMode="decimal" value={f.reward} onChange={set("reward")} />
            </div>
            <div>
              <label className="label" htmlFor="deadline">Deadline</label>
              <input id="deadline" type="datetime-local" className="field" value={f.deadline} onChange={set("deadline")} />
            </div>
          </div>
          {formError && <p className="text-sm text-bad" role="alert">{formError}</p>}
          <WalletGate>
            <button
              className="btn btn-accent w-full"
              type="submit"
              disabled={!FACTORY_ADDRESS || state.phase === "wallet" || state.phase === "pending"}
            >
              {calc ? `Fund task with ${formatEther(calc.total)} MON` : "Fund task"}
            </button>
          </WalletGate>
          <TxPanel state={state} />
        </form>

        {created && (
          <section className="card mt-6 border-ok p-4 text-sm">
            <h2 className="text-lg font-semibold">Task created</h2>
            <dl className="mt-2 grid gap-1">
              <div>Escrow: <AddressLink a={created.task} label={created.task} /></div>
              <div>Sponsor: <AddressLink a={w.account!} label={w.account!} /></div>
              <div>Reward: <Mon v={created.reward} /> · Fee: <Mon v={created.fee} /></div>
              <div>Status: Open</div>
            </dl>
            <Link className="btn mt-3" href={`/tasks/${created.task}`}>Open task</Link>
          </section>
        )}
      </div>

      <aside className="card h-fit p-4 text-sm">
        <h2 className="text-lg font-semibold">Payment summary</h2>
        <p className="mt-1 text-xs text-soft">
          Fee rate is read from the factory contract{feeBps !== undefined ? `: ${feeBps / 100}%` : " (unavailable until deployed)"}.
        </p>
        <dl className="mt-3 space-y-2">
          <div className="flex justify-between"><dt>Contributor reward</dt><dd>{calc ? formatEther(calc.reward) : "—"} MON</dd></div>
          <div className="flex justify-between"><dt>Platform fee</dt><dd>{calc ? formatEther(calc.fee) : "—"} MON</dd></div>
          <div className="flex justify-between border-t border-rule pt-2 font-semibold"><dt>Total to lock</dt><dd>{calc ? formatEther(calc.total) : "—"} MON</dd></div>
        </dl>
        <p className="mt-3 text-xs text-soft">
          Accepted: reward → contributor, fee → treasury. Rejected or expired: the full amount returns to you.
        </p>
      </aside>
    </div>
  );
}
