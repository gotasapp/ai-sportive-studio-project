import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import AppProviders from "@/lib/AppProviders";
import MobileBottomNav from "@/components/MobileBottomNav";
import ClientFooterWrapper from "@/components/layout/ClientFooterWrapper";

const plusJakartaSans = Plus_Jakarta_Sans({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jakarta'
});

export const metadata: Metadata = {
  title: "Chiliz Fan NFT",
  description: "Generate and mint sports NFTs with AI - Jerseys and Stadiums",
  icons: {
    icon: "/chiliz-logo-fallback.svg",
    shortcut: "/chiliz-logo-fallback.svg",
    apple: "/chiliz-logo-fallback.svg",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={plusJakartaSans.variable}>
      <body className="antialiased font-jakarta font-normal min-h-screen flex flex-col">
        <AppProviders>
          <div className="flex-1">
            {children}
          </div>
          <ClientFooterWrapper />
          <MobileBottomNav />
        </AppProviders>
      </body>
    </html>
  );
}
