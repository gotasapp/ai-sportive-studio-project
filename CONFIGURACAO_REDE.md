# 🎯 CONFIGURAÇÃO DE REDE - CHZ ↔ AMOY SWITCH

## 🚀 COMO TROCAR DE REDE (SUPER SIMPLES!)

### ⚡ PASSO ÚNICO: 
**Edite apenas 1 linha de código para trocar tudo!**

```typescript
// Arquivo: src/lib/network-config.ts
// Linha 7:

export const USE_CHZ_MAINNET = false; // ALTERE AQUI!

// false = Polygon Amoy (TESTNET) 
// true  = CHZ Mainnet (PRODUÇÃO)
```

**Pronto! Todo o sistema muda automaticamente! 🎉**

---

## 🔧 O QUE ACONTECE QUANDO VOCÊ MUDA:

### 🟡 AMOY MODE (`USE_CHZ_MAINNET = false`)
```
✅ Network: Polygon Amoy Testnet
✅ Currency: MATIC  
✅ Contratos: Seus contratos Amoy testados
✅ Explorer: amoy.polygonscan.com
✅ RPC: rpc-amoy.polygon.technology
✅ Preços: "0.1 MATIC"
```

### 🟢 CHZ MODE (`USE_CHZ_MAINNET = true`)
```  
✅ Network: Chiliz Chain
✅ Currency: CHZ
✅ Contratos: Seus contratos CHZ deployados  
✅ Explorer: scan.chiliz.com
✅ RPC: rpc.ankr.com/chiliz
✅ Preços: "0.1 CHZ"
```

---

## 📋 VARIÁVEIS DE AMBIENTE NECESSÁRIAS

### Para CHZ funcionar, você precisa destas variáveis no `.env`:

```env
# CHZ MAINNET CONTRACTS (você já tem!)
NEXT_PUBLIC_MARKETPLACE_CONTRACT_CHZ=0x...
NEXT_PUBLIC_NFT_DROP_CONTRACT_CHZ=0x...  
NEXT_PUBLIC_LAUNCHPAD_CONTRACT_CHZ=0x...

# AMOY CONTRACTS (já funcionando)
NEXT_PUBLIC_MARKETPLACE_CONTRACT=0x723436a84d57150A5109eFC540B2f0b2359Ac76d
NEXT_PUBLIC_NFT_DROP_CONTRACT_POLYGON_TESTNET=0xfF973a4aFc5A96DEc81366461A461824c4f80254
NEXT_PUBLIC_LAUNCHPAD_CONTRACT_ADDRESS=0xfB233A36196a2a4513DB6b7d70C90ecaD0Eec639

# BACKEND (mesma wallet funciona para ambas as redes!)
THIRDWEB_SECRET_KEY=your_thirdweb_secret_key
BACKEND_WALLET_PRIVATE_KEY=your_backend_wallet_private_key
```

---

## 🎯 FUNCIONALIDADES QUE MUDAM AUTOMATICAMENTE:

### 🏪 **MARKETPLACE**
- CHZ: Mostra apenas NFTs da rede CHZ
- Amoy: Mostra apenas NFTs da rede Amoy
- Preços mudam automaticamente (CHZ vs MATIC)

### 🚀 **LAUNCHPAD** 
- Deploy automático na rede escolhida
- Mint automático na rede escolhida
- Claim conditions configuradas automaticamente

### 💎 **NFT ÚNICO**
- Mint na rede escolhida
- Metadados salvos com a rede correta
- Trading apenas na rede específica

### 📊 **ANALYTICS**
- Stats separados por rede
- Volume em moeda nativa (CHZ ou MATIC)
- Usuários filtrados por rede

---

## 🔄 PROCESSO DE MUDANÇA:

### 1. **PREPARAÇÃO**
```bash
# Ter certeza que tem os contratos CHZ deployados
# Ter certeza que tem as variáveis de ambiente CHZ
```

### 2. **ALTERAR CONFIGURAÇÃO**
```typescript
// src/lib/network-config.ts
export const USE_CHZ_MAINNET = true; // CHZ MODE!
```

### 3. **DEPLOY**
```bash
npm run build
# Deploy no Vercel/sua plataforma
```

### 4. **PRONTO!**
```
✅ Todo o sistema agora roda em CHZ!
✅ Usuários só veem NFTs CHZ
✅ Mint automático em CHZ  
✅ Trading em CHZ
✅ Preços em CHZ
```

---

## 🛡️ SEGURANÇA & VALIDAÇÃO:

### ✅ **O SISTEMA VALIDA AUTOMATICAMENTE:**
- Se os contratos existem
- Se as variáveis estão configuradas
- Se a rede está respondendo
- Se a wallet backend tem fundos

### 🚨 **LOGS AUTOMÁTICOS:**
```
🎯 NETWORK CONFIG LOADED: {
  network: 'Chiliz Chain',
  chainId: 88888,
  currency: 'CHZ',  
  contracts: 3,
  isChz: true
}
```

---

## 🔍 DEBUGGING:

### **Para verificar qual rede está ativa:**
```typescript
// No console do browser:
console.log('Rede ativa:', ACTIVE_NETWORK.name);
console.log('Chain ID:', ACTIVE_NETWORK.chainId);
console.log('Contratos:', ACTIVE_NETWORK.contracts);
```

### **Logs do servidor mostram:**
```
⚙️ Using active chain: {
  name: 'Chiliz Chain',
  chainId: 88888,  
  currency: 'CHZ'
}
```

---

## 🎉 RESULTADO FINAL:

### **AMOY MODE (DEMONSTRAÇÃO):**
- ✅ Marketplace funciona com NFTs Amoy
- ✅ Video de demonstração roda perfeitamente 
- ✅ Todos os testes passam
- ✅ Cliente vê funcionamento completo

### **CHZ MODE (PRODUÇÃO):**
- ✅ Sistema idêntico, mas em CHZ
- ✅ Mesma UX, mesmas funcionalidades
- ✅ Apenas muda rede e moeda
- ✅ Pronto para uso real

---

## 💡 VANTAGENS DESTA ABORDAGEM:

### 🔧 **PARA DESENVOLVIMENTO:**
- 1 linha de código para trocar tudo
- Mesmo código funciona para ambas as redes  
- Fácil debugging e testing
- Não precisa manter 2 versões

### 👤 **PARA CLIENTE:**
- Decisão simples: CHZ ou Amoy?
- Mudança instantânea
- Sem risco de erros
- Flexibilidade total

### 🚀 **PARA DEMONSTRAÇÃO:**
- Video funciona em Amoy (testado)
- Produção em CHZ (mesmo código)  
- Cliente vê que funciona nas duas
- Confiança total no sistema

---

**🎯 RESUMO: Com 1 linha de código você controla se o sistema inteiro roda em CHZ ou Amoy. Simples, seguro e flexível!**
