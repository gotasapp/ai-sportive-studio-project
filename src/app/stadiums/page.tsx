'use client';

import StadiumEditor from '@/components/StadiumEditor';
import Header from '@/components/Header';

export default function StadiumsPage() {
  // No more authentication checks - let everyone see the page
  // Authentication will be handled at the component level when needed
  
  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-[#030303] to-[#0b0518] flex flex-col">
      <Header />
      <div className="flex-1 w-full">
        <StadiumEditor />
      </div>
    </div>
  );
} 