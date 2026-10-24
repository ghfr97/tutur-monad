"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { isAddress, type Address, type Hash } from "viem";
import { AddressLink, Mon, StatusPill, TxLink, TxPanel, WalletGate } from "@/components/ui";
import { taskAbi } from "@/lib/abi";
import { addressUrl } from "@/lib/chain";
import { hashContribution, normalizeText } from "@/lib/hashing";
import {
  getContribution,
  getMetadata,
  saveContribution,
  type StoredContribution,
  type StoredTaskMetadata,
} from "@/lib/metadata-store";
import { isExpired, readTask, readVoteState, type OnChainTask } from "@/lib/tasks";
import { CONSENT_LABEL, USAGE_TERMS_TEXT, USAGE_TERMS_VERSION } from "@/lib/terms";
import { useTx } from "@/lib/useTx";
import { useWallet } from "@/lib/wallet";

export default function TaskDetail() {
  const params = useParams<{ address: string }>();
  const addr = params.address;
  const w = useWallet();
  const [task, setTask] = useState<OnChainTask>();
  const [err, setErr] = useState<string>();
  const [meta, setMeta] = useState<StoredTaskMetadata>();
  const [contrib, setContrib] = useState<StoredContribution>();
  const [vs, setVs] = useState({ isValidator: false, hasVoted: false });
  const [txs, setTxs] = useState<{ label: string; hash: Hash }[]>([]);

  const valid = isAddress(addr);

  const load = useCallback(async () => {
    if (!valid) return;
    try {
      const t = await readTask(addr as Address);
      setTask(t);
      setMeta(getMetadata(t.metadataHash));
      setContrib(getContribution(addr));
      setVs(await readVoteState(addr as Address, w.account));
      setErr(undefined);
    } catch {
      setErr("Could not read this address as a TUTUR task on Monad Testnet.");
    }
  }, [addr, valid, w.account]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const addTx = (label: string, hash?: Hash) => hash && setTxs((p) => [...p, { label, hash }]);

  if (!valid) return <p className="text-bad">Invalid task address.</p>;
  if (err) return <p className="text-bad" role="alert">{err}</p>;
  if (!task) return <p className="text-sm text-soft">Loading task from chain…</p>;

  const expired = isExpired(task);
  const isSponsor = w.account?.toLowerCase() === task.sponsor.toLowerCase();
  const canContribute = task.status === "Open" && !expired && !isSponsor;
  const canVote = task.status === "Submitted" && !expired && vs.isValidator && !vs.hasVoted;
  const canRefund = expired && (task.status === "Open" || task.status === "Submitted");

  return (
    <div className="space-y-6">
      <header>
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-3xl font-bold">{meta?.title ?? "Metadata unavailable on this device"}</h1>
          <StatusPill status={task.status} />
        </div>
        {meta ? (
          <p className="mt-1 text-sm text-soft">
            {meta.sourceLanguage} → {meta.targetLanguage} · {meta.registerOrDialect}
          </p>
        ) : (
          <p className="mt-1 text-sm text-soft">
            The title and prompt are stored off-chain (local storage of the creator’s browser). On-chain state below is real.
          </p>
        )}
      </header>

      {meta && (
        <section className="card p-4">
          <h2 className="label">Source prompt</h2>
          <p className="font-serif text-xl">{meta.prompt}</p>
        </section>
      )}

      <section className="card p-4">
        <h2 className="mb-3 text-lg font-semibold">Escrow</h2>
        <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
          <div><dt className="label">Task contract</dt><dd><AddressLink a={task.address} /></dd></div>
          <div><dt className="label">Sponsor</dt><dd><AddressLink a={task.sponsor} /></dd></div>
          <div><dt className="label">Treasury</dt><dd><AddressLink a={task.treasury} /></dd></div>
          <div><dt className="label">Reward</dt><dd><Mon v={task.rewardAmount} /></dd></div>
          <div><dt className="label">Fee</dt><dd><Mon v={task.feeAmount} /></dd></div>
          <div><dt className="label">Escrow balance</dt><dd><Mon v={task.balance} /></dd></div>
          <div><dt className="label">Deadline</dt><dd>{new Date(task.deadline * 1000).toLocaleString()}{expired ? " (passed)" : ""}</dd></div>
          <div><dt className="label">Votes</dt><dd>{task.approvals} approve · {task.rejections} reject</dd></div>
          <div><dt className="label">Contributor</dt><dd>{task.contributor === "0x0000000000000000000000000000000000000000" ? "—" : <AddressLink a={task.contributor} />}</dd></div>
        </dl>
        <p className="mt-3 text-xs text-soft">
          Contribution hash:{" "}
          <span className="mono break-all">
            {task.contributionHash === "0x0000000000000000000000000000000000000000000000000000000000000000" ? "none yet" : task.contributionHash}
          </span>
        </p>
        <p className="mt-1 text-xs">
          <a className="underline" href={addressUrl(task.address)} target="_blank" rel="noreferrer">View contract on explorer ↗</a>
        </p>
      </section>

      {task.status === "Paid" && (
        <p className="card border-ok p-3 text-sm">
          Accepted. The contract paid <Mon v={task.rewardAmount} /> to the contributor and <Mon v={task.feeAmount} /> to the treasury. Escrow balance: <Mon v={task.balance} />.
        </p>
      )}
      {(task.status === "Rejected" || task.status === "Refunded") && (
        <p className="card p-3 text-sm">
          {task.status === "Rejected" ? "Rejected by validators." : "Expired without a final decision."} The full escrow was returned to the sponsor. Escrow balance: <Mon v={task.balance} />.
        </p>
      )}

      {contrib && (
        <section className="card p-4">
          <h2 className="label">Contribution text (off-chain, this browser)</h2>
          <p className="font-serif text-xl">{contrib.contributionText}</p>
          <p className="mt-2 text-xs text-soft">
            Consent recorded {new Date(contrib.consentAt).toLocaleString()} · terms {contrib.consentVersion}
          </p>
        </section>
      )}
      {task.status === "Submitted" && !contrib && (
        <p className="card p-3 text-sm">
          A contribution hash is on-chain, but the contribution text is not available on this device (it is stored off-chain in the contributor’s browser).
        </p>
      )}

      {canContribute && (
        <ContributeForm task={task} onDone={(h) => { addTx("Submit contribution", h); load(); w.refreshBalance(); }} />
      )}
      {canVote && <VotePanel task={task} onDone={(l, h) => { addTx(l, h); load(); w.refreshBalance(); }} />}
      {task.status === "Submitted" && w.account && vs.isValidator && vs.hasVoted && (
        <p className="card p-3 text-sm">You already voted on this task.</p>
      )}
      {task.status === "Submitted" && w.account && !vs.isValidator && (
        <p className="card p-3 text-sm text-soft">Only the three configured validators can vote. This wallet is not one of them.</p>
      )}
      {canRefund && (
        <RefundPanel task={task} onDone={(h) => { addTx("Refund after deadline", h); load(); w.refreshBalance(); }} />
      )}

      {txs.length > 0 && (
        <section className="card p-4 text-sm">
          <h2 className="label">Transactions from this session</h2>
          <ul className="space-y-1">
            {txs.map((t) => (
              <li key={t.hash}>{t.label}: <TxLink hash={t.hash} /></li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function ContributeForm({ task, onDone }: { task: OnChainTask; onDone: (h?: Hash) => void }) {
  const w = useWallet();
  const { state, run } = useTx();
  const [text, setText] = useState("");
  const [agreed, setAgreed] = useState(false); // never pre-checked
  const [fe, setFe] = useState<string>();
  const normalized = normalizeText(text);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setFe(undefined);
    if (normalized.length < 1) return setFe("Enter your contribution.");
    if (!agreed) return setFe("You must accept the usage terms.");
    const client = w.getWalletClient();
    if (!client) return setFe("Connect your wallet first.");
    const contentHash = hashContribution(text);
    const receipt = await run(() =>
      client.writeContract({
        address: task.address,
        abi: taskAbi,
        functionName: "submitContribution",
        args: [contentHash, true],
        account: w.account!,
        chain: client.chain,
      }),
    );
    if (receipt) {
      saveContribution({
        taskAddress: task.address,
        contentHash,
        contributionText: normalized,
        contributorWallet: w.account!,
        consentAt: new Date().toISOString(),
        consentVersion: USAGE_TERMS_VERSION,
      });
      onDone(receipt.transactionHash);
    }
  }

  return (
    <form onSubmit={submit} className="card space-y-3 p-4">
      <h2 className="text-lg font-semibold">Submit a contribution</h2>
      <div>
        <label className="label" htmlFor="contrib">Your text</label>
        <textarea id="contrib" className="field min-h-24" value={text} onChange={(e) => setText(e.target.value)} maxLength={1000} />
        <p className="mt-1 text-xs text-soft">
          Only a keccak256 hash of the normalized text goes on-chain. Normalization: NFC, trim, collapse whitespace.
        </p>
      </div>
      <div className="rounded border border-rule bg-paper2 p-3 text-xs text-soft">
        <strong className="text-ink">Usage terms ({USAGE_TERMS_VERSION})</strong>
        <ul className="mt-1 list-disc space-y-1 pl-4">
          {USAGE_TERMS_TEXT.map((t) => <li key={t}>{t}</li>)}
        </ul>
      </div>
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" className="mt-1" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
        <span>{CONSENT_LABEL}</span>
      </label>
      {fe && <p className="text-sm text-bad" role="alert">{fe}</p>}
      <WalletGate>
        <button className="btn btn-accent" type="submit" disabled={state.phase === "wallet" || state.phase === "pending"}>
          Submit contribution hash
        </button>
      </WalletGate>
      <TxPanel
        state={state}
        success={<span className="mono break-all">Hash: {text ? hashContribution(text) : ""} · status: pending review</span>}
      />
    </form>
  );
}

function VotePanel({ task, onDone }: { task: OnChainTask; onDone: (label: string, h?: Hash) => void }) {
  const w = useWallet();
  const { state, run } = useTx();
  async function vote(approve: boolean) {
    const client = w.getWalletClient();
    if (!client) return;
    const receipt = await run(() =>
      client.writeContract({
        address: task.address,
        abi: taskAbi,
        functionName: "vote",
        args: [approve],
        account: w.account!,
        chain: client.chain,
      }),
    );
    if (receipt) onDone(approve ? "Vote: approve" : "Vote: reject", receipt.transactionHash);
  }
  const busy = state.phase === "wallet" || state.phase === "pending";
  return (
    <section className="card p-4">
      <h2 className="text-lg font-semibold">Validator review</h2>
      <p className="mt-1 text-sm text-soft">Review the contribution off-chain, then vote once. Two matching votes finalize the task.</p>
      <div className="mt-3 flex gap-3">
        <WalletGate>
          <button className="btn btn-accent" disabled={busy} onClick={() => vote(true)}>Approve</button>
          <button className="btn" disabled={busy} onClick={() => vote(false)}>Reject</button>
        </WalletGate>
      </div>
      <TxPanel state={state} />
    </section>
  );
}

function RefundPanel({ task, onDone }: { task: OnChainTask; onDone: (h?: Hash) => void }) {
  const w = useWallet();
  const { state, run } = useTx();
  async function refund() {
    const client = w.getWalletClient();
    if (!client) return;
    const receipt = await run(() =>
      client.writeContract({
        address: task.address,
        abi: taskAbi,
        functionName: "refundAfterDeadline",
        account: w.account!,
        chain: client.chain,
      }),
    );
    if (receipt) onDone(receipt.transactionHash);
  }
  return (
    <section className="card p-4">
      <h2 className="text-lg font-semibold">Deadline passed</h2>
      <p className="mt-1 text-sm text-soft">No final decision was reached. Anyone can trigger the refund; funds always go to the sponsor.</p>
      <div className="mt-3">
        <WalletGate>
          <button className="btn btn-accent" disabled={state.phase === "wallet" || state.phase === "pending"} onClick={refund}>
            Refund sponsor
          </button>
        </WalletGate>
      </div>
      <TxPanel state={state} />
    </section>
  );
}
