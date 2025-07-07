'use client';

import { ConnectButton, useActiveAccount } from "thirdweb/react";
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { client, supportedChains, wallets, chzMainnet } from '@/lib/ThirdwebProvider';

export default function LoginPage() {
  const account = useActiveAccount();
  const router = useRouter();

  // 3. Redirecionar se o usuário já estiver logado e autenticado
  useEffect(() => {
    if (account) {
      router.push('/');
    }
  }, [account, router]);

  // Don't render the login page if user is already logged in
  // This prevents a flash of the login page before redirect
  if (account) {
    return null; 
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#030303] to-[#0b0518] text-white">
      <div className="flex items-center justify-center min-h-screen">
        <div className="max-w-md w-full mx-auto p-8">
          <div className="text-center space-y-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              Fan Token Studio
            </h1>
            <p className="text-gray-400 text-lg">
              Connect your wallet to start creating and trading football club NFTs
            </p>
            
            <div className="flex justify-center">
              <ConnectButton
                client={client}
                wallets={wallets}
                chains={supportedChains}
                theme="dark"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 