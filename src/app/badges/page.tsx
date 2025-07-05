'use client';

import BadgeEditor from '@/components/BadgeEditor';
import Header from '@/components/Header';
import MobileNav from '@/components/MobileNav';

export default function BadgesPage() {
  return (
    <main className="flex min-h-screen flex-col items-center pb-20 lg:pb-0 bg-black">
      <Header />
      <div className="w-full max-w-7xl px-4">
        <BadgeEditor />
      </div>
      {/* Mobile Navigation */}
      <MobileNav />
    </main>
  );
} 