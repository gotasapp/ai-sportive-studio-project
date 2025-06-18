import type { Metadata } from "next";
import "./globals.css";
import AppProviders from "@/lib/AppProviders";
import { headers } from 'next/headers';

export const metadata: Metadata = {
  title: "AI Sports NFT Generator",
  description: "Generate and mint sports NFTs with AI on Chiliz Chain",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersObj = await headers();
  const cookies = headersObj.get('cookie');

  return (
    <html lang="en">
      <body className="antialiased">
        <AppProviders cookies={cookies}>
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
