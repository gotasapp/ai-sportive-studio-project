'use client';

import { useActiveAccount } from 'thirdweb/react';
import { Shield, Lock } from 'lucide-react';
import { ReactNode } from 'react';
import { isAdmin } from '@/lib/admin-config';

interface AdminProtectionProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export default function AdminProtection({ children, fallback }: AdminProtectionProps) {
  const account = useActiveAccount();
  
  const isConnected = !!account;
  const userIsAdmin = isAdmin(account);
  
  // Custom fallback component
  const defaultFallback = (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
      <div className="max-w-md w-full mx-4">
        <div className="bg-gray-800/50 backdrop-blur-lg border border-gray-700 rounded-2xl p-8 text-center">
          <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="w-10 h-10 text-red-400" />
          </div>
          
          <h1 className="text-2xl font-bold text-white mb-4">Access Restricted</h1>
          
          {!isConnected ? (
            <div className="space-y-4">
              <p className="text-gray-400">
                You need to connect your wallet to access the admin panel.
              </p>
              <div className="flex items-center justify-center space-x-2 text-cyan-400">
                <Shield className="w-4 h-4" />
                <span className="text-sm">Connect wallet in the header</span>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-gray-400">
                This area is restricted to authorized administrators only.
              </p>
              <div className="bg-gray-700/50 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-2">Your Account:</p>
                <div className="space-y-1">
                  {account?.address && (
                    <p className="text-sm text-gray-300 font-mono break-all">
                      Wallet: {account.address}
                    </p>
                  )}
                  {/* Email info may be available in future Thirdweb versions */}
                  {(account as any)?.email && (
                    <p className="text-sm text-gray-300">
                      Email: {(account as any).email}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-center space-x-2 text-red-400">
                <Shield className="w-4 h-4" />
                <span className="text-sm">Admin access required</span>
              </div>
            </div>
          )}
          
          <div className="mt-6 pt-6 border-t border-gray-700">
            <a 
              href="/"
              className="inline-flex items-center space-x-2 text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              <span>← Return to Home</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
  
  // Show fallback if not admin
  if (!userIsAdmin) {
    return fallback || defaultFallback;
  }
  
  // Show admin content
  return (
    <div>
      {/* Admin indicator */}
      <div className="bg-orange-500/10 border-b border-orange-400/20 px-4 py-2">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2 text-orange-400">
            <Shield className="w-4 h-4" />
            <span className="text-sm font-medium">Admin Mode Active</span>
          </div>
          <div className="text-xs text-orange-300">
            {account?.address ? 
              `${account.address.slice(0, 6)}...${account.address.slice(-4)}` :
              account?.email || 'Social Login'
            }
          </div>
        </div>
      </div>
      
      {children}
    </div>
  );
} 