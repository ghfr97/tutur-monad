"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { addressUrl, shorten, txUrl } from "@/lib/chain";
import { useWallet } from "@/lib/wallet";
import type { TxState } from "@/lib/useTx";
import type { StatusName } from "@/lib/tasks";
import { monadTestnet } from "@/lib/chain";
import { formatEther } from "viem";

export function Mon({ v }: { v: bigint }) {
  return <span>{formatEther(v)} MON</span>;
}

const STATUS_STYLE: Record<StatusName, string> = {
  Open: "border-accent text-accent",
  Submitted: "border-warn text-warn",
  Paid: "border-ok text-ok",
  Rejected: "border-bad text-bad",
  Refunded: "border-soft text-soft",
};
export function StatusPill({ status }: { status: StatusName }) {
  return (
    <span className={`inline-block rounded-sm border px-2 py-0.5 text-xs font-semibold uppercase tracking-wider ${STATUS_STYLE[status]}`}>
      {status}
    </span>
  );
}

export function AddressLink({ a, label }: { a: string; label?: string }) {
  return (
    <a className="mono underline decoration-rule underline-offset-2 hover:decoration-accent" href={addressUrl(a)} target="_blank" rel="noreferrer">
      {label ?? shorten(a)}
    </a>
  );
}
export function TxLink({ hash }: { hash: string }) {
  return (
    <a className="mono underline decoration-rule underline-offset-2 hover:decoration-accent" href={txUrl(hash)} target="_blank" rel="noreferrer">
      {shorten(hash, 8)} ↗
    </a>
  );
}

export function TxPanel({ state, success }: { state: TxState; success?: ReactNode }) {
  if (state.phase === "idle") return null;
  const base = "mt-3 rounded border p-3 text-sm";
  if (state.phase === "wallet") return <div className={`${base} border-rule bg-paper2`}>Waiting for wallet confirmation…</div>;
  if (state.phase === "pending")
    return (
      <div className={`${base} border-warn`}>
        Transaction submitted, waiting for on-chain confirmation… {state.hash && <TxLink hash={state.hash} />}
      </div>
    );
  if (state.phase === "confirmed")
    return (
      <div className={`${base} border-ok`}>
        <strong className="text-ok">Confirmed on Monad Testnet.</strong> {state.hash && <TxLink hash={state.hash} />}
        {success && <div className="mt-2">{success}</div>}
      </div>
    );
  return (
    <div className={`${base} border-bad`} role="alert">
      <strong className="text-bad">Failed.</strong> {state.error} {state.hash && <TxLink hash={state.hash} />}
    </div>
  );
}

/** Wallet connect / network guard used above any action form. */
export function WalletGate({ children }: { children: ReactNode }) {
  const w = useWallet();
  if (!w.hasProvider)
    return <div className="card p-4 text-sm">No browser wallet detected. Install MetaMask (or a compatible wallet) to interact.</div>;
  if (!w.account)
    return (
      <div className="card flex items-center justify-between gap-4 p-4 text-sm">
        <span>Connect a burner wallet to continue.</span>
        <button className="btn btn-accent" onClick={w.connect}>Connect wallet</button>
      </div>
    );
  if (w.wrongNetwork)
    return (
      <div className="card flex items-center justify-between gap-4 border-bad p-4 text-sm">
        <span>Wrong network. TUTUR runs on {monadTestnet.name} (chain {monadTestnet.id}).</span>
        <button className="btn btn-accent" onClick={w.switchNetwork}>Switch network</button>
      </div>
    );
  return <>{children}</>;
}

export function Nav() {
  const w = useWallet();
  const link = "px-2 py-1 text-sm hover:text-accent";
  return (
    <header className="border-b border-rule">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="font-serif text-2xl font-bold tracking-tight">
          TUTUR<span className="text-accent">.</span>
        </Link>
        <nav className="flex flex-wrap items-center gap-1">
          <Link className={link} href="/tasks">Tasks</Link>
          <Link className={link} href="/tasks/new">Create task</Link>
          <Link className={link} href="/about">About</Link>
          <span className="ml-2 rounded-sm border border-warn px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-warn">
            Monad Testnet · test MON only
          </span>
          {w.account ? (
            <span className="mono ml-2 rounded border border-rule px-2 py-1">{shorten(w.account)}</span>
          ) : (
            <button className="btn ml-2" onClick={w.connect}>Connect</button>
          )}
        </nav>
      </div>
      {w.error && <div className="mx-auto max-w-5xl px-4 pb-2 text-sm text-bad" role="alert">{w.error}</div>}
    </header>
  );
}

export function NoFactory() {
  return (
    <div className="card border-warn p-4 text-sm">
      <strong>Factory address not configured.</strong> Deploy <span className="mono">TuturFactory</span> to Monad Testnet and set{" "}
      <span className="mono">NEXT_PUBLIC_TUTUR_FACTORY_ADDRESS</span> in <span className="mono">.env.local</span> (see README).
      No tasks can be shown until then; nothing here is simulated.
    </div>
  );
}
