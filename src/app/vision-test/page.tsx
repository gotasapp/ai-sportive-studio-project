'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useActiveAccount } from 'thirdweb/react';
import VisionTestEditor from '@/components/VisionTestEditor';
import Header from '@/components/Header';

export default function VisionTestPage() {
  const account = useActiveAccount();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Allow access if wallet is connected (temporary for testing)
    const timer = setTimeout(() => {
      if (!account) {
        router.push('/login');
      } else {
        setIsLoading(false);
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, [account, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-secondary">Loading Vision Test...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center pb-20 lg:pb-0 bg-black">
      <Header />
      <div className="w-full max-w-7xl px-4">
        {/* Debug info */}
        <div className="mb-4 p-2 bg-gray-800 rounded text-xs text-gray-400">
          🔧 Vision Test Page - Account: {account?.address ? 'Connected' : 'Not connected'}
        </div>
        <VisionTestEditor />
      </div>
    </main>
  );
} 