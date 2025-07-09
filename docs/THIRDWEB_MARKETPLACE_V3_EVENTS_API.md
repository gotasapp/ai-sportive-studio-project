# 🏪 THIRDWEB MARKETPLACE V3 - EVENTOS E APIS OFICIAIS

## 📋 **EVENTOS DO MARKETPLACE V3**

### 🎯 **NewListing Event**

O evento `NewListing` é disparado quando um NFT é listado no marketplace.

#### **Estrutura do Evento:**
```typescript
function newListingEvent(
  filters: Partial,
): PreparedEvent<{
  readonly inputs: readonly [
    {
      readonly indexed: true;
      readonly name: "listingCreator";
      readonly type: "address";
    },
    {
      readonly indexed: true;
      readonly name: "listingId";
      readonly type: "uint256";
    },
    {
      readonly indexed: true;
      readonly name: "assetContract";
      readonly type: "address";
    },
    {
      readonly components: readonly [
        { readonly name: "listingId"; readonly type: "uint256" },
        { readonly name: "tokenId"; readonly type: "uint256" },
        { readonly name: "quantity"; readonly type: "uint256" },
        { readonly name: "pricePerToken"; readonly type: "uint256" },
        { readonly name: "startTimestamp"; readonly type: "uint128" },
        { readonly name: "endTimestamp"; readonly type: "uint128" },
        { readonly name: "listingCreator"; readonly type: "address" },
        { readonly name: "assetContract"; readonly type: "address" },
        { readonly name: "currency"; readonly type: "address" },
        { readonly name: "tokenType"; readonly type: "uint8" },
        { readonly name: "status"; readonly type: "uint8" },
        { readonly name: "reserved"; readonly type: "bool" },
      ];
      readonly name: "listing";
      readonly type: "tuple";
    },
  ];
  readonly name: "NewListing";
  readonly type: "event";
}>;
```

#### **Exemplo de Uso:**
```typescript
import { getContractEvents } from "thirdweb";
import { newListingEvent } from "thirdweb/extensions/marketplace";

const events = await getContractEvents({
  contract,
  events: [
    newListingEvent({
      listingCreator: "0x...",
      listingId: 1n,
      assetContract: "0x...",
    })
  ],
});
```

### 🏆 **NewAuction Event**

O evento `NewAuction` é disparado quando um leilão é criado no marketplace.

#### **Estrutura do Evento:**
```typescript
function newAuctionEvent(
  filters: Partial,
): PreparedEvent<{
  readonly inputs: readonly [
    {
      readonly indexed: true;
      readonly name: "auctionCreator";
      readonly type: "address";
    },
    {
      readonly indexed: true;
      readonly name: "auctionId";
      readonly type: "uint256";
    },
    {
      readonly indexed: true;
      readonly name: "assetContract";
      readonly type: "address";
    },
    {
      readonly components: readonly [
        { readonly name: "auctionId"; readonly type: "uint256" },
        { readonly name: "tokenId"; readonly type: "uint256" },
        { readonly name: "quantity"; readonly type: "uint256" },
        { readonly name: "minimumBidAmount"; readonly type: "uint256" },
        { readonly name: "buyoutBidAmount"; readonly type: "uint256" },
        { readonly name: "timeBufferInSeconds"; readonly type: "uint64" },
        { readonly name: "bidBufferBps"; readonly type: "uint64" },
        { readonly name: "startTimestamp"; readonly type: "uint64" },
        { readonly name: "endTimestamp"; readonly type: "uint64" },
        { readonly name: "auctionCreator"; readonly type: "address" },
        { readonly name: "assetContract"; readonly type: "address" },
        { readonly name: "currency"; readonly type: "address" },
        { readonly name: "tokenType"; readonly type: "uint8" },
        { readonly name: "status"; readonly type: "uint8" },
      ];
      readonly name: "auction";
      readonly type: "tuple";
    },
  ];
  readonly name: "NewAuction";
  readonly type: "event";
}>;
```

#### **Exemplo de Uso:**
```typescript
import { getContractEvents } from "thirdweb";
import { newAuctionEvent } from "thirdweb/extensions/marketplace";

const events = await getContractEvents({
  contract,
  events: [
    newAuctionEvent({
      auctionCreator: "0x...",
      auctionId: 1n,
      assetContract: "0x...",
    })
  ],
});
```

## 💰 **APIS DE COMPRA E VENDA**

### 🛒 **BuyDirectListingButton**

Componente React para comprar NFTs diretamente de uma listagem.

#### **Características:**
- Usa o contrato Marketplace V3 da Thirdweb
- Prepara transação usando extensão `buyFromListing`
- Passa transação para `<TransactionButton />`
- Aceita todas as props do `TransactionButton`

