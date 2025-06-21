'use client';

import StadiumEditor from '@/components/StadiumEditor';
import Header from '@/components/Header';

export default function StadiumsPage() {
  return (
    <main className="flex min-h-screen flex-col items-center">
      <Header />
      <StadiumEditor />
    </main>
  );
} 