"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useState,
  useSyncExternalStore,
  type FormEvent,
} from "react";
import {
  formatEther,
  isAddress,
  type Address,
  type Hex,
} from "viem";
import {
  useAccount,
  usePublicClient,
  useReadContract,
  useWriteContract,
} from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import { taskAbi } from "@/lib/abi";
import {
  explorerAddressUrl,
  explorerTransactionUrl,
  MONAD_TESTNET_ID,
  shortenAddress,
} from "@/lib/chain";
import { hashContribution, hashTaskMetadata } from "@/lib/hash";
import { useRpcCooldown } from "@/hooks/use-rpc-cooldown";
import { getTransactionErrorInfo } from "@/lib/transaction-error";
import {
  getMetadataSnapshot,
  saveContributionMetadata,
  subscribeToMetadata,
  type ContributionMetadata,
  type TaskMetadata,
} from "@/lib/metadata-store";

const statusLabels = [
  "Terbuka",
  "Menunggu validasi",
  "Dibayar",
  "Ditolak",
  "Direfund",
];

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : "Terjadi kesalahan yang tidak diketahui.";
}

function contributionMatchesHash(
  metadata: ContributionMetadata | undefined,
  onChainHash: Hex | undefined,
): boolean {
  if (!metadata || !onChainHash) return false;
  try {
    return hashContribution(metadata.contributionText) === onChainHash;
  } catch {
    return false;
  }
}

