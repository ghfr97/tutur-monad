"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { TaskCard } from "@/components/TaskCard";
import { NoFactory } from "@/components/ui";
import { FACTORY_ADDRESS } from "@/lib/chain";
import { listTasks, type OnChainTask } from "@/lib/tasks";
import { useLanguage } from "@/lib/i18n-context";

export default function TasksPage() {
  const { t } = useLanguage();
  const [tasks, setTasks] = useState<OnChainTask[]>();
  const [error, setError] = useState<string>();

  const load = useCallback(async () => {
    setError(undefined);
    try {
      setTasks(await listTasks());
    } catch {
      setError(t.tasksPage.error);
      setTasks([]);
    }
  }, [t.tasksPage.error]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{t.tasksPage.title}</h1>
          <p className="mt-1 text-sm text-soft">{t.tasksPage.subtitle}</p>
        </div>
        <div className="flex gap-2">
          <button className="btn" onClick={load}>{t.tasksPage.refresh}</button>
          <Link className="btn btn-accent" href="/tasks/new">{t.tasksPage.createBtn}</Link>
        </div>
      </div>
      {!FACTORY_ADDRESS && <NoFactory />}
      {FACTORY_ADDRESS && tasks === undefined && <p className="text-sm text-soft">{t.tasksPage.loading}</p>}
      {error && <p className="text-sm text-bad" role="alert">{error}</p>}
      {FACTORY_ADDRESS && tasks?.length === 0 && !error && (
        <div className="card p-6 text-sm">{t.tasksPage.empty}</div>
      )}
      <div className="grid gap-4">{tasks?.map((item) => <TaskCard key={item.address} t={item} />)}</div>
    </div>
  );
}

