# Sistema de Mint de Coleções - Documentação Completa

## 📋 Visão Geral

Este documento detalha a implementação completa do sistema de mint de coleções NFT que permite aos usuários criar e mintar múltiplas NFTs em um único contrato DropERC721, com integração completa ao marketplace.

## 🎯 Objetivo

Implementar um sistema "smart mint" que:
- **Quantidade = 1**: Mint individual no contrato existente
- **Quantidade > 1**: Deploy automático de novo contrato DropERC721 + mint da coleção completa

## 🔧 Arquitetura do Sistema

### Componentes Principais

1. **BatchMintDialog** (`src/components/ui/batch-mint-dialog.tsx`)
   - Interface principal do usuário
   - Lógica de mint inteligente
   - Gerenciamento de estados das etapas

2. **IPFSService** (`src/lib/services/ipfs-service.ts`)
   - Upload de imagens e metadata para IPFS/Pinata
   - Criação de metadata NFT padrão

3. **ProfessionalActionBar** (`src/components/editor/ProfessionalActionBar.tsx`)
   - Integração com editores (Jersey, Stadium, Badge)
   - Passagem de dados para BatchMintDialog

## 📊 Fluxo de Execução

### Para Quantidade = 1 (Mint Individual)
```
Usuário clica "Mint 1 NFT"
    ↓
Usa batchMintGasless() existente
    ↓
Mint no contrato atual
    ↓
Fim
```

### Para Quantidade > 1 (Coleção)
```
Usuário clica "Create Collection & Mint X NFTs"
    ↓
ETAPA 1: Deploy DropERC721 Contract
    ↓
ETAPA 2: Configure Claim Conditions
    ↓
ETAPA 3: Lazy Mint + Claim NFTs
    ↓
ETAPA 4: Upload IPFS + Cloudinary + Save DB
    ↓
Fim
```

## 🔄 Etapas Detalhadas (Quantidade > 1)

### ETAPA 1: Deploy do Contrato DropERC721

**Responsável**: Usuário (assina transação)
**Localização**: `handleDeployAndMintCollection()`

```typescript
const newContractAddress = await deployERC721Contract({
  client,
  chain: amoyChain, // Polygon Amoy
  account,
  type: "DropERC721",
  params: {
    name: `${collection?.toUpperCase()} Collection #${Date.now()}`,
    symbol: `${collection?.toUpperCase()}${Date.now()}`,
    description: `AI Collection of ${quantity} NFTs with shared metadata`,
    image: 'https://gateway.pinata.cloud/ipfs/[CID]',
    primary_sale_recipient: account.address,
    royalty_recipient: account.address,
    royalty_bps: 500, // 5%
  },
});
```

**Resultado**: Novo contrato DropERC721 deployado na blockchain

### ETAPA 2: Configuração de Claim Conditions

**Responsável**: Usuário (assina transação)
**Localização**: `handleDeployAndMintCollection()`

```typescript
const claimConditionTx = setClaimConditions({
  contract,
  phases: [{
    startTime: new Date(),
    maxClaimableSupply: BigInt(quantity),
    maxClaimablePerWallet: BigInt(quantity),
    price: "0", // Grátis
    currency: "0x0000000000000000000000000000000000000000", // Native token
  }],
});
```

**Resultado**: Contrato configurado para permitir claim público de X NFTs

### ETAPA 3: Lazy Mint + Claim

#### 3A: Lazy Mint
**Responsável**: Usuário (assina transação)

```typescript
const lazyMintTx = lazyMint({
  contract,
  nfts: Array(quantity).fill({
    name: `${collection?.toUpperCase()} #`,
    description: `AI Generated ${collection} NFT`,
    image: 'https://gateway.pinata.cloud/ipfs/[CID]',
  }),
});
```

#### 3B: Claim NFTs
**Responsável**: Usuário (assina transação)

```typescript
const mintTransaction = claimTo({
  contract,
  to: account.address,
  quantity: BigInt(quantity),
});
```

**Resultado**: X NFTs mintadas para o usuário

### ETAPA 4: Upload e Salvamento

**Responsável**: Sistema (automático)
**Localização**: `handleDeployAndMintCollection()`

#### 4A: Upload para Cloudinary
```typescript
const formData = new FormData();
formData.append('file', generatedImageBlob, `${collection}_collection_${Date.now()}.png`);