#### **Exemplo de Uso:**
```tsx
import { BuyDirectListingButton } from "thirdweb/react";

<BuyDirectListingButton
  contractAddress="0x..." // endereço do marketplace v3
  chain={...} // chain onde o marketplace está deployado
  client={...} // cliente thirdweb
  listingId={100n} // ID da listagem que você quer comprar
  quantity={1n} // opcional - quantidade a comprar
>
  Buy NFT
</BuyDirectListingButton>
```

#### **Props:**
```typescript
type BuyDirectListingButtonProps = Omit<TransactionButtonProps, "transaction"> & {
  chain: Chain;
  client: ThirdwebClient;
  contractAddress: string;
  listingId: bigint;
  quantity?: bigint;
};
```

### 💳 **buyFromListing Function**

Função para comprar uma listagem do marketplace programaticamente.

#### **Características:**
- Compatível com Pay (erc20Value é automaticamente definido)
- Retorna transação preparada
- Requer aprovação prévia se usando ERC20

#### **Exemplo de Uso:**
```typescript
import { buyFromListing } from "thirdweb/extensions/marketplace";
import { sendTransaction } from "thirdweb";

const transaction = buyFromListing({
  contract,
  listingId: 1n,
  quantity: 1n,
  recipient: "0x...",
});

await sendTransaction({ transaction, account });
```

#### **Parâmetros:**
```typescript
type BuyFromListingParams = {
  listingId: bigint;
  quantity: bigint;
  recipient: string;
};
```

## 🏪 **TIPOS DE LISTAGENS**

### 📋 **Direct Listings**

**Características:**
- **Baixo compromisso, alta frequência**
- NFT permanece na carteira do vendedor
- Apenas aprovação necessária (não escrow)
- Pode listar em múltiplos marketplaces simultaneamente
- Compradores podem fazer ofertas abaixo do preço
- Ofertas podem ser canceladas a qualquer momento

**Fluxo:**
1. Vendedor lista NFT com preço fixo
2. Marketplace recebe aprovação para transferir NFT
3. Comprador paga preço pedido = NFT é transferido
4. Ofertas abaixo do preço podem ser aceitas pelo vendedor

### 🏆 **Auction Listings**

**Características:**
- **Alto compromisso, baixa frequência**
- NFT é transferido para escrow no marketplace
- Lance mais alto é mantido em escrow
- Lances não podem ser retirados
- Função `closeAuction` deve ser chamada 2x (comprador + vendedor)

**Fluxo:**
1. Vendedor lista NFT para leilão com preço mínimo
2. NFT é transferido para o contrato marketplace
3. Licitantes fazem lances (devem ser maiores que o anterior)
4. Valores dos lances ficam em escrow
5. Ao final: `closeAuction` para comprador e vendedor

## 🔑 **IDENTIFICAÇÃO DE NFTS NO MARKETPLACE**

### **Sistema de IDs:**
```typescript
// Estrutura de identificação única:
{
  assetContract: "0xfF973a4aFc5A96DEc81366461A461824c4f80254", // Contrato NFT
  tokenId: "15",                                              // Token ID da blockchain  
  listingId: "0",                                            // ID da listagem no marketplace
  auctionId: "1"                                             // ID do leilão (se aplicável)
}
```

### **Campos Importantes:**
- **tokenId**: ID sequencial na blockchain (0, 1, 2, 3... 15)
- **listingId**: ID sequencial no marketplace (0, 1, 2, 3...)
- **auctionId**: ID sequencial para leilões (0, 1, 2, 3...)

## 🎯 **PRÓXIMOS PASSOS PARA IMPLEMENTAÇÃO**

### 1. **Descobrir TokenId Real**
- Usar eventos `Transfer` da transação de mint
- Usar `getAllValidListings` para NFTs já listados
- Usar `ownerOf` para verificar propriedade

### 2. **Implementar Listagem**
- Capturar evento `NewListing` quando NFT é listado
- Salvar `listingId` e `tokenId` no MongoDB
- Atualizar status para `isListed: true`

### 3. **Implementar Compra**
- Usar `BuyDirectListingButton` ou `buyFromListing`
- Monitorar transação de compra
- Atualizar propriedade no MongoDB

### 4. **Implementar Leilão**
- Capturar evento `NewAuction`
- Monitorar lances e status
- Implementar `closeAuction` ao final

### 5. **Sincronização**
- API para sincronizar listings reais com MongoDB
- Verificar status on-chain vs banco de dados
- Atualizar dados desatualizados automaticamente

---

**🔥 ESTA DOCUMENTAÇÃO É A BASE PARA CORRIGIR TODOS OS PROBLEMAS DO MARKETPLACE! 🔥** 