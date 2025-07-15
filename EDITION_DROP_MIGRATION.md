# 🎯 Migration: Edition → Edition Drop

## ✅ **O QUE FOI ALTERADO**

### **1. Contrato Mudou:**
- ❌ **Antes**: Edition (ERC1155) - Exige MINTER_ROLE
- ✅ **Agora**: Edition Drop (ERC1155) - Qualquer usuário pode claim

### **2. Função Mudou:**
- ❌ **Antes**: `mintTo()` - Exige permissões  
- ✅ **Agora**: `claimTo()` - Sem permissões necessárias

### **3. Fluxo Mudou:**
- ❌ **Antes**: Upload IPFS → Mint direto
- ✅ **Agora**: Lazy mint (admin) → Users fazem claim

---

## 🚀 **PRÓXIMOS PASSOS**

### **1. Deploy Edition Drop Contract**
```bash
1. Ir para: https://thirdweb.com/explore/pre-built-contracts/edition-drop
2. Clicar "Deploy Now"
3. Configurar:
   - Name: "CHZ Fan Token Collection"  
   - Symbol: "CHZFT"
   - Description: "AI-generated sports NFT collections"
   - Network: Polygon Amoy (testnet)
4. Deploy o contrato
```

### **2. Configurar Environment Variables**
```env
# Novo endereço do Edition Drop
NEXT_PUBLIC_EDITION_DROP_AMOY_TESTNET=NOVO_ENDERECO_AQUI

# Manter configurações existentes
NEXT_PUBLIC_USE_TESTNET=true
NEXT_PUBLIC_USE_POLYGON=true
```

### **3. Fazer Lazy Mint (Admin)**
```bash
1. Ir para o dashboard do contrato
2. Aba "NFTs" → "Batch Upload"
3. Upload de 1 NFT base (ex: Jersey Template)
4. Isso cria Token ID 0 com supply ilimitado
5. Users poderão fazer claim deste Token ID
```

### **4. Configurar Claim Conditions**
```bash
1. Aba "Claim Conditions" → Token ID 0
2. Add Claim Phase:
   - Price: 0 (free mint)
   - Start Date: Agora
   - Max Claimable: 100 per wallet
   - Allowlist: None (público)
3. Save claim phase
```

---

## 🎯 **COMO FUNCIONA AGORA**

### **Fluxo Completo:**
```
1. 👨‍💼 ADMIN: Lazy mint NFT template (1x)
   └── Cria Token ID 0: "Jersey Flamengo" (supply: ∞)

2. 👤 USER: Gera jersey customizada
   └── AI cria imagem personalizada

3. 👤 USER: Clica "Mint Batch" 
   └── Claim Token ID 0 (100 copies)
   └── Paga apenas gas fees

4. 🎯 RESULTADO: User recebe 100 NFTs do mesmo tipo
   └── Marketplace mostra: "Jersey Flamengo (100 owned)"
```

### **Benefícios:**
✅ **Sem permissões** - Qualquer user pode mintar  
✅ **Coleções separadas** - Cada token ID é uma coleção  
✅ **Eficiência** - ERC1155 é mais barato que ERC721  
✅ **Marketplace otimizado** - Agrupa por token ID naturalmente  

---

## 🔧 **CONFIGURAÇÃO TÉCNICA**

### **Código Alterado:**
- ✅ `src/lib/useWeb3.ts` - Mudou para `claimToERC1155()`
- ✅ `src/components/editor/ProfessionalActionBar.tsx` - Mantém UserPaidBatchMint
- ✅ Imports atualizados para Edition Drop

### **Variáveis de Ambiente:**
```env
# Edition Drop (novo)
NEXT_PUBLIC_EDITION_DROP_AMOY_TESTNET=ENDERECO_NOVO

# Legacy NFT Collection (mantido para fallback)  
NEXT_PUBLIC_NFT_DROP_CONTRACT_POLYGON_TESTNET=0xfF973a4aFc5A96DEc81366461A461824c4f80254
```

---

## ⚠️ **IMPORTANTE**

### **Para Testar:**
1. **Deploy Edition Drop** primeiro
2. **Fazer lazy mint** de pelo menos 1 NFT
3. **Configurar claim conditions** 
4. **Atualizar .env.local** com novo endereço
5. **Testar mint** no frontend

### **Diferença Visual no Marketplace:**
```
Edition (anterior):           Edition Drop (novo):
┌─────────────────┐          ┌─────────────────┐
│ Jersey #1       │          │ Jersey Flamengo │ 
│ Owned: 1        │    →     │ Available: 97   │
└─────────────────┘          │ Minted: 3       │
┌─────────────────┐          └─────────────────┘
│ Jersey #2       │          
│ Owned: 1        │          ← Muito melhor!
└─────────────────┘          
... (98 mais)
```

---

## 🎯 **STATUS ATUAL**

✅ **Código atualizado** para Edition Drop  
⏳ **Deploy novo contrato** (próximo passo)  
⏳ **Configurar lazy mint** (depois do deploy)  
⏳ **Testar mint** (depois da configuração)  

**Próximo:** Deploy do Edition Drop contract! 🚀 