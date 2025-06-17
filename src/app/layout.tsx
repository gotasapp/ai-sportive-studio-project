import type { Metadata } from "next";
import "./globals.css";
import AppKitProvider from "@/lib/AppKitProvider";
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
        <AppKitProvider cookies={cookies}>
          {children}
        </AppKitProvider>
      </body>
    </html>
  );
}
