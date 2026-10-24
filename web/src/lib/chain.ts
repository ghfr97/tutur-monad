import { defineChain, getAddress, isAddress, type Address } from "viem";

export const MONAD_TESTNET_ID = 10143;
const configuredChainId = process.env.NEXT_PUBLIC_MONAD_CHAIN_ID;
if (configuredChainId && Number(configuredChainId) !== MONAD_TESTNET_ID) {
  throw new Error(
    `NEXT_PUBLIC_MONAD_CHAIN_ID harus ${MONAD_TESTNET_ID} untuk aplikasi ini.`,
  );
}
const rpcUrl =
  process.env.NEXT_PUBLIC_MONAD_RPC_URL ?? "https://testnet-rpc.monad.xyz";
const explorerUrl =
  process.env.NEXT_PUBLIC_MONAD_EXPLORER_URL ??
  "https://testnet.monadexplorer.com";

export const monadTestnet = defineChain({
  id: MONAD_TESTNET_ID,
  name: "Monad Testnet",
  nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
  rpcUrls: {
    default: { http: [rpcUrl] },
  },
  blockExplorers: {
    default: {
      name: "Monad Explorer",
      url: explorerUrl,
    },
  },
  testnet: true,
});

export function getFactoryAddress(): Address | undefined {
  const configured = process.env.NEXT_PUBLIC_TUTUR_FACTORY_ADDRESS;
  if (!configured || !isAddress(configured)) return undefined;
  return getAddress(configured);
}

export function getFactoryAddressError(): string | undefined {
  const configured = process.env.NEXT_PUBLIC_TUTUR_FACTORY_ADDRESS;
  if (configured && !isAddress(configured)) {
    return "NEXT_PUBLIC_TUTUR_FACTORY_ADDRESS bukan alamat EVM yang valid.";
  }
  return undefined;
}

export function explorerAddressUrl(address: Address): string {
  return `${monadTestnet.blockExplorers.default.url}/address/${address}`;
}

export function explorerTransactionUrl(hash: `0x${string}`): string {
  return `${monadTestnet.blockExplorers.default.url}/tx/${hash}`;
}

export function shortenAddress(address: Address): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
