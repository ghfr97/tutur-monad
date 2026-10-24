"use client";

import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { MONAD_TESTNET_ID, shortenAddress } from "@/lib/chain";

export function WalletControl() {
  const { address, chainId, isConnected } = useAccount();
  const { connect, connectors, isPending, error } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: isSwitching, error: switchError } =
    useSwitchChain();

  if (!isConnected) {
    return (
      <div className="wallet-control">
        <button
          className="button button-dark"
          disabled={isPending || connectors.length === 0}
          onClick={() => {
            const connector = connectors[0];
            if (connector) connect({ connector });
          }}
          type="button"
        >
          {isPending ? "Menghubungkan..." : "Hubungkan wallet"}
        </button>
        {error && <span className="inline-error">{error.message}</span>}
      </div>
    );
  }

  return (
    <div className="wallet-control">
      {chainId !== MONAD_TESTNET_ID ? (
        <button
          className="button button-outline"
          disabled={isSwitching}
          onClick={() => switchChain({ chainId: MONAD_TESTNET_ID })}
          type="button"
        >
          {isSwitching ? "Mengganti jaringan..." : "Pindah ke Monad Testnet"}
        </button>
      ) : (
        <span className="wallet-address">{address && shortenAddress(address)}</span>
      )}
      <button
        className="button button-quiet"
        onClick={() => disconnect()}
        type="button"
      >
        Putuskan
      </button>
      {(error || switchError) && (
        <span className="inline-error">{(error || switchError)?.message}</span>
      )}
    </div>
  );
}
