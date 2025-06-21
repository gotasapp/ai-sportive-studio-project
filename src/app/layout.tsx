import type { Metadata } from "next";
import "./globals.css";
import AppProviders from "@/lib/AppProviders";

export const metadata: Metadata = {
  title: "AI Sports NFT Generator",
  description: "Generate and mint sports NFTs with AI on Chiliz Chain",
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
        </AppProviders>
      </body>
    </html>
  );
}
