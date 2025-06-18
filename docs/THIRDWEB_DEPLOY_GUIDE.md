# 🚀 Thirdweb Deploy Guide - AI Sports NFT

Este guia explica como fazer o deploy dos contratos necessários para o sistema de minting.

## ⚠️ IMPORTANTE: Deploy com TokenURI Individual

**Problema identificado:** Contratos NFT Drop tradicionais só têm `batchURI` mas não `tokenURI` individual.
**Solução:** Usar Thirdweb v5 Modular Contracts com MintableERC721 Module.

## 🆕 NOVO MÉTODO - Modular Contracts (Recomendado)

### 1. ERC721 Modular com MintableERC721

**Acesse:** https://thirdweb.com/explore/modular-contracts

**Passos:**
1. Clique em "Deploy Modular Contract"
2. Selecione "ERC721" como base
3. Adicione o módulo "MintableERC721"
4. Configure parâmetros

**Configurações do Contrato Base:**
```
Contract Name: AI Sports NFT Modular
Symbol: AISNFTM
Initial Owner: [Your wallet address]
```

**Configurações do Módulo MintableERC721:**
```
Primary Sale Recipient: [Your wallet address]
Royalty Recipient: [Your wallet address] 
Royalty Basis Points: 1000 (10%)
```

**Vantagens do Modular Contract:**
- ✅ Suporte completo a `tokenURI` individual
- ✅ Métodos `mintWithRole` e `mintWithSignature`
- ✅ Lazy minting automático
- ✅ Compatível com OpenSea e outros marketplaces
- ✅ Menor custo de gas

### 2. Verificação Pós-Deploy

Após o deploy, verifique no explorador se tem estas funções:
- ✅ `tokenURI(uint256 tokenId)`
- ✅ `mintWithRole(address to, NFTMetadata memory metadata)`
- ✅ `mintWithSignature(payload, signature)`
- ✅ `setTokenURI(uint256 tokenId, string memory uri)` (opcional)

**❌ NÃO deve ter apenas:** `batchURI`, `setContractURI`, `updateBatchURI`

## 📋 Contratos Necessários

### 1. NFT Drop Contract (ERC-721) - ANTIGO ❌
- **Problema:** Só suporta batchURI, não tokenURI individual
- **Status:** Não recomendado para nosso uso

### 1. NFT Modular Contract (ERC-721) - NOVO ✅  
- **Propósito:** NFTs únicos com metadata individual
- **Tipo:** ERC-721 Modular + MintableERC721 Module
- **Uso:** Todas as camisas AI-generated
- **Vantagem:** TokenURI individual + Lazy minting

### 2. NFT Edition Contract (ERC-1155)  
- **Propósito:** NFTs de edição múltipla
- **Tipo:** ERC-1155 Edition Drop
- **Uso:** Camisas regulares com múltiplas edições

### 3. Marketplace Contract (Opcional)
- **Propósito:** Compra/venda de NFTs
- **Tipo:** Marketplace V3
- **Uso:** Marketplace interno (Milestone 3)

## 🔧 Passo a Passo - Deploy

