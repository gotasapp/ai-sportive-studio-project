import { useState } from 'react';
import { useActiveWallet, useActiveAccount, useConnect } from 'thirdweb/react';
import { inAppWallet, preAuthenticate } from 'thirdweb/wallets';
import { createThirdwebClient } from 'thirdweb';

// Thirdweb client
const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID!,
});

export type AuthProvider = 'google' | 'discord' | 'email' | 'apple' | 'facebook' | 'x';

export function useAccountLinking() {
  const wallet = useActiveWallet();
  const account = useActiveAccount();
  const { connect } = useConnect();
  const [isLinking, setIsLinking] = useState(false);
  const [linkingError, setLinkingError] = useState<string | null>(null);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);

  const linkAccount = async (provider: AuthProvider, email?: string, verificationCode?: string) => {
    try {
      setIsLinking(true);
      setLinkingError(null);

      console.log(`🔗 Attempting to link ${provider} account...`);
      
      if (provider === 'email') {
        if (!email) {
          setLinkingError('Email is required for email authentication');
          return false;
        }

        if (!verificationCode) {
          // Step 1: Send verification code
          console.log('📧 Sending verification code to:', email);
          await preAuthenticate({
            client,
            strategy: "email",
            email,
          });
          
          setPendingEmail(email);
          console.log('✅ Verification code sent to email');
          return 'verification_sent';
        } else {
          // Step 2: Verify and connect
          console.log('🔐 Verifying email with code...');
          await connect(async () => {
            const wallet = inAppWallet();
            await wallet.connect({
              client,
              strategy: "email",
              email: pendingEmail || email,
              verificationCode,
            });
            return wallet;
          });
          
          setPendingEmail(null);
          console.log('✅ Email account linked successfully');
          return true;
        }
      } else {
        // For social providers (Google, Discord, etc.)
        console.log(`🔗 Connecting ${provider} account...`);
        await connect(async () => {
          const wallet = inAppWallet();
          await wallet.connect({
            client,
            strategy: provider as any, // Google, Discord, etc.
          });
          return wallet;
        });
        
        console.log(`✅ ${provider} account linked successfully`);
        return true;
      }
      
    } catch (error: any) {
      console.error(`❌ Failed to link ${provider} account:`, error);
      setLinkingError(error?.message || `Failed to link ${provider} account`);
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

  // Helper functions for cleaner API
  const sendEmailVerification = async (email: string) => {
    return await linkAccount('email', email);
  };

  const verifyEmailCode = async (email: string, code: string) => {
    return await linkAccount('email', email, code);
  };

  const linkSocialAccount = async (provider: 'google' | 'discord' | 'x') => {
    return await linkAccount(provider);
  };

  return {
    linkAccount,
    sendEmailVerification,
    verifyEmailCode, 
    linkSocialAccount,
    unlinkAccount,
    getLinkedAccounts,
    isAccountLinked,
    isLinking,
    linkingError,
    pendingEmail,
    clearError: () => setLinkingError(null),
    wallet,
    account
  };
} 