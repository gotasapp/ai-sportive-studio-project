# Guia de Implementação: Thirdweb ConnectButton (v5)

Este documento serve como guia de referência rápida para a implementação do componente `ConnectButton` da versão 5 do SDK da Thirdweb, focado em criar um fluxo de autenticação seguro e unificado.

## 🔑 Conceitos Principais

### 1. `ConnectButton`
O `ConnectButton` é um componente de UI pré-construído que oferece uma solução "tudo-em-um" para a conexão de usuários. Ele gerencia:
- **Múltiplos Provedores:** Suporte nativo para mais de 500 carteiras externas (MetaMask, Coinbase Wallet, etc.).
- **In-App Wallets:** Onboarding simplificado para usuários convencionais através de **e-mail, redes sociais (Google, Apple, etc.) e passkeys**. Uma carteira não-custodial é gerada automaticamente para o usuário nos bastidores.
- **Autenticação Segura:** Força a autenticação do usuário após a conexão.
- **Customização:** Permite a personalização da aparência para se alinhar à identidade visual da aplicação.

### 2. Auth (SIWE - Sign-In with Ethereum)
Esta é a funcionalidade mais crítica para nossa implementação. Ao habilitá-la no `ConnectButton`, garantimos que:
- Após conectar a carteira ou fazer login com uma rede social, o usuário é **obrigado a assinar uma mensagem** com sua chave privada.
- Esta assinatura prova criptograficamente que o usuário é o dono da conta.
- Garante que cada sessão seja autenticada, impedindo o acesso não autorizado apenas por ter uma carteira conectada. É ideal para proteger rotas de administrador e de usuário.

## 🛠️ Implementação Básica

O exemplo abaixo mostra a estrutura para criar uma página de login simples usando `ConnectButton` com autenticação SIWE habilitada.

### Código de Exemplo (`/login/page.tsx`)

```tsx
'use client';

import { createThirdwebClient } from "thirdweb";
import { ConnectButton, useActiveAccount } from "thirdweb/react";
import { inAppWallet } from "thirdweb/wallets";
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

// 1. Crie o cliente Thirdweb (use a variável de ambiente)
const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID!,
});

// 2. Defina as carteiras que você quer suportar
// - inAppWallet: Para login social e por e-mail.
// - As carteiras externas já vêm por padrão.
const wallets = [
  inAppWallet({
    auth: {
      options: ["email", "google", "apple"], // Especifique os provedores
    },
  }),
];

export default function LoginPage() {
  const account = useActiveAccount();
  const router = useRouter();

  // Redireciona se o usuário já estiver autenticado
  useEffect(() => {
    if (account) {
      router.push('/');
    }
  }, [account, router]);

  return (
    <div>
      <h1>Login</h1>
      <ConnectButton
        client={client}
        wallets={wallets}
        // 3. Habilite a autenticação SIWE
        auth={{
          // O backend irá gerar e verificar a mensagem a ser assinada
          async doBackendSignIn(authResult) {
            // NOTA: Implementação do backend necessária aqui.
            // Por enquanto, podemos simular um sucesso para o frontend funcionar.
            console.log("Auth Result:", authResult);
          }
        }}
        // Outras opções de customização
        theme="dark"
        connectModal={{
          size: "wide",
        }}
      />
    </div>
  );
}
```

## 🔗 Próximos Passos (Plano)

1.  **Criar a Página de Login:** Implementar o código acima no arquivo `src/app/login/page.tsx`.
2.  **Proteger a Rota Principal:** Adicionar uma verificação na página principal (`/`) que redireciona usuários não autenticados para `/login`.
3.  **(Opcional) Backend para SIWE:** Para um ambiente de produção, seria necessário criar um endpoint de API que gere e verifique a mensagem de login do SIWE, como sugerido pela função `doBackendSignIn`. Para o nosso caso inicial, o frontend pode operar sem essa lógica completa. 