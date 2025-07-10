# 🎯 Thirdweb Engine Webhook Setup Guide

Este guia explica como configurar o webhook da Thirdweb Engine para sincronizar automaticamente NFTs mintados com o MongoDB.

## 📋 Visão Geral

### ✅ O que foi implementado:
- **Webhook Endpoint**: `/api/webhooks/thirdweb-engine` 
- **Verificação de Segurança**: Assinatura HMAC SHA-256
- **Auto-sync MongoDB**: Tokenid salvo automaticamente quando NFT é mintado
- **Compatibilidade**: ERC721 e ERC1155 contracts

### 🎯 Fluxo do Sistema:
1. **User minta NFT** → Thirdweb Engine envia transação
2. **Transação minerada** → Engine chama nosso webhook  
3. **Webhook recebe event** → Extrai tokenId dos logs da transação
4. **Auto-sync MongoDB** → Atualiza NFT com tokenId real da blockchain
5. **Marketplace atualizado** → Mostra apenas NFTs realmente mintados

---

## 🚀 Configuração Passo a Passo

### **1. Configurar Variável de Ambiente**

Adicione ao seu `.env.local`:
```bash
THIRDWEB_WEBHOOK_SECRET=seu_secret_aqui_gerado_pelo_dashboard
```

### **2. Acessar Thirdweb Engine Dashboard**

1. Acesse [Thirdweb Engine Dashboard](https://thirdweb.com/dashboard/engine)
2. Selecione sua instância do Engine
3. Vá para aba **"Configuration"**
4. Clique em **"Create Webhook"**

### **3. Configurar o Webhook**

#### **URL do Webhook**:
```
https://seudominio.com/api/webhooks/thirdweb-engine
```

#### **Configurações Recomendadas**:

**Events**:
- ✅ `mined_transaction` (Essencial!)
- ⚪ `sent_transaction` (Opcional - para logs)
- ⚪ `errored_transaction` (Opcional - para debug)

**Filters** (Importantes para performance):

**Chain IDs**:
- `80002` (Polygon Amoy Testnet)
- `137` (Polygon Mainnet) - se usar

**Contract Addresses**:
- Seu contrato NFT: `0xfF973a4aFc5A96DEc81366461A461824c4f80254`

**Function Signatures** (Opcional, para filtrar apenas mints):
- `mintWithSignature`
- `mint` 
- `safeMint`

### **4. Copiar Webhook Secret**

1. Após criar o webhook, copie o **"Webhook Secret"**
2. Adicione ao `.env.local` como `THIRDWEB_WEBHOOK_SECRET`

### **5. Testar o Webhook**

#### **Teste Manual (GET)**:
```bash
curl https://seudominio.com/api/webhooks/thirdweb-engine
```

Resposta esperada:
```json
{
  "message": "Thirdweb Engine Webhook Endpoint",
  "status": "ready",
  "timestamp": "2025-01-27T10:30:00.000Z",
  "supportedEvents": ["mined_transaction", "sent_transaction", "errored_transaction"],
  "filterCriteria": {
    "chainId": 80002,
    "contractAddress": "0xfF973a4aFc5A96DEc81366461A461824c4f80254",
    "eventType": "mint"
  }
}
```

#### **Teste com Mint Real**:
1. Minte um NFT pela sua aplicação
2. Verifique os logs do console da aplicação
3. Confirme que o NFT aparece no marketplace com tokenId correto

---

## 🔍 Debug e Troubleshooting

### **Logs do Webhook**

O webhook produz logs detalhados no console:

```
🔔 Thirdweb Webhook: Received notification
📦 Webhook payload preview: {...}
✅ Webhook signature verified successfully  
📋 Webhook event details: {...}
🎉 Processing successful mint transaction
✅ Transaction is from our NFT contract
🎯 Found tokenId: 123
🔄 Syncing NFT to MongoDB: {...}
✅ NFT synced to MongoDB successfully
```

### **Problemas Comuns**

#### **❌ "Invalid signature"**
- **Causa**: `THIRDWEB_WEBHOOK_SECRET` incorreto ou não configurado
- **Solução**: Verificar secret no dashboard e arquivo `.env.local`

#### **❌ "No matching NFT found in database"**
- **Causa**: NFT não existe no MongoDB para ser atualizado
- **Solução**: Verificar se o NFT foi criado antes do mint

#### **❌ "Could not extract tokenId from transaction logs"**
- **Causa**: Transação não contém events Transfer válidos
- **Solução**: Verificar se o contract emite events padrão ERC721/ERC1155

#### **❌ "Transaction not from our NFT contract"**
- **Causa**: Webhook recebendo events de outros contratos
- **Solução**: Configurar filtros no dashboard para nosso contrato específico

### **Verificar Status do Webhook**

```bash
# Verificar se endpoint está ativo
curl -X GET https://seudominio.com/api/webhooks/thirdweb-engine

# Verificar logs da aplicação para debug
```

---

## 🛠️ Manutenção e Monitoramento

### **Logs Importantes para Monitorar**:

1. **Webhook recebido**: `🔔 Thirdweb Webhook: Received notification`
2. **Transação processada**: `🎉 Processing successful mint transaction`
3. **TokenId extraído**: `🎯 Found tokenId: X`
4. **MongoDB sincronizado**: `✅ NFT synced to MongoDB successfully`

### **Métricas para Acompanhar**:

- Taxa de sucesso de webhooks recebidos
- Tempo de resposta do endpoint (< 5s recomendado)
- NFTs sincronizados vs NFTs mintados
- Erros de extração de tokenId

### **Backup e Recuperação**:

Se alguns NFTs não foram sincronizados automaticamente:

1. **Script manual de sync** (pode ser criado se necessário)
2. **Re-processo via transaction hash** 
3. **Busca direta do contrato** usando APIs existentes

---

## 🎯 Próximos Passos

### **Implementação Completa**:

1. ✅ **Webhook configurado e testado**
2. ✅ **Cleanup de NFTs antigos sem tokenId**
3. ✅ **Marketplace mostrando apenas NFTs reais**
4. 🔄 **Sistema de listing automático** (opcional)
5. 🔄 **Notificações para usuários** quando mint é confirmado

### **Melhorias Futuras**:

- **Retry logic** para webhooks que falharam
- **Webhook delivery status** tracking
- **Real-time notifications** para usuários quando NFT é mintado
- **Automatic marketplace listing** após mint

---

## 📞 Suporte

Em caso de problemas:

1. **Verificar logs** do webhook no console
2. **Testar endpoint** manualmente 
3. **Confirmar configuração** no Thirdweb Dashboard
4. **Verificar variáveis** de ambiente

O sistema está projetado para ser robusto e auto-recuperável! 🚀 