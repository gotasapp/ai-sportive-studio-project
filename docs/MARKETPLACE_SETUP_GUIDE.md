# 🏪 Guia de Configuração do Marketplace V3

## 📋 Pré-requisitos

### 1. Contrato Marketplace V3 na Thirdweb
Você mencionou que já tem um contrato Marketplace V3 criado na **Polygon Amoy**. Vamos configurar para usar este contrato primeiro.

### 2. Variáveis de Ambiente Necessárias

No seu arquivo `.env.local`, adicione:

```bash
# ========================================
# MARKETPLACE CONFIGURATION (V3)
# ========================================

# 🏪 MARKETPLACE V3 CONTRACT ADDRESS (Polygon Amoy)
NEXT_PUBLIC_MARKETPLACE_CONTRACT_POLYGON_TESTNET=SEU_ENDERECO_DO_CONTRATO_MARKETPLACE_V3_AQUI

# 🎫 NFT COLLECTION CONTRACT (já existente)
NEXT_PUBLIC_CONTRACT_ADDRESS_POLYGON_TESTNET=0xfF973a4aFc5A96DEc81366461A461824c4f80254

# 🔗 Thirdweb Configuration
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=your_thirdweb_client_id

# 🔗 WalletConnect/Reown Configuration
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
```

## 🚀 Configuração Passo a Passo

### Passo 1: Configurar Variáveis de Ambiente

1. **Copie o endereço do seu contrato Marketplace V3**:
   - Vá para o dashboard da Thirdweb
   - Encontre seu contrato Marketplace V3 na Polygon Amoy
   - Copie o endereço do contrato

2. **Atualize o `.env.local`**:
   ```bash
   NEXT_PUBLIC_MARKETPLACE_CONTRACT_POLYGON_TESTNET=0xSEU_ENDERECO_AQUI
   ```

### Passo 2: Verificar Configuração da Rede

O sistema já está configurado para detectar automaticamente a rede. Para testar na **Polygon Amoy**:

1. **Conecte sua carteira**
2. **Mude para a rede Polygon Amoy (Chain ID: 80002)**
3. **O sistema automaticamente usará o contrato correto**

### Passo 3: Testar Funcionalidades

#### 🔍 Verificar Detecção do Contrato

1. Abra o console do navegador
2. Navegue para `/marketplace`
3. Procure por logs do tipo:
   ```
   ✅ Marketplace contract found: 0xSEU_ENDERECO
   ✅ Chain detected: Polygon Amoy (80002)
   ```

#### 📝 Testar Criação de Listing

1. **Vá para qualquer NFT no marketplace**
2. **Clique em "Listar para Venda"**
3. **Preencha o formulário**:
   - Preço: `0.001` (MATIC)
   - Duração: `7 dias`
4. **Confirme a transação**

#### 💰 Testar Compra

1. **Encontre um NFT listado**
2. **Clique em "Comprar Agora"**
3. **Confirme a transação**

#### 🏺 Testar Leilão

1. **Clique em "Criar Leilão"**
2. **Configure**:
   - Preço inicial: `0.001 MATIC`
   - Duração: `24 horas`
3. **Confirme a transação**

#### 💌 Testar Ofertas

1. **Em um NFT não listado**
2. **Clique em "Fazer Oferta"**
3. **Configure**:
   - Valor: `0.0005 MATIC`
   - Duração: `7 dias`
4. **Confirme a transação**

## 🔧 Funcionalidades Implementadas

### ✅ Direct Listings (Venda Direta)
- ✅ `createDirectListing()` - Criar listagem
- ✅ `buyFromListing()` - Comprar NFT
- ✅ `cancelListing()` - Cancelar listagem

### ✅ English Auctions (Leilões)
- ✅ `createAuction()` - Criar leilão
- ✅ `bidInAuction()` - Fazer lance
- ✅ `collectAuctionPayout()` - Coletar pagamento
- ✅ `collectAuctionTokens()` - Coletar NFT

### ✅ Offers (Ofertas)
- ✅ `makeOffer()` - Fazer oferta
- ✅ `acceptOffer()` - Aceitar oferta

## 🧪 Debug e Troubleshooting

### 1. Verificar Logs no Console

```javascript
// Abra o console e execute:
console.log('Marketplace Config:', {
  chainId: window.ethereum?.chainId,
  contracts: {
    marketplace: process.env.NEXT_PUBLIC_MARKETPLACE_CONTRACT_POLYGON_TESTNET,
    nft: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_POLYGON_TESTNET
  }
});
```

### 2. Erros Comuns

#### ❌ "Contract not found"
- **Solução**: Verifique se `NEXT_PUBLIC_MARKETPLACE_CONTRACT_POLYGON_TESTNET` está definido
- **Verifique**: O endereço do contrato está correto

#### ❌ "Insufficient funds"
- **Solução**: Obtenha MATIC testnet do [faucet](https://faucet.polygon.technology/)
- **Mínimo**: ~0.01 MATIC para gas fees

#### ❌ "NFT not approved"
- **Solução**: Aprove o contrato Marketplace para transferir o NFT
- **Automático**: O sistema faz isso automaticamente quando necessário

### 3. Testar com Mock Data

Se quiser testar sem fazer transações reais:

```typescript
// Em marketplace-service.ts, descomente esta linha para modo mock:
const MOCK_MODE = true; // Ativar apenas para testes
```

## 📊 Dashboard de Testes

### Páginas para Testar:

1. **`/marketplace`** - Marketplace principal
   - ✅ Listagens ativas
   - ✅ Estatísticas
   - ✅ Filtros funcionais

2. **`/marketplace/dashboard`** - Dashboard do usuário
   - ✅ Meus NFTs
   - ✅ Histórico de transações
   - ✅ Ofertas ativas

3. **`/marketplace/nft/[contract]/[tokenId]`** - Página individual do NFT
   - ✅ Detalhes completos
   - ✅ Botões de ação funcionais

4. **`/admin/marketplace`** - Configurações admin
   - ✅ Configuração de taxas
   - ✅ Contratos
   - ✅ Políticas

## 🔄 Próximos Passos para CHZ Mainnet

Quando conseguir fazer o deploy na CHZ Mainnet:

1. **Deploy do Marketplace V3 na CHZ**
2. **Atualize a variável**:
   ```bash
   NEXT_PUBLIC_MARKETPLACE_CONTRACT_CHZ=0xSEU_NOVO_ENDERECO_CHZ
   ```
3. **Teste na CHZ Mainnet**
4. **Configure como rede padrão**

## 📱 Variáveis de Ambiente Completas

```bash
# Marketplace (Polygon Amoy para testes)
NEXT_PUBLIC_MARKETPLACE_CONTRACT_POLYGON_TESTNET=SEU_ENDERECO_MARKETPLACE_V3

# NFT Collections (já configurado)
NEXT_PUBLIC_CONTRACT_ADDRESS_POLYGON_TESTNET=0xfF973a4aFc5A96DEc81366461A461824c4f80254

# Thirdweb
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=your_client_id

# WalletConnect
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
```

## ✨ Recursos Adicionais

- **Thirdweb Dashboard**: [https://thirdweb.com/dashboard](https://thirdweb.com/dashboard)
- **Polygon Amoy Faucet**: [https://faucet.polygon.technology/](https://faucet.polygon.technology/)
- **Polygon Amoy Explorer**: [https://amoy.polygonscan.com/](https://amoy.polygonscan.com/)

---

**🎯 Resultado Esperado**: Sistema completo de marketplace funcionando com compra, venda, leilões e ofertas na Polygon Amoy testnet! 