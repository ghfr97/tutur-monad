import { createPublicClient, defineChain, http, type Address } from "viem";

const chainId = Number(process.env.NEXT_PUBLIC_MONAD_CHAIN_ID ?? 10143);
const rpcUrl = process.env.NEXT_PUBLIC_MONAD_RPC_URL ?? "https://testnet-rpc.monad.xyz";
export const EXPLORER_URL = (
  process.env.NEXT_PUBLIC_MONAD_EXPLORER_URL ?? "https://testnet.monadexplorer.com"
).replace(/\/$/, "");

export const monadTestnet = defineChain({
  id: chainId,
  name: "Monad Testnet",
  nativeCurrency: { name: "Monad", symbol: "MON", decimals: 18 },
  rpcUrls: { default: { http: [rpcUrl] } },
  blockExplorers: { default: { name: "Monad Explorer", url: EXPLORER_URL } },
  testnet: true,
});

export const publicClient = createPublicClient({ chain: monadTestnet, transport: http(rpcUrl) });

const isAddr = (v?: string): v is Address => !!v && /^0x[0-9a-fA-F]{40}$/.test(v);

const rawFactory = process.env.NEXT_PUBLIC_TUTUR_FACTORY_ADDRESS;
/** undefined until the human operator deploys the factory and sets the env var. */
export const FACTORY_ADDRESS: Address | undefined = isAddr(rawFactory) ? rawFactory : undefined;

export const addressUrl = (a: string) => `${EXPLORER_URL}/address/${a}`;
export const txUrl = (h: string) => `${EXPLORER_URL}/tx/${h}`;
export const shorten = (s: string, n = 6) => `${s.slice(0, n + 2)}…${s.slice(-4)}`;
