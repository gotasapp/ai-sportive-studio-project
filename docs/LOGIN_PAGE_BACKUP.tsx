'use client';

import { createThirdwebClient } from "thirdweb";
import { ConnectButton, useActiveAccount } from "thirdweb/react";
import { inAppWallet } from "thirdweb/wallets";
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

// ===================================================================================
// CÓDIGO DE BACKUP DA PÁGINA DE LOGIN - /src/app/login/page.tsx
// Este arquivo foi criado para que você possa restaurar o restante do projeto
// sem perder a lógica de login que foi desenvolvida.
// ===================================================================================


// 1. Crie o cliente Thirdweb (usando a variável de ambiente)
const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || "",
});

// 2. Defina as carteiras que você quer suportar
// - inAppWallet: Para login social (Google) e por e-mail.
// - Carteiras externas (MetaMask, etc.) já são suportadas por padrão.
const wallets = [
  inAppWallet({
    auth: {
      options: ["email", "google"], // Habilitando apenas email e Google
    },
  }),
];

export default function LoginPage() {
  const account = useActiveAccount();
  const router = useRouter();

  // Redireciona para a home se o usuário já estiver autenticado
  useEffect(() => {
    if (account) {
      router.push('/');
    }
  }, [account, router]);

  // Enquanto verifica o status da conta ou se já estiver logado, não renderiza nada
  if (account) {
    return null; 
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      <div className="w-full max-w-md text-center">
        <h1 className="text-4xl font-bold mb-4">Bem-vindo</h1>
        <p className="text-gray-300 mb-8">
          Autentique-se com sua carteira ou conta Google para continuar.
        </p>
        
        <ConnectButton
          client={client}
          wallets={wallets}
          auth={{
            doBackendSignIn: async (authResult) => {
              console.log("Resultado da Autenticação:", authResult);
            }
          }}
          theme="dark"
          connectModal={{
            size: "wide",
            title: "Escolha seu Login",
          }}
        />
      </div>
    </div>
  );
} 