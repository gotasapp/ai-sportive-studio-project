import { useState } from 'react';
import { useActiveWallet } from 'thirdweb/react';
import { inAppWallet } from 'thirdweb/wallets';
import { client } from '@/lib/ThirdwebProvider';

export type AuthProvider = 'google' | 'discord' | 'email' | 'apple' | 'facebook' | 'x';

export function useAccountLinking() {
  const wallet = useActiveWallet();
  const [isLinking, setIsLinking] = useState(false);
  const [linkingError, setLinkingError] = useState<string | null>(null);

  const linkAccount = async (provider: AuthProvider) => {
    if (!wallet || wallet.id !== 'inApp') {
      setLinkingError('Account linking is only available for in-app wallets');
      return false;
    }

    try {
      setIsLinking(true);
      setLinkingError(null);

      // Criar uma nova instância de inApp wallet para linking
      const linkingWallet = inAppWallet({
        auth: {
          options: [provider],
        },
      });

      // Conectar com o novo provedor
      await linkingWallet.connect({
        client,
        strategy: provider,
      });

      // Aqui você pode implementar a lógica para vincular as contas
      // Por exemplo, salvar no backend que este usuário tem múltiplas contas
      console.log(`Successfully linked ${provider} account`);
      
      return true;
    } catch (error) {
      console.error(`Failed to link ${provider} account:`, error);
      setLinkingError(error instanceof Error ? error.message : `Failed to link ${provider} account`);
      return false;
    } finally {
      setIsLinking(false);
    }
  };

  const unlinkAccount = async (provider: AuthProvider) => {
    try {
      setIsLinking(true);
      setLinkingError(null);

      // Implementar lógica para desvincular conta
      // Por enquanto, apenas log
      console.log(`Unlinked ${provider} account`);
      
      return true;
    } catch (error) {
      console.error(`Failed to unlink ${provider} account:`, error);
      setLinkingError(error instanceof Error ? error.message : `Failed to unlink ${provider} account`);
      return false;
    } finally {
      setIsLinking(false);
    }
  };

  return {
    linkAccount,
    unlinkAccount,
    isLinking,
    linkingError,
    clearError: () => setLinkingError(null),
  };
} 