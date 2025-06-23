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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Atyp+Text:wght@500&family=Atyp+Display:wght@500&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased font-sans font-normal">
        <AppProviders>
          {children}
          <MobileBottomNav />
        </AppProviders>
      </body>
    </html>
  );
}
