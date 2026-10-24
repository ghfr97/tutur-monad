"use client";

import Link from "next/link";
import { useReadContract, useReadContracts } from "wagmi";
import { factoryAbi, taskAbi } from "@/lib/abi";
import {
  getFactoryAddress,
  getFactoryAddressError,
  shortenAddress,
} from "@/lib/chain";
import { formatEther, type Address } from "viem";

const statusLabels = ["Terbuka", "Menunggu validasi", "Dibayar", "Ditolak", "Direfund"];

function TaskCard({ address }: { address: Address }) {
  const { data: status } = useReadContract({
    address,
    abi: taskAbi,
    functionName: "status",
    query: { refetchInterval: 15_000 },
  });
  const { data: reward } = useReadContract({
    address,
    abi: taskAbi,
    functionName: "rewardAmount",
    query: { refetchInterval: 15_000 },
  });
  const { data: deadline } = useReadContract({
    address,
    abi: taskAbi,
    functionName: "deadline",
    query: { refetchInterval: 15_000 },
  });
  const { data: sponsor } = useReadContract({
    address,
    abi: taskAbi,
    functionName: "sponsor",
    query: { refetchInterval: 15_000 },
  });

  return (
    <Link className="task-row" href={`/tasks/${address}`}>
      <div>
        <p className="eyebrow">{shortenAddress(address)}</p>
        <h3>{status === undefined ? "Memuat status..." : statusLabels[Number(status)]}</h3>
        <p className="muted">
          Sponsor {sponsor ? shortenAddress(sponsor) : "—"}
        </p>
      </div>
      <div className="task-row-end">
        <strong>{reward === undefined ? "—" : `${formatEther(reward)} MON`}</strong>
        <span className="muted">
          {deadline
            ? `Batas ${new Date(Number(deadline) * 1000).toLocaleDateString("id-ID")}`
            : " "}
        </span>
      </div>
    </Link>
  );
}

export function TaskList() {
  const factoryAddress = getFactoryAddress();
  const factoryAddressError = getFactoryAddressError();
  const {
    data: taskCount,
    isLoading,
    error,
  } = useReadContract({
    address: factoryAddress,
    abi: factoryAbi,
    functionName: "getTaskCount",
    query: {
      enabled: Boolean(factoryAddress),
      refetchInterval: 15_000,
    },
  });

  const visibleCount = taskCount ? Number(taskCount > 50n ? 50n : taskCount) : 0;
  const { data: taskResults, isLoading: isLoadingTasks } = useReadContracts({
    contracts: Array.from({ length: visibleCount }, (_, index) => ({
      address: factoryAddress as Address,
      abi: factoryAbi,
      functionName: "taskAt" as const,
      args: [BigInt(index)] as const,
    })),
    query: { enabled: Boolean(factoryAddress && taskCount !== undefined) },
  });

  if (!factoryAddress) {
    return (
      <div className="notice">
        <strong>{factoryAddressError ?? "Factory belum dikonfigurasi."}</strong>
        <p>
          Isi <code>NEXT_PUBLIC_TUTUR_FACTORY_ADDRESS</code> dengan alamat
          deployment Monad Testnet sebelum membaca task.
        </p>
      </div>
    );
  }
  if (isLoading || isLoadingTasks) return <p className="muted">Memuat task on-chain...</p>;
  if (error) return <p className="inline-error">Gagal membaca factory: {error.message}</p>;

  const tasks =
    taskResults
      ?.filter((result) => result.status === "success")
      .map((result) => result.result)
      .filter((address): address is Address => typeof address === "string") ?? [];

  if (!tasks.length) {
    return (
      <div className="empty-state">
        <p>Belum ada task yang tercatat pada factory ini.</p>
        <p className="muted">
          Alamat kontrak task dan status akan dibaca dari Monad Testnet.
        </p>
      </div>
    );
  }

  return (
    <div className="task-list">
      {tasks.map((address) => (
        <TaskCard address={address} key={address} />
      ))}
      {taskCount && taskCount > 50n && (
        <p className="muted">Menampilkan 50 dari {taskCount.toString()} task.</p>
      )}
    </div>
  );
}
