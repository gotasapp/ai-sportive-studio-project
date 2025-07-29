# 🚀 Launchpad Contract Deploy Guide - SignatureMintERC721

Este guia explica como fazer o deploy do contrato **SignatureMintERC721** específico para o Launchpad, que permite minting com a mesma metadata para qualquer wallet.

## 🎯 Por que SignatureMintERC721?

**Problema:** Coleções tradicionais ERC721 têm metadata única por token, mas o Launchpad precisa de coleções onde todos os NFTs têm a **mesma metadata** mas podem ser mintados para **qualquer wallet**.

**Solução:** **SignatureMintERC721** permite:
- ✅ **Mesma metadata** para todos os NFTs da coleção
- ✅ **Minting para qualquer wallet** via signature
- ✅ **Controle de preço** por mint
- ✅ **Validação de tempo** (signature expira)
- ✅ **Gasless minting** via Thirdweb Engine

## 📋 Pré-requisitos

1. ✅ Conta no [Thirdweb Dashboard](https://thirdweb.com/dashboard)
2. ✅ Client ID do Thirdweb configurado
3. ✅ Wallet conectada com CHZ tokens
4. ✅ CHZ Chain adicionada ao MetaMask

## 🔧 Deploy do Contrato

### 1. Acessar Thirdweb Dashboard

**URL:** https://thirdweb.com/explore/pre-built-contracts

### 2. Selecionar SignatureMintERC721

1. **Clique em "Deploy"**
2. **Procure por "SignatureMintERC721"** na lista de contratos
3. **Selecione o contrato**

### 3. Configurações do Contrato

```yaml
Contract Name: AI Sports Launchpad Collection
Symbol: AISLPD
Description: AI-generated sports NFT collection for Launchpad with signature-based minting
Image: [Upload project logo]
External Link: https://your-domain.com
Fee Recipient: [Your wallet address]
Seller Fee Basis Points: 1000 (10% royalty)
```

### 4. Configurações Avançadas

```yaml
Primary Sale Recipient: [Your wallet address]
Platform Fee Recipient: [Your wallet address]
Platform Fee Basis Points: 250 (2.5%)
```

### 5. Deploy Settings

```yaml
Network: Custom (CHZ Chain - 88888)
Deployer: [Your wallet address]
Gas Limit: Auto
```

## 🔧 Configuração Pós-Deploy

### 1. Verificar Contrato

Após o deploy, verifique no explorador se tem estas funções:
- ✅ `mintWithSignature(payload, signature)`
- ✅ `generateMintSignature(to, metadata, price, currency, validityStartTimestamp, validityEndTimestamp)`
- ✅ `tokenURI(uint256 tokenId)`
- ✅ `ownerOf(uint256 tokenId)`

### 2. Configurar Variáveis de Ambiente

Adicione no `.env.local`:

```env
# Launchpad Contract (SignatureMintERC721)
NEXT_PUBLIC_LAUNCHPAD_CONTRACT_ADDRESS=0x... # Endereço do contrato deployado

# Thirdweb Configuration
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=your-actual-client-id
THIRDWEB_SECRET_KEY=your-actual-secret-key
BACKEND_WALLET_ADDRESS=your-backend-wallet-address

# Chain Configuration
NEXT_PUBLIC_POLYGON_AMOY_RPC_URL=https://rpc-amoy.polygon.technology
```

### 3. Configurar Permissões

No Thirdweb Dashboard, configure as permissões:

```yaml
DEFAULT_ADMIN_ROLE: [Your wallet]
MINTER_ROLE: [Your wallet, Backend wallet address]
SIGNER_ROLE: [Your wallet, Backend wallet address]
PAUSER_ROLE: [Your wallet]
```

## 🎯 Funcionalidades do Contrato

### 1. Signature Generation

```typescript
// Gerar signature para mint
const { payload, signature } = await generateMintSignature({
  contract,
  to: userAddress,
  metadata: {
    name: "AI Sports Jersey #1",
    description: "Unique AI-generated sports jersey",
    image: "ipfs://...",
    attributes: [...]
  },
  price: "0.1", // Preço em CHZ
  currency: "0x0000000000000000000000000000000000000000", // Native token
  validityStartTimestamp: new Date(),
  validityEndTimestamp: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 horas
});
```

### 2. Mint com Signature

```typescript
// Mint usando signature
const transaction = mintWithSignature({
  contract,
  payload,
  signature,
});

const result = await transaction.send();
console.log('Token ID:', result.tokenId);
```

### 3. Validações Automáticas

O contrato valida automaticamente:
- ✅ **Signature válida** (não expirada)
- ✅ **Preço correto** (deve pagar o preço especificado)
- ✅ **Wallet autorizada** (qualquer wallet pode mintar)
- ✅ **Metadata consistente** (mesma para todos os NFTs)

## 🔧 Integração com o Sistema

### 1. Hook Personalizado

```typescript
// src/lib/useLaunchpadContract.ts
export function useLaunchpadContract() {
  const mintLaunchpadNFT = useCallback(async (request) => {
    // Implementação do mint via API
  }, []);
  
  return { mintLaunchpadNFT };
}
```

### 2. API Endpoint

```typescript
// src/app/api/launchpad/mint/route.ts
export async function POST(request: NextRequest) {
  // 1. Validar coleção no MongoDB
  // 2. Gerar signature
  // 3. Mint via Engine
  // 4. Atualizar contadores
}
```

### 3. Frontend Integration

```typescript
// src/app/launchpad/[collectionId]/page.tsx
const { mintLaunchpadNFT } = useLaunchpadContract();

const handleMint = async () => {
  const result = await mintLaunchpadNFT({
    to: address,
    metadataUri: ipfsUrl,
    collectionId: collection._id,
    price: collection.price,
    quantity: mintQuantity,
  });
};
```

## 🧪 Testing

### 1. Testnet Deploy (Recomendado)

```yaml
Network: CHZ Spicy Testnet (Chain ID: 88882)
RPC URL: https://spicy-rpc.chiliz.com
Explorer: https://spicy.chzscan.com
```

### 2. Teste de Funcionalidades

1. **Deploy contrato no testnet**
2. **Configure variáveis de ambiente**
3. **Teste signature generation**
4. **Teste mint com signature**
5. **Teste validações de preço**
6. **Teste expiração de signature**

### 3. Teste de Integração

```bash
# Testar API endpoint
curl -X POST http://localhost:3000/api/launchpad/mint \
  -H "Content-Type: application/json" \
  -d '{
    "to": "0x...",
    "metadataUri": "ipfs://...",
    "collectionId": "...",
    "price": "0.1"
  }'
```

## 🚨 Troubleshooting

### Erro: "Contract not found"
- Verifique se o endereço está correto no `.env.local`
- Confirme que está na rede CHZ Chain (88888)

### Erro: "Invalid signature"
- Verifique se a signature não expirou
- Confirme que o preço está correto
- Verifique se a metadata está no formato correto

### Erro: "Insufficient funds"
- Verifique saldo de CHZ na wallet
- Confirme que está pagando o preço correto

### Erro: "Not authorized to mint"
- Verifique permissões SIGNER_ROLE no contrato
- Confirme que a signature foi gerada pelo signer correto

## 📊 Monitoramento

### 1. Eventos do Contrato

```typescript
// Eventos importantes para monitorar
Transfer(address indexed from, address indexed to, uint256 indexed tokenId)
MintWithSignature(address indexed to, uint256 indexed tokenId, string metadata)
```

### 2. Webhooks

Configure webhooks para:
- ✅ **Mint successful**
- ✅ **Transfer events**
- ✅ **Signature generation**

## ✅ Checklist Final

- [ ] SignatureMintERC721 contract deployado na CHZ Chain
- [ ] Contrato configurado no `.env.local`
- [ ] Permissões configuradas (SIGNER_ROLE)
- [ ] API endpoint implementado
- [ ] Hook personalizado criado
- [ ] Frontend integrado
- [ ] Testado signature generation
- [ ] Testado mint com signature
- [ ] Testado validações de preço
- [ ] Testado expiração de signature
- [ ] Webhooks configurados

## 🔗 Links Úteis

- [Thirdweb Dashboard](https://thirdweb.com/dashboard)
- [SignatureMintERC721 Docs](https://portal.thirdweb.com/contracts/pre-built-contracts/signature-mint-erc721)
- [CHZ Chain Explorer](https://scan.chiliz.com)
- [CHZ Spicy Testnet Faucet](https://faucet.chiliz.com)

---

**⚠️ Importante:** 
- Mantenha suas chaves privadas seguras
- Teste sempre no testnet primeiro
- Monitore os eventos do contrato
- Configure webhooks para tracking 