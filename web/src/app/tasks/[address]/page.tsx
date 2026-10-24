import { Suspense } from "react";
import TaskDetailPage from "./task-detail";

async function TaskContent({
  params,
}: {
  params: Promise<{ address: string }>;
}) {
  const { address } = await params;
  return <TaskDetailPage address={address} />;
}

export default function TaskPage({
  params,
}: {
  params: Promise<{ address: string }>;
}) {
  return (
    <Suspense fallback={<main className="page-shell">Memuat detail task...</main>}>
      <TaskContent params={params} />
    </Suspense>
  );
}
