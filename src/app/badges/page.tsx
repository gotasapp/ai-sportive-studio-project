'use client';

import BadgeEditor from '@/components/BadgeEditor';
import Header from '@/components/Header';

export default function BadgesPage() {
  return (
    <main className="flex flex-col items-center">
      <Header />
      <BadgeEditor />
    </main>
  );
} 