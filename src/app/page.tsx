'use client';

import Header from '@/components/Header';
import { CommerceHero } from '@/components/commerce-hero';

export default function Home() {
  return (
    <div className="w-full h-screen bg-gradient-to-b from-[#030303] to-[#0b0518] flex flex-col overflow-hidden">
      <Header />
      <div className="flex-1 w-full">
        <CommerceHero />
      </div>
    </div>
  );
}