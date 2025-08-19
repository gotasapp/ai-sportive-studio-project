'use client';

import JerseyEditor from '@/components/JerseyEditor';
import Header from '@/components/Header';

export default function JerseysPage() {
  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-[#030303] to-[#0b0518] flex flex-col">
      <Header />
      <div className="flex-1 w-full">
        <JerseyEditor />
      </div>
    </div>
  );
} 