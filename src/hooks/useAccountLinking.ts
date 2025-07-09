import { useState } from 'react';
import { useActiveWallet, useActiveAccount } from 'thirdweb/react';

export type AuthProvider = 'google' | 'discord' | 'email' | 'apple' | 'facebook' | 'x';

export function useAccountLinking() {
  const wallet = useActiveWallet();
  const account = useActiveAccount();
  const [isLinking, setIsLinking] = useState(false);
  const [linkingError, setLinkingError] = useState<string | null>(null);

  const linkAccount = async (provider: AuthProvider) => {
    if (!wallet || !account) {
      setLinkingError('No wallet connected. Please connect a wallet first.');
      return false;
    }

    try {
      setIsLinking(true);
      setLinkingError(null);

      console.log(`Attempting to link ${provider} account for wallet: ${wallet.id}`);
      
      // Para in-app wallets, o linking é gerenciado automaticamente pela Thirdweb
      // quando o usuário faz login com diferentes provedores
      if (wallet.id === 'inApp') {
        // Simular o processo de linking para in-app wallets
        // Na prática, isso seria feito através do ConnectButton da Thirdweb
        console.log(`In-app wallet detected. Linking ${provider} to existing account...`);
        
        // Simular delay de processo
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Salvar informação de linking no localStorage ou backend
        const linkedAccounts = JSON.parse(localStorage.getItem('linkedAccounts') || '{}');
        const walletAddress = account.address;
        
        if (!linkedAccounts[walletAddress]) {
          linkedAccounts[walletAddress] = [];
        }
        
        if (!linkedAccounts[walletAddress].includes(provider)) {
          linkedAccounts[walletAddress].push(provider);
          localStorage.setItem('linkedAccounts', JSON.stringify(linkedAccounts));
        }
        
        console.log(`Successfully linked ${provider} account to ${walletAddress}`);
        return true;
      } else {
        // Para wallets externas, o linking não é suportado da mesma forma
        setLinkingError('Account linking is primarily supported for in-app wallets. External wallets manage their own authentication.');
        return false;
      }
      
    } catch (error) {
      console.error(`Failed to link ${provider} account:`, error);
      setLinkingError(error instanceof Error ? error.message : `Failed to link ${provider} account`);
      return false;
    } finally {
      setIsLinking(false);
    }
  };

  const unlinkAccount = async (provider: AuthProvider) => {
    if (!account) {
      setLinkingError('No wallet connected. Please connect a wallet first.');
      return false;
    }

    try {
      setIsLinking(true);
      setLinkingError(null);

      console.log(`Attempting to unlink ${provider} account for wallet: ${account.address}`);
      
      // Simular delay de processo
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Remover informação de linking do localStorage
      const linkedAccounts = JSON.parse(localStorage.getItem('linkedAccounts') || '{}');
      const walletAddress = account.address;
      
      if (linkedAccounts[walletAddress]) {
        linkedAccounts[walletAddress] = linkedAccounts[walletAddress].filter(
          (p: AuthProvider) => p !== provider
        );
        
        if (linkedAccounts[walletAddress].length === 0) {
          delete linkedAccounts[walletAddress];
        }
        
        localStorage.setItem('linkedAccounts', JSON.stringify(linkedAccounts));
      }
      
      console.log(`Successfully unlinked ${provider} account from ${walletAddress}`);
      return true;
    } catch (error) {
      console.error(`Failed to unlink ${provider} account:`, error);
      setLinkingError(error instanceof Error ? error.message : `Failed to unlink ${provider} account`);
      return false;
    } finally {
      setIsLinking(false);
    }
  };

  const getLinkedAccounts = (): AuthProvider[] => {
    if (!account) return [];
    
    const linkedAccounts = JSON.parse(localStorage.getItem('linkedAccounts') || '{}');
    return linkedAccounts[account.address] || [];
  };

  const isAccountLinked = (provider: AuthProvider): boolean => {
    return getLinkedAccounts().includes(provider);
  };

  return {
    linkAccount,
    unlinkAccount,
    getLinkedAccounts,
    isAccountLinked,
    isLinking,
    linkingError,
    clearError: () => setLinkingError(null),
  };
} 