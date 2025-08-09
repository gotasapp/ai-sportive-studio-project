# 🏪 Suporte para Múltiplos Contratos no Marketplace

## 📋 Resumo das Mudanças

Este documento descreve as mudanças implementadas para suportar múltiplos contratos NFT no marketplace, incluindo contratos legacy e contratos do launchpad.

## 🎯 Problema Original

O marketplace estava filtrado para aceitar apenas listagens do contrato legacy:
- `0xfF973a4aFc5A96DEc81366461A461824c4f80254`

Isso impedia que NFTs dos novos contratos do launchpad fossem listados, vendidos ou comprados no marketplace.

## ✅ Solução Implementada

### 1. **Configuração Centralizada de Contratos**

No arquivo `src/lib/marketplace-config.ts`:

```typescript
// Contratos NFT Legacy
export const NFT_CONTRACTS = {
  [polygonAmoy.id]: '0xfF973a4aFc5A96DEc81366461A461824c4f80254',
} as const;

// Contratos Launchpad
export const LAUNCHPAD_CONTRACTS = {
  [polygonAmoy.id]: '0xfB233A36196a2a4513DB6b7d70C90ecaD0Eec639',
} as const;

// Funções Helper
export function getSupportedContractAddresses(chainId: number): string[] {
  const contracts: string[] = [];
  
  if (NFT_CONTRACTS[chainId]) {
    contracts.push(NFT_CONTRACTS[chainId]);
  }
  
  if (LAUNCHPAD_CONTRACTS[chainId]) {
    contracts.push(LAUNCHPAD_CONTRACTS[chainId]);
  }
  
  return contracts;
}

export function isSupportedContract(contractAddress: string, chainId: number): boolean {
  const supportedAddresses = getSupportedContractAddresses(chainId);
  return supportedAddresses.some(
    addr => addr.toLowerCase() === contractAddress.toLowerCase()
  );
}
```

### 2. **APIs Atualizadas**

#### `/api/marketplace/listings`
```typescript
// Antes: Filtrava apenas contrato legacy
const filteredListings = validListings.filter(listing => 
  listing.assetContractAddress.toLowerCase() === ourContractAddress
);

// Depois: Aceita todos os contratos suportados
const supportedContracts = getSupportedContractAddresses(polygonAmoy.id);
const filteredListings = validListings.filter(listing => 
  supportedContracts.some(contract => 
    listing.assetContractAddress.toLowerCase() === contract.toLowerCase()
  )
);
```

#### `/api/marketplace/sync-listings`
```typescript
// Antes: Hardcoded para contrato específico
if (listing.assetContractAddress.toLowerCase() !== '0xff973a4afc5a96dec81366461a461824c4f80254') {
  continue;
}

// Depois: Verifica se é contrato suportado
if (!isSupportedContract(listing.assetContractAddress, polygonAmoy.id)) {
  continue;
}
```

### 3. **Fluxo de Transações**

O marketplace agora suporta transações com NFTs de qualquer contrato suportado:

1. **Listar NFT**
   ```typescript
   const listingParams = {
     assetContract: nft.contractAddress, // Pode ser legacy ou launchpad
     tokenId: nft.tokenId,
     pricePerToken: price,
     // ... outros parâmetros
   };
   ```

2. **Comprar NFT**
   - O marketplace identifica automaticamente o contrato do NFT
   - Executa a transferência usando o contrato correto

3. **Atualizar Preço**
   - Funciona para qualquer NFT listado, independente do contrato

## 🔧 Como Adicionar Novos Contratos

Para adicionar suporte a um novo contrato:

1. **Adicionar ao arquivo de configuração:**
   ```typescript
   export const NEW_CONTRACTS = {
     [polygonAmoy.id]: '0x...novo_endereco...',
   } as const;
   ```

2. **Atualizar `getSupportedContractAddresses`:**
   ```typescript
   if (NEW_CONTRACTS[chainId]) {
     contracts.push(NEW_CONTRACTS[chainId]);
   }
   ```

## 🚀 Benefícios

1. **Flexibilidade**: Suporta múltiplos tipos de contratos
2. **Escalabilidade**: Fácil adicionar novos contratos
3. **Compatibilidade**: Mantém suporte aos contratos existentes
4. **Centralização**: Configuração em um único lugar

## 📊 Contratos Atualmente Suportados

### Polygon Amoy (Chain ID: 80002)

#### Contratos Estáticos
- **NFT Legacy**: `0xfF973a4aFc5A96DEc81366461A461824c4f80254`
- **Launchpad Base**: `0xfB233A36196a2a4513DB6b7d70C90ecaD0Eec639`
- **Marketplace**: `0x723436a84d57150A5109eFC540B2f0b2359Ac76d`

#### Contratos Dinâmicos (Coleções Launchpad)
Cada coleção do launchpad tem seu próprio contrato deployado. Exemplos:
- `0x3315923347CA2d2816B8E798F8E2b4c8f219E928`
- Outros contratos são adicionados dinamicamente conforme novas coleções são criadas

## ⚠️ Considerações Importantes

1. **Aprovações**: Cada contrato NFT precisa aprovar o marketplace para transferências
2. **Metadata**: Diferentes contratos podem ter estruturas de metadata diferentes
3. **Eventos**: O marketplace emite eventos para todos os contratos suportados

## 🧪 Testando

Para testar se um NFT de um novo contrato funciona:

1. Mintar NFT no novo contrato
2. Listar no marketplace
3. Verificar se aparece em `/api/marketplace/listings`
4. Testar compra/venda
5. Verificar atualização de preços

### Debug de Contratos Suportados
Use o endpoint de debug para verificar quais contratos estão sendo reconhecidos:
```
GET /api/debug/supported-contracts
```

Isso retornará:
- Contratos estáticos configurados
- Contratos dinâmicos das coleções launchpad
- Lista completa de todos os contratos suportados

## 📝 Próximos Passos

1. **Contratos Dinâmicos**: Implementar sistema para adicionar contratos via UI admin
2. **Validação**: Adicionar validação de contratos ERC-721/ERC-1155
3. **Analytics**: Separar métricas por contrato
4. **UI**: Mostrar origem do contrato nos NFTs