# 🔒 BACKUP COMPLETO DA LÓGICA DE TRADING
**Data**: 2025-01-19  
**Motivo**: Antes de implementar collection-based trading  
**Commit**: Backup da lógica funcionando de buy/sell/auction  

## ⚠️ CRÍTICO: Esta documentação contém TODA a lógica de trading que funciona atualmente

---

## 📋 **ÍNDICE**
1. [Estrutura Atual](#estrutura-atual)
2. [Componentes de Trading](#componentes-de-trading)
3. [APIs de Marketplace](#apis-de-marketplace)
4. [Hooks e Estados](#hooks-e-estados)
5. [Lógica de Botões](#lógica-de-botões)
6. [Detecção de Ownership](#detecção-de-ownership)
7. [Sincronização com Blockchain](#sincronização-com-blockchain)

---

## 📊 **ESTRUTURA ATUAL**

### **Como funciona hoje:**
1. **Marketplace Geral**: Mostra NFTs individuais + collection cards
2. **MarketplaceCard**: Cada card tem botões de trading completos
3. **Detecção Automática**: isListed, isAuction, isOwner
4. **Botões Dinâmicos**: Mudam baseado no estado da NFT

### **Fontes de Dados:**
- **Legacy NFTs**: `getThirdwebDataWithFallback()` → dados direto da blockchain
- **Custom Collections**: `/api/marketplace/nfts` → dados híbridos (MongoDB + Thirdweb)
- **Refresh**: Auto-refresh a cada 30 segundos

---

## 🛠️ **COMPONENTES DE TRADING**

### **MarketplaceCard.tsx** - COMPONENTE PRINCIPAL
```typescript
// Props que recebe:
interface MarketplaceCardProps {
  name: string;
  imageUrl: string;
  price: string;
  collection: string;
  tokenId?: string;
  assetContract?: string;
  listingId?: string;
  isListed?: boolean;
  owner?: string;
  isAuction?: boolean;
  auctionId?: string;
  currentBid?: string;
  endTime?: Date;
  activeOffers?: number;
}

// Lógica de Botões (CRÍTICA):
const renderActionButtons = () => {
  if (isListed && listingId) {
    // NFT está listado para venda direta
    if (isOwner) {
      return (
        <Button onClick={() => setShowUpdateListing(true)}>Update Price</Button>
        <CancelListingButton listingId={listingId} />
      );
    } else {
      return (
        <BuyNowButton listingId={listingId} price={price} />
        <MakeOfferButton assetContract={assetContract} tokenId={tokenId} />
      );
    }
  } else if (isAuction && auctionId) {
    // NFT está em leilão
    if (isOwner) {
      return <CancelAuctionButton auctionId={auctionId} />;
    } else {
      return <AuctionBidButton auctionId={auctionId} currentBid={currentBid} />;
    }
  } else {
    // NFT não está listado nem em leilão
    if (isOwner) {
      return (
        <Button onClick={handleListButtonClick}>List for Sale</Button>
        <Button onClick={() => setShowCreateAuction(true)}>Create Auction</Button>
      );
    } else {
      return <MakeOfferButton assetContract={assetContract} tokenId={tokenId} />;
    }
  }
};
```

### **Modais de Trading (FUNCIONAIS):**
1. **CreateListingModal**: Lista NFT para venda direta
2. **UpdateListingModal**: Atualiza preço de listing
3. **CreateAuctionModal**: Cria auction
4. **CancelListingButton**: Cancela listing
5. **CancelAuctionButton**: Cancela auction
6. **BuyNowButton**: Compra NFT listada
7. **AuctionBidButton**: Faz bid em auction
8. **MakeOfferButton**: Faz oferta

---

## 🔌 **APIs DE MARKETPLACE**

### **1. `/api/marketplace/nfts` - FONTE DE DADOS PRINCIPAL**
```typescript
// O que retorna para cada NFT:
{
  tokenId: string,
  contractAddress: string,
  owner: string,
  marketplace: {
    isListed: boolean,           // ✅ DETECÇÃO CRÍTICA
    isAuction: boolean,          // ✅ DETECÇÃO CRÍTICA
    price: string,
    listingId?: string,          // ✅ PARA UPDATE/CANCEL
    auctionId?: string,          // ✅ PARA BID/CANCEL
    thirdwebData?: {
      listingId: string,
      price: string,
      currency: string,
      endTime: string
    },
    thirdwebAuctionData?: {
      auctionId: string,
      minimumBidAmount: string,
      buyoutBidAmount: string,
      endTime: string
    }
  }
}
```

### **2. Função `getThirdwebMarketplaceData()` - DETECÇÃO REAL**
```typescript
async function getThirdwebMarketplaceData() {
  // Busca dados REAIS da blockchain
  const [validListings, validAuctions] = await Promise.all([
    getAllValidListings({ contract: marketplaceContract }),
    getAllAuctions({ contract: marketplaceContract })
  ]);

  // Cria mapas para lookup rápido
  const listingsByKey = new Map();
  const auctionsByKey = new Map();
  
  validListings.forEach(listing => {
    const key = `${listing.tokenId}_${listing.assetContractAddress}`;
    listingsByKey.set(key, listing);
  });

  validAuctions.forEach(auction => {
    const key = `${auction.tokenId}_${auction.assetContractAddress}`;
    auctionsByKey.set(key, auction);
  });

  return { listingsByKey, auctionsByKey };
}
```

### **3. Verificação Dupla (CRÍTICA):**
```typescript
// Para cada custom collection, verifica:
// 1. MongoDB (dados locais)
const mongoListedNFTs = mintedNFTs.filter(nft => nft.marketplace?.isListed === true);

// 2. Thirdweb (dados reais da blockchain)
const thirdwebListedNFTs = mintedNFTs.filter(nft => {
  const key = `${nft.tokenId}_${nft.contractAddress.toLowerCase()}`;
  return marketplaceData.listingsByKey.has(key);
});

// 3. Resultado final
const isListedFinal = mongoListedNFTs.length > 0 || thirdwebListedNFTs.length > 0;
const isAuctionFinal = thirdwebAuctionNFTs.length > 0;
```

---

## 🎣 **HOOKS E ESTADOS**

### **useMarketplaceData.ts - HOOK PRINCIPAL**
```typescript
export function useMarketplaceData() {
  const fetchNFTsFromContract = useCallback(async (showLoading = true) => {
    // 1. Busca dados da API + Thirdweb
    const [apiResponse, thirdwebData] = await Promise.all([
      fetch('/api/marketplace/nfts?_t=' + Date.now()).then(res => res.json()),
      getThirdwebDataWithFallback()
    ]);

    // 2. Processa dados da API (custom collections)
    const apiNFTs = apiResponse.success ? apiResponse.data.map(nft => ({
      // ... mapeamento completo ...
      isListed: nft.marketplace?.isListed || false,
      isAuction: nft.marketplace?.isAuction || false,
      listingId: nft.marketplace?.thirdwebData?.listingId || nft.marketplace?.listingId,
      auctionId: nft.marketplace?.thirdwebAuctionData?.auctionId,
    })) : [];

    // 3. Processa dados do Thirdweb (legacy NFTs)
    // ... lógica para NFTs legacy ...
  }, [chain]);

  // 🚀 REFRESH AUTOMÁTICO (CRÍTICO)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchNFTsFromContract(false); // Refresh a cada 30s
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchNFTsFromContract]);
}
```

### **useAuctionData.ts - DADOS DE AUCTION**
```typescript
export const useAuctionData = (auctionId: string | undefined, options = {}) => {
  // Busca dados específicos do auction
  // Inclui: currentBid, endTime, hasValidBid
  // Usado pelos botões de auction
};
```

---

## 🎯 **LÓGICA DE BOTÕES (CRÍTICA)**

### **Determinação do Estado:**
```typescript
// No MarketplaceCard:
const isOwner = owner && account?.address && 
  owner.toLowerCase() === account.address.toLowerCase();

const isPriceValid = price !== 'Not for sale' && price !== 'N/A' ? 
  isValidPrice(price) : true;

// Dados de auction em tempo real
const displayCurrentBid = isAuction 
  ? (auctionData.hasValidBid ? auctionData.currentBid : currentBid)
  : currentBid;
```

### **Estados Possíveis dos Botões:**
1. **Owner + Listed**: Update Price, Cancel Listing
2. **Owner + Auction**: Cancel Auction
3. **Owner + Not Listed**: List for Sale, Create Auction
4. **Not Owner + Listed**: Buy Now, Make Offer
5. **Not Owner + Auction**: Place Bid, Make Offer
6. **Not Owner + Not Listed**: Make Offer

---

## 🔗 **DETECÇÃO DE OWNERSHIP**

### **Como é determinado:**
```typescript
// 1. Para Legacy NFTs:
const owner = await ownerOf({ contract: nftContract, tokenId: nft.id });

// 2. Para Custom Collections:
owner: nft.owner || nft.minterAddress

// 3. Comparação:
const isOwner = owner?.toLowerCase() === account?.address?.toLowerCase();
```

---

## 🔄 **SINCRONIZAÇÃO COM BLOCKCHAIN**

### **Refresh Automático:**
1. **Legacy NFTs**: Cache de 30s no `thirdweb-production-fix.ts`
2. **Custom Collections**: Refresh de 30s no `useMarketplaceData.ts`
3. **Cache Busting**: `?_t=timestamp` na API

### **APIs de Sincronização:**
1. `/api/marketplace/sync-listings` - Sincroniza listings
2. `/api/marketplace/clear-and-sync` - Limpa e sincroniza tudo
3. `/api/marketplace/force-sync-all` - Força sincronização completa

---

## 🚨 **PONTOS CRÍTICOS PARA PRESERVAR**

### **1. Detecção de Estado:**
- ✅ `isListed` e `isAuction` DEVEM funcionar
- ✅ `listingId` e `auctionId` DEVEM ser corretos
- ✅ Verificação dupla (MongoDB + Thirdweb)

### **2. Ownership Detection:**
- ✅ `isOwner` DEVE detectar corretamente
- ✅ Comparação de endereços (lowercase)

### **3. Refresh Automático:**
- ✅ Dados DEVEM atualizar automaticamente
- ✅ Sem quebrar UX (loading states)

### **4. Componentes de Trading:**
- ✅ Todos os modais DEVEM funcionar
- ✅ Botões DEVEM chamar as funções corretas
- ✅ Estados DEVEM mudar após ações

---

## 📝 **PRÓXIMOS PASSOS**

### **Para implementar Collection Pages:**
1. **Preservar**: Toda esta lógica nos componentes
2. **Mover**: Lógica de trading para páginas de collection
3. **Modificar**: Marketplace para mostrar apenas collection overview
4. **Garantir**: Que ownership detection funciona nas páginas individuais

### **Teste de Verificação:**
Após implementação, DEVE funcionar:
- ✅ Buy/Sell na página da collection
- ✅ Create/Cancel auctions na página da collection  
- ✅ Update prices na página da collection
- ✅ Detecção automática de ownership
- ✅ Refresh automático de estados

---

**⚠️ IMPORTANTE**: Este backup contém TODA a lógica funcionando. Se algo quebrar, volte para este estado!