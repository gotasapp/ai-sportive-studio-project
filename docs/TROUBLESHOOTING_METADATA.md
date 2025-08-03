# 🔧 SOLUCIONANDO PROBLEMAS DE METADATA E VISIBILIDADE

## 🎯 **PROBLEMAS IDENTIFICADOS**

### **1. NFTs Gasless (Admin) não aparecem na Thirdweb Dashboard**
- **Causa:** Engine processa em background
- **Status:** Normal - aguardar sincronização

### **2. NFTs Públicos aparecem sem metadata**
- **Causa:** OpenEditionERC721 precisa de baseURI configurada
- **Status:** Requer configuração adicional

## 🛠️ **SOLUÇÕES**

### **Solução 1: Verificar NFTs via Blockchain Explorer**
```bash
1. Acesse: https://amoy.polygonscan.com/
2. Cole o endereço do contrato
3. Vá em "Internal Txns" ou "Token Transfers"
4. Verifique se os NFTs foram mintados
```

### **Solução 2: Configurar BaseURI no Contrato**
```typescript
// No Thirdweb Dashboard do seu contrato:
1. Acesse: https://thirdweb.com/dashboard
2. Vá no seu contrato OpenEditionERC721
3. Aba "Explorer" → "Write"
4. Função: setTokenURI ou setBaseURI
5. Configure: "https://gateway.pinata.cloud/ipfs/[hash]/"

// Ou via código:
const transaction = setTokenURI({
  contract,
  tokenId: 0n, // Para OpenEdition, usar 0
  uri: "https://gateway.pinata.cloud/ipfs/bafkreig..."
});
```

### **Solução 3: Configurar Shared Metadata**
Para OpenEditionERC721, todos os NFTs compartilham a mesma metadata:

```json
{
  "name": "Jersey para Launchpad",
  "description": "Coleção para teste do launchpad",
  "image": "https://res.cloudinary.com/dpilz4p6g/image/upload/v1753621141/jerseys/launchpad_1753621113315.png",
  "attributes": [
    { "trait_type": "Collection", "value": "Jersey para Launchpad" },
    { "trait_type": "Type", "value": "launchpad" }
  ]
}
```

## 🧪 **TESTES PARA VALIDAÇÃO**

### **Teste 1: Verificar NFTs no Explorer**
```bash
URL: https://amoy.polygonscan.com/address/[SEU_CONTRATO]
Procurar por:
- Transfer events
- Mint transactions  
- Token holders
```

### **Teste 2: Verificar via Thirdweb SDK**
```typescript
import { getOwnedNFTs } from 'thirdweb/extensions/erc721';

const nfts = await getOwnedNFTs({
  contract: contract,
  owner: "0xWalletAddress"
});

console.log('NFTs owned:', nfts);
```

### **Teste 3: Aguardar Engine Sync**
```bash
- Engine pode levar 2-5 minutos para sincronizar
- Verifique status do Queue ID no Dashboard
- Transações gasless aparecem como "Internal Transactions"
```

## ⚠️ **COMPORTAMENTO ESPERADO**

### **OpenEditionERC721 vs ERC721:**
- **ERC721:** Cada NFT tem metadata única
- **OpenEditionERC721:** Todos NFTs compartilham mesma metadata
- **Thirdweb Dashboard:** Pode mostrar "sem metadata" até baseURI ser configurada

### **Engine vs Direct Mint:**
- **Mint Público:** Aparece imediatamente (user faz transação)  
- **Mint Gasless:** Pode demorar (backend processa via Engine)
- **Ambos funcionais:** Apenas timing de visibilidade diferente

## 🎯 **PRÓXIMOS PASSOS**

1. **Verificar blockchain explorer** (mais confiável)
2. **Configurar baseURI** no contrato (para metadata)
3. **Aguardar Engine sync** (para gasless NFTs)
4. **Testar marketplace** (deve funcionar independente)

---

**Desenvolvido em:** 02/08/2025  
**Status:** 🔍 **Investigando visibilidade**  
**Próximo:** Configurar metadata compartilhada