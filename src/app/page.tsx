'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useActiveAccount } from 'thirdweb/react';
import JerseyEditor from '@/components/JerseyEditor';
import Header from '@/components/Header';

export default function Home() {
  const account = useActiveAccount();
  const router = useRouter();
  const [isAuthCheckComplete, setIsAuthCheckComplete] = useState(false);

  useEffect(() => {
    // O hook `useActiveAccount` leva um momento para determinar o status.
    // Damos um pequeno tempo para ele resolver antes de tomar uma decisão.
    const timer = setTimeout(() => {
      if (!account) {
        router.push('/login');
      } else {
        setIsAuthCheckComplete(true);
      }
    }, 250); // Aumentar se necessário em conexões lentas

    return () => clearTimeout(timer);
  }, [account, router]);

  // Enquanto a verificação não estiver completa, mostramos um loader.
  if (!isAuthCheckComplete) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-[#030303] to-[#0b0518]">
        <div className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Se a verificação estiver completa e a conta existir, renderiza a página.
  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-[#030303] to-[#0b0518] flex flex-col">
      <Header />
      <div className="flex-1 w-full">
        <JerseyEditor />
      </div>
    </div>
  );
}
