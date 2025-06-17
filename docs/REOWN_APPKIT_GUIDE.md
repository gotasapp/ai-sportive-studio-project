# Reown AppKit - Guia Completo

## 📚 Visão Geral

Reown AppKit é um SDK all-in-one gratuito e open-source que oferece conexões de carteira, transações, logins e muito mais. É o gateway oficial para a WalletConnect Network.

## 🚀 Recursos Principais

### ✅ **Recursos Suportados (React/Next.js)**
- **Swaps** (EVM Only) - Troca de tokens
- **On-Ramp** - Compra de crypto com fiat
- **Multichain Modal** - Suporte a múltiplas blockchains
- **Smart Accounts** - Contas inteligentes
- **Notifications** - Notificações nativas Web3
- **Sponsored Transactions** - Transações patrocinadas

### 🌐 **Redes Suportadas**
- **EVM Chains** - Ethereum, Polygon, Arbitrum, etc.
- **Solana** - Blockchain Solana
- **Bitcoin** - Blockchain Bitcoin

### 🔐 **Autenticação**
- **Email & Social Login** - Google, GitHub, Apple, Facebook, X, Discord, Farcaster
- **One-Click Auth** - Autenticação com um clique
- **SIWX** - Sign-In with X

---

## 🛠️ Instalação

```bash
npm install @reown/appkit @reown/appkit-adapter-wagmi wagmi viem @tanstack/react-query
```

### Instalação Web3Inbox (Notificações)
```bash
npm install @web3inbox/core @web3inbox/react
```

---

## ⚙️ Configuração

### 1. **Configuração Base** (`appkit-config.ts`)

```typescript
import { cookieStorage, createStorage } from '@wagmi/core'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { mainnet, arbitrum, polygon } from '@reown/appkit/networks'
import { defineChain } from '@reown/appkit/networks'

// Project ID do Reown Cloud
export const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID

// Definir rede customizada (CHZ Chain)
const chzChain = defineChain({
  id: 88888,
  caipNetworkId: 'eip155:88888',
  chainNamespace: 'eip155',
  name: 'Chiliz Chain',
  nativeCurrency: {
    decimals: 18,
    name: 'Chiliz',
    symbol: 'CHZ',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.ankr.com/chiliz'],
    },
  },
  blockExplorers: {
    default: { name: 'ChilizScan', url: 'https://scan.chiliz.com' },
  },
})

export const networks = [chzChain, mainnet, polygon, arbitrum]

// Wagmi Adapter
export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({ storage: cookieStorage }),
  ssr: true,
  projectId,
  networks
})
```

### 2. **Provider** (`AppKitProvider.tsx`)

```typescript
'use client'

import { createAppKit } from '@reown/appkit/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider, cookieToInitialState } from 'wagmi'

const queryClient = new QueryClient()

// Criar AppKit Modal
const modal = createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks,
  defaultNetwork: networks[0],
  metadata: {
    name: 'Meu App',
    description: 'Descrição do app',
    url: 'https://meuapp.com',
    icons: ['https://meuapp.com/icon.png']
  },
  features: {
    analytics: true,
    email: true,
    socials: ['google', 'github', 'apple', 'facebook'],
    emailShowWallets: true,
  },
  themeMode: 'dark',
  themeVariables: {
    '--w3m-color-mix': '#00d4ff',
    '--w3m-color-mix-strength': 40,
  }
})

function AppKitProvider({ children, cookies }) {
  const initialState = cookieToInitialState(wagmiAdapter.wagmiConfig, cookies)
  
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig} initialState={initialState}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  )
}
```

### 3. **Layout Next.js** (`layout.tsx`)

```typescript
import AppKitProvider from '@/lib/AppKitProvider'
import { headers } from 'next/headers'

export default async function RootLayout({ children }) {
  const headersObj = await headers()
  const cookies = headersObj.get('cookie')

  return (
    <html lang="en">
      <body>
        <AppKitProvider cookies={cookies}>
          {children}
        </AppKitProvider>
      </body>
    </html>
  )
}
```

### 4. **Next.js Config** (`next.config.js`)

```javascript
const nextConfig = {
  webpack: (config) => {
    config.externals.push("pino-pretty", "lokijs", "encoding");
    return config;
  },
}
```

---

## 🎣 Hooks Principais

### **useAppKit** - Controle do Modal
```typescript
import { useAppKit } from '@reown/appkit/react'

const { open, close } = useAppKit()

// Abrir modal
open({ view: 'Connect' })      // Conectar carteira
open({ view: 'Account' })      // Conta do usuário
open({ view: 'Networks' })     // Selecionar rede
```

### **useAppKitAccount** - Informações da Conta
```typescript
import { useAppKitAccount } from '@reown/appkit/react'

const { 
  address,           // Endereço da carteira
  isConnected,       // Status de conexão
  caipAddress,       // Endereço no formato CAIP
  status             // Status: 'connected' | 'disconnected' | 'connecting' | 'reconnecting'
} = useAppKitAccount()
```

### **useAppKitNetwork** - Informações da Rede
```typescript
import { useAppKitNetwork } from '@reown/appkit/react'

const { 
  caipNetwork,       // Informações da rede atual
  caipNetworkId,     // ID da rede no formato CAIP
  chainId,           // Chain ID
  switchNetwork      // Função para trocar de rede
} = useAppKitNetwork()
```