const uploadResponse = await fetch('/api/upload', {
  method: 'POST',
  body: formData,
});
```

#### 4B: Upload para IPFS/Pinata
```typescript
const ipfsResult = await IPFSService.uploadComplete(
  generatedImageBlob,
  collectionName,
  collectionDescription,
  collection || 'AI Collection',
  'DropERC721',
  'Collection',
  quantity.toString()
);
```

#### 4C: Salvamento no MongoDB
```typescript
const saveResponse = await fetch('/api/jerseys', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: `${collection?.toUpperCase()} Collection #${Date.now()}`,
    description: `AI Generated ${collection} collection with ${quantity} NFTs`,
    imageUrl: cloudinaryUrl, // Para display rápido
    cloudinaryPublicId: cloudinaryPublicId,
    metadataUri: ipfsMetadataUrl, // IPFS metadata
    creatorWallet: account.address,
    transactionHash: mintResult.transactionHash,
    // ... outros dados
  })
});
```

## 🛠️ Configurações Técnicas

### Blockchain & RPC
- **Rede**: Polygon Amoy Testnet (Chain ID: 80002)
- **RPC**: `https://rpc.ankr.com/polygon_amoy/5b2d60918c8135da4798d0d735c2b2d483d3e3d8992ab6cf34c53b0fd81803ef`
- **Tipo de Contrato**: DropERC721 (NFT Drop)

### Armazenamento
- **IPFS**: Pinata Gateway (`process.env.NEXT_PUBLIC_PINATA_GATEWAY`)
- **Cloudinary**: Upload via `/api/upload`
- **Database**: MongoDB (`jerseys` collection)

### Autenticação
- **Client ID**: `process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID`
- **Wallet**: Thirdweb v5 SDK (`useActiveAccount`)

## 📱 Interface do Usuário

### Estados da Interface

1. **idle**: Pronto para iniciar
2. **preparing**: Preparando deploy
3. **signing-deploy**: Usuário assinando deploy
4. **deployed**: Contrato deployado
5. **setting-claims**: Configurando claim conditions
6. **signing-mint**: Usuário assinando mint
7. **completed**: Processo concluído

### Indicadores Visuais

```tsx
<div className="space-y-2">
  <div className="flex items-center gap-2 text-xs">
    {deployStep === 'completed' ? '✅' : '🔄'}
    <span>Step 1: Deploy collection contract</span>
  </div>
  <div className="flex items-center gap-2 text-xs">
    {deployStep === 'completed' ? '✅' : '🔄'}
    <span>Step 2: Configure collection settings</span>
  </div>
  <div className="flex items-center gap-2 text-xs">
    {deployStep === 'completed' ? '✅' : '🔄'}
    <span>Step 3: Prepare & claim {quantity} NFTs</span>
  </div>
</div>
```

## 🔍 Tratamento de Erros

### Retry Logic
Para problemas de timing na blockchain:

```typescript
let claimAttempts = 0;
const maxAttempts = 3;

while (claimAttempts < maxAttempts) {
  try {
    const mintResult = await sendTransaction({
      transaction: mintTransaction,
      account,
    });
    break; // Sucesso
  } catch (claimError) {
    claimAttempts++;
    if (claimAttempts >= maxAttempts) {
      throw claimError;
    }
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}
```

### Timeouts
```typescript
const deployPromise = deployERC721Contract({...});
const timeoutPromise = new Promise((_, reject) => {
  setTimeout(() => reject(new Error('Deploy timeout after 2 minutes')), 120000);
});

const result = await Promise.race([deployPromise, timeoutPromise]);
```

## 📊 Estrutura de Dados

### Metadata NFT (IPFS)
```json
{
  "name": "JERSEYS Collection #1703542800000",
  "description": "AI Generated jerseys collection with 3 NFTs. Each NFT shares the same metadata and artwork.",
  "image": "https://gateway.pinata.cloud/ipfs/QmXXX...",
  "attributes": [
    {
      "trait_type": "Team",
      "value": "AI Collection"
    },
    {
      "trait_type": "Style", 
      "value": "DropERC721"
    }
  ],
  "properties": {
    "created_by": "AI Generator",
    "created_at": "2024-01-01T00:00:00.000Z",
    "team": "AI Collection",
    "style": "DropERC721"
  }
}
```