export default function TaskDetailPage({ address }: { address: string }) {
  const taskAddress = isAddress(address) ? (address as Address) : undefined;
  const { address: account, chainId } = useAccount();
  const publicClient = usePublicClient({ chainId: MONAD_TESTNET_ID });
  const queryClient = useQueryClient();
  const [contributionText, setContributionText] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [actionError, setActionError] = useState("");
  const [actionLabel, setActionLabel] = useState("");
  const [transactionHash, setTransactionHash] = useState<Hex>();
  const [isConfirming, setIsConfirming] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState<
    "pending" | "confirmed" | "failed" | "unknown"
  >();
  const { secondsRemaining, startCooldown } = useRpcCooldown();
  const [metadataError, setMetadataError] = useState("");
  const [nowSeconds, setNowSeconds] = useState(0);

  const readOptions = { address: taskAddress, abi: taskAbi } as const;
  const { data: status, error: statusError } = useReadContract({
    ...readOptions,
    functionName: "status",
    query: { enabled: Boolean(taskAddress), refetchInterval: 12_000 },
  });
  const taskReadable = Boolean(taskAddress && status !== undefined);
  const { data: sponsor } = useReadContract({
    ...readOptions,
    functionName: "sponsor",
    query: { enabled: taskReadable },
  });
  const { data: treasury } = useReadContract({
    ...readOptions,
    functionName: "treasury",
    query: { enabled: taskReadable },
  });
  const { data: validator1 } = useReadContract({
    ...readOptions,
    functionName: "validator1",
    query: { enabled: taskReadable },
  });
  const { data: validator2 } = useReadContract({
    ...readOptions,
    functionName: "validator2",
    query: { enabled: taskReadable },
  });
  const { data: validator3 } = useReadContract({
    ...readOptions,
    functionName: "validator3",
    query: { enabled: taskReadable },
  });
  const { data: reward } = useReadContract({
    ...readOptions,
    functionName: "rewardAmount",
    query: { enabled: taskReadable },
  });
  const { data: fee } = useReadContract({
    ...readOptions,
    functionName: "feeAmount",
    query: { enabled: taskReadable },
  });
  const { data: deadline } = useReadContract({
    ...readOptions,
    functionName: "deadline",
    query: { enabled: taskReadable, refetchInterval: 12_000 },
  });
  const { data: metadataHash } = useReadContract({
    ...readOptions,
    functionName: "metadataHash",
    query: { enabled: taskReadable },
  });
  const { data: contributor } = useReadContract({
    ...readOptions,
    functionName: "contributor",
    query: { enabled: taskReadable, refetchInterval: 12_000 },
  });
  const { data: contentHash } = useReadContract({
    ...readOptions,
    functionName: "contributionHash",
    query: { enabled: taskReadable, refetchInterval: 12_000 },
  });
  const { data: approvals } = useReadContract({
    ...readOptions,
    functionName: "approvals",
    query: { enabled: taskReadable, refetchInterval: 12_000 },
  });
  const { data: rejections } = useReadContract({
    ...readOptions,
    functionName: "rejections",
    query: { enabled: taskReadable, refetchInterval: 12_000 },
  });
  const { data: hasVoted } = useReadContract({
    ...readOptions,
    functionName: "hasVoted",
    args: [account ?? "0x0000000000000000000000000000000000000000"],
    query: { enabled: Boolean(taskReadable && account), refetchInterval: 12_000 },
  });

  const { isPending, writeContractAsync } = useWriteContract();
  const subscribe = useCallback(
    (onChange: () => void) =>
      taskAddress ? subscribeToMetadata(taskAddress, onChange) : () => {},
    [taskAddress],
  );
  const getSnapshot = useCallback(
    () => (taskAddress ? getMetadataSnapshot(taskAddress) : ""),
    [taskAddress],
  );
  const metadataSnapshot = useSyncExternalStore(subscribe, getSnapshot, () => "");
  const parsedSnapshot = (() => {
    try {
      return metadataSnapshot
        ? (JSON.parse(metadataSnapshot) as {
            task?: TaskMetadata | null;
            contribution?: ContributionMetadata | null;
            error?: string;
          })
        : {};
    } catch {
      return { error: "Metadata lokal tidak dapat dibaca." };
    }
  })();
  const taskMetadata = parsedSnapshot.task ?? undefined;
  const contributionMetadata = parsedSnapshot.contribution ?? undefined;
  const effectiveMetadataError = metadataError || parsedSnapshot.error || "";

  useEffect(() => {
    const initialSync = window.setTimeout(
      () => setNowSeconds(Math.floor(Date.now() / 1000)),
      0,
    );
    const timer = window.setInterval(
      () => setNowSeconds(Math.floor(Date.now() / 1000)),
      15_000,
    );
    return () => {
      window.clearTimeout(initialSync);
      window.clearInterval(timer);
    };
  }, []);

  const currentStatus = status === undefined ? -1 : Number(status);
  const deadlinePassed = deadline !== undefined && nowSeconds > Number(deadline);
  const configuredValidators = [validator1, validator2, validator3].filter(
    (value): value is Address => Boolean(value),
  );
  const isValidator =
    account !== undefined &&
    configuredValidators.some(
      (validator) => validator.toLowerCase() === account.toLowerCase(),
    );
  const canVote =
    currentStatus === 1 &&
    !deadlinePassed &&
    isValidator &&
    hasVoted === false &&
    chainId === MONAD_TESTNET_ID;
  const canRefund =
    (currentStatus === 0 || currentStatus === 1) &&
    deadlinePassed &&
    chainId === MONAD_TESTNET_ID;
  const metadataMatches =
    taskMetadata !== undefined &&
    metadataHash !== undefined &&
    hashTaskMetadata({
      title: taskMetadata.title,
      prompt: taskMetadata.prompt,
      usageTerms: taskMetadata.usageTerms,
      sourceLanguage: taskMetadata.sourceLanguage,
      targetLanguage: taskMetadata.targetLanguage,
      registerOrDialect: taskMetadata.registerOrDialect,
      usageTermsVersion: taskMetadata.usageTermsVersion,
      createdAt: taskMetadata.createdAt,
    }) === metadataHash;
  const contributionMatches = contributionMatchesHash(
    contributionMetadata,
    contentHash,
  );

  async function submitContribution(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setActionError("");
    setTransactionHash(undefined);
    setTransactionStatus(undefined);
    if (!taskAddress || !account || !publicClient) {
      return setActionError("Hubungkan wallet dan pastikan RPC tersedia.");
    }
    if (chainId !== MONAD_TESTNET_ID) {
      return setActionError("Pindah ke Monad Testnet sebelum submit.");
    }
    if (currentStatus !== 0 || deadlinePassed) {
      return setActionError("Task tidak lagi menerima kontribusi.");
    }
    if (sponsor?.toLowerCase() === account.toLowerCase()) {
      return setActionError("Sponsor tidak dapat menjadi kontributor task ini.");
    }
    if (!agreedToTerms) return setActionError("Persetujuan terms wajib dicentang.");

    try {
      const normalizedText = contributionText.normalize("NFC").replace(/\r\n?/g, "\n").trim();
      const contentDigest = hashContribution(normalizedText);
      const metadata: ContributionMetadata = {
        contributionText: normalizedText,
        contributorWallet: account,
        consentAt: new Date().toISOString(),
        consentVersion: taskMetadata?.usageTermsVersion ?? "tutur-terms-v1",
        contentHash: contentDigest,
      };
      const estimatedGas = await publicClient.estimateContractGas({
        account,
        address: taskAddress,
        abi: taskAbi,
        functionName: "submitContribution",
        args: [contentDigest, true],
      });
      setActionLabel("Submit kontribusi");
      const transaction = await writeContractAsync({
        account,
        address: taskAddress,
        abi: taskAbi,
        functionName: "submitContribution",
        args: [contentDigest, true],
        gas: estimatedGas + estimatedGas / 10n,
        chainId: MONAD_TESTNET_ID,
      });
      await confirmTransaction(transaction, "submit", metadata);
    } catch (error) {
      reportActionError(error);
    }
  }

  async function castVote(approve: boolean) {
    setActionError("");
    setTransactionHash(undefined);
    setTransactionStatus(undefined);
    if (!taskAddress || !account || !publicClient) {
      return setActionError("Hubungkan wallet dan pastikan RPC tersedia.");
    }
    if (chainId !== MONAD_TESTNET_ID) {
      return setActionError("Pindah ke Monad Testnet sebelum vote.");
    }
    if (!contributionMatches) {
      return setActionError("Teks kontribusi tidak tersedia atau hash-nya tidak cocok.");
    }
    try {
      const estimatedGas = await publicClient.estimateContractGas({
        account,
        address: taskAddress,
        abi: taskAbi,
        functionName: "vote",
        args: [approve],
      });
      setActionLabel(approve ? "Vote approve" : "Vote reject");
      const transaction = await writeContractAsync({
        account,
        address: taskAddress,
        abi: taskAbi,
        functionName: "vote",
        args: [approve],
        gas: estimatedGas + estimatedGas / 10n,
        chainId: MONAD_TESTNET_ID,
      });
      await confirmTransaction(transaction, "vote");
    } catch (error) {
      reportActionError(error);
    }
  }

  async function refundTask() {
    setActionError("");
    setTransactionHash(undefined);
    setTransactionStatus(undefined);
    if (!taskAddress || !account || !publicClient) {
      return setActionError("Hubungkan wallet dan pastikan RPC tersedia.");
    }
    if (chainId !== MONAD_TESTNET_ID) {
      return setActionError("Pindah ke Monad Testnet sebelum refund.");
    }
    try {
      const estimatedGas = await publicClient.estimateContractGas({
        account,
        address: taskAddress,
        abi: taskAbi,
        functionName: "refundAfterDeadline",
      });
      setActionLabel("Refund task");
      const transaction = await writeContractAsync({
        account,
        address: taskAddress,
        abi: taskAbi,
        functionName: "refundAfterDeadline",
        gas: estimatedGas + estimatedGas / 10n,
        chainId: MONAD_TESTNET_ID,
      });
      await confirmTransaction(transaction, "refund");
    } catch (error) {
      reportActionError(error);
    }
  }

  function reportActionError(error: unknown) {
    const transactionError = getTransactionErrorInfo(error);
    if (transactionError.rateLimited) startCooldown();
    setActionError(transactionError.message);
  }

  async function confirmTransaction(
    hash: Hex,
    kind: "submit" | "vote" | "refund",
    metadata?: ContributionMetadata,
  ) {
    if (!publicClient || !taskAddress) {
      throw new Error("RPC atau alamat task tidak tersedia untuk menunggu receipt.");
    }
    setTransactionHash(hash);
    setTransactionStatus("pending");
    setIsConfirming(true);
    let receiptReturned = false;
    try {
      const confirmedReceipt = await publicClient.waitForTransactionReceipt({ hash });
      receiptReturned = true;
      if (confirmedReceipt.status !== "success") {
        setTransactionStatus("failed");
        throw new Error("Receipt transaksi berstatus revert; perubahan tidak dikonfirmasi.");
      }
      setTransactionStatus("confirmed");
      await queryClient.invalidateQueries();
      if (kind === "submit" && metadata) {
        try {
          saveContributionMetadata(taskAddress, metadata);
        } catch (error) {
          setMetadataError(
            `Transaksi kontribusi terkonfirmasi, tetapi metadata lokal tidak tersimpan: ${describeError(error)}`,
          );
        }
      }
    } catch (error) {
      if (!receiptReturned) setTransactionStatus("unknown");
      throw error;
    } finally {
      setIsConfirming(false);
    }
  }

  if (!taskAddress) {
    return (
      <main className="page-shell">
        <p className="inline-error">Alamat task tidak valid.</p>
        <Link className="back-link" href="/">← Kembali ke task</Link>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <Link className="back-link" href="/">← Daftar task</Link>
      <section className="task-detail-header">
        <div>
          <p className="eyebrow">TASK ESCROW</p>
          <h1>{metadataMatches ? taskMetadata.title : "Metadata tidak tersedia"}</h1>
          <p className="muted">{shortenAddress(taskAddress)}</p>
        </div>
        <span className="status-pill">
          {statusError
            ? "Status tidak tersedia"
            : currentStatus < 0
              ? "Memuat status..."
              : statusLabels[currentStatus] ?? "Status tidak dikenal"}
        </span>
      </section>

      <div className="detail-layout">
        <section className="detail-main">
          <article className="panel">
            <h2>Ringkasan task</h2>
            {metadataMatches ? (
              <>
                <p className="task-prompt">{taskMetadata.prompt}</p>
                <p className="usage-terms">
                  <strong>Ketentuan penggunaan</strong>
                  <span>{taskMetadata.usageTerms}</span>
                </p>
                <dl className="detail-list">
                  <div><dt>Bahasa</dt><dd>{taskMetadata.sourceLanguage} → {taskMetadata.targetLanguage}</dd></div>
                  <div><dt>Register / dialek</dt><dd>{taskMetadata.registerOrDialect || "Tidak ditentukan"}</dd></div>
                  <div><dt>Terms</dt><dd>{taskMetadata.usageTermsVersion}</dd></div>
                </dl>
              </>
            ) : (
              <p className="notice">
                Metadata task tidak tersedia pada perangkat ini atau hash-nya tidak cocok.
                Informasi escrow tetap dibaca dari chain.
              </p>
            )}
            {effectiveMetadataError && <p className="inline-error">{effectiveMetadataError}</p>}
            <dl className="detail-list">
              <div><dt>Sponsor</dt><dd>{sponsor ? shortenAddress(sponsor) : "—"}</dd></div>
              <div><dt>Reward</dt><dd>{reward === undefined ? "—" : `${formatEther(reward)} MON`}</dd></div>
              <div><dt>Fee layanan</dt><dd>{fee === undefined ? "—" : `${formatEther(fee)} MON`}</dd></div>
              <div>
                <dt>Deadline</dt>
                <dd>{deadline ? new Date(Number(deadline) * 1000).toLocaleString("id-ID") : "—"}</dd>
              </div>
              <div><dt>Approvals / rejections</dt><dd>{approvals?.toString() ?? "—"} / {rejections?.toString() ?? "—"}</dd></div>
              <div><dt>Treasury</dt><dd>{treasury ? shortenAddress(treasury) : "—"}</dd></div>
            </dl>
            <div className="link-row">
              <a href={explorerAddressUrl(taskAddress)} rel="noreferrer" target="_blank">
                Buka escrow di explorer ↗
              </a>
              {sponsor && <a href={explorerAddressUrl(sponsor)} rel="noreferrer" target="_blank">Sponsor ↗</a>}
            </div>
          </article>

          <article className="panel">
            <h2>Kontribusi</h2>
            {statusError ? (
              <p className="notice">
                Status on-chain belum dapat dibaca; kontribusi tidak dapat dipastikan.
              </p>
            ) : currentStatus < 0 ? (
              <p className="muted">Memuat status kontribusi dari chain...</p>
            ) : contributor && contributor !== "0x0000000000000000000000000000000000000000" ? (
              <>
                <p className="muted">Kontributor {shortenAddress(contributor)}</p>
                <p className="hash-value">Hash: {contentHash ?? "—"}</p>
                {contributionMatches ? (
                  <div className="contribution-copy">
                    {contributionMetadata?.contributionText}
                  </div>
                ) : (
                  <p className="notice">
                    Teks kontribusi tidak tersedia di browser ini atau tidak cocok dengan hash
                    on-chain. Isi teks tidak disimpan pada kontrak.
                  </p>
                )}
              </>
            ) : currentStatus === 0 && metadataMatches ? (
              <form className="stack-form" onSubmit={submitContribution}>
                {metadataMatches && (
                  <div className="usage-terms">
                    <strong>Ketentuan penggunaan</strong>
                    <span>{taskMetadata.usageTerms}</span>
                    <small>
                      Persetujuan produk ini bukan pengganti perjanjian hukum. Jangan kirim
                      informasi pribadi atau sensitif.
                    </small>
                  </div>
                )}
                <label>
                  Teks kontribusi
                  <textarea
                    maxLength={4000}
                    onChange={(event) => setContributionText(event.target.value)}
                    placeholder="Gunakan contoh non-sensitif."
                    required
                    rows={4}
                    value={contributionText}
                  />
                </label>
                <label className="consent-row">
                  <input
                    checked={agreedToTerms}
                    onChange={(event) => setAgreedToTerms(event.target.checked)}
                    type="checkbox"
                  />
                  <span>
                    Saya berhak mengirim kontribusi ini dan menyetujui ketentuan penggunaan
                    yang ditampilkan untuk task ini.
                  </span>
                </label>
                <button
                  className="button button-dark"
                  disabled={
                    !account ||
                    !agreedToTerms ||
                    !contributionText.trim() ||
                    isPending ||
                    isConfirming ||
                    secondsRemaining > 0 ||
                    chainId !== MONAD_TESTNET_ID ||
                    sponsor?.toLowerCase() === account?.toLowerCase() ||
                    deadlinePassed
                  }
                  type="submit"
                >
                  {isPending
                    ? "Menunggu wallet..."
                    : secondsRemaining > 0
                      ? `Coba lagi dalam ${secondsRemaining} dtk`
                      : "Kirim hash kontribusi"}
                </button>
              </form>
            ) : (
              <p className="muted">Belum ada kontribusi yang tercatat.</p>
            )}
            {currentStatus === 0 && !metadataMatches && (
              <p className="notice">
                Kontribusi dinonaktifkan karena prompt dan ketentuan penggunaan tidak tersedia
                pada perangkat ini.
              </p>
            )}
            {sponsor?.toLowerCase() === account?.toLowerCase() && currentStatus === 0 && (
              <p className="fine-print">Sponsor tidak dapat mengirim kontribusi ke task sendiri.</p>
            )}
          </article>

          <article className="panel">
            <h2>Validasi</h2>
            <p className="muted">Dua vote yang sama menyelesaikan task. Setiap validator hanya dapat vote satu kali.</p>
            <dl className="detail-list">
              {configuredValidators.map((validator, index) => (
                <div key={validator}><dt>Validator {index + 1}</dt><dd>{shortenAddress(validator)}</dd></div>
              ))}
            </dl>
            {currentStatus === 1 && !contributionMatches && (
              <p className="notice">
                Isi kontribusi tidak tersedia atau hash lokalnya tidak cocok. Vote dinonaktifkan
                sampai validator dapat memeriksa teks yang sesuai.
              </p>
            )}
            {isValidator && hasVoted && <p className="notice">Wallet ini sudah memberikan vote.</p>}
            {isValidator && hasVoted === false && currentStatus === 1 && (
              <div className="button-row">
                <button
                  className="button button-dark"
                  disabled={
                    !canVote ||
                    !contributionMatches ||
                    isPending ||
                    isConfirming ||
                    secondsRemaining > 0
                  }
                  onClick={() => void castVote(true)}
                  type="button"
                >
                  Setujui
                </button>
                <button
                  className="button button-outline"
                  disabled={
                    !canVote ||
                    !contributionMatches ||
                    isPending ||
                    isConfirming ||
                    secondsRemaining > 0
                  }
                  onClick={() => void castVote(false)}
                  type="button"
                >
                  Tolak
                </button>
              </div>
            )}
            {account && !isValidator && currentStatus === 1 && (
              <p className="fine-print">Wallet terhubung bukan salah satu validator task ini.</p>
            )}
            {deadlinePassed && currentStatus === 1 && (
              <p className="notice">Deadline lewat; voting ditutup dan refund dapat dipicu.</p>
            )}
          </article>
        </section>

        <aside className="detail-aside">
          <article className="panel">
            <p className="eyebrow">ESCROW</p>
            <strong className="large-value">{reward === undefined ? "—" : formatEther(reward)} MON</strong>
            <p className="muted">Reward kontributor</p>
            <p className="aside-line"><span>Fee</span><strong>{fee === undefined ? "—" : `${formatEther(fee)} MON`}</strong></p>
            <p className="aside-line"><span>Status</span><strong>{currentStatus < 0 ? "—" : statusLabels[currentStatus]}</strong></p>
            {canRefund && (
              <button
                className="button button-outline button-wide"
                disabled={isPending || isConfirming || secondsRemaining > 0}
                onClick={() => void refundTask()}
                type="button"
              >
                {secondsRemaining > 0
                  ? `Coba lagi dalam ${secondsRemaining} dtk`
                  : "Refund escrow"}
              </button>
            )}
            {currentStatus === 0 && !deadlinePassed && (
              <p className="fine-print">Task menerima satu kontribusi sampai deadline.</p>
            )}
          </article>
        </aside>
      </div>

      {actionError && (
        <p className="inline-error action-message">
          {actionError}
        </p>
      )}
      {transactionHash && (
        <div className="transaction-state action-message">
          <span>
            {isConfirming
              ? `${actionLabel}: menunggu konfirmasi receipt...`
              : transactionStatus === "confirmed"
                ? `${actionLabel}: receipt sukses.`
                : transactionStatus === "failed"
                  ? `${actionLabel}: receipt revert.`
                  : `${actionLabel}: receipt belum dapat dipastikan.`}
          </span>
          <a href={explorerTransactionUrl(transactionHash)} rel="noreferrer" target="_blank">
            Lihat transaksi ↗
          </a>
        </div>
      )}
      {statusError && <p className="inline-error action-message">Gagal membaca status on-chain: {statusError.message}</p>}
    </main>
  );
}
