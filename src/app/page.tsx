'use client';

import Header from '@/components/Header';
import { CommerceHero } from '@/components/commerce-hero';
import Footer from '@/components/layout/Footer';

export default function Home() {
  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-[#030303] to-[#0b0518] flex flex-col">
      <Header />
      <div className="flex-1 w-full overflow-x-hidden">
        <CommerceHero />
      </div>
      <Footer />
    </div>
  );
}