### Dados do MongoDB
```json
{
  "name": "JERSEYS Collection #1703542800000",
  "description": "AI Generated jerseys collection with 3 NFTs",
  "imageUrl": "https://res.cloudinary.com/xxx/image/upload/xxx",
  "cloudinaryPublicId": "collection_jerseys_3_1703542800000",
  "prompt": "{\"type\":\"batch_collection\",\"collection\":\"jerseys\",\"quantity\":3,\"contractAddress\":\"0x...\"}",
  "creatorWallet": "0xEf381c5fB1697b0f21F99c7A7b546821cF481B56",
  "transactionHash": "0x53d37932147bab67d59d3ba2cf0f14b9b87ba08142858868b8c3cd1827a30a5e",
  "metadataUri": "https://gateway.pinata.cloud/ipfs/QmXXX...",
  "attributes": [
    { "trait_type": "Type", "value": "AI Collection" },
    { "trait_type": "Quantity", "value": "3" },
    { "trait_type": "Collection", "value": "jerseys" },
    { "trait_type": "Contract Type", "value": "DropERC721" }
  ],
  "tags": ["ai_generated", "batch_collection", "drop_erc721"],
  "metadata": {
    "generationMode": "batch_collection",
    "quantity": 3,
    "chainId": 80002,
    "contractAddress": "0x...",
    "tokenId": 0,
    "collectionType": "DropERC721",
    "deployedAt": "2024-01-01T00:00:00.000Z",
    "ipfsImageUrl": "https://gateway.pinata.cloud/ipfs/QmXXX...",
    "ipfsMetadataUrl": "https://gateway.pinata.cloud/ipfs/QmYYY...",
    "cloudinaryUrl": "https://res.cloudinary.com/xxx/image/upload/xxx"
  },
  "createdAt": "2024-01-01T00:00:00.000Z",
  "status": "Approved",
  "mintCount": 0,
  "editionSize": 100
}
```

## 🚀 Benefícios do Sistema

### Para Usuários
- **Simplicidade**: Um botão para tudo
- **Transparência**: Progresso visual das etapas
- **Flexibilidade**: Funciona com qualquer wallet
- **Economia**: Apenas 2-3 assinaturas necessárias

### Para o Sistema
- **Escalabilidade**: Cada coleção tem seu próprio contrato
- **Integração**: Funciona com marketplace existente
- **Compatibilidade**: Mesmo padrão do mint legacy
- **Rastreabilidade**: Todos os dados salvos e linkados

## 🔧 Manutenção e Debug

### Logs Importantes
```typescript
console.log('🔄 ETAPA 1: Deploying new DropERC721 contract...');
console.log('✅ ETAPA 1 completed - Contract deployed:', newContractAddress);
console.log('🔄 ETAPA 2: Setting up claim conditions...');
console.log('✅ ETAPA 2 completed - Claim conditions configured');
console.log('🔄 ETAPA 3: Lazy minting tokens...');
console.log('✅ ETAPA 3A completed - Tokens lazy minted');
console.log('🔄 ETAPA 3B: User claiming NFTs...');
console.log('✅ ETAPA 3 completed - NFTs claimed:', mintResult.transactionHash);
console.log('💾 Uploading and saving collection...');
console.log('✅ Collection saved to database:', saveResult);
console.log('🎉 Collection deployed, minted and saved successfully!');
```

### Verificações de Status
- **Contract Address**: Verificar no PolygonScan
- **Transaction Hash**: Confirmar na blockchain
- **IPFS URLs**: Testar acesso via gateway
- **Cloudinary URLs**: Verificar imagens carregam
- **MongoDB**: Confirmar dados salvos corretamente

## 📈 Métricas e Analytics

### Dados Rastreados
- Tempo total do processo
- Taxa de sucesso por etapa
- Contratos deployados
- Volume de NFTs mintadas
- Uso por tipo de coleção (jerseys/stadiums/badges)

### Pontos de Monitoramento
- Falhas na ETAPA 1 (deploy)
- Timeouts na ETAPA 3 (claim)
- Erros de upload (ETAPA 4)
- Performance do RPC Ankr

## 🛡️ Segurança

### Validações
- Wallet conectada antes de iniciar
- Quantidade entre 1-100
- Blob de imagem disponível
- Chaves de API configuradas

### Limites
- **Quantidade máxima**: 100 NFTs por coleção
- **Timeout**: 2 minutos para deploy
- **Retry**: Máximo 3 tentativas para claim
- **Arquivo**: Limitado pelo Cloudinary/IPFS

## 🔄 Atualizações Futuras

### Melhorias Planejadas
1. **Metadata customizada** por NFT na coleção
2. **Preços variados** em claim conditions
3. **Whitelist support** para drops exclusivos
4. **Batch operations** para grandes volumes
5. **Cross-chain deployment** (outras redes)

### Otimizações
1. **Cache de uploads** para imagens repetidas
2. **Compressão automática** antes do upload
3. **Parallel processing** das etapas onde possível
4. **Gas optimization** nas transações

---

## 📝 Changelog

**v1.0.0** - Sistema inicial implementado
- Deploy DropERC721 via Thirdweb v5
- Integração IPFS + Cloudinary + MongoDB
- Interface com progresso visual
- Retry logic e error handling
- Compatibilidade com marketplace existente

---

*Documentação criada em: 2024*
*Última atualização: 2024*
*Versão do sistema: 1.0.0*