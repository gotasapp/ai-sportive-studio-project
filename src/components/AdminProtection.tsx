'use client';

import { useActiveAccount } from 'thirdweb/react';
import { Lock, Loader2 } from 'lucide-react';
import { ReactNode, useState, useEffect } from 'react';
import { isAdmin } from '@/lib/admin-config';

interface AdminProtectionProps {
  children: ReactNode;
  fallback?: ReactNode;
}

const LoadingComponent = () => (
  <div className="flex items-center justify-center h-screen bg-gradient-to-b from-[#030303] to-[#0b0518]">
    <div className="flex flex-col items-center space-y-4">
      <Loader2 className="w-12 h-12 text-accent animate-spin" />
      <p className="text-secondary">Verifying admin access...</p>
    </div>
  </div>
);

const FallbackComponent = ({ address }: { address?: string }) => (
  <div className="flex items-center justify-center h-screen bg-gradient-to-b from-[#030303] to-[#0b0518] text-secondary">
    <div className="w-full max-w-md p-8 m-4 text-center border rounded-lg shadow-xl bg-gradient-to-b from-[#030303]/50 to-[#0b0518]/50 border-secondary/20 backdrop-blur-sm">
      <div className="mx-auto mb-6 bg-accent/20 rounded-full w-20 h-20 flex items-center justify-center">
        <Lock className="w-10 h-10 text-accent" />
      </div>
      <h1 className="mb-2 text-2xl font-bold">Access Restricted</h1>
      <p className="mb-6 text-secondary/70">
        {address ? "This account does not have admin privileges." : "Please connect your wallet to proceed."}
      </p>
      {address && (
        <div className="p-3 mb-6 font-mono text-xs break-all rounded-md bg-secondary/10 text-secondary/80">
          {address}
        </div>
      )}
      <a href="/" className="text-accent hover:underline">
        Return to Home
      </a>
    </div>
  </div>
);

export default function AdminProtection({ children, fallback }: AdminProtectionProps) {
  const account = useActiveAccount();
  const [status, setStatus] = useState<'loading' | 'allowed' | 'denied'>('loading');

  useEffect(() => {
    // Se o usuário não está conectado, ele não está nem negado nem permitido ainda.
    // A UI principal (Header) deve solicitar a conexão.
    // Mantemos 'loading' para que a tela de admin não mostre 'negado' prematuramente.
    if (!account?.address) {
      setStatus('loading'); 
      return;
    }

    // Assim que a conta estiver disponível, verificamos o acesso.
    const verifyAccess = () => {
        const isAdminUser = isAdmin(account);
        setStatus(isAdminUser ? 'allowed' : 'denied');
    };
    
    // Pequeno delay para garantir que a UI se estabilize após a conexão.
    const timer = setTimeout(verifyAccess, 100);

    return () => clearTimeout(timer);

  }, [account]);

  if (status === 'loading') {
    return <LoadingComponent />;
  }

  if (status === 'denied') {
    return fallback || <FallbackComponent address={account?.address} />;
  }
  
  // status === 'allowed'
  return <>{children}</>;
} 