# 🎯 CONFIGURAÇÃO DE MINT STAGES - LAUNCHPAD

**Data:** 02/08/2025  
**Status:** ✅ **CONFIGURADO PARA TESTE**

## 📋 **STAGES CONFIGURADOS**

### **1. 🌟 VIP Sale** 
- **Preço:** 0.05 MATIC (desconto de 50%)
- **Limite:** 5 NFTs por wallet
- **Acesso:** Somente wallets na allowlist VIP
- **Timing:** Primeira fase (earliest access)

### **2. 📝 Whitelist Sale**
- **Preço:** 0.08 MATIC (desconto de 20%)
- **Limite:** 3 NFTs por wallet  
- **Acesso:** Somente wallets na allowlist Whitelist
- **Timing:** Segunda fase (early access)

### **3. 🌍 Public Sale**
- **Preço:** 0.1 MATIC (preço full)
- **Limite:** 2 NFTs por wallet
- **Acesso:** **ABERTO PARA TODOS** (sem allowlist)
- **Timing:** Terceira fase (open access)

## 🔧 **CLAIM CONDITIONS AUTOMÁTICAS**

### **Configuração Técnica:**
```typescript
// VIP Stage
{
  startTimestamp: configurável,
  maxClaimableSupply: 100n, // por fase
  quantityLimitPerWallet: 5n,
  pricePerToken: 50000000000000000n, // 0.05 MATIC em wei
  currency: "0x0000000000000000000000000000000000000000", // MATIC
  merkleRoot: "0x000...", // Allowlist VIP (será gerada)
  metadata: { stageType: 'allowlist', allowlistRequired: true }
}

// Whitelist Stage  
{
  startTimestamp: configurável,
  maxClaimableSupply: 100n,
  quantityLimitPerWallet: 3n,
  pricePerToken: 80000000000000000n, // 0.08 MATIC em wei
  currency: "0x0000000000000000000000000000000000000000", // MATIC
  merkleRoot: "0x000...", // Allowlist Whitelist (será gerada)
  metadata: { stageType: 'allowlist', allowlistRequired: true }
}

// Public Stage ⭐ IMPORTANTE PARA SEU TESTE
{
  startTimestamp: configurável,
  maxClaimableSupply: 100n,
  quantityLimitPerWallet: 2n,
  pricePerToken: 100000000000000000n, // 0.1 MATIC em wei
  currency: "0x0000000000000000000000000000000000000000", // MATIC
  merkleRoot: "0x0000000000000000000000000000000000000000", // SEM ALLOWLIST
  metadata: { stageType: 'public', allowlistRequired: false }
}
```

## 🧪 **ROTEIRO DE TESTE**

### **Pré-requisitos:**
1. ✅ Deploy novo contrato OpenEditionERC721 na Thirdweb
2. ✅ Wallet admin com MATIC na Polygon Amoy  
3. ✅ Wallet teste externa com MATIC na Polygon Amoy

### **Teste 1: Configuração (Admin)**
```bash
1. Criar nova imagem pendente
2. Abrir modal de aprovação
3. Configurar:
   ✅ Contract Address: [seu_novo_contrato]
   ✅ Mint Stages: VIP → Whitelist → Public
   ✅ Auto-Configure Claim Conditions: ☑️
   ✅ Currency: MATIC
4. Aprovar coleção
5. Verificar logs: claim conditions configuradas
```

### **Teste 2: Mint Público (Wallet Externa)**
```bash
1. Conectar wallet externa (não admin)
2. Acessar página da coleção
3. Verificar:
   ✅ Preço: 0.1 MATIC
   ✅ Limite: 2 NFTs por wallet
   ✅ Status: "Public Sale ativo"
4. Fazer mint público
5. Pagar 0.1 MATIC + gas
6. Verificar transação no explorer
```

### **Teste 3: Mint Gasless (Admin)**
```bash
1. Conectar wallet admin
2. Ver botão "Gasless Mint" 
3. Fazer mint gasless
4. Backend paga o gas
5. NFT mintado sem custo para admin
```

## ⚙️ **CONFIGURAÇÕES IMPORTANTES**

### **Wallet Backend (Gasless):**
- **Address:** `0xEf381c5fB1697b0f21F99c7A7b546821cF481B56`
- **Precisa ter:** MATIC suficiente para gas
- **Faucet:** https://faucet.polygon.technology/

### **Moedas Suportadas:**
- ✅ **MATIC (Recomendado)** - Nativo da Polygon
- ✅ **USDC_AMOY** - Stablecoin testnet
- ✅ **FREE** - Mint gratuito

### **Endpoints Criados:**
- `POST /api/launchpad/configure-claim-conditions` - Configura blockchain
- `POST /api/launchpad/pending-images/[id]/approve` - Aprova com auto-config

## 🎯 **PONTOS DE VALIDAÇÃO**

### **✅ Deve Funcionar:**
1. **Admin pode aprovar** com claim conditions automáticas
2. **Qualquer wallet pode mintar** na fase Public (sem allowlist)
3. **Preços corretos** (0.05/0.08/0.1 MATIC por fase)
4. **Limites por wallet** (5/3/2 por fase)
5. **Mint gasless** funciona para admin

### **🔍 Logs para Monitorar:**
```bash
# Console do navegador (aprovação):
✅ Auto-configuring claim conditions...
✅ Claim conditions configured automatically: [queueId]

# Console do navegador (mint público):
✅ Starting public mint with claim conditions...
✅ LAUNCHPAD CLAIM successful: [transactionHash]

# Console do navegador (mint gasless):
✅ Gasless mint successful: [queueId]
```

## 🚀 **PRÓXIMOS PASSOS APÓS TESTE**

1. **Se mint público funcionar:** ✅ Sistema está correto
2. **Se mint gasless funcionar:** ✅ Backend configurado
3. **Verificar marketplace:** NFTs aparecem automaticamente
4. **Configurar allowlists:** Para VIP/Whitelist (próxima feature)

---

**Desenvolvido em:** 02/08/2025  
**Pronto para:** Deploy de contrato + Teste completo  
**Status:** 🎯 **AGUARDANDO SEU TESTE**