# 🏪 Thirdweb Marketplace V3 - Funções Completas

Esta documentação contém todas as funções necessárias para implementar um marketplace completo usando Thirdweb V3.

## 📋 **DIRECT LISTINGS (Venda Direta)**

### 1. createListing - Criar Listagem
**Função**: Listar NFT para venda com preço fixo
```typescript
import { prepareContractCall } from "thirdweb";
import { useSendTransaction } from "thirdweb/react";

export default function Component() {
  const { mutate: sendTransaction } = useSendTransaction();

  const onClick = () => {
    const transaction = prepareContractCall({
      contract,
      method:
        "function createListing((address assetContract, uint256 tokenId, uint256 quantity, address currency, uint256 pricePerToken, uint128 startTimestamp, uint128 endTimestamp, bool reserved) _params) returns (uint256 listingId)",
      params: [_params],
    });
    sendTransaction(transaction);
  };
}
```

**Parâmetros**:
- `assetContract`: Endereço do contrato NFT
- `tokenId`: ID do token
- `quantity`: Quantidade (1 para ERC721)
- `currency`: Endereço da moeda (MATIC, USDC, etc.)
- `pricePerToken`: Preço por token
- `startTimestamp`: Quando inicia a venda
- `endTimestamp`: Quando expira
- `reserved`: Se é reservado para compradores específicos

### 2. updateListing - Atualizar Listagem
**Função**: Modificar preço, moeda ou outros parâmetros
```typescript
const transaction = prepareContractCall({
  contract,
  method:
    "function updateListing(uint256 _listingId, (address assetContract, uint256 tokenId, uint256 quantity, address currency, uint256 pricePerToken, uint128 startTimestamp, uint128 endTimestamp, bool reserved) _params)",
  params: [_listingId, _params],
});
```

### 3. buyFromListing - Comprar da Listagem
**Função**: Comprar NFT listado
```typescript
const transaction = prepareContractCall({
  contract,
  method:
    "function buyFromListing(uint256 _listingId, address _buyFor, uint256 _quantity, address _currency, uint256 _expectedTotalPrice) payable",
  params: [
    _listingId,
    _buyFor,
    _quantity,
    _currency,
    _expectedTotalPrice,
  ],
});
```

### 4. cancelListing - Cancelar Listagem
**Função**: Remover NFT da venda
```typescript
const transaction = prepareContractCall({
  contract,
  method: "function cancelListing(uint256 _listingId)",
  params: [_listingId],
});
```

### 5. approveCurrencyForListing - Aprovar Moeda
**Função**: Permitir moeda específica para uma listagem
```typescript
const transaction = prepareContractCall({
  contract,
  method:
    "function approveCurrencyForListing(uint256 _listingId, address _currency, uint256 _pricePerTokenInCurrency)",
  params: [
    _listingId,
    _currency,
    _pricePerTokenInCurrency,
  ],
});
```

## 🏆 **ENGLISH AUCTIONS (Leilões)**

### 6. createAuction - Criar Leilão
**Função**: Colocar NFT em leilão
```typescript
const transaction = prepareContractCall({
  contract,
  method:
    "function createAuction((address assetContract, uint256 tokenId, uint256 quantity, address currency, uint256 minimumBidAmount, uint256 buyoutBidAmount, uint64 timeBufferInSeconds, uint64 bidBufferBps, uint64 startTimestamp, uint64 endTimestamp) _params) returns (uint256 auctionId)",
  params: [_params],
});
```

**Parâmetros**:
- `assetContract`: Endereço do contrato NFT
- `tokenId`: ID do token
- `quantity`: Quantidade (1 para ERC721)
- `currency`: Moeda para bids
- `minimumBidAmount`: Lance mínimo
- `buyoutBidAmount`: Valor para compra direta
- `timeBufferInSeconds`: Buffer de tempo (ex: 300s)
- `bidBufferBps`: Buffer percentual para bids (ex: 500 = 5%)
- `startTimestamp`: Início do leilão
- `endTimestamp`: Fim do leilão

### 7. bidInAuction - Fazer Lance
**Função**: Dar lance em leilão ativo
```typescript
const transaction = prepareContractCall({
  contract,
  method:
    "function bidInAuction(uint256 _auctionId, uint256 _bidAmount) payable",
  params: [_auctionId, _bidAmount],
});
```

### 8. collectAuctionPayout - Coletar Pagamento
**Função**: Vendedor coleta o dinheiro do leilão
```typescript
const transaction = prepareContractCall({
  contract,
  method:
    "function collectAuctionPayout(uint256 _auctionId)",
  params: [_auctionId],
});
```

### 9. collectAuctionTokens - Coletar NFT
**Função**: Ganhador coleta o NFT do leilão
```typescript
const transaction = prepareContractCall({
  contract,
  method:
    "function collectAuctionTokens(uint256 _auctionId)",
  params: [_auctionId],
});
```

## 💰 **OFFERS (Ofertas)**

### 10. makeOffer - Fazer Oferta
**Função**: Fazer oferta em NFT não listado
```typescript
const transaction = prepareContractCall({
  contract,
  method:
    "function makeOffer((address assetContract, uint256 tokenId, uint256 quantity, address currency, uint256 totalPrice, uint256 expirationTimestamp) _params) returns (uint256 _offerId)",
  params: [_params],
});
```

**Parâmetros**:
- `assetContract`: Endereço do contrato NFT
- `tokenId`: ID do token
- `quantity`: Quantidade
- `currency`: Moeda da oferta (apenas ERC20)
- `totalPrice`: Preço total oferecido
- `expirationTimestamp`: Quando expira a oferta

### 11. acceptOffer - Aceitar Oferta
**Função**: Dono do NFT aceita uma oferta
```typescript
const transaction = prepareContractCall({
  contract,
  method: "function acceptOffer(uint256 _offerId)",
  params: [_offerId],
});
```

### 12. cancelOffer - Cancelar Oferta
**Função**: Cancelar oferta feita
```typescript
const transaction = prepareContractCall({
  contract,
  method: "function cancelOffer(uint256 _offerId)",
  params: [_offerId],
});
```

## 📊 **ANÁLISE DO QUE TEMOS vs PRECISAMOS**

### ✅ **JÁ IMPLEMENTADO:**
1. **getAllValidListings** - Buscar listagens ativas ✅
2. **getAllAuctions** - Buscar leilões ✅
3. **ownerOf** - Verificar dono do NFT ✅
4. **MarketplaceCard** - UI básica ✅
5. **AuctionBidButton** - Componente para bids ✅

### 🚧 **PARCIALMENTE IMPLEMENTADO:**
1. **CreateListingModal** - Existe mas pode precisar updates
2. **BuyNowButton** - Existe mas pode precisar updates
3. **MakeOfferButton** - Existe mas pode precisar updates

### ❌ **AINDA PRECISAMOS:**

#### **Modais/Componentes:**
1. **CreateAuctionModal** - Para criar leilões
2. **ViewOffersModal** - Ver ofertas recebidas
3. **AcceptOfferModal** - Aceitar ofertas
4. **CollectPayoutModal** - Coletar pagamentos de leilão
5. **CollectTokensModal** - Coletar NFTs de leilão ganho

#### **Hooks/Funções:**
1. **useOffers** - Hook para buscar ofertas em NFTs
2. **getAllOffers** - Função para buscar ofertas do marketplace
3. **Integração com ofertas** no useMarketplaceData

#### **Funcionalidades de Estado:**
1. **Detecção de leilões terminados** que precisam coleta
2. **Ofertas ativas** em NFTs
3. **Status de "collecting"** para leilões

## 🎯 **PRÓXIMO PASSO PROPOSTO**

### **FASE 1: Modal Create Auction (Mais Crítico)**
1. Criar `CreateAuctionModal.tsx`
2. Implementar form com todos os parâmetros
3. Conectar ao `prepareContractCall` do createAuction
4. Adicionar validações (tempo mínimo, preços, etc.)

### **FASE 2: Sistema de Ofertas**
1. Implementar `getAllOffers` no hook
2. Criar `ViewOffersModal` para donos verem ofertas
3. Criar `AcceptOfferModal` para aceitar
4. Atualizar contador de ofertas no MarketplaceCard

### **FASE 3: Coleta de Leilões**
1. Detectar leilões terminados
2. Mostrar botões "Collect Payout" e "Collect Tokens"
3. Implementar modais para coleta

## 🚀 **RECOMENDAÇÃO**

**Começar com FASE 1** - CreateAuctionModal porque:
- É a funcionalidade mais visível
- Completa o ciclo básico (list/auction)
- Os usuários já veem o botão "Create Auction"
- É independente de outras funcionalidades

**Você aprova começarmos com a FASE 1?** 