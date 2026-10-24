"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import {
  formatEther,
  isAddress,
  parseEther,
  parseEventLogs,
  type Address,
  type Hex,
} from "viem";
import {
  useAccount,
  usePublicClient,
  useReadContract,
  useWriteContract,
} from "wagmi";
import { factoryAbi } from "@/lib/abi";
import {
  explorerTransactionUrl,
  getFactoryAddress,
  getFactoryAddressError,
  MONAD_TESTNET_ID,
} from "@/lib/chain";
import { hashTaskMetadata } from "@/lib/hash";
import { saveTaskMetadata, type TaskMetadata } from "@/lib/metadata-store";
import { useRpcCooldown } from "@/hooks/use-rpc-cooldown";
import { getTransactionErrorInfo } from "@/lib/transaction-error";

const TERMS_VERSION = "tutur-terms-v1";
const FEE_DENOMINATOR = 10_000n;

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Terjadi kesalahan yang tidak diketahui.";
}

export default function NewTaskPage() {
  const { address: account, chainId } = useAccount();
  const factoryAddress = getFactoryAddress();
  const factoryAddressError = getFactoryAddressError();
  const publicClient = usePublicClient({ chainId: MONAD_TESTNET_ID });
  const [title, setTitle] = useState("");
  const [prompt, setPrompt] = useState("");
  const [usageTerms, setUsageTerms] = useState("");
  const [sourceLanguage, setSourceLanguage] = useState("Bahasa Indonesia");
  const [targetLanguage, setTargetLanguage] = useState("");
  const [registerOrDialect, setRegisterOrDialect] = useState("");
  const [rewardInput, setRewardInput] = useState("");
  const [deadlineInput, setDeadlineInput] = useState("");
  const [formError, setFormError] = useState("");
  const [storageError, setStorageError] = useState("");
  const [createdTaskAddress, setCreatedTaskAddress] = useState<Address>();
  const [transactionHash, setTransactionHash] = useState<Hex>();
  const [isConfirming, setIsConfirming] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState<
    "pending" | "confirmed" | "failed" | "unknown"
  >();
  const { secondsRemaining, startCooldown } = useRpcCooldown();
  const { data: feeBps } = useReadContract({
    address: factoryAddress,
    abi: factoryAbi,
    functionName: "feeBps",
    query: { enabled: Boolean(factoryAddress) },
  });
  const { isPending, writeContractAsync, error: writeError } = useWriteContract();

  const reward = (() => {
    try {
      return rewardInput ? parseEther(rewardInput) : 0n;
    } catch {
      return 0n;
    }
  })();
  const fee =
    feeBps && reward > 0n
      ? (reward * BigInt(feeBps)) / FEE_DENOMINATOR
      : 0n;
  const total = reward + fee;
  const feeRate = feeBps ? `${Number(feeBps) / 100}%` : "—";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    setStorageError("");
    setCreatedTaskAddress(undefined);
    setTransactionHash(undefined);
    setIsConfirming(false);
    setTransactionStatus(undefined);

    if (!factoryAddress) {
      return setFormError(
        factoryAddressError ?? "Alamat factory belum dikonfigurasi.",
      );
    }
    if (!account) return setFormError("Hubungkan wallet untuk membuat task.");
    if (chainId !== MONAD_TESTNET_ID) {
      return setFormError("Pindah ke Monad Testnet sebelum mengirim transaksi.");
    }
    if (!feeBps || fee <= 0n) {
      return setFormError("Reward terlalu kecil atau konfigurasi fee tidak tersedia.");
    }
    if (
      !title.trim() ||
      !prompt.trim() ||
      !usageTerms.trim() ||
      !targetLanguage.trim()
    ) {
      return setFormError("Lengkapi judul, prompt, ketentuan penggunaan, dan bahasa target.");
    }
    const deadlineMilliseconds = Date.parse(deadlineInput);
    if (
      !deadlineInput ||
      !Number.isFinite(deadlineMilliseconds) ||
      deadlineMilliseconds / 1000 <= Date.now() / 1000 + 3600
    ) {
      return setFormError("Deadline harus lebih dari satu jam dari sekarang.");
    }
    if (!publicClient) return setFormError("RPC Monad Testnet belum siap.");

    const createdAt = new Date().toISOString();
    const metadata = {
      title: title.trim(),
      prompt: prompt.trim(),
      usageTerms: usageTerms.trim(),
      sourceLanguage: sourceLanguage.trim(),
      targetLanguage: targetLanguage.trim(),
      registerOrDialect: registerOrDialect.trim(),
      usageTermsVersion: TERMS_VERSION,
      createdAt,
    };
    const metadataHash = hashTaskMetadata(metadata);
    const deadline = BigInt(Math.floor(deadlineMilliseconds / 1000));

    try {
      const estimatedGas = await publicClient.estimateContractGas({
        account,
        address: factoryAddress,
        abi: factoryAbi,
        functionName: "createTask",
        args: [metadataHash, reward, deadline],
        value: total,
      });
      const gas = estimatedGas + estimatedGas / 10n;
      const hash = await writeContractAsync({
        account,
        address: factoryAddress,
        abi: factoryAbi,
        functionName: "createTask",
        args: [metadataHash, reward, deadline],
        value: total,
        gas,
        chainId: MONAD_TESTNET_ID,
      });
      setTransactionHash(hash);
      setTransactionStatus("pending");
      setIsConfirming(true);
      let receiptReturned = false;
      try {
        const confirmedReceipt = await publicClient.waitForTransactionReceipt({ hash });
        receiptReturned = true;
        if (confirmedReceipt.status !== "success") {
          setTransactionStatus("failed");
          throw new Error("Receipt transaksi create task berstatus revert.");
        }
        setTransactionStatus("confirmed");
        const taskEvent = parseEventLogs({
          abi: factoryAbi,
          logs: confirmedReceipt.logs,
          eventName: "TaskCreated",
        })[0];
        if (!taskEvent) {
          throw new Error("Receipt sukses, tetapi event TaskCreated tidak ditemukan.");
        }
        try {
          const savedMetadata: TaskMetadata = {
            ...metadata,
            taskAddress: taskEvent.args.taskAddress,
          };
          saveTaskMetadata(savedMetadata);
          setCreatedTaskAddress(taskEvent.args.taskAddress);
        } catch (error) {
          setStorageError(
            `Transaksi telah terkonfirmasi, tetapi metadata lokal tidak tersimpan: ${errorMessage(error)}`,
          );
        }
      } catch (error) {
        if (!receiptReturned) setTransactionStatus("unknown");
        throw error;
      } finally {
        setIsConfirming(false);
      }
    } catch (error) {
      setIsConfirming(false);
      const transactionError = getTransactionErrorInfo(error);
      if (transactionError.rateLimited) startCooldown();
      setFormError(transactionError.message);
    }
  }

  return (
    <main className="page-shell narrow-shell">
      <Link className="back-link" href="/">
        ← Kembali ke daftar task
      </Link>
      <div className="page-heading">
        <p className="eyebrow">BUAT BOUNTY</p>
        <h1>Mulai dari satu contoh bahasa.</h1>
        <p className="muted">
          Isi konteks tugas. Detail disimpan pada perangkat ini; kontrak hanya
          menerima hash metadata dan escrow.
        </p>
      </div>

      {!factoryAddress && (
        <div className="notice">
          {factoryAddressError ?? (
            <>
              Factory belum dikonfigurasi. Isi{" "}
              <code>NEXT_PUBLIC_TUTUR_FACTORY_ADDRESS</code> setelah deployment.
            </>
          )}
        </div>
      )}
      <form className="form-card" onSubmit={handleSubmit}>
        <label>
          Judul tugas
          <input
            maxLength={100}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Contoh: Terjemahkan sapaan singkat"
            required
            value={title}
          />
        </label>
        <label>
          Prompt / teks sumber
          <textarea
            maxLength={2000}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="Gunakan kalimat contoh yang netral dan tidak sensitif."
            required
            rows={4}
            value={prompt}
          />
        </label>
        <label>
          Ketentuan penggunaan
          <textarea
            maxLength={1200}
            onChange={(event) => setUsageTerms(event.target.value)}
            placeholder="Jelaskan tujuan penggunaan kontribusi dan batasannya dengan bahasa yang mudah dipahami."
            required
            rows={3}
            value={usageTerms}
          />
        </label>
        <div className="form-grid">
          <label>
            Bahasa sumber
            <input
              onChange={(event) => setSourceLanguage(event.target.value)}
              required
              value={sourceLanguage}
            />
          </label>
          <label>
            Bahasa target
            <input
              onChange={(event) => setTargetLanguage(event.target.value)}
              placeholder="Contoh: Jawa"
              required
              value={targetLanguage}
            />
          </label>
        </div>
        <label>
          Register / dialek (opsional)
          <input
            onChange={(event) => setRegisterOrDialect(event.target.value)}
            placeholder="Contoh: ngoko alus"
            value={registerOrDialect}
          />
        </label>
        <div className="form-grid">
          <label>
            Reward (MON)
            <input
              inputMode="decimal"
              min="0"
              onChange={(event) => setRewardInput(event.target.value)}
              placeholder="1.0"
              required
              step="any"
              type="number"
              value={rewardInput}
            />
          </label>
          <label>
            Deadline
            <input
              onChange={(event) => setDeadlineInput(event.target.value)}
              required
              type="datetime-local"
              value={deadlineInput}
            />
          </label>
        </div>

        <div className="cost-summary">
          <div><span>Fee layanan ({feeRate})</span><strong>{formatEther(fee)} MON</strong></div>
          <div className="cost-total"><span>Total escrow</span><strong>{formatEther(total)} MON</strong></div>
        </div>
        <p className="fine-print">
          Jika diterima, reward dibayar ke kontributor dan fee ke treasury. Jika
          ditolak atau kedaluwarsa, seluruh escrow dikembalikan ke sponsor.
        </p>

        {(formError || writeError) && (
          <p className="inline-error">
            {formError || writeError?.message}
          </p>
        )}
        {storageError && <p className="notice">{storageError}</p>}
        {transactionHash && (
          <div className="transaction-state">
            <span>
              {isConfirming
                ? "Transaksi menunggu konfirmasi..."
                : transactionStatus === "confirmed"
                  ? "Receipt transaksi sukses."
                  : transactionStatus === "failed"
                    ? "Receipt transaksi revert."
                    : "Receipt belum dapat dipastikan."}
            </span>
            <a href={explorerTransactionUrl(transactionHash)} rel="noreferrer" target="_blank">
              Lihat di explorer ↗
            </a>
          </div>
        )}
        {createdTaskAddress && (
          <div className="success-box">
            <p>Task berhasil dibuat dan metadata tersimpan di browser ini.</p>
            <Link className="button button-dark" href={`/tasks/${createdTaskAddress}`}>
              Buka task
            </Link>
          </div>
        )}
        <button
          className="button button-dark button-wide"
          disabled={
            isPending ||
            isConfirming ||
            secondsRemaining > 0 ||
            !factoryAddress ||
            !account ||
            chainId !== MONAD_TESTNET_ID ||
            !feeBps ||
            !isAddress(account)
          }
          type="submit"
        >
          {isPending
            ? "Menunggu wallet..."
            : isConfirming
              ? "Menunggu receipt..."
              : secondsRemaining > 0
                ? `Coba lagi dalam ${secondsRemaining} dtk`
                : "Buat task"}
        </button>
      </form>
      <p className="fine-print page-footnote">
        Gunakan hanya contoh non-sensitif. Data dan persetujuan disimpan off-chain;
        checkbox dan ketentuan produk bukan pengganti tinjauan hukum.
      </p>
    </main>
  );
}
