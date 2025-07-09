import { ConnectButton, useActiveAccount } from "thirdweb/react";
import { AccountName } from '@/components/ui/account-name';
import { Button } from '@/components/ui/button';
import { Wallet, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface CustomConnectButtonProps {
  client: any;
  wallets: any;
  chains: any;
  theme?: "dark" | "light";
  className?: string;
}

export function CustomConnectButton({ 
  client, 
  wallets, 
  chains, 
  theme = "dark",
  className 
}: CustomConnectButtonProps) {
  const account = useActiveAccount();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  if (!account) {
    // Show regular connect button when not connected
    return (
      <div className={className}>
        <ConnectButton 
          client={client}
          wallets={wallets}
          chains={chains}
          theme={theme}
        />
      </div>
    );
  }

  // Show custom connected state with AccountName
  return (
    <div className="relative">
      <Button
        variant="outline"
        className={cn(
          "flex items-center space-x-2 bg-[#14101e] border-gray-600 text-white hover:bg-[#1a1525] transition-colors",
          className
        )}
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
      >
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 rounded-full bg-[#A20131] flex items-center justify-center">
            <Wallet className="w-3 h-3 text-white" />
          </div>
          <div className="text-left">
            <AccountName 
              className="text-sm font-medium text-white"
              fallbackToAddress={true}
              loadingText="..."
            />
          </div>
        </div>
        <ChevronDown className={cn(
          "w-4 h-4 text-gray-400 transition-transform",
          isDropdownOpen && "rotate-180"
        )} />
      </Button>

      {/* Dropdown Menu */}
      {isDropdownOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setIsDropdownOpen(false)}
          />
          
          {/* Dropdown Content */}
          <div className="absolute right-0 top-full mt-2 w-64 bg-[#14101e] border border-gray-600 rounded-lg shadow-lg z-50">
            <div className="p-4">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-[#A20131] flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-white" />
                </div>
                <div>
                  <AccountName 
                    className="text-white font-medium"
                    fallbackToAddress={true}
                  />
                  <p className="text-gray-400 text-xs font-mono">
                    {account.address.slice(0, 8)}...{account.address.slice(-6)}
                  </p>
                </div>
              </div>
              
              <div className="border-t border-gray-700 pt-3">
                <ConnectButton 
                  client={client}
                  wallets={wallets}
                  chains={chains}
                  theme={theme}
                  connectButton={{
                    label: "Switch Account"
                  }}
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
} 