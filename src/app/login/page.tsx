'use client';

import { ConnectButton, useActiveAccount } from "thirdweb/react";
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { client, supportedChains, wallets, chzMainnet } from '@/lib/ThirdwebProvider';

export default function LoginPage() {
  const account = useActiveAccount();
  const router = useRouter();

  // Show different content if user is already connected
  if (account) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#030303] to-[#0b0518] text-white">
        <div className="flex items-center justify-center min-h-screen">
          <div className="max-w-md w-full mx-auto p-8 text-center">
            {/* Logo */}
            <div className="flex justify-center">
              <img 
                src="https://res.cloudinary.com/dpilz4p6g/image/upload/v1751896717/Chiliz_Logo_p07cwf.png" 
                alt="Chiliz Logo" 
                className="w-auto h-32 object-contain"
              />
            </div>
            
            <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent leading-tight py-1 mb-6">
              Welcome Back!
            </h1>
            <p className="text-gray-400 text-base mb-8">
              Your wallet is connected. You can now access all features.
            </p>
            <div className="space-y-4">
              <button 
                onClick={() => router.push('/')}
                className="w-full bg-[#A20131] hover:bg-[#8a0129] text-white font-medium px-6 py-3 rounded-lg transition-colors"
              >
                Go to Jerseys
              </button>
              <button 
                onClick={() => router.push('/marketplace')}
                className="w-full border border-gray-600 text-gray-300 hover:text-white hover:border-gray-500 font-medium px-6 py-3 rounded-lg transition-colors"
              >
                Visit Marketplace
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#030303] to-[#0b0518] text-white">
      <div className="flex items-center justify-center min-h-screen">
        <div className="max-w-md w-full mx-auto p-8">
          <div className="text-center space-y-8">
            {/* Logo */}
            <div className="flex justify-center">
              <img 
                src="https://res.cloudinary.com/dpilz4p6g/image/upload/v1751896717/Chiliz_Logo_p07cwf.png" 
                alt="Chiliz Logo" 
                className="w-auto h-32 object-contain"
              />
            </div>
            
            <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent leading-tight py-1 mb-6">
              Fan Studio
            </h1>
            <p className="text-gray-400 text-base">
              Create and trade Club NFTs with powered tools
            </p>
            
            <div className="space-y-4">
              <div className="flex justify-center">
                <ConnectButton
                  client={client}
                  wallets={wallets}
                  chains={supportedChains}
                  theme="dark"
                />
              </div>
              
              <div className="space-y-3">
                <button 
                  onClick={() => router.push('/')}
                  className="w-full border border-gray-600 text-gray-300 hover:text-white hover:border-gray-500 font-medium px-6 py-3 rounded-lg transition-colors"
                >
                  Browse Jerseys
                </button>
                <button 
                  onClick={() => router.push('/marketplace')}
                  className="w-full border border-gray-600 text-gray-300 hover:text-white hover:border-gray-500 font-medium px-6 py-3 rounded-lg transition-colors"
                >
                  Visit Marketplace
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 