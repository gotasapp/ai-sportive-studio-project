import { useState, useEffect } from 'react';
import { useActiveAccount, useActiveWallet } from 'thirdweb/react';
import { client } from '@/lib/ThirdwebProvider';

export interface ThirdwebProfile {
  type: string;
  details: {
    address?: string;
    email?: string;
    id?: string;
    phone?: string;
  };
}

export function useThirdwebProfiles() {
  const account = useActiveAccount();
  const wallet = useActiveWallet();
  const [profiles, setProfiles] = useState<ThirdwebProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfiles() {
      if (!account || !wallet) {
        setProfiles([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        let userProfiles: ThirdwebProfile[] = [];
        
        // Primeiro, tentar a abordagem original (funciona localmente)
        try {
          // Tentar importar e usar getProfiles dinamicamente
          const { getProfiles } = await import('thirdweb/wallets');
          userProfiles = await getProfiles({ client });
          console.log('✅ Successfully loaded profiles via getProfiles:', userProfiles);
        } catch (getProfilesError) {
          console.log('⚠️ getProfiles not available or failed, using fallback approach:', getProfilesError);
          
          // Fallback: Criar perfis básicos manualmente
          const basicProfiles: ThirdwebProfile[] = [];
          
          // Sempre adicionar perfil da wallet
          basicProfiles.push({
            type: 'wallet',
            details: {
              address: account.address
            }
          });

          // Para inApp wallets, tentar obter informações reais
          if (wallet.id === 'inApp') {
            try {
              // Tentar acessar informações da inApp wallet de forma segura
              const walletData = (wallet as any);
              
              // Verificar se há dados de autenticação disponíveis
              if (walletData.authProvider) {
                const authType = walletData.authProvider;
                if (authType === 'google' || authType === 'email') {
                  basicProfiles.push({
                    type: authType,
                    details: {
                      email: 'Connected via ' + authType
                    }
                  });
                } else if (authType === 'discord') {
                  basicProfiles.push({
                    type: 'discord',
                    details: {
                      id: 'Connected via Discord'
                    }
                  });
                }
              }
            } catch (walletError) {
              console.log('InApp wallet detected but no additional details available');
            }
          }
          
          userProfiles = basicProfiles;
        }
        
        // Garantir que sempre temos pelo menos um perfil (o da wallet)
        if (userProfiles.length === 0) {
          userProfiles.push({
            type: 'wallet',
            details: {
              address: account.address
            }
          });
        }
        
        setProfiles(userProfiles);
      } catch (err) {
        console.error('Error creating profiles:', err);
        
        // Em caso de erro, ainda mostrar o perfil básico da wallet
        const fallbackProfile: ThirdwebProfile[] = [{
          type: 'wallet',
          details: {
            address: account.address
          }
        }];
        
        setProfiles(fallbackProfile);
        setError(null); // Não mostrar erro se conseguimos pelo menos mostrar a wallet
      } finally {
        setLoading(false);
      }
    }

    fetchProfiles();
  }, [account, wallet]);

  // Helper functions to get specific profile types
  const getEmailProfile = () => profiles.find(p => p.type === 'email');
  const getPhoneProfile = () => profiles.find(p => p.type === 'phone');
  const getGoogleProfile = () => profiles.find(p => p.type === 'google');
  const getDiscordProfile = () => profiles.find(p => p.type === 'discord');
  const getWalletProfile = () => profiles.find(p => p.type === 'wallet');

  // Get primary contact info
  const primaryEmail = getEmailProfile()?.details.email || getGoogleProfile()?.details.email;
  const primaryPhone = getPhoneProfile()?.details.phone;

  return {
    profiles,
    loading,
    error,
    // Helper getters
    getEmailProfile,
    getPhoneProfile,
    getGoogleProfile,
    getDiscordProfile,
    getWalletProfile,
    // Primary contact info
    primaryEmail,
    primaryPhone,
    // Counts
    totalProfiles: profiles.length,
    hasEmail: !!primaryEmail,
    hasPhone: !!primaryPhone,
  };
} 