'use client';

import BadgeEditor from '@/components/BadgeEditor';
import Header from '@/components/Header';
import Footer from '@/components/layout/Footer';

export default function BadgesPage() {
  // No more authentication checks - let everyone see the page
  // Authentication will be handled at the component level when needed
  
  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-[#030303] to-[#0b0518] flex flex-col">
      <Header />
      <div className="flex-1 w-full">
        <BadgeEditor />
      </div>
      <Footer />
    </div>
  );
} 