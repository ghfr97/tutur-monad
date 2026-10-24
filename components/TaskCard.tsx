"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AddressLink, Mon, StatusPill } from "./ui";
import { getMetadata, type StoredTaskMetadata } from "@/lib/metadata-store";
import type { OnChainTask } from "@/lib/tasks";

export function TaskCard({ t }: { t: OnChainTask }) {
  const [meta, setMeta] = useState<StoredTaskMetadata>();
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMeta(getMetadata(t.metadataHash));
  }, [t.metadataHash]);
  return (
    <article className="card p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">{meta?.title ?? "Metadata unavailable on this device"}</h3>
          <p className="mt-1 text-sm text-soft">
            {meta ? (
              <>
                {meta.sourceLanguage} → {meta.targetLanguage} · {meta.registerOrDialect}
              </>
            ) : (
              <>On-chain state is shown below; title and prompt are stored off-chain in another browser.</>
            )}
          </p>
        </div>
        <StatusPill status={t.status} />
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
        <div><dt className="label">Reward</dt><dd><Mon v={t.rewardAmount} /></dd></div>
        <div><dt className="label">Fee</dt><dd><Mon v={t.feeAmount} /></dd></div>
        <div><dt className="label">Deadline</dt><dd>{new Date(t.deadline * 1000).toLocaleString()}</dd></div>
        <div><dt className="label">Sponsor</dt><dd><AddressLink a={t.sponsor} /></dd></div>
      </dl>
      <div className="mt-3 flex items-center justify-between text-sm">
        <AddressLink a={t.address} label={`Escrow ${t.address.slice(0, 8)}…`} />
        <Link className="btn" href={`/tasks/${t.address}`}>View task</Link>
      </div>
    </article>
  );
}
