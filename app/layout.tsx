import type { Metadata } from "next";
import "./globals.css";
import { WalletProvider } from "@/lib/wallet";
import { LanguageProvider } from "@/lib/i18n-context";
import { Nav, Footer } from "@/components/ui";

export const metadata: Metadata = {
  title: "TUTUR — verifiable micro-bounties for local-language data",
  description:
    "Sponsors fund small language-data tasks, contributors submit, validators review, and smart contracts pay on Monad Testnet.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <LanguageProvider>
          <WalletProvider>
            <Nav />
            <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
            <Footer />
          </WalletProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}

