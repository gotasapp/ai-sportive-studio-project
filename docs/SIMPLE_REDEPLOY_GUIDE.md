# 🚀 Guia Simples: Novo Deploy ERC721 com TokenURI

## ❌ Problema Atual
Seu contrato atual `0x7822698cE3728Ccd54e36E60c413a70b665A1407` só tem:
- `freezeBatchURI`
- `setContractURI` 
- `updateBatchURI`

**Falta:** `tokenURI(uint256 tokenId)` para NFTs individuais.

## ✅ Solução Simples

### Opção 1: Deploy NFT Collection (Recomendado)

1. **Acesse:** https://thirdweb.com/explore/pre-built-contracts/nft-collection

2. **Configure:**
```
Contract Name: AI Sports NFT Collection
Symbol: AISNFT
Description: AI-generated sports NFT collection
Image: [Upload logo]
External Link: https://your-domain.com
Fee Recipient: [Your wallet]
Seller Fee Basis Points: 1000 (10% royalty)
```

3. **Deploy Settings:**
- Network: Polygon Amoy Testnet (80002)
- Deployer: [Your wallet]

4. **Funções Esperadas Após Deploy:**
- ✅ `tokenURI(uint256 tokenId)`
- ✅ `mintTo(address to, string memory uri)`
- ✅ `safeMint(address to, string memory uri)`
- ✅ `setTokenURI(uint256 tokenId, string memory uri)`

### Opção 2: Deploy Token ERC721 (Alternativa)

1. **Acesse:** https://thirdweb.com/explore/pre-built-contracts/token

2. **Selecione:** ERC721 Token

3. **Configure os mesmos parâmetros**

## 🔧 Pós-Deploy

### 1. Atualizar .env.local
```env
# Novo contrato
NEXT_PUBLIC_NFT_DROP_CONTRACT_POLYGON_TESTNET=0xNOVO_ENDERECO_AQUI

# Manter o antigo como backup
NEXT_PUBLIC_NFT_DROP_CONTRACT_LEGACY=0x7822698cE3728Ccd54e36E60c413a70b665A1407
```

### 2. Testar Funções

Após deploy, teste no explorer se tem:

**✅ Funções Necessárias:**
- `name()` - Nome do contrato
- `symbol()` - Símbolo do contrato
- `tokenURI(uint256 tokenId)` - **IMPORTANTE!**
- `mintTo(address to, string memory uri)` - Para minting
- `ownerOf(uint256 tokenId)` - Owner do token
- `balanceOf(address owner)` - Balance do owner

**❌ Se só tiver estas, é contrato errado:**
- `batchURI`
- `setContractURI`
- `updateBatchURI`

### 3. Lazy Mint (Se Necessário)

Alguns contratos precisam de lazy mint:

```javascript
// Se o contrato tiver lazyMint, faça:
await contract.call('lazyMint', [
  100, // quantidade
  'ipfs://base-uri/', // base URI (opcional)
  '0x' // encrypted data (vazio)
]);
```

## 🎯 Qual Contrato Escolher?

### NFT Collection (Recomendado)
- ✅ `tokenURI` individual
- ✅ `mintTo` simples
- ✅ Metadata flexível
- ✅ OpenSea compatível

### Token ERC721
- ✅ `tokenURI` individual  
- ✅ `safeMint` padrão
- ✅ Mais básico

### ❌ NFT Drop (Atual)
- ❌ Só `batchURI`
- ❌ Complicado para metadata individual

## 🔄 Migração do Código

Sua função `mintNFTWithMetadata` já deve funcionar com o novo contrato:

```typescript
// Já funciona:
const tx = await contract.call('mintTo', [address, metadataUrl]);

// Ou:
const tx = await contract.call('safeMint', [address, metadataUrl]);
```

## ✅ Checklist

- [ ] Deploy novo contrato NFT Collection
- [ ] Verificar se tem `tokenURI(uint256)`
- [ ] Atualizar endereço no .env.local
- [ ] Testar mint de 1 NFT
- [ ] Verificar metadata no explorer
- [ ] Confirmar que aparece no OpenSea

## 🚨 Importante

**NÃO delete o contrato antigo!** Use como backup. O novo contrato será usado para novos mints.

---

**Resultado:** NFTs com metadata individual funcionando! 🎉 