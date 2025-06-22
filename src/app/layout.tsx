import type { Metadata } from "next";
import "./globals.css";
import AppProviders from "@/lib/AppProviders";
import MobileBottomNav from "@/components/MobileBottomNav";

export const metadata: Metadata = {
  title: "Chiliz Fan NFT",
  description: "Generate and mint sports NFTs with AI - Jerseys and Stadiums",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AppProviders>
          {children}
          <MobileBottomNav />
        </AppProviders>
      </body>
    </html>
  );
}
