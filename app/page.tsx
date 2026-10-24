"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { TaskCard } from "@/components/TaskCard";
import { FACTORY_ADDRESS, addressUrl } from "@/lib/chain";
import { listTasks, type OnChainTask } from "@/lib/tasks";
import { useLanguage } from "@/lib/i18n-context";

export default function Home() {
  const { t } = useLanguage();
  const [recent, setRecent] = useState<OnChainTask[]>();
  useEffect(() => {
    listTasks(3).then(setRecent).catch(() => setRecent([]));
  }, []);

  return (
    <div className="space-y-14">
      <section className="pt-6">
        <p className="label">{t.home.eyebrow}</p>
        <h1 className="max-w-3xl text-5xl font-bold leading-tight">
          {t.home.title}
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-soft">
          {t.home.description}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link className="btn btn-accent" href="/tasks">{t.home.browseBtn}</Link>
          <Link className="btn" href="/tasks/new">{t.home.fundBtn}</Link>
        </div>
        <p className="mt-4 text-xs text-soft">
          {t.home.runsOn}{" "}
          {FACTORY_ADDRESS ? (
            <>Factory: <a className="mono underline" href={addressUrl(FACTORY_ADDRESS)} target="_blank" rel="noreferrer">{FACTORY_ADDRESS}</a></>
          ) : (
            t.home.factoryNotSet
          )}
        </p>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div>
          <h2 className="text-2xl font-semibold">{t.home.problemTitle}</h2>
          <p className="mt-2 text-soft">
            {t.home.problemDesc}
          </p>
        </div>
        <div>
          <h2 className="text-2xl font-semibold">{t.home.escrowTitle}</h2>
          <p className="mt-2 text-soft">
            {t.home.escrowDesc}
          </p>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-2xl font-semibold">{t.home.howItWorksTitle}</h2>
        <ol className="grid gap-4 md:grid-cols-3">
          {[
            [t.home.step1Title, t.home.step1Desc],
            [t.home.step2Title, t.home.step2Desc],
            [t.home.step3Title, t.home.step3Desc],
          ].map(([heading, desc]) => (
            <li key={heading} className="card p-4">
              <h3 className="text-lg font-semibold">{heading}</h3>
              <p className="mt-1 text-sm text-soft">{desc}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="card p-5">
        <h2 className="text-2xl font-semibold">{t.home.revenueTitle}</h2>
        <p className="mt-2 text-sm text-soft">
          {t.home.revenueDesc}
        </p>
      </section>

      <section>
        <h2 className="mb-4 text-2xl font-semibold">{t.home.latestTasksTitle}</h2>
        {!FACTORY_ADDRESS && <p className="text-sm text-soft">{t.home.noTasksCreated}</p>}
        {FACTORY_ADDRESS && recent === undefined && <p className="text-sm text-soft">{t.home.loadingChain}</p>}
        {FACTORY_ADDRESS && recent?.length === 0 && <p className="text-sm text-soft">{t.home.noTasksCreated}</p>}
        <div className="grid gap-4">{recent?.map((task) => <TaskCard key={task.address} t={task} />)}</div>
      </section>
    </div>
  );
}
