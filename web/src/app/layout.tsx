import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "TUTUR — Language data, fairly gathered",
  description:
    "Verifiable micro-bounties for local-language data on Monad Testnet.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body>
        <Providers>
          <SiteHeader />
          {children}
        </Providers>
      </body>
    </html>
  );
}
