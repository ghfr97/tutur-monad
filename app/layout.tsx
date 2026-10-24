import type { Metadata } from "next";
import "./globals.css";
import { WalletProvider } from "@/lib/wallet";
import { Nav } from "@/components/ui";

export const metadata: Metadata = {
  title: "TUTUR — verifiable micro-bounties for local-language data",
  description:
    "Sponsors fund small language-data tasks, contributors submit, validators review, and smart contracts pay on Monad Testnet.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <WalletProvider>
          <Nav />
          <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
          <footer className="mx-auto max-w-5xl border-t border-rule px-4 py-6 text-xs text-soft">
            Hackathon prototype for Monad Blitz Jogja. Unaudited. Testnet MON has no monetary value.
          </footer>
        </WalletProvider>
      </body>
    </html>
  );
}
