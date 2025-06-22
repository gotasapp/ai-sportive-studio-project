'use client';

import { useActiveAccount, useActiveWallet } from 'thirdweb/react';
import { getUserEmail } from 'thirdweb/wallets/in-app';
import { createThirdwebClient } from 'thirdweb';
import { useState, useEffect } from 'react';

// Cliente Thirdweb
const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || "",
});

export default function AdminDebug() {
  const account = useActiveAccount();
  const wallet = useActiveWallet();
  const [userEmail, setUserEmail] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Buscar email do usuário quando o wallet for InApp
  useEffect(() => {
    if (wallet && wallet.id === 'inApp') {
      setLoading(true);
      setError(null);
      
      const fetchUserEmail = async () => {
        try {
          console.log('🔍 Tentando buscar email do usuário...');
          const email = await getUserEmail({ client });
          console.log('📧 Email encontrado:', email);
          setUserEmail(email);
        } catch (err) {
          console.error('❌ Erro ao buscar email:', err);
          setError(err instanceof Error ? err.message : 'Erro desconhecido');
        } finally {
          setLoading(false);
        }
      };

      fetchUserEmail();
    } else {
      setUserEmail(undefined);
      setError(null);
      setLoading(false);
    }
  }, [wallet]);

  if (!account) {
    return (
      <div className="fixed top-4 right-4 bg-red-500/90 text-white p-4 rounded-lg z-50 max-w-md">
        <h3 className="font-bold mb-2">Debug: No Account</h3>
        <p className="text-sm">Nenhuma conta conectada</p>
      </div>
    );
  }

  return (
    <div className="fixed top-4 right-4 bg-blue-500/90 text-white p-4 rounded-lg z-50 max-w-md max-h-96 overflow-auto">
      <h3 className="font-bold mb-2">Debug: Thirdweb Email Access</h3>
      <div className="text-xs space-y-2">
        <div>
          <strong>Address:</strong> {account.address || 'N/A'}
        </div>
        
        <div>
          <strong>Wallet Type:</strong> {wallet?.id || 'N/A'}
        </div>
        
        <div>
          <strong>Is InApp Wallet:</strong> {wallet?.id === 'inApp' ? '✅ YES' : '❌ NO'}
        </div>
        
        {/* Status de busca de email */}
        <div>
          <strong>Email Search:</strong> {loading ? '🔄 Loading...' : '✅ Complete'}
        </div>
        
        {/* Email encontrado via getUserEmail */}
        <div>
          <strong>User Email (getUserEmail):</strong> 
          <div className="text-xs bg-black/30 p-2 rounded mt-1">
            {loading ? 'Buscando...' : 
             error ? `❌ Erro: ${error}` :
             userEmail ? `📧 ${userEmail}` : '❌ Nenhum email encontrado'}
          </div>
        </div>
        
        {/* Verificar se o email é admin */}
        {userEmail && (
          <div>
            <strong>Is Admin Email:</strong>
            <div className="text-xs bg-black/30 p-2 rounded mt-1">
              {process.env.NEXT_PUBLIC_ADMIN_EMAIL?.toLowerCase() === userEmail.toLowerCase() ? 
                '✅ SIM - É admin!' : 
                '❌ NÃO - Não é admin'}
            </div>
          </div>
        )}
        
        {/* Configurações de admin */}
        <div>
          <strong>Admin Config:</strong>
          <div className="text-xs bg-black/30 p-2 rounded mt-1">
            <div>Admin Email: {process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'Não configurado'}</div>
            <div>Admin Wallet: {process.env.NEXT_PUBLIC_ADMIN_WALLET_ADDRESS || 'Não configurado'}</div>
          </div>
        </div>
        
        {/* Propriedades diretas do account */}
        <div>
          <strong>Account Direct Props:</strong>
          <div className="text-xs bg-black/30 p-2 rounded mt-1">
            <div>Email: {(account as any).email || 'N/A'}</div>
            <div>Name: {(account as any).name || 'N/A'}</div>
            <div>Picture: {(account as any).picture || 'N/A'}</div>
          </div>
        </div>
        
        {/* Objeto completo do account (compacto) */}
        <details>
          <summary className="cursor-pointer text-xs font-bold">Full Account Object</summary>
          <pre className="text-xs bg-black/30 p-2 rounded mt-1 overflow-auto">
            {JSON.stringify(account, null, 2)}
          </pre>
        </details>
        
        {/* Objeto completo do wallet (compacto) */}
        {wallet && (
          <details>
            <summary className="cursor-pointer text-xs font-bold">Full Wallet Object</summary>
            <pre className="text-xs bg-black/30 p-2 rounded mt-1 overflow-auto">
              {JSON.stringify(wallet, null, 2)}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
} 