### **useAppKitState** - Estado do Modal
```typescript
import { useAppKitState } from '@reown/appkit/react'

const { 
  initialized,       // AppKit inicializado?
  loading,           // Carregando?
  open,              // Modal aberto?
  selectedNetworkId, // Rede selecionada
  activeChain        // Chain ativa ('eip155', 'solana', 'bip122')
} = useAppKitState()
```

---

## 🎨 Componentes Web

### **Botões de Conexão**
```html
<!-- Botão principal -->
<appkit-button />

<!-- Botão de conta -->
<appkit-account-button />

<!-- Botão de conectar -->
<appkit-connect-button />

<!-- Botão de rede -->
<appkit-network-button />
```

### **Botões de Carteira Específica**
```bash
npm install @reown/appkit-wallet-button
```

```html
<!-- Carteiras específicas -->
<appkit-wallet-button wallet="metamask" />
<appkit-wallet-button wallet="coinbase" />
<appkit-wallet-button wallet="walletConnect" />

<!-- Logins sociais -->
<appkit-wallet-button wallet="google" />
<appkit-wallet-button wallet="github" />
<appkit-wallet-button wallet="email" />
```

---

## 🔔 Web3Inbox - Notificações

### **Instalação**
```bash
npm install @web3inbox/core @web3inbox/react
```

### **Inicialização**
```typescript
import { initWeb3InboxClient } from '@web3inbox/react'

initWeb3InboxClient({
  projectId: 'seu-project-id',
  domain: 'meuapp.com',
  allApps: false // true para acesso a todas as notificações
})
```

### **Hooks de Notificações**
```typescript
import { 
  useWeb3InboxAccount,
  usePrepareRegistration,
  useRegister,
  useSubscribe,
  useNotifications
} from '@web3inbox/react'

// Gerenciar conta
const { isRegistered } = useWeb3InboxAccount('eip155:1:0x...')

// Registrar para notificações
const { prepareRegistration } = usePrepareRegistration()
const { register } = useRegister()

// Inscrever-se
const { subscribe } = useSubscribe()

// Receber notificações
const { data: notifications } = useNotifications(5)
```

---

## 🎯 Recursos Avançados

### **Smart Accounts**
```typescript
const modal = createAppKit({
  // ...
  defaultAccountTypes: { 
    eip155: "smartAccount" // ou "eoa"
  }
})
```

### **Swaps**
```typescript
// Abrir modal de swap
open({
  view: 'Swap',
  arguments: {
    amount: '321.123',
    fromToken: 'USDC',
    toToken: 'ETH'
  }
})
```

### **On-Ramp**
```typescript
// Usuário pode comprar crypto diretamente no modal
// Suporte para Coinbase e Meld
features: {
  onramp: true
}
```

### **Customização de Tema**
```typescript
const modal = createAppKit({
  themeMode: 'dark', // 'light' | 'dark'
  themeVariables: {
    '--w3m-color-mix': '#00BB7F',
    '--w3m-color-mix-strength': 40,
    '--w3m-font-family': 'Arial',
    '--w3m-border-radius-master': '8px'
  }
})
```

---

## 🌍 Variáveis de Ambiente

```env
# Obrigatório - Project ID do Reown Cloud
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your-project-id

# Opcional - Domínio para notificações
NEXT_PUBLIC_APP_DOMAIN=localhost:3000

# Opcional - Analytics
NEXT_PUBLIC_ENABLE_ANALYTICS=true
```

---

## 📝 Exemplos Práticos

### **Componente de Header**
```typescript
import { useAppKit, useAppKitAccount, useAppKitNetwork } from '@reown/appkit/react'

export default function Header() {
  const { open } = useAppKit()
  const { address, isConnected } = useAppKitAccount()
  const { caipNetwork } = useAppKitNetwork()

  return (
    <header>
      {isConnected ? (
        <div>
          <span>{caipNetwork?.name}</span>
          <span>{address?.slice(0, 6)}...{address?.slice(-4)}</span>
          <button onClick={() => open({ view: 'Account' })}>
            Account
          </button>
        </div>
      ) : (
        <button onClick={() => open({ view: 'Connect' })}>
          Connect Wallet
        </button>
      )}
    </header>
  )
}
```

---

## 🚨 Troubleshooting

### **Problemas Comuns**

1. **Project ID não definido**
   ```
   Error: NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is not defined
   ```
   - Verificar se a variável de ambiente está configurada
   - Obter Project ID em https://cloud.reown.com/

2. **Dependências conflitantes**
   - Remover pacotes antigos do WalletConnect
   - Usar apenas `@reown/appkit` e adaptadores oficiais

3. **SSR Issues**
   - Usar `cookieStorage` no WagmiAdapter
   - Configurar `ssr: true`
   - Passar cookies do servidor para o cliente

### **Pacotes para Remover** (se existirem)
```bash
npm uninstall @walletconnect/ethereum-provider @walletconnect/modal @walletconnect/universal-provider
```

---

## 🔗 Links Úteis

- **Dashboard**: https://cloud.reown.com/
- **Documentação**: https://docs.reown.com/appkit
- **Exemplos**: https://github.com/reown-com/appkit
- **Web3Inbox**: https://web3inbox.com/

---

## 📊 Roadmap de Implementação

1. ✅ **Setup Básico** - Configuração e conexão de carteiras
2. 🔄 **Notificações** - Web3Inbox para notificar drops de NFT
3. 📋 **Smart Accounts** - Contas inteligentes para melhor UX
4. 📋 **Swaps** - Permitir troca de tokens no app
5. 📋 **On-Ramp** - Compra de crypto com fiat

---

*Última atualização: Dezembro 2024* 