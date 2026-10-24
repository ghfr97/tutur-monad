"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { createWalletClient, custom, type Address, type WalletClient } from "viem";
import { monadTestnet, publicClient } from "./chain";

interface Eip1193 {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
  on?(ev: string, cb: (...a: unknown[]) => void): void;
  removeListener?(ev: string, cb: (...a: unknown[]) => void): void;
}
declare global {
  interface Window {
    ethereum?: Eip1193;
  }
}

interface WalletState {
  account?: Address;
  chainId?: number;
  wrongNetwork: boolean;
  hasProvider: boolean;
  balance?: bigint;
  connect: () => Promise<void>;
  switchNetwork: () => Promise<void>;
  getWalletClient: () => WalletClient | undefined;
  refreshBalance: () => Promise<void>;
  error?: string;
}

const Ctx = createContext<WalletState | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<Address>();
  const [chainId, setChainId] = useState<number>();
  const [balance, setBalance] = useState<bigint>();
  const [hasProvider, setHasProvider] = useState(false);
  const [error, setError] = useState<string>();

  const refreshBalance = useCallback(async () => {
    if (!account) return setBalance(undefined);
    try {
      setBalance(await publicClient.getBalance({ address: account }));
    } catch {
      setBalance(undefined);
    }
  }, [account]);

  useEffect(() => {
    const eth = window.ethereum;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHasProvider(!!eth);
    if (!eth) return;
    (async () => {
      try {
        const accs = (await eth.request({ method: "eth_accounts" })) as string[];
        if (accs[0]) setAccount(accs[0] as Address);
        setChainId(Number(await eth.request({ method: "eth_chainId" })));
      } catch {
        /* ignore */
      }
    })();
    const onAcc = (a: unknown) => setAccount(((a as string[])[0] as Address) || undefined);
    const onChain = (c: unknown) => setChainId(Number(c));
    eth.on?.("accountsChanged", onAcc);
    eth.on?.("chainChanged", onChain);
    return () => {
      eth.removeListener?.("accountsChanged", onAcc);
      eth.removeListener?.("chainChanged", onChain);
    };
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshBalance();
  }, [refreshBalance]);

  const connect = useCallback(async () => {
    setError(undefined);
    const eth = window.ethereum;
    if (!eth) return setError("No browser wallet found. Install MetaMask or a compatible wallet.");
    try {
      const accs = (await eth.request({ method: "eth_requestAccounts" })) as string[];
      setAccount(accs[0] as Address);
      setChainId(Number(await eth.request({ method: "eth_chainId" })));
    } catch (e) {
      const code = (e as { code?: number }).code;
      setError(code === 4001 ? "Connection request was rejected." : "Could not connect wallet.");
    }
  }, []);

  const switchNetwork = useCallback(async () => {
    setError(undefined);
    const eth = window.ethereum;
    if (!eth) return;
    const hexId = `0x${monadTestnet.id.toString(16)}`;
    try {
      await eth.request({ method: "wallet_switchEthereumChain", params: [{ chainId: hexId }] });
    } catch (e) {
      if ((e as { code?: number }).code === 4902 || /Unrecognized chain/i.test(String((e as Error).message))) {
        try {
          await eth.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: hexId,
                chainName: monadTestnet.name,
                nativeCurrency: monadTestnet.nativeCurrency,
                rpcUrls: monadTestnet.rpcUrls.default.http,
                blockExplorerUrls: [monadTestnet.blockExplorers.default.url],
              },
            ],
          });
        } catch {
          setError("Could not add Monad Testnet to your wallet.");
        }
      } else {
        setError("Network switch was rejected.");
      }
    }
  }, []);

  const getWalletClient = useCallback(() => {
    if (!window.ethereum || !account) return undefined;
    return createWalletClient({ account, chain: monadTestnet, transport: custom(window.ethereum) });
  }, [account]);

  const value = useMemo<WalletState>(
    () => ({
      account,
      chainId,
      wrongNetwork: !!account && chainId !== monadTestnet.id,
      hasProvider,
      balance,
      connect,
      switchNetwork,
      getWalletClient,
      refreshBalance,
      error,
    }),
    [account, chainId, hasProvider, balance, connect, switchNetwork, getWalletClient, refreshBalance, error],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useWallet() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useWallet outside WalletProvider");
  return v;
}
