"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { TaskCard } from "@/components/TaskCard";
import { NoFactory } from "@/components/ui";
import { FACTORY_ADDRESS } from "@/lib/chain";
import { listTasks, type OnChainTask } from "@/lib/tasks";

export default function TasksPage() {
  const [tasks, setTasks] = useState<OnChainTask[]>();
  const [error, setError] = useState<string>();

  const load = useCallback(async () => {
    setError(undefined);
    try {
      setTasks(await listTasks());
    } catch {
      setError("Could not read tasks from Monad Testnet RPC. Try again.");
      setTasks([]);
    }
  }, []);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  return (
    <div>
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold">Task marketplace</h1>
          <p className="mt-1 text-sm text-soft">Every row is read from the factory contract on Monad Testnet.</p>
        </div>
        <div className="flex gap-2">
          <button className="btn" onClick={load}>Refresh</button>
          <Link className="btn btn-accent" href="/tasks/new">Create task</Link>
        </div>
      </div>
      {!FACTORY_ADDRESS && <NoFactory />}
      {FACTORY_ADDRESS && tasks === undefined && <p className="text-sm text-soft">Loading tasks from chain…</p>}
      {error && <p className="text-sm text-bad" role="alert">{error}</p>}
      {FACTORY_ADDRESS && tasks?.length === 0 && !error && (
        <div className="card p-6 text-sm">No tasks exist on this factory yet. Create the first one.</div>
      )}
      <div className="grid gap-4">{tasks?.map((t) => <TaskCard key={t.address} t={t} />)}</div>
    </div>
  );
}
