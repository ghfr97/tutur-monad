"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { TaskCard } from "@/components/TaskCard";
import { FACTORY_ADDRESS, addressUrl } from "@/lib/chain";
import { listTasks, type OnChainTask } from "@/lib/tasks";

export default function Home() {
  const [recent, setRecent] = useState<OnChainTask[]>();
  useEffect(() => {
    listTasks(3).then(setRecent).catch(() => setRecent([]));
  }, []);

  return (
    <div className="space-y-14">
      <section className="pt-6">
        <p className="label">Monad Blitz Jogja · hackathon prototype</p>
        <h1 className="max-w-3xl text-5xl font-bold leading-tight">
          Every contribution counts. Every verified voice gets rewarded.
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-soft">
          TUTUR turns local-language data collection into verifiable micro-bounties. Sponsors fund a small task, contributors
          submit text, three validators review it, and a smart contract pays for accepted work.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link className="btn btn-accent" href="/tasks">Browse tasks</Link>
          <Link className="btn" href="/tasks/new">Fund a task</Link>
        </div>
        <p className="mt-4 text-xs text-soft">
          Runs on Monad Testnet with test MON only.{" "}
          {FACTORY_ADDRESS ? (
            <>Factory: <a className="mono underline" href={addressUrl(FACTORY_ADDRESS)} target="_blank" rel="noreferrer">{FACTORY_ADDRESS}</a></>
          ) : (
            "Factory contract not configured yet."
          )}
        </p>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div>
          <h2 className="text-2xl font-semibold">The problem</h2>
          <p className="mt-2 text-soft">
            AI builders and researchers need reliable language data for translation, speech and evaluation. Collecting it well means
            clear tasks, contributor consent, quality review and transparent pay. Regional languages and registers are easy to overlook.
          </p>
        </div>
        <div>
          <h2 className="text-2xl font-semibold">Why independent escrows</h2>
          <p className="mt-2 text-soft">
            Each task is its own contract with its own balance and votes. Unrelated tasks never touch a shared payout queue, an
            architectural fit for Monad’s optimistic parallel execution. It is a design choice, not a guarantee of parallelism.
          </p>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-2xl font-semibold">How it works</h2>
        <ol className="grid gap-4 md:grid-cols-3">
          {[
            ["1 · Fund", "A sponsor locks reward + 8% fee in MON inside a dedicated task escrow."],
            ["2 · Contribute & review", "A contributor submits text (only its hash goes on-chain) and accepts the usage terms. Three validators vote; two matching votes decide."],
            ["3 · Settle", "Accepted: reward to contributor, fee to treasury. Rejected or expired: full refund to the sponsor."],
          ].map(([t, d]) => (
            <li key={t} className="card p-4">
              <h3 className="text-lg font-semibold">{t}</h3>
              <p className="mt-1 text-sm text-soft">{d}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="card p-5">
        <h2 className="text-2xl font-semibold">Revenue model (hypothesis)</h2>
        <p className="mt-2 text-sm text-soft">
          An 8% service fee on accepted work, enforced in the contract. Example: a 1 MON reward needs 1.08 MON funded; on acceptance
          1 MON goes to the contributor and 0.08 MON to the treasury. This is an illustrative testnet example, not validated pricing or revenue.
        </p>
      </section>

      <section>
        <h2 className="mb-4 text-2xl font-semibold">Latest on-chain tasks</h2>
        {!FACTORY_ADDRESS && <p className="text-sm text-soft">Nothing to show until the factory address is configured.</p>}
        {FACTORY_ADDRESS && recent === undefined && <p className="text-sm text-soft">Loading from chain…</p>}
        {FACTORY_ADDRESS && recent?.length === 0 && <p className="text-sm text-soft">No tasks have been created yet.</p>}
        <div className="grid gap-4">{recent?.map((t) => <TaskCard key={t.address} t={t} />)}</div>
      </section>
    </div>
  );
}
