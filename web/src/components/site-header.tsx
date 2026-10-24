import Link from "next/link";
import { WalletControl } from "@/components/wallet-control";

export function SiteHeader() {
  return (
    <header className="site-header">
      <Link className="wordmark" href="/">
        TUTUR<span>.</span>
      </Link>
      <nav className="header-nav" aria-label="Navigasi utama">
        <Link href="/#tasks">Jelajahi task</Link>
        <Link href="/#about">Tentang</Link>
        <Link href="/tasks/new">Buat task</Link>
      </nav>
      <div className="network-wallet">
        <span className="network-badge">MONAD TESTNET</span>
        <WalletControl />
      </div>
    </header>
  );
}