### Pré-requisitos
1. ✅ Conta no [Thirdweb Dashboard](https://thirdweb.com/dashboard)
2. ✅ Client ID do Thirdweb configurado
3. ✅ Wallet conectada com CHZ tokens
4. ✅ CHZ Chain adicionada ao MetaMask

### CHZ Chain Configuration
```json
{
  "networkName": "Chiliz Chain",
  "rpcUrl": "https://rpc.ankr.com/chiliz",
  "chainId": 88888,
  "symbol": "CHZ",
  "explorerUrl": "https://scan.chiliz.com"
}
```

## 📝 Deploy Process

### 1. ERC721 Modular Contract (RECOMENDADO)

**Acesse:** https://thirdweb.com/explore/modular-contracts

**Step-by-step:**
1. **Conecte wallet** no Thirdweb Dashboard
2. **Vá para Modular Contracts** 
3. **Clique "Deploy"**
4. **Selecione "ERC721"** como core contract
5. **Adicione módulo "MintableERC721"**
6. **Configure parâmetros:**

```
Base Contract:
- Name: AI Sports NFT Collection
- Symbol: AISNFT
- Initial Owner: [Your wallet address]

MintableERC721 Module:
- Primary Sale Recipient: [Your wallet address]
- Platform Fee Recipient: [Your wallet address] 
- Platform Fee Basis Points: 250 (2.5%)
```

7. **Selecione network: CHZ Chain (88888)**
8. **Deploy e confirme transação**

**Expected Functions After Deploy:**
- `mintWithRole(address to, NFTInput[] calldata nfts)`
- `mintWithSignature(MintSignaturePayload calldata payload, bytes calldata signature)`
- `tokenURI(uint256 tokenId)`
- `setTokenURI(uint256 tokenId, string calldata uri)` (se disponível)

### 2. NFT Drop Contract (ERC-721) - BACKUP/ANTIGO

**Acesse:** https://thirdweb.com/explore/pre-built-contracts/nft-drop

**Configurações:**
```
Contract Name: AI Sports NFT Drop
Symbol: AISNFT
Description: AI-generated sports NFT collection for unique jerseys
Image: [Upload project logo]
External Link: https://your-domain.com
Fee Recipient: [Your wallet address]
Seller Fee Basis Points: 1000 (10% royalty)
```

**Deploy Settings:**
- Network: Custom (CHZ Chain - 88888)
- Deployer: [Your wallet address]

### 2. NFT Edition Contract (ERC-1155)

**Acesse:** https://thirdweb.com/explore/pre-built-contracts/edition-drop

**Configurações:**
```
Contract Name: AI Sports NFT Editions
Symbol: AISNFTE
Description: AI-generated sports NFT editions for regular jerseys  
Image: [Upload project logo]
External Link: https://your-domain.com
Fee Recipient: [Your wallet address]
Seller Fee Basis Points: 1000 (10% royalty)
Platform Fee Recipient: [Your wallet address]
Platform Fee Basis Points: 250 (2.5% platform fee)
```

**Deploy Settings:**
- Network: Custom (CHZ Chain - 88888)
- Deployer: [Your wallet address]

### 3. Configuração Pós-Deploy

Após o deploy, adicione os endereços no `.env.local`:

```env
# Thirdweb Configuration
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=your-actual-client-id
THIRDWEB_SECRET_KEY=your-actual-secret-key

# Contracts (CHZ Chain - 88888)
NEXT_PUBLIC_NFT_DROP_CONTRACT=0x...
NEXT_PUBLIC_NFT_EDITION_CONTRACT=0x...
NEXT_PUBLIC_MARKETPLACE_CONTRACT=0x...
```

## 🎯 Contract Settings

### NFT Drop Permissions
```
DEFAULT_ADMIN_ROLE: [Your wallet]
MINTER_ROLE: [Your wallet, Frontend contract address]
PAUSER_ROLE: [Your wallet]
```

### Edition Drop Permissions  
```
DEFAULT_ADMIN_ROLE: [Your wallet]
MINTER_ROLE: [Your wallet, Frontend contract address]
PAUSER_ROLE: [Your wallet]
```

## 🔧 Thirdweb Dashboard Configuration

### 1. Upload Configurações
- **IPFS Gateway:** Enabled
- **Storage Provider:** Thirdweb IPFS
- **Metadata Standards:** OpenSea compatible

### 2. Claim Conditions (Edition Drop)
```
Start Time: Now
Max Claimable Supply: 10000
Price Per Token: 0.1 CHZ
Currency: Native (CHZ)
Max Claimable Per Wallet: 10
```

### 3. Primary Sales
```
Price: 0.1 CHZ per NFT
Currency: CHZ (Native)
Recipient: [Your wallet address]
```

## 🧪 Testing

### Testnet Deploy (Recomendado)
1. Use CHZ Spicy Testnet (Chain ID: 88882)
2. Obtenha CHZ testnet tokens do faucet
3. Deploy contratos no testnet primeiro
4. Teste funcionalidades completas
5. Depois faça deploy na mainnet

### CHZ Spicy Testnet Config
```json
{
  "networkName": "CHZ Spicy Testnet",
  "rpcUrl": "https://spicy-rpc.chiliz.com",
  "chainId": 88882,
  "symbol": "CHZ",
  "explorerUrl": "https://spicy.chzscan.com"
}
```

## ✅ Checklist Final

- [ ] NFT Drop contract deployado na CHZ Chain
- [ ] NFT Edition contract deployado na CHZ Chain  
- [ ] Contratos configurados no .env.local
- [ ] Royalties configurados (10%)
- [ ] Platform fees configurados (2.5%)
- [ ] Permissões de minting configuradas
- [ ] Testado mint de NFT único (Drop)
- [ ] Testado mint de NFT edição (Edition)
- [ ] Links do explorer funcionando

## 🚨 Troubleshooting

### Erro: "Contract not found"
- Verifique se o endereço está correto no .env.local
- Confirme que está na rede CHZ Chain (88888)

### Erro: "Insufficient funds"
- Verifique saldo de CHZ na wallet
- Gas fees na CHZ Chain são baixos (~0.001 CHZ)

### Erro: "Not authorized to mint"
- Verifique permissões MINTER_ROLE no contrato
- Confirme que wallet conectada tem permissões

## 🔗 Links Úteis

- [Thirdweb Dashboard](https://thirdweb.com/dashboard)
- [CHZ Chain Explorer](https://scan.chiliz.com)
- [CHZ Spicy Testnet Faucet](https://faucet.chiliz.com)
- [Thirdweb Docs](https://docs.thirdweb.com)

---

**⚠️ Importante:** Mantenha suas chaves privadas seguras e nunca as compartilhe